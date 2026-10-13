<template>
  <Teleport to="body">
    <Transition
      name="welfare-reward"
      appear
      @before-enter="beforeEnter"
      @after-enter="afterEnter"
      @after-leave="afterLeave">
      <div
        v-if="visible"
        ref="dialog"
        class="welfare-claim"
        :class="{ 'is-streak': displayedVariant === 'streak' }"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welfare-reward-title"
        tabindex="-1"
        @keydown="onKeydown"
        @click.self="onClose">
        <div class="welfare-claim__stage" @click.self="onClose">
          <header class="welfare-claim__heading">
            <h2 id="welfare-reward-title">恭喜获得</h2>
            <p v-if="displayedVariant === 'streak'" class="welfare-claim__subtitle">
              <span>连领</span><strong>{{ displayedDays }}</strong><span>天奖励</span>
            </p>
            <p v-else class="welfare-claim__subtitle">今日好礼</p>
          </header>
          <article class="welfare-claim__card" aria-label="获得的福利">
            <div class="welfare-claim__reward">
              <div class="welfare-claim__medallion">
                <img class="welfare-claim__ring" :src="ringImage" alt="" aria-hidden="true" />
                <div class="welfare-claim__gift" :class="{ 'is-coin': isCoin, 'is-accelerator': isAccelerator }">
                  <img :src="cover" :alt="rewardName" @error="imageBroken = true" />
                </div>
              </div>
              <div class="welfare-claim__name-box"><h3>{{ rewardName }}</h3></div>
              <div v-if="isAccelerator && displayedBonusDays > 0" class="welfare-claim__bonus-box">
                <p class="welfare-claim__bonus">新人专属福利：额外赠送{{ displayedBonusDays }}天时长</p>
              </div>
              <button ref="viewButton" type="button" class="welfare-claim__view" @click="onView">
                {{ isAccelerator ? '开心收下' : '查看' }}
              </button>
            </div>
            <p v-if="hint" class="welfare-claim__hint">{{ hint }}</p>
          </article>
          <button type="button" class="welfare-claim__close" aria-label="关闭领取弹窗" @click="onClose">
            <img :src="closeImage" alt="" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import closeImage from '../image/claim-success/icon-close.svg'
import ringImage from '../image/claim-success/daily-rewards-ring.svg'
import fallbackImage from '../image/products/tencent-qcoin.png'
import acceleratorImage from '../image/products/accelerator-vip.png'

export default {
  name: 'WelfareClaimSuccessPopup',
  props: {
    visible: { type: Boolean, default: false },
    item: { type: Object, default: null },
    landscape: { type: Boolean, default: false },
    variant: { type: String, default: 'today' },
    days: { type: Number, default: 0 },
    nextReward: { type: Object, default: null },
    rewardType: { type: String, default: 'standard' },
    acceleratorDays: { type: Number, default: 0 },
    bonusDays: { type: Number, default: 0 }
  },
  emits: ['close', 'view-prizes', 'closed'],
  data() {
    return {
      closeImage,
      ringImage,
      fallbackImage,
      displayedItem: null,
      displayedVariant: 'today',
      displayedDays: 0,
      displayedNextReward: null,
      displayedRewardType: 'standard',
      displayedAcceleratorDays: 0,
      displayedBonusDays: 0,
      imageBroken: false,
      previousFocus: null,
      pendingView: null,
      closing: false
    }
  },
  computed: {
    isAccelerator() { return this.displayedRewardType === 'accelerator' },
    cover() {
      if (this.isAccelerator) {
        return this.imageBroken ? acceleratorImage : this.displayedItem?.claimImageUrl || acceleratorImage
      }
      return this.imageBroken ? this.fallbackImage : this.displayedItem?.imageUrl || this.fallbackImage
    },
    rewardName() {
      if (this.isAccelerator && this.displayedAcceleratorDays > 0) return `${this.displayedAcceleratorDays}天加速时长`
      return this.displayedItem?.name || this.displayedItem?.resourceName || '福利奖励'
    },
    isCoin() { return !this.imageBroken && this.displayedItem?.imageKind === 'coin' },
    hint() {
      const reward = this.displayedNextReward
      if (!reward?.name || !(Number(reward.daysRemaining) > 0)) return ''
      return `再连领${reward.daysRemaining}天可领取【${reward.name}】`
    }
  },
  watch: {
    item: {
      immediate: true,
      handler(item) {
        if (!item) return
        this.displayedItem = { ...item }
        this.imageBroken = false
      }
    },
    visible: {
      immediate: true,
      handler(visible) {
        if (visible) {
          this.closing = false
          this.pendingView = null
          this.displayedVariant = this.variant
          this.displayedDays = this.days
          this.displayedNextReward = this.nextReward ? { ...this.nextReward } : null
          this.displayedRewardType = this.rewardType
          this.displayedAcceleratorDays = this.acceleratorDays
          this.displayedBonusDays = this.bonusDays
        }
      }
    }
  },
  methods: {
    beforeEnter() { this.previousFocus = document.activeElement },
    afterEnter() { this.$refs.viewButton?.focus({ preventScroll: true }) },
    afterLeave() {
      const item = this.pendingView
      this.pendingView = null
      this.closing = false
      this.displayedItem = null
      if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true })
      this.previousFocus = null
      if (item) this.$emit('view-prizes', item)
      this.$emit('closed')
    },
    onClose() {
      if (this.closing) return
      this.closing = true
      this.$emit('close')
    },
    onView() {
      if (this.closing) return
      if (!this.isAccelerator) this.pendingView = this.displayedItem
      this.onClose()
    },
    onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.onClose()
      }
      if (event.key !== 'Tab') return
      const buttons = this.$refs.dialog?.querySelectorAll('button')
      if (!buttons?.length) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  },
  beforeUnmount() {
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true })
  }
}
</script>

<style lang="scss" scoped>
.welfare-claim {
  /* Figma text-primary / border-subtle; motion added for this demo, no source keyframes. */
  --reward-text: #f5f5f5;
  --reward-gold: #ffde68;
  --reward-danger: #ee5555;
  --reward-border: #ffffff1f;
  --reward-enter: 1250ms;
  --reward-leave: 220ms;
  position: fixed;
  inset: 0;
  z-index: 1001;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #000c;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: var(--reward-text);
  font-family: sans-serif;
  button { font-family: inherit !important; }
}
.welfare-claim__stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  min-height: 100vh;
  min-height: 100dvh;
  padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
  box-sizing: border-box;
  transform-origin: 50% 50%;
}
.welfare-claim__heading {
  flex-shrink: 0;
  text-align: center;
  h2 { margin: 0; font-size: 32px; font-weight: 800; line-height: 48px; color: var(--reward-gold); }
}
.welfare-claim__subtitle {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 4px;
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  line-height: 36px;
  strong {
    font-family: 'Roboto', sans-serif;
    font-size: 40px;
    font-weight: 800;
    line-height: 47px;
    color: var(--reward-danger);
  }
}
.welfare-claim__card {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
  width: min(300px, 100%);
  padding: 12px;
  box-sizing: border-box;
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 -0.5px;
    z-index: -1;
    border: solid transparent;
    /* 320×320 @4x: source slices 48/64/96/64px → rendered edges 12/16/24/16px. */
    border-width: 12px 16px 24px;
    border-image-source: url('../image/claim-success/card-background-4x.png');
    border-image-slice: 48 64 96 fill;
    border-image-width: 12px 16px 24px;
    border-image-repeat: stretch;
    pointer-events: none;
  }
}
.welfare-claim__reward {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
}
.welfare-claim__medallion {
  position: relative;
  width: 160px;
  height: 160px;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  border: 0.5px solid #ffffff26;
  border-radius: 50%;
  background: #ff400026;
}
/* SVG export includes 2.5px of glyph overflow around the 142px Figma text-path frame. */
.welfare-claim__ring {
  position: absolute;
  left: 6px;
  top: 5.75px;
  transform-origin: center;
  animation: welfare-claim-ring-spin 24s linear infinite;
}
@keyframes welfare-claim-ring-spin {
  to { transform: rotate(360deg); }
}
.welfare-claim__gift {
  position: relative;
  width: 111px;
  height: 111px;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: contain; }
  &.is-coin img {
    position: absolute;
    left: -11.57%;
    top: 7.72%;
    max-width: none;
    width: 121.85%;
    height: 81.54%;
  }
  &.is-accelerator img {
    position: absolute;
    top: 5.71%;
    left: 6.14%;
    width: 88.44%;
    height: 88.44%;
  }
}
.welfare-claim__name-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 24px 0;
  h3 {
    margin: 0;
    color: #fff;
    font-size: 20px;
    font-weight: 600;
    line-height: 30px;
    text-align: center;
    overflow-wrap: anywhere;
  }
}
.welfare-claim__view {
  width: 166px;
  height: 36px;
  border: 0;
  padding: 0;
  background: url('../image/claim-success/button-view.svg') center / 166px 36px no-repeat;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:active { filter: brightness(0.88); }
}
.welfare-claim__bonus-box { width: 100%; padding-bottom: 12px; }
.welfare-claim__bonus {
  box-sizing: border-box;
  margin: 0;
  padding: 8px 0;
  border: 1px solid transparent;
  border-image: linear-gradient(to right, #ff5e0000, rgb(255 94 0 / 22%), #ff5e0000) 1;
  background: linear-gradient(to right, #ff5e0000, rgb(255 94 0 / 20%), #ff5e0000);
  color: #ff8b8b;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
  text-align: center;
  overflow-wrap: anywhere;
}
.welfare-claim__hint {
  border-top: 0.5px solid var(--reward-border);
  margin: 0;
  padding: 12px 0;
  color: var(--reward-gold);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  overflow-wrap: anywhere;
}
.welfare-claim__close {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 84px;
  height: 84px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}
.welfare-claim.is-streak {
  .welfare-claim__stage { padding-top: max(53px, env(safe-area-inset-top)); }
  .welfare-claim__heading h2 { font-size: 36px; line-height: 54px; }
  .welfare-claim__subtitle { font-size: 18px; }
  .welfare-claim__close { width: 120px; height: 120px; }
}
.welfare-reward-enter-active { animation: welfare-claim-reveal var(--reward-enter) linear both; }
@keyframes welfare-claim-reveal {
  0% { opacity: 0; }
  18%, 100% { opacity: 1; }
}
.welfare-reward-enter-active .welfare-claim__card {
  backface-visibility: hidden;
  animation: welfare-claim-card-flip var(--reward-enter) cubic-bezier(0.25, 0.8, 0.35, 1) both,
    welfare-claim-card-brighten var(--reward-enter) ease-in-out both;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(115deg, transparent 38%, #fff2ba18 44%, #fff8dd80 50%, #fff2ba18 56%, transparent 62%);
    background-size: 300% 100%;
    background-repeat: no-repeat;
    animation: welfare-claim-card-sheen var(--reward-enter) ease-in-out both;
  }
}
@keyframes welfare-claim-card-brighten {
  0%, 32%, 100% { filter: brightness(1); }
  58% { filter: brightness(1.25); }
  80% { filter: brightness(1.08); }
}
@keyframes welfare-claim-card-sheen {
  0%, 32% { opacity: 0; background-position: 100% 0; }
  42% { opacity: 0.85; }
  76% { opacity: 0.65; background-position: 0% 0; }
  88%, 100% { opacity: 0; background-position: 0% 0; }
}
@keyframes welfare-claim-card-flip {
  0% { transform: perspective(800px) rotateY(-180deg) scale(0.9); }
  30% { transform: perspective(800px) rotateY(-85deg) scale(0.94); }
  58% { transform: perspective(800px) rotateY(22deg) scale(1.055); }
  74% { transform: perspective(800px) rotateY(-11deg) scale(0.985); }
  86% { transform: perspective(800px) rotateY(5deg) scale(1.015); }
  94% { transform: perspective(800px) rotateY(-2deg) scale(0.997); }
  100% { opacity: 1; transform: perspective(1000px) rotateY(0deg) scale(1); }
}
.welfare-reward-leave-active { transition: opacity var(--reward-leave) ease-in; }
.welfare-reward-enter-active .welfare-claim__stage {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.welfare-reward-leave-active .welfare-claim__stage {
  transition: opacity var(--reward-leave) ease-in, transform var(--reward-leave) cubic-bezier(0.4, 0, 1, 1);
}
.welfare-reward-enter-from, .welfare-reward-leave-to { opacity: 0; }
.welfare-reward-enter-from .welfare-claim__stage { opacity: 0; transform: translateY(16px) scale(0.93); }
.welfare-reward-leave-to .welfare-claim__stage { opacity: 0; transform: translateY(12px) scale(0.96); }
@media (max-height: 680px) {
  .welfare-claim__stage, .welfare-claim.is-streak .welfare-claim__stage { gap: 16px; padding-top: 16px; }
  .welfare-claim__close, .welfare-claim.is-streak .welfare-claim__close { height: 48px; }
}
@media (prefers-reduced-motion: reduce) {
  .welfare-reward-enter-active .welfare-claim__card { animation: none; }
  .welfare-reward-enter-active .welfare-claim__card::after { display: none; }
  .welfare-claim__ring { animation: none; }
  .welfare-claim { --reward-enter: 1ms; --reward-leave: 1ms; }
  .welfare-reward-enter-from .welfare-claim__stage,
  .welfare-reward-leave-to .welfare-claim__stage { transform: none; }
}
</style>
