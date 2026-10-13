<template>
  <section class="upcoming">
    <WelfareSectionTitle class="upcoming__section-title" title="即将开始" />
    <div v-if="loading && !list.length" class="upcoming__grid upcoming__grid--skeleton" :style="cardWidthStyle" aria-busy="true">
      <WelfareSkeletonCard v-for="index in 4" :key="index" class="upcoming__card" />
    </div>
    <p v-else-if="!list.length" class="upcoming__empty">暂无即将开抢的福利</p>
    <div
      v-else
      v-exposure="{ handler: () => reportOverall(), once: false }"
      class="upcoming__grid"
      :style="cardWidthStyle">
      <div v-for="item in displayList" :key="item.resourceId" class="upcoming__card upcoming__card-wrap">
        <WelfareOfferCard
          :item="item"
          mode="remind"
          :date-text="cardDateText"
          exposure-action="LZ_welfareUpcomingSingleShow"
          :exposure-btn-status="upcomingBtnStatus(item)"
          @remind="$emit('remind', $event)" />
        <WelfareSkeletonCard v-if="loading" class="welfare-skeleton--overlay" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<script>
import WelfareOfferCard from './WelfareOfferCard.vue'
import WelfareSectionTitle from './WelfareSectionTitle.vue'
import WelfareSkeletonCard from './WelfareSkeletonCard.vue'
import { upcomingBtnStatus, reportWelfarePv } from '@/utils/welfareTrack'

export default {
  name: 'UpcomingGrid',
  components: { WelfareOfferCard, WelfareSectionTitle, WelfareSkeletonCard },
  props: {
    list: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    cardWidth: { type: Number, default: 120 },
    /** 活动 DTO 的 startTime，卡片下方日期用它 */
    startTime: { type: [String, Number], default: '' }
  },
  emits: ['remind'],
  computed: {
    displayList() {
      return this.list.slice(0, 4)
    },
    cardWidthStyle() {
      return { '--welfare-offer-width': `${this.cardWidth}px` }
    },
    cardDateText() {
      return this.formatDate(this.startTime)
    }
  },
  methods: {
    reportOverall() {
      if (!this.list.length) return
      reportWelfarePv(this, 'LZ_welfareUpcomingOverallShow')
    },
    upcomingBtnStatus,
    formatDate(raw) {
      if (raw == null || raw === '') return ''
      // 毫秒时间戳
      if (typeof raw === 'number' || /^\d{10,13}$/.test(String(raw))) {
        const n = Number(raw)
        const ms = String(raw).length <= 10 ? n * 1000 : n
        const d = new Date(ms)
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}/${m}/${day}`
        }
      }
      const m = String(raw).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (m) {
        return `${m[1]}/${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}`
      }
      return String(raw).slice(0, 10).replace(/-/g, '/')
    }
  }
}
</script>

<style lang="scss" scoped>
.upcoming {
  padding: 0;
  width: 100%;
  /* 稿 341:4102：内容区域最大宽度 1280（含左右各 16 内边距） */
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
}
.upcoming__empty {
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  text-align: center;
}
.upcoming__section-title {
  padding-bottom: 0;
  margin-top: 16px;
}
/* 与今日可领等宽；列数随容器自动变化，每一行不足时保持居中。 */
.upcoming__grid {
  margin-top: 0;
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px 8px;
  justify-content: center;
}
.upcoming__grid--skeleton {
  position: relative;
  z-index: 10;
  isolation: isolate;
  min-height: 576px;
  background: #121212;
}
.upcoming__card {
  flex: 0 0 var(--welfare-offer-width);
  width: var(--welfare-offer-width);
  min-width: 120px;
  max-width: 200px;
}
.upcoming__card-wrap {
  position: relative;
  overflow: hidden;
}

</style>
