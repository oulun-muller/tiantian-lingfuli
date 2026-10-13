<template>
  <!-- 迅游「加速启动」过渡覆盖层：由自身固定时间轴驱动，不依赖加速真实结果。
       几何与动效全部照设计 Demo 移植（Temp/xunyou-accelerator-h5）。 -->
  <div
    v-if="visible"
    class="accel-transition"
    :class="{ 'is-landscape': isLandscape }"
    :data-lifecycle="lifecycle"
    role="status"
    aria-label="VIP 加速启动中"
  >
    <div class="accelerator" :data-phase="phase">
      <!-- 氛围光效：竖屏是上下两片，横屏换成左右光翼（方向由 .is-landscape 切换） -->
      <div class="atmosphere atmosphere-top" aria-hidden="true">
        <img :src="atmosphereImg" alt="" />
      </div>
      <div class="atmosphere atmosphere-bottom" aria-hidden="true">
        <img :src="atmosphereImg" alt="" />
      </div>

      <!-- 仪表：外框 + 反向旋转轨道 + 正向旋转弧 + 刻度底环 + conic 遮罩的进度环 -->
      <div class="scanner">
        <img class="frame" :src="frameImg" alt="" />
        <div class="orbit" :style="{ transform: `rotate(${-180 * rotationProgress}deg)` }">
          <img :src="orbitImg" alt="" />
        </div>
        <div class="arc" :style="{ transform: `rotate(${720 * rotationProgress}deg)` }">
          <img :src="arcImg" alt="" />
        </div>
        <img class="track" :src="trackImg" alt="" />
        <div class="progress" :style="{ '--ring-progress': `${ringDegrees}deg` }">
          <img :src="progressImg" alt="" />
        </div>
        <div class="success-wave" aria-hidden="true"></div>

        <div
          class="readout"
          :class="{ 'readout-success': isSuccess }"
          role="progressbar"
          :aria-label="isSuccess ? 'VIP 加速成功' : '加速启动进度'"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="displayPercent"
        >
          <!-- 成功态：数字换成闪电（渐变照搬 demo） -->
          <svg v-if="isSuccess" class="success-bolt" viewBox="0 0 56 72" aria-hidden="true">
            <defs>
              <linearGradient id="bolt-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#3887ff" />
                <stop offset=".52" stop-color="#21b9ff" />
                <stop offset="1" stop-color="#04e6db" />
              </linearGradient>
            </defs>
            <path fill="url(#bolt-gradient)" d="M35.5 1 4 42.5h21L16.5 71 52 31H30.5z" />
          </svg>
          <template v-else>
            <span>{{ displayPercent }}</span>
            <span class="percent-sign">%</span>
          </template>
        </div>
      </div>

      <!-- 文案：VIP 条 + 副文案（副文案成功态换成结果值） -->
      <section class="message" aria-live="polite" aria-atomic="true">
        <div class="vip" :class="{ 'vip-success': isSuccess }">
          <img :src="vipImg" alt="VIP" />
          <span class="vip-status">
            <Transition name="copy-swap" mode="out-in">
              <span :key="statusText" class="vip-status-text">{{ statusText }}</span>
            </Transition>
          </span>
        </div>
        <div class="message-description">
          <Transition name="copy-swap" mode="out-in">
            <p :key="descriptionText">{{ descriptionText }}</p>
          </Transition>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import frameImg from './image/frame.svg'
import orbitImg from './image/orbit.svg'
import arcImg from './image/arc.svg'
import trackImg from './image/track.svg'
import progressImg from './image/progress.svg'
import atmosphereImg from './image/atmosphere.svg'
import vipImg from './image/vip.png'
import { setBottomNavVisible } from '@/nativeApiPad/download'
import { getAccelPreviewBoostSync } from '@/bridge/legionZoneMobile'

/* 时间轴常量：照 Demo data/demoStates.js 的 DEMO_CONFIG，固定时长、不接加速真实结果。
   0–180 starting（进度恒为 START_PERCENT）
   180–1120 loading（START_PERCENT → 100，smoothstep）
   1120–1280 ready（停在 100）
   1280–1650 settling（100 → resultPercent，cubicOut） */
const DURATION = 1650
const INTRO_END = 180
const LOADING_END = 1120
const READY_END = 1280
const START_PERCENT = 50
const HOLD_MS = 300 // 结果态停留时长，结束后自动出场
const EXIT_MS = 400 // 出场淡出时长，与样式里 overlay/accelerator 的 transition 对齐

const COPY_CONNECTING = '正在建立VIP专属加速通道...'
const COPY_SUCCESS = 'VIP加速成功'

/* 结果数值由原生提供；接口不可用时（桌面 mock）回落到这里的默认值。 */
const RESULT_PERCENT_FALLBACK = 29

const smoothStep = value => value * value * (3 - 2 * value)
const cubicOut = value => 1 - Math.pow(1 - value, 3)

export default {
  name: 'XunyouAccelTransition',
  // 只对外发这一个事件：出场动画结束、覆盖层开始卸载时通知父组件 —— 这是「动画播完」的唯一判据，
  // 父组件（GameCarousel）据此拉起游戏。beforeUnmount 里绝不 emit：中途离开页面视为用户放弃本次启动。
  emits: ['finished'],
  data() {
    return {
      // 覆盖层是否挂载（出场动画播完后置 false，DOM 一并卸载）
      visible: false,
      // 入场 / 常态 / 出场，对应样式里的 [data-lifecycle]
      lifecycle: 'entering',
      // 时间轴当前时刻（ms），所有「进度 / 阶段 / 旋转」都由它派生
      elapsed: 0,
      // 触发时该卡片的游戏名，作为成功前副文案
      gameName: '',
      // 结果态展示的「延迟预计降低」百分比，play() 时向原生取
      resultPercent: RESULT_PERCENT_FALLBACK,
      // 竖屏 / 横屏（Pad 构图）判定
      isLandscape: false,
      reducedMotion: false,
      // 时间轴与定时器句柄（非展示状态，仅用于 beforeUnmount 清理）
      frameId: 0,
      entranceFrame: 0,
      holdTimer: null,
      exitTimer: null,
      startedAt: 0,
      // 图片素材
      frameImg,
      orbitImg,
      arcImg,
      trackImg,
      progressImg,
      atmosphereImg,
      vipImg
    }
  },
  computed: {
    phase() {
      if (this.elapsed < INTRO_END) return 'starting'
      if (this.elapsed < LOADING_END) return 'loading'
      if (this.elapsed < READY_END) return 'ready'
      if (this.elapsed < DURATION) return 'settling'
      return 'complete'
    },
    // 未取整的实时进度，仅用于派生展示值
    progress() {
      const time = this.elapsed
      if (time < INTRO_END) return START_PERCENT
      if (time < LOADING_END) {
        return START_PERCENT + 50 * smoothStep((time - INTRO_END) / (LOADING_END - INTRO_END))
      }
      if (time < READY_END) return 100
      if (time < DURATION) {
        return 100 - (100 - this.resultPercent) * cubicOut((time - READY_END) / (DURATION - READY_END))
      }
      return this.resultPercent
    },
    displayPercent() {
      return Math.round(this.progress)
    },
    // 进度环遮罩角度：成功态直接满环，其余按百分比
    ringDegrees() {
      return this.isSuccess ? 360 : this.displayPercent * 3.6
    },
    // 轨道 / 弧的旋转进度：0.88 落在 1280ms，剩余 0.12 在 settling 段缓出补满
    rotationProgress() {
      if (this.elapsed >= DURATION) return 1
      const base = this.elapsed < READY_END
        ? (0.88 * this.elapsed) / READY_END
        : 0.88 + 0.12 * cubicOut(Math.min(1, (this.elapsed - READY_END) / (DURATION - READY_END)))
      return Math.max(0, Math.min(1, base))
    },
    isSuccess() {
      return this.phase === 'settling' || this.phase === 'complete'
    },
    statusText() {
      return this.isSuccess ? COPY_SUCCESS : COPY_CONNECTING
    },
    descriptionText() {
      return this.isSuccess ? `延迟预计降低${this.resultPercent}%` : this.gameName
    }
  },
  watch: {
    // 覆盖层是全屏层：显示期间请原生收起底部导航栏（那是原生 View，WebView 盖不住它），退出后恢复
    visible(visible) {
      setBottomNavVisible(!visible)
    },
    // 结果态停留 HOLD_MS 后自动出场
    phase() {
      this.scheduleHoldWhenComplete()
    }
  },
  mounted() {
    // motionQuery 是浏览器对象，作为普通实例字段持有（不进 data，避免被响应式包装）
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotion = this.motionQuery.matches
    this.motionQuery.addEventListener('change', this.handleMotionChange)

    this.updateLandscape()
    window.addEventListener('resize', this.updateLandscape)
    window.addEventListener('orientationchange', this.updateLandscape)
  },
  beforeUnmount() {
    this.cancelTimelineFrame()
    this.cancelEntranceFrames()
    this.clearHoldTimer()
    clearTimeout(this.exitTimer)
    if (this.motionQuery) this.motionQuery.removeEventListener('change', this.handleMotionChange)
    window.removeEventListener('resize', this.updateLandscape)
    window.removeEventListener('orientationchange', this.updateLandscape)
    // 覆盖层可能还开着就离开了页面，兜底恢复原生底部导航栏
    setBottomNavVisible(true)
  },
  methods: {
    /**
     * #18 加速进度球曝光（pv，单参数平铺）。
     * 本覆盖层就是「加速进度球」，每次出现都上报，不区分是否首次（需求文档 3.2 #18 已确认）。
     * 只有 play() 会把覆盖层挂出来，所以在这里上报就等于「每次出现各报 1 次」，不需要额外去重。
     * gameName 取本次触发的那张卡片的游戏名。
     */
    reportProgressBallShow() {
      console.log('[XunyouAccel] H5 #18 加速进度球曝光', { gameName: this.gameName })
      this.$dataReport('LZ_myGames', 'LZ_accelProgressBallStartShow', 'pv', { gameName: this.gameName })
    },
    /**
     * 唯一对外方法：开始播放整段过渡动画（父组件通过 $refs 调用）。
     * @param {string} gameName 触发时该卡片的游戏名，成功前作为副文案展示
     */
    play(gameName = '') {
      this.cancelTimelineFrame()
      this.cancelEntranceFrames()
      this.clearHoldTimer()
      clearTimeout(this.exitTimer)

      this.gameName = gameName || ''
      // 结果态要展示的百分比：每次播放都取一次最新值，接口不可用时回落默认
      this.resultPercent = getAccelPreviewBoostSync() || RESULT_PERCENT_FALLBACK
      this.elapsed = 0
      this.visible = true
      this.lifecycle = 'entering'

      // #18 加速进度球曝光：覆盖层出现的这一刻上报（gameName 已就位）
      this.reportProgressBallShow()

      this.startTimeline()
      // 关闭动效时 elapsed 同步落到 DURATION，phase 不产生「变化」事件，watcher 不会触发，
      // 这里补一次判定兜底（详见 scheduleHoldWhenComplete 注释）
      this.scheduleHoldWhenComplete()

      // 先以 entering 态挂载，隔两帧再切 active，让入场过渡真正跑起来
      this.$nextTick(() => {
        this.entranceFrame = requestAnimationFrame(() => {
          this.entranceFrame = requestAnimationFrame(() => {
            if (this.visible) this.lifecycle = 'active'
          })
        })
      })
    },
    /**
     * 结果态（complete）时安排 HOLD_MS 后出场；非结果态先把可能存在的定时器清掉。
     *
     * 不能只靠 phase watcher：关闭动效时 elapsed 会被同步直接置到 DURATION，
     * 若上一轮播放已经走到 complete（重复触发「加速启动」时很常见），这次赋值不产生「变化」，
     * watcher 不会触发 —— 覆盖层会一直挂在屏幕上、原生底部导航也一直收起。
     * 所以 play() 里也要显式补一次判定。
     */
    scheduleHoldWhenComplete() {
      this.clearHoldTimer()
      if (this.phase !== 'complete' || !this.visible) return
      this.holdTimer = setTimeout(this.beginExit, HOLD_MS)
    },
    startTimeline() {
      if (this.reducedMotion) {
        // 关闭动效：不走进度动画，直接落到结束态（出场由 play() 里的 scheduleHoldWhenComplete 安排）
        this.elapsed = DURATION
        return
      }
      this.startedAt = performance.now()
      this.frameId = requestAnimationFrame(this.tick)
    },
    tick(now) {
      this.elapsed = Math.min(DURATION, now - this.startedAt)
      if (this.elapsed < DURATION) {
        this.frameId = requestAnimationFrame(this.tick)
      } else {
        this.frameId = 0
      }
    },
    cancelTimelineFrame() {
      if (this.frameId) {
        cancelAnimationFrame(this.frameId)
        this.frameId = 0
      }
    },
    cancelEntranceFrames() {
      if (this.entranceFrame) {
        cancelAnimationFrame(this.entranceFrame)
        this.entranceFrame = 0
      }
    },
    clearHoldTimer() {
      clearTimeout(this.holdTimer)
      this.holdTimer = null
    },
    // 出场：内容区放大虚化淡出，EXIT_MS 后连 DOM 一起卸载
    beginExit() {
      if (!this.visible || this.lifecycle === 'exiting') return
      this.lifecycle = 'exiting'
      this.exitTimer = setTimeout(() => {
        this.visible = false
        // 出场动画跑完、覆盖层即将卸载 —— 此刻通知父组件可以拉起游戏了。
        // 放在这里而不是任何更早的时刻，是因为只有这里才代表「动画真的播完了」。
        // 该定时器在 play() 与 beforeUnmount 里都会被 clearTimeout，所以：
        // 重复触发时被覆盖的那一次走不到这里（只 emit 一次）；中途离开页面也不会 emit。
        this.$emit('finished')
      }, EXIT_MS)
    },
    // 与 gameSpace/index.vue 的 updateLandscape 保持一致，不引入新的宽度断点
    updateLandscape() {
      const byMedia = window.matchMedia('(orientation: landscape)').matches
      const bySize = window.innerWidth >= window.innerHeight
      this.isLandscape = byMedia || bySize
    },
    handleMotionChange(event) {
      this.reducedMotion = event.matches
      // 播放途中切到「关闭动效」：停表并直接落到结束态
      if (event.matches) {
        this.cancelTimelineFrame()
        this.elapsed = DURATION
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/* 设计稿：Figma SqpfWTwQHzbW3kwvBOe0mA / board 377:15571。
   几何与动效照 Demo（Temp/xunyou-accelerator-h5/src/features/accelerator/accelerator.css）移植。
   唯一结构性改动：Demo 用 @media (orientation: landscape) and (min-width: 768px) 切 Pad 构图，
   这里换成 .is-landscape（判定与 gameSpace/index.vue 的 updateLandscape 一致），不引入新的宽度断点。 */

$cyan: #12c8fe;
$gold: #ffebb7;
$vip-fill: rgb(255 200 0 / 20%);
$vip-stroke-center: rgb(255 235 183 / 27%);
$vip-stroke-edge: rgb(222 204 156 / 0%);
$vip-text-start: #fff2cd;
$vip-text-end: #f6dc92;

.accel-transition {
  position: fixed;
  // 与同页的加速信息抽屉（AcceleratorInfoDialog）同级，两者不会同时出现
  z-index: 9999;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: radial-gradient(ellipse at center, rgb(0 0 0 / 96%) 26%, rgb(4 7 10 / 88%) 100%);
  opacity: 0;
  transition: opacity 400ms cubic-bezier(0.22, 1, 0.36, 1);

  /* 入场后：整体淡入，内容区从缩小 + 模糊弹出 */
  &[data-lifecycle='active'] {
    opacity: 1;

    .accelerator {
      transform: scale(1);
      opacity: 1;
      filter: blur(0);
    }
  }

  /* 出场：整体淡出，内容区放大 + 模糊收走 */
  &[data-lifecycle='exiting'] {
    opacity: 0;
    transition-timing-function: cubic-bezier(0.4, 0, 1, 1);

    .accelerator {
      transform: scale(1.055);
      opacity: 0;
      filter: blur(5px);
      transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
    }
  }
}

/* 舞台容器：Phone 是 413 宽的整屏画布，内部尺寸全部用 cqw（相对本容器宽度）。
   Pad 由 .is-landscape 换成 1024×694 的等比画布。 */
.accelerator {
  position: relative;
  width: min(100%, 413px);
  height: 100vh; /* dvh 的兜底，取不到时退回视口高度 */
  height: 100dvh;
  min-height: min(640px, 100dvh);
  overflow: hidden;
  isolation: isolate;
  background: transparent;
  container-type: inline-size;
  transform: scale(0.9);
  opacity: 0;
  filter: blur(7px);
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease, filter 380ms ease;
}

/* 仪表：中心落在画布上 44.29% 处，故 top 需向上偏移半个直径（40cqw = 宽度 80% 的一半） */
.scanner {
  position: absolute;
  top: calc(44.29% - 40cqw);
  left: 10%;
  width: 80%;
  aspect-ratio: 1;
  isolation: isolate;
}

.frame {
  position: absolute;
  width: 100%;
  height: 100%;
  inset: 0;
}

.orbit,
.arc {
  position: absolute;
  inset: 0;
  will-change: transform;
}

.orbit img {
  width: 100%;
  height: 100%;
}

.arc {
  filter: drop-shadow(0 0 5px #12c8fe66);
}

/* 旋转弧是 101×330 的窄条，横向压到 30.61% 并居中 */
.arc img {
  position: absolute;
  width: 30.61%;
  height: 100%;
  left: 34.695%;
}

.track,
.progress {
  position: absolute;
  left: 17.53%;
  top: 18.42%;
  width: 64.94%;
  height: 64.94%;
}

/* 进度环用 conic-gradient 遮罩裁剪，--ring-progress 由当前百分比 × 3.6deg 得到 */
.progress {
  mask-image: conic-gradient(#000 var(--ring-progress), transparent 0deg);
  -webkit-mask-image: conic-gradient(#000 var(--ring-progress), transparent 0deg);
}

.progress img {
  width: 100%;
  height: 100%;
}

/* 中心读数：青→白渐变文字；成功态换成闪电 */
.readout {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Roboto, Arial, sans-serif;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  font-size: 11.62cqw;
  color: transparent;
  background: linear-gradient(180deg, $cyan 40%, #fff 60%);
  background-clip: text;
  -webkit-background-clip: text;
}

.percent-sign {
  font-size: 5.81cqw;
  margin-top: 12px;
}

.readout-success::before {
  content: '';
  position: absolute;
  width: 36%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(18 200 254 / 22%) 0%, rgb(56 135 255 / 10%) 42%, transparent 72%);
  filter: blur(3px);
  animation: success-glow 560ms ease-out both;
}

.success-bolt {
  position: relative;
  z-index: 1;
  width: 13.56cqw;
  height: 17.43cqw;
  overflow: visible;
  filter: drop-shadow(0 0 10px rgb(18 200 254 / 28%));
  animation: bolt-in 280ms cubic-bezier(0.2, 1.4, 0.4, 1) both;
}

/* 氛围光效：默认压到仪表底层（z-index: -1 被 .accelerator 的 isolation 关在本容器内） */
.atmosphere {
  position: absolute;
  left: 0;
  width: 100%;
  height: 58.84cqw;
  z-index: -1;
  pointer-events: none;
  opacity: 0.85;
  transition: opacity 700ms ease, translate 1s ease;
}

.atmosphere img {
  position: absolute;
  width: 100%;
  height: 100%;
  inset: 0;
  object-fit: fill;
}

.atmosphere-top {
  top: calc(44.29% - 74.33cqw);
}

.atmosphere-top img {
  transform: none;
}

.atmosphere-bottom {
  top: calc(44.29% + 30.02cqw);
}

.atmosphere-bottom img {
  transform: scaleY(-1);
}

/* 入场：两片光效从中间向外推入 */
[data-phase='starting'] .atmosphere-top {
  translate: 0 -18px;
  opacity: 0;
}

[data-phase='starting'] .atmosphere-bottom {
  translate: 0 18px;
  opacity: 0;
}

.message {
  position: absolute;
  top: calc(44.29% + 48.18cqw);
  left: 0;
  width: 100%;
  /* 必须显式声明：本项目 reset.scss 的 box-sizing 是元素白名单，不含 section，
     而 Demo 靠全局 `* { box-sizing: border-box }` 生效。缺了它 width:100% + padding
     会按 content-box 溢出，文案区整体右移一个 padding（Phone 16px / Pad 约 15px）。 */
  box-sizing: border-box;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}

/* VIP 条：宽度随状态收缩（成功态 218 → 128，延迟 110ms 起跑） */
.vip {
  --vip-width: 218px;
  position: relative;
  display: flex;
  width: var(--vip-width);
  align-items: center;
  min-height: 41px;
  color: $gold;
  font-weight: 700;
  font-size: clamp(12px, 3.875cqw, 16px);
  white-space: nowrap;
  transform: translateX(15.5px);
  transition: width 180ms 110ms cubic-bezier(0.22, 1, 0.36, 1);
}

.vip.vip-success {
  --vip-width: 128px;
}

.vip img {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: -31px;
  width: 31px;
  height: 38px;
  object-fit: fill;
  transform: translateY(-50%);
}

.vip-status {
  position: relative;
  display: grid;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  background: radial-gradient(ellipse 50% 367% at 50% 50%, $vip-fill 0%, transparent 100%);
  line-height: 24px;
  overflow: hidden;
}

/* 上下两条 1px 渐变描边（中间亮、两端透明） */
.vip-status::before,
.vip-status::after {
  content: '';
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  pointer-events: none;
  background: linear-gradient(90deg, $vip-stroke-edge 0%, $vip-stroke-center 50%, $vip-stroke-edge 100%);
}

.vip-status::before {
  top: 0;
}

.vip-status::after {
  bottom: 0;
}

.vip-status-text {
  grid-area: 1 / 1;
  display: block;
  color: transparent;
  background: linear-gradient(90deg, $vip-text-start 0%, $vip-text-end 100%);
  background-clip: text;
  -webkit-background-clip: text;
}

/* 副文案：两层堆在同一格，靠 copy-swap 过渡做上下替换 */
.message-description {
  display: grid;
  width: 100%;
  min-height: 30px;
  place-items: center;
  overflow: hidden;
}

.message-description p {
  grid-area: 1 / 1;
}

.message p {
  font-size: clamp(16px, 4.84cqw, 20px);
  font-weight: 500;
  color: $cyan;
  margin: 0;
  line-height: 1.5;
}

.copy-swap-enter-active {
  transition: opacity 130ms ease, transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
}

.copy-swap-leave-active {
  transition: opacity 90ms ease, transform 100ms ease;
}

.copy-swap-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.copy-swap-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

/* 成功态三层扩散波：本体 + ::before + ::after，依次延迟 80ms 起跑 */
.success-wave,
.success-wave::before,
.success-wave::after {
  position: absolute;
  border: 1.5px solid rgb(18 200 254 / 72%);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 0 10px rgb(18 200 254 / 24%), inset 0 0 8px rgb(56 135 255 / 14%);
}

.success-wave {
  inset: 17.5%;
}

.success-wave::before,
.success-wave::after {
  content: '';
  inset: 0;
}

[data-phase='settling'] .success-wave,
[data-phase='complete'] .success-wave {
  animation: wave 560ms cubic-bezier(0.12, 0.62, 0.2, 1) both;
}

[data-phase='settling'] .success-wave::before,
[data-phase='complete'] .success-wave::before {
  animation: wave 620ms 80ms cubic-bezier(0.12, 0.62, 0.2, 1) both;
}

[data-phase='settling'] .success-wave::after,
[data-phase='complete'] .success-wave::after {
  animation: wave 680ms 160ms cubic-bezier(0.12, 0.62, 0.2, 1) both;
}

@keyframes wave {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  16% {
    opacity: 0.82;
  }
  100% {
    opacity: 0;
    transform: scale(1.72);
  }
}

@keyframes success-glow {
  0% {
    opacity: 0;
    transform: scale(0.55);
  }
  32% {
    opacity: 1;
    transform: scale(1.08);
  }
  100% {
    opacity: 0.58;
    transform: scale(1);
  }
}

@keyframes bolt-in {
  from {
    opacity: 0;
    transform: scale(0.55) rotate(-8deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

/* Pad（横屏）：1024×694 的独立构图 —— 高度不足 694 时整体等比缩小并居中，不做局部重排。
   光效从「上下两片」改为「左右光翼」，入场位移方向也随之改为横向。 */
.is-landscape {
  .accelerator {
    width: min(100vw, calc(100dvh * 1.4755));
    height: auto;
    min-height: 0;
    aspect-ratio: 1024 / 694;
    max-width: none;
    box-shadow: 0 0 100px #000;
  }

  .scanner {
    top: 19.596%;
    left: calc(50% - 16.113cqw);
    width: 32.227cqw;
  }

  .readout {
    font-size: 4.688cqw;
  }

  .percent-sign {
    font-size: 2.344cqw;
    margin-top: 1.172cqw;
  }

  .success-bolt {
    width: 5.469cqw;
    height: 7.031cqw;
  }

  .message {
    top: 73.775%;
    left: calc(50% - 20.117cqw);
    width: 40.234cqw;
    padding: 1.563cqw;
    gap: 0.781cqw;
  }

  .vip {
    --vip-width: 21.289cqw;
    min-height: 4.102cqw;
    font-size: 1.563cqw;
    transform: translateX(1.514cqw);
  }

  .vip.vip-success {
    --vip-width: 12.5cqw;
  }

  .vip img {
    left: -3.027cqw;
    width: 3.027cqw;
    height: 3.711cqw;
  }

  .vip-status {
    width: 100%;
    padding: 0.781cqw;
    line-height: 2.344cqw;
  }

  .message p {
    font-size: 1.953cqw;
  }

  .atmosphere {
    top: 17.579%;
    width: 23.73cqw;
    height: 40.332cqw;
  }

  .atmosphere img {
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .atmosphere-top {
    left: 4.199cqw;
  }

  .atmosphere-top img {
    transform: rotate(90deg);
  }

  .atmosphere-bottom {
    left: auto;
    right: 6.152cqw;
  }

  .atmosphere-bottom img {
    transform: rotate(90deg) scaleX(-1);
  }

  [data-phase='starting'] .atmosphere-top {
    translate: -18px 0;
  }

  [data-phase='starting'] .atmosphere-bottom {
    translate: 18px 0;
  }
}

/* 关闭动效：动画退化为直接展示结果（时间轴已在 JS 侧跳到 DURATION） */
@media (prefers-reduced-motion: reduce) {
  .accel-transition,
  .accel-transition *,
  .accel-transition *::before,
  .accel-transition *::after {
    animation: none !important;
    transition: none !important;
  }

  .orbit,
  .arc {
    will-change: auto;
  }
}
</style>
