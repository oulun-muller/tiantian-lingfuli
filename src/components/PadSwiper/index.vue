<template>
  <div
    class="vue2-swiper"
    :class="{
      'loop': loop,
      'fullscreen': fullscreen
    }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      ref="wrapper"
      class="vue2-swiper-wrapper"
      :style="wrapperStyle"
    >
      <slot></slot>
    </div>

    <!-- 指示器 -->
    <div
      v-if="showIndicators"
      class="vue2-swiper-indicators"
      :class="{
        'dots': indicatorType === 'dots',
        'numbers': indicatorType === 'numbers'
      }"
    >
      <!-- 点状指示器 -->
      <template v-if="indicatorType === 'dots'">
        <div
          v-for="(item, index) in realCount"
          :key="index"
          class="vue2-swiper-indicator-dot"
          :class="{ 'active': currentIndex === index }"
          @click="goto(index)"
        ></div>
      </template>
      <!-- 数字指示器 -->
      <div v-else-if="indicatorType === 'numbers'" class="vue2-swiper-indicator-numbers">
        {{ currentIndex + 1 }}/{{ realCount }}
      </div>
    </div>

    <!-- 导航箭头 -->
    <div
      v-if="showArrows && !loop"
      class="vue2-swiper-arrow vue2-swiper-arrow-prev"
      @click="prev"
      v-show="currentIndex > 0"
    >
      &lt;
    </div>
    <div
      v-if="showArrows"
      class="vue2-swiper-arrow vue2-swiper-arrow-next"
      @click="next"
      v-show="!loop || currentIndex < realCount - 1"
    >
      &gt;
    </div>
  </div>
</template>

<script>
export default {
  name: 'Vue2Swiper',
  props: {
    // 是否自动播放
    autoplay: {
      type: Number,
      default: 0 // 0表示不自动播放，单位ms
    },
    // 切换动画时长
    duration: {
      type: Number,
      default: 300
    },
    // 初始索引
    initialIndex: {
      type: Number,
      default: 0
    },
    // 是否循环播放
    loop: {
      type: Boolean,
      default: false
    },
    // 是否显示指示器
    showIndicators: {
      type: Boolean,
      default: true
    },
    // 指示器类型：dots 或 numbers
    indicatorType: {
      type: String,
      default: 'dots',
      validator: val => ['dots', 'numbers'].includes(val)
    },
    // 是否显示导航箭头
    showArrows: {
      type: Boolean,
      default: false
    },
    // 同时显示的卡片数量
    slidesPerView: {
      type: Number,
      default: 1
    },
    // 相邻卡片间的间距（px）
    spaceBetween: {
      type: Number,
      default: 0
    },
    // 是否全屏显示
    fullscreen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentIndex: this.initialIndex,
      startPoint: 0, // 水平触摸起始位置
      movePoint: 0, // 水平触摸当前位置
      isDragging: false,
      touchStartTime: 0,
      autoplayTimer: null,
      realCount: 0, // 实际子元素数量
      containerSize: 0, // 容器宽度
      slideSize: 0, // 单个slide宽度
      wrapperSize: 0, // wrapper总宽度
      startY: 0, // 垂直触摸起始位置，用于判断滑动方向
      isScrolling: false // 是否正在垂直滚动
    }
  },
  computed: {
    // 计算wrapper的样式
    wrapperStyle() {
      const style = {
        transition: this.isDragging ? 'none' : `transform ${this.duration}ms ease`,
        display: 'flex'
      }

      style.transform = `translateX(${-this.getOffset()}px)`

      return style
    },
    // 计算实际子元素数量
    slides() {
      return this.$slots.default ? this.$slots.default.filter(vnode => vnode.tag) : []
    }
  },
  watch: {
    // 监听currentIndex变化
    currentIndex(newIndex) {
      this.$emit('change', newIndex)
    },
    // 监听autoplay变化
    autoplay() {
      this.resetAutoplay()
    },
    // 监听子元素变化
    slides: {
      handler() {
        this.$nextTick(() => {
          this.initSlides()
        })
      },
      immediate: true
    },
    // 监听fullscreen属性变化
    fullscreen() {
      this.updateSize()
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initSlides()
      this.startAutoplay()

      // 监听窗口大小变化
      window.addEventListener('resize', this.onResize)
    })
  },
  beforeUnmount() {
    this.stopAutoplay()
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    // 初始化轮播
    initSlides() {
      this.realCount = this.slides.length

      // 更新容器和slide尺寸
      this.updateSize()

      // 检查初始索引是否有效
      if (this.realCount > 0) {
        this.currentIndex = Math.max(0, Math.min(this.initialIndex, this.realCount - 1))
      }
    },

    // 更新容器和slide尺寸
    updateSize() {
      if (!this.$el) return

      // 在全屏模式下，使用窗口尺寸
      if (this.fullscreen) {
        this.containerSize = window.innerWidth
        this.slideSize = this.containerSize // 每个slide都是屏幕满屏宽度
      } else {
        // 非全屏模式下，使用容器尺寸
        const container = this.$el
        const rect = container.getBoundingClientRect()

        this.containerSize = rect.width
        this.slideSize = (this.containerSize - (this.slidesPerView - 1) * this.spaceBetween) / this.slidesPerView
      }

      this.wrapperSize = this.realCount * (this.slideSize + this.spaceBetween) - this.spaceBetween
    },

    // 计算当前偏移量
    getOffset() {
      if (this.slidesPerView > 1 && !this.fullscreen) {
        // 多图模式且非全屏
        return Math.min(
          this.currentIndex * (this.slideSize + this.spaceBetween),
          this.wrapperSize - this.containerSize
        )
      }
      // 单图模式或全屏模式
      return this.currentIndex * this.slideSize
    },

    // 开始自动播放
    startAutoplay() {
      if (this.autoplay > 0 && this.realCount > 1) {
        this.stopAutoplay()
        this.autoplayTimer = setInterval(() => {
          this.next()
        }, this.autoplay)
      }
    },

    // 停止自动播放
    stopAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer)
        this.autoplayTimer = null
      }
    },

    // 重置自动播放
    resetAutoplay() {
      this.stopAutoplay()
      this.startAutoplay()
    },

    // 下一张
    next() {
      if (this.realCount <= 1) return

      if (this.loop) {
        // 循环模式
        this.currentIndex = (this.currentIndex + 1) % this.realCount
      } else {
        // 非循环模式
        if (this.currentIndex < this.realCount - 1) {
          this.currentIndex++
        }
      }
    },

    // 上一张
    prev() {
      if (this.realCount <= 1) return

      if (this.loop) {
        // 循环模式
        this.currentIndex = (this.currentIndex - 1 + this.realCount) % this.realCount
      } else {
        // 非循环模式
        if (this.currentIndex > 0) {
          this.currentIndex--
        }
      }
    },

    // 跳转到指定索引
    goto(index) {
      if (index >= 0 && index < this.realCount) {
        this.currentIndex = index
      }
    },

    // 触摸开始
    onTouchStart(e) {
      this.isDragging = true
      this.isScrolling = false

      // 记录水平和垂直的起始位置
      this.startPoint = e.touches[0].clientX
      this.startY = e.touches[0].clientY

      this.touchStartTime = Date.now()
      this.stopAutoplay()
    },

    // 触摸移动 - 只处理水平滑动，允许垂直滚动
    onTouchMove(e) {
      if (!this.isDragging) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY

      // 计算水平和垂直的移动距离
      const diffX = currentX - this.startPoint
      const diffY = currentY - this.startY

      // 更新当前水平触摸点
      this.movePoint = currentX

      // 判断用户是否在垂直滚动
      if (!this.isScrolling && Math.abs(diffY) > Math.abs(diffX * 2)) {
        // 如果垂直移动距离明显大于水平移动距离，认为用户想滚动页面
        this.isScrolling = true
        return
      }

      // 只有在明确进行水平滑动时才阻止默认行为
      if (!this.isScrolling) {
        e.preventDefault()
      }
    },

    // 触摸结束
    onTouchEnd() {
      if (!this.isDragging) return
      this.isDragging = false

      // 只有在用户确实是在水平滑动时才处理轮播切换
      if (!this.isScrolling) {
        const diff = this.movePoint - this.startPoint
        const duration = Date.now() - this.touchStartTime

        // 判断滑动是否有效（距离或速度）
        const threshold = this.fullscreen ? this.slideSize * 0.2
          : (this.slidesPerView > 1 ? this.slideSize * 0.3 : this.containerSize * 0.3)
        const velocityThreshold = 50 // 快速滑动阈值

        if (Math.abs(diff) > threshold || (Math.abs(diff) > 10 && duration < 300 && Math.abs(diff / duration) > velocityThreshold)) {
          if (diff > 0) {
            // 向左滑动
            this.prev()
          } else {
            // 向右滑动
            this.next()
          }
          this.$emit('swipe', diff > 0 ? 'prev' : 'next')
        }
      }

      // 重置滚动状态
      this.isScrolling = false
      this.startAutoplay()
    },

    // 鼠标进入时停止自动播放
    onMouseEnter() {
      this.stopAutoplay()
    },

    // 鼠标离开时重新开始自动播放
    onMouseLeave() {
      this.startAutoplay()
    },

    // 窗口大小变化时更新尺寸
    onResize() {
      this.updateSize()
    }
  }
}
</script>

<style scoped>
.vue2-swiper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* 全屏模式样式 */
.vue2-swiper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: #000;
}

.vue2-swiper-wrapper {
  height: 100%;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* 指示器样式 */
.vue2-swiper-indicators {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  bottom: 10px;
  left: 0;
  right: 0;
}

/* 点状指示器 */
.vue2-swiper-indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
  cursor: pointer;
}

.vue2-swiper-indicator-dot.active {
  width: 20px;
  border-radius: 4px;
  background-color: #ffffff;
}

/* 数字指示器 */
.vue2-swiper-indicator-numbers {
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  border-radius: 12px;
  font-size: 12px;
}

/* 导航箭头样式 */
.vue2-swiper-arrow {
  position: absolute;
  width: 32px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.3s;
  z-index: 10;
  top: 50%;
  transform: translateY(-50%);
}

.vue2-swiper-arrow:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.vue2-swiper-arrow-prev {
  left: 10px;
}

.vue2-swiper-arrow-next {
  right: 10px;
}

/* 全屏模式下的指示元素样式优化 */
.vue2-swiper.fullscreen .vue2-swiper-indicator-dot {
  width: 10px;
  height: 10px;
  margin: 0 5px;
}

.vue2-swiper.fullscreen .vue2-swiper-indicator-dot.active {
  width: 24px;
}

.vue2-swiper.fullscreen .vue2-swiper-arrow {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

/* 全屏模式下禁止滚动条 */
.vue2-swiper.fullscreen-active {
  overflow: hidden;
}
</style>
