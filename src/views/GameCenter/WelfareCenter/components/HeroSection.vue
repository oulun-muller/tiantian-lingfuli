<template>
  <section class="hero" :class="{ 'is-landscape': landscape }">
    <WelfareSectionTitle
      class="hero__section-title"
      title="今日可领"
      :limit-text="limitBadge" />

    <div v-if="loading && !list.length" class="hero__grid hero__grid--skeleton" :style="cardWidthStyle" aria-busy="true">
      <WelfareSkeletonCard v-for="index in 4" :key="index" class="hero__card" />
    </div>
    <div v-else-if="!list.length" class="hero__empty">暂无可领取的福利</div>
    <div
      v-else
      v-exposure="{ handler: () => reportOverall(), once: false }"
      class="hero__grid"
      :style="cardWidthStyle">
      <div v-for="item in list" :key="item.activityItemId || item.resourceId" class="hero__card hero__card-wrap">
        <WelfareOfferCard
          :item="item"
          mode="claim"
          :claiming="!!claimingIds[item.activityItemId]"
          exposure-action="LZ_welfareTodaySingleShow"
          :exposure-btn-status="todayBtnStatus(item)"
          @claim="$emit('claim', $event)"
          @remind="$emit('remind', $event)"
          @view="$emit('view', $event)" />
        <WelfareSkeletonCard v-if="loading" class="welfare-skeleton--overlay" aria-hidden="true" />
      </div>
    </div>

  </section>
</template>

<script>
import WelfareOfferCard from './WelfareOfferCard.vue'
import WelfareSectionTitle from './WelfareSectionTitle.vue'
import WelfareSkeletonCard from './WelfareSkeletonCard.vue'
import { todayBtnStatus, reportWelfarePv } from '@/utils/welfareTrack'

export default {
  name: 'HeroSection',
  components: { WelfareOfferCard, WelfareSectionTitle, WelfareSkeletonCard },
  props: {
    list: { type: Array, default: () => [] },
    dailyReceiveLimit: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
    landscape: { type: Boolean, default: false },
    cardWidth: { type: Number, default: 120 },
    claimingIds: { type: Object, default: () => ({}) }
  },
  emits: ['claim', 'remind', 'view'],
  computed: {
    dailyLimit() {
      return this.dailyReceiveLimit || 0
    },
    limitBadge() {
      // 无活动 / 活动下无福利：不展示「限领几个」
      if (!this.dailyLimit || !this.list.length) return ''
      return this.dailyLimit === 1 ? '限领一个' : `限领${this.dailyLimit}个`
    },
    cardWidthStyle() {
      return { '--welfare-offer-width': `${this.cardWidth}px` }
    }
  },
  methods: {
    todayBtnStatus,
    reportOverall() {
      if (!this.list.length) return
      reportWelfarePv(this, 'LZ_welfareTodayOverallShow')
    }
  }
}
</script>

<style lang="scss" scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
  color: #fff;
  box-sizing: border-box;
  width: 100%;
}
.hero__section-title {
  padding: 0;
  box-sizing: border-box;
}
.hero__empty {
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.6);
}
/*
  今日可领：左右横滑；未占满时居中，溢出时可从左侧滑。
  卡间距用卡片自身左右外边距（各 4）而不用 gap。
*/
.hero__grid {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
  &::before,
  &::after {
    content: '';
    margin: auto;
  }
}
.hero__grid--skeleton {
  position: relative;
  z-index: 10;
  isolation: isolate;
  flex: 0 0 auto;
  min-height: 280px;
  background: #121212;
}
.hero__card {
  flex: 0 0 var(--welfare-offer-width);
  width: var(--welfare-offer-width);
  min-width: 120px;
  max-width: 200px;
  margin: 0 4px;
}
.hero__card-wrap {
  position: relative;
  overflow: hidden;
}

/* 我的福利入口：中央 356×56，两侧装饰线仅宽屏出现 */
.hero__mine-wrap {
  width: 100%;
  padding: 16px 58px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  overflow: hidden;
}
.hero__ornament {
  width: 288px;
  height: 41px;
  flex-shrink: 0;
  display: none;
}
.hero__mine {
  position: relative;
  width: 356px;
  max-width: 100%;
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f5f5f5;
  cursor: pointer;
  overflow: hidden;
}
.hero__mine-border {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}
.hero__mine-gift {
  position: relative;
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.hero__mine-text {
  position: relative;
  font-family: "YouSheBiaoTiHei", sans-serif !important;
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  color: #f5f5f5;
}
.hero__mine-arrow {
  position: relative;
  width: 16px;
  height: 16px;
}

@media screen and (min-width: 1100px) {
  .hero__ornament {
    display: block;
  }
}

@media screen and (max-width: 380px) {
  .hero__mine-wrap {
    padding: 16px;
  }
  .hero__mine-text {
    font-size: 20px;
  }
}
</style>
