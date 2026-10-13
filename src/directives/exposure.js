const exposure = {
  mounted(el, binding) {
    if (!el || !el.nodeType || !binding.value) return

    // 清理旧的 observers 和 timers
    cleanupExposure(el)

    const value = binding.value
    const arg = binding.arg

    // 判断是多事件模式还是单事件模式
    if (arg === 'multiple' && value.events && Array.isArray(value.events)) {
      // 多事件模式
      initMultipleEvents(el, value)
    } else {
      // 单事件模式（向后兼容）
      initSingleEvent(el, value, binding)
    }
  },

  unmounted(el) {
    cleanupExposure(el)
  }
}

// 初始化多事件模式
function initMultipleEvents(el, value) {
  const { events, onVisible, onHidden } = value

  if (!events || !Array.isArray(events)) {
    console.warn('exposure multiple mode requires events array')
    return
  }

  // 存储所有观察器和定时器
  el._exposureObservers = []
  el._exposureTimers = []
  el._exposureHandled = {}

  events.forEach((eventConfig, index) => {
    const {
      handler,
      options = {},
      once = true,
      delay = 0
    } = eventConfig

    if (typeof handler !== 'function') {
      console.warn(`exposure event ${index} expects a function as handler`)
      return
    }

    const eventId = `event_${index}`
    el._exposureHandled[eventId] = false

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const isIntersecting = entry.isIntersecting

        // 触发可见性回调
        if (isIntersecting && onVisible) {
          onVisible(entry)
        } else if (!isIntersecting && onHidden) {
          onHidden(entry)
        }

        // 处理曝光事件
        if (isIntersecting && (!once || !el._exposureHandled[eventId])) {
          if (delay > 0) {
            const timer = setTimeout(() => {
              handler(entry)
              if (once) el._exposureHandled[eventId] = true
            }, delay)
            el._exposureTimers.push(timer)
          } else {
            handler(entry)
            if (once) el._exposureHandled[eventId] = true
          }
        }
      })
    }, options)

    observer.observe(el)
    el._exposureObservers.push(observer)
  })
}

// 初始化单事件模式（向后兼容）
function initSingleEvent(el, value, binding) {
  const {
    handler,
    options = {},
    once = true,
    delay = 0
  } = typeof value === 'object' ? value : { handler: value }

  if (typeof handler !== 'function') {
    console.warn('exposure directive expects a function as value')
    return
  }

  const id = binding.arg || Math.random().toString(36).substring(2, 11)
  el._exposureId = id

  if (!window.__exposedElements) window.__exposedElements = {}

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && (!once || !window.__exposedElements[id])) {
        if (delay > 0) {
          el._exposureTimer = setTimeout(() => {
            handler(entry)
            if (once) observer.unobserve(el)
          }, delay)
        } else {
          handler(entry)
          if (once) observer.unobserve(el)
        }
        window.__exposedElements[id] = true
      } else if (el._exposureTimer) {
        clearTimeout(el._exposureTimer)
        el._exposureTimer = null
      }
    })
  }, options)

  observer.observe(el)
  el._exposureObserver = observer
}

// 清理函数
function cleanupExposure(el) {
  // 清理多事件模式的观察器和定时器
  if (el._exposureObservers && Array.isArray(el._exposureObservers)) {
    el._exposureObservers.forEach(observer => {
      observer.disconnect()
    })
    delete el._exposureObservers
  }

  if (el._exposureTimers && Array.isArray(el._exposureTimers)) {
    el._exposureTimers.forEach(timer => {
      clearTimeout(timer)
    })
    delete el._exposureTimers
  }

  delete el._exposureHandled

  // 清理单事件模式的观察器和定时器
  if (el._exposureTimer) {
    clearTimeout(el._exposureTimer)
    delete el._exposureTimer
  }

  if (el._exposureObserver) {
    el._exposureObserver.disconnect()
    delete el._exposureObserver
  }

  if (el._exposureId && window.__exposedElements) {
    delete window.__exposedElements[el._exposureId]
  }
}

export default exposure
