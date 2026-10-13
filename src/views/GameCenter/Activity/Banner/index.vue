<template>
  <BannerPad v-if="$isPadDevice" v-bind="$props" />
  <BannerPc2 v-else-if="baseInfo && baseInfo.bannerTemplateType=== '2'" v-bind="$props" />
  <BannerPc1 v-else v-bind="$props" />
</template>
<script>
import BannerPad from './BannerPad.vue'
import BannerPc1 from './BannerPc1.vue'
import BannerPc2 from './BannerPc2.vue'
export default {
  name: 'Banner',
  components: { BannerPad, BannerPc1, BannerPc2 },
  props: {
    allPrizeIds: {
      default: null,
      type: Array
    },
    prizeDraw: {
      default: null,
      type: Object
    },
    baseInfo: {
      default: null,
      type: Object
    },
    firstLocal: {
      default: '',
      type: String
    },
    secondLocal: {
      default: '',
      type: String
    },
    thirdLocal: {
      default: '',
      type: String
    },
    plateNameReport: {
      default: '',
      type: String
    }
  }
}
</script>
