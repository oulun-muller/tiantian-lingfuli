<template>
  <!-- 稿 79:1793 竖屏 / 601:9850 横屏：推荐弹窗（天天领好礼） -->
  <div
    v-if="visible"
    class="welfare-rec"
    :class="[landscape ? 'is-landscape' : 'is-portrait', phone ? 'is-phone' : '']"
    @click.self="onClose">
    <div class="welfare-rec__content">
      <div class="welfare-rec__heading">
        <h2 class="welfare-rec__title">天天领好礼</h2>
        <p class="welfare-rec__sub">每日来就送，福利天天有</p>
      </div>

      <div class="welfare-rec__inner">
        <span v-if="limitBadge" class="welfare-rec__limit">{{ limitBadge }}</span>
        <div class="welfare-rec__cards">
          <WelfareOfferCard
            v-for="item in displayList"
            :key="item.activityItemId || item.resourceId"
            class="welfare-rec__card"
            :item="item"
            mode="claim"
            :claiming="!!claimingIds[item.activityItemId]"
            @claim="onClaim"
            @view="onView" />
        </div>
      </div>

      <button type="button" class="welfare-rec__close" aria-label="关闭" @click="onClose">
      <img :src="closeIcon" alt="" />
      </button>
    </div>
  </div>
</template>

<script>
import WelfareOfferCard from './WelfareOfferCard.vue'
import closeIcon from '../image/icon-close.svg'

export default {
  name: 'WelfareRecommendPopup',
  components: { WelfareOfferCard },
  props: {
    visible: { type: Boolean, default: false },
    list: { type: Array, default: () => [] },
    dailyReceiveLimit: { type: Number, default: 0 },
    landscape: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    claimingIds: { type: Object, default: () => ({}) }
  },
  emits: ['close', 'claim', 'view'],
  data() {
    return { closeIcon }
  },
  computed: {
    dailyLimit() {
      return this.dailyReceiveLimit || 0
    },
    limitBadge() {
      if (!this.dailyLimit) return ''
      return this.dailyLimit === 1 ? '每日限领一个' : `每日限领${this.dailyLimit}个`
    },
    /** 弹窗最多 4 个：竖屏 2×2，横屏 1×4 */
    displayList() {
      return (Array.isArray(this.list) ? this.list : []).slice(0, 4)
    }
  },
  methods: {
    onClose() {
      this.$emit('close')
    },
    onClaim(item) {
      if (!item) return
      this.$emit('claim', item)
    },
    onView(item) {
      this.$emit('view', item)
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-rec {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-sizing: border-box;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: none;
}

.welfare-rec::before,
.welfare-rec::after {
  content: '';
  position: absolute;
  z-index: 0;
  width: 13.8667vw;
  height: 100vw;
  left: 50%;
  background: url('../image/welfare-recommend-background.png') center / 100% 100% no-repeat;
  pointer-events: none;
}

.welfare-rec::before {
  top: calc(-50vw + 6.93335vw);
  transform: translateX(-50%) rotate(90deg);
}

.welfare-rec::after {
  top: calc(100% - 50vw - 6.93335vw);
  transform: translateX(-50%) rotate(-90deg);
}

.welfare-rec__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: 100%;
  max-width: 460px;
  max-height: 100%;
  padding: clamp(72px, 10vh, 140px) 0 clamp(120px, 16vh, 220px);
  box-sizing: border-box;
}

.welfare-rec.is-phone.is-portrait .welfare-rec__content {
  gap: 0;
  padding: 0;
}

.welfare-rec__heading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.welfare-rec__title {
  margin: 0;
  font-size: 36px;
  font-weight: 900;
  line-height: 1.2;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.6) 15%, #f5f5f5 76%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  @supports not (background-clip: text) {
    color: #f5f5f5;
  }
}
.welfare-rec__sub {
  margin: 0;
  color: #f5f5f5;
  font-size: 16px;
  line-height: 1.5;
}

.welfare-rec__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: calc(100% - 32px);
  margin: 16px 16px 0;
}

.welfare-rec__limit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 8px;
  height: 22px;
  background: #ee5555;
  color: #101826;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.welfare-rec__cards {
  position: relative;
  z-index: 1;
  display: grid;
  width: 100%;
  max-width: 440px;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  box-sizing: border-box;
  overflow: visible;
}
.welfare-rec.is-portrait .welfare-rec__cards {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.welfare-rec.is-phone.is-portrait .welfare-rec__cards {
  width: 272px;
  max-width: calc(100vw - 32px);
  grid-template-columns: repeat(2, 132px);
  padding: 16px;
}

.welfare-rec__card:only-child {
  grid-column: 1 / -1;
  justify-self: center;
}
.welfare-rec.is-landscape .welfare-rec__cards {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
}
.welfare-rec__card {
  width: 100%;
  min-width: 0;
  max-width: 200px;
  justify-self: center;
}

.welfare-rec__close {
  position: relative;
  z-index: 2;
  width: 24px;
  height: 24px;
  padding: 0;
  margin: 24px 0 0;
  border: 0;
  background: transparent;
  flex-shrink: 0;
  cursor: pointer;
  img {
    width: 24px;
    height: 24px;
    display: block;
  }
}

/* 横屏：内容加宽，卡片单行横排 */
.welfare-rec.is-landscape {
  &::before,
  &::after {
    top: 0;
    left: auto;
    width: 13.8667vh;
    height: 100vh;
    background-size: 100% 100%;
    transform: none;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
    transform: scaleX(-1);
  }

  .welfare-rec__content {
    max-width: 100%;
    padding: 0;
  }

  .welfare-rec__cards {
    max-width: 832px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media screen and (max-width: 380px) {
  .welfare-rec.is-portrait .welfare-rec__title {
    font-size: 32px;
  }

}
</style>
