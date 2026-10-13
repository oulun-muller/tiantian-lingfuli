<template>
  <!-- 加速信息页（覆盖层）：pad 居中悬浮，phone 底部抽屉。两侧内部结构完全一致，仅容器形态不同。
       业务数据（游戏、指标、计时）暂时全部由外部传入或走默认值，等入口与接口就绪后接入。 -->
  <div class="accel-info" :class="isPhone ? 'is-phone' : 'is-pad'">
    <transition name="accel-fade">
      <div v-if="visible" class="accel-info__mask" @click="close"></div>
    </transition>

    <transition :name="isPhone ? 'accel-sheet' : 'accel-pop'">
      <div v-if="visible" class="accel-info__panel" @click.stop>
        <!-- 顶部缺口装饰条 -->
        <div class="topbar">
          <img class="topbar__center" :src="topbarCenterImg" alt="" aria-hidden="true" />
          <img class="topbar__side is-left" :src="topbarSideImg" alt="" aria-hidden="true" />
          <img class="topbar__side is-right" :src="topbarSideImg" alt="" aria-hidden="true" />
          <img class="topbar__hatch is-left" :src="topbarHatchImg" alt="" aria-hidden="true" />
          <img class="topbar__hatch is-right" :src="topbarHatchImg" alt="" aria-hidden="true" />
          <img class="topbar__line is-left" :src="topbarLineImg" alt="" aria-hidden="true" />
          <img class="topbar__line is-right" :src="topbarLineImg" alt="" aria-hidden="true" />
          <span class="topbar__pill"></span>
        </div>

        <!-- 游戏信息行 -->
        <div class="game-row">
          <div class="game-row__main">
            <div class="game-row__icon">
              <img :src="resolvedGameIcon" alt="" />
            </div>
            <div class="game-row__meta">
              <p class="game-row__name">{{ gameName }}</p>
              <button
                type="button"
                class="game-row__server"
                :class="{ 'is-static': !showServerArrow }"
                @click="handleServerClick">
                <span>{{ serverName }}</span>
                <img v-if="showServerArrow" :src="dropdownArrowImg" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div class="game-row__vip">
            <img class="game-row__vip-badge" :src="vipBadgeImg" alt="" aria-hidden="true" />
            <p class="game-row__vip-text">VIP专属加速中</p>
          </div>
        </div>

        <!-- 综合提速 / 丢包率 -->
        <div class="metrics">
          <div v-for="metric in metricList" :key="metric.key" class="metric">
            <span class="metric__label">{{ metric.label }}</span>
            <p class="metric__value">
              <span class="metric__num">{{ metric.value }}</span>
              <span class="metric__unit">%</span>
            </p>
            <i class="metric__corner is-tl"></i>
            <i class="metric__corner is-tr"></i>
            <i class="metric__corner is-bl"></i>
            <i class="metric__corner is-br"></i>
          </div>
        </div>

        <!-- 实时网络延迟监控 -->
        <div class="monitor-wrap">
          <div class="monitor">
            <div class="monitor__grid" aria-hidden="true"></div>

            <div class="monitor__body">
              <p class="monitor__title">实时网络延迟监控</p>
              <!-- 折线随原生每秒推的延迟序列实时重绘；无数据时回落到设计稿静态底图 -->
              <svg
                v-if="hasChartData"
                class="monitor__chart"
                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true">
                <defs>
                  <linearGradient :id="chartGradId" x1="0" :y1="chartHeight / 2" :x2="chartWidth" :y2="chartHeight / 2" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#3887FF" />
                    <stop offset="1" stop-color="#0AD6FF" />
                  </linearGradient>
                </defs>
                <path v-if="beforePath" :d="beforePath" stroke="#C3A657" stroke-width="1" stroke-dasharray="2 2" />
                <path v-if="afterPath" :d="afterPath" :stroke="`url(#${chartGradId})`" stroke-width="2" stroke-linejoin="round" />
              </svg>
              <img v-else class="monitor__chart" :src="isPhone ? chartPhoneImg : chartImg" alt="" aria-hidden="true" />
            </div>

            <div class="monitor__legend">
              <div class="monitor__legend-item">
                <span class="monitor__legend-tag">
                  <i class="monitor__legend-line is-dashed"></i>
                  <span class="monitor__legend-label">加速前平均</span>
                </span>
                <p class="monitor__legend-value is-before">
                  <span>{{ displayDelayBefore }}</span>
                  <span>ms</span>
                </p>
              </div>
              <div class="monitor__legend-item">
                <span class="monitor__legend-tag">
                  <i class="monitor__legend-line is-solid"></i>
                  <span class="monitor__legend-label">加速后</span>
                </span>
                <p class="monitor__legend-value is-after">
                  <span>{{ displayDelayAfter }}</span>
                  <span>ms</span>
                </p>
              </div>
            </div>

            <!-- 边角光带：上/下各一组 -->
            <div v-for="edge in ['top', 'bottom']" :key="edge" class="monitor__glow" :class="`is-${edge}`" aria-hidden="true">
              <img class="monitor__glow-fill" :src="panelGlowFillImg" alt="" />
              <img class="monitor__glow-stroke" :src="panelGlowStrokeImg" alt="" />
              <img class="monitor__glow-cap is-left" :src="panelGlowCapImg" alt="" />
              <img class="monitor__glow-cap is-right" :src="panelGlowCapImg" alt="" />
              <img class="monitor__glow-blob" :src="panelGlowBlobImg" alt="" />
            </div>

            <!-- 四角斜纹 + 两个描边角 -->
            <img class="monitor__hatch is-tl" :src="panelHatchImg" alt="" aria-hidden="true" />
            <img class="monitor__hatch is-bl" :src="panelHatchImg" alt="" aria-hidden="true" />
            <img class="monitor__hatch is-tr" :src="panelHatchImg" alt="" aria-hidden="true" />
            <img class="monitor__hatch is-br" :src="panelHatchImg" alt="" aria-hidden="true" />
            <img class="monitor__corner is-tl" :src="panelCornerImg" alt="" aria-hidden="true" />
            <img class="monitor__corner is-br" :src="panelCornerImg" alt="" aria-hidden="true" />
          </div>
        </div>

        <!-- 加速模式：迅游 SDK 暂未提供切换接口，整块隐藏（SDK 支持后把 modeSwitchEnabled 置 true 即可恢复） -->
        <div v-if="modeSwitchEnabled" class="mode">
          <p class="mode__title">加速模式</p>
          <div class="mode__track">
            <span class="mode__thumb" :style="{ transform: `translateX(${modeIndex * 100}%)` }" aria-hidden="true">
              <img class="mode__chevron is-left" :src="modeChevronImg" alt="" />
              <img class="mode__chevron is-right" :src="modeChevronImg" alt="" />
            </span>
            <button
              v-for="(mode, index) in modes"
              :key="mode.value"
              type="button"
              class="mode__item"
              :class="{ 'is-active': index === modeIndex }"
              @click="selectMode(index)">
              {{ mode.label }}
            </button>
          </div>
        </div>

        <!-- 停止加速 / 打开游戏 -->
        <div class="actions">
          <button type="button" class="actions__btn is-stop" @click="$emit('stop')">
            <i class="actions__stop-icon" aria-hidden="true"></i>
            <span class="actions__stop-label">停止加速</span>
            <span class="actions__stop-time">{{ elapsed }}</span>
          </button>
          <button type="button" class="actions__btn is-open" @click="$emit('open-game')">打开游戏</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import topbarCenterImg from './image/topbar-center.svg'
import topbarSideImg from './image/topbar-side.svg'
import topbarHatchImg from './image/topbar-hatch.svg'
import topbarLineImg from './image/topbar-line.svg'
import dropdownArrowImg from './image/dropdown-arrow.svg'
import vipBadgeImg from './image/vip-badge.png'
import gameIconDefault from './image/game-icon-default.png'
import chartImg from './image/chart-line.svg'
import chartPhoneImg from './image/chart-line-phone.svg'
import panelHatchImg from './image/panel-hatch.svg'
import panelCornerImg from './image/panel-corner.svg'
import panelGlowFillImg from './image/panel-glow-fill.svg'
import panelGlowStrokeImg from './image/panel-glow-stroke.svg'
import panelGlowCapImg from './image/panel-glow-cap.svg'
import panelGlowBlobImg from './image/panel-glow-blob.webp'
import modeChevronImg from './image/mode-chevron.svg'

export default {
  name: 'AcceleratorInfoDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 加速中的游戏：名称 / 服务器 / 图标都来自入口，暂由外部传入或走设计稿默认值
    gameName: {
      type: String,
      default: '无畏契约'
    },
    serverName: {
      type: String,
      default: '国服'
    },
    // 可切换区服 ≤1 个时没有真正的选择：隐藏下拉箭头，点击也不抛 server-click（入口变成纯展示）
    showServerArrow: {
      type: Boolean,
      default: true
    },
    gameIcon: {
      type: String,
      default: ''
    },
    // 指标数据：没有原生实时数据（panel.ready 为假）时一律展示 0。
    // 不能用设计稿的示意值（60 / 01 / 58 / 29）——那几个数字会被用户当成真实读数。
    speedUpPercent: {
      type: [String, Number],
      default: '0'
    },
    lossRate: {
      type: [String, Number],
      default: '0'
    },
    delayBefore: {
      type: [String, Number],
      default: 0
    },
    delayAfter: {
      type: [String, Number],
      default: 0
    },
    // 加速计时：由外部触发记录并格式化好（如 '00:01'）后传入
    elapsed: {
      type: String,
      default: '00:01'
    },
    // 加速信息面板实时数据（原生 accel_panel 推送）：
    // {delayMs, baseMs, boost, loss, delaySeries, baseSeries, ready}。null 表示暂无，走 props 默认值。
    panel: {
      type: Object,
      default: null
    },
    modes: {
      type: Array,
      default: () => [
        { value: 'normal', label: '普通' },
        { value: 'advanced', label: '高级' },
        { value: 'esports', label: '竞技' }
      ]
    },
    // 默认选中项：接口未就绪，仅做视觉切换
    defaultMode: {
      type: String,
      default: 'advanced'
    }
  },
  emits: ['update:visible', 'stop', 'open-game', 'server-click', 'mode-change'],
  data() {
    return {
      topbarCenterImg,
      topbarSideImg,
      topbarHatchImg,
      topbarLineImg,
      dropdownArrowImg,
      vipBadgeImg,
      gameIconDefault,
      chartImg,
      chartPhoneImg,
      panelHatchImg,
      panelCornerImg,
      panelGlowFillImg,
      panelGlowStrokeImg,
      panelGlowCapImg,
      panelGlowBlobImg,
      modeChevronImg,
      modeIndex: 0,
      // 迅游 SDK 未提供加速模式切换接口，「加速模式」模块整体隐藏（含配套的 #24 曝光埋点）
      modeSwitchEnabled: false
    }
  },
  computed: {
    isPhone() {
      return this.$isPhoneDevice
    },
    // 图标为空时回落到设计稿占位图，保证单独打开弹层时也有内容
    resolvedGameIcon() {
      return this.gameIcon || this.gameIconDefault
    },
    // 面板是否有原生实时数据（否则整块回落到 props 默认值 / 静态底图）
    hasPanel() {
      return !!(this.panel && this.panel.ready)
    },
    // 综合提速：优先原生推的 boost，否则 props 默认
    displaySpeedUp() {
      // 面板已就绪时一律以原生值为准：该字段为 null 说明这一秒没有读数，显示 --。
      // 绝不能回落到 props 默认值——那会把一个编造的百分比当成实时值展示。
      if (this.hasPanel) return this.panel.boost == null ? '--' : this.panel.boost
      return this.speedUpPercent
    },
    // 丢包率：优先原生推的 loss（丢包帧也有值，它是窗口统计，不依赖当秒读数）
    displayLoss() {
      if (this.hasPanel && this.panel.loss != null) return this.panel.loss
      return this.lossRate
    },
    // 加速前平均延时
    displayDelayBefore() {
      if (this.hasPanel) return this.panel.baseMs == null ? '--' : this.panel.baseMs
      return this.delayBefore
    },
    // 加速后延时（当前延时）
    displayDelayAfter() {
      if (this.hasPanel) return this.panel.delayMs == null ? '--' : this.panel.delayMs
      return this.delayAfter
    },
    metricList() {
      return [
        { key: 'speedUp', label: '综合提速', value: this.displaySpeedUp },
        { key: 'loss', label: '丢包率', value: this.displayLoss }
      ]
    },
    // 折线数据：加速前（基线）+ 加速后（当前）两条序列，来自原生
    beforeSeries() {
      return (this.hasPanel && Array.isArray(this.panel.baseSeries)) ? this.panel.baseSeries : []
    },
    afterSeries() {
      return (this.hasPanel && Array.isArray(this.panel.delaySeries)) ? this.panel.delaySeries : []
    },
    hasChartData() {
      // 要有两个真实读数才画得出一条线；序列里的 null 是「该秒无读数」的断点
      return this.afterSeries.filter(v => typeof v === 'number').length >= 2
    },
    chartWidth() {
      return this.isPhone ? 347.708 : 535.545
    },
    chartHeight() {
      return this.isPhone ? 76.1907 : 76.5917
    },
    chartGradId() {
      return this.isPhone ? 'accel-chart-grad-phone' : 'accel-chart-grad-pad'
    },
    // 采样窗口的槽位数，由原生随帧下发。兜底 40 只在拿不到该字段（旧帧/接口不可用）时生效。
    chartWindow() {
      const size = Number(this.panel && this.panel.windowSize)
      return Number.isFinite(size) && size > 1 ? size : 40
    },
    // 加速前基线值：与图例上「加速前平均」的数字同源，保证虚线与数字永远一致
    beforeLineValue() {
      const value = this.hasPanel ? this.panel.baseMs : this.delayBefore
      return typeof value === 'number' && Number.isFinite(value) ? value : null
    },
    // 两条线共用同一 y 值域（min/max），保证「加速前在上、加速后在下」的相对关系正确。
    // 当前基线值也计入值域：它是一条常量线，不参与历史采样，漏掉它会把虚线画到画布外。
    chartBounds() {
      const all = [...this.beforeSeries, ...this.afterSeries, this.beforeLineValue].filter(v => typeof v === 'number')
      if (!all.length) return { min: 0, max: 1 }
      let min = Math.min(...all)
      let max = Math.max(...all)
      if (max === min) max = min + 1
      return { min, max }
    },
    afterPath() {
      return this.buildPath(this.afterSeries)
    },
    // 「加速前平均」是一条常量基线，不是折线：贯穿全宽的水平虚线，y 只随当前加速前延迟变化。
    // 不能改回 buildPath(beforeSeries) —— 原生每秒重抽一次加速前系数，逐点连线会画成一条随机
    // 跳动的折线，看起来像「加速前也在实时波动」，与「平均」的语义不符。
    beforePath() {
      if (this.beforeLineValue == null) return ''
      const y = this.valueToY(this.beforeLineValue).toFixed(2)
      return `M0 ${y}L${this.chartWidth} ${y}`
    }
  },
  watch: {
    defaultMode: {
      handler() {
        this.syncModeIndex()
      },
      immediate: true
    },
    // #23 / #24 的曝光时机：「详情页打开并渲染完成」。本页是抽屉弹层（不是路由页），
    // visible 每次变 true 都算一次新的生命周期，各报 1 次（需求文档 1.2）。
    visible: {
      handler(visible) {
        if (visible) this.reportPageShow()
      }
    }
  },
  methods: {
    // 区服入口：箭头隐藏（没有可切换的区服）时点击什么都不做，不抛事件、也不弹 toast
    handleServerClick() {
      if (!this.showServerArrow) return
      this.$emit('server-click')
    },
    /* ============ 迅游加速埋点（需求文档 3.3「加速详情页」）============
       #23 / #24 都是 pv：本弹层每次打开各报 1 次。单参数平铺在 params 顶层，
       多参数放进 detail 的 JSON 字符串。#24（加速模式模块曝光）与 #25（切换加速模式）
       都依赖加速模式模块，迅游 SDK 未提供切换接口，模块隐藏期间一并停报。 */
    /**
     * #23 加速详情页曝光（pv，单参数平铺）。#24 随加速模式模块隐藏而停报。
     */
    reportPageShow() {
      // $nextTick：弹层内容渲染完成后再上报（需求文档 #23 的触发时机定义）
      this.$nextTick(() => {
        console.log('[XunyouAccel] H5 #23 加速详情页曝光', { gameName: this.gameName })
        this.$dataReport('LZ_myGames', 'LZ_accelMonitorPageShow', 'pv', { gameName: this.gameName })
        this.reportAuxToolShow()
      })
    },
    /**
     * #24 加速模式模块曝光（pv）。toolstatus 上报当前选中的模式：
     * normal 普通 / advanced 高级 / competitive 竞技。
     * 竞技在代码内部的值是 esports，上报值必须是 competitive（需求文档 3.3 #24 的映射要求）。
     */
    reportAuxToolShow() {
      // 模块整体隐藏时不产生曝光
      if (!this.modeSwitchEnabled) return
      const mode = this.modes[this.modeIndex] || {}
      const toolstatus = mode.value === 'esports' ? 'competitive' : mode.value
      const detail = { gameName: this.gameName, toolstatus }
      console.log('[XunyouAccel] H5 #24 加速模式模块曝光', detail)
      this.$dataReport('LZ_myGames', 'LZ_accelMonitorAuxToolShow', 'pv', { detail: JSON.stringify(detail) })
    },
    syncModeIndex() {
      const index = this.modes.findIndex(mode => mode.value === this.defaultMode)
      this.modeIndex = index === -1 ? 0 : index
    },
    // 把延迟值映射成 viewBox 内的 y：值越大越靠上，上下各留 8px 边距
    valueToY(value) {
      const pad = 8
      const { min, max } = this.chartBounds
      const ratio = (value - min) / (max - min || 1)
      return pad + (1 - ratio) * (this.chartHeight - pad * 2)
    },
    // 把一串延迟值映射成 viewBox 内的折线 path。上下各留 8px 边距。
    //
    // x 轴按时间排布：槽位宽度由整个窗口（而不是当前已有的点数）均分，所以窗口没填满时
    // 折线只占左侧一段，第 0 帧贴左边缘、随时间向右生长，满 40 帧后再整幅滚动。
    // 若改成「最新一帧贴右边缘、历史向左延伸」，刚加速那几十秒曲线会一直贴在右边、
    // 左端永远钉在起步那一帧上（隧道未热、数值偏高），看上去就是「一直停在起步态」。
    // 也不能按 series.length 均分：那样每次多一帧整条曲线都会被重新拉伸铺满全幅。
    buildPath(series) {
      if (!Array.isArray(series) || series.length < 2) return ''
      const w = this.chartWidth
      const slots = Math.max(this.chartWindow, series.length)
      const stepX = w / (slots - 1)
      const parts = []
      let pen = 'M'
      series.forEach((v, i) => {
        if (typeof v !== 'number') {
          // 该秒没有读数：抬笔，让折线在这里断开，而不是连一条假的直线过去
          pen = 'M'
          return
        }
        parts.push(`${pen}${(i * stepX).toFixed(2)} ${this.valueToY(v).toFixed(2)}`)
        pen = 'L'
      })
      return parts.join(' ')
    },
    selectMode(index) {
      if (index === this.modeIndex) return
      this.modeIndex = index
      this.$emit('mode-change', this.modes[index])
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style lang="scss" scoped>
/* 设计稿：pad 1024×639 居中弹窗 600 宽（节点 293:8414）；
   phone 412×914 底部抽屉（节点 326:11963）。两侧内部结构一致，统一 gap 8。 */
.accel-info {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  pointer-events: none;

  &.is-pad {
    align-items: center;
    justify-content: center;
  }

  &.is-phone {
    align-items: flex-end;
  }

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    pointer-events: auto;
  }

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    box-sizing: border-box;
    /* 面板只留 0.5px 的白色描边，不带任何外发光 */
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    background: #1e232b;
    pointer-events: auto;
  }

  &.is-pad &__panel {
    width: min(600px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    border-radius: 8px;
    overflow-y: auto;
  }

  &.is-phone &__panel {
    width: 100%;
    max-height: 92vh;
    border-radius: 8px 8px 0 0;
    overflow-y: auto;
  }
}

/* 顶部缺口装饰条：中间 272 缺口条 + 两端 35.5 斜角 + 蓝色斜线/斜纹/把手 */
.topbar {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  height: 20px;

  &__center {
    position: absolute;
    left: 50%;
    top: 0;
    width: 272px;
    height: 20px;
    margin-left: -136px;
  }

  &__side {
    position: absolute;
    top: 0;
    width: 35.5px;
    height: 20px;

    &.is-left {
      left: 0;
    }

    &.is-right {
      right: 0;
      transform: scaleX(-1);
    }
  }

  &__hatch {
    position: absolute;
    top: 7px;
    width: 36px;
    height: 13px;

    &.is-left {
      left: 132px;
    }

    &.is-right {
      right: 137px;
    }
  }

  &__line {
    position: absolute;
    top: 0;
    width: 60px;
    height: 1px;

    &.is-left {
      left: 97px;
    }

    &.is-right {
      right: 103px;
    }
  }

  &__pill {
    position: absolute;
    left: 50%;
    top: 8px;
    width: 44px;
    height: 4px;
    margin-left: -22px;
    border-radius: 33px;
    background: #2a66db;
  }
}

/* 游戏行：64 图标 + 名称/服务器，右侧 VIP 徽章（设计稿行高 65） */
.game-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-shrink: 0;
  width: 100%;
  min-height: 65px;
  padding: 0 16px;

  &__main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  &__icon {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border: 0.6px solid #fff;
    border-radius: 16px;
    background: #fff;
    overflow: hidden;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  &__name {
    width: 100%;
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
    color: #f5f5f5;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__server {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0;
    border: none;
    background: none;
    font-size: 14px;
    line-height: 21px;
    color: #3887ff;
    cursor: pointer;

    img {
      display: block;
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    &:active {
      opacity: 0.7;
    }

    // 纯展示态（无可切换区服）：没有点击行为，不要给出可按下的反馈
    &.is-static {
      cursor: default;

      &:active {
        opacity: 1;
      }
    }
  }

  &__vip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    width: 67px;
  }

  &__vip-badge {
    display: block;
    width: 44px;
    height: 44px;
  }

  &__vip-text {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    line-height: normal;
    white-space: nowrap;
    background: linear-gradient(90deg, #fff2cd 0%, #f6dc92 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

/* 综合提速 / 丢包率：两个等宽深蓝块，四角带蓝色圆弧描边 */
.metrics {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
  width: 100%;
  padding: 16px;
}

.metric {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  height: 45px;
  padding-bottom: 8px;
  box-sizing: border-box;
  border: 0.5px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  background: #1c2e47;

  &__label {
    font-size: 10px;
    line-height: 20px;
    color: rgba(245, 245, 245, 0.72);
    white-space: nowrap;
  }

  &__value {
    display: flex;
    align-items: baseline;
    height: 28px;
    margin: 0;
    font-weight: 500;
    line-height: 28px;
    white-space: nowrap;
    background: linear-gradient(180deg, #12c8fe 0%, #ffffff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__num {
    font-size: 24px;
  }

  &__unit {
    font-size: 12px;
  }

  /* 四角蓝色圆弧：圆心落在卡片角内 8px 处，圆弧贴住角（等效圆角半径 8），不能内缩 */
  &__corner {
    position: absolute;
    width: 8px;
    height: 8px;
    background: url('./image/metric-corner.svg') no-repeat center / 100% 100%;

    &.is-tl {
      left: 0;
      top: 0;
      transform: rotate(180deg);
    }

    &.is-tr {
      right: 0;
      top: 0;
      transform: scaleY(-1);
    }

    &.is-bl {
      left: 0;
      bottom: 0;
      transform: scaleX(-1);
    }

    &.is-br {
      right: 0;
      bottom: 0;
    }
  }
}

.monitor-wrap {
  flex-shrink: 0;
  width: 100%;
  padding: 0 16px;
}

/* 延迟监控卡片：网格背景 + 折线 + 图例 + 四角装饰与上下光带 */
.monitor {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 166px;
  padding: 16px;
  box-sizing: border-box;
  border: 0.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.32);
  /* 上下两片大而扁的径向蓝晕。用百分比而不是 px：pad/phone 卡片宽度不同（568/380），
     但设计稿两版的光晕占卡片比例一致（60.66%×32.4% / 57.65%×47.49%） */
  background-image:
    radial-gradient(ellipse 60.66% 32.4% at 50% 100%, rgba(56, 135, 255, 0.27) 0%, rgba(56, 135, 255, 0) 100%),
    radial-gradient(ellipse 57.65% 47.49% at 50% 0%, rgba(56, 135, 255, 0.27) 0%, rgba(56, 135, 255, 0) 100%);
  box-shadow: inset 0 0 24px rgba(56, 135, 255, 0.31);

  /* 网格：10.5 间距白线，中心向外径向淡出（设计稿为 525×283 的矢量网格）。
     设计稿线宽 0.2、颜色白 20%，折合到 1px 线的等效不透明度约 4% */
  &__grid {
    position: absolute;
    left: -72.5px;
    top: 50%;
    width: 525px;
    height: 283px;
    transform: translateY(-50%);
    background-image:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 10.5px),
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 10.48px);
    -webkit-mask-image: radial-gradient(ellipse 187.8px 72.5px at 50% 50%, #000 0%, transparent 100%);
    mask-image: radial-gradient(ellipse 187.8px 72.5px at 50% 50%, #000 0%, transparent 100%);
    pointer-events: none;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
  }

  &__chart {
    display: block;
    width: 100%;
    height: 76px;
  }

  &__title {
    margin: 0;
    font-size: 14px;
    line-height: 21px;
    color: rgba(245, 245, 245, 0.48);
    text-align: center;
  }

  &__legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    width: 100%;
  }

  &__legend-item {
    display: flex;
    /* 文字底部与数字底部齐平（设计稿两者下沿对齐），色块单独在文字内部居中，见 __legend-tag */
    align-items: flex-end;
    gap: 8px;
  }

  /* 色块 + 文案成组：组内竖直居中，让虚线/实线的中心落在「加速前平均」文字的竖直中线上。
     组本身随文字底部参与外层的 flex-end 对齐，所以文字不会被数字的基线带下去 */
  &__legend-tag {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__legend-line {
    width: 16px;
    height: 2px;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    flex-shrink: 0;

    &.is-dashed {
      background-image: url('./image/legend-dashed.svg');
    }

    &.is-solid {
      background-image: url('./image/legend-solid.svg');
    }
  }

  &__legend-label {
    font-size: 12px;
    line-height: 18px;
    color: rgba(245, 245, 245, 0.72);
    white-space: nowrap;
  }

  &__legend-value {
    display: flex;
    align-items: baseline;
    height: 28px;
    margin: 0;
    font-weight: 500;
    line-height: 28px;
    white-space: nowrap;

    span:first-child {
      font-size: 24px;
    }

    span:last-child {
      font-size: 12px;
    }

    &.is-before {
      color: rgba(245, 245, 245, 0.72);
    }

    &.is-after {
      color: #12c8fe;
    }
  }

  /* 上下边光带：236×10 的发光胶囊，绕中心水平拉伸（设计稿为竖向渐变条旋转 90°） */
  &__glow {
    position: absolute;
    left: 50%;
    width: 236px;
    height: 10px;
    margin-left: -118px;
    pointer-events: none;

    &.is-top {
      top: -0.5px;
    }

    &.is-bottom {
      bottom: -0.5px;
      transform: scaleY(-1);
    }

    img {
      position: absolute;
      display: block;
    }
  }

  /* 素材是 9×234 的竖条，绕中心转 90° 放平。
     末尾的 scaleX(-1) 不能省：设计稿这两个包裹层是 `-scale-x-100 rotate-90`（Figma 节点
     326:14269 / 326:14270 的子层 315:5489、315:5471），Tailwind 的 transform 顺序是
     rotate 在前 scale 在后，等价于「先水平镜像、再转 90°」。少了它，长光带的鼓包会朝外
     （贴边），设计稿是朝卡内。 */
  &__glow-fill {
    left: 50%;
    top: 50%;
    width: 8px;
    height: 234px;
    transform: translate(-50%, -50%) rotate(90deg) scaleX(-1);
  }

  &__glow-stroke {
    left: 50%;
    top: 50%;
    width: 9px;
    height: 234.5px;
    transform: translate(-50%, -50%) rotate(90deg) scaleX(-1);
  }

  &__glow-cap {
    top: 3.5px;
    width: 35px;
    height: 3.2px;

    /* 两块亮角是一对向外上扬的镜像：设计稿把 -scale-x-100 挂在**左边**那块上，
       右边那块用素材原方向（Figma 节点 326:14269 / 326:14270 的子层 315:5495、315:5491）。
       挂反了两块就都变成朝中心上扬，看着就是「方向反了」。 */
    &.is-left {
      left: 51px;
      transform: scaleX(-1);
    }

    &.is-right {
      right: 50.5px;
    }
  }

  &__glow-blob {
    left: 50%;
    bottom: -18px;
    width: 67px;
    height: 38px;
    margin-left: -33.5px;
  }

  &__hatch {
    position: absolute;
    width: 36px;
    height: 13px;
    pointer-events: none;

    &.is-tl {
      left: 16.5px;
      top: 1.5px;
    }

    &.is-bl {
      left: 16.5px;
      top: 152.5px;
      transform: scaleY(-1);
    }

    &.is-tr {
      right: 19.5px;
      top: 1.5px;
      transform: scaleX(-1);
    }

    &.is-br {
      right: 19.5px;
      top: 152.5px;
      transform: rotate(180deg);
    }
  }

  &__corner {
    position: absolute;
    width: 30px;
    height: 30px;
    pointer-events: none;

    &.is-tl {
      left: -0.5px;
      top: 0;
      transform: rotate(180deg);
    }

    &.is-br {
      right: -0.5px;
      bottom: -0.5px;
    }
  }
}

/* 加速模式：三段等宽，选中胶囊滑动位移（接口未就绪，仅视觉切换） */
.mode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 100%;
  /* 设计稿在监控卡片与本模块之间放了一个 0 高度的隐藏分隔元素，额外占掉一个 gap，
     最终间距为 16 而不是 8；这里用 margin 补回 */
  margin-top: 8px;
  padding: 0 16px;

  &__title {
    margin: 0;
    font-size: 14px;
    line-height: 21px;
    color: rgba(245, 245, 245, 0.48);
    text-align: center;
  }

  &__track {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 48px;
    padding: 4px;
    box-sizing: border-box;
    border: 0.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.32);
  }

  &__thumb {
    position: absolute;
    left: 4px;
    top: 4px;
    width: calc((100% - 8px) / 3);
    height: calc(100% - 8px);
    box-sizing: border-box;
    border: 1px solid #3887ff;
    border-radius: 4px;
    background-color: rgba(56, 135, 255, 0.11);
    /* 上下两条细长径向光晕。同样用百分比：pad/phone 胶囊宽度不同，但设计稿比例一致 */
    background-image:
      radial-gradient(ellipse 54.95% 32.05% at 50% 100%, rgba(56, 135, 255, 0.8) 0%, rgba(56, 135, 255, 0) 100%),
      radial-gradient(ellipse 50.7% 35.9% at 50% 0%, rgba(56, 135, 255, 0.8) 0%, rgba(56, 135, 255, 0) 100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  &__chevron {
    position: absolute;
    top: 50%;
    width: 19.13px;
    height: 22px;
    margin-top: -11px;

    &.is-left {
      left: 20.13px;
      transform: scaleX(-1);
    }

    &.is-right {
      right: 1px;
    }
  }

  &__item {
    position: relative;
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    font-size: 14px;
    line-height: normal;
    color: rgba(245, 245, 245, 0.48);
    text-align: center;
    cursor: pointer;
    transition: color 0.28s ease;

    &.is-active {
      color: #adcafa;
      font-weight: 500;
    }
  }
}

/* 底部操作：停止加速（描边渐变）+ 打开游戏（浅色渐变） */
.actions {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-shrink: 0;
  width: 100%;
  /* 同上：设计稿此处也有一个 0 高度的隐藏分隔元素，间距为 16 */
  margin-top: 8px;
  padding: 16px;

  &__btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    height: 48px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    line-height: normal;
    cursor: pointer;

    &:active {
      opacity: 0.8;
    }
  }

  &__btn.is-stop {
    gap: 4px;
    border: 0.5px solid #3887ff;
    background: linear-gradient(180deg, rgba(56, 135, 255, 0.08) 0%, rgba(56, 135, 255, 0.4) 100%);
    color: #6ba3ff;

    /* 网点：右下 5×2、左中 2×5（与设计稿一致，两个按钮互为镜像） */
    &::before,
    &::after {
      content: '';
      position: absolute;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      pointer-events: none;
    }

    &::before {
      right: 8px;
      bottom: 8px;
      width: 14px;
      height: 5px;
      background-image: url('./image/action-dots-h.svg');
    }

    &::after {
      left: 8px;
      top: 50%;
      width: 5px;
      height: 14px;
      margin-top: -7px;
      background-image: url('./image/action-dots-v.svg');
    }
  }

  &__btn.is-open {
    border: 0.5px solid #f5f5f5;
    background: linear-gradient(180deg, rgba(245, 245, 245, 0.48) 0%, #f5f5f5 100%);
    color: #162233;

    &::before,
    &::after {
      content: '';
      position: absolute;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      pointer-events: none;
    }

    &::before {
      left: 8px;
      bottom: 8px;
      width: 14px;
      height: 5px;
      background-image: url('./image/action-dots-h.svg');
    }

    &::after {
      right: 8px;
      top: 50%;
      width: 5px;
      height: 14px;
      margin-top: -7px;
      background-image: url('./image/action-dots-v.svg');
    }
  }

  &__stop-icon {
    position: relative;
    display: block;
    flex-shrink: 0;
    width: 14px;
    height: 14px;

    &::before {
      content: '';
      position: absolute;
      left: 3px;
      top: 3px;
      width: 8px;
      height: 8px;
      border-radius: 1px;
      background: #6ba3ff;
    }
  }
}

/* phone 抽屉底部留出手势导航安全区 */
.accel-info.is-phone .actions {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}

/* 入场/退场：遮罩淡入，pad 弹窗缩放淡入，phone 抽屉自下而上 */
.accel-fade-enter-active,
.accel-fade-leave-active {
  transition: opacity 0.24s ease;
}

.accel-fade-enter,
.accel-fade-leave-to {
  opacity: 0;
}

.accel-pop-enter-active,
.accel-pop-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.accel-pop-enter,
.accel-pop-leave-to {
  opacity: 0;
  transform: scale(0.94);
}

.accel-sheet-enter-active,
.accel-sheet-leave-active {
  transition: transform 0.28s ease;
}

.accel-sheet-enter,
.accel-sheet-leave-to {
  transform: translateY(100%);
}
</style>
