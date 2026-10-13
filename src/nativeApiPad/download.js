// 下载通用接口
export function StoreDoAction(action, param = {}) {
  return window.LegionZoneMobile.nativeCall(
    'LegionZone',
    action,
    param
  ).then(res => {
    // if (!res || res.ipc_error_code) throw JSON.stringify({ code: res.ipc_error_code, message: res.ipc_error_msg })
    let result
    try {
      result = JSON.parse(res)
      return result
    } catch (e) {
      console.log('StoreDoAction error', e)
      return null
    }
  })
}

/**
 * 打开应用程序 商店
 * @param {String} exePath 要打开的应用程序绝对路径
 */
export function StoreLZRunStoreApp(packageName) {
  return window.LegionZoneMobile.nativeCall(
    'LegionZone',
    'Store_LZRunStoreApp',
    { packageName }
  ).catch(() => {})
}

/**
 * 迅游加速启动游戏：用迅游加速服务加速该游戏。
 * 调用前 H5 已判过登录态与加速权益（GameCarousel.handleAccelStart），
 * 但游戏是否被迅游 SDK 支持仍由原生侧判定，故此处不判支持。
 * SDK 未就绪等异常情况原生侧静默失败。
 *
 * autoLaunch 决定「VPN 建立后是否由原生自动拉起游戏」：
 * - true（缺省值，不透传时原生也按 true 处理）：VPN 建立后原生立刻拉起游戏，兼容旧 H5；
 * - false：原生只完成加速、不拉起游戏，改由 H5 在过渡动画播完（覆盖层 finished 事件）时
 *   自行调 StoreLZRunStoreApp 拉起。VPN 建立与动画是并行的，若仍让原生拉起，VPN 建得快时
 *   游戏会盖在 2.35s 的过渡动画上，动画一闪而过（真机实测）。
 * @param {String} packageName 游戏包名
 * @param {String} appName 游戏名（埋点用）
 * @param {Boolean} autoLaunch 是否由原生自动拉起游戏，缺省 true
 */
export function accelerateStart(packageName, appName, autoLaunch = true) {
  // 迅游相关 H5 日志统一前缀 [XunyouAccel]，便于 devtools console 过滤，与安卓侧 logcat tag 对齐
  console.log('[XunyouAccel] H5 accelerateStart -> native', { packageName, appName, autoLaunch })
  return window.LegionZoneMobile.nativeCall(
    'LegionZone',
    'Xunyou_accelerateStart',
    { packageName, appName: appName || '', autoLaunch }
  ).then(res => {
    console.log('[XunyouAccel] H5 accelerateStart <- native result', res)
    return res
  }).catch(err => {
    console.warn('[XunyouAccel] H5 accelerateStart nativeCall rejected', err)
  })
}

/**
 * 取加速中游戏的区服信息（卡片加速信息面板用）。
 *
 * 返回 { available, areaList: string[], serverName, isForeign }；原生只透传迅游文档里的字段，
 * 不做任何解析（「没有区服时显示国服」「滚轮里补一个代表没有区服的国服项」等判定全在 H5）。
 * 没有正在加速的游戏、或原生拿不到 GameInformation 时 available 为 false。
 * 原生接口不可用（桌面 mock）或调用失败返回 null。
 * 返回 null/无数据时区服入口**仍然显示**（常显），只是 areaList 为空 → 点击走「暂无可切换区服」提示。
 */
export function getAccelAreaInfo() {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve(null)
  return window.LegionZoneMobile.nativeCall('LegionZone', 'Xunyou_getAccelAreaInfo', null)
    .then(res => {
      const data = typeof res === 'string' ? JSON.parse(res) : res
      console.log('[XunyouAccel] H5 getAccelAreaInfo <- native result', data)
      return data && data.available ? data : null
    })
    .catch(err => {
      console.warn('[XunyouAccel] H5 getAccelAreaInfo nativeCall rejected', err)
      return null
    })
}

/**
 * 停止迅游加速（关闭 VPN）。确认弹窗在 H5 侧完成，原生不弹框，本接口只负责执行停止。
 *
 * 返回解析后的 { success, stopped }；接口不可用（桌面 mock）或调用失败返回 null，调用方按失败处理。
 * 停止后的状态回流（accel_state {established:false}，卡片恢复「加速启动」、加速信息面板消失、计时停止）
 * 由原生侧保证，H5 **不要**乐观清本地状态。
 */
export function stopAccel() {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve(null)
  console.log('[XunyouAccel] H5 stopAccel -> native')
  return window.LegionZoneMobile.nativeCall('LegionZone', 'Xunyou_stopAccel', null)
    .then(res => {
      // 与 getAccelAreaInfo 同样的容错：nativeCall 的结果可能是 JSON 字符串、也可能已经是对象；
      // JSON.parse 抛错会被下面的 catch 兜住，按失败（null）返回。
      const data = typeof res === 'string' ? JSON.parse(res) : res
      console.log('[XunyouAccel] H5 stopAccel <- native result', data)
      return data
    })
    .catch(err => {
      console.warn('[XunyouAccel] H5 stopAccel nativeCall rejected', err)
      return null
    })
}

/**
 * 切换加速中游戏的区服：切断当前加速，按指定区服重新建立加速隧道。
 *
 * 为什么不是「在线改字段」：区服要在 openVPN 重建隧道时才生效，光改 selectArea 不重建隧道新节点不会生效；
 * 而 SDK 又没有 clearSelectArea 之类的接口，所以切到别的区服、以及切回「没有区服」都只能把这次加速整个重来。
 * 时序由原生一体化保证（VPN 关闭未完成就重新加速会失败），调用方不要自己编排 stopAccel + accelerateStart。
 *
 * @param {String} area 区服名字符串（必须来自 getAccelAreaInfo 的 areaList）；传空串表示**不带区服**，
 *   即滚轮里那个代表「没有区服」的「国服」项。
 * 返回解析后的 { success }；失败（SDK 未就绪 / 当前没有加速中的游戏 / 区服名非法 / 桥接不可用）返回 null
 * 或 success=false。**成功与否都不要在这里重拉区服信息**：重连会走 established=false → true，
 * GameCarousel 的加速状态 watch 会在重新建立后自动拉一次。
 */
export function restartAccel(area = '') {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve(null)
  console.log('[XunyouAccel] H5 restartAccel -> native', { area })
  return window.LegionZoneMobile.nativeCall('LegionZone', 'Xunyou_restartAccel', { area })
    .then(res => {
      const data = typeof res === 'string' ? JSON.parse(res) : res
      console.log('[XunyouAccel] H5 restartAccel <- native result', data)
      return data
    })
    .catch(err => {
      console.warn('[XunyouAccel] H5 restartAccel nativeCall rejected', err)
      return null
    })
}

/**
 * 请原生收起/恢复底部导航栏（加速信息等全屏抽屉打开时隐藏、关闭时恢复）。
 *
 * 底部导航是安卓原生的 View，WebView 画不到它上面，只能反过来请原生收起。
 * 原生接口不可用时静默忽略（桌面 mock、PC 端没有该导航栏）。
 */
export function setBottomNavVisible(visible) {
  if (!window.LegionZoneMobile?.nativeCall) return Promise.resolve(false)
  console.log('[XunyouAccel] H5 setBottomNavVisible -> native', { visible: !!visible })
  return window.LegionZoneMobile.nativeCall('LegionZone', 'setBottomNavVisible', { visible: !!visible })
    .then(res => {
      const data = typeof res === 'string' ? JSON.parse(res) : res
      return !!(data && data.success)
    })
    .catch(err => {
      console.warn('[XunyouAccel] H5 setBottomNavVisible nativeCall rejected', err)
      return false
    })
}


