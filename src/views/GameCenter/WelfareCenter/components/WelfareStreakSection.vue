<template>
  <section class="welfare-streak" :class="{ 'is-wide': wide, 'is-advancing': isAdvancing }" aria-labelledby="welfare-streak-title">
    <div v-if="isAdvancing" class="welfare-streak__sweep-layer" aria-hidden="true">
      <WelfareAsciiSweep />
    </div>
    <header class="welfare-streak__heading">
      <h2 id="welfare-streak-title">连领得大奖</h2>
      <p>断领后将重新开始</p>
    </header>
    <div v-if="status === 'loading'" class="welfare-streak__skeleton" role="status" aria-busy="true">
      <span v-for="day in 7" :key="day" />
      <span class="welfare-streak__sr-only">连续领取福利加载中</span>
    </div>
    <div v-else-if="status === 'error'" class="welfare-streak__message" role="status">
      <span>加载失败，请重试</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <p v-else-if="status === 'empty' || !days.length" class="welfare-streak__message">暂无连续领取活动</p>
    <ol v-else class="welfare-streak__days" :class="{ 'is-advancing': isAdvancing }"
      :style="progressStyle" aria-label="连续领取进度">
      <li v-for="item in days" :key="item.day" class="welfare-streak__day"
        :class="{ 'is-arriving': item.day === activeRewardDay }">
        <div class="welfare-streak__node" :aria-label="nodeDescription(item)">
          <button
            v-if="item.imageUrl"
            type="button"
            class="welfare-streak__reward"
            :disabled="item.claimed || item.day > completedDays || claimingDay !== null"
            :aria-label="`领取第${item.day}天礼品`"
            :class="{
              'is-earned': item.day <= completedDays,
              'is-claimed': item.claimed,
              'is-shaking': !item.claimed && item.day <= completedDays
            }"
            @click="$emit('claim', item)">
            <span class="welfare-streak__image-clip" :class="`is-${item.imageKind}`">
              <img :src="item.imageUrl" alt="" />
            </span>
            <img v-if="item.claimed" class="welfare-streak__reward-check" :src="rewardCheck" alt="" />
          </button>
          <span v-else-if="item.day <= completedDays" class="welfare-streak__completed">
            <img :src="smallCheck" alt="" />
          </span>
          <span v-else class="welfare-streak__pending"><span /></span>
          <span v-if="item.imageUrl && !item.claimed && item.day <= completedDays" class="welfare-streak__particles" aria-hidden="true">
            <span v-for="particle in 8" :key="particle" class="welfare-streak__particle"
              :style="{ '--particle-angle': `${(particle - 1) * 45}deg`, '--particle-delay': `${(particle - 1) * -0.29}s` }" />
          </span>
        </div>
        <span class="welfare-streak__label">{{ item.label }}</span>
        <button
          v-if="item.imageUrl && !item.claimed && item.day <= completedDays"
          type="button"
          class="welfare-streak__claim"
          :disabled="claimingDay !== null"
          :aria-busy="claimingDay === item.day"
          :aria-label="`领取第${item.day}天奖励`"
          @click="$emit('claim', item)">
          {{ claimingDay === item.day ? '领取中' : '领取' }}
        </button>
        <span v-else-if="item.rewardName" class="welfare-streak__name" :title="item.rewardName">
          {{ item.rewardName }}
        </span>
      </li>
    </ol>
  </section>
</template>

<script>
import WelfareAsciiSweep from './WelfareAsciiSweep.vue'
import smallCheck from '../image/streak/icon-check-small.svg'
import rewardCheck from '../image/streak/icon-check-reward.svg'

export default {
  name: 'WelfareStreakSection',
  components: { WelfareAsciiSweep },
  props: {
    days: { type: Array, default: () => [] },
    completedDays: { type: Number, default: 0 },
    progressDays: { type: Number, default: null },
    status: { type: String, default: 'normal' },
    claimingDay: { type: Number, default: null },
    wide: { type: Boolean, default: false },
    activeRewardDay: { type: Number, default: null }
  },
  emits: ['claim', 'retry'],
  data() {
    return { smallCheck, rewardCheck }
  },
  computed: {
    isAdvancing() { return this.progressDays !== null && this.progressDays > this.completedDays },
    progressStyle() {
      const denominator = Math.max(1, this.days.length - 1)
      const progress = Math.min(1, Math.max(0, ((this.progressDays ?? this.completedDays) - 0.5) / denominator))
      return { '--streak-progress': `${progress * 100}%` }
    }
  },
  methods: {
    nodeDescription(item) {
      if (item.claimed) return `第${item.day}天奖励已领取`
      return `第${item.day}天${item.day <= this.completedDays ? '已完成' : '未完成'}`
    }
  }
}
</script>

<style lang="scss" scoped>
.welfare-streak {
  /* Figma: danger-solid / text-secondary / text-tertiary / border-subtle */
  --streak-danger: #ee5555;
  --streak-secondary: #f5f5f5b8;
  --streak-tertiary: #f5f5f57a;
  --streak-border: #ffffff1f;
  --streak-reward-text: #ffde68;
  --streak-node-size: 44px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-height: 147.5px;
  margin: -64px auto 16px;
  padding: 8px 16px;
  border-bottom: 0.5px solid var(--streak-border);
  color: var(--streak-secondary);
}
.welfare-streak__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  h2 {
    flex-shrink: 0;
    margin: 0;
    background: linear-gradient(90deg, #ff8968, #ffea9d);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-family: 'YouSheBiaoTiHei', sans-serif;
    font-size: 18px;
    font-weight: 400;
    line-height: 23px;
  }
  p { margin: 0; color: var(--streak-tertiary); font-size: 12px; line-height: 24px; }
}
.welfare-streak__days {
  position: relative;
  isolation: isolate;
  overflow: visible;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0;
  min-width: 0;
  min-height: 99px;
  box-sizing: border-box;
  padding: 6px 0;
  margin: 0;
  list-style: none;
  &::before {
    content: '';
    position: absolute;
    top: 27px;
    left: calc(var(--streak-node-size) / 2);
    right: calc(var(--streak-node-size) / 2);
    height: 2px;
    background-color: #6e747b;
    background-image: url('../image/streak/progress-line.svg');
    background-repeat: no-repeat;
    background-size: var(--streak-progress) 2px;
    transition: background-size 1200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
}
.welfare-streak.is-advancing .welfare-streak__heading,
.welfare-streak__days.is-advancing {
  mask-image: linear-gradient(to right, #000 calc(var(--ascii-head, -100%) - var(--ascii-radius, 14%)),
    #0003 var(--ascii-head, -100%), #000 calc(var(--ascii-head, -100%) + var(--ascii-radius, 14%)));
}
.welfare-streak__sweep-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  list-style: none;
}
.welfare-streak__day {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: var(--streak-node-size);
  flex: 0 0 var(--streak-node-size);
  min-width: 0;
  font-size: 10px;
  line-height: 15px;
}
.welfare-streak__node {
  position: relative;
  width: var(--streak-node-size);
  height: var(--streak-node-size);
  display: flex;
  align-items: center;
  justify-content: center;
}
.welfare-streak__reward {
  padding: 0;
  color: inherit;
  cursor: pointer;
  &:disabled { cursor: default; }
  &.is-shaking { animation: streak-gift-shake 2.8s ease-in-out 420ms infinite; }
  box-sizing: border-box;
  position: relative;
  width: var(--streak-node-size);
  height: var(--streak-node-size);
  border: 1px solid #6e747b;
  border-radius: 50%;
  background: #0e1923;
  &.is-earned { border-color: var(--streak-danger); }
  &.is-claimed .welfare-streak__image-clip { opacity: 0.18; }
}
.welfare-streak__image-clip {
  position: absolute;
  inset: -1px;
  overflow: hidden;
  border-radius: 50%;
  img { position: absolute; max-width: none; }
  &.is-standard img {
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  &.is-coin img {
    top: 7.72%;
    left: -11.57%;
    width: 121.85%;
    height: 81.54%;
    object-fit: contain;
  }
  &.is-music img {
    top: 13.64%;
    left: -4.54%;
    width: 109.09%;
    height: 72.72%;
    object-fit: contain;
  }
}
.welfare-streak__particles {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: 50%;
  pointer-events: none;
}
.welfare-streak__particle {
  position: absolute;
  left: calc(50% - 2.5px);
  top: calc(50% - 2.5px);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffe8a0;
  box-shadow: 0 0 4px #ffd668;
  opacity: 0;
  animation: streak-particle-scatter 2.4s ease-out var(--particle-delay) infinite;
  &:nth-child(even) {
    left: calc(50% - 2px);
    top: calc(50% - 2px);
    width: 4px;
    height: 4px;
    background: #fff7df;
  }
}
@keyframes streak-particle-scatter {
  0% { opacity: 0; transform: rotate(var(--particle-angle)) translateY(-8px) scale(0.4); }
  18% { opacity: 0.9; }
  70% { opacity: 0.55; }
  100% { opacity: 0; transform: rotate(var(--particle-angle)) translateY(-34px) scale(0.15); }
}
.welfare-streak__reward-check {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.welfare-streak__completed,
.welfare-streak__pending {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.welfare-streak__completed { width: 18px; height: 18px; background: var(--streak-danger); }
.welfare-streak__pending {
  width: 14px;
  height: 14px;
  border: 1px solid #ffffff66;
  background: #0d1723;
  span { width: 8px; height: 8px; border-radius: 50%; background: #d9d9d9; }
}
.welfare-streak__name {
  width: 100%;
  color: var(--streak-reward-text);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.welfare-streak__claim {
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 37px;
  height: 20px;
  padding: 0 8px;
  border: 0.5px solid var(--streak-reward-text);
  border-radius: 41px;
  background: #ffdd0045;
  color: var(--streak-reward-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-size: 10px;
  font-weight: 600;
  line-height: 18px;
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: default; }
}
.welfare-streak__message {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 99px;
  margin: 0;
  font-size: 12px;
  button { border: 0; background: transparent; color: var(--streak-reward-text); cursor: pointer; }
}
.welfare-streak__skeleton {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  min-height: 99px;
  span:not(.welfare-streak__sr-only) {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #ffffff12;
    animation: streak-pulse 1.2s ease-in-out infinite alternate;
  }
}
.welfare-streak__sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.welfare-streak.is-wide {
  max-width: 840px;
  min-height: 115.5px;
  margin-top: -64px;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  .welfare-streak__heading { flex: 0 0 96px; flex-direction: column; align-items: flex-start; gap: 0; }
  .welfare-streak__days { flex: 1; }
}
.welfare-streak__day.is-arriving {
  .welfare-streak__node { animation: streak-node-arrive 420ms ease-out; }
  .welfare-streak__label { color: var(--streak-reward-text); }
  .welfare-streak__claim { animation: streak-claim-enter 260ms ease-out 420ms backwards; }
}
@keyframes streak-node-arrive {
  0% { transform: scale(0.88); filter: brightness(1); }
  45% { transform: scale(1.16); filter: brightness(1.6); }
  100% { transform: scale(1); filter: brightness(1); }
}
@keyframes streak-claim-enter {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes streak-gift-shake {
  0%, 24%, 100% { transform: rotate(0deg); }
  4%, 12% { transform: rotate(-12deg); }
  8%, 16% { transform: rotate(12deg); }
  20% { transform: rotate(-5deg); }
}
@media (prefers-reduced-motion: reduce) {
  .welfare-streak__particles { display: none; }
  .welfare-streak__reward.is-shaking,
  .welfare-streak__day.is-arriving .welfare-streak__node,
  .welfare-streak__day.is-arriving .welfare-streak__claim { animation: none; }
  .welfare-streak__days::before { transition: none; }
  .welfare-streak__sweep-layer { display: none; }
}
@keyframes streak-pulse { to { opacity: 0.4; } }
@media (prefers-reduced-motion: reduce) { .welfare-streak__skeleton span { animation: none; } }
</style>

