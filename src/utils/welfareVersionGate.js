import { compareVersions } from '@/utils'

/** 福利相关 H5 UI（活动文案、游戏空间入口、横竖屏基础布局调整）要求客户端版本 */
export const WELFARE_H5_MIN_VERSION = '2.0.17'

/**
 * 发版关闭版本闸跳过；本地自测可临时改 true。
 * URL 带 ?welfareVersionGate=1 可强制开启版本判断（跳过关闭时也会走判断）。
 */
export const SKIP_WELFARE_VERSION_GATE = true

function forceGateFromQuery() {
  const search = `${window.location.search || ''}${window.location.hash || ''}`
  return /[?&#]welfareVersionGate=1(?:$|[&#])/i.test(search)
}

/**
 * 当前客户端是否展示本需求相关的 H5 UI（≥ 2.0.17）
 * 含：天天领好礼入口、游戏空间设备入口左右对调、横屏伙伴/畅连下移等。
 * @param {string} [version] store.system.version
 */
export function isWelfareH5UiEnabled(version) {
  if (SKIP_WELFARE_VERSION_GATE && !forceGateFromQuery()) return true
  if (!version) return false
  return compareVersions(String(version), WELFARE_H5_MIN_VERSION)
}

/** 推荐页 Tab 文案：新版本「活动」，旧版本「福利&活动」 */
export function activityTabLabel(version) {
  return isWelfareH5UiEnabled(version) ? '活动' : '福利&活动'
}
