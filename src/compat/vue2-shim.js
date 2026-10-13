/**
 * Minimal Vue 2 global API shim for pragmatic migration.
 */
import {
  createApp,
  reactive,
  watch,
  computed,
  ref,
  nextTick,
  onMounted,
  onBeforeUnmount,
  getCurrentInstance
} from 'vue'

const legacyPrototype = {}

const Vue = {
  createApp,
  reactive,
  watch,
  computed,
  ref,
  nextTick,
  onMounted,
  onBeforeUnmount,
  getCurrentInstance,
  // Vue 2 global API stubs used by legacy modules
  prototype: legacyPrototype,
  util: {
    defineReactive() {}
  },
  set(target, key, val) {
    if (Array.isArray(target) && typeof key === 'number') {
      target.length = Math.max(target.length, key + 1)
      target.splice(key, 1, val)
      return val
    }
    target[key] = val
    return val
  },
  delete(target, key) {
    if (Array.isArray(target) && typeof key === 'number') {
      target.splice(key, 1)
      return true
    }
    return delete target[key]
  },
  filter() {},
  directive() {},
  component() {},
  use() {},
  mixin() {},
  extend(options = {}) {
    // Very small Vue.extend polyfill for service popups
    return function ExtendedConstructor(opts = {}) {
      const merged = {
        ...options,
        data() {
          const base = typeof options.data === 'function' ? options.data.call(this) : (options.data || {})
          return { ...base, ...(opts.data || {}) }
        }
      }
      return {
        $options: merged,
        $mount(el) {
          const app = createApp(merged)
          const host = el || document.createElement('div')
          const vm = app.mount(host)
          this.$el = vm.$el
          this.$app = app
          this.$vm = vm
          // proxy common fields
          Object.keys(vm).forEach(k => {
            if (!(k in this)) this[k] = vm[k]
          })
          return this
        },
        $destroy() {
          this.$app?.unmount()
        }
      }
    }
  }
}

export function syncVue2Prototype(globals = {}) {
  if (!globals || typeof globals !== 'object') return
  Object.assign(legacyPrototype, globals)
}

export function setVue2Store(store) {
  legacyPrototype.$onlineStore = store
}

export default Vue
export {
  createApp,
  reactive,
  watch,
  computed,
  ref,
  nextTick,
  onMounted,
  onBeforeUnmount,
  getCurrentInstance
}
