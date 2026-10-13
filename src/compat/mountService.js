import { createApp, h } from 'vue'
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect
} from 'element-plus'
import { getLegacyGlobal, getLegacyStore } from '@/compat/legacyGlobals'

/**
 * Mount a Vue3 SFC imperatively (replaces Vue2 `new Ctor({ data }).$mount()`).
 */
export function mountServiceComponent(Component, data = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const MainComp = Component.default || Component
  let app

  app = createApp({
    name: 'ServiceHost',
    data() {
      return { ...data }
    },
    provide() {
      return { serviceData: data }
    },
    render() {
      // Pass data both as props and via parent data for Options API `this.xxx`
      return h(MainComp, { ...data })
    },
    mounted() {
      // copy data fields onto child if needed
    }
  })

  // Inject fields into every component instance as data-like properties before create
  app.mixin({
    beforeCreate() {
      // only inject into the service main component tree roots
      if (!this.$options.__lzServiceInjected) {
        Object.keys(data).forEach(key => {
          if (this[key] === undefined) {
            try {
              this[key] = data[key]
            } catch (e) {
              /* ignore */
            }
          }
        })
        this.$options.__lzServiceInjected = true
      }
    },
    created() {
      Object.keys(data).forEach(key => {
        if (this.$data && Object.prototype.hasOwnProperty.call(this.$data, key)) {
          this[key] = data[key]
        } else if (this[key] === undefined) {
          this[key] = data[key]
        }
      })
    }
  })

  const store = getLegacyStore()
  if (store) {
    app.use(store)
  }
  ;[ElButton, ElCheckbox, ElDialog, ElForm, ElFormItem, ElInput, ElOption, ElPagination, ElSelect].forEach(c => app.use(c))
  // share device flags
  app.config.globalProperties.$isPadDevice = getLegacyGlobal('$isPadDevice', window.__LZ_IS_PAD_DEVICE__)
  app.config.globalProperties.$isPhoneDevice = getLegacyGlobal('$isPhoneDevice', window.__LZ_IS_PHONE_DEVICE__)
  app.config.globalProperties.$isBellatorDevice = getLegacyGlobal('$isBellatorDevice', window.__LZ_IS_BELLATOR_DEVICE__)
  app.config.globalProperties.$dataReport = getLegacyGlobal('$dataReport', window.__LZ_DATA_REPORT__)
  app.config.globalProperties.$message = getLegacyGlobal('$message', (store && window.__LZ_MESSAGE__) || console.log)
  app.config.globalProperties.$login = getLegacyGlobal('$login', window.__LZ_LOGIN__ || (() => {}))

  const vm = app.mount(container)

  const api = {
    $el: container,
    $vm: vm,
    close() {
      try { app.unmount() } catch (e) {}
      if (container.parentNode) container.parentNode.removeChild(container)
    },
    $destroy() { this.close() }
  }
  vm.$destroy = () => api.close()
  // walk child
  if (vm.$.subTree?.component?.proxy) {
    vm.$.subTree.component.proxy.$destroy = () => api.close()
  }
  return api
}
