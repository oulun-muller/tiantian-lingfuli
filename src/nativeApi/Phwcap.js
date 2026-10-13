/**
 * 检查网络状态
 * @returns Boolean true：在线，false：离线
 */
export function checkNetworkStatus() {
  return window.LegionZone.nativeCall('Phwcap.dll', 'CheckNetworkStatus').then(res => {
    if (!res || !res.Status) throw new Error('failed')

    return res.Status === 'online'
  }).catch(() => false)
}
