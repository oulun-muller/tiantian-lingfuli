<template>
  <!-- 稿 200:20946 — 标题「今日可领」复用 -->
  <div class="welfare-section-title">
    <img class="welfare-section-title__brace welfare-section-title__brace--left" :src="braceLeft" alt="" aria-hidden="true" />
    <h2 class="welfare-section-title__text">{{ title }}</h2>
    <span v-if="limitText" class="welfare-section-title__limit">{{ limitText }}</span>
    <img class="welfare-section-title__brace welfare-section-title__brace--right" :src="braceRight" alt="" aria-hidden="true" />
  </div>
</template>

<script>
import braceLeft from '../image/icon-brace-left.png'
import braceRight from '../image/icon-brace-right.png'

export default {
  name: 'WelfareSectionTitle',
  props: {
    title: { type: String, default: '今日可领' },
    /** 如「限领一个」；空则不展示黄标 */
    limitText: { type: String, default: '' }
  },
  data() {
    return { braceLeft, braceRight }
  }
}
</script>

<style lang="scss" scoped>
.welfare-section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.welfare-section-title__brace {
  width: 8px;
  height: 12px;
  flex-shrink: 0;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.welfare-section-title__text {
  margin: 0;
  color: #fff;
  font-family: "YouSheBiaoTiHei", sans-serif !important;
  font-size: 32px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.welfare-section-title__limit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  height: 22px;
  background: #ee5555;
  color: #121212;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}
</style>
