// Vue2 -> Vue3 迁移兼容层：项目原来把一批全局能力挂在 Vue2 的 Vue.prototype 上
// （组件里可以直接 this.$xxx 使用），迁移到 Vue3 后这些能力被同步到
// vue2-shim.js 模拟出的 prototype 对象上。本文件给"非组件上下文"
// （普通 JS 模块、api 请求文件、utils 等拿不到 this 的地方）提供统一的取值方式：
// 优先从 Vue.prototype.$xxx 拿，拿不到再从原生桥接挂在 window 上的全局变量兜底取。
import Vue from '@/compat/vue2-shim.js'

// $xxx 在 Vue.prototype 上取不到时，兜底去读的 window 全局变量名映射
const WINDOW_GLOBAL_MAP = {
  $dataReport: '__LZ_DATA_REPORT__',
  $message: '__LZ_MESSAGE__',
  $login: '__LZ_LOGIN__',
  $isPadDevice: '__LZ_IS_PAD_DEVICE__',
  $isPhoneDevice: '__LZ_IS_PHONE_DEVICE__',
  $isBellatorDevice: '__LZ_IS_BELLATOR_DEVICE__'
}

export function getLegacyGlobal(key, fallback = undefined) {
  const fromVue = Vue.prototype?.[key]
  if (fromVue !== undefined) {
    return fromVue
  }

  const winKey = WINDOW_GLOBAL_MAP[key]
  if (winKey && typeof window !== 'undefined' && Object.prototype.hasOwnProperty.call(window, winKey)) {
    return window[winKey]
  }

  return fallback
}

export function callLegacy(key, ...args) {
  const fn = getLegacyGlobal(key)
  if (typeof fn === 'function') {
    return fn(...args)
  }
  return undefined
}

export function callLegacyAsync(key, ...args) {
  const result = callLegacy(key, ...args)
  return Promise.resolve(result)
}

export function getLegacyStore() {
  return Vue.prototype?.$onlineStore || null
}

export function getLegacyStoreState(path, fallback = undefined) {
  const store = getLegacyStore()
  const state = store?.state
  if (!state) {
    return fallback
  }

  if (!path) {
    return state
  }

  const keys = Array.isArray(path) ? path : String(path).split('.')
  let cursor = state
  for (const key of keys) {
    if (cursor == null || !(key in cursor)) {
      return fallback
    }
    cursor = cursor[key]
  }
  return cursor === undefined ? fallback : cursor
}

export function getLegacyUserInfo(useChannelInfo = false) {
  if (useChannelInfo) {
    return getLegacyStoreState('channelInfo.channelUserInfo', null)
  }
  return getLegacyStoreState('user.userInfo', null)
}

export function getLegacyLenovoId(useChannelInfo = false) {
  const userInfo = getLegacyUserInfo(useChannelInfo)
  return userInfo?.UserID || userInfo?.uuid || ''
}

export async function getMiniGameDeviceInfo() {
  const fn = getLegacyGlobal('$parentGetMiniGameDeviceInfo')
  if (typeof fn !== 'function') {
    return {}
  }

  try {
    const data = await fn()
    return data || {}
  } catch {
    return {}
  }
}
