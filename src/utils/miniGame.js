
import { callLegacy, callLegacyAsync, getLegacyLenovoId, getMiniGameDeviceInfo } from '@/compat/legacyGlobals'
/**
 * @description 小游戏打开并创建桌面图标
 */
export async function openMiniGameAndPin(item, index, otherParams = {}) {
  const sceneID = item.softDesc?.runConfigInfo?.resourcePos || otherParams?.resourcePos // this.moduleData.moduleSort + 1
  const cardID = index + 1
  const recommendID = item.softDesc?.runConfigInfo?.recommendId || otherParams?.recommendID || ''
  const rid = item.softDesc?.runConfigInfo?.rid || otherParams?.rid || ''
  const requestInterface = item.softDesc?.runConfigInfo?.requestInterface || otherParams?.requestInterface || ''
  const appID = item.softDesc?.pkgName || otherParams?.appID || ''
  const _parentGetMiniGameDeviceInfo = await getMiniGameDeviceInfo()

  console.log(_parentGetMiniGameDeviceInfo)

  callLegacyAsync('$parentOpenMiniGame', {
    applet_click_report_info: {
      appID,
      appType: 0,
      recommendID,
      sceneID,
      posCard: 0,
      posInCard: cardID,
      cardID: 0,
      request_interface: requestInterface,
      clickType: 200,
      operateTime: Date.now()
    },
    install_mode: 2,
    pullup_type: 3,
    app_install_mode: 0,
    create_shortcut: false,
    create_app_shortcut: false,
    report_info: {
      source_id: sceneID,
      position: cardID,
      alg_rid: rid
    }
  }).then(res => {
    if (res?.ret === 0) {
      callLegacy('$parentCreateMiniGameIcon', {
        gameName: item?.softName || otherParams?.app_name,
        gameIcon: item.showInfo?.logoFile || otherParams?.icon_url || '',
        gameId: item.softId,
        pkgName: item.softDesc?.pkgName || item.pkg_name
      })
    }
    (window.__LZ_DATA_REPORT__)('LZ_minigames', 'LZ_miniGameRealStart', 'click', {
      detail: JSON.stringify({
        skuName: item?.softName || otherParams?.app_name,
        softId: item.softId,
        lenovoid: getLegacyLenovoId(),
        status: res?.ret === 0 ? 1 : 2,
        failCause: res.ret,
        qone32: _parentGetMiniGameDeviceInfo?.qone32,
        qone40: _parentGetMiniGameDeviceInfo?.qone40,
        source_id: sceneID,
        position: cardID,
        alg_rid: rid
      })
    })
  })
}
/**
 * @description 小游戏应用包曝光上报
 */
export const parentExposeMiniGame = (item, key, exposureType, rankID = '', otherParams = {}) => {
  const sourceID = item.softDesc?.runConfigInfo?.resourcePos || otherParams?.sourceID || ''
  const cardID = key + 1
  const recommendID = item.softDesc?.runConfigInfo?.recommendId
  const rid = item.softDesc?.runConfigInfo?.rid
  const requestInterface = item.softDesc?.runConfigInfo?.requestInterface
  callLegacy('$parentExposeMiniGame', {
    body: {
      appList: [{
        appID: item.softDesc?.pkgName || item?.pkg_name,
        exposureType, // 0 曝光 / 1 50% 有效曝光
        appType: item.gameType || 0,
        recommendID: recommendID || '',
        sourceID: sourceID,
        sceneID: rankID || otherParams?.sceneID || 0,
        cardID: cardID || 0,
        posCard: sourceID,
        posInCard: cardID,
        request_interface: requestInterface,
        operateTime: Date.now()
      }]
    },
    report_info: {
      scene_id: rankID || otherParams?.sceneID || 0,
      position: cardID || 0,
      alg_rid: rid || '',
      source_id: sourceID
    }
  })
}

/**
 * @description 小游戏apk应用包打开安装
 */
export const openMiniGameAndPinAndInstall = async(item, index, otherParams = {}) => {
  const sourceID = item?.softDesc?.runConfigInfo?.resourcePos || otherParams?.resourcePos // this.moduleData.moduleSort + 1
  const cardID = index + 1
  //  const recommendID = item.softDesc?.runConfigInfo?.recommendId || otherParams?.recommendID || ''
  const rid = item?.softDesc?.runConfigInfo?.rid || otherParams?.rid || ''
  //  const requestInterface = item.softDesc?.runConfigInfo?.requestInterface || otherParams?.requestInterface || ''
  const appID = item?.softDesc?.pkgName || otherParams?.appID || ''
  const _parentGetMiniGameDeviceInfo = await getMiniGameDeviceInfo()
  const params = {
    pkg_name: appID,
    install_mode: 2,
    pullup_type: 3,
    app_install_mode: 0,
    create_app_shortcut: false,
    report_info: {
      source_id: sourceID,
      position: cardID,
      scene_id: otherParams?.ruleCodeMapping,
      alg_rid: rid,
      game_type: 1
    }
  }
  console.log(4444444, params)
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'YYB_LaunchApp',
    params
  ).then(res => {
    (window.__LZ_DATA_REPORT__)('LZ_minigames', 'LZ_miniGameRealStart', 'click', {
      detail: JSON.stringify({
        skuName: item?.softName || otherParams?.app_name,
        softID: item.softId,
        lenovoid: getLegacyLenovoId(),
        status: res?.ret === 0 ? 1 : 2,
        failCause: res.ret,
        gametype: 1,
        qone32: _parentGetMiniGameDeviceInfo?.qone32,
        qone40: _parentGetMiniGameDeviceInfo?.qone40,
        source_id: sourceID,
        position: cardID,
        alg_rid: rid
      })
    })
    return res
  }).catch(() => null)
}

/**
 * @description 取消下载安装
 */
export const cancelDownloadInstall = async(pkgName) => {
  console.log(55555, 5555555, pkgName)
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'YYB_Stop',
    {
      pkg_name: pkgName
    }
  ).then(res => {
    return res
  }).catch(() => null)
}

/**
 * @description 查看已安装apk游戏列表
 */
export const getInstalledMiniGameList = async() => {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'YYB_GetInstalledApps',
    {}
  ).then(res => {
    return res
  }).catch(() => null)
}
/**
 * @description 查看已安装apk游戏详细信息列表
 */
export const getInstalledMiniGameDetail = async() => {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'YYB_GetInstalledAppInfos',
    {}
  ).then(res => {
    return res
  }).catch(() => null)
}
/**
 * @description 卸载已经安装的游戏应用包
 */
export const uninstallMiniGame = async(pkgName) => {
  return window.LegionZone.nativeCall(
    'LZProxy.dll',
    'YYB_UninstallApp',
    {
      pkg_name: pkgName
    }
  ).then(res => {
    return res
  }).catch(() => null)
}

/**
 * @description 应用宝硬性环境监测
 */
export const checkMiniGameEnv = async() => {
  return window.LegionZone?.nativeCall(
    'LZProxy.dll',
    'YYB_CheckEnvironment',
    {}
  ).then(res => {
    return res
  }).catch(() => {
    return null
  })
}
