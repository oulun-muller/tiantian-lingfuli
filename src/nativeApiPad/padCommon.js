/**
 * 登录接口
 */
export function nativeLogin() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'LIDLogin', null).then(res => {
    return res
  })
}
/**
 * 数据打点
 * @param {*} Category
 * @param {*} Action
 * @param {*} Label
 * @param {*} params
 * @returns
 */
export function DataReport(Category, Action, Label, params = {}) {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'trackEvent', {
    Category,
    Action,
    Label,
    params
  }).catch(() => {})
}
/**
 * 获取系统信息
 * @returns
 */
export function getSystemInfo() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getSystemInfo', null)
    .then(res => {
      // console.log('getSystemInfo res', res)
      return res
    })
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getUserInfo', null)
    .then(res => {
      // console.log('getUserInfo res', res)
      return res
    })
}
