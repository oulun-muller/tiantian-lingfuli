<template>
  <!-- 区服滚轮（设计稿 300:26396 的滚轮区）。只负责「滚动选择」这一件事：
       外壳（260 宽 / 12 圆角 / 0.5px 描边 / 同底色 / 无阴影）、按钮区都由 XunyouConfirmDialog 提供，
       本组件只出 260×160 的滚轮区，因此通过那个组件的默认插槽挂进去。

       ⚠️ 内容必须是真实区服名（原生 Xunyou_getAccelAreaInfo 的 areaList 里的原始字符串）。
       设计稿里那串「1 Mbps / 2 Mbps / 3 Mbps / 7 Mbps」是设计同学拿串流码率选择器当模板留下的占位文案
       （color: transparent），照抄就错了；真实示例只有「国服 / 大陆 / 香港」。 -->
  <div
    class="xunyou-wheel"
    :style="{
      '--xunyou-wheel-viewport': `${WHEEL_VIEWPORT_HEIGHT}px`,
      '--xunyou-wheel-slot': `${WHEEL_SLOT_HEIGHT}px`
    }">
    <!-- 选中带：设计稿是独立图层，宽等于整个弹窗宽（不受 58px 内边距影响），纯色无圆角无描边 -->
    <div class="xunyou-wheel__band" aria-hidden="true"></div>

    <div ref="list" class="xunyou-wheel__list" @scroll.passive="handleScroll">
      <!-- 上下各一个 (视口高 - 槽高) / 2 的占位块：让首项与末项也能滚到选中带正中。
           刻意不用滚动容器的 padding 表达：pad-bottom 在部分场景下不计入 scrollHeight，
           末项就会差半个视口滚不到位；占位块是普通块级子元素，几何上没有这种歧义。 -->
      <div class="xunyou-wheel__spacer" aria-hidden="true"></div>
      <button
        v-for="(area, index) in areas"
        :key="area.id"
        type="button"
        class="xunyou-wheel__item"
        :style="itemStyle(index)"
        @click="selectIndex(index)">
        <span class="xunyou-wheel__item-text">{{ area.name }}</span>
      </button>
      <div class="xunyou-wheel__spacer" aria-hidden="true"></div>
    </div>
  </div>
</template>

<script>
// 设计稿 300:26397：滚轮区 260×160，padding 0 58px，gap 12，overflow clip
const WHEEL_VIEWPORT_HEIGHT = 160

/**
 * 每项的固定槽高。
 *
 * 设计稿（300:26399）的项高是随字号阶梯变的：18px→27、16px→24、14px→21、12px→18、10px→15
 * （就是各字号在默认行高 1.5 下的行盒高度），相邻两项之间另有 gap 12。按各段「中心距」算，
 * 设计稿里每项相对选中项中心的偏移是：±1 ≈ 36~37.5、±2 ≈ 67.5~70.5、±3 已在 160 高的可视区外。
 *
 * 这里把槽高**固定**成 36（贴住设计稿 ±1 的 36~37.5），而不是让每项真的随字号变高，原因有两个：
 * 1. 不能有布局反馈：字号是「与选中项的距离」的函数，而选中项又是「滚动位置」的函数。
 *    如果项高也随字号变，滚动 → 字号变 → 项高变 → 滚动落点变，会自激抖动。
 *    固定槽高把「视觉尺寸」与「布局尺寸」解耦，滚动映射恒为 index = scrollTop / 槽高。
 * 2. 固定槽高才能直接用 CSS scroll-snap 拿到原生惯性滚动手感（见下方 .xunyou-wheel__list），
 *    而 snap 点必须是均匀的。
 *
 * 按 36 反推的可见项与设计稿基本重合：视口 160 高、选中项中心在 y=80，
 * ±1 中心落在 44/116、±2 落在 8/152（设计稿对应 42.5/116 与 11/149），
 * ±3 已在可视区外 —— 设计稿那几项本来就是 transparent 的无意义占位。
 */
const WHEEL_SLOT_HEIGHT = 36

/**
 * 字号 / 透明度阶梯（设计稿 300:26399），按下标与选中项的距离取：
 * 0 → 18px #eaf7ff；±1 → 16px rgba(234,247,255,0.8)；±2 → 12px rgba(234,247,255,0.4)；
 * ±3 及更远 → 10px transparent。
 *
 * ⚠️ 设计稿在「±1」这一档其实是不对称的（选中项上面写 14px、下面写 16px），且选中项上方那几项
 * （−1/−2/−3）颜色一律是 transparent —— 它们本就是设计同学填充的占位，看不见。
 * 滚轮一滚动，上方那几项会变成「选中项下方」，所以阶梯必须是按距离对称的，
 * 这里统一取 18/16/12/10，与 PRD 的「±1 16px、±2 12px」一致。
 */
const WHEEL_LADDER = [
  { size: 18, color: '#eaf7ff' },
  { size: 16, color: 'rgba(234, 247, 255, 0.8)' },
  { size: 12, color: 'rgba(234, 247, 255, 0.4)' },
  { size: 10, color: 'transparent' }
]

export default {
  name: 'XunyouAreaWheel',
  props: {
    // 可选项： [{ id, name }]。由调用方拼好 —— 首位恒是调用方补的「没有区服」项（id 为空串），
    // 后面是原生 areaList 原样映射来的真实区服（id 与 name 都是那个原始字符串，不做去重）。
    // 本组件不关心哪一项是补的：选中什么就报什么，是不是「没有区服」由调用方按 id/isDefault 判定。
    areas: {
      type: Array,
      default: () => []
    },
    // 挂载时要停在的项 id：调用方已把「当前区服名匹配不到真实区服」的情况折算成补的那一项的 id
    currentAreaId: {
      type: [String, Number],
      default: ''
    },
    // 正在加速的游戏名。只为 #22 埋点的 gameName 参数而传（滚轮本身不用它），
    // 由调用方给（调用方从 accelGame / accelState 取，见 GameCarousel.accelGameName）
    gameName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      WHEEL_VIEWPORT_HEIGHT,
      WHEEL_SLOT_HEIGHT,
      // 选中项下标。滚动时由 handleScroll 按 scrollTop 反算，是「视觉选中项」也是「确定时提交的项」
      activeIndex: 0
    }
  },
  mounted() {
    this.activeIndex = this.resolveInitialIndex()
    // 面板是随弹窗 v-if 挂载的，首帧 DOM 就绪后把滚轮对齐到当前区服
    this.$nextTick(() => this.syncScrollTop())
  },
  methods: {
    resolveInitialIndex() {
      const index = this.areas.findIndex(area => String(area.id) === String(this.currentAreaId))
      return index === -1 ? 0 : index
    },
    syncScrollTop() {
      const list = this.$refs.list
      if (!list) return
      // 首尾各有 (160-36)/2 = 62 的占位块，使首尾项也能滚到选中带正中，
      // 于是「第 i 项居中」恰好等于 scrollTop = i * 槽高（无需再加偏移量）
      list.scrollTop = this.activeIndex * WHEEL_SLOT_HEIGHT
    },
    handleScroll() {
      const list = this.$refs.list
      if (!list) return
      const raw = Math.round(list.scrollTop / WHEEL_SLOT_HEIGHT)
      const index = Math.min(Math.max(raw, 0), Math.max(this.areas.length - 1, 0))
      if (index !== this.activeIndex) {
        this.activeIndex = index
      }
    },
    // 点某一项：直接跳到目标槽位并立即认定选中。
    // 刻意不用 behavior: 'smooth' —— 平滑滚动途中 scroll 事件会把 activeIndex 改回中间项，
    // 用户在这段时间点「确定」就会提交到错误的区服；直接赋值没有这个竞态。
    selectIndex(index) {
      if (index === this.activeIndex) return
      const list = this.$refs.list
      if (list) {
        list.scrollTop = index * WHEEL_SLOT_HEIGHT
      }
      this.activeIndex = index
    },
    itemStyle(index) {
      const distance = Math.min(Math.abs(index - this.activeIndex), WHEEL_LADDER.length - 1)
      const ladder = WHEEL_LADDER[distance]
      return {
        fontSize: `${ladder.size}px`,
        color: ladder.color
      }
    },
    /** 供调用方在「确定」时取当前选中的区服 */
    getSelectedArea() {
      return this.areas[this.activeIndex] || null
    },
    /**
     * #22 选择区服上报（category LZ_myGames / action LZ_accelSelectServerClick / label click）。
     *
     * 上报代码放在滚轮里（区服选择组件），但**调用时机由外层决定**：滚动或点选这一项只是改 activeIndex，
     * 真正把选择提交出去的是外层弹窗的「确定」按钮（本组件没有按钮区，按钮由 XunyouConfirmDialog 提供），
     * 所以由调用方在用户点确定时调本方法 —— 不在这里监听 activeIndex 变化，
     * 否则滚轮每滚过一项都会上报一次。
     *
     * serverId 传区服 **ID**（不是名称，需求文档 3.2 #22 已确认），统一转成字符串上报。
     * 选中调用方补的那个「没有区服」项时 id 就是哨兵空串，上报出去即空 serverId —— 语义正确（没有区服），
     * 后端若不接受空串再调整为具体值。
     * 返回是否上报（没有可选项时不报）。
     */
    reportSelectServer() {
      const area = this.getSelectedArea()
      if (!area) return false
      console.log('[XunyouAccel] H5 #22 选择区服', { gameName: this.gameName, serverId: area.id })
      this.$dataReport('LZ_myGames', 'LZ_accelSelectServerClick', 'click', {
        detail: JSON.stringify({
          gameName: this.gameName,
          serverId: String(area.id)
        })
      })
      return true
    }
  }
}
</script>

<style lang="scss" scoped>
.xunyou-wheel {
  position: relative;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 100%;
  height: var(--xunyou-wheel-viewport);
  /* 设计稿 300:26397：padding 0 58px + overflow clip */
  padding: 0 58px;
  overflow: clip;
}

.xunyou-wheel__band {
  position: absolute;
  left: 0;
  top: 50%;
  /* 宽取 100%（= 弹窗内容宽），不受 58px 内边距影响，与设计稿「260 宽、横贯整个弹窗」一致 */
  width: 100%;
  /* 设计稿 300:26398：选中带 260×40，纯色无圆角无描边 */
  height: 40px;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.24);
  pointer-events: none;
}

/* 滚动手感方案：原生滚动容器 + CSS scroll-snap，不自己写拖拽与惯性。
   - 惯性/回弹交给 WebView 原生的 fling（Chromium 自带），比手写 velocity 衰减更跟手；
   - scroll-snap-type: y mandatory + 每项 scroll-snap-align: center → 松手后吸附到最近的项，
     且吸附点就是「项中心对容器中心」，与 activeIndex = scrollTop / 槽高 完全一致；
   - scroll-snap-stop: always → 快速甩动也不会一滑跨过好几项，逐项跳，适合只有几项的区服列表；
   - overscroll-behavior: contain → 到边界后不把滚动传给背后的页面（否则会带着详情页一起滚）。 */
.xunyou-wheel__list {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* 首尾占位块：(160-36)/2 = 62。有它之后「第 i 项居中」恰好等于 scrollTop = i * 槽高，无需再加偏移量 */
.xunyou-wheel__spacer {
  height: calc((var(--xunyou-wheel-viewport) - var(--xunyou-wheel-slot)) / 2);
  pointer-events: none;
}

.xunyou-wheel__item {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: var(--xunyou-wheel-slot);
  padding: 0;
  border: 0;
  background: none;
  font-weight: 400;
  line-height: normal;
  text-align: center;
  cursor: pointer;
  scroll-snap-align: center;
  scroll-snap-stop: always;
  /* 字号/颜色由 itemStyle 按与选中项的距离内联下发（字号阶梯不是静态样式） */
  transition: font-size 0.16s ease, color 0.16s ease;
}

.xunyou-wheel__item-text {
  display: block;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
