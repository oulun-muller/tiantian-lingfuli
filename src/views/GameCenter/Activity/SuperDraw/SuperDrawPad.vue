<template>
  <div>
    <section class="SuperDraw">
      <h1 class="title"><span>超值抽奖</span></h1>
      <div class="wrapper">
        <ul class="draw-list">
          <li v-for="index in 9" :key="index" :awardId="getDrawItem(index).id" :class="[index === 5 ? 'draw-wrap' : '', index === animateIndex ? 'animate' : '']">
            <template v-if="index === 5">
              <div class="draw-bac" tabindex="0" role="button" aria-label="立即抽奖" @click="clickDraw" @keydown.enter.prevent.stop="clickDraw" @keydown.space.prevent.stop="clickDraw" :style="{ backgroundImage: `url(${drawImage})` }">
                <span class="text">还剩：<em :class="[prizeDraw.validStatus!==1?'grey-text':'']">{{ drawCountNum }}</em>次</span>
              </div>
            </template>
            <template v-else>
              <div class="award" :style="{ backgroundImage: `url(${getDrawItem(index).imgUrl})` }"/>
              <p class="award-name">{{ getDrawItem(index).name }}</p>
            </template>
          </li>
        </ul>
      </div>
      <AwardList v-if="showAwardList" :visible="showAwardList" :all-prize-ids="allPrizeIds" :activity-id="prizeDraw.id" :base-info="baseInfo" @close="showAwardList=false"/>
      <VirtualAward v-if="showVirtualAward" source="lottery" :visible="showVirtualAward" @close="showVirtualAward=false" :info="info"/>
      <PhysicalAward v-if="showPhysicalAward" source="lottery" :visible="showPhysicalAward" @close="showPhysicalAward=false" :info="info" @writeContact="showContactDialog=true"/>
      <ThirdAward v-if="showThirdAward" source="lottery" :visible="showThirdAward" :base-info="baseInfo" @close="showThirdAward=false" :info="info"/>
      <ContactPop v-if="showContactDialog" source="lottery" pop-type="add" :draw-id="drawId" :visible="showContactDialog" @close="closePhysicalPop"/>
      <OpenAppDialog v-if="showOpenAppDialog" :visible="showOpenAppDialog" @close="showOpenAppDialog=false"/>
    </section>
    <dl class="task-list-pad">
      <dt class="title">完成任务获取抽奖次数</dt>
      <section class="task-wrap">
        <TaskItemOld
          v-for="(item, index) in prizeDraw.taskInfo"
          :key="index"
          :item="item"
          :prize-draw="prizeDraw"
          :first-local="String(firstLocal)"
          :second-local="String(secondLocal)"
          :third-local="String(thirdLocal)"
          :plate-name-report="plateNameReport"
          :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish"
          @scroll-to-purchase="$emit('scroll-to-purchase', $event)"
          @toLenovoLogin="$emit('toLenovoLogin')"
          @updateTaskStatus="updateTaskStatus(status, index)"
          @showOpenAppDialog="status => showOpenAppDialog=status"
          @updateDrawCount="num => drawCountNum = num"
          @refreshPage="$emit('refreshPage')"/>
      </section>
    </dl>
  </div>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import AwardList from '../common/AwardList.vue'
import VirtualAward from '../common/VirtualAward.vue'
import PhysicalAward from '../common/PhysicalAward.vue'
import ThirdAward from '../common/ThirdAward.vue'
import ContactPop from '../common/ContactPop.vue'
import OpenAppDialog from '../../common/OpenAppDialog.vue'
import TaskItemOld from './TaskItemOld.vue'
import { drawLottery } from '@/api/activity'
import { getUserInfo } from '../common/messageHelper'
export default {
  name: 'SuperDrawPad',
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportIsPreOrder', 'getReportUrl'],
  data() {
    return {
      animateIndex: 0,
      count: 0,
      pool: [1, 2, 3, 6, 9, 8, 7, 4],
      timer: null,
      showAwardList: false,
      showVirtualAward: false,
      showPhysicalAward: false,
      showContactDialog: false,
      showOpenAppDialog: false,
      showThirdAward: false,
      info: null,
      drawId: null,
      drawCountNum: 0,
      taskList: [],
      drawing: false,
      fromChannel: this.$route.query?.fromChannelName || ''
    }
  },
  props: {
    allPrizeIds: {
      default: null,
      type: Array
    },
    prizeDraw: {
      default: null,
      type: Object
    },
    baseInfo: {
      default: null,
      type: Object
    },
    firstLocal: {
      default: '',
      type: String
    },
    secondLocal: {
      default: '',
      type: String
    },
    thirdLocal: {
      default: '',
      type: String
    },
    plateNameReport: {
      default: '',
      type: String
    },
    // 预购页标记：点击购买任务时定位到立即购买区域。
    scrollToPurchaseOnFinish: {
      default: false,
      type: Boolean
    }
  },
  computed: {
    channelUserInfo() {
      return this.$store.state.channelInfo.channelUserInfo
    },
    activityName() {
      return this.getActivityName()
    },
    lotteryType() {
      return ''
    },
    drawImage() {
      switch (this.prizeDraw.validStatus) {
        case 0:
          return resolveAsset('images/Index/activity-prepare.png')
        case 1:
          return this.baseInfo?.prizeDrawBtnImgUrl || resolveAsset('images/Index/draw-bac.png')
        case 2:
          return resolveAsset('images/Index/activity-end.png')
        default:
          return resolveAsset('images/Index/draw-bac.png')
      }
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    system() {
      return this.$store.state.system
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    awardList() {
      return this.prizeDraw.prizeInfo || []
    }
  },
  components: {
    AwardList,
    VirtualAward,
    PhysicalAward,
    ThirdAward,
    ContactPop,
    OpenAppDialog,
    TaskItemOld
  },
  methods: {
    closePhysicalPop() {
      this.showContactDialog = false
      this.showPhysicalAward = false
    },
    getLotteryResultReportPrizes(res) {
      return [res.prize]
    },
    clickDraw() {
      // 预购页允许浏览器直接参与抽奖；普通活动仍保持原有打开客户端提示。
      const isPreorder = String(this.baseInfo?.bannerTemplateType) === '3'
      if (!this.isApp && !this.fromChannel && !isPreorder) {
        window.location.href = `lenovo-legionzone:#/gamecenter/online/index?id=${this.$route.query.id}&source=browser`
        this.showOpenAppDialog = true
        return
      }
      if (this.drawing) {
        this.$warningMessage('正在抽奖中，请稍后再试！')
        return
      }
      if (this.prizeDraw.status === 0) {
        this.$warningMessage('抽奖活动已下线！')
        return
      }
      if (this.prizeDraw.validStatus !== 1) return
      if (this.fromChannel) {
        if (!this.channelUserInfo?.Token) {
          getUserInfo({
            showLoginPop: true,
            fromChannel: true
          })
          return
        }
      } else if (!this.userInfo) {
        if (this.isApp) {
          this.$login()
        } else {
          // 浏览器环境跳转联想通行证登录
          this.toLenovoLogin()
        }
        return
      }
      if (this.drawCountNum < 1) {
        this.$errorMessage('抽奖次数不足！')
        return
      }
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsLotteryButtonClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.activityId,
            lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isPreOrder: this.getReportIsPreOrder(),
            url: this.getReportUrl(),
            lotteryType: this.lotteryType
          }),
          uuid: this.channelUserInfo?.uuid || null
        }
      )
      this.drawing = true
      drawLottery({
        sn: this.system?.MTMInfo?.MachineName || '',
        activityPageId: Number(this.activityId),
        deviceId: this.fromChannel ? this.channelUserInfo?.MAC : this.system?.mac,
        prizeDrawActivityId: this.prizeDraw?.id,
        channel: this.fromChannel || 'LegionZone'
      }).then(res => {
        this.startPlay()
        this.drawSuccess(res)
        const reportPrizes = this.getLotteryResultReportPrizes(res)
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsLotteryResults',
          'pv',
          {
            detail: JSON.stringify({
              activityName: this.activityName,
              activityid: this.activityId,
              prizeName: reportPrizes.map(item => item.name).join(','),
              prizeid: reportPrizes.map(item => item.id).join(','),
              results: 1,
              lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
              channel: this.getReportChannel(),
              isPreOrder: this.getReportIsPreOrder(),
              url: this.getReportUrl(),
              lotteryType: this.lotteryType
            }),
            uuid: this.channelUserInfo?.uuid || null
          }
        )
      }).catch(err => {
        this.drawError(err)
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsLotteryResults',
          'pv',
          {
            detail: JSON.stringify({
              activityName: this.activityName,
              activityid: this.activityId,
              results: 2,
              error: err.message,
              lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
              channel: this.getReportChannel(),
              isPreOrder: this.getReportIsPreOrder(),
              url: this.getReportUrl(),
              lotteryType: this.lotteryType
            }),
            uuid: this.channelUserInfo?.uuid || null
          }
        )
      })
    },
    toLenovoLogin() {
      this.$emit('toLenovoLogin')
    },
    drawSuccess(res) {
      this.drawCountNum = res.availableDrawCount
      this.drawId = res.drawId
      this.info = res.prize
      if (this.delayTimer) clearTimeout(this.delayTimer)
      this.delayTimer = setTimeout(() => {
        const awardIndex = this.awardList.findIndex(item => item.id === res?.prize?.id)
        if (awardIndex === -1) {
          this.animateIndex = -1
          this.$errorMessage('抽奖失败，请重试！')
          this.clearTimer()
          return
        }
        this.startPlay(120, awardIndex)
      }, 3000)
    },
    drawError(res) {
      this.$warningMessage(res.message || '请稍后再试！')
      if (res.code === 4) {
        // 如果没绑定手机号
        this.$lzbindphone().then(res => {
          this.$emit('refreshPage')
        })
      }
      this.drawing = false
      this.clearTimer()
    },
    startPlay(clockDuration = 60, awardIndex = -1) {
      if (this.timer) clearInterval(this.timer)
      this.count = this.count || 0
      this.timer = setInterval(() => {
        this.animateIndex = this.pool[this.count]
        if (this.count >= this.pool.length - 1) {
          this.count = 0
        } else {
          this.count++
        }
        if (awardIndex !== -1) {
          // 滚动到中奖位置
          const cur = awardIndex > 3 ? awardIndex + 2 : awardIndex + 1
          if (this.animateIndex === cur) {
            // 滚到后结束抽奖
            clearInterval(this.timer)
            if (this.popTimer) clearTimeout(this.popTimer)
            this.popTimer = setTimeout(() => {
              // 暂停1s弹出结果
              this.popAward()
              this.count = 0
              this.animateIndex = -1
              this.drawing = false
            }, 2000)
          }
        }
      }, clockDuration)
    },
    clearTimer() {
      if (this.timer) clearInterval(this.timer)
      if (this.delayTimer) clearTimeout(this.delayTimer)
      if (this.popTimer) clearTimeout(this.popTimer)
    },
    popAward() {
      switch (this.info.type) {
        case 1:
          this.$successMessage('谢谢参与！')
          // 未中奖（type=1）不弹中奖弹窗，不上报中奖弹窗曝光
          return
        case 2:
          this.showVirtualAward = true
          break
        case 3:
          this.showPhysicalAward = true
          break
        case 4:
          this.showThirdAward = true
          break
        default:
          return
      }
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsLotteryWinPopupShow',
        'pv',
        {
          detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.activityId,
            prizeType: this.info.type,
            prizeName: this.info.name,
            prizeid: this.info.id,
            lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isPreOrder: this.getReportIsPreOrder(),
            url: this.getReportUrl(),
            lotteryType: this.lotteryType
          }),
          uuid: this.channelUserInfo?.uuid || null
        }
      )
    },
    getDrawItem(index) {
      const cindex = index >= 6 ? index - 2 : index - 1
      return this.awardList[cindex]
    },
    refresh() {
      this.$nextTick(() => {
        this.drawCountNum = this.prizeDraw.availableDrawCount
      })
    }
  },
  mounted() {
    this.refresh()
  },
  beforeUnmount() {
    this.clearTimer()
  }
}
</script>
<style lang="scss" scoped>
.SuperDraw {
  position: relative;
  width: 80vw;
  padding: 0 6.75vw;
  max-width: 1200px;
  margin: 60px auto 0 auto;
  &::before {
    content: '';
    position: absolute;
    bottom: -39px;
    left: 0px;
    width: 28px;
    height: 261px;
    background: transparent url('~@/images/Index/border-line.png') no-repeat center center/ contain;
  }
  &::after {
    content: '';
    position: absolute;
    top: 2vw;
    right: 0px;
    width: 28px;
    height: 261px;
    background: transparent url('~@/images/Index/border-line.png') no-repeat center center/ contain;
    transform: rotate(180deg);
  }
  h1.title {
    position: relative;
    text-align: center;
    span {
      display: inline-block;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 2px;
      background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    &::before {
      content: '';
      position: absolute;
      top: -32px;
      background: transparent url('~@/images/Index/super-draw.png') no-repeat center center/ contain;
      width: 253px;
      height: 50px;
      left: 50%;
      transform: translate(-47%, 0);
    }
  }
  .records {
    display: inline-block;
    cursor: pointer;
    color: #EAF7FF;
    margin: 27px 0 13px 0;
    text-decoration: underline;
    font-size: 14px;
    font-weight: 400;
  }
  .wrapper {
    display: flex;
    margin-top: 28px;
    .draw-list {
      display: grid;
      grid-template: repeat(3, 1fr) / repeat(3, 1fr); /* 简写行+列，等比例 */
      gap: 10px;
      background: rgba(59, 58, 58, 0.30);
      aspect-ratio: 1.2/1;
      width: 100%;
      max-width: 100%;
      li {
        border: 0.5px solid rgba(255, 255, 255, 0.40);
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 0 10px 0;
        .award {
          width: 100%;
          height: 100%;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }
        .award-name {
          margin-top: 6px;
          color: rgba(234, 247, 255, 0.80);
          font-size: 14px;
          font-weight: 700;
          text-align: center;
        }
        &.draw-wrap {
          cursor: pointer;
          border: 0 none;
          padding: 0;
        }
        &.animate {
          border: 1px solid #F1DF93;
          background: rgba(59, 58, 58, 0.50);
        }
        .draw-bac {
          width: 100%;
          height: 100%;
          background-size: contain;
          text-align: center;
          padding-top: 88px;
          background-repeat: no-repeat;
          background-position: center;
          position: relative;
          .text {
            color: #000;
            font-size: 14px;
            font-weight: 400;
            font-family: "Microsoft YaHei";
            position: absolute;
            bottom: 26px;
            left: 50%;
            transform: translate(-50%);
            width: 100%;
            em {
              color: #EC0505;
              font-style: normal;
              &.grey-text {
                color: #000;
              }
            }
          }
        }
      }
    }
  }
}
.task-list-pad {
  display: block;
  width: 80vw;
  height: auto;
  margin: 40px auto 0;
  border: 0.5px solid rgba(255, 255, 255, 0.40);
  padding: 18px 0 10px 15px;
  background: rgba(59, 58, 58, 0.30) url('~@/images/Index/task-bac.png') no-repeat center bottom / contain;
  .title {
    background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 22px;
    font-weight: 700;
    line-height: 40px;
    text-align: center;
  }
  .task-wrap {
    max-height: 356px;
    overflow-y: scroll;
    padding-right: 15px;
    &::-webkit-scrollbar-thumb {
      cursor: pointer;
      border-radius: 5px;
      background-color: rgba(80, 91, 110, 0.25);
    }
  }
}

.PhoneDevice{
  .SuperDraw{
    width: calc(100% - 40px);
    padding: 0;
    margin-top: 0px;
    &::before, &::after{
      display: none;
    }
    .wrapper{
      padding: 16px 25px;
      position: relative;
      margin-top: 20px;
      &::before{
        content: '';
        background: url('./images/superDraw_left.svg');
        display: block;
        width: 13px;
        height: 131px;
        background-size: 13px 131px;
        position: absolute;
        bottom: -8px;
        left: 0;
      }
      &::after{
        background: url('./images/superDraw_right.svg');
        display: block;
        width: 13px;
        height: 131px;
        background-size: 13px 131px;
        transform: none;
        content: '';
        position: absolute;
        top: -8px;
        right: 0;
      }
      .draw-list li{
        border: 0.342px solid  rgba(255, 255, 255, 0.40);
        background: rgba(59, 58, 58, 0.20);
        backdrop-filter: blur(15.061929702758789px);
        height: 91px;
       &.animate {
          border: 1px solid #F1DF93;
          background: rgba(59, 58, 58, 0.50);
        }
        .award{
          width: 77px;
          height: 45px;
        }
        p{
          margin-top: 10px;
          color: rgba(234, 247, 255, 0.80);
          font-family: "Microsoft YaHei";
          font-size: 11px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
          text-transform: capitalize;
        }
      }
    }

    h1{
      width: 253px;
      height: 50px;
      background: url('./images/lottery.svg');
      background-size: 253px 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      &::before{
        display: none;
      }
    }
    .draw-bac{
      position: relative;
      .text{
        color: #000;
        font-family: "Microsoft YaHei";
        font-size: 9.585px !important;
        font-style: normal;
        font-weight: 400;
        line-height: 8.9px; /* 92.857% */
        text-transform: capitalize;
        position: absolute;
        bottom: 21px !important;
      }
      .grey-text{
        color: #EC0505 !important;
        font-family: "Microsoft YaHei";
        font-size: 9.585px;
        font-style: normal;
        font-weight: 400;
        line-height: 8.9px;
        text-transform: capitalize;
        display: inline-block;
        margin-right: 1px;
      }
    }
  }
  .task-list-pad{
    margin: 40px 20px 0 20px;
    border: 0.5px solid rgba(255, 255, 255, 0.40);
    background: rgba(59, 58, 58, 0.30);
    backdrop-filter: blur(22px);
    width: calc(100% - 40px);
    padding: 0;
    padding: 18px 24px 45px 24px;
    .title{
      text-shadow: 0 88.826px 71.061px rgba(255, 255, 255, 0.00), 0 19.84px 15.872px rgba(255, 255, 255, 0.00), 0 5.907px 4.726px rgba(255, 255, 255, 0.00);
      font-family: "Microsoft YaHei";
      font-size: 18px;
      font-style: normal;
      font-weight: 700;
      line-height: 40px; /* 222.222% */
      letter-spacing: 2px;
      text-transform: capitalize;
      background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .task-wrap{
      padding: 0;
      &::-webkit-scrollbar {
        display: none;
      }
      dd{
        margin-top: 20px;
        padding: 13px 17px;

        .btn{
          width: 66px;
          height: 26px;
          border: 1px solid rgba(234, 247, 255, 0.50);
          opacity: 0.6;
          background: none !important;
          box-sizing: border-box;
        }
      }
      .task-name{
        color: rgba(234, 247, 255, 0.80);
        font-family: "Microsoft YaHei";
        font-size: 14px;
        font-style: normal;
        font-weight: 700;
        line-height: 16px; /* 114.286% */
        text-transform: capitalize;
      }
      .desc{
        color: rgba(234, 247, 255, 0.80);
        font-family: "Microsoft YaHei";
        font-size: 10px;
        font-style: normal;
        font-weight: 290;
        line-height: 16px;
        text-transform: capitalize;
      }
      .time{
        color: rgba(234, 247, 255, 0.80);
        font-family: "Microsoft YaHei";
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        line-height: 16px; /* 133.333% */
        text-transform: capitalize;
        width: fit-content;
        margin-right: 40px;
      }
      :deep(div.btn){
        width: 66px;
        height: 26px;
        line-height: 23px;
        border: 1px solid rgba(234, 247, 255, 0.50);
        opacity: 0.6;
        background: none;
        box-sizing: border-box;
        text-shadow: 0 140.506px 112.405px rgba(255, 255, 255, 0.00), 0 31.384px 25.107px rgba(255, 255, 255, 0.00), 0 9.344px 7.475px rgba(255, 255, 255, 0.00);
        font-family: "Microsoft YaHei";
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        text-transform: capitalize;
        background: linear-gradient(180deg, #929292 20.83%, #EAF7FF 91.67%);
        background-clip: text !important;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      :deep(div.GameDownloadButton){
        width: 66px;
        height: 26px;
        border: 1px solid rgba(234, 247, 255, 0.50);
        opacity: 0.6;
        background: none;
        box-sizing: border-box;
        button{
          background: none;
          .grey-rect-btn{
            border: none;
          }
          i{
              transform: translateY(-2px);
              text-shadow: 0 140.506px 112.405px rgba(255, 255, 255, 0.00), 0 31.384px 25.107px rgba(255, 255, 255, 0.00), 0 9.344px 7.475px rgba(255, 255, 255, 0.00);
              font-family: "Microsoft YaHei";
              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: 12px; /* 100% */
              text-transform: capitalize;
              background: linear-gradient(180deg, #929292 20.83%, #EAF7FF 91.67%);
              background-clip: text !important;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
          }
        }
      }
    }
   }

}
</style>
<style scoped>
.SuperDraw .draw-bac:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .SuperDraw .draw-bac:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
