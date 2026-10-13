import resolveAsset from '@/compat/resolveAsset'
export default {
  name: 'LeaderBoard',
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
    rankId: {
      type: String,
      required: true
    },
    rankName: {
      type: String,
      required: true
    },
    list: {
      type: Array,
      required: true
    },
    serverCurrentTime: {
      type: Number,
      required: true
    },
    firstLocal: {
      type: Number,
      required: true
    },
    secondLocal: {
      type: Number,
      required: true
    },
    thirdLocal: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      defaultImg: new URL('../../../hdefault.png', import.meta.url).href,
      activeIndex: 0
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  methods: {
    setActiveIndex(activeIndex) {
      this.activeIndex = activeIndex
    },
    toDetail(item) {
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankName,
          plateName: this.rankName
        }
      })
    }
  }
}
