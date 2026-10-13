/**
 * Android WebView bridge — merged from pad host + online SDK wrapper.
 */

import { getLegacyStore, getLegacyUserInfo } from '@/compat/legacyGlobals'

export function detectDevice() {
  const ua = navigator.userAgent
  // Local override: ?lzDevice=pad|phone|pc  (also works in hash query)
  const search = `${window.location.search || ''}${window.location.hash || ''}`
  const force = /[?&#]lzDevice=(pad|phone|pc)(?:$|[&#])/i.exec(search)?.[1]?.toLowerCase()
  if (force === 'phone') {
    return { isPhoneDevice: true, isPadDevice: true }
  }
  if (force === 'pad') {
    return { isPhoneDevice: false, isPadDevice: true }
  }
  if (force === 'pc') {
    return { isPhoneDevice: false, isPadDevice: false }
  }

  // 非移动 UA（桌面浏览器）也统一按 Pad 处理，保证 test/预发/线上行为一致：
  // 预购页等移动端页面在桌面浏览器同样走移动端支付弹窗。
  // 需要走 PC 流程时用 ?lzDevice=pc 显式指定，上面的 force 分支会提前返回。
  return {
    isPhoneDevice: /LegionPhone/i.test(ua),
    isPadDevice: true
  }
}

function decodeBase64Json(base64Str) {
  try {
    const bytes = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0))
    return JSON.parse(new TextDecoder('utf-8').decode(bytes))
  } catch (e) {
    return null
  }
}

function decodeBase64Utf8(base64Str) {
  if (typeof base64Str !== 'string' || !base64Str) return ''
  try {
    const bytes = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch (_) {
    try {
      return decodeURIComponent(escape(atob(base64Str)))
    } catch (__) {
      try {
        return atob(base64Str)
      } catch (___) {
        return ''
      }
    }
  }
}

function ensureLegacyBase64Decoder() {
  if (!window.LzmbBase64 || typeof window.LzmbBase64.decode !== 'function') {
    window.LzmbBase64 = {
      ...(window.LzmbBase64 || {}),
      decode: decodeBase64Utf8
    }
  }
}

/**
 * Wrap Android-injected `_LegionZoneMobile` into Promise-based `window.LegionZoneMobile`.
 * Also accepts already-provided `window.LegionZoneMobile` from jssdk.js.
 */
export function initLegionZoneMobileSDK() {
  // Legacy pad jssdk expects this global decoder in nativeResponse.
  ensureLegacyBase64Decoder()

  if (window.LegionZoneMobile && window.LegionZoneMobile.nativeCall) {
    attachLoginListener()
    attachAccelStatusListener()
    attachAccelStateListener()
    attachAccelPanelListener()
    return window.LegionZoneMobile
  }
  if (!window._LegionZoneMobile) {
    return null
  }

  const _native = window._LegionZoneMobile
  const _pendingCallbacks = {}
  const _listeners = {}
  let _callId = 0

  window.LegionZoneMobile = {
    nativeCall(model, method, params) {
      const id = method + '_' + (++_callId)
      const paramsStr = params !== undefined && params !== null ? JSON.stringify(params) : ''
      return new Promise((resolve, reject) => {
        _pendingCallbacks[id] = { resolve, reject }
        try {
          if (paramsStr) {
            _native.nativeCall(model, method, id, paramsStr)
          } else {
            _native.nativeCall(model, method, id)
          }
        } catch (e) {
          delete _pendingCallbacks[id]
          reject(e)
        }
      })
    },
    nativeResponse(id, isSuccess, data) {
      const cb = _pendingCallbacks[id]
      if (!cb) return
      delete _pendingCallbacks[id]
      let parsed = data
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data)
        } catch (_) {
          const decoded = decodeBase64Json(data)
          parsed = decoded != null ? decoded : data
        }
      }
      isSuccess ? cb.resolve(parsed) : cb.reject(parsed)
    },
    nativeNotify(method, data) {
      const handlers = _listeners[method]
      if (!handlers) return
      let parsed = data
      try {
        parsed = JSON.parse(data)
      } catch (_) {
        /* ignore */
      }
      handlers.forEach(fn => fn(parsed))
    },
    addListener(tag, callback) {
      if (!_listeners[tag]) _listeners[tag] = []
      _listeners[tag].push(callback)
      return callback
    },
    removeListener(callback) {
      Object.keys(_listeners).forEach(tag => {
        _listeners[tag] = _listeners[tag].filter(fn => fn !== callback)
      })
    },
    removeEventListener(callback) {
      this.removeListener(callback)
    }
  }

  try {
    window._LegionZoneMobile.nativeNotify = window.LegionZoneMobile.nativeNotify.bind(window.LegionZoneMobile)
    window._LegionZoneMobile.nativeResponse = window.LegionZoneMobile.nativeResponse.bind(window.LegionZoneMobile)
  } catch (e) {
    /* Java object may not allow property assignment */
  }

  attachLoginListener()
  attachAccelStatusListener()
  attachAccelStateListener()
  attachAccelPanelListener()
  return window.LegionZoneMobile
}

function attachLoginListener() {
  if (!window.LegionZoneMobile?.addListener || window.__LZ_LOGIN_LISTENER__) return
  window.__LZ_LOGIN_LISTENER__ = true
  window.LegionZoneMobile.addListener('login_status', function(base64Data) {
    const store = getLegacyStore()
    if (!store) return
    const parsed = typeof base64Data === 'string' ? decodeBase64Json(base64Data) : base64Data
    if (!parsed) return
    // pad host format
    if (parsed?.isLogin === 1 && parsed.data) {
      // 收到 native 明确的“已登录”信号：即使 userInfo 尚未完整，也先把 loginStatus 置为 'yes'，
      // 供首屏直接显示“已登录”，避免等异步 userInfo 回来期间误显示“未登录”。
      store.dispatch('syncLoginStatus', { loginStatus: 'yes' }).catch(() => {})
      store.dispatch('user/syncLoginStatus', { loginStatus: 'yes' }).catch(() => {})
      store.dispatch('user/syncUserInfo', { obj: parsed.data }).catch(() => {})
      store.dispatch('syncUserInfo', {
        ready: true,
        user: { userInfo: parsed.data.userInfo || parsed.data, loginStatus: 'yes' }
      }).catch(() => {})
      consumeLoginResume()
      return
    }
    if (parsed?.isLogin === 0) {
      // 收到 native 明确的“未登录”信号：置 loginStatus 为 'no'，并清空 userInfo。
      store.dispatch('syncLoginStatus', { loginStatus: 'no' }).catch(() => {})
      store.dispatch('user/syncLoginStatus', { loginStatus: 'no' }).catch(() => {})
      store.dispatch('user/syncUserInfo', { obj: {} }).catch(() => {})
      store.dispatch('syncUserInfo', {
        ready: true,
        user: { userInfo: null, loginStatus: 'no' }
      }).catch(() => {})
      // 权益与加速状态缓存必须跟着登录态一起清：否则退出登录或切换账号后，
      // 下一个账号会沿用上一个账号的会员卡和“加速中”状态。
      store.dispatch('syncAccelStatus', null).catch(() => {})
      store.dispatch('user/syncAccelStatus', null).catch(() => {})
      store.dispatch('syncAccelState', null).catch(() => {})
      store.dispatch('user/syncAccelState', null).catch(() => {})
      clearLoginResume()
      return
    }
    // online format
    const isLogin = parsed.isLogin
    const userInfo = (parsed.data && parsed.data.userInfo) || null
    const validUserInfo = isLogin !== 0 && userInfo && userInfo.Token ? userInfo : null
    store.dispatch('syncUserInfo', {
      ready: true,
      user: { userInfo: validUserInfo, loginStatus: isLogin !== 0 ? 'yes' : 'no' }
    }).catch(() => {})
    if (isLogin === 0) {
      store.dispatch('syncAccelStatus', null).catch(() => {})
      store.dispatch('user/syncAccelStatus', null).catch(() => {})
      store.dispatch('syncAccelState', null).catch(() => {})
      store.dispatch('user/syncAccelState', null).catch(() => {})
      clearLoginResume()
    } else {
      consumeLoginResume()
    }
  })
}

/**
 * H5 加速链路（游戏空间页的「加速启动」/ 会员卡）拉起登录时携带的来源标记。
 * 原生据此把 #2 / #4 两条登录埋点的 source 归到 "7"（游戏加速相关触发的登录）；
 * 其余 H5 登录入口一律不传参数，source 仍为 "4"。
 */
export const LOGIN_SOURCE_XUNYOU_ACCEL = 'xunyou_accel'

/**
 * 拉起原生登录弹窗。
 * @param {Object} [params] 可选的来源标记，形如 `{ source: LOGIN_SOURCE_XUNYOU_ACCEL }`。
 *   不传时 `nativeCall` 收到的是空参数、走无参重载，与改动前完全一致；
 *   旧版原生不认识该参数，会直接忽略并照常弹登录框。
 */
export function nativeLogin(params) {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'LIDLogin', params)
}

// LIDLogin 不回包（原生只 notifyLogin），$login() 的 Promise 永不 settle。
// 未登录点击要在登录成功后续跑原动作，只能挂在 login_status 已登录推送上。
const LOGIN_RESUME_TTL_MS = 120000
let pendingLoginResume = null

export function clearLoginResume() {
  pendingLoginResume = null
}

function consumeLoginResume() {
  const pending = pendingLoginResume
  pendingLoginResume = null
  if (!pending) return
  if (Date.now() > pending.expireAt) {
    console.log('[XunyouAccel] H5 login resume 已过期，丢弃')
    return
  }
  try {
    pending.onSuccess()
  } catch (e) {
    console.warn('[XunyouAccel] H5 login resume 回调异常', e)
  }
}

/**
 * 拉起登录并登记「登录成功后要续跑的动作」。
 * @param {Function} [onSuccess] 登录成功后回调；不传则只弹登录框（与改动前一致）
 * @param {Object} [params] 可选的来源标记，透传给 nativeLogin，见 LOGIN_SOURCE_XUNYOU_ACCEL
 */
export function loginThen(onSuccess, params) {
  pendingLoginResume = typeof onSuccess === 'function'
    ? { onSuccess, expireAt: Date.now() + LOGIN_RESUME_TTL_MS }
    : null
  return nativeLogin(params)
}

/**
 * 监听 native 推送的迅游加速权益状态（tag=accel_status）。
 * native 在 queryXunyouUserState 鉴权回调拿到 errorCode/userState/vipExpireTime 后推送，
 * H5 据此替换卡片“权益加载中”占位。
 * data 形如 {errorCode, userState, vipExpireTime}，也可能为字符串（JSON），统一兼容。
 */
function attachAccelStatusListener() {
  if (!window.LegionZoneMobile?.addListener || window.__LZ_ACCEL_LISTENER__) return
  window.__LZ_ACCEL_LISTENER__ = true
  window.LegionZoneMobile.addListener('accel_status', function(data) {
    const store = getLegacyStore()
    // 迅游权益日志统一带 [XunyouAccel] 前缀，便于 adb logcat | grep XunyouAccel 一把过滤 H5+native
    console.log('[XunyouAccel] H5 收到 accel_status 推送', { hasStore: !!store })
    if (!store) return
    // native 经 H5MessageSender.notify 推送，payload 已被 base64 编码（与 login_status 一致），
    // 必须先 base64 解码再 JSON.parse，否则解析失败、store 不更新、卡片卡在占位态。
    let parsed = typeof data === 'string' ? decodeBase64Json(data) : data
    if (!parsed || typeof parsed !== 'object') {
      console.warn('[XunyouAccel] H5 accel_status 解析失败', parsed)
      return
    }
    const payload = {
      errorCode: parsed.errorCode,
      userState: parsed.userState,
      vipExpireTime: parsed.vipExpireTime,
      // 登录后续跑加速启动时用来区分「登录前残留的旧快照」和「这次鉴权推送」
      receivedAt: Date.now()
    }
    console.log('[XunyouAccel] H5 accel_status 写入 store', payload)
    store.dispatch('syncAccelStatus', payload).catch(() => {})
    store.dispatch('user/syncAccelStatus', payload).catch(() => {})
  })
  console.log('[XunyouAccel] H5 attachAccelStatusListener 监听已注册')
  // 监听挂完后补推一次：解决 native 首次推送早于监听挂载而丢失的问题。
  // native 用 lastAuthToken 重鉴权，结果经 accel_status 推回本监听（已挂），首屏即拿到权益态。
  // 加 500ms 延迟：确保 native 的 requestAuth（冷启动异步取 token）已执行、lastAuthToken 已就绪，
  // 否则 refreshAccelStatus 会因 lastAuthToken 为空跳过。
  setTimeout(() => {
    console.log('[XunyouAccel] H5 监听挂完，触发 refreshAccelStatus 补推')
    refreshAccelStatus()
  }, 500)
}

/**
 * 把一份已规范化的加速状态写入 store。
 *
 * `syncAccelState` 在根 state 与 `user` 命名空间模块上各有一份（Vuex 注册 module 时会覆盖根上同名 key），
 * 既有代码一律两个一起 dispatch，新增同步点照做，不要只派发其中一个。
 */
function applyAccelState(payload) {
  const store = getLegacyStore()
  if (!store || !payload) return
  store.dispatch('syncAccelState', payload).catch(() => {})
  store.dispatch('user/syncAccelState', payload).catch(() => {})
}

/**
 * 把 native 下发的加速状态规范化成 store 里的形状。
 * 「推送」与「主动拉取」共用这一处，避免两条路径的口径分叉。
 */
function normalizeAccelState(parsed) {
  return {
    established: parsed.established === true,
    packageName: parsed.packageName || '',
    // 本次加速起始时刻（epoch 毫秒），0 表示未在加速。卡片加速信息面板据此算"已加速时长"；
    // 由原生侧记录，H5 重载/切页都不会把计时清零。
    startTimeMs: Number(parsed.startTimeMs) || 0
  }
}

/**
 * 监听 native 推送的迅游加速状态（tag=accel_state）：加速中游戏包名 / 已停止。
 * VPN 建立/断开时由 native 推送，H5 据此把对应游戏卡片“加速启动”按钮切到“加速中”/恢复。
 * data 形如 {established, packageName}（base64 编码），established=true 时 packageName 为加速中游戏。
 */
function attachAccelStateListener() {
  if (!window.LegionZoneMobile?.addListener || window.__LZ_ACCEL_STATE_LISTENER__) return
  window.__LZ_ACCEL_STATE_LISTENER__ = true
  window.LegionZoneMobile.addListener('accel_state', function(data) {
    const parsed = typeof data === 'string' ? decodeBase64Json(data) : data
    if (!parsed || typeof parsed !== 'object') {
      console.warn('[XunyouAccel] H5 accel_state 解析失败', parsed)
      return
    }
    const payload = normalizeAccelState(parsed)
    console.log('[XunyouAccel] H5 收到 accel_state 推送', payload)
    applyAccelState(payload)
  })
  console.log('[XunyouAccel] H5 attachAccelStateListener 监听已注册')
  attachAccelVisibilitySync()
}

/**
 * 页面恢复可见时主动向 native 对齐一次加速状态与面板数据。
 *
 * accel_state 推送在页面不可见期间会错过（WebView 侧监听可能已失效），而 SDK 的 VPNStateListener
 * 也不保证覆盖所有断开场景 —— 真机出现过「VPN 早已断开、H5 却永久停在加速中」。主动拉取不依赖
 * 监听器在位，比推送可靠，所以恢复可见时问一次；首次进入页面的那一次由页面的 mounted 负责。
 * accel_panel 是同一类问题（且它在「加速刚开始」那一次拿到的是空壳），一并补拉。
 */
function attachAccelVisibilitySync() {
  if (typeof document === 'undefined' || window.__LZ_ACCEL_STATE_VISIBILITY__) return
  window.__LZ_ACCEL_STATE_VISIBILITY__ = true
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState !== 'visible') return
    syncAccelStateFromNative()
    syncAccelPanelFromNative()
  })
}

/**
 * 最近一次收到 accel_panel 推送帧的时刻，用来判断 native 的推送链路是否还活着。
 * 0 表示本次页面生命周期内一帧都还没收到过。只在推送回调里更新——
 * 主动补拉不算数，否则看门狗会把自己的补拉当成「推送还活着」而停止工作。
 */
let lastAccelPanelPushAt = 0

/**
 * 监听 native 推送的加速信息面板数据（tag=accel_panel）：加速中每秒一帧。
 * data 形如 {delayMs, baseMs, boost, loss, delaySeries, baseSeries, ready}（base64 编码）。
 * 面板与延迟折线的数据全部由 native 计算，H5 只落到 store 供展示。
 */
function attachAccelPanelListener() {
  if (!window.LegionZoneMobile?.addListener || window.__LZ_ACCEL_PANEL_LISTENER__) return
  window.__LZ_ACCEL_PANEL_LISTENER__ = true
  window.LegionZoneMobile.addListener('accel_panel', function(data) {
    const store = getLegacyStore()
    if (!store) return
    let parsed = typeof data === 'string' ? decodeBase64Json(data) : data
    if (!parsed || typeof parsed !== 'object') return
    lastAccelPanelPushAt = Date.now()
    store.dispatch('user/syncAccelPanel', parsed).catch(() => {})
  })
  console.log('[XunyouAccel] H5 attachAccelPanelListener 监听已注册')
}

/**
 * 同步获取加速信息面板的最新一帧，供 H5 打开面板 / 详情页时立即渲染，不必空等下一次推送。
 * 非真实移动端返回 null（桌面 mock，按"暂无数据"处理）。
 */
export function getAccelPanelSync() {
  try {
    const raw = window._LegionZoneMobile?.getAccelPanel
    if (typeof raw === 'function') {
      const result = raw.call(window._LegionZoneMobile)
      if (!result) return null
      try { return JSON.parse(result) } catch (_) { return null }
    }
  } catch (e) {
    /* native 接口不可用 */
  }
  return null
}

/**
 * 主动补拉一帧加速信息面板数据并写入 store。
 *
 * 与 accel_panel 推送是同一份数据的两个入口：推送是即发即弃，页面不可见、监听未挂或 native 端
 * 接收者指错 WebView 时会静默丢失。面板原本只在「加速刚开始」拉过一次，而那一刻采样线程才启动、
 * 第一帧还没出来，拿到的是 ready=false 的空壳，之后再没有第二次机会——卡片与详情页就永远停在
 * 占位值。所以回到游戏空间、打开详情页、App 恢复可见这几个时机都要补拉一次。
 * 与权益的 getAccelStatusSync / refreshAccelStatus、加速状态的 syncAccelStateFromNative 同一套路。
 *
 * @returns {boolean} 是否拿到可用数据（ready 为 true）；false 时调用方可按“暂无”展示
 */
export function syncAccelPanelFromNative() {
  const store = getLegacyStore()
  if (!store) return false
  const snap = getAccelPanelSync()
  if (!snap || typeof snap !== 'object') return false
  store.dispatch('user/syncAccelPanel', snap).catch(() => {})
  return snap.ready === true
}

/**
 * 面板数据的看门狗：加速中每秒调用一次，发现「好一会儿没有推送帧」就主动补拉一帧。
 *
 * 为什么需要它：accel_panel 是 native 即发即弃的推送，接收者一旦指向了别的 WebView
 * （进程里有多个 WebView 时就会发生）整条链路会静默失效 —— H5 既收不到帧也没有任何异常，
 * 面板会永远停在旧值。而「回到游戏空间 / 打开详情页时补拉一次」只能救回打开那一刻的数字，
 * 用户盯着看会发现它再也不动了。这里以「超过两个推送周期没收到帧」作为链路失效的判据：
 * 推送正常时它什么都不做（不跟推送抢），推送断了它顶上来按秒刷新。
 *
 * @param {number} [maxAgeMs] 允许的最大无推送时长，默认 2.5 秒（两个推送周期 + 余量）
 * @returns {boolean} 本次是否触发了补拉
 */
export function ensureAccelPanelFresh(maxAgeMs = 2500) {
  if (Date.now() - lastAccelPanelPushAt < maxAgeMs) return false
  syncAccelPanelFromNative()
  return true
}

/**
 * 同步获取加速过渡动画要展示的「延迟预计降低」百分比。
 * 非真实移动端或接口不可用返回 0，调用方回落到默认展示值。
 */
export function getAccelPreviewBoostSync() {
  try {
    const raw = window._LegionZoneMobile?.getAccelPreviewBoost
    if (typeof raw === 'function') {
      const result = Number(raw.call(window._LegionZoneMobile))
      if (Number.isFinite(result) && result > 0) return result
    }
  } catch (e) {
    /* native 接口不可用 */
  }
  return 0
}

export function DataReport(Category, Action, Label, params = {}) {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve()
  return window.LegionZoneMobile
    .nativeCall('LegionZone', 'trackEvent', {
      Category,
      Action,
      Label,
      params
    })
    .catch(() => {})
}

export function getSystemInfo() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getSystemInfo', null)
}

export function getUserInfo() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getUserInfo', null)
}

/**
 * H5 监听挂载后补推权益状态：native 用 lastAuthToken 重新鉴权，结果经 accel_status 推回已挂监听。
 * 解决“native 首次推送早于 H5 监听挂载而丢失”导致首屏卡“权益加载中”的问题。
 *
 * @param {boolean} [force=false] 是否绕过 native 的 3 秒节流。
 *   native 对 refreshAccelStatus 有 3 秒节流（防 H5 切页刷屏），进页面时已经刷过一次，
 *   用户紧接着点「领取并加速」时多半还在窗口内、请求会被静默丢弃。
 *   只有用户动作（领取福利后立刻加速）那几次才传 true；其余调用一律保持 false ——
 *   全局节流语义不变，不能把强制重鉴权变成常态。
 *   false 时**不带 params 下发**，与改动前的报文格式完全一致。
 */
export function refreshAccelStatus(force = false) {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve()
  return window.LegionZoneMobile
    .nativeCall('LegionZone', 'refreshAccelStatus', force ? { force: true } : null)
    .catch(() => {})
}

/**
 * 同步获取联想账号登录态（返回 'yes' / 'no'），供首屏在 Vue 挂载前快速判定、避免闪烁。
 * 直接同步调用 native @JavascriptInterface 方法 getLoginStatus()，不走 nativeCall 异步 Promise，
 * 因为后者依赖 nativeResponse 回调、且 getUserInfo 读的缓存可能被端侧 onCreate 清空而返回空。
 * getLoginStatus 内部同步调 LenovoIDApi.getStatus()，不依赖网络与缓存就绪。
 * 非真实移动端（无 _LegionZoneMobile 注入）返回 'no'，与桌面 mock 行为一致。
 *
 * ⚠️ 已知问题（2026-09-23）：上面那句"快速判定、避免闪烁"目前**做不到**。native 的 getLoginStatus
 * 仍保留 checkSecurity 校验（涉及账号，刻意不放宽），而该校验要读 WebView.getUrl()、只能在主线程调，
 * 接口本身却跑在 JS bridge 线程 —— 校验恒为 false，所以**该接口当前恒返回 'no'**。
 * 因此调用方不要把本函数的 'no' 当成"确定未登录"，只当作"尚未确认"；首屏登录态实际由
 * login_status 推送纠正，中间会有一个短暂窗口。详见 WebCallJavaInterface#getLoginStatus。
 */
export function getLoginStatusSync() {
  try {
    const raw = window._LegionZoneMobile?.getLoginStatus
    if (typeof raw === 'function') {
      const result = raw.call(window._LegionZoneMobile)
      return result === 'yes' ? 'yes' : 'no'
    }
  } catch (e) {
    /* native 接口不可用，按未登录处理 */
  }
  return 'no'
}

/**
 * 同步获取迅游加速权益状态，供 H5 挂载时主动拉一次兜底。
 * 直接同步调 native @JavascriptInterface getAccelStatus()，返回 JSON 串：
 * {"errorCode":int,"userState":int,"vipExpireTime":"str"}，errorCode=-1 表示未鉴权/不可用。
 * 背景：native accel_status 推送是即发即弃，App 启动时鉴权回调可能早于 H5 注册监听，
 * 导致权益卡片一直"权益加载中"。本方法让 H5 在挂载时补拉最近一次鉴权结果。
 * 非真实移动端返回 null（与桌面 mock 行为一致，按"权益未知"处理）。
 */
export function getAccelStatusSync() {
  try {
    const raw = window._LegionZoneMobile?.getAccelStatus
    if (typeof raw === 'function') {
      const result = raw.call(window._LegionZoneMobile)
      if (!result) return null
      try { return JSON.parse(result) } catch (_) { return null }
    }
  } catch (e) {
    /* native 接口不可用 */
  }
  return null
}

/**
 * 同步获取迅游加速状态（加速中游戏包名 / 已停止），供 H5 主动对齐真实状态。
 * 直接同步调 native @JavascriptInterface getAccelState()，返回 JSON 串：
 * {"established":bool,"packageName":"str","startTimeMs":long}。
 *
 * 与 getAccelStatusSync 的区别：后者读的是 native 的**鉴权缓存**，本方法拿到的是 native
 * **实时向 SDK 查询**（isVpnEstablished && isAccelOpened）的结果，所以它才是「此刻是否真的在加速」
 * 的权威答案。非真实移动端（桌面 mock）或接口不可用时返回 null，调用方保持现有状态即可。
 */
export function getAccelStateSync() {
  try {
    const raw = window._LegionZoneMobile?.getAccelState
    if (typeof raw === 'function') {
      const result = raw.call(window._LegionZoneMobile)
      if (!result) return null
      try { return JSON.parse(result) } catch (_) { return null }
    }
  } catch (e) {
    /* native 接口不可用 */
  }
  return null
}

/**
 * 用 native 的实时查询对齐本地加速状态。
 *
 * ⚠️ 只在读到「**确实在加速**」（established 且有包名）时才写 store，未加速态一律交给 accel_state 推送。
 * 原因是这个同步桥拿不到可信的「未加速」结论：native 的 getAccelState 在 SDK 未就绪 / 抛异常时返回的是
 * {established:false, packageName:'', startTimeMs:0} 这个降级值，它与「真的没在加速」**字面完全相同**，
 * H5 无法区分。无条件覆盖会把刚推来的「加速中」冲掉，卡片退回「加速启动」。
 * （另：旧版 APK 的 getAccelState 还带 checkSecurity 校验，而该校验在 JS bridge 线程恒失败、同样返回
 *   这个降级值；守卫也一并兜住了"H5 已发、APK 未发"那段发版窗口。）
 * 代价是失去「VPN 已断、推送又没到」时的自愈 —— 那个场景本来就依赖同一个同步桥，拿不到可信值。
 *
 * @returns {boolean} true 表示已用「加速中」对齐；false 表示未覆盖（native 不可用 / 读到未加速态）
 */
export function syncAccelStateFromNative() {
  const state = getAccelStateSync()
  if (!state) return false
  const payload = normalizeAccelState(state)
  if (!payload.established || !payload.packageName) {
    // 降级值与真未加速无法区分，保持 store 现状（同一条日志便于排查是哪一种）
    console.log('[XunyouAccel] H5 主动同步加速状态：读到未加速/降级值，保持现状 '
      + JSON.stringify(payload))
    return false
  }
  // 拼成字符串而不是把对象交给 console：Android 的 onConsoleMessage 只转发 message 首段，
  // 传对象会退化成 [object Object]，adb logcat 里看不到 established/packageName/startTimeMs 的实际值。
  console.log('[XunyouAccel] H5 主动同步加速状态 ' + JSON.stringify(payload))
  applyAccelState(payload)
  return true
}

/**
 * 解析端侧 GetLIDStatus 的返回，取出最新用户信息（含 Token/Realm/UserID）。
 * 兼容端侧直接返回对象，或返回 JSON 字符串两种情况。
 * 返回结构：{"isLogin":1,"data":{"avatar":{...},"userInfo":{"Realm":...,"Token":...,"UserID":...,"UserName":...}}}
 * @returns {Object|null} userInfo 对象（含明文 Token），不是登录态或解析失败时返回 null
 */
function parseLidStatus(res) {
  let data = res
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch (e) {
      return null
    }
  }
  if (!data || typeof data !== 'object') return null
  if (data.isLogin !== 1 && data.isLogin !== '1') return null
  const userInfo = (data.data && data.data.userInfo) || data.data || null
  if (!userInfo || !userInfo.Token) return null
  return userInfo
}

/**
 * 强制刷新 LID token（已登录时向端侧要最新 ST；未登录端侧会直接返回缓存/空，不弹登录）。
 * 老版本端侧没有 GetLIDStatus 分支，nativeCall 永不 resolve，用超时兜底返回 null。
 * @param {Number} [timeout = 3000] 无感续签等待上限（毫秒）
 * @returns {Promise<Object|null>}
 */
export function refreshLIDToken(timeout = 3000) {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve(null)
  return Promise.race([
    window.LegionZoneMobile.nativeCall('LegionZone', 'GetLIDStatus', null)
      .then(parseLidStatus)
      .catch(() => null),
    new Promise(resolve => setTimeout(() => resolve(null), timeout))
  ])
}

let ensureLidTokenInflight = null
let lastEnsureLidTokenAt = 0
const ENSURE_LID_TOKEN_TTL = 5 * 60 * 1000

/**
 * 已登录时向端侧取最新 ST。没登录不调用。
 * 刷新失败返回 null，调用方应继续用手头已有 Token，不要当成掉登录。
 */
export function ensureValidLidToken() {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve(null)
  if (!getLegacyUserInfo()?.Token) return Promise.resolve(null)
  const now = Date.now()
  if (now - lastEnsureLidTokenAt < ENSURE_LID_TOKEN_TTL && !ensureLidTokenInflight) {
    return Promise.resolve(null)
  }
  if (ensureLidTokenInflight) return ensureLidTokenInflight
  ensureLidTokenInflight = refreshLIDToken(5000).then(newUserInfo => {
    if (newUserInfo?.Token) {
      lastEnsureLidTokenAt = Date.now()
    }
    return newUserInfo
  }).finally(() => {
    ensureLidTokenInflight = null
  })
  return ensureLidTokenInflight
}

export function markLidTokenFresh() {
  lastEnsureLidTokenAt = Date.now()
}
