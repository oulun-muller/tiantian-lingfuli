<!-- <template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style> -->

<template>
  <div>
    <PadRightBanner v-if="$isPadDevice" :module-data="moduleData"/>
    <PcRightBanner v-else :module-data="moduleData"/>
  </div>
</template>

<script>
import PcRightBanner from './pcRightBanner'

import PadRightBanner from './padRightBanner'
export default {
  name: 'LeftBanner',
  components: {
    PcRightBanner,
    PadRightBanner
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
