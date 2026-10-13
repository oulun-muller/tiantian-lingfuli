<template>
  <WelfareStreakSection
    :days="activity.days"
    :completed-days="activity.completedDays"
    :progress-days="progressDays"
    :status="state"
    :claiming-day="claimingDay"
    :wide="wide"
    :active-reward-day="activeRewardDay"
    @claim="claimReward"
    @retry="retry" />
  <Teleport to="body">
    <div class="streak-debug-float" :style="{ left: `${debugX}px`, top: `${debugY}px` }">
      <button type="button" class="streak-debug-toggle" :aria-expanded="debugOpen" aria-controls="streak-debug-panel"
        @pointerdown="startDebugDrag" @pointermove="moveDebugDrag" @pointerup="endDebugDrag"
        @pointercancel="endDebugDrag" @click="toggleDebug">Demo 状态调试</button>
      <div v-if="debugOpen" id="streak-debug-panel" class="streak-debug"
        :class="{ 'opens-below': debugY < viewportHeight / 2 }">
      <p>{{ viewportWidth }} × {{ viewportHeight }} · {{ device }} · {{ wide ? '宽屏' : '窄屏' }}（640px）</p>
      <label>
        模块状态
        <select :value="state" aria-label="连续领取 Mock 状态" @change="changeState($event.target.value)">
          <option v-for="option in states" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <p>已完成 {{ activity.completedDays }} 天 · {{ claimingDay ? '领取中' : '未请求' }} · 仅示例数据</p>
      <button type="button" @click="changeState('normal')">重置示例</button>
      <button type="button" @click="previewAccelerator(true)">预览加速器弹窗</button>
      <button type="button" @click="previewAccelerator(false)">预览无赠送加速器</button>
      </div>
    </div>
  </Teleport>
  <WelfareClaimSuccessPopup
    :visible="!!receipt"
    :item="receipt"
    :variant="receipt?.popupVariant || 'streak'"
    :reward-type="receipt?.rewardType || 'standard'"
    :accelerator-days="receipt?.acceleratorDays || 0"
    :bonus-days="receipt?.bonusDays || 0"
    :days="receipt?.day || 0"
    :next-reward="receipt?.nextReward || null"
    @close="receipt = null"
    @view-prizes="previewReward" />
</template>

<script>
import WelfareClaimSuccessPopup from './WelfareClaimSuccessPopup.vue'
import WelfareStreakSection from './WelfareStreakSection.vue'
import { welfareStreakProgress } from '../welfareStreakProgress'
import { createStreakMock, streakStates, acceleratorPreview } from '../welfareStreakMock'

export default {
  name: 'WelfareStreakDemo',
  components: { WelfareStreakSection, WelfareClaimSuccessPopup },
  props: { todayClaimVersion: { type: Number, default: 0 } },
  data() {
    const requested = this.$route.query.streakState || new URLSearchParams(window.location.search).get('streakState')
    const state = streakStates.some((option) => option.value === requested) ? requested : 'normal'
    const saved = welfareStreakProgress.snapshot?.state === state ? welfareStreakProgress.snapshot : null
    return {
      debugOpen: false,
      debugX: 12,
      debugY: Math.max(8, window.innerHeight - 64),
      debugDrag: null,
      debugDragged: false,
      appliedVersion: saved?.version || 0,
      state,
      states: streakStates,
      activity: saved?.activity || createStreakMock(state),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      claimingDay: null,
      receipt: null,
      pendingTimer: null,
      advanceTimer: null,
      arrivalTimer: null,
      advancingDay: null,
      progressDays: null,
      activeRewardDay: saved?.activeRewardDay || null
    }
  },
  computed: {
    wide() { return this.viewportWidth > 640 },
    device() { return this.$isPhoneDevice ? 'Phone' : this.$isPadDevice ? 'Pad' : '宿主回退' }
  },
  watch: {
    todayClaimVersion(value, previous) {
      if (value > previous) {
        this.advanceOnReturn()
        this.appliedVersion = value
      }
    }
  },
  methods: {
    clampDebugPosition() {
      this.debugX = Math.min(Math.max(8, this.debugX), Math.max(8, this.viewportWidth - 140))
      this.debugY = Math.min(Math.max(8, this.debugY), Math.max(8, this.viewportHeight - 48))
    },
    startDebugDrag(event) {
      if (event.button !== 0) return
      this.debugDragged = false
      this.debugDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: this.debugX, top: this.debugY }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    moveDebugDrag(event) {
      const drag = this.debugDrag
      if (!drag || event.pointerId !== drag.id) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      if (Math.hypot(dx, dy) > 5) this.debugDragged = true
      if (!this.debugDragged) return
      this.debugX = drag.left + dx
      this.debugY = drag.top + dy
      this.clampDebugPosition()
    },
    endDebugDrag(event) {
      if (event.pointerId !== this.debugDrag?.id) return
      this.debugDrag = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    },
    toggleDebug(event) {
      if (this.debugDragged && event.detail !== 0) {
        this.debugDragged = false
        return
      }
      this.debugOpen = !this.debugOpen
    },
    advanceOnReturn() {
      if (['loading', 'empty', 'error'].includes(this.state)) this.changeState('normal')
      this.clearAdvanceTimers()
      const target = Math.min(7, this.activity.completedDays + 1)
      if (target === this.activity.completedDays) return
      this.advancingDay = target
      this.progressDays = this.activity.completedDays
      this.advanceTimer = window.setTimeout(() => {
        this.progressDays = target
        this.advanceTimer = null
        const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        this.arrivalTimer = window.setTimeout(() => {
          this.activity.completedDays = target
          this.activeRewardDay = target
          this.advancingDay = null
          this.arrivalTimer = null
        }, reducedMotion ? 0 : 1200)
      }, 200)
    },
    clearAdvanceTimers() {
      clearTimeout(this.advanceTimer)
      clearTimeout(this.arrivalTimer)
      this.advanceTimer = null
      this.arrivalTimer = null
      this.advancingDay = null
      this.progressDays = null
    },
    updateViewport() {
      this.viewportWidth = window.innerWidth
      this.viewportHeight = window.innerHeight
      this.clampDebugPosition()
    },
    changeState(state) {
      this.clearAdvanceTimers()
      clearTimeout(this.pendingTimer)
      this.pendingTimer = null
      this.claimingDay = null
      this.receipt = null
      this.state = state
      this.activity = createStreakMock(state)
      this.activeRewardDay = null
      if (state === 'unlockFifth') this.advanceOnReturn()
      const query = { ...this.$route.query }
      query.streakState = state
      this.$router.replace({ query }).catch(() => {})
    },
    claimReward(item) {
      if (this.claimingDay !== null || item.claimed || item.day > this.activity.completedDays) return
      this.claimingDay = item.day
      this.pendingTimer = window.setTimeout(() => {
        item.claimed = true
        if (this.activeRewardDay === item.day) this.activeRewardDay = null
        this.claimingDay = null
        this.pendingTimer = null
        this.receipt = {
          ...item,
          name: item.rewardName,
          previewOnly: true
        }
      }, 500)
    },
    previewAccelerator(withBonus) {
      this.receipt = { ...acceleratorPreview, bonusDays: withBonus ? acceleratorPreview.bonusDays : 0 }
    },
    previewReward() {
      this.$infoMessage?.('示例奖励，暂未接入真实福利详情')
    },
    retry() {
      this.changeState('loading')
      this.pendingTimer = window.setTimeout(() => this.changeState('normal'), 500)
    }
  },
  mounted() {
    const state = this.$route.query.streakState
    if (state !== this.state && this.states.some((option) => option.value === state)) {
      this.state = state
      this.activity = createStreakMock(state)
    }
    if (this.state === 'unlockFifth' && this.activity.completedDays === 4) this.advanceOnReturn()
    window.addEventListener('resize', this.updateViewport)
    if (this.todayClaimVersion > this.appliedVersion) {
      const delta = this.todayClaimVersion - this.appliedVersion
      this.activity.completedDays = Math.min(7, this.activity.completedDays + delta)
      this.appliedVersion = this.todayClaimVersion
      this.activeRewardDay = this.activity.completedDays
    }
  },
  beforeUnmount() {
    if (this.advancingDay !== null) {
      this.activity.completedDays = this.advancingDay
      this.activeRewardDay = this.advancingDay
    }
    this.clearAdvanceTimers()
    welfareStreakProgress.snapshot = {
      state: this.state,
      version: this.appliedVersion,
      activeRewardDay: this.activeRewardDay,
      activity: { ...this.activity, days: this.activity.days.map((item) => ({ ...item })) }
    }
    clearTimeout(this.pendingTimer)
    window.removeEventListener('resize', this.updateViewport)
  }
}
</script>

<style lang="scss" scoped>
.streak-debug-float {
  position: fixed;
  z-index: 2000;
  width: 132px;
}
.streak-debug-toggle {
  width: 132px;
  height: 40px;
  border: 1px solid #ffde6866;
  border-radius: 20px;
  background: #29251e;
  color: #ffde68;
  font: 12px system-ui, sans-serif;
  touch-action: none;
  user-select: none;
  cursor: grab;
  &:active { cursor: grabbing; }
}
.streak-debug {
  position: absolute;
  bottom: 48px;
  left: 0;
  box-sizing: border-box;
  width: 320px;
  max-width: calc(100vw - 16px);
  max-height: calc(50vh - 56px);
  overflow: auto;
  transform: translateX(min(0px, calc(100vw - 16px - 320px - v-bind('debugX + "px"'))));
  border: 1px solid #ffffff26;
  border-radius: 12px;
  background: #191919f5;
  box-shadow: 0 8px 28px #0006;
  &.opens-below { bottom: auto; top: 48px; }
  padding: 12px 16px;
  max-width: 808px;
  color: #f5f5f5b8;
  font-size: 12px;
  line-height: 1.8;
  summary { cursor: pointer; }
  p { margin: 8px 0; }
  label { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  select, button {
    max-width: 100%;
    padding: 6px 10px;
    color: #f5f5f5;
    background: #242424;
    border: 1px solid #ffffff1f;
    border-radius: 4px;
  }
}
</style>
