<template>
  <aside
    ref="navRoot"
    :class="['preorder-nav', { 'is-expanded': expanded }]"
    :aria-expanded="expanded.toString()">
    <div
      class="preorder-nav-panel"
      :class="{ 'is-open': expanded }"
      :aria-hidden="(!expanded).toString()"
      @transitionend="handleTransitionEnd">
      <div
        v-for="item in navItems"
        :key="item.id"
        :class="['nav-item', { active: currentModule === item.module }]"
        :tabindex="expanded ? 0 : -1"
        @click="handleNav(item.id)"
        @keydown.enter.prevent="handleNav(item.id)"
        @keydown.space.prevent="handleNav(item.id)">
        <span class="nav-index"></span>
        <span class="nav-name">{{ item.name }}</span>
      </div>
    </div>
    <button
      v-if="!isDocked"
      class="preorder-nav-trigger"
      type="button"
      :aria-label="expanded ? '收起页面导航' : '展开页面导航'"
      :aria-expanded="expanded.toString()"
      @click="toggleExpanded" />
  </aside>
</template>

<script>
export default {
  name: 'PreorderProgressNav',
  props: {
    // 当前所在模块：top/purchase/lottery/intro
    currentModule: {
      type: String,
      default: 'top'
    },
    // 是否有抽奖活动模块
    hasLottery: {
      type: Boolean,
      default: false
    },
    // 是否显示游戏预览模块
    hasGamePreview: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const isWideViewport = typeof window !== 'undefined' && window.innerWidth > 1632
    return {
      expanded: isWideViewport,
      isDocked: isWideViewport,
      settleTimer: null
    }
  },
  computed: {
    // 导航项列表（根据是否有抽奖模块动态生成）
    navItems() {
      const items = [
        { id: 'preorder-top', module: 'top', index: '01', name: '顶部' },
        { id: 'preorder-purchase', module: 'purchase', index: '02', name: '立即购买' }
      ]
      if (this.hasLottery) {
        items.push({ id: 'preorder-lottery', module: 'lottery', index: '03', name: '抽奖活动' })
      }
      if (this.hasGamePreview) {
        const index = this.hasLottery ? '04' : '03'
        items.push({ id: 'preorder-game-preview', module: 'game-preview', index, name: '游戏预览' })
      }
      return items
    }
  },
  mounted() {
    document.addEventListener('mousedown', this.handleDocumentMouseDown)
    window.addEventListener('resize', this.handleViewportResize)
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown)
    window.removeEventListener('resize', this.handleViewportResize)
    if (this.settleTimer) window.clearTimeout(this.settleTimer)
  },
  methods: {
    // 点击导航项，通知父组件滚动到对应模块
    handleNav(moduleId) {
      this.$emit('navigate', moduleId)
    },
    toggleExpanded() {
      if (this.settleTimer) {
        window.clearTimeout(this.settleTimer)
        this.settleTimer = null
      }
      this.expanded = !this.expanded
      if (this.expanded) this.isDocked = true
    },
    handleDocumentMouseDown(event) {
      if (!this.expanded || !this.$refs.navRoot || this.$refs.navRoot.contains(event.target)) return
      this.collapse()
    },
    handleViewportResize() {
      const isWideViewport = window.innerWidth > 1632
      if (isWideViewport) {
        if (this.settleTimer) {
          window.clearTimeout(this.settleTimer)
          this.settleTimer = null
        }
        this.expanded = true
        this.isDocked = true
        return
      }
      if (this.isDocked && this.expanded) {
        this.expanded = false
        this.isDocked = false
      }
    },
    collapse() {
      if (typeof window !== 'undefined' && window.innerWidth > 1632) return
      this.expanded = false
      if (this.settleTimer) window.clearTimeout(this.settleTimer)
      this.settleTimer = window.setTimeout(() => {
        this.isDocked = false
        this.settleTimer = null
      }, 320)
    },
    handleTransitionEnd(event) {
      if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
      if (!this.expanded) {
        this.isDocked = false
        if (this.settleTimer) {
          window.clearTimeout(this.settleTimer)
          this.settleTimer = null
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.preorder-nav {
  position: fixed;
  right: 0;
  top: 50%;
  z-index: 100;
  display: flex;
  flex-direction: column;
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  pointer-events: none;
  transform: translateY(-50%);
  .preorder-nav-panel,
  .preorder-nav-trigger {
    pointer-events: auto;
  }
  .preorder-nav-panel {
    position: fixed;
    right: 0;
    top: 50%;
    width: 120px;
    padding: 8px 0;
    border-radius: 12px 0 0 12px;
    background: #2a2a2c;
    box-sizing: border-box;
    overflow: hidden;
    transform: translate(100%, -50%);
    visibility: hidden;
    opacity: 0;
    transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0s linear 320ms, visibility 0s linear 320ms;
    &.is-open {
      transform: translate(0, -50%);
      visibility: visible;
      opacity: 1;
      transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 0s linear, visibility 0s linear;
    }
  }
  .preorder-nav-trigger {
    position: absolute;
    right: 0;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 50% 0 0 50%;
    background: transparent url('./double-down.png') center / contain no-repeat;
    cursor: pointer;
    transition: transform 160ms ease;
    &:focus-visible {
      outline: none;
    }
    &:active {
      transform: scale(0.96);
    }
  }
  .nav-item {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 18px 22px;
    box-sizing: border-box;
    border-left: 1px solid rgba(255, 255, 255, 0.00);
    background: transparent;
    cursor: pointer;
    transition: background-color 200ms ease, color 200ms ease;
    color: rgba(255, 255, 255, 0.50);
    font-size: 16px;
    font-style: normal;
    font-weight: 100;
    line-height: normal;
    .nav-name {
      font-weight: 100;
      line-height: 1;
    }
    &.active {
      color: #fff;
      background: radial-gradient(20.74% 50% at 0% 50%, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.00) 100%), rgba(255, 255, 255, 0.17);
      position: relative;
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 100%;
        background: linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.1) 0%,
          rgba(255, 255, 255, 0.8) 50%,
          rgba(255, 255, 255, 0.1) 100%
        );
        border-radius: 2px;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.3);
      }
    }
  }
}
// 移动端隐藏侧边导航
@media (max-width: 840px) {
  .preorder-nav {
    .preorder-nav-panel {
      width: 100px;
    }
    .nav-item {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 300;
    }
  }
}
</style>
