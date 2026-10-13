import resolveAsset from '@/compat/resolveAsset'
import GameDownloadButton from '@/components/GameDownloadButton'
import TagNormal from '@/components/TagNormal'
import TagActivity from '@/components/TagNormal/TagActivity'
import TagRank from '@/components/TagNormal/TagRank'
import { getGameMsgDataReport } from '@/utils/dataReport'

import {
  getFollowers,
  toFollowers
} from '@/api/gameCenter'

export default {
  name: 'HorizontalList',
  components: {
    GameDownloadButton,
    TagNormal,
    TagActivity,
    TagRank
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png'),
      thirdLocal: '',
      curBigCrad: 0,
      cWidth: 900,
      isFollower: false,
      focusedIndex: 0
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
    const stageRef = this.$refs.stage
    const stageEl = stageRef?.$el || stageRef
    if (stageEl && stageEl.nodeType === 1) {
      this.resizeObserver.observe(stageEl)
    }

    // const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    // if (!isFirstIn) {
    //   sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
    //   // this.gameReport()
    // }
  },
  activated() {
    this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
    const stageRef = this.$refs.stage
    const stageEl = stageRef?.$el || stageRef
    if (stageEl && stageEl.nodeType === 1) {
      this.resizeObserver.observe(stageEl)
    }

    // const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    // if (!isFirstIn) {
    //   sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
    //   // this.gameReport()
    // }
    this.getFollowers()
  },
  deactivated() {
  //  sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  watch: {
    curBigCrad: {
      immediate: true,
      handler: function() {
        this.$nextTick(() => {
          this.getFollowers()
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
    rankSoftList() {
      const _rankSoftList = {
        fillType: -1,
        name: '',
        id: '',
        data: []
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankSoftList.fillType = _data.fillType
        _rankSoftList.name = _data.name
        _rankSoftList.id = _data.id
      }

      // fillType: 1:纯游戏 2：运营位
      if (_rankSoftList.fillType === 1) {
        _rankSoftList.data = _data.rankingListSofts.map((item, index) => {
          let col = 5

          if (this.cWidth > 1700) {
            col = 6
          }

          const _width = Math.floor((this.cWidth + 22) / col) - 22
          if (index === this.curBigCrad) {
            item.width = _width * 2
          } else {
            item.width = Math.floor((this.cWidth + 22) / col)
          }
          return item
        }).slice(0, 5)
      }

      return _rankSoftList
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
          plateName: this.rankSoftList.name || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    },
    softId() {
      return this.rankSoftList.data[this.curBigCrad].softId
    }
  },

  methods: {
    // 网格键盘事件
    onGridKeydown(e) {
      const total = this.rankSoftList.data.length
      if (total === 0) return
      let next = this.focusedIndex
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (this.focusedIndex + 1) % total
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (this.focusedIndex - 1 + total) % total
      } else {
        return
      }
      this.focusedIndex = next
      this.$nextTick(() => {
        const items = Array.from(this.$refs.stage.children)
        if (items[next]) items[next].focus()
      })
    },
    handleCardFocus(index) {
      this.focusedIndex = index
      this.curBigCrad = index
    },
    resizeObserverHandle(entries) {
      if (!entries || entries.length <= 0 || entries[0].borderBoxSize.length <= 0) return

      this.cWidth = entries[0].borderBoxSize[0].inlineSize

      if (this.cWidth < 1570 && this.curBigCrad === 4) {
        this.curBigCrad = 0
      }
    },
    curBigCradIn(index) {
      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.curBigCrad = index
      }, 150)
    },
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
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_p: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankSoftList.name,
          plateName: this.rankSoftList.name
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
    async getFollowers() {
      this.isFollower = false
      if (!this.userInfo) {
        return
      }

      this.isFollower = await getFollowers({
        softId: this.softId
      })
    },
    toFollowers() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.toFollowersReport()

      toFollowers(this.softId, this.isFollower).then(res => {
        this.isFollower = res.data
        if (this.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.softId) {
              o.softDesc.followerCount++
            }

            return o
          })
        } else {
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.softId && o.softDesc.followerCount > 0) {
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
    toFollowersReport() {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.softId).softName || ''
      }

      let _stateGame = 1
      let _statePage = 1

      if (this.rankSoftList.data.find(item => item.softId === this.softId).softPurpose === 2) {
        const _downloadInfo = this.rankSoftList.data.find(item => item.softId === this.softId).downloadInfo || null
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
          softID: this.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.isFollower ? 2 : 1
        })
      })
    },
    confirmReport(confirmType) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.softId).softName || ''
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
          softID: this.softID,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    onExposure() {
      this.gameReport()
    },
    gameReport() {
      let _rankingListSofts = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 1) {
        _moduleName = this.moduleData.rankingLists[0].name

        if (this.moduleData.rankingLists[0].rankingListSofts.length) {
          _rankingListSofts = this.moduleData.rankingLists[0].rankingListSofts.map(o => {
            const report = getGameMsgDataReport(o)
            const _bizType = report.stateGame
            const buttonType = report.statePage

            const _name_cdk = `${o.softName}_${o.softId}`
            const _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
            const _softPurpose = o.softPurpose

            return {
              name_cdk: _name_cdk,
              name_download: _name_download,
              softPurpose: _softPurpose
            }
          })
        }
      }

      const _cdk = _rankingListSofts.slice(0, 5).filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
      const _download = _rankingListSofts.slice(0, 5).map(o => o.name_download).join(',')

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
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }
    }
  }
}
