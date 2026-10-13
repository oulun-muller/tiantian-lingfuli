<template>
  <Dialog class="virtual-award" :visible="visible" title="恭喜您中奖了" @close="clickClose">
    <div class="virtual-content">
      <div class="image" :style="{ backgroundImage: `url(${info.imgUrl})` }"/>
      <p class="text">恭喜您获得“{{ info.name }}”</p>
      <p class="intro">{{ info.prizeDesc.instruction }}</p>
      <div class="code-wrap">
        <span>{{ info.prizeDesc.code }}</span>
        <span class="copy-icon" tabindex="0" role="button" aria-label="复制兑换码" @click="copyCode" @keydown.enter.prevent.stop="copyCode" @keydown.space.prevent.stop="copyCode"/>
      </div>
    </div>
  </Dialog>
</template>
<script>
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
    isNotNeedClickReport: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fromChannel: this.$route.query?.fromChannelName || ''
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    activityName() {
      return this.getActivityName() || this.allData?.prizeDrawActivityName
    },
    newActivityId() {
      return this.activityId || this.allData?.prizeDrawActivityId
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    channelInfo() {
      return this.$store.state.channelInfo
    }
  },
  methods: {
    copyCode() {
      this.$copyText(String(this.info.prizeDesc.code)).then(
        this.$successMessage('复制成功!')
      )
      if (this.source === 'lottery') {
        this.reportBtnClick('复制')
      } else {
        this.reportTaskCardClick('复制')
      }
    },
    clickClose() {
      this.$emit('close')
      if (this.source === 'lottery') {
        this.reportBtnClick('关闭')
      } else {
        this.reportTaskCardClick('关闭')
      }
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
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isPreOrder: this.getReportIsPreOrder(),
            url: this.getReportUrl()
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
    }
  }
}
</script>
<style lang="scss" scoped>
.virtual-content {
  text-align: center;
  .image {
    width: 300px;
    height: 178px;
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
  .intro {
    margin-top: 10px;
    margin-bottom: 10px;
    margin-left: 30px;
    font-weight: 400;
    font-size: 10px;
    line-height: 18px;
    text-align: left;
    color: #949ea4;
    white-space: pre-wrap;
    max-height: 80px;
    overflow-y: scroll;
  }
  .code-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid #3f4449;
    width: calc(100% - 40px);
    padding: 9px 12px;
    color: #EAF7FF;
    font-size: 14px;
    margin-bottom: 50px;
    .copy-icon {
      cursor: pointer;
      display: inline-block;
      width: 24px;
      height: 24px;
      background: transparent url('~@/images/Index/copy-icon.png') no-repeat center center/ contain;
    }
  }
}

</style>

<style scoped>
.virtual-content .code-wrap .copy-icon:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .virtual-content .code-wrap .copy-icon:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
