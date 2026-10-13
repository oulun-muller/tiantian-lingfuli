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
        <div class="line"/>
        <component
          :is="taskListComponent"
          :prize-draw="prizeDraw"
          :first-local="String(firstLocal)"
          :second-local="String(secondLocal)"
          :third-local="String(thirdLocal)"
          :plate-name-report="plateNameReport"
          :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish"
          @scroll-to-purchase="$emit('scroll-to-purchase', $event)"
          @toLenovoLogin="$emit('toLenovoLogin')"
          @showOpenAppDialog="status => showOpenAppDialog=status"
          @updateDrawCount="num => drawCountNum = num"
          @refreshPage="$emit('refreshPage')"/>
      </div>
      <AwardList v-if="showAwardList" :visible="showAwardList" :all-prize-ids="allPrizeIds" :activity-id="prizeDraw.id" :base-info="baseInfo" @close="showAwardList=false"/>
      <VirtualAward v-if="showVirtualAward" source="lottery" :visible="showVirtualAward" @close="showVirtualAward=false" :info="info"/>
      <PhysicalAward v-if="showPhysicalAward" source="lottery" :visible="showPhysicalAward" @close="showPhysicalAward=false" :info="info" @writeContact="showContactDialog=true"/>
      <ThirdAward v-if="showThirdAward" source="lottery" :visible="showThirdAward" :base-info="baseInfo" @close="showThirdAward=false" :info="info"/>
      <ContactPop v-if="showContactDialog" source="lottery" pop-type="add" :draw-id="drawId" :visible="showContactDialog" @close="closePhysicalPop"/>
      <OpenAppDialog v-if="showOpenAppDialog" :visible="showOpenAppDialog" @close="showOpenAppDialog=false"/>
    </section>
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
import TaskListOld from './TaskListOld.vue'
import TaskListNew from './TaskListNew.vue'
import { drawLottery } from '@/api/activity'
import { getUserInfo } from '../common/messageHelper'

const TASK_LIST_MAP = {
  '1': TaskListOld,
  '2': TaskListNew
}
export default {
  name: 'SuperDrawPc',
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
    taskModuleTemplateType: {
      default: '1',
      type: String
    },
    scrollToPurchaseOnFinish: { type: Boolean, default: false }
  },
  computed: {
    channelUserInfo() {
      return this.$store.state.channelInfo.channelUserInfo
    },
    activityName() {
      return this.getActivityName()
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
    },
    taskListComponent() {
      return TASK_LIST_MAP[this.taskModuleTemplateType ] || TaskListOld
    }
  },
  components: {
    AwardList,
    VirtualAward,
    PhysicalAward,
    ThirdAward,
    ContactPop,
    OpenAppDialog,
    TaskListOld,
    TaskListNew
  },
  methods: {
    closePhysicalPop() {
      this.showContactDialog = false
      this.showPhysicalAward = false
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
            url: this.getReportUrl()
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
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsLotteryResults',
          'pv',
          {
            detail: JSON.stringify({
              activityName: this.activityName,
              activityid: this.activityId,
              prizeName: res.prize.name,
              prizeid: res.prize.id,
              results: 1,
              lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
              channel: this.getReportChannel(),
              isPreOrder: this.getReportIsPreOrder(),
              url: this.getReportUrl()
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
              url: this.getReportUrl()
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
            url: this.getReportUrl()
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
  padding: 0 40px;
  max-width: 1200px;
  margin: 30px auto 0 auto;
  &::before {
    content: '';
    position: absolute;
    bottom: -39px;
    left: 20px;
    width: 28px;
    height: 261px;
    background: transparent url('~@/images/Index/border-line.png') no-repeat center center/ contain;
  }
  &::after {
    content: '';
    position: absolute;
    top: 2vw;
    right: 20px;
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
      width: 44.2vw;
      max-width: 550px;
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
    .line {
      margin: 0 8px;
      width: 1px;
      height: 49.5vw;
      max-height: 458px;
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
