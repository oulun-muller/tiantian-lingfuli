/**
 * 迅游加速权益判定。
 *
 * 权益状态由 native 的 accel_status 推送 / getAccelStatus 同步读取，形如：
 *   { errorCode, userState, vipExpireTime }
 *
 * 会员卡（XunyouMemberCard）的卡片形态与游戏卡片「加速启动」按钮的跳转分支
 * 都必须用同一套「有没有权益」的判定 —— 两处口径一旦分叉，就会出现
 * 「卡片说已开通、按钮却把你送去购买页」这类自相矛盾的表现，所以抽到这里共用。
 */

import { getAccelStatusSync, refreshAccelStatus } from '@/bridge/legionZoneMobile'
import { getLegacyStore } from '@/compat/legacyGlobals'

const DAY_MS = 86400000
// vipExpireTime 是北京时间，解析时要按 UTC+8 换算成绝对时刻
const BEIJING_OFFSET_MS = 8 * 3600000
// vipExpireTime 形如 '2026-12-31 23:59:59'（北京时间），非 VIP 为空串
const EXPIRE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/

/**
 * 到期时刻（毫秒时间戳）。按北京时间（UTC+8）换算，不能按设备本地时区解析，
 * 否则设备时区非 UTC+8 时剩余天数会差一天。解析不到返回 null。
 */
function parseExpireAt(vipExpireTime) {
  const matched = EXPIRE_RE.exec(String(vipExpireTime || '').trim())
  if (!matched) return null
  const ms = Date.UTC(
    +matched[1], +matched[2] - 1, +matched[3],
    +matched[4] || 0, +matched[5] || 0, +matched[6] || 0
  ) - BEIJING_OFFSET_MS
  return Number.isNaN(ms) ? null : ms
}

/**
 * 剩余天数（向上取整）。解析不到到期时间按 0 天处理，不抛错。
 * @param {object|null} accelStatus native accel_status 推送的权益状态
 */
export function accelRemainDays(accelStatus) {
  const expireAt = parseExpireAt(accelStatus && accelStatus.vipExpireTime)
  if (expireAt === null) return 0
  return Math.ceil((expireAt - Date.now()) / DAY_MS)
}

/** 「有效期至」展示用的 yyyy-MM-dd（北京时间日期，不做时区换算）。解析不到返回空串。 */
export function formatAccelExpireDate(vipExpireTime) {
  const matched = EXPIRE_RE.exec(String(vipExpireTime || '').trim())
  if (!matched) return ''
  return `${matched[1]}-${matched[2].padStart(2, '0')}-${matched[3].padStart(2, '0')}`
}

/**
 * 是否持有有效加速权益。
 *
 * 口径与会员卡一致：errorCode 必须为 0（用 Number() 兼容数字与字符串 "0"），
 * userState 为 2 或 4，且剩余天数 ≥ 1 —— 已过期（userState 仍为 2/4 但时间已过）
 * 视为无权益，否则按钮会拿一份过期权益去调加速，原生侧只能静默失败。
 *
 * @param {object|null} accelStatus native accel_status 推送的权益状态
 */
export function hasAccelRight(accelStatus) {
  if (!accelStatus) return false
  if (Number(accelStatus.errorCode) !== 0) return false
  const userState = Number(accelStatus.userState)
  if (userState !== 2 && userState !== 4) return false
  return accelRemainDays(accelStatus) >= 1
}

// 会员卡「剩余 ≤7 天」的分界（memberLe7）：与 #37 的 expiring 同一口径
const MEMBER_LE7_DAYS = 7

/**
 * #7「游戏空间页曝光」的 vip 参数文案（需求文档 3.1 #7）：会员报剩余会员时长，非会员报「暂未开通」。
 * 文案与游戏空间页会员卡上显示的状态保持一致（需求原文：「根据当时页面显示的状态信息即可」）：
 * 剩余 >7 天显示到期日期、≤7 天显示剩余天数；判定口径与会员卡的卡片态同源（hasAccelRight）。
 * @param {object|null} accelStatus native accel_status 推送的权益状态
 */
export function formatAccelVipStatusText(accelStatus) {
  if (!hasAccelRight(accelStatus)) return '暂未开通'
  const remainDays = accelRemainDays(accelStatus)
  if (remainDays > MEMBER_LE7_DAYS) {
    return `有效期至 ${formatAccelExpireDate(accelStatus.vipExpireTime)}`
  }
  return `剩余 ${remainDays} 天`
}

function syncAccelStatusToStore(store, accelStatus) {
  if (!store || !accelStatus || Number(accelStatus.errorCode) === -1) return
  store.dispatch('syncAccelStatus', accelStatus).catch(() => {})
  store.dispatch('user/syncAccelStatus', accelStatus).catch(() => {})
}

/**
 * 读 store 里当前的加速到期时间。只有鉴权成功（errorCode === 0）的快照才算数，
 * 其余情况（store 为空、native 未就绪、本次查询失败）一律返回 null 表示「基线未知」。
 * 注意不能返回 ''：「确实无权益」是有效基线，与「不知道」语义不同，混用会让续费场景误判成功。
 */
function readStoreExpireTime(store) {
  const status = store && store.state && store.state.user && store.state.user.accelStatus
  // 只有鉴权成功（errorCode === 0）的快照才提供可信基线。其他非 0 码（-1 表示 native 未就绪/不可用，
  // 1008 这类表示本次查询失败）都意味着「没拿到可信数据」，其空的 vipExpireTime 不能当作
  // 「确实无权益」的基线——否则续费场景第一轮读到旧到期日就会被误判成「变了」而提前退出。
  if (!status || Number(status.errorCode) !== 0) return null
  return String(status.vipExpireTime || '')
}

/**
 * 触发 native 重新鉴权并轮询同步权益。
 * native 刷新存在 3 秒节流，间隔下限固定 3500ms；桌面 mock 或旧客户端不可用时静默结束。
 *
 * 两种退出条件：
 * - 默认（不传 waitUntilChanged）：`errorCode === 0` 即认定可以结束，最多 maxAttempts 轮。
 *   进页面刷一次这类调用方用它 —— 非会员进游戏空间是常态，不能为等权益白打十几轮请求。
 * - `waitUntilChanged`：以 `vipExpireTime` 相对基线发生变化作为「权益真正生效」的硬证据。
 *   支付成功 / 领取福利只代表我方订单已被受理，权益由后端**异步**同步给迅游，所以
 *   「鉴权查询成功」（errorCode === 0）不等于「权益已生效」—— 拿它当退出条件会在第一轮就
 *   退出（userState / vipExpireTime 还是旧值），卡片随即停在旧会员态，直到用户恰好重进页面。
 *   store 里没有可信基线时（鉴权尚未成功、或 store 里是 -1 / 1008 这类失败码快照）以首次读取值作基线、
 *   要求之后再变一次，宁可多轮询到上限也不误判。
 *   刻意不用 userState 变化作判定：它可能因无关原因在 1↔2 之间来回，会提前误判成功。
 *
 * @param {object} [options]
 * @param {import('vuex').Store} [options.store] 显式传入页面 store；省略时使用兼容层全局 store
 * @param {number} [options.intervalMs=3500] 刷新间隔，必须大于 native 的 3 秒节流窗口
 * @param {number} [options.maxAttempts=3] 默认模式下的最多刷新次数
 * @param {boolean} [options.waitUntilChanged=false] 是否等到权益真正发生变化（支付 / 领福利后用）
 * @param {number} [options.waitTimeoutMs=90000] waitUntilChanged 模式的等待上限，决定轮次上限
 * @returns {Promise<boolean>} 默认模式为「是否取得 errorCode 为 0 的权益状态」；
 *   waitUntilChanged 模式为「是否等到权益（vipExpireTime）发生变化」
 */
export async function refreshXunyouAccelStatus({
  store = getLegacyStore(),
  intervalMs = 3500,
  maxAttempts = 3,
  waitUntilChanged = false,
  waitTimeoutMs = 90000
} = {}) {
  const safeIntervalMs = Math.max(Number(intervalMs) || 3500, 3500)
  const attempts = waitUntilChanged
    ? Math.max(Math.ceil((Number(waitTimeoutMs) || 90000) / safeIntervalMs), 1)
    : Math.max(Number(maxAttempts) || 3, 1)
  // 基线必须在第一次重鉴权之前取：重鉴权结果会经 accel_status 推送写回 store，取晚了基线就被新值覆盖。
  // waitUntilChanged 模式下为 null 表示 store 里没有可信基线（见 readStoreExpireTime）
  let baselineExpireTime = waitUntilChanged ? readStoreExpireTime(store) : ''

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      // 每轮都重新触发，避免首次调用落在 native 的 3 秒节流窗口内。
      await refreshAccelStatus()
    } catch (_) {
      // native bridge 在桌面 mock 或旧客户端可能不可用，继续用同步接口轮询
    }

    await new Promise(resolve => setTimeout(resolve, safeIntervalMs))
    try {
      const accelStatus = getAccelStatusSync()
      syncAccelStatusToStore(store, accelStatus)
      if (Number(accelStatus?.errorCode) !== 0) continue
      if (!waitUntilChanged) return true
      const expireTime = String(accelStatus?.vipExpireTime || '')
      // 基线未知时不能直接比：无法区分这次读到的是「购买前就有的旧权益」还是「刚生效的新权益」，
      // 直接判「变了」会让续费场景第一轮就退出、退回原来的 bug。改为以首次读到的值作基线，
      // 要求之后再变一次；代价只是极端情况下多轮询到上限，而卡片显示的值本身已经是正确的。
      if (baselineExpireTime === null) {
        baselineExpireTime = expireTime
        continue
      }
      // 权益「真正生效」的硬证据是到期时间变了：首购 '' → 有值，续费/领福利 → 日期变晚
      if (expireTime && expireTime !== baselineExpireTime) return true
    } catch (_) {
      // native 接口不可用时静默重试，不能阻塞页面或领取/支付流程
    }
  }

  return false
}

const ACCEL_STATUS_WAIT_TIMEOUT_MS = 8000
const ACCEL_STATUS_WAIT_INTERVAL_MS = 200

// 「领取并加速」的短窗参数（见 waitForAccelRightAfterClaim）：
// 5 秒窗口内共 3 次强制重鉴权（t≈0 / 1.5s / 3s），其间每 200ms 本地读一次鉴权缓存。
const CLAIM_ACCEL_WAIT_TIMEOUT_MS = 5000
const CLAIM_ACCEL_POLL_INTERVAL_MS = 200
const CLAIM_ACCEL_REFRESH_AT_MS = [0, 1500, 3000]

function readAccelStatus(store) {
  return store && store.state && store.state.user && store.state.user.accelStatus
}

/**
 * 等到 store 里有一份可用的加速权益快照（errorCode !== -1）。
 * 登录成功后续跑加速启动时用：login_status 到了不等于鉴权到了，立刻判定会把会员送去购买页。
 * afterMs：只认 receivedAt 晚于该时刻的推送，避免把登录前残留的上一账号快照当成新结果。
 */
export function waitUntilAccelStatusReady({
  store = getLegacyStore(),
  timeoutMs = ACCEL_STATUS_WAIT_TIMEOUT_MS,
  intervalMs = ACCEL_STATUS_WAIT_INTERVAL_MS,
  afterMs = 0
} = {}) {
  return new Promise(resolve => {
    const started = Date.now()
    const tick = () => {
      const status = readAccelStatus(store)
      const ready = status && Number(status.errorCode) !== -1
      const fresh = !afterMs || Number(status && status.receivedAt) > afterMs
      if (ready && fresh) {
        resolve(status)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(ready && fresh ? status : null)
        return
      }
      setTimeout(tick, intervalMs)
    }
    tick()
  })
}

/**
 * 「领取并加速」用的短窗等待：福利领取成功后，等 SDK 鉴权结果里出现权益。
 *
 * 与 [refreshXunyouAccelStatus] 的区别（刻意不复用它）：
 * - `refreshXunyouAccelStatus` 的轮询间隔**硬编码下限 3500ms**（必须大于 native 的 3 秒节流），
 *   它等的是「值变化后才 resolve」，拿它做 5 秒短窗会跑到约 7 秒，与「5 秒内没等到就提示失败」冲突；
 * - 短窗要的是**高频读**：`getAccelStatusSync()` 只读 native 内存里最近一次鉴权结果，不发网络请求。
 *
 * 但光读无效：本地轮询只能反复读同一份鉴权结果，**真正的权益刷新只发生在重鉴权那一刻**。
 * 所以窗口内固定发起 3 次带 force 的重鉴权（t≈0 / 1.5s / 3s，绕过 native 的 3 秒节流）：
 * 只发 1 次的话，若那一次赶在迅游侧刷新之前，后面 20 多次本地读全是旧值、必然超时。
 *
 * 每轮把读到的快照写回 store（根 + user 命名空间双路），会员卡据此切到最新会员态。
 * 计时从调用那一刻起（调用方要在 claim 接口返回之后才调，领取 HTTP 最长 10 秒，计进去会吃掉大半窗口）。
 *
 * 命中即返回 true（此时鉴权结果里已经有权益，调用方可直接走加速启动）；
 * 到点仍未命中返回 false，由调用方 toast + 关弹窗（福利已发放，不回滚）。
 *
 * @param {object} [options]
 * @param {import('vuex').Store} [options.store] 显式传入页面 store；省略时使用兼容层全局 store
 * @param {number} [options.timeoutMs=5000] 短窗上限
 * @param {number} [options.pollIntervalMs=200] 本地读鉴权缓存的间隔
 * @param {number[]} [options.refreshAtMs=[0,1500,3000]] 强制重鉴权的时刻（相对调用时刻，毫秒）
 * @param {{cancel: (Function|null)}|null} [options.cancelRef] 调用方持有的取消句柄；组件卸载时调用
 *   `cancelRef.cancel()` 会立即清除本地轮询与尚未触发的重鉴权定时器，并以 false 结束等待。
 * @returns {Promise<boolean>} 是否在窗口内检测到加速权益
 */
export function waitForAccelRightAfterClaim({
  store = getLegacyStore(),
  timeoutMs = CLAIM_ACCEL_WAIT_TIMEOUT_MS,
  pollIntervalMs = CLAIM_ACCEL_POLL_INTERVAL_MS,
  refreshAtMs = CLAIM_ACCEL_REFRESH_AT_MS,
  cancelRef = null
} = {}) {
  const waitMs = Math.max(Number(timeoutMs) || 0, 0)
  const intervalMs = Math.max(Number(pollIntervalMs) || 0, 1)
  const refreshDelays = Array.isArray(refreshAtMs) ? refreshAtMs : []
  let done = false
  let pollTimer = null
  const refreshTimers = []
  let resolveWait = null

  // 收尾：命中、超时或调用方取消后，立刻停掉剩余的重鉴权与轮询，别让已经不需要的 force 重鉴权继续发出去。
  const stop = () => {
    done = true
    if (pollTimer) clearTimeout(pollTimer)
    pollTimer = null
    refreshTimers.forEach(clearTimeout)
    refreshTimers.length = 0
  }

  const finish = value => {
    if (done) return
    stop()
    if (cancelRef && typeof cancelRef === 'object') cancelRef.cancel = null
    resolveWait(value)
  }

  const refresh = () => {
    if (done) return
    // force 绕过 native 的 3 秒节流。native 不可用（桌面 mock / 旧客户端）时静默失败，继续轮询。
    try {
      refreshAccelStatus(true).catch(() => {})
    } catch (_) {
      /* 桥接不可用，忽略 */
    }
  }

  const startedAt = Date.now()
  return new Promise(resolve => {
    resolveWait = resolve
    if (cancelRef && typeof cancelRef === 'object') {
      cancelRef.cancel = () => finish(false)
    }

    // t≈0 的重鉴权同步发起，避免 setTimeout(0) 在繁忙主线程上无谓后移；其余时刻保持可配置。
    refreshDelays.forEach(delay => {
      const delayMs = Math.max(Number(delay) || 0, 0)
      if (delayMs === 0) {
        refresh()
        return
      }
      refreshTimers.push(setTimeout(refresh, delayMs))
    })

    const tick = () => {
      if (done) return
      let accelStatus = null
      try {
        accelStatus = getAccelStatusSync()
        syncAccelStatusToStore(store, accelStatus)
      } catch (_) {
        // native 接口不可用：这一轮没有新值，继续等到超时（与 refreshXunyouAccelStatus 同口径）
      }
      if (hasAccelRight(accelStatus)) {
        finish(true)
        return
      }
      if (Date.now() - startedAt >= waitMs) {
        finish(false)
        return
      }
      pollTimer = setTimeout(tick, intervalMs)
    }
    // 先同步读一次：用户在此之前可能已经重鉴权过，权益其实已经到位，没必要白等 200ms
    tick()
  })
}
