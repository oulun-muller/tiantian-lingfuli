import { createApp } from 'vue'
import {
  ElButton,
  ElCheckbox,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElUpload,
  provideGlobalConfig
} from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/upload/style/css'
import * as Sentry from '@sentry/vue'

import App from './App.vue'
import { createAppRouter } from './router'
import { createAppStore } from './store'
import { initLegionZoneMobileSDK, detectDevice, getUserInfo, getLoginStatusSync } from './bridge/legionZoneMobile'
import { setupGlobals } from './plugins/globals'
import { setupDirectives } from './plugins/directives'
import { installServiceComponents } from './plugins/services'
import { syncVue2Prototype, setVue2Store } from './compat/vue2-shim'
import ludpAvatar from './utils/h5Ludp'

import '@/styles/reset.scss'
import '@/styles/common.scss'
import '@/styles/ElementUIOverride.scss'

async function hydratePadNativeState(store) {
  try {
    // 首屏登录态以同步 getLoginStatus() 为主依据：它在 Vue 挂载前就写入 loginStatus，
    // 保证 gameSpace 首次渲染即为“已登录/未登录”明确态，不闪。
    // 注意：不能用异步 getUserInfo 读缓存反推——onCreate 已清空缓存，空缓存≠未登录。
    const loginStatus = getLoginStatusSync()
    store.dispatch('syncLoginStatus', { loginStatus })
    store.dispatch('user/syncLoginStatus', { loginStatus }).catch(() => {})

    await store.dispatch('system/setSystemInfo')
    const userRes = await getUserInfo()
    const parsed = userRes ? JSON.parse(userRes) : null
    // 端侧把头像和登录信息并列放在 data 下：{ data: { avatar, userInfo } }；
    // 兼容直接返回 userInfo 的情况。
    const payload = parsed?.data && (parsed.data.userInfo || parsed.data.avatar) ? parsed.data : parsed
    const actualUserInfo = payload?.userInfo || payload
    const actualAvatar = payload?.avatar || parsed?.avatar || null
    if (actualUserInfo?.Token) {
      // 已登录：补全 userInfo（loginStatus 已由上面同步接口设为 'yes'，不重复设置）
      store.dispatch('syncUserInfo', {
        ready: true,
        user: { userInfo: actualUserInfo }
      })
      // 头像不在 userInfo 内，需单独写入 user.avatar，否则页面只能回落到默认头像
      if (actualAvatar) {
        store.dispatch('user/syncUserInfo', {
          obj: { userInfo: actualUserInfo, avatar: actualAvatar }
        }).catch(() => {})
      }
    }
    // 未登录时 userInfo 保持 null，loginStatus 已是 'no'，无需重复设置
  } catch (res) {
    console.error('init failed', res)
  }
}

function withTimeout(promise, ms = 3000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('hydratePadNativeState timeout')), ms))
  ])
}

function mountApp({ router, store, device }) {
  const app = createApp(App)

  // 机型信息在 hydratePadNativeState 中已同步到 store，直接读取，无需再监听变化。
  Object.assign(app.config.globalProperties, {
    $isPadDevice: device.isPadDevice,
    $isPhoneDevice: device.isPhoneDevice,
    $isBellatorDevice: false,
    $isHandHeldDevice: (store.state.system.MTMInfo?.ReadableMachineName || '').includes('LCGHCC700')
  })
  console.log('mountApp device info:', {
    isPadDevice: device.isPadDevice,
    isPhoneDevice: device.isPhoneDevice,
    system: store.state.system
  })

  // 非组件模块仍通过这些遗留全局读取设备信息，统一在启动时写入。
  Object.assign(window, {
    __LZ_IS_PAD_DEVICE__: device.isPadDevice,
    __LZ_IS_PHONE_DEVICE__: device.isPhoneDevice,
    __LZ_IS_BELLATOR_DEVICE__: false
  })

  document.documentElement.classList.add(
    device.isPhoneDevice ? 'PhoneDevice' : device.isPadDevice ? 'PadDevice' : 'PcDevice'
  )
  document.body.classList.add(
    device.isPhoneDevice ? 'PhoneDevice' : device.isPadDevice ? 'PadDevice' : 'PcDevice'
  )

  setupGlobals(app, store, router)
  // 非组件模块通过遗留全局使用消息、登录和埋点能力。
  Object.assign(window, {
    __LZ_DATA_REPORT__: app.config.globalProperties.$dataReport,
    __LZ_MESSAGE__: app.config.globalProperties.$message,
    __LZ_LOGIN__: app.config.globalProperties.$login
  })
  setupDirectives(app)
  installServiceComponents(app)
  syncVue2Prototype(app.config.globalProperties)

  app.use(ludpAvatar)
  app.use(store)
  app.use(router)
  app.use(ElButton)
  app.use(ElCheckbox)
  app.use(ElDialog)
  app.use(ElForm)
  app.use(ElFormItem)
  app.use(ElInput)
  app.use(ElOption)
  app.use(ElPagination)
  app.use(ElSelect)
  app.use(ElUpload)
  provideGlobalConfig({ size: 'small' }, app, true)

  if (process.env.sentry?.dsn) {
    Sentry.init({
      app,
      router,
      dsn: process.env.sentry.dsn,
      release: process.env.RELEASE,
      environment: process.env.sentry.environment,
      tracesSampleRate: process.env.sentry.tracesSampleRate,
      ignoreErrors: [
        'ChunkLoadError',
        'Loading CSS chunk',
        'Network Error',
        /^timeout of \d+ms exceeded$/,
        "application 'Forum' died in status LOADING_SOURCE_CODE",
        'Non-Error promise rejection captured with keys',
        'Non-Error promise rejection captured with value'
      ]
    })
  }

  if (device.isPadDevice) {
    store.dispatch('softwareStatePad/init').catch(() => {})
  }

  app.mount('#app')
}

async function bootstrap() {
  if (import.meta.env.MODE !== 'prod') {
    const { default: Vconsole } = await import('vconsole')
    // eslint-disable-next-line no-new
    new Vconsole()
  }

  const device = detectDevice()
  // 真实移动端使用 index.html 引入的 jssdk.js 桥接；纯浏览器里 jssdk 也会注入
  // window.LegionZoneMobile，但 _LegionZoneMobile.nativeCall 不存在，不能据此揽成原生宿主。
  const hasNativeHost = () => !!(window._LegionZoneMobile && typeof window._LegionZoneMobile.nativeCall === 'function')
  if (device.isPadDevice && hasNativeHost()) {
    initLegionZoneMobileSDK()
  }

  const store = createAppStore({
    ready: true,
    user: {},
    system: {}
  })
  // Vue2 遗留模块通过兼容层访问当前 store。
  setVue2Store(store)

  // 端内：先获取系统信息再渲染（阻塞）；端外浏览器 hasNativeHost() 为 false，直接跳过不阻塞。
  if (device.isPadDevice && hasNativeHost()) {
    try {
      await withTimeout(hydratePadNativeState(store))
    } catch (e) {
      console.warn('[bootstrap] hydrate native state failed:', e)
    }
  }

  const router = createAppRouter()
  window.__lzRouter = router
  mountApp({ router, store, device })
}

bootstrap()
