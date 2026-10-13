<template>
  <Teleport to="body">
    <div class="xunyou-gift-claim-dialog">
      <transition name="xunyou-gift-claim-fade">
        <div
          v-if="visible"
          class="xunyou-gift-claim-dialog__mask"
          aria-hidden="true"
          @click.stop></div>
      </transition>

      <transition name="xunyou-gift-claim-pop">
        <div
          v-if="visible"
          class="xunyou-gift-claim-dialog__card"
          role="dialog"
          aria-modal="true">
          <img
            class="xunyou-gift-claim-dialog__background"
            :src="dialogBackground"
            alt=""
            aria-hidden="true" />
          <img
            class="xunyou-gift-claim-dialog__decor"
            :src="dialogDecor"
            alt=""
            aria-hidden="true" />

          <div class="xunyou-gift-claim-dialog__message">
            <div class="xunyou-gift-claim-dialog__message-line is-greeting">恭喜获得</div>
            <div class="xunyou-gift-claim-dialog__message-line is-duration">{{ durationText }}</div>
            <div class="xunyou-gift-claim-dialog__message-line is-encouragement">快去试试吧</div>
          </div>

          <button
            type="button"
            class="xunyou-gift-claim-dialog__confirm"
            @click.stop="close">
            <span class="xunyou-gift-claim-dialog__dots is-left" aria-hidden="true">
              <i v-for="index in 10" :key="`left-${index}`"></i>
            </span>
            <span class="xunyou-gift-claim-dialog__confirm-text">知道了（{{ remainingSeconds }}s）</span>
            <span class="xunyou-gift-claim-dialog__dots is-right" aria-hidden="true">
              <span class="xunyou-gift-claim-dialog__dots-grid">
                <i v-for="index in 10" :key="`right-${index}`"></i>
              </span>
            </span>
          </button>
        </div>
      </transition>

      <transition name="xunyou-gift-claim-close">
        <button
          v-if="visible"
          type="button"
          class="xunyou-gift-claim-dialog__close"
          aria-label="关闭"
          @click.stop="close">
          <img :src="dialogClose" alt="" aria-hidden="true" />
        </button>
      </transition>
    </div>
  </Teleport>
</template>

<script>
import dialogBackground from './images/xunyou-gift-claim-dialog-bg.webp'
import dialogClose from './images/xunyou-gift-claim-dialog-close.svg'
import dialogDecor from './images/xunyou-gift-claim-dialog-decor.svg'

const COUNTDOWN_SECONDS = 5
const COUNTDOWN_INTERVAL_MS = 250

export default {
  name: 'XunyouGiftClaimDialog',
  emits: ['update:visible'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    durationDays: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      dialogBackground,
      dialogClose,
      dialogDecor,
      remainingSeconds: COUNTDOWN_SECONDS,
      countdownTimer: null,
      countdownDeadline: 0
    }
  },
  computed: {
    // 时长后端按「天」下发；不足一天时用小数天表示（0.125 天 = 3 小时），
    // 换算成小时后按小时展示，整数天 / 整数小时都取不到时才退化成不带时长的兜底文案。
    durationText() {
      const durationDays = Number(this.durationDays)
      if (!Number.isFinite(durationDays) || durationDays <= 0) return '加速器会员'
      if (Number.isInteger(durationDays)) return `${durationDays}天加速器会员`
      const durationHours = durationDays * 24
      return Number.isInteger(durationHours) ? `${durationHours}小时加速器会员` : '加速器会员'
    }
  },
  watch: {
    visible: {
      handler(visible) {
        if (visible) {
          this.startCountdown()
        } else {
          this.clearCountdown()
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    this.clearCountdown()
  },
  methods: {
    startCountdown() {
      this.clearCountdown()
      this.remainingSeconds = COUNTDOWN_SECONDS
      this.countdownDeadline = Date.now() + COUNTDOWN_SECONDS * 1000
      this.countdownTimer = setInterval(() => {
        const remainingMilliseconds = this.countdownDeadline - Date.now()
        if (remainingMilliseconds <= 0) {
          this.remainingSeconds = 0
          this.clearCountdown()
          this.close()
          return
        }
        this.remainingSeconds = Math.ceil(remainingMilliseconds / 1000)
      }, COUNTDOWN_INTERVAL_MS)
    },
    clearCountdown() {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
        this.countdownTimer = null
      }
      this.countdownDeadline = 0
    },
    close() {
      if (!this.visible) return
      this.clearCountdown()
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss" scoped>
.xunyou-gift-claim-dialog {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 48px;
  pointer-events: none;

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(2px);
    pointer-events: auto;
  }

  &__card {
    position: relative;
    flex: 0 0 auto;
    width: 300px;
    height: 397px;
    box-sizing: border-box;
    border-radius: 8px;
    overflow: hidden;
    pointer-events: auto;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 4;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.24);
      border-radius: 8px;
      pointer-events: none;
    }
  }

  &__background {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  &__decor {
    position: absolute;
    left: 15px;
    top: 11px;
    z-index: 1;
    display: block;
    width: 54px;
    height: 13px;
    transform: scaleY(-1);
  }

  &__message {
    position: absolute;
    left: 50%;
    top: 197.5px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 183px;
    transform: translateX(-50%);
    gap: 4px;
    text-align: center;
  }

  &__message-line {
    white-space: nowrap;

    &.is-greeting,
    &.is-encouragement {
      color: rgba(255, 255, 255, 0.79);
      font-size: 20px;
      line-height: 30px;
    }

    &.is-duration {
      background-image: linear-gradient(195.59deg, rgb(131, 107, 82) 12.077%, rgb(255, 234, 178) 48.57%, rgb(208, 166, 120) 85.062%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 24px;
      font-weight: 700;
      line-height: 36px;
    }
  }

  &__confirm {
    position: absolute;
    left: 50%;
    top: 331.5px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 274px;
    height: 48px;
    box-sizing: border-box;
    padding: 0;
    border: 0.5px solid #f5f5f5;
    border-radius: 4px;
    background: linear-gradient(180deg, rgba(245, 245, 245, 0.48) 0%, #f5f5f5 100%);
    color: #162233;
    font-size: 14px;
    font-weight: 700;
    line-height: normal;
    transform: translateX(-50%);
    overflow: hidden;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.8;
    }
  }

  &__confirm-text {
    position: relative;
    z-index: 1;
  }

  &__dots {
    position: absolute;
    box-sizing: border-box;
    padding: 8px;
    background: transparent;

    i {
      display: block;
      width: 2px;
      height: 2px;
      background: rgba(0, 0, 0, 0.12);
    }

    &.is-left {
      left: -0.5px;
      bottom: -0.5px;
      display: grid;
      grid-template-columns: repeat(5, 2px);
      grid-auto-rows: 2px;
      gap: 1px;
      width: 30px;
      height: 21px;
    }

    &.is-right {
      right: -0.5px;
      top: 50%;
      display: block;
      width: 21px;
      height: 30px;
      transform: translateY(-50%);
      overflow: visible;
    }
  }

  &__dots-grid {
    position: absolute;
    left: 50%;
    top: 50%;
    display: grid;
    grid-template-columns: repeat(5, 2px);
    grid-auto-rows: 2px;
    gap: 1px;
    width: 30px;
    height: 21px;
    padding: 8px;
    box-sizing: border-box;
    transform: translate(-50%, -50%) rotate(90deg);

    i {
      display: block;
      width: 2px;
      height: 2px;
      background: rgba(0, 0, 0, 0.12);
    }
  }

  &__close {
    position: relative;
    z-index: 2;
    display: block;
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: transparent;
    pointer-events: auto;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.7;
    }

    img {
      display: block;
      width: 24px;
      height: 24px;
    }
  }
}

.xunyou-gift-claim-fade-enter-active,
.xunyou-gift-claim-fade-leave-active {
  transition: opacity 0.24s ease;
}

.xunyou-gift-claim-fade-enter-from,
.xunyou-gift-claim-fade-leave-to {
  opacity: 0;
}

.xunyou-gift-claim-pop-enter-active,
.xunyou-gift-claim-pop-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.xunyou-gift-claim-pop-enter-from,
.xunyou-gift-claim-pop-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

.xunyou-gift-claim-close-enter-active,
.xunyou-gift-claim-close-leave-active {
  transition: opacity 0.24s ease;
}

.xunyou-gift-claim-close-enter-from,
.xunyou-gift-claim-close-leave-to {
  opacity: 0;
}
</style>
