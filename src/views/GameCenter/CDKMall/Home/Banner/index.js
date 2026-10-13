export default {
  name: 'Banner',
  props: {
    moduleData: {
      type: Object,
      required: true
    },
    serverCurrentTime: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      activeIndex: 0,
      thirdLocal: ''
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
      return 3
    },
    rankData() {
      return this.moduleData.rankingLists[0]
    },
    rankSoftList() {
      return this.rankData.rankingListSofts.map(o => {
        if (o.currentTimeActivity) {
          const { startTime, endTime } = o.currentTimeActivity
          if (this.serverCurrentTime < startTime || this.serverCurrentTime >= endTime) {
            o.currentTimeActivity = null
            o.showInfo.ruleLabelName = ''
          }
        }

        return o
      }).slice(0, 5)
    },
    currentBanner() {
      return this.rankSoftList[this.activeIndex]
    }
  },
  mounted() {
    this.play()

    const isFirstIn = sessionStorage.getItem('BANNER_IS_FIRST_IN')
    if (!isFirstIn) {
      sessionStorage.setItem('BANNER_IS_FIRST_IN', 1)
      this.gameReport()
    }
  },
  activated() {
    this.play()

    const isFirstIn = sessionStorage.getItem('BANNER_IS_FIRST_IN')
    if (!isFirstIn) {
      sessionStorage.setItem('BANNER_IS_FIRST_IN', 1)
      this.gameReport()
    }
  },
  deactivated() {
    this.stop()

    sessionStorage.removeItem('BANNER_IS_FIRST_IN')
  },
  methods: {
    setActiveIndex(activeIndex) {
      this.activeIndex = activeIndex
    },
    next() {
      if (this.activeIndex >= this.rankSoftList.length - 1) {
        this.activeIndex = 0
        return
      }

      this.activeIndex = this.activeIndex + 1
    },
    play() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.next()
        this.play()
      }, 5000)
    },
    stop() {
      clearTimeout(this.timer)
    },
    toDetail(item) {
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankData.name,
          plateName: this.rankData.name
        }
      })
    },
    gameReport() {
      let _rankingListSofts = []
      const _moduleName = this.rankData.name
      _rankingListSofts = this.rankData.rankingListSofts.slice(0, 5)

      const _cdk = _rankingListSofts?.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
      const _download = _rankingListSofts.map(o => `${o.softName}_${o.softId}`).join(',')

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
            firstLocal: this.firstLocal,
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
