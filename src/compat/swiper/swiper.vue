<template>
  <div ref="root" class="vue-awesome-swiper swiper swiper-container">
    <div class="swiper-wrapper">
      <slot />
    </div>
    <slot name="pagination" />
    <slot name="button-prev" />
    <slot name="button-next" />
    <slot name="scrollbar" />
  </div>
</template>

<script>
import Swiper from 'swiper'
import {
  Autoplay,
  Pagination,
  Navigation,
  Scrollbar,
  EffectCoverflow,
  EffectFade,
  EffectCube,
  EffectFlip,
  EffectCards,
  EffectCreative
} from 'swiper/modules'
import 'swiper/swiper-bundle.css'

// Swiper 实例会触发的事件，桥接成 Vue 组件事件，业务侧 @slideChange 等模板监听仍可用。
const BRIDGED_EVENTS = [
  'init',
  'slideChange',
  'transitionStart',
  'transitionEnd',
  'touchStart',
  'touchEnd'
]

const ALL_MODULES = [
  Autoplay,
  Pagination,
  Navigation,
  Scrollbar,
  EffectCoverflow,
  EffectFade,
  EffectCube,
  EffectFlip,
  EffectCards,
  EffectCreative
]

export default {
  name: 'Swiper',
  props: {
    options: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      swiper: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initSwiper()
    })
  },
  beforeUnmount() {
    this.destroySwiper()
  },
  methods: {
    buildOptions() {
      const vm = this
      const source = this.options || {}
      const originalOn = source.on || {}
      const options = {
        modules: ALL_MODULES,
        ...source,
        on: {
          ...originalOn
        }
      }

      BRIDGED_EVENTS.forEach((eventName) => {
        const originalHandler = originalOn[eventName]
        options.on[eventName] = function(...args) {
          if (typeof originalHandler === 'function') {
            originalHandler.apply(this, args)
          }
          // Swiper 11 的事件回调不携带实例，这里显式把实例传出，业务侧可稳定拿到
          vm.$emit(eventName, this, ...args)
        }
      })

      return options
    },
    initSwiper() {
      const rootEl = this.$refs.root
      if (!rootEl || rootEl.nodeType !== 1) return

      this.destroySwiper()
      this.swiper = new Swiper(rootEl, this.buildOptions())
      this.$emit('ready', this.swiper)
    },
    destroySwiper() {
      if (this.swiper && this.swiper.destroy) {
        this.swiper.destroy(true, true)
      }
      this.swiper = null
    },
    update() {
      this.swiper?.update?.()
    }
  }
}
</script>