<template>
  <button :class="[buttonShowType, 'ReserveButton', $isPadDevice ? 'PadDevice' : 'PcDevice']" @click.stop="clickReserve">
    <i class="text" v-if="stateInfo.userReservationStatus === 1">已预约</i>
    <i class="text autoClick" v-else>预约关注</i>
  </button>
</template>
<script>
import { reserveReviewslikes, unReserveReviewslikes } from '@/api/gameEvaluation'
import { followers, unFollowers } from '@/api/gameCenter'
export default {
  name: 'ReserveButton',
  data() {
    return {
      reserveLocking: false
    }
  },
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
    },
    hideEventDate: {
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
      return basicType
    }
  },
  methods: {
    setReserveState(userReservationStatus) {
      const _stateInfo = { ...this.stateInfo }
      this.$store.dispatch('gameDownloadState/setState', {
        [this.softId]: {
          ..._stateInfo,
          userReservationStatus,
          isFollower: !!userReservationStatus
        }
      })
      this.$parentUpdateState({
        gameDownloadStateMap: {
          ...this.$store.state.gameDownloadState.stateMap,
          [this.softId]: {
            ..._stateInfo,
            userReservationStatus,
            isFollower: !!userReservationStatus
          }
        }
      })
    },
    clickReserve() {
      if (this.reserveLocking) {
        this.$message({
          message: '点击太快了,请稍后！',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })
        return
      }

      if (this.isClick) {
        this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      }

      if (!this.userInfo) {
        this.$login()
        return
      }

      this.reserveLocking = true

      this.reserveReport()

      if (this.stateInfo.userReservationStatus === 1) {
        const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
        if (!CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
          this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupShow', 'pv')
          this.$lzconfirm({
            layout: 1,
            type: 'warning',
            title: '提示',
            message: '确认要取消预约与关注此游戏吗 ？',
            subMessage: '取消后将不会收到游戏的上线及活动提醒',
            showCancelButton: this.$isPhoneDevice,
            rememberKey: 'CANCEL_APPOINTMENTS_AND_FOLLOWERS'
          }).then(() => {
            Promise.all([
              unReserveReviewslikes({ softId: this.softId, softName: this.softName }),
              unFollowers({ softId: this.softId })
            ]).then(() => {
              this.setReserveState(0)
              if (this.$store.state.system.isLiteVersion) {
                this.$parentUpdateState({ reservationCountDelta: -1 })
              }
              this.confirmReport(2)
              this.upDataGameCenterConcernList(2)
            })
            this.$emit('reserveSuccess', false)
          }).catch(() => {
            this.confirmReport(1)
          }).finally(() => {
            this.reserveLocking = false
          })
        } else {
          Promise.all([
            unReserveReviewslikes({ softId: this.softId, softName: this.softName }),
            unFollowers({ softId: this.softId })
          ]).then(() => {
            this.setReserveState(0)
            if (this.$store.state.system.isLiteVersion) {
              this.$parentUpdateState({ reservationCountDelta: -1 })
            }
            this.upDataGameCenterConcernList(2)
          }).catch(() => {})
            .finally(() => {
              this.reserveLocking = false
            })
        }

        return
      }

      this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
        detail: JSON.stringify({ ...JSON.parse(this.drinfo), stateGame: 2, statePage: 3 }),
        status: 1,
        typeerr: JSON.stringify({ errortype: '', errormess: '' })
      })

      Promise.all([
        reserveReviewslikes({ softId: this.softId, softName: this.softName }),
        followers({ softId: this.softId })
      ]).then(() => {
        this.setReserveState(1)
        if (this.$store.state.system.isLiteVersion) {
          this.$parentUpdateState({ reservationCountDelta: 1 })
        }
        this.upDataGameCenterConcernList(1)
        // 预约成功
        this.$message({
          message: '预约并关注成功！',
          type: 'success',
          duration: 2500,
          customClass: 'lg-message--success'
        })
        this.$emit('reserveSuccess', true)
      }).catch(() => {})
        .finally(() => {
          this.reserveLocking = false
        })
    },
    reserveReport() {
      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        detail: JSON.stringify({ ...JSON.parse(this.drinfo), stateGame: 2, statePage: this.stateInfo.userReservationStatus === 1 ? 3 : 2, clicktype: this.stateInfo.userReservationStatus === 1 ? 3 : 4 })
      })
    },
    upDataGameCenterConcernList(type) {
      if (type === 1) {
        if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
          const _GameCenterConcern = JSON.parse(window._GAMECENTER_RESTORE['GameCenterConcern'])
          if (_GameCenterConcern.concernList.length && _GameCenterConcern.concernList.some(o => o.softId === this.softId)) {
            _GameCenterConcern.concernList.map(o => {
              if (o.softId === this.softId) {
                if (o.unFollowMark && o.unFollowMark === true) {
                  delete o.unFollowMark
                }
              }
              return o
            })

            _GameCenterConcern.concernListLength++
            window._GAMECENTER_RESTORE['GameCenterConcern'] = JSON.stringify(_GameCenterConcern)
          }
        }

        if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
          const _GameCenterReducedPrice = JSON.parse(window._GAMECENTER_RESTORE['GameCenterReducedPrice'])
          if (_GameCenterReducedPrice.reducedPriceList.length && _GameCenterReducedPrice.reducedPriceList.some(o => o.softId === this.softId)) {
            _GameCenterReducedPrice.reducedPriceList.map(o => {
              if (o.softId === this.softId) {
                if (o.unFollowMark && o.unFollowMark === true) {
                  delete o.unFollowMark
                }
              }
              return o
            })

            _GameCenterReducedPrice.reducedPriceListLength++
            window._GAMECENTER_RESTORE['GameCenterReducedPrice'] = JSON.stringify(_GameCenterReducedPrice)
          }
        }
      } else {
        if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
          const _GameCenterConcern = JSON.parse(window._GAMECENTER_RESTORE['GameCenterConcern'])
          if (_GameCenterConcern.concernList.length && _GameCenterConcern.concernList.some(o => o.softId === this.softId)) {
            _GameCenterConcern.concernList = _GameCenterConcern.concernList.map(o => {
              if (o.softId === this.softId && !o.unFollowMark) {
                o.unFollowMark = true
              }
              return o
            })

            if (_GameCenterConcern.concernListLength > 0) {
              _GameCenterConcern.concernListLength--
            }

            window._GAMECENTER_RESTORE['GameCenterConcern'] = JSON.stringify(_GameCenterConcern)
          }
        }

        if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
          const _GameCenterReducedPrice = JSON.parse(window._GAMECENTER_RESTORE['GameCenterReducedPrice'])
          if (_GameCenterReducedPrice.reducedPriceList.length && _GameCenterReducedPrice.reducedPriceList.some(o => o.softId === this.softId)) {
            _GameCenterReducedPrice.reducedPriceList = _GameCenterReducedPrice.reducedPriceList.map(o => {
              if (o.softId === this.softId && !o.unFollowMark) {
                o.unFollowMark = true
              }
              return o
            })

            if (_GameCenterReducedPrice.reducedPriceListLength > 0) {
              _GameCenterReducedPrice.reducedPriceListLength--
            }

            window._GAMECENTER_RESTORE['GameCenterReducedPrice'] = JSON.stringify(_GameCenterReducedPrice)
          }
        }
      }
    },
    confirmReport(confirmType) {
      const _drinfo = JSON.parse(this.drinfo)
      let _clickType = confirmType
      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (confirmType === 2 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 3
      } else if (confirmType === 1 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 4
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupClick', 'click', {
        detail: JSON.stringify({
          skuName: _drinfo.skuName,
          softID: _drinfo.softID,
          lenovoid: _drinfo.lenovoid,
          unfollow: 2
        }),
        clickType: _clickType
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.grey-rect-btn {
  width: 90px;
  margin: 0 auto;
  cursor: pointer;
  display: inline-block;
  height: 34px;
  letter-spacing: 1px;
  color: #020202;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;
  line-height: 34px;
  text-align: center;
  background: linear-gradient(298deg, rgb(190, 191, 191) 0%, rgb(234, 247, 255) 30%);
  border-image: linear-gradient(245deg, #fff, #999) 1;

  &:focus-visible {
    outline: 2px solid #4fc3f7;
    outline-offset: 2px;
  }
}
.PcDevice .grey-rect-btn {
  &:hover {
    color: #fff;
    background: linear-gradient(to left, rgba(125, 125, 125, 1),rgba(40, 40, 40, 1));
  }
  &:active {
    color: #fff;
    background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
  }
  &:focus-visible {
    outline: 2px solid #4fc3f7;
    outline-offset: 2px;
  }
}

.PhoneDevice {
  .grey-rect-btn {
    width: 100%;
    height: 28px;
    line-height: 28px;
    font-size: 12px;
}
}

</style>
