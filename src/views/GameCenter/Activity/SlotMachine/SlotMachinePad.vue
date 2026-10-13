<template>
  <div class="slot-machine-pad-layout">
    <section class="SlotMachinePad">
      <header class="machine-heading">
        <img class="luck-title" src="@/images/gamecenter/slotmachine/luck.png" alt="超值抽奖">
        <p>完成任务获取抽奖次数，超值礼品等你来拿</p>
      </header>
      <div class="machine-stage">
        <div class="reels">
          <div v-for="index in 3" :key="index" ref="reel" class="reel" :class="{ spinning: reelSpinningState[index - 1] }">
            <div v-if="reelTrackPrizes.length" class="reel-track" :style="trackStyle(index - 1)">
              <div v-for="(prize, prizeIndex) in reelTrackPrizes" :key="prizeIndex" class="award" :style="{ backgroundImage: prize.imgUrl ? `url(${prize.imgUrl})` : null }" />
            </div>
          </div>
        </div>
        <img class="machine-shell" src="@/images/gamecenter/slotmachine/slotmachine.png" alt="">
        <div class="draw-count">{{ drawCountNum }}</div>
        <div class="draw-bac" :class="{ disabled: prizeDraw.validStatus !== 1 }" tabindex="0" role="button" aria-label="立即抽奖" @click="clickDraw" @keydown.enter.prevent.stop="clickDraw" @keydown.space.prevent.stop="clickDraw">
          <img src="@/images/gamecenter/slotmachine/lottery.png" alt="开始抽奖">
        </div>
      </div>
      <AwardList v-if="showAwardList" :visible="showAwardList" :all-prize-ids="allPrizeIds" :activity-id="prizeDraw.id" :base-info="baseInfo" @close="showAwardList = false" />
      <VirtualAward v-if="showVirtualAward" source="lottery" :visible="showVirtualAward" :lottery-type="lotteryType" :info="info" @close="showVirtualAward = false" />
      <PhysicalAward v-if="showPhysicalAward" source="lottery" :visible="showPhysicalAward" :lottery-type="lotteryType" :info="info" @close="showPhysicalAward = false" @write-contact="showContactDialog = true" />
      <ThirdAward v-if="showThirdAward" source="lottery" :visible="showThirdAward" :lottery-type="lotteryType" :base-info="baseInfo" :info="info" @close="showThirdAward = false" />
      <ContactPop v-if="showContactDialog" source="lottery" pop-type="add" :draw-id="drawId" :visible="showContactDialog" @close="closePhysicalPop" />
      <OpenAppDialog v-if="showOpenAppDialog" :visible="showOpenAppDialog" @close="showOpenAppDialog = false" />
      <SlotMachineNoPrizeDialog :visible="showNoPrizeDialog" @close="showNoPrizeDialog = false" />
    </section>
    <dl class="task-list-pad">
      <dt class="title">完成任务获取抽奖次数</dt>
      <section class="task-wrap">
        <TaskItemOld v-for="(item, index) in prizeDraw.taskInfo" :key="index" :item="item" :prize-draw="prizeDraw" :first-local="String(firstLocal)" :second-local="String(secondLocal)" :third-local="String(thirdLocal)" :plate-name-report="plateNameReport" :scroll-to-purchase-on-finish="scrollToPurchaseOnFinish" @scroll-to-purchase="$emit('scroll-to-purchase', $event)" @update-task-status="updateTaskStatus($event, index)" @show-open-app-dialog="showOpenAppDialog = $event" @update-draw-count="drawCountNum = $event" @refresh-page="$emit('refreshPage')" />
      </section>
    </dl>
  </div>
</template>

<script>
import SuperDrawPad from '../SuperDraw/SuperDrawPad.vue'
import SlotMachineNoPrizeDialog from './SlotMachineNoPrizeDialog.vue'
import { createSlotMachineAnimator } from './slotMachineAnimator'
import { resolveSlotMachineResult } from './slotMachineResultResolver'

export default {
  name: 'SlotMachinePad',
  extends: SuperDrawPad,
  components: { SlotMachineNoPrizeDialog },
  emits: ['refreshPage', 'scroll-to-purchase', 'toLenovoLogin'],
  data() {
    return { reelOffsets: [0, 0, 0], cellHeight: 0, reelSpinningState: [false, false, false], showNoPrizeDialog: false, slotMachineAnimator: null, lastReelPrizes: [], resizeTimer: null }
  },
  computed: {
    lotteryType() { return 'Slotmachine' },
    reelTrackPrizes() { const prizes = this.awardList.filter(Boolean); return prizes.length ? [...prizes, ...prizes] : [] }
  },
  mounted() {
    this.$nextTick(this.measureReelHeight)
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.resizeTimer) clearTimeout(this.resizeTimer)
    this.clearSlotMachineAnimation()
  },
  methods: {
    measureReelHeight() {
      const reel = this.$refs.reel?.[0]
      if (!reel?.clientHeight) return
      this.cellHeight = reel.clientHeight
      if (!this.drawing && !this.reelSpinningState.some(Boolean)) this.resetReelsToIdle()
    },
    handleResize() {
      if (this.resizeTimer) clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => { if (!this.reelSpinningState.some(Boolean)) this.measureReelHeight() }, 200)
    },
    resetReelsToIdle() {
      const prizeCount = this.awardList.filter(Boolean).length || 3
      this.reelOffsets = [0, 1, 2].map(index => -((index % prizeCount) * this.cellHeight))
    },
    trackStyle(index) { return { '--cell-h': this.cellHeight ? `${this.cellHeight}px` : '100%', transform: `translateY(${this.reelOffsets[index] || 0}px)` } },
    popAward() {
      if (Number(this.info?.type) === 1) { this.showNoPrizeDialog = true; return }
      SuperDrawPad.methods.popAward.call(this)
    },
    getLotteryResultReportPrizes(res) {
      return this.lastReelPrizes.length === 3 ? this.lastReelPrizes : [res.prize]
    },
    createSlotMachineAnimation() {
      this.clearSlotMachineAnimation()
      this.slotMachineAnimator = createSlotMachineAnimator({
        getPrizes: () => this.awardList.filter(Boolean),
        getCellHeight: () => this.cellHeight,
        onReelTransform: (index, offset) => { this.reelOffsets[index] = offset },
        onReelStop: index => { this.reelSpinningState[index] = false },
        onComplete: () => { this.popAward(); this.drawing = false }
      })
    },
    startPlay() {
      this.measureReelHeight()
      if (!this.slotMachineAnimator) this.createSlotMachineAnimation()
      const started = this.slotMachineAnimator.start()
      this.reelSpinningState = this.reelSpinningState.map(() => started)
      return started
    },
    stopReels(targets) {
      if (this.slotMachineAnimator?.stopReels(targets)) return true
      this.clearSlotMachineAnimation()
      this.$errorMessage('抽奖失败，请重试！')
      this.drawing = false
      return false
    },
    clearSlotMachineAnimation() {
      this.slotMachineAnimator?.clear()
      this.reelSpinningState = [false, false, false]
      this.resetReelsToIdle()
    },
    clearTimer() {
      SuperDrawPad.methods.clearTimer.call(this)
      this.clearSlotMachineAnimation()
    },
    drawSuccess(res) {
      this.lastReelPrizes = []
      this.drawCountNum = res.availableDrawCount
      this.drawId = res.drawId
      this.info = res.prize
      // 未中奖（谢谢参与，type=1）的奖品不在九宫格奖池中，不能按 id 直接查找；
      // resolveSlotMachineResult 已针对 type=1 生成未中奖停轮图案，直接交给它处理即可。
      try {
        const resolved = resolveSlotMachineResult({ resultPrize: res.prize, awardList: this.awardList })
        this.lastReelPrizes = resolved.reels
        this.stopReels(resolved.reels)
      } catch (error) {
        // 无法解析停轮结果（例如奖池不足 3 个有效奖品）时：
        // 未中奖仍按"谢谢参与"展示，真正中奖才提示抽奖失败。
        this.clearSlotMachineAnimation()
        this.drawing = false
        if (Number(this.info?.type) === 1) {
          this.popAward()
        } else {
          this.$errorMessage('抽奖失败，请重试！')
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.slot-machine-pad-layout { display: flex; flex-direction: column; background: url('@/images/gamecenter/slotmachine/slotmachine-bg.png') no-repeat center / 100% 100%; }
.SlotMachinePad { width: min(92vw, 900px); margin: 24px auto 0; .machine-heading { display: flex; flex-direction: column; align-items: center; color: #e7ebf1; font-size: clamp(13px, 2vw, 18px); .luck-title { height: clamp(40px, 6vw, 56px); } p { margin: 2px 0 10px; } } .machine-stage { position: relative; width: 100%; aspect-ratio: 1888 / 1305; } .machine-shell { position: absolute; z-index: 1; inset: 0; width: 100%; height: 100%; pointer-events: none; } .reels { position: absolute; z-index: 2; top: 8.3%; left: 17.3%; width: 66.3%; height: 52.3%; display: flex; gap: .7%; } .reel { position: relative; flex: 1; overflow: hidden; transform: scaleY(-1); &.spinning .reel-track { filter: blur(.6px); } } .reel-track { position: absolute; inset: 0 0 auto; display: flex; flex-direction: column; will-change: transform; .award { width: 94%; height: var(--cell-h); margin: 0 auto; background: no-repeat center / auto 60%; transform: scaleY(-1); } } .draw-count { position: absolute; z-index: 4; top: 75.8%; left: 24.8%; color: #ffd451; font-size: 18px; transform: translateY(-50%); } .draw-bac { position: absolute; z-index: 4; top: 68.6%; left: 50%; width: 35.2%; cursor: pointer; transform: translateX(-50%); img { display: block; width: 100%; } &.disabled { cursor: default; filter: grayscale(.8); opacity: .6; } } }
.task-list-pad { display: block; width: 80vw; margin: 20px auto 60px; padding: 18px 15px 10px; border: .5px solid rgb(255 255 255 / 40%); background: rgb(59 58 58 / 30%); .title { display: block; color: #eaf7ff; font-size: 18px; font-weight: 700; line-height: 40px; text-align: center; } .task-wrap { max-height: 370px; overflow-y: auto; } }
.PhoneDevice .SlotMachinePad { width: calc(100% - 20px); margin-top: 12px; .machine-heading { font-size: 12px; } }
.PhoneDevice .task-list-pad { width: calc(100% - 40px); margin: 20px; padding: 18px 24px 45px; }
@media (min-width: 900px) { .slot-machine-pad-layout { width: calc(100% - 40px); max-width: 1320px; margin: 24px auto 0; padding: 0 16px; flex-direction: row; gap: 24px; justify-content: center; } .slot-machine-pad-layout .SlotMachinePad { width: auto; max-width: 600px; margin: 0; flex: 1; } .slot-machine-pad-layout .task-list-pad { width: 360px; margin: 0; flex: 0 0 360px; align-self: center; } }
</style>
