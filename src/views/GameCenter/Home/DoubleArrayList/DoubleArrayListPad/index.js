import resolveAsset from '@/compat/resolveAsset'
import GameDownloadButton from '@/components/GameDownloadButton'

import {
  getFollowers,
  toFollowers
} from '@/api/gameCenter'
export default {
  name: 'DoubleArrayList',
  components: {
    GameDownloadButton
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png'),
      thirdLocal: '',
      currentVideo: -1,
      currentVideo2: -1,
      isFollower: false
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  // mounted() {
  //   const isFirstIn = sessionStorage.getItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  //   if (!isFirstIn) {
  //     sessionStorage.setItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
  //     // this.gameReport()
  //   }
  // },
  // activated() {
  //   const isFirstIn = sessionStorage.getItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  //   if (!isFirstIn) {
  //     sessionStorage.setItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
  //     // this.gameReport()
  //   }
  // },
  // deactivated() {
  //   sessionStorage.removeItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  // },
  watch: {
    currentVideo: {
      handler: function(value) {
        this.$nextTick(async() => {
          if (value !== -1) {
            this.isFollower = false

            if (!this.userInfo) {
              return
            }

            this.isFollower = await getFollowers({
              softId: value
            })
          }
        })
      }
    }
  },
  computed: {
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      const _GAME_CENTER_SOURCE_RECORD = Number(sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD'))
      return _GAME_CENTER_SOURCE_RECORD
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 1
    },
    moduleEname() {
      return this.moduleData.moduleEname
    },
    fillingStrategyKey() {
      return this.$store.state.aiGameRecommend.moduleGameConfigs?.fillingStrategyKey || 'no'
    },
    rankSoftList() {
      const _rankSoftList = {
        fillType: -1,
        name: '',
        id: '',
        data: [],
        showMore: false
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankSoftList.fillType = _data.fillType
        _rankSoftList.name = _data.name
        _rankSoftList.id = _data.id
      }

      // fillType: 1:纯游戏 2：运营位
      if (_rankSoftList.fillType === 1) {
        const combinedList = [..._data.rankingListSofts]
        _rankSoftList.data = [...combinedList.slice(0, 8)]

        _rankSoftList.showMore = _data.rankingListSofts.length > 6
      }

      return { ..._rankSoftList }
    },
    drinfo() {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: this.rankSoftList.name,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          aiStrategy: item?.isAiGame ? this.fillingStrategyKey : 'no'
        })
      }
    }
  },
  methods: {
    toList(rankID, rankName) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 1,
          plateName: rankName,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$router.push({
        name: 'GameCenterList',
        query: {
          source_pp: 'PAD2',
          source_p: 'PAD2',
          rankID,
          rankName,
          secondLocal: this.secondLocal
        }})
    },
    toDetail(item) {
      this.currentVideo = -1
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_p: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankSoftList.name,
          plateName: this.rankSoftList.name,
          aiStrategy: item?.isAiGame ? this.fillingStrategyKey : 'no'
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
          plateName: this.rankSoftList.name || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          gameVersion: item.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: item.skuId,
        price: item.productInfo.currentPrice,
        plateName: this.rankSoftList.name,
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
    toFollowers(item) {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.toFollowersReport(item)

      toFollowers(this.currentVideo, this.isFollower).then(res => {
        this.isFollower = res.data
        if (this.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.currentVideo2) {
              o.softDesc.followerCount++
            }

            return o
          })
        } else {
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.currentVideo2 && o.softDesc.followerCount > 0) {
              o.softDesc.followerCount--
            }

            return o
          })

          this.confirmReport(2)
        }
      }).catch((err) => {
        if (err && typeof err.type === 'number') {
          this.confirmReport(1)
        }
        // nothing
      })
    },
    toFollowersReport(htmlItem) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.currentVideo2).softName || ''
      }

      let _stateGame = 1
      let _statePage = 1
      if (this.rankSoftList.data.find(item => item.softId === this.currentVideo2).softPurpose === 2) {
        const _downloadInfo = this.rankSoftList.data.find(item => item.softId === this.currentVideo2).downloadInfo || null
        if (_downloadInfo) {
          if ([1, 2].includes(_downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
            _stateGame = 2
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

      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        details: JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: this.moduleData.rankingLists[0].name,
          skuName: _skuName,
          softID: this.currentVideo2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.isFollower ? 2 : 1,
          aiStrategy: htmlItem?.isAiGame ? this.fillingStrategyKey : 'no'
        })
      })
    },
    confirmReport(confirmType) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.currentVideo2).softName || ''
      }

      let _clickType = confirmType
      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (confirmType === 2 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 3
      } else if (confirmType === 1 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 4
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupClick', 'click', {
        detail: JSON.stringify({
          skuName: _skuName,
          softID: this.currentVideo2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    handleCurrentVideo(item) {
      if (this.$isPadDevice) {
        return // 如果是 Pad 设备，直接返回，不执行后续逻辑
      }
      this.currentVideo = item.softId

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.currentVideo2 = item.softId
      }, 200)
    },
    onExposure() {
      this.gameReport()
    },
    gameReport() {
      let _rankingListSofts = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 1) {
        _moduleName = this.moduleData.rankingLists[0].name

        // ai推荐游戏和模块游戏合并

        if (this.moduleData.rankingLists[0].rankingListSofts.length) {
          _rankingListSofts = this.rankSoftList.data.map(o => {
            let _bizType = 1
            if ([1, 2].includes(o.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
              _bizType = 2
            } else if (o.downloadInfo.bizType === 4) {
              _bizType = 3
            }

            let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
            if ([1, 2].includes(o.downloadInfo.bizType)) {
              if (o.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
                buttonType = 2
              } else if (o.downloadInfo.userReservationStatus === 1) {
                buttonType = 3
              }
            } else if (o.downloadInfo.bizType === 4) {
              if (o.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
                buttonType = 4
              } else {
                if (o.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                  buttonType = 5
                } else if ([1].includes(o.downloadInfo.userTestApplyStatus)) {
                  buttonType = 6
                } else if ([2].includes(o.downloadInfo.userTestApplyStatus)) {
                  buttonType = 1
                }
              }
            }

            const fillingStrategyKey = o.isAiGame ? this.fillingStrategyKey : 'no'

            const _name_cdk = `${o.softName}_${o.softId}`
            const _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}_${fillingStrategyKey}`
            const _softPurpose = o.softPurpose

            return {
              name_cdk: _name_cdk,
              name_download: _name_download,
              softPurpose: _softPurpose
            }
          }).slice(0, 8)
        }
      }

      const _cdk = _rankingListSofts.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
      const _download = _rankingListSofts.filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

      if (_cdk) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
          details: JSON.stringify({
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            plateName: _moduleName,
            nameAndIDVersion: _cdk,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }

      if (_download) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeLoadGameTabPageShow', 'pv', {
          details: JSON.stringify({
            firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            plateName: _moduleName,
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            aiStrategy: _rankingListSofts.length ? _rankingListSofts[0].fillingStrategyKey : 'no'
          })
        })
      }
    },
    handleCurImg(item) {
      if (this.currentVideo === item.softId &&
        item.softDesc &&
        item.softDesc.mediaList[0] &&
        item.softDesc.mediaList[0].type === 'video'
      ) {
        return item.softDesc.mediaList[0].url
      }

      if (this.currentVideo === item.softId &&
        item.softDesc &&
        item.softDesc.mediaList[0] &&
        item.softDesc.mediaList[0].type === 'image'
      ) {
        return item.softDesc.mediaList[0].url
      }

      if (item.showInfo.himg) {
        return item.showInfo.himg
      }

      return this.defaultImg
    }
  }
}
