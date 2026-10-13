<template>
  <div class="ReserveZone">
    <div class="top-bac"></div>
    <div
      v-if="modules.length"
      class="reserve-zone"
      ref="scroller"
      @scroll="scrollHandle"
    >
      <component
        v-for="item of modules"
        :key="item.moduleId"
        :is="['BigBanner', 'HorizontalList', 'RankList', 'CalendarList'][item.moduleStyle - 18]"
        :module-data="item">
      </component>
    </div>
  </div>
</template>
<script>
import BigBanner from './BigBanner'
import RankList from './RankList'
import HorizontalList from './HorizontalList'
import CalendarList from './CalendarList'
import { getReserveZoneData } from '@/api/gameCenter'
import { createTabPageReporter } from '@/utils/dataReport'

export default {
  components: {
    BigBanner,
    RankList,
    HorizontalList,
    CalendarList
  },
  data() {
    return {
      modules: [],
      scrollTop: 0
    }
  },
  computed: {
    version() {
      return this.$store.state.system.version
    },
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  created() {
    this._reporter = createTabPageReporter('火爆预约', '/gameCenter/reserveZone')

    this.$emit('scrollTop', 0)
    this.$emit('headerStatus', true)
    if (window._GAMECENTER_RESERVEZONE) {
      const {
        modules,
        scrollTop
      } = JSON.parse(window._GAMECENTER_RESERVEZONE)
      delete window._GAMECENTER_RESERVEZONE

      this.modules = modules
      this.scrollTop = scrollTop
      this._reporter.reportStart()
      this.$nextTick(() => {
        this.$refs.scroller.scrollTop = this.scrollTop
        this._reporter.reportLoaded()
      })
    } else {
      this.initWithReport()
    }
  },
  methods: {
    scrollHandle(e) {
      this.scrollTop = Math.round(e.target.scrollTop)
    },
    async initWithReport() {
      this._reporter.reportStart()
      await this.init()
      this._reporter.reportLoaded()
    },
    init() {
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      return getReserveZoneData({ currentClientVersion: this.version, moduleType: 5 }).then(res => {
        this.modules = res.homePageModules
      }).catch((res) => {
        this.$errorMessage(res.message)
      }).finally(() => {
        this.$store.dispatch('pageLoaded', false)
      })
    }
  },
  beforeRouteEnter(to, from, next) {
    if (!['GameCenterDetail'].includes(from.name) && window._GAMECENTER_RESTORE) {
      delete window._GAMECENTER_RESERVEZONE
    }
    next()
  },
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESERVEZONE = JSON.stringify({
        ...this.$data,
        scrollTop: Math.round(this.$refs.scroller.scrollTop)
      })
    }
    next()
  },
  mounted() {
    requestAnimationFrame(() => this._reporter.reportFirstFrame())

    this.$dataReport(
      'LZ_gamingCenter',
      'LZ_storeReservationZonePageShow',
      'pv',
      {
        detail: JSON.stringify({
          firstLocal: 3,
          secondLocal: 17,
          lenovoid: this.userInfo?.UserID || ''
        })
      }
    )
  }
}
</script>
<style lang="scss" scoped>
.top-bac {
  background: linear-gradient(to bottom, #101015 0%, #101015 90%, transparent);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 124px;
  z-index: 3;
}
.reserve-zone {
  padding-top: 27px;
  overflow-y: scroll;
  height: calc(100vh - 110px);
  background: #101015;
  &::-webkit-scrollbar {
    display: none;
  }
}

</style>
