import { callLegacy, getLegacyUserInfo } from '@/compat/legacyGlobals'

export function isWelfareLoggedIn() {
  return !!getLegacyUserInfo()?.Token
}

/** 未登录则走端侧 LIDLogin（自家确认框 → 系统登录/选账号），不发需要身份的请求 */
export function ensureWelfareLogin() {
  if (isWelfareLoggedIn()) return true
  callLegacy('$login')
  return false
}
