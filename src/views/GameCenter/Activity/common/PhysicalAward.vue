<template>
  <Dialog class="physical-award" :visible="visible" title="恭喜您中奖了" @close="clickClose">
    <div class="physical-content">
      <div class="image" :style="{ backgroundImage: `url(${info.imgUrl})` }"/>
      <p class="text">恭喜您获得“{{ info.name }}”</p>
      <div class="common-rect-btn address-btn" tabindex="0" role="button" :aria-label="popType==='add' ? '填写联系方式' : '查看联系方式'" @click="writeContact" @keydown.enter.prevent.stop="writeContact" @keydown.space.prevent.stop="writeContact">{{ popType==='add' ? '填写': '查看' }}联系方式</div>
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
    popType: {
      type: String,
      default: 'add'
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
    clickClose() {
      this.$emit('close')
      if (this.source === 'lottery') {
        this.reportBtnClick('关闭')
      } else {
        this.reportTaskCardClick('关闭')
      }
    },
    writeContact() {
      this.$emit('writeContact')
      if (this.source === 'lottery') {
        this.reportBtnClick(this.popType === 'add' ? '填写联系方式' : '查看联系方式')
      } else {
        this.reportTaskCardClick(this.popType === 'add' ? '填写联系方式' : '查看联系方式')
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
.physical-content {
  text-align: center;
  padding-bottom: 50px;
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
    margin-bottom: 46px;
  }
  .btn-wrap {
    width: 120px;
    height: 36px;
    text-align: center;
    color: #000;
  }
}
.address-btn {
  width: auto;
  padding: 0 10px;
}

.address-btn {
  width: 140px;
}

.PhoneDevice {
  .address-btn {
    width: 140px;
    font-size: 14px;
  }
}

</style>

<style scoped>
.address-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .address-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
