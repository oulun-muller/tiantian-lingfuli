<!-- <template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style> -->
<template>
  <div>
    <HorizontalListPhone v-if="$isPhoneDevice" :module-data="moduleData"/>
    <HorizontalListPad v-else-if="$isPadDevice" :module-data="moduleData"/>
    <HorizontalListPc v-else :module-data="moduleData"/>
  </div>
</template>

<script>
import HorizontalListPad from './HorizontalListPad'

import HorizontalListPc from './HorizontalListPc'
import HorizontalListPhone from './HorizontalListPhone'
export default {
  name: 'LeftBanner',
  components: {
    HorizontalListPad,
    HorizontalListPc,
    HorizontalListPhone
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
