/**
 * 福利中心埋点（LZ_benefitsCenter）
 * 业务参数统一走 detail: JSON.stringify(...)，与活动页一致。
 * from / reportFrom → entryType 映射见 mapEntryType。
 */

export const WELFARE_CATEGORY = 'LZ_benefitsCenter'

/** URL from → 埋点表 entryType */
const FROM_TO_ENTRY = {
  gift: 'homeTop',
  shortcut: 'longPress',
  widget: 'widget',
  push: 'push',
  calendar: 'calendar',
  mine: 'my_rewards'
}

export function mapEntryType(from, reportFrom) {
  const f = String(from || '').trim()
  if (FROM_TO_ENTRY[f]) return FROM_TO_ENTRY[f]
  if (String(reportFrom || '').trim() === 'push') return 'push'
  return f || ''
}

export function resolveEntryTypeFromRoute(route) {
  if (!route?.query) return ''
  return mapEntryType(route.query.from, route.query.reportFrom)
}

export function getLid(vm) {
  return (
    vm?.userInfo?.UserID ||
    vm?.$store?.state?.user?.userInfo?.UserID ||
    vm?.channelUserInfo?.UserId ||
    ''
  )
}

/** 今日福利按钮态（埋点表 btnStatus）；按钮「查看」= 已领取 claimed */
export function todayBtnStatus(item) {
  if (!item) return 'claim'
  const status = Number(item.receiveStatus)
  if (status === 1) return 'claimed'
  if (item.soldOut) return 'soldOut'
  if (status === 2) return 'reachedLimit'
  return 'claim'
}

/** 即将开抢按钮态 */
export function upcomingBtnStatus(item) {
  if (!item) return 'remind'
  return item.reserved ? 'reminded' : 'remind'
}

export function benefitsDetail(item, extra = {}, vm) {
  const payload = {
    benefitsID: item?.activityItemId ?? item?.resourceId ?? '',
    benefitsName: item?.name || item?.resourceName || '',
    lid: getLid(vm),
    ...extra
  }
  return JSON.stringify(payload)
}

export function reportWelfare(vm, action, label, params = {}) {
  const report = window.__LZ_DATA_REPORT__
  if (typeof report !== 'function') return
  report(WELFARE_CATEGORY, action, label, params)
}

export function reportWelfarePv(vm, action, params = {}) {
  reportWelfare(vm, action, 'pv', params)
}

export function reportWelfareClick(vm, action, params = {}) {
  reportWelfare(vm, action, 'click', params)
}

export function reportWelfareFail(vm, action, params = {}) {
  reportWelfare(vm, action, 'report', params)
}

/** 推断领取失败 errorType */
export function claimErrorType(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  if (msg.includes('timeout') || msg.includes('超时')) return 'timeout'
  if (
    msg.includes('stock') ||
    msg.includes('库存') ||
    msg.includes('sold') ||
    msg.includes('抢完')
  ) {
    return 'stockOut'
  }
  return 'other'
}

function httpStatusOf(err) {
  const n = Number(err?.httpStatus ?? err?.response?.status ?? err?.status)
  return Number.isFinite(n) ? n : null
}

/** HTTP 200 且业务 code 10000 才算接口成功；对不上 → networkError */
export function isWelfareApiOk(res) {
  if (!res) return false
  const http = httpStatusOf(res)
  if (http != null && http !== 200) return false
  if (res.isAxiosError && !res.response) return false
  const biz = Number(res.code)
  if (res.code != null && Number.isFinite(biz) && biz !== 10000) return false
  if (http == null && !(Number.isFinite(biz) && biz === 10000)) return false
  return (http == null || http === 200) && (!Number.isFinite(biz) || biz === 10000)
}

/**
 * LoadState 只报两种：
 * loadFail：接口已成功但落到页面展示出错
 * networkError：对不上 HTTP 200 + code 10000（含超时、无响应）
 */
export function loadErrorType(err, _empty, displayFail) {
  if (displayFail) return 'loadFail'
  if (isWelfareApiOk(err)) return 'loadFail'
  return 'networkError'
}
