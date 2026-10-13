<template>
  <button type="button" class="welfare-entry" @click="toWelfareCenter">
    <img class="welfare-entry__gif" :src="giftIcon" alt="天天领好礼" />
  </button>
</template>

<script>
import giftIcon from '../image/welfare-entry-gift.gif'
import { reportWelfareClick, reportWelfarePv } from '@/utils/welfareTrack'

export default {
  name: 'WelfareEntry',
  data() {
    return { giftIcon }
  },
  mounted() {
    reportWelfarePv(this, 'LZ_welfareEntranceShow', { entryType: 'homeTop' })
  },
  methods: {
    toWelfareCenter() {
      reportWelfareClick(this, 'LZ_welfareHomeEntranceClick')
      this.$router.replace({ path: '/gameCenter/welfareCenter', query: { from: 'gift' } })
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-entry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}
.welfare-entry__gif {
  display: block;
  width: auto;
  height: 32px;
  object-fit: contain;
}
</style>
