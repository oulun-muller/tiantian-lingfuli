<template>
  <div v-if="moduleData">
    <RecentGamePad
      ref="recentGamePad"
      v-if="$isPadDevice || $isPhoneDevice"
      :module-data="moduleData"
      :recent-games="recentGames"/>
  </div>
</template>

<script>
import { getRecentGameList } from '@/nativeApiPad/common.js'
import RecentGamePad from './RecentGamePad/index.vue'

export default {
  name: 'RecentGame',
  data() {
    return {
      recentGames: []
    }
  },
  components: {
    RecentGamePad
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  mounted() {
    console.log('最近玩过的游戏数据1')
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      console.log('接口没反应，10s后消失')
      this.markReady()
      this.handleIsLoading()
    }, 10000)

    try {
      getRecentGameList().then(res => {
        // console.log('最近玩过的游戏数据2', res)
        if (res) {
          this.recentGames = JSON.parse(res)
          if (this.recentGames?.length) {
            this.recentGames = this.recentGames.slice(0, 10)
          }
        } else {
          this.recentGames = []
        }
      }).finally(() => {
        this.markReady()
        this.handleIsLoading()
      })
    } catch (error) {
      this.markReady()
      this.handleIsLoading()
      this.recentGames = []
    }
  },
  methods: {
    markReady() {
      if (this.$refs.recentGamePad) {
        this.$refs.recentGamePad.ready = true
      }
    },
    handleIsLoading() {
      if (this.$refs.recentGamePad && this.$refs.recentGamePad.isLoading === true) {
        this.$refs.recentGamePad.isLoading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
</style>
