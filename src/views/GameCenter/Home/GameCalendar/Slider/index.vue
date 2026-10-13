<template>
  <div
    class="slider"
    :class="{ 'move':!this.isDragging || isClick }"
    ref="slider"
    role="slider"
    tabindex="0"
    aria-label="日历滑块"
    :aria-valuenow="Math.round(value)"
    aria-valuemin="0"
    aria-valuemax="100"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
    @keydown="handleKeydown">
    <div
      class="slider-bar"
      ref="sliderBar"
      :style="{ left: currentLeft + 'px', width: '25%'}">
    </div>
  </div>
</template>

<script>
const accMul = (arg1, arg2) => {
  var m = 0
  var s1 = arg1.toString()
  var s2 = arg2.toString()
  try {
    m += s1.split('.')[1].length
  } catch (e) {
    //
  }
  try {
    m += s2.split('.')[1].length
  } catch (e) {
    //
  }
  return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m)
}
const accDiv = (arg1, arg2) => {
  var t1 = 0
  var t2 = 0
  var r1; var r2
  try {
    t1 = arg1.toString().split('.')[1].length
  } catch (e) {
    //
  }
  try {
    t2 = arg2.toString().split('.')[1].length
  } catch (e) {
    //
  }
  r1 = Number(arg1.toString().replace('.', ''))
  r2 = Number(arg2.toString().replace('.', ''))
  return (r1 / r2) * Math.pow(10, t2 - t1)
}
export default {
  name: 'Slider',
  props: {
    width: {
      type: Number,
      default: 300
    },
    height: {
      type: Number,
      default: 10
    },
    barWidth: {
      type: Number,
      default: 116
    },
    value: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      isClick: false,
      currentLeft: 0,
      startX: 0,
      isDragging: false
    }
  },
  watch: {
    value: {
      handler() {
        if (this.$refs.slider) {
          this.$nextTick(() => {
            this.init()
          })
        }
      },
      immediate: true
    }
  },
  mounted() {
  },
  methods: {
    init() {
      const width = this.$refs.slider.offsetWidth
      const innerWidth = this.$refs.sliderBar.offsetWidth
      const totalScrollWidth = width - innerWidth
      const num0 = accDiv(this.value, 100)
      const num1 = accMul(num0, totalScrollWidth)
      this.currentLeft = num1
    },
    linkageScroll() {
      const width = this.$refs.slider.offsetWidth
      const innerWidth = this.$refs.sliderBar.offsetWidth
      const totalScrollWidth = width - innerWidth
      const num0 = accDiv(this.currentLeft, totalScrollWidth)
      const num1 = accMul(num0, 100)
      this.$emit('input', num1)
    },
    handleMouseDown(event) {
      const width = this.$refs.slider.offsetWidth
      const innerWidth = this.$refs.sliderBar.offsetWidth
      const sliderEl = this.$refs.slider.getBoundingClientRect()
      const left = sliderEl.left
      const curX = event.clientX - left
      this.startDrag(event.clientX)
      window.addEventListener('mousemove', this.handleMouseMove)
      window.addEventListener('mouseup', this.handleMouseUp)
      if (curX < this.currentLeft) {
        this.isClick = true
        setTimeout(() => {
          this.isClick = false
        }, 200)
        this.currentLeft = curX
        this.linkageScroll()
      } else if (curX > (this.currentLeft + innerWidth) && (this.currentLeft + innerWidth) <= width) {
        this.isClick = true
        setTimeout(() => {
          this.isClick = false
        }, 200)
        this.currentLeft = curX - innerWidth
        this.linkageScroll()
      }
    },
    handleMouseMove(event) {
      if (this.isDragging) {
        this.updatePosition(event.clientX)
      }
    },
    handleMouseUp() {
      this.stopDrag()
      window.removeEventListener('mousemove', this.handleMouseMove)
      window.removeEventListener('mouseup', this.handleMouseUp)
    },
    handleTouchStart(event) {
      event.preventDefault()
      this.startDrag(event.touches[0].clientX)
      document.addEventListener('touchmove', this.handleTouchMove)
      document.addEventListener('touchend', this.handleTouchEnd)
    },
    handleTouchMove(event) {
      if (this.isDragging) {
        this.updatePosition(event.touches[0].clientX)
      }
    },
    handleTouchEnd(event) {
      this.stopDrag()
      document.removeEventListener('touchmove', this.handleTouchMove)
      document.removeEventListener('touchend', this.handleTouchEnd)
    },
    startDrag(clientX) {
      this.isDragging = true
      this.startX = clientX
    },
    updatePosition(clientX) {
      const width = this.$refs.slider.offsetWidth
      const innerWidth = this.$refs.sliderBar.offsetWidth
      const totalScrollWidth = width - innerWidth
      const diffX = clientX - this.startX
      const newLeft = this.currentLeft + diffX
      this.startX = clientX
      this.currentLeft = Math.min(Math.max(0, newLeft), totalScrollWidth)
      this.linkageScroll()
    },
    stopDrag() {
      this.isDragging = false
    },
    handleKeydown(event) {
      const step = 5
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        this.$emit('input', Math.min(100, this.value + step))
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        this.$emit('input', Math.max(0, this.value - step))
      } else if (event.key === 'Home') {
        event.preventDefault()
        this.$emit('input', 0)
      } else if (event.key === 'End') {
        event.preventDefault()
        this.$emit('input', 100)
      }
    }
  }
}
</script>

<style lang="scss" src="./index.scss" scoped></style>

