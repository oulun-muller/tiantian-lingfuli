/**
 * 商店SDK能力调用
 * @param {String} action
 * 获取或设置下载和快装路径
 *   NEWPLUGIN_LEAPPTRANS_DOWNLOADANDINSTALLPATH
 * 操作下载任务，获取下载任务列表，暂停、恢复、取消、重试下载任务
 *   NEWPLUGIN_LEAPPTRANS_DOWNLOADCONTROL
 * 判断是否已安装
 *   NEWPLUGIN_LEAPPTRANS_ISSOFTINSTALLEDAPPS
 * 下载并安装
 *   NEWPLUGIN_LEAPPTRANS_UPINSTALLEDAPPS
 * @param {Object} param - action需要的入参
 * @returns {Object} action返回的数据，无返回值通过Promise的状态判断成功与否
 */
export function StoreDoAction(action, param = {}) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    `Store_DoAction_${action}`,
    param
  ).then(res => {
    // const res = { result: [{ code: 9, msg: 'success', succ: true }] }
    // { ipc_error_code: 90001, ipc_error_msg: '009kio' }
    if (!res || res.ipc_error_code) throw JSON.stringify({ code: res.ipc_error_code, message: res.ipc_error_msg })

    return res
  })
}
/**
 * 打开应用程序 杂志
 * @param {String} GameID
 * @param {Number} From   1我的游戏 2游戏中心 给客户端埋点使用
 */
export function GALZRunStoreApp(SoftID, From = 0) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'GA_LAUNCH',
    {
      GameID: SoftID,
      From
    }
  ).catch(() => {})
}
/**
 * 打开应用程序 商店
 * @param {String} exePath 要打开的应用程序绝对路径
 */
export function StoreLZRunStoreApp(exePath) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'Store_LZRunStoreApp',
    exePath
  ).catch(() => {})
}
/**
 * 获取所有驱动器
 * @return {Array}
 * [
 *  {
      'DriveName': 'C:\\', // 驱动器盘符
      'Description': 'Windows-SSD', // 驱动器描述
      'IsIncluded': 1, //  1=已被添加， 0=未被添加系统中
      'IsDefault': 1, //  1=默认驱动器，0=非默认驱动器
      'IsUsed': 1,    //  1=已安装游戏的驱动器，0=未安装游戏的驱动器
      'FreeSpace': 1, // 单位字节 可用空间
      'TotalSpace': 1 // 单位字节 总空间
    }
 * ]
 */
export function GameDriversEnum() {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'GA_Drivers_Enum'
  ).then((res) => {
    return res
  }).catch(() => null)
}

/**
* 新增可用驱动器
* @param {String} DriveName 盘符名称
}
*/
export function GameDriversAdd(DriveName) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'GA_Drivers_Add',
    {
      'DriveName': DriveName
    }
  )
}

/**
 * 切换默认管理器
 * @param {String} DriveName 盘符名称
}
*/
export function GameDriversSwitchDefault(DriveName) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'GA_Drivers_Switch_Default',
    {
      'DriveName': DriveName
    }
  )
}

/**
* 移除管理器
* @param {String} DriveName 盘符名称
}
*/
export function GameDriversDelete(DriveName) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'GA_Drivers_Delete',
    {
      'DriveName': DriveName
    }
  )
}

/**
 * 浏览本地目录
 * @param {String} DriveName 盘符名称
}
*/
export function GameOpenFolder(params) {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'GA_Open_Game_Folder',
    params
  )
}

// 小游戏最近在玩
export function getMiniGameRecentPlay() {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'YYB_GetRecentOpenOrderList',
    {
      size: 5,
      open_type: 2
    }
  ).then(res => {
    return res
  }).catch(() => null)
}
