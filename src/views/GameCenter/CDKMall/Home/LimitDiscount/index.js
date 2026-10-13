import resolveAsset from '@/compat/resolveAsset'
export default {
  name: 'LimitDiscount',
  filters: {
    timeLeft(value, currentTime) {
      let result = ''
      let diffTime = value - currentTime

      const ONE_DAY = 24 * 60 * 60 * 1000
      if (diffTime > ONE_DAY) {
        result += Math.floor(diffTime / ONE_DAY) + '天 '
        diffTime = diffTime % ONE_DAY
      }

      const ONE_HOUR = 60 * 60 * 1000
      if (diffTime > ONE_HOUR) {
        result += String(Math.floor(diffTime / ONE_HOUR)).padStart(2, 0) + ':'
        diffTime = diffTime % ONE_HOUR
      } else {
        result += '00:'
      }

      const ONE_MINUTE = 60 * 1000
      if (diffTime > ONE_MINUTE) {
        result += String(Math.floor(diffTime / ONE_MINUTE)).padStart(2, 0) + ':'
        diffTime = diffTime % ONE_MINUTE
      } else {
        result += '00:'
      }

      const ONE_SECOND = 1000
      if (diffTime > ONE_SECOND) {
        result += String(Math.floor(diffTime / ONE_SECOND)).padStart(2, 0)
        diffTime = diffTime % ONE_SECOND
      } else {
        result += '00'
      }

      return result
    }
  },
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
      defaultImg: new URL('../../hdefault.png', import.meta.url).href,
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
      }).slice(0, 11)
    }
  },
  activated() {
    const isFirstIn = sessionStorage.getItem(`LIMIT_DISCOUNT_IS_FIRSTIN_${this.rankData.id}`)

    if (!isFirstIn) {
      sessionStorage.setItem(`LIMIT_DISCOUNT_IS_FIRSTIN_${this.rankData.id}`, 1)
      this.gameReport()
    }
  },
  mounted() {
    const isFirstIn = sessionStorage.getItem(`LIMIT_DISCOUNT_IS_FIRSTIN_${this.rankData.id}`)

    if (!isFirstIn) {
      sessionStorage.setItem(`LIMIT_DISCOUNT_IS_FIRSTIN_${this.rankData.id}`, 1)
      this.gameReport()
    }
  },
  deactivated() {
    sessionStorage.removeItem(`LIMIT_DISCOUNT_IS_FIRSTIN_${this.rankData.id}`)
  },
  methods: {
    toList() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 3,
          plateName: this.rankData.name,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$router.push({ name: 'GameCenterList', query: {
        rankID: this.rankData.id,
        rankName: this.rankData.name,
        isCDKNeedFilterDownload: true,
        secondLocal: this.secondLocal
      }})
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
      _rankingListSofts = this.rankData.rankingListSofts.slice(0, 11)

      const _cdk = _rankingListSofts.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
      const _download = _rankingListSofts.filter(o => o.softPurpose === 2).map(o => `${o.softName}_${o.softId}`).join(',')

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
