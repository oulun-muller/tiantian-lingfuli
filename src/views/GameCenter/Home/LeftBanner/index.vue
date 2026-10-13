<!-- <template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style> -->
<template>
  <div>
    <PadLeftBanner v-if="$isPadDevice" :module-data="moduleData"/>
    <PcLeftBanner v-else :module-data="moduleData"/>
  </div>
</template>

<script>
import PcLeftBanner from './pcLeftBanner'

import PadLeftBanner from './padLeftBanner'
export default {
  name: 'LeftBanner',
  components: {
    PcLeftBanner,
    PadLeftBanner
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  mounted() {
  },
  data() {
    return {
    }
  }
}
</script>
