import { rsaEncrypt } from './rsaEncrypt'
import { getLegacyStore } from '@/compat/legacyGlobals'

// deviceNo 系列接口身份参数。
//
// deviceNo 来源（客户端传给 H5）：
// - 移动端：Android 客户端 getSystemInfo 桥返回的 sn 字段即 OAID（手机）/序列号（平板）
// - 桌面端：system.uuid 为设备标识，system.MTMInfo.MachineName 为主机名

let _cachedOaid = ''
let _isMobileClient = false
const SYSTEM_INFO_TIMEOUT_MS = 100

function getStore() {
  return window._onlineStore || getLegacyStore()
}

async function ensureOaid() {
  if (_cachedOaid) return _cachedOaid
  if (!window.LegionZoneMobile || !window.LegionZoneMobile.nativeCall) return ''
  try {
    const base64Response = await Promise.race([
      window.LegionZoneMobile.nativeCall('LegionZone', 'getSystemInfo', null),
      new Promise(resolve => setTimeout(resolve, SYSTEM_INFO_TIMEOUT_MS, ''))
    ])
    if (!base64Response) return ''
    const bytes = Uint8Array.from(atob(base64Response), function(c) { return c.charCodeAt(0) })
    const info = JSON.parse(new TextDecoder('utf-8').decode(bytes))
    if (!info || !info.sn) return ''
    _isMobileClient = true
    const store = getStore()
    if (store && store.state) {
      const system = store.state.system || {}
      system.MTMInfo = Object.assign({}, system.MTMInfo, {
        MachineName: info.sn,
        ReadableMachineName: system.MTMInfo.ReadableMachineName || info.legionModel || ''
      })
      if (!system.mac && info.mac) system.mac = info.mac
      if (!system.Channel && info.Channel) system.Channel = info.Channel
      if (!system.version && info.version) system.version = info.version
    }
    _cachedOaid = info.sn
    return _cachedOaid
  } catch (e) {
    return ''
  }
}

// 移动端返回 OAID；非移动端（或桥不可用）返回空，由调用方兜底 store 中的 uuid
export async function getDeviceNo() {
  const oaid = await ensureOaid()
  if (oaid) return oaid
  const store = getStore()
  const system = (store && store.state && store.state.system) || {}
  const mtm = system.MTMInfo || {}
  if (mtm.MachineName && !system.uuid) return mtm.MachineName
  return system.uuid || ''
}

export async function buildIdentityParams() {
  const store = getStore()
  const system = (store && store.state && store.state.system) || {}
  const userInfo = ((store && store.state && store.state.user) || {}).userInfo
  const mtm = system.MTMInfo || {}
  const params = {}
  const deviceNo = await getDeviceNo()
  if (deviceNo) params.deviceNo = rsaEncrypt(deviceNo)
  if (userInfo && userInfo.UserID) params.lenovoid = rsaEncrypt(userInfo.UserID)
  // sn 参数仅桌面端有意义（主机名）；移动端 MachineName 实为 OAID，已作为 deviceNo，避免重复
  if (!_isMobileClient && mtm.MachineName && system.uuid) {
    params.sn = rsaEncrypt(mtm.MachineName)
  }
  return params
}
