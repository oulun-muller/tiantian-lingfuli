import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import { unFollowers } from '@/api/gameCenter'
import { unReserveReviewslikes } from '@/api/gameEvaluation'

export default {
  name: 'common',
  components: {
    GameDownloadButton
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png')
    }
  },
  props: {
    concernList: {
      type: Array,
      required: true
    },
    firstLocal: {
      type: Number,
      required: true
    },
    secondLocal: {
      type: String,
      required: true
    },
    thirdLocal: {
      type: String,
      required: true
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    softLabelsLenght() {
      return (item) => {
        const authTag = item?.downloadInfo?.tagUrls[0] || ''
        return authTag ? 3 : 4
      }
    },
    drinfo() {
      return (item) => {
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        }

        if (item.softPurpose === 3) {
          params.gameClass = item.softPurpose
        }

        return JSON.stringify(params)
      }
    }
  },
  methods: {
    toDetail(item) {
      if (!item.status) {
        return
      }

      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: '',
          plateName: ''
        }
      })
    },
    showPay(item) {
      if (!this.userInfo) {
        this.$login()
        return
      }

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: '',
          skuName: item.softName || '',
          softID: item.softId || '',
          gameVersion: item.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal}_2`,
        type: 0,
        skuId: item.skuId,
        price: item.productInfo.currentPrice,
        plateName: '',
        gameVersion: item.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    toUnfollow(item) {
      this.toFollowersReport(item)

      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (!CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupShow', 'pv')

        this.$lzconfirm({
          layout: 1,
          type: 'warning',
          title: '提示',
          message: `${[1, 2].includes(item.downloadInfo.bizType) ? '确认要取消预约与关注此游戏吗 ？' : '确认取消关注此游戏吗 ？'}`,
          subMessage: `${[1, 2].includes(item.downloadInfo.bizType) ? '取消后将不会收到游戏的上线及活动提醒' : '取消关注后您将无法再收到此游戏的折扣、活动提醒'}`,
          showCancelButton: false,
          rememberKey: 'CANCEL_APPOINTMENTS_AND_FOLLOWERS'
        }).then(() => {
          this.handleUnFollowers(1, item)
        }).catch(() => {
          this.confirmReport(1, item)
        })
      } else {
        this.handleUnFollowers(2, item)
      }
    },
    handleUnFollowers(type, item) {
      const callBatch = [unFollowers({ softId: item.softId })]
      if ([1, 2].includes(item.downloadInfo.bizType)) {
        callBatch.push(unReserveReviewslikes({ softId: item.softId, softName: item.softName }))
      }

      Promise.all(callBatch).then(() => {
        this.$emit('deleteCurrent', item)

        const stateInfo = this.$store.state.gameDownloadState.stateMap[item.softId] || {}
        if ([1, 2].includes(item.downloadInfo.bizType)) {
          this.$store.dispatch('gameDownloadState/setState', {
            [item.softId]: {
              ...stateInfo,
              userReservationStatus: 0,
              isFollower: false
            }
          })
        } else {
          this.$store.dispatch('gameDownloadState/setState', {
            [item.softId]: {
              ...stateInfo,
              isFollower: false
            }
          })
        }

        if (type === 1) {
          this.confirmReport(2, item)
        }
      }).catch(() => {
        this.$message({
          message: '取消关注失败，请重试！',
          type: 'error',
          duration: 1500,
          customClass: 'lg-message--error'
        })
      })
    },
    toFollowersReport(item) {
      const _skuName = item.softName || ''

      let _stateGame = 1
      let _statePage = 1
      let _clicktype = 2
      if ([2, 3].includes(item.softPurpose)) {
        const _downloadInfo = item.downloadInfo || null
        if (_downloadInfo) {
          if ([1, 2].includes(_downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
            _stateGame = 2
            _clicktype = 3
          } else if (_downloadInfo.bizType === 4) {
            _stateGame = 3
          }

          if ([1, 2].includes(_downloadInfo.bizType)) {
            if (_downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
              _statePage = 2
            } else if (_downloadInfo.userReservationStatus === 1) {
              _statePage = 3
            }
          } else if (_downloadInfo.bizType === 4) {
            if (_downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
              _statePage = 4
            } else {
              if (_downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                _statePage = 5
              } else if ([1].includes(_downloadInfo.userTestApplyStatus)) {
                _statePage = 6
              } else if ([2].includes(_downloadInfo.userTestApplyStatus)) {
                _statePage = 1
              }
            }
          }
        }
      } else {
        _stateGame = 4
        _statePage = 7
      }

      const params = {
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        type: 2,
        plateName: this.rankName || '',
        skuName: _skuName,
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : '',
        stateGame: _stateGame,
        statePage: _statePage,
        clicktype: _clicktype
      }

      let _firstClassId = 1// 1:游戏，2：工具
      if (item.softPurpose === 3) {
        _firstClassId = 3
      }
      if (Number(item.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
        _firstClassId = 2
      }

      if (_firstClassId === 2 || _firstClassId === 3) {
        params.gameClass = _firstClassId
      }

      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        details: JSON.stringify(params)
      })
    },
    confirmReport(confirmType, item) {
      let _clickType = confirmType
      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (confirmType === 2 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 3
      } else if (confirmType === 1 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 4
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupClick', 'click', {
        detail: JSON.stringify({
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    }
  }
}
