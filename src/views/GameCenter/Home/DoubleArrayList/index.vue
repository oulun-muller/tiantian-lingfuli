<template>
  <div>
    <DoubleArrayListPad v-if="$isPadDevice" :module-data="moduleData"/>
    <DoubleArrayListPc v-else :module-data="moduleData"/>
  </div>
</template>

<script>
import DoubleArrayListPad from './DoubleArrayListPad/index.vue'

import DoubleArrayListPc from './DoubleArrayListPc/index.vue'
export default {
  name: 'DoubleArrayLis',
  components: {
    DoubleArrayListPad,
    DoubleArrayListPc
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

<style scoped lang="scss">
</style>
