
<template>
  <GameDetailPhone v-if="$isPhoneDevice" @headerStatus="headerStatus"/>
  <GameDetailPad v-else @headerStatus="headerStatus"/>
</template>

<script>
import GameDetailPad from './main.vue'

import GameDetailPhone from '@/views/mobile/DetailPhone/index.vue'
export default {
  name: 'GameDetail',
  components: {
    GameDetailPad,
    GameDetailPhone
  },
  props: {},
  mounted() {
  },
  data() {
    return {
    }
  },
  methods: {
    headerStatus(val) {
      this.$emit('headerStatus', val)
    }
  }
}
</script>

<style scoped lang="scss">
</style>
