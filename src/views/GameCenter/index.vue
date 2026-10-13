<template>
  <component :is="currentView" @update="refresh" />
</template>
<script>
import { checkNetworkStatus } from '@/nativeApi/Phwcap'
import Offline from './Offline'
import Container from './Container'
export default {
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
  components: {
    Offline,
    Container
  },
  computed: {
    currentView() {
      // if (this.online === false) {
      //   return 'Offline'
      // }
      return 'Container'
    }
  },
  created() {
    this.refresh()
  },
  methods: {
    refresh() {
      if (this.$isPadDevice) return
      // this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      // checkNetworkStatus().then(online => {
      //   this.online = online
      // }).finally(() => {
      //   this.$store.dispatch('pageLoaded', false)
      // })
    },
    showOffline() {
      this.online = false
    }
  },
  beforeCreate() {
    window._GAMECENTER_RESTORE = {}
  },
  beforeUnmount() {
    window._GAMECENTER_RESTORE = null
    this.$store.dispatch('pageLoaded', false)
  }
}
</script>

<style scoped lang="scss">
</style>
