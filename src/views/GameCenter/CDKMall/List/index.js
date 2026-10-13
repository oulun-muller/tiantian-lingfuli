import resolveAsset from '@/compat/resolveAsset'
import { queryCDKList, searchDefaultWords, searchHotWords } from '@/api/cdkMall'
import GameDownloadButton from '@/components/GameDownloadButton'
import UpSearch from '@/components/UpSearch'
import { getFollowers, toFollowers } from '@/api/gameCenter'
import PadGameSearch from '@/components/PadGameSearch'

import { getGameMsgDataReport } from '@/utils/dataReport'

export default {
  name: 'List',
  components: {
    GameDownloadButton,
    UpSearch,
    PadGameSearch
  },
  data() {
    return {
      defaultKeyword: '',
      showSearchUp: false,
      searchWord: [],
      searchGameList: [],
      fromRouterName: null,
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      keyword: '', // 搜索关键字
      column: null, // createTime：创建时间，price：价格，discount：折扣
      column2: null, // createTime：创建时间，price：价格，discount：折扣
      asc: true, // true：正序，false：倒叙
      current: 0, // 当前页（从1开始）
      nomore: false,
      fetching: false,
      rankID: this.$route.query.rankID || '',
      rankName: this.$route.query.rankName || '全部',
      cdkList: [],
      scrollTop: 0,
      isCDKNeedFilterDownload: this.$route.query.isCDKNeedFilterDownload || false,
      showSortList: [
        {
          name: '按热度',
          id: 'hotNum'
        },
        {
          name: '按时间',
          id: 'createTime'
        },
        {
          name: '按价格',
          id: 'price'
        },
        {
          name: '按折扣',
          id: 'discount'
        }
      ],
      description: '',
      currentVideo: -1,
      currentVideo2: -1,
      isEntered: false,
      isFollower: false,
      aiGame: [],
      focusedIndex: 0
    }
  },
  watch: {
    keyword: {
      handler(newValue) {
        if (!newValue) {
          this.isEntered = false
        } else {
          this.isEntered = true
        }
      }
    },
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
        return '4'
      }
      return this.$route.query.firstLocal || '3'
    },
    secondLocal() {
      if (this.firstLocal === 4 && !this.$route.query.secondLocal) {
        return 5
      } else if ([1, 8].includes(this.firstLocal) && !this.$route.query.secondLocal) {
        return 6
      } else if (this.$route.query.secondLocal) {
        return this.$route.query.secondLocal
      }

      return ''
    },
    thirdLocal() {
      const second = Number(this.secondLocal)
      if (second === 1 || second === 3) {
        return 1
      }

      return ''
    },
    version() {
      return this.$store.state.system.version
    },
    system() {
      return this.$store.state.system
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    fillingStrategyKey() {
      return this.$store.state.aiGameRecommend.moduleGameConfigs?.fillingStrategyKey || 'no'
    },
    drinfo() {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD3',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: this.rankName || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          aiStrategy: item?.isAiGame ? this.fillingStrategyKey : 'no'
        })
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    console.log('beforeRouteEnter')
    if (!['GameCenterDetail'].includes(from.name)) {
      window._CDKMALL_RESTORE && delete window._CDKMALL_RESTORE['List']
    }

    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    document.removeEventListener('click', this.hideSearchUp)
    this.showSearchUp = false
    this.keyword = ''
    this.searchWord = []
    this.searchGameList = []
  },
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESTORE['List'] = JSON.stringify({
        ...this.$data,
        scrollTop: Math.round(this.$refs.listScroller.scrollTop)
      })
    }

    next()
  },

  async mounted() {
    this.$emit('headerStatus', false)
    this.getDefaultKeyword()
    document.addEventListener('click', this.hideSearchUp)

    console.log('this.$route.query.rankID2222')
    try {
      const aiGame = await this.$store.dispatch('aiGameRecommend/requestModuleData', { moduleId: this.$route.query.rankID })
      this.aiGame = aiGame || []
    } catch (error) {
      console.log(error)
    }
    this.getCDKList(true)
  },
  methods: {
    // 网格键盘事件
    onGridKeydown(e) {
      const COLS = 3
      const total = this.cdkList.length
      if (total === 0) return
      let next = this.focusedIndex
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (this.focusedIndex + 1) % total
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (this.focusedIndex - 1 + total) % total
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        next = Math.min(this.focusedIndex + COLS, total - 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        next = Math.max(this.focusedIndex - COLS, 0)
      } else {
        return
      }
      this.focusedIndex = next
      this.$nextTick(() => {
        const items = Array.from(this.$refs.listGrid.children)
        if (items[next]) items[next].focus()
      })
    },
    back() {
      if (this.$route?.query?.reportFrom === 'push' && this.$isPadDevice) {
        this.$parentRouter.push('/gameCenter/index')
        return
      }
      if (this.fromRouterName || window.history.length > 2) {
        this.$router.back()
        return
      }

      this.$router.push({ name: 'GameCenterIndex',
        query: {
          source_p: 'PAD3'
        }
      })
    },
    getDefaultKeyword() {
      try {
        const params = {
          locationId: 1,
          activeTime: this.system.activeTime,
          legionChannel: this.system.Channel,
          legionModel: this.system.MTMInfo.ReadableMachineName,
          legionMtCode: this.system.MTMInfo.MTCode,
          legionVersion: this.system.version,
          mac: this.system.mac,
          osBits: this.system.MTMInfo.OSBit,
          osVersion: this.system.MTMInfo.OS,
          sn: this.system.MTMInfo.MachineName
        }
        searchDefaultWords(params, '搜你想玩的游戏').then(res => {
          this.defaultKeyword = res.keyword
          this.description = res.description
        })
      } catch (error) {
        console.log(error)
      }
    },
    handleShowSearchUp() {
      this.showSearchUp = true
      this.getSearchWord()
    },
    getSearchWord() {
      const params = {
        locationId: 1,
        activeTime: this.system.activeTime,
        legionChannel: this.system.Channel,
        legionModel: this.system.MTMInfo.ReadableMachineName,
        legionMtCode: this.system.MTMInfo.MTCode,
        legionVersion: this.system.version,
        mac: this.system.mac,
        osBits: this.system.MTMInfo.OSBit,
        osVersion: this.system.MTMInfo.OS,
        sn: this.system.MTMInfo.MachineName
      }

      searchHotWords(params).then(res => {
        this.searchWord = res
      })
    },
    selectSearchWord(keyword) {
      this.$router.push({
        name: 'GameCenterSearch',
        query: {
          keyword: keyword,
          source_p: 'PAD3'
        }
      })
    },
    hideSearchUp() {
      this.showSearchUp = false
    },
    searchGameListByKeyword() {
      this.isEntered = true
      this.searchGameList = []
      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.getSearchGameList()
      }, 200)
    },
    handleIsEntered() {
      if (this.keyword) {
        this.isEntered = true
      } else {
        this.isEntered = false
      }
    },
    getSearchGameList() {
      // 移动端已无搜索快捷页 UI，不拉预览、不上报 type:1
      if (this.$isPadDevice) {
        return
      }

      const params = {
        currentClientVersion: this.version,
        current: 1,
        size: 3,
        key: this.keyword
      }

      queryCDKList(params).then(res => {
        this.searchGameList = res.records
        this.searchGameReport(res.records, 1)
      }).catch(() => {})
    },
    toSearch() {
      if (!this.keyword) {
        if (this.defaultKeyword !== '搜你想玩的游戏') {
          this.keyword = this.defaultKeyword
        }
      }

      if (!this.keyword) {
        this.$message({
          message: '请输入你想玩的游戏',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })

        return
      }

      this.$router.push({
        name: 'GameCenterSearch',
        query: {
          keyword: this.keyword,
          source_p: 'PAD3'
        }
      })
    },
    filterChange(filterKey) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkListSortClick', 'click', {
        plateName: this.rankName || '',
        clickType: {
          createTime: 1,
          price: 2,
          discount: 3
        }[filterKey]
      })

      if (this.column !== filterKey) {
        if (filterKey === 'price') {
          this.asc = true
        } else {
          this.asc = false
        }
      } else {
        this.asc = !this.asc
      }
      this.column = filterKey
      this.column2 = filterKey

      this.getCdkListDebounce(true)
    },
    scrollHandle(e) {
      this.scrollTop = Math.round(e.target.scrollTop)

      if (!this.nomore && e.target.scrollTop + e.target.offsetHeight + 300 >= e.target.scrollHeight) {
        this.getCDKList(false)
      }
    },
    getCdkListDebounce(force) {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.getCDKList(force)
      }, 200)
    },
    getCDKList(force) {
      if (this.fetching) return

      if (force) {
        this.current = 0
        this.nomore = false
        this.cdkList = []
      } else if (this.nomore) {
        return
      }
      if (this.aiGame?.length > 0) {
        this.cdkList = [...this.cdkList, ...this.aiGame]
      }

      const params = {
        currentClientVersion: this.version,
        current: this.current + 1,
        size: 20
      }
      if (this.column2) {
        params.column = this.column2
        params.asc = this.asc
      }
      if (this.rankID) {
        params.rankingListId = this.rankID
      }

      if (this.isCDKNeedFilterDownload) {
        params.softPurpose = 1
      }

      this.fetching = true
      if (force) {
        this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      }
      queryCDKList(params).then(res => {
        this.nomore = res.records.length < res.size
        this.current = res.current
        let TList = [...this.cdkList, ...res.records]
        //  this.cdkList = [...this.cdkList, ...res.records]
        if (TList.length > 0) {
          const uniqueMap = new Map()
          TList = TList.filter(item => {
            if (!uniqueMap.has(item.softId)) {
              uniqueMap.set(item.softId, true)
              return true
            }
            return false
          })
        }
        this.cdkList = [...TList]
        this.gameReport(res.records)
      }).catch(() => {
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.fetching = false
        if (force) {
          this.$store.dispatch('pageLoaded', false)
        }
      })
    },
    toDetail(item) {
      this.currentVideo = -1
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_pp: this.$route.query.source_pp || '',
          source_p: 'PAD3',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankName || '',
          plateName: this.rankName || '',
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
          plateName: this.rankName || '',
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
        plateName: this.rankName || '',
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
    gameReport(data) {
      if (data.length) {
        const _cdk = data.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
        const _download = data.map(o => {
          let _bizType = 1
          if ([1, 2].includes(o.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
            _bizType = 2
          } else if (o.downloadInfo.bizType === 4) {
            _bizType = 3
          } else if (o.softPurpose === 3) {
            _bizType = 4
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
          } else if (o.softPurpose === 3 && o.productInfo?.currentPrice === 0) {
            buttonType = 9
          }

          let _firstClassId = 1// 1:游戏，2：工具
          if (Number(o.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
            _firstClassId = 2
          }

          let _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
          if (_firstClassId === 2) {
            _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}_${_firstClassId}`
          }

          return {
            name_download: _name_download
          }
        }).map(o => o.name_download).join(',')

        if (_cdk) {
          this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
            details: JSON.stringify({
              firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              plateName: this.rankName || '',
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
              plateName: this.rankName || '',
              nameAndIDVersion: _download,
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          })
        }
      }
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
          this.cdkList = this.cdkList.map(o => {
            if (o.softId === this.currentVideo2) {
              o.softDesc.followerCount++
            }

            return o
          })
        } else {
          this.cdkList = this.cdkList.map(o => {
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
    toFollowersReport(item) {
      let _skuName = ''
      if (this.cdkList && this.cdkList.length) {
        _skuName = this.cdkList.find(item => item.softId === this.currentVideo2).softName || ''
      }

      let _stateGame = 1
      let _statePage = 1
      if (this.cdkList.find(item => item.softId === this.currentVideo2).softPurpose === 2) {
        const _downloadInfo = this.cdkList.find(item => item.softId === this.currentVideo2).downloadInfo || null
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
          source: 'PAD3',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: this.rankName || '',
          skuName: _skuName,
          softID: this.currentVideo2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.isFollower ? 2 : 1,
          aiStrategy: item?.isAiGame ? this.fillingStrategyKey : 'no'
        })
      })
    },
    confirmReport(confirmType) {
      let _skuName = ''
      if (this.cdkList && this.cdkList.length) {
        _skuName = this.cdkList.find(item => item.softId === this.currentVideo2).softName || ''
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
        return
      }
      this.currentVideo = item.softId

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.currentVideo2 = item.softId
      }, 200)
    },
    handleCardFocus(item, index) {
      this.focusedIndex = index
      this.currentVideo = item.softId
      this.currentVideo2 = item.softId
    },
    searchGameReport(data, type) {
      const _cdk = data.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
      const _download = data.filter(o => [2, 3].includes(o.softPurpose)).map(o => {
        const report = getGameMsgDataReport(o)
        const _bizType = report.stateGame
        const buttonType = report.statePage
        // let _bizType = 1
        // if ([1, 2].includes(o.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
        //   _bizType = 2
        // } else if (o.downloadInfo.bizType === 4) {
        //   _bizType = 3
        // } else if (o.softPurpose === 3) {
        //   _bizType = 4
        // }

        // let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
        // if ([1, 2].includes(o.downloadInfo.bizType)) {
        //   if (o.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
        //     buttonType = 2
        //   } else if (o.downloadInfo.userReservationStatus === 1) {
        //     buttonType = 3
        //   }
        // } else if (o.downloadInfo.bizType === 4) {
        //   if (o.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
        //     buttonType = 4
        //   } else {
        //     if (o.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
        //       buttonType = 5
        //     } else if ([1].includes(o.downloadInfo.userTestApplyStatus)) {
        //       buttonType = 6
        //     } else if ([2].includes(o.downloadInfo.userTestApplyStatus)) {
        //       buttonType = 1
        //     }
        //   }
        // } else if (o.softPurpose === 3 && o.productInfo?.currentPrice === 0) {
        //   buttonType = 9
        // }

        let _firstClassId = 1 // 1:游戏，2：工具
        if (o.softPurpose === 3) { // 3杂志游戏
          _firstClassId = 3
        }

        if (Number(o.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          _firstClassId = 2
        }

        let _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
        if (_firstClassId === 2 || _firstClassId === 3) {
          _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}_${_firstClassId}`
        }

        return {
          name_download: _name_download
        }
      }).map(o => o.name_download).join(',')

      if (_cdk) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkSearchListShow', 'pv', {
          details: JSON.stringify({
            from: 1,
            type: type,
            plateName: this.rankName || '',
            nameAndIDVersion: _cdk,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }

      if (_download) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeLoadGameSearchListShow', 'pv', {
          details: JSON.stringify({
            from: this.$isPadDevice ? 'PAD' : 1,
            type: type,
            plateName: this.rankName || '',
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
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
