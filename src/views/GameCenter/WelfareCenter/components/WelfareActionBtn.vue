<template>
  <button
    type="button"
    class="welfare-action-btn"
    :class="isMuted ? 'welfare-action-btn--muted' : 'welfare-action-btn--active'"
    :disabled="disabled || isMuted"
    @click="$emit('click', $event)">
    <span class="welfare-action-btn__label">{{ displayLabel }}</span>
  </button>
</template>

<script>
/** 稿 200:19958 — 各类按钮复用 */
const MUTED = new Set(['soldout', 'exhausted', 'notopen'])

const DEFAULT_LABEL = {
  claim: '领ta',
  remind: '提醒我',
  view: '查看',
  soldout: '已抢完',
  exhausted: '今日机会已用',
  notopen: '未开抢'
}

export default {
  name: 'WelfareActionBtn',
  props: {
    /** claim | remind | view | soldout | exhausted | notopen */
    variant: { type: String, default: 'claim' },
    /** 覆盖默认文案；如「08:30开抢」 */
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['click'],
  computed: {
    resolvedVariant() {
      const v = this.variant
      if (MUTED.has(v) || ['claim', 'remind', 'view'].includes(v)) return v
      if (/开抢$/.test(v)) return 'notopen'
      return 'claim'
    },
    isMuted() {
      return MUTED.has(this.resolvedVariant)
    },
    displayLabel() {
      if (this.label) return this.label
      return DEFAULT_LABEL[this.resolvedVariant] || '领ta'
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-action-btn {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 36px;
  padding: 0 8px;
  border: 0;
  /* 稿 310:27366：左上 8px 切角 + 右下 15px 斜切 */
  clip-path: polygon(0 22.22%, 4.7% 0, 100% 0, 100% 58.33%, 91.18% 100%, 0 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: not-allowed;
  }
}

.welfare-action-btn--active {
  background: url('../image/claim-button.svg') center / 100% 100% no-repeat;
}

.welfare-action-btn--muted {
  background-color: rgba(255, 255, 255, 0.24);
  background-image:
    linear-gradient(
      122deg,
      rgba(255, 255, 255, 0) 10%,
      rgba(255, 255, 255, 0.06) 10.2%,
      rgba(255, 255, 255, 0.06) 71%,
      rgba(255, 255, 255, 0) 71.2%
    ),
    linear-gradient(
      122deg,
      rgba(255, 255, 255, 0) 12%,
      rgba(255, 255, 255, 0.06) 12.2%,
      rgba(255, 255, 255, 0.06) 70%,
      rgba(255, 255, 255, 0) 70.2%
    );
}

.welfare-action-btn__label {
  white-space: nowrap;
}
</style>
