<template>
  <Dialog class="third-award" :visible="visible" title="恭喜您中奖了" @close="clickClose">
    <div class="third-content">
      <div class="image" :style="{ backgroundImage: `url(${info.imgUrl})` }"/>
      <p class="text">恭喜您获得“{{ info.name }}”</p>
      <p class="info-text">{{ info.prizeDesc && info.prizeDesc.instruction }}</p>
      <template v-if="(info.notifyResult === 0 || info.notifyResult === 3)">
        <template v-if="btnHide">
          <div>活动结束</div>
        </template>
        <template v-else>
          <div v-if="isNeedBindAccount" class="common-rect-btn" tabindex="0" role="button" aria-label="绑定角色领取奖励" @click="gotoBindRole" @keydown.enter.prevent.stop="gotoBindRole" @keydown.space.prevent.stop="gotoBindRole">绑定角色领取奖励</div>
          <div v-else-if="isNeedBindQQ" class="common-rect-btn" tabindex="0" role="button" aria-label="兑换Q币" @click="gotoWriteQQ" @keydown.enter.prevent.stop="gotoWriteQQ" @keydown.space.prevent.stop="gotoWriteQQ">兑换Q币</div>
        </template>
      </template>
    </div>
  </Dialog>
</template>
<script>
import { getBindThirdUrl } from '@/api/activity'
import { getSupportThirdApp, openThirdApp } from '@/nativeApiPad/common.js'
import { sendThirdUrl } from './messageHelper'
export default {
  inject: {
    activityId: {
      default: null
    },
    getActivityName: {
      default: () => () => null
    },
    getReportChannel: {
      default: () => () => 'LegionZone'
    },
    getReportIsPreOrder: {
      default: () => () => 'no'
    },
    getReportUrl: {
      default: () => () => ''
    }
  },
  props: {
    allData: {
      type: Object,
      default: () => ({})
    },
    taskName: {
      type: String,
      default: ''

    },
    taskId: {
      type: [Number, String],
      default: ''
    },
    source: {
      type: String,
      default: ''
    },
    lotteryType: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    },
    info: {
      type: Object,
      default: () => ({})
    },
    popType: {
      type: String,
      default: 'add'
    },
    baseInfo: {
      default: null,
      type: Object
    },
    isNotNeedClickReport: {
      type: Boolean,
      default: false
    },
    btnHide: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      fromChannel: this.$route.query?.fromChannelName || ''
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    activityName() {
      return this.getActivityName() || this.allData?.prizeDrawActivityName
    },
    newActivityId() {
      return this.activityId || this.allData?.prizeDrawActivityId
    },
    isNeedBindAccount() {
      return !!this.info?.notifyConds?.filter(item => item.code === 1).length
    },
    isNeedBindQQ() {
      return !!this.info?.notifyConds?.filter(item => item.code === 2).length
    },
    needBindQQObj() {
      const errObj = this.info?.notifyConds?.filter(item => item.code === 2)
      return errObj && errObj[0]
    },
    channelUserInfo() {
      return this.$store.state.channelInfo.channelUserInfo
    },
    isApp() {
      return !!this.$store.state.system.version
    }
  },
  methods: {
    gotoBindRole() {
      this.getThirdUrl()
      if (this.source === 'taskCard') {
        this.reportTaskCardClick('绑定角色领取奖励')
      } else {
        this[this.isApp ? '$dataReport' : '$trackEvent'](
          'LZ_gamingCenter',
          'LZ_storeEventsBindRolesButtonClick',
          'click',
          {
            channel: this.fromChannel || 'LegionZone',
            uuid: this.channelUserInfo?.uuid || null
          }
        )
      }
    },
    gotoWriteQQ() {
      this.getThirdUrl('qqCoinDeliver')
      if (this.source === 'taskCard') {
        this.reportTaskCardClick('兑换Q币')
      }
    },
    getThirdUrl(type = null) {
      let avatar, nickName, redirectUrl
      if (this.fromChannel) {
        avatar = this.channelUserInfo?.avatar
        nickName = this.channelUserInfo?.nickName
        redirectUrl = window.location.href
      } else {
        avatar = this.user?.avatar?.avatar
        nickName = this.user?.avatar?.nickName
        redirectUrl = `lenovo-legionzone:#/gamecenter/online/index?id=${this.newActivityId}&source=browser&t=${Date.now()}`
      }
      const { actId, gameId, privacyAuthScene, needPrivacyAuth } = this.baseInfo?.liveLinkRelate || {}
      getBindThirdUrl({
        fromId: this.newActivityId,
        actId,
        gameIdList: gameId,
        faceUrl: avatar,
        nickName,
        redirectUrl,
        type,
        nextFlow: this.needBindQQObj?.nextFlow || null,
        gameAuthScene: needPrivacyAuth ? privacyAuthScene : null
      }).then(res => {
        if (this.fromChannel) {
          sendThirdUrl({
            url: res.bindUrl,
            fromChannel: true,
            fallback: () => {
              if (this.$isPadDevice) {
                getSupportThirdApp().then(res => {
                  if (res) {
                    openThirdApp(res.path)
                  } else {
                    window.open(res.bindUrl, '_blank')
                  }
                })
              }
              window.open(res.bindUrl, '_blank')
            }
          })
        } else {
          if (this.$isPadDevice) {
            getSupportThirdApp().then(res => {
              if (res) {
                openThirdApp(res.path)
              } else {
                window.open(res.bindUrl, '_blank')
              }
            })
          }
          window.open(res.bindUrl, '_blank')
        }
        this.clickClose()
      })
    },
    clickClose() {
      this.$emit('close')
      if (this.source === 'lottery') {
        this.reportBtnClick('关闭')
      } else if (this.source === 'taskCard') {
        this.reportTaskCardClick('关闭')
      }
    },
    writeContact() {
      if (this.source === 'lottery') {
        this.reportBtnClick(this.popType === 'add' ? '填写联系方式' : '查看联系方式')
      }
    },
    reportBtnClick(text) {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsLotteryWinPopupClick',
        'click',
        {
detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.newActivityId,
            prizeType: this.info.type,
            prizeName: this.info.name,
            prizeid: this.info.id,
            clickbutton: text,
            lotteryType: this.lotteryType,
            lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isPreOrder: this.getReportIsPreOrder(),
            url: this.getReportUrl()
          }),
          uuid: this.channelUserInfo?.uuid || null
        }
      )
    },
    reportTaskCardClick(text) {
      if (this.isNotNeedClickReport) {
        return
      }
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeEventsTaskModClaimRewardButtonClick',
        'click',
        {
          detail: JSON.stringify({
            activityName: this.activityName,
            activityid: this.newActivityId,
            prizeType: this.info?.type,
            prizeName: this.info?.name,
            prizeid: this.info?.id,
            clickbutton: text,
            lenovoid: this.userInfo?.UserID || this.channelUserInfo?.UserId,
            taskName: this.taskName,
            taskid: this.taskId,
            channel: this.fromChannel || 'LegionZone'
          }),
          uuid: this.channelUserInfo?.uuid || null
        }
      )
    }
  }
}
</script>
<style lang="scss" scoped>
.third-content {
  text-align: center;
  padding-bottom: 50px;
  .common-rect-btn {
    width: auto;
    padding: 0 18px;
  }
  .image {
    width: 300px;
    height: 180px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    display: inline-block;
    margin-top: 30px;
    .copy-icon {
      display: inline-block;
      width: 8px;
      height: 8px;
    }
  }
  .text {
    color: #EAF7FF;
    font-size: 16px;
    font-weight: 400;
    margin-top: 24px;
  }
  .info-text {
    margin: 12px auto 40px auto;
    white-space: pre-wrap;
    padding: 0 30px;
    text-align: left;
    color: rgb(234 247 255 / 60%);
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
    max-height: 80px;
    overflow-y: scroll;
  }
  .btn-wrap {
    width: 120px;
    height: 36px;
    text-align: center;
    color: #000;
  }
}

</style>

<style scoped>
.third-content .common-rect-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .third-content .common-rect-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
