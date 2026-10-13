<template>
  <!-- 稿 193:19783 领ta / 200:22293 已抢完 -->
  <div
    v-exposure="exposureAction ? { handler: () => reportSingleShow(), once: true } : null"
    class="welfare-offer"
    :class="{
      'is-soldout': showSoldoutStamp,
      'is-claimed': showClaimedStamp,
      'has-date': !!dateText
    }">
    <div class="welfare-offer__panel">
      <div class="welfare-offer__top">
        <span v-if="badgeText" class="welfare-offer__badge">{{ badgeText }}</span>
        <div class="welfare-offer__art">
          <img :src="cover" alt="" @error="onImgError" />
        </div>
        <WelfareStamp v-if="showStamp && showClaimedStamp" variant="claimed" />
        <WelfareStamp v-else-if="showStamp && showSoldoutStamp" variant="soldout" />
        <WelfareStamp v-else-if="showStamp && showLimitedStamp" variant="limited" />
      </div>
      <div class="welfare-offer__bottom">
        <p class="welfare-offer__name">
          <span class="welfare-offer__name-text">{{ item.name }}</span>
        </p>
        <div class="welfare-offer__action">
          <WelfareActionBtn
            :variant="actionVariant"
            :label="actionLabel"
            :disabled="actionDisabled"
            @click="onAction" />
        </div>
      </div>
    </div>

    <p v-if="dateText" class="welfare-offer__date">{{ dateText }}</p>
  </div>
</template>

<script>
import WelfareActionBtn from './WelfareActionBtn.vue'
import WelfareStamp from './WelfareStamp.vue'
import mockPrize from '../image/mock-prize.png'
import { SELF_TEST_RESERVE_ALWAYS } from '../welfareSelfTest'
import { reportWelfarePv, benefitsDetail, getLid, todayBtnStatus } from '@/utils/welfareTrack'

export default {
  name: 'WelfareOfferCard',
  components: { WelfareActionBtn, WelfareStamp },
  props: {
    item: { type: Object, required: true },
    /** 底部日期，如 2026/10/25 */
    dateText: { type: String, default: '' },
    /**
     * claim | remind | view
     * 不传则按 item 状态自动推
     */
    mode: { type: String, default: '' },
    /** 该条领取请求进行中，按钮不可点 */
    claiming: { type: Boolean, default: false },
    /** 覆盖默认按钮文案（如领取成功弹窗的「知道了」） */
    actionLabelOverride: { type: String, default: '' },
    /** 领取成功弹窗不展示状态印章 */
    showStamp: { type: Boolean, default: true },
    /** 单条真实曝光 action 名，空则不上报 */
    exposureAction: { type: String, default: '' },
    /** 单条曝光的 btnStatus，空则不带 */
    exposureBtnStatus: { type: String, default: '' }
  },
  emits: ['claim', 'remind', 'view'],
  data() {
    return {
      imgBroken: false,
      fallbackImg: mockPrize
    }
  },
  computed: {
    cover() {
      if (this.imgBroken) return this.fallbackImg
      return this.item.imageUrl || this.fallbackImg
    },
    isSoldOut() {
      return !!this.item.soldOut
    },
    isClaimed() {
      return Number(this.item.receiveStatus) === 1
    },
    isExhausted() {
      return Number(this.item.receiveStatus) === 2
    },
    showSoldoutStamp() {
      return this.isSoldOut && !this.isClaimed
    },
    showClaimedStamp() {
      // 这条今日已领就打章；多种都领了则每张已领卡都打，互不影响
      return this.isClaimed
    },
    showLimitedStamp() {
      return this.item.isLimited === true || Number(this.item.isLimited) === 1
    },
    openTimeLabel() {
      if (!this.item?.receiveStartTime) return ''
      return `${String(this.item.receiveStartTime).slice(0, 5)}开抢`
    },
    isNotOpen() {
      if (!this.item?.receiveStartTime || this.isSoldOut || this.isClaimed || this.isExhausted) {
        return false
      }
      const [hh = '0', mm = '0', ss = '0'] = String(this.item.receiveStartTime).split(':')
      const now = new Date()
      const open = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +hh, +mm, +ss)
      return open.getTime() > Date.now()
    },
    badgeText() {
      // 仅未开抢时出红标；可领态不出
      if (this.isSoldOut || this.isClaimed || this.isExhausted) return ''
      if (this.isNotOpen || this.mode === 'remind') return this.openTimeLabel
      return ''
    },
    actionVariant() {
      if (this.isExhausted) return 'exhausted'
      if (this.isClaimed) return 'view'
      if (this.isSoldOut) return 'soldout'
      // 自测：提醒态永远可点「提醒我」
      if (SELF_TEST_RESERVE_ALWAYS && this.mode === 'remind') return 'remind'
      // 领取弹窗未开抢：灰按钮「08:30开抢」；下期列表才是「提醒我」
      if (this.isNotOpen) {
        return this.mode === 'remind' && !this.item.reserved ? 'remind' : 'notopen'
      }
      if (this.mode === 'remind') {
        return this.item.reserved ? 'notopen' : 'remind'
      }
      return 'claim'
    },
    actionLabel() {
      if (this.actionLabelOverride) return this.actionLabelOverride
      // 空 label 交给 WelfareActionBtn 按 exhausted 统一提供文案。
      if (this.isExhausted) return ''
      if (this.isClaimed) return '查看'
      if (this.isSoldOut) return '已抢完'
      if (SELF_TEST_RESERVE_ALWAYS && this.mode === 'remind') return '提醒我'
      // 即将开抢：已预约固定文案，不再显示开抢时间
      if (this.mode === 'remind' && this.item.reserved) return '已预约'
      if (this.isNotOpen) {
        if (this.mode === 'remind') return '提醒我'
        return this.openTimeLabel || '未开抢'
      }
      if (this.mode === 'remind') return '提醒我'
      return '领ta'
    },
    actionDisabled() {
      // 已领取「查看」可点，即使同时 soldOut 也不禁（文案已是查看）
      if (this.isClaimed || this.actionVariant === 'view') return false
      if (this.claiming && this.mode !== 'remind') return true
      if (SELF_TEST_RESERVE_ALWAYS && this.mode === 'remind') return false
      if (this.isExhausted || this.isSoldOut) return true
      if (this.isNotOpen && this.mode !== 'remind') return true
      if (this.mode === 'remind' && (this.item.reserved || this.actionVariant === 'notopen')) return true
      return false
    }
  },
  watch: {
    'item.imageUrl'() {
      this.imgBroken = false
    }
  },
  methods: {
    onImgError() {
      this.imgBroken = true
    },
    reportSingleShow() {
      const extra = {}
      if (this.exposureAction) {
        extra.btnStatus =
          this.actionVariant === 'view' || this.isClaimed
            ? 'claimed'
            : this.exposureBtnStatus || todayBtnStatus(this.item)
      }
      reportWelfarePv(this, this.exposureAction, {
        detail: benefitsDetail(this.item, extra, this)
      })
    },
    onAction() {
      if (this.actionDisabled) return
      if (this.claiming && this.actionVariant === 'claim') return
      if (this.actionVariant === 'view') {
        this.$emit('view', this.item)
        return
      }
      if (this.actionVariant === 'remind') {
        this.$emit('remind', this.item)
        return
      }
      this.$emit('claim', this.item)
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-offer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 200px;
  min-width: 0;
}

.welfare-offer__panel {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.welfare-offer__frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  z-index: 0;
}

.welfare-offer__top {
  position: relative;
  isolation: isolate;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.welfare-offer__top::before,
.welfare-offer__bottom::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-style: solid;
  border-color: transparent;
  border-image-repeat: stretch;
}

.welfare-offer__top::before {
  border-width: 22.4px 48.64px 53.76px 55.68px;
  border-image-source: url('../image/claim-card-top.png');
  border-image-slice: 70 152 168 174 fill;
  border-image-width: 22.4px 48.64px 53.76px 55.68px;
}

.welfare-offer__top::after {
  content: '';
  position: absolute;
  inset: 5.16px 13.96px 7.48px 22.56px;
  z-index: -1;
  pointer-events: none;
  background: url('../image/claim-highlight.svg') center / 100% 100% no-repeat;
  transform: rotate(180deg);
}

.welfare-offer__badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 4;
  padding: 0 8px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  background: #ee5555;
  color: #f5f5f5;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.welfare-offer__art {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center bottom;
  }
}

.welfare-offer.is-soldout .welfare-offer__art img {
  opacity: 0.3;
}

.welfare-offer__bottom {
  position: relative;
  isolation: isolate;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.welfare-offer__bottom::before {
  bottom: 2px;
  border-width: 0 51.84px 28.8px 52.48px;
  border-image-source: url('../image/claim-card-bottom.png');
  border-image-slice: 0 162 90 164 fill;
  border-image-width: 0 51.84px 28.8px 52.48px;
}

.welfare-offer__name {
  position: relative;
  z-index: 1;
  margin: 0;
  padding: 8px;
  min-height: 58px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.25;
  text-align: center;
}

.welfare-offer__name-text {
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.welfare-offer__action {
  position: relative;
  z-index: 1;
  margin-top: auto;
  width: 100%;
  padding: 8px 12px 20px;
  box-sizing: border-box;
}

.welfare-offer__date {
  margin: 0;
  padding: 8px 16px;
  width: 100%;
  box-sizing: border-box;
  color: #fff;
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}
</style>
