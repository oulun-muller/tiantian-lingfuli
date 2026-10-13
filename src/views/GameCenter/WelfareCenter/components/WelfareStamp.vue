<template>
  <!-- 稿 200:21113 今日已领 / 226:26213 已抢空 / 327:14572 限量 — 斜置印章复用 -->
  <span class="welfare-stamp" :class="`welfare-stamp--${variant}`" aria-hidden="true">
    <img class="welfare-stamp__plate" :src="labelImage" alt="" />
  </span>
</template>

<script>
import defaultLabel from '../image/welfare-label-default.png'
import soldoutLabel from '../image/welfare-label-soldout.png'
import limitedLabel from '../image/welfare-label-limited.png'

export default {
  name: 'WelfareStamp',
  props: {
    /** claimed = 今日已领；soldout = 已抢空；limited = 限量 */
    variant: { type: String, default: 'claimed' }
  },
  computed: {
    labelImage() {
      if (this.variant === 'soldout') return soldoutLabel
      if (this.variant === 'limited') return limitedLabel
      return defaultLabel
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-stamp {
  position: absolute;
  right: -0.5px;
  bottom: -0.5px;
  width: 114px;
  height: 90px;
  pointer-events: none;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welfare-stamp__plate {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
