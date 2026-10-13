<template>
  <div class="CDKMall">
    <component :is="currentView" @update="refresh" />
  </div>
</template>

<script>
import { checkNetworkStatus } from '@/nativeApi/Phwcap'
import Offline from './Offline'
import Container from './Container'

export default {
  name: 'CDKMall',
  components: {
    Offline,
    Container
  },
  provide() {
    return {
      showOffline: this.showOffline
    }
  },
  data() {
    return {
      online: null
    }
  },
  computed: {
    currentView() {
      if (this.online === null) {
        return null
      }

      if (this.online === false) {
        return 'Offline'
      }

      return 'Container'
    }
  },
  // beforeRouteEnter(to, from, next) {
  //   window._CDKMALL_RESTORE = {}

  //   next()
  // },
  // beforeRouteLeave(to, from, next) {
  //   window._CDKMALL_RESTORE = null
  //   this.$store.dispatch('pageLoaded', false)
  //   next()
  // },
  created() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      checkNetworkStatus().then(online => {
        this.$store.dispatch('pageLoaded', false)
        this.online = online
      })
    },
    showOffline() {
      this.online = false
    }
  },
  beforeCreate() {
    window._CDKMALL_RESTORE = {}
  },
  beforeUnmount() {
    window._CDKMALL_RESTORE = null
    this.$store.dispatch('pageLoaded', false)
  }
}
</script>

<style lang="scss" scoped>
  div.CDKMall {
    position: relative;
    top: -48px;
    left: 0;
    width: 100%;
    height: 100vh;
  }

</style>
