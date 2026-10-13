<template>
  <button :class="[buttonShowType, 'ApplyTestButton']" @click.stop="clickApplyTest">
    <template v-if="stateInfo.testActivityStatus===1">
      <i class="text" v-if="stateInfo.userTestApplyStatus===1">已申请</i>
      <i class="text autoClick" v-else>申请测试</i>
    </template>
    <template v-else-if="stateInfo.testActivityStatus===0">
      <i class="text">敬请期待</i>
    </template>
    <template v-else-if="stateInfo.testActivityStatus===2">
      <i class="text">已结束</i>
    </template>
  </button>
</template>
<script>
import { applyTestGame } from '@/api/gameEvaluation'

export default {
  name: 'ApplyTestButton',
  props: {
    buttonStyle: {
      type: String,
      default: 'normal' // abnormal
    },
    downloadInfo: {
      type: Object,
      default: null
    },
    softId: {
      type: String,
      required: true
    },
    softName: {
      type: String,
      required: true
    },
    drinfo: {
      type: String,
      required: true
    },
    isClick: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    stateInfo() {
      return this.$store.state.gameDownloadState.stateMap[this.softId] || {}
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    buttonShowType() {
      let basicType
      switch (this.buttonStyle) {
        case 'abnormal':
          basicType = 'common-abnomal-btn'
          break
        case 'rect':
          basicType = 'common-abnormal-rect-btn'
          break
        default:
          basicType = 'grey-rect-btn'
          break
      }
      // 已结束、已申请
      const greyType = (this.stateInfo.testActivityStatus === 2 ||
                       (this.stateInfo.testActivityStatus === 1 && this.stateInfo.userTestApplyStatus === 1)) ? ' disabled' : ''
      // 未开始
      const whiteType = this.stateInfo.testActivityStatus === 0 ? ' white-text' : ''
      return basicType + greyType + whiteType
    }
  },
  methods: {
    setApplyTestState(userTestApplyStatus) {
      const _stateInfo = { ...this.stateInfo }
      this.$store.dispatch('gameDownloadState/setState', {
        [this.softId]: {
          ..._stateInfo,
          userTestApplyStatus
        }
      })
      this.$parentUpdateState({
        gameDownloadStateMap: {
          ...this.$store.state.gameDownloadState.stateMap,
          [this.softId]: {
            ..._stateInfo,
            userTestApplyStatus
          }
        }
      })
    },
    clickApplyTest() {
      if (this.isClick) {
        this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      }

      if (!this.userInfo) {
        this.$login()
        return
      }
      // 只有测试活动且未申请测试，才可点击
      if (this.stateInfo.testActivityStatus === 1 && this.stateInfo.userTestApplyStatus !== 1) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeGcbClickApplyTestPopupShow', 'pv')
        this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
          detail: JSON.stringify({ ...JSON.parse(this.drinfo), stateGame: 3, statePage: 4 }),
          status: 1,
          typeerr: JSON.stringify({ errortype: '', errormess: '' })
        })

        const webUrl = this.downloadInfo.testActivityQuestionUrl

        const _drinfo = JSON.parse(this.drinfo)
        const _detailReport = {
          skuName: _drinfo.skuName,
          softID: _drinfo.softID,
          lenovoid: _drinfo.lenovoid
        }
        this.$applytestconfirm({
          confirmButtonText: webUrl ? '填写问卷并申请' : '申请', // 1：申请，2：填写问卷并申请
          type: webUrl ? 2 : 1 // 1：申请，2：填写问卷并申请
        }).then((res) => {
          if (res.success) {
            this.applyTestApi(res.phone)

            this.$dataReport('LZ_gamingCenter', 'LZ_storeGcbClickApplyTestPopupClick', 'click', {
              clickType: 2,
              detail: JSON.stringify(_detailReport)
            })
          }
        }).catch(() => {
          this.$dataReport('LZ_gamingCenter', 'LZ_storeGcbClickApplyTestPopupClick', 'click', {
            clickType: 1,
            detail: JSON.stringify(_detailReport)
          })
        })
      }
    },
    applyTestApi(phoneNum) {
      const webUrl = this.downloadInfo.testActivityQuestionUrl
      applyTestGame({
        softName: this.softName,
        softId: this.softId,
        phoneNum,
        activityId: this.downloadInfo.testActivityId,
        activityName: this.downloadInfo.testActivityName
      }).then((res) => {
        this.setApplyTestState(1)
        if (webUrl) {
          window.open(webUrl, '_blank')
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.grey-rect-btn {
  min-width: 77px;
  margin: 0 auto;
  cursor: pointer;
  display: inline-block;
  height: 38px;
  letter-spacing: 1px;
  color: #020202;
  font-size: 15px;
  font-weight: 700;
    background: linear-gradient(298deg, rgb(190, 191, 191) 0%, rgb(234, 247, 255) 30%);
    border: 1px solid;
    border-image: linear-gradient(245deg, #fff, #999) 1;
  &:focus-visible {
    outline: 2px solid #4fc3f7;
    outline-offset: 2px;
  }
  line-height: 36px;
  width: 90px;
  text-align: center;
  &:hover {
    color: #fff;
    background: linear-gradient(to left, rgba(125, 125, 125, 1),rgba(40, 40, 40, 1));
  }
  &:active {
    color: #fff;
    background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
  }
  &.disabled {
    color: #fff;
    background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
  }
  &.white-text {
    cursor: default;
    background: transparent;
    border: 0 none;
    color: #EAF7FF;
  }
}

</style>
