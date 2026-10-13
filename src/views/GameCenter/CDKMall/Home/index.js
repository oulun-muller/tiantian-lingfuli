import Banner from './Banner'
import LimitDiscount from './LimitDiscount'
import ThreeLeaderBoard from './ThreeLeaderBoard'
import DoubleRowList from './DoubleRowList'
import { getHomeData } from '@/api/cdkMall'
import Header from '../../common/Header'

export default {
  name: 'Home',
  components: {
    Banner,
    LimitDiscount,
    ThreeLeaderBoard,
    DoubleRowList,
    Header
  },
  inject: ['showOffline'],
  data() {
    return {
      keyword: '', // 搜索关键字
      scrollTop: 0,
      modules: [],
      serverStartTime: Date.now(),
      clientStartTime: Date.now(),
      serverCurrentTime: Date.now()
    }
  },
  computed: {
    version() {
      return this.$store.state.system.version
    }
  },
  beforeRouteEnter(to, from, next) {
    window._GAMECENTER_Home_FROM_NAME = from.name

    next()
  },
  activated() {
    this.$emit('scrollTop', 0)
    this.$emit('headerStatus', true)

    if (['GameCenterDetail', 'GameCenterList'].includes(window._GAMECENTER_Home_FROM_NAME) && this.modules.length) {
      this.countDown()
      this.$nextTick(() => {
        this.$refs.scroller.scrollTop = this.scrollTop
      })
    } else {
      this.keyword = ''
      this.scrollTop = 0
      this.modules = []
      this.serverStartTime = Date.now()
      this.clientStartTime = Date.now()
      this.serverCurrentTime = Date.now()
      this.init()
    }
  },
  deactivated() {
    clearTimeout(this.countDownTimer)
  },
  methods: {
    init() {
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      getHomeData({ currentClientVersion: this.version, moduleType: 1 }).then(res => {
        this.modules = res.homePageModules
        this.serverStartTime = res.currentTime
        this.clientStartTime = Date.now()
        this.countDown()
      }).catch((res) => {
        this.$errorMessage(res.message)
      }).finally(() => {
        this.$store.dispatch('pageLoaded', false)
      })
    },
    countDown() {
      this.serverCurrentTime = this.serverStartTime + Date.now() - this.clientStartTime
      clearTimeout(this.countDownTimer)
      this.countDownTimer = setTimeout(this.countDown, 1000)
    },
    scrollHandle(e) {
      this.scrollTop = e.target.scrollTop
      this.$emit('scrollTop', this.scrollTop)
    }
  },
  beforeUnmount() {
    clearTimeout(this.countDownTimer)
  }
}
