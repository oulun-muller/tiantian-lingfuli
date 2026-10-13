import { callLegacy, getLegacyUserInfo } from '@/compat/legacyGlobals'
import { getUserInfo } from './messageHelper'

export function checkAuth(fromChannel) {
  const channelUserInfo = getLegacyUserInfo(true)
  const userInfo = getLegacyUserInfo()

  if (fromChannel) {
    if (!channelUserInfo?.Token) {
      getUserInfo({
        showLoginPop: true,
        fromChannel: true
      })
      return false
    }
  } else if (!userInfo) {
    callLegacy('$login')
    return false
  }
  return true
}
