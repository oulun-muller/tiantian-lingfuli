import GameDownloadButton from '@/components/GameDownloadButton'
export default {
  name: 'BetaTestGame',
  components: {
    GameDownloadButton
  },
  data() {
    return {
      elementAppear: false,
      thirdLocal: ''
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  mounted() {
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      clearTimeout(this.timer)
      this.gameReport()
    }

    this.createIntersectionObserver()
  },
  activated() {
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      clearTimeout(this.timer)
      this.gameReport()
    }

    this.createIntersectionObserver()
  },
  deactivated() {
    clearTimeout(this.timer)
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    this.observer && this.observer.disconnect()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    this.observer && this.observer.disconnect()
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
        data: null
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankSoftList.fillType = _data.fillType
        _rankSoftList.name = _data.name
        _rankSoftList.id = _data.id
      }

      // fillType: 1:纯游戏 2：运营位
      if (_rankSoftList.fillType === 2) {
        _rankSoftList.data = _data.rankingListPositions && _data.rankingListPositions.map(item => {
          const _data = {
            imgUrls: '', // 背景图
            videoUrls: '', // 视频
            screenshotUrls: '', // 游戏图&预览图
            softInfo: null
          }

          if (item.imgUrls && item.imgUrls.length) {
            _data.imgUrls = item.imgUrls[0]
          }

          if (item.videoUrls && item.videoUrls.length) {
            _data.videoUrls = item.videoUrls[0]
          }

          if (item.screenshotUrls && item.screenshotUrls.length) {
            _data.screenshotUrls = item.screenshotUrls[0]
          }

          _data.softInfo = item.softInfo

          return _data
        })[0] || null
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
    }
  },
  methods: {
    createIntersectionObserver() {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.elementAppear = true
          } else {
            this.elementAppear = false
          }
        })
      }, {
        rootMargin: '0px',
        threshold: 0
      })

      const observedRef = this.$refs.observedElement
      const observedEl = observedRef?.$el || observedRef
      if (observedEl && observedEl.nodeType === 1) {
        this.observer.observe(observedEl)
      }
    },
    toList(rankID, rankName) {
      this.elementAppear = false

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
      this.elementAppear = false

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
    gameReport() {
      let _rankingListPositions = null
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 2) {
        _moduleName = this.moduleData.rankingLists[0].name

        if (this.moduleData.rankingLists[0].rankingListPositions.length) {
          _rankingListPositions = this.moduleData.rankingLists[0].rankingListPositions[0]
        }
      }

      let _bizType = 1
      if ([1, 2].includes(_rankingListPositions.softInfo.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
        _bizType = 2
      } else if (_rankingListPositions.softInfo.downloadInfo.bizType === 4) {
        _bizType = 3
      }

      let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
      if ([1, 2].includes(_rankingListPositions.softInfo.downloadInfo.bizType)) {
        if (_rankingListPositions.softInfo.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
          buttonType = 2
        } else if (_rankingListPositions.softInfo.downloadInfo.userReservationStatus === 1) {
          buttonType = 3
        }
      } else if (_rankingListPositions.softInfo.downloadInfo.bizType === 4) {
        if (_rankingListPositions.softInfo.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
          buttonType = 4
        } else {
          if (_rankingListPositions.softInfo.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
            buttonType = 5
          } else if ([1].includes(_rankingListPositions.softInfo.downloadInfo.userTestApplyStatus)) {
            buttonType = 6
          } else if ([2].includes(_rankingListPositions.softInfo.downloadInfo.userTestApplyStatus)) {
            buttonType = 1
          }
        }
      }

      let _download = ''
      if (_rankingListPositions) {
        _download = `${_rankingListPositions.softInfo.softName}_${_rankingListPositions.softInfo.softId}_${_bizType}_${buttonType}`
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
