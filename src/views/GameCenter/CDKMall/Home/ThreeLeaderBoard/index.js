import LeaderBoard from './LeaderBoard'

export default {
  name: 'ThreeLeaderBoard',
  components: {
    LeaderBoard
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
      return this.moduleData.rankingLists.map(o => {
        o._rankingListSofts = o.rankingListSofts.map(soft => {
          if (soft.currentTimeActivity) {
            const { startTime, endTime } = soft.currentTimeActivity
            if (this.serverCurrentTime < startTime || this.serverCurrentTime >= endTime) {
              soft.currentTimeActivity = null
              soft.showInfo.ruleLabelName = ''
            }
          }

          return soft
        }).slice(0, 5)

        return o
      }).slice(0, 5)
    }
  },
  activated() {
    this.rankData.forEach(o => {
      const isFirstIn = sessionStorage.getItem(`THREE_LEADER_BOARD_IS_FIRSTIN_${o.id}`)

      if (!isFirstIn) {
        sessionStorage.setItem(`THREE_LEADER_BOARD_IS_FIRSTIN_${o.id}`, 1)
        this.gameReport()
      }
    })
  },
  mounted() {
    this.rankData.forEach(o => {
      const isFirstIn = sessionStorage.getItem(`THREE_LEADER_BOARD_IS_FIRSTIN_${o.id}`)

      if (!isFirstIn) {
        sessionStorage.setItem(`THREE_LEADER_BOARD_IS_FIRSTIN_${o.id}`, 1)
        this.gameReport()
      }
    })
  },
  deactivated() {
    this.rankData.forEach(o => {
      sessionStorage.removeItem(`THREE_LEADER_BOARD_IS_FIRSTIN_${o.id}`)
    })
  },
  methods: {
    toList(rankID, rankName) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 3,
          plateName: rankName,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })
      this.$router.push({
        name: 'GameCenterList',
        query: {
          rankID, rankName,
          isCDKNeedFilterDownload: true,
          secondLocal: this.secondLocal
        }})
    },
    gameReport() {
      this.rankData.forEach(o => {
        o._moduleName = o.name
        const _cdk = o.rankingListSofts.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
        const _download = o.rankingListSofts.filter(o => o.softPurpose === 2).map(o => `${o.softName}_${o.softId}`).join(',')

        if (_cdk) {
          this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
            details: JSON.stringify({
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              plateName: o._moduleName,
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
              plateName: o._moduleName,
              nameAndIDVersion: _download,
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          })
        }
      })
    }
  }
}
