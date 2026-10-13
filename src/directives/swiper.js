import Vue from '@/compat/vue2-shim.js'
const swiper = {
  bind(el, binding) {
    const isPadDevice = (window.__LZ_IS_PAD_DEVICE__)
    // 仅在Pad设备上启用该指令
    if (!isPadDevice) return

    let touchStartX = 0
    let touchEndX = 0
    const threshold = 50 // 滑动阈值，单位像素

    // 触摸开始事件
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX
    }

    // 触摸结束事件
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].clientX
      handleSwipeGesture()
    }

    // 处理滑动手势
    const handleSwipeGesture = () => {
      const diffX = touchEndX - touchStartX

      // 判断滑动方向并触发相应的回调
      if (typeof binding.value === 'object') {
        if (diffX < -threshold && typeof binding.value.prev === 'function') {
          binding.value.next()
        } else if (diffX > threshold && typeof binding.value.next === 'function') {
          binding.value.prev()
        }
      }
    }

    // 添加事件监听器
    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchend', handleTouchEnd)

    // 存储事件处理器以便在unbind时移除
    el._swipeHandlers = {
      touchstart: handleTouchStart,
      touchend: handleTouchEnd
    }
  },

  unbind(el) {
    // 移除事件监听器
    if (el._swipeHandlers) {
      el.removeEventListener('touchstart', el._swipeHandlers.touchstart)
      el.removeEventListener('touchend', el._swipeHandlers.touchend)
      delete el._swipeHandlers
    }
  }
}
export default swiper
