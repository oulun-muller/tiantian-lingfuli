<template>
  <SlotMachinePad v-if="$isPadDevice" v-bind="$props" @refreshPage="$emit('refreshPage')" @scroll-to-purchase="$emit('scroll-to-purchase', $event)" @toLenovoLogin="$emit('toLenovoLogin')" ref="inner" />
  <SuperDraw v-else v-bind="$props" @refreshPage="$emit('refreshPage')" @scroll-to-purchase="$emit('scroll-to-purchase', $event)" @toLenovoLogin="$emit('toLenovoLogin')" ref="inner" :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish" />
</template>

<script>
import SuperDraw from '../SuperDraw'
import SlotMachinePad from './SlotMachinePad.vue'

export default {
  name: 'SlotMachine',
  components: { SlotMachinePad, SuperDraw },
  emits: ['refreshPage', 'scroll-to-purchase', 'toLenovoLogin'],
  props: {
    allPrizeIds: { type: Array, default: null },
    prizeDraw: { type: Object, default: null },
    baseInfo: { type: Object, default: null },
    firstLocal: { type: String, default: '' },
    secondLocal: { type: String, default: '' },
    thirdLocal: { type: String, default: '' },
    plateNameReport: { type: String, default: '' },
    // 仅预购 PC 页开启，普通活动默认关闭。
    scrollToPurchaseOnFinish: { type: Boolean, default: false }
  },
  methods: { refresh() { this.$refs.inner?.refresh() } }
}
</script>
