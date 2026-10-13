<template>
  <SuperDrawPad v-if="$isPadDevice" @toLenovoLogin="toLenovoLogin" v-bind="$props" @refresh-page="$emit('refreshPage')" ref="inner" />
  <SuperDrawPc v-else @toLenovoLogin="toLenovoLogin" v-bind="$props" @refresh-page="$emit('refreshPage')" ref="inner" :task-module-template-type="baseInfo.taskModuleTemplateType" :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish" />
</template>
<script>
import SuperDrawPad from './SuperDrawPad.vue'
import SuperDrawPc from './SuperDrawPc.vue'
export default {
  name: 'SuperDraw',
  components: { SuperDrawPad, SuperDrawPc },
  emits: ['refreshPage', 'toLenovoLogin'],
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
    },
    // 仅预购 PC 页开启，普通活动默认关闭。
    scrollToPurchaseOnFinish: {
      default: false,
      type: Boolean
    }
  },
  methods: {
    refresh() {
      this.$refs.inner?.refresh()
    },
    toLenovoLogin() {
      this.$emit('toLenovoLogin')
    }
  }
}
</script>
