<template>
  <div :class="['App', isPhoneDevice ? 'PhoneDevice' : (isPadDevice ? 'PadDevice' : 'PcDevice'), channelClass]">
    <router-view />
    <PageLoading v-if="pageLoading" />
  </div>
</template>

<script>
import { computed, getCurrentInstance, onMounted } from 'vue'
import { useStore } from 'vuex'
import PageLoading from '@/components/PageLoading/index.vue'

export default {
  name: 'App',
  components: { PageLoading },
  setup() {
    const store = useStore()
    const instance = getCurrentInstance()
    const gp = instance?.appContext?.config?.globalProperties || {}
    const pageLoading = computed(() => store.state.pageLoading?.status)
    onMounted(() => {
      store.dispatch('pageLoaded', false)
    })
    return {
      pageLoading,
      isPadDevice: gp.$isPadDevice,
      isPhoneDevice: gp.$isPhoneDevice
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user?.userInfo
    },
    channelClass() {
      const channel = this.$route.query?.fromChannelName || 'LegionZone'
      return `Channel_${channel}`
    }
  },
  watch: {
    userInfo: {
      handler() {
        this.$store.dispatch('softwareStatePad/clearGASoft').catch(() => {})
      }
    }
  }
}
</script>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
.App {
  width: 100%;
  min-height: 100%;
}
</style>
