/**
 * llk 跳转 wx
 * @returns
 */
export function openThirdApp(url = '') {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'openThirdApp', {
    url
  })
}
/**
 * llk 获取是否支持 wx 跳转 ？？？
 */
export function getSupportThirdApp() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'isSupportThirdApp', {
    app: 'wx'
  }).then(res => {
    console.log('isSupportThirdApp res', res)
    return res
  })
}

/**
 * 跳转外部浏览器打开 url
 */
export function openExternalUrl(url = '') {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'openExternalUrl', {
    url
  })
}

// 检查第三方应用是否安装
export function checkThirdAppInstalled(pkgNameList = []) {
  return window.LegionZoneMobile.nativeCall(
    'LegionZone',
    'GETINSTALL',
    { pkgNameList }
  ).then(res => {
    if (typeof res !== 'string') return res
    try {
      return JSON.parse(res)
    } catch (e) {
      return []
    }
  })
}

/**
 * 跳转客户端原生页面
 */
export function openNativePage(pageName) {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'toNativePage', {
    pageName
  })
}

/**
 * 是否展示消息通知
 */
export function getNotifyToastShow() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'isShowToast')
}
export function openNotifySetting() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'goToastSetting')
}

export function closeNotifyToast() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'closeShowToast')
}

export function getRecentGameList() {
  // const formatGmaeData = (list) => {
  //   // 格式化数据，兼容 GameDownloadButton 组件
  //   const _list = JSON.parse(JSON.stringify(list))
  //   return _list.map(_ => {
  //     return Object.assign(_, {
  //       softId: _.softId || '',
  //       softName: _.appName,
  //       maxSeconds: _.maxSeconds || 0,
  //       gameSeconds: _.gameSeconds || 0,
  //       hlSoftName: null,
  //       showInfo: {
  //         vimg: '',
  //         himg: '',
  //         score: '',
  //         softLabels: [],
  //         hlSoftLabels: null,
  //         labelName: null,
  //         ruleLabelName: null,
  //         top: false,
  //         logoFile: _.imageUrl || '',
  //         isFastInstall: false,
  //         installFileSize: '',
  //         mediaScores: null,
  //         awardInfos: null,
  //         rankingLabelInfos: [],
  //         hotNum: 0,
  //         playersNum: 0,
  //         img354x285: '',
  //         img162x285: ''
  //       },
  //       productInfo: {
  //         userPurchasedStatus: 0
  //       },
  //       skuId: '0',
  //       currentTimeActivity: null,
  //       softPurpose: 2,
  //       downloadInfo: {
  //         downloadCount: '',
  //         pcStoreParam: '',
  //         webStoreUrl: '',
  //         tagUrls: [],
  //         bizType: 0,
  //         expectedReleaseTime: null,
  //         reservationCount: 0,
  //         testActivityStatus: null,
  //         testActivityName: null,
  //         testActivityId: null,
  //         testActivityQuestionUrl: null,
  //         userTestApplyStatus: null,
  //         userReservationStatus: null,
  //         installSize: null
  //       },
  //       softDesc: {
  //         captureFileList: [],
  //         videoUrl: '',
  //         videoCoverImg: [],
  //         supportPlatform: [],
  //         whatsNew: null,
  //         supportOsBit: [],
  //         introduction: '',
  //         followerCount: 0,
  //         pkgName: _.packageName || '',
  //         runConfigInfo: null,
  //         isAd: null,
  //         version: _.versionCode || '',
  //         versionCode: _.versionCode || ''
  //       },
  //       firstClassId: 0,
  //       status: true,
  //       rankingListLabelImg: null,
  //       sort: 0,
  //       resizeTimer: null
  //     })
  //   })
  // }
  // return new Promise((resolve, reject) => {
  //   const demo = [{
  //     isNeedUpdate: true,
  //     isInstalled: true,
  //     packageName: '111',
  //     versionCode: '1',
  //     appName: '炉石传说',
  //     iconUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     maxSeconds: 0,
  //     softId: '111',
  //     imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     downloadInfo: {
  //       downloadCount: '',
  //       pcStoreParam: '',
  //       webStoreUrl: '',
  //       tagUrls: [],
  //       bizType: 0,
  //       expectedReleaseTime: null,
  //       reservationCount: 0,
  //       testActivityStatus: null,
  //       testActivityName: null,
  //       testActivityId: null,
  //       testActivityQuestionUrl: null,
  //       userTestApplyStatus: null,
  //       userReservationStatus: null,
  //       installSize: null
  //     }
  //   },
  //   {
  //     isNeedUpdate: true,
  //     isInstalled: true,
  //     packageName: '111',
  //     versionCode: '1',
  //     appName: '炉石传说',
  //     iconUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     maxSeconds: 0,
  //     softId: '1221',
  //     imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     downloadInfo: {
  //       downloadCount: '',
  //       pcStoreParam: '',
  //       webStoreUrl: '',
  //       tagUrls: [],
  //       bizType: 0,
  //       expectedReleaseTime: null,
  //       reservationCount: 0,
  //       testActivityStatus: null,
  //       testActivityName: null,
  //       testActivityId: null,
  //       testActivityQuestionUrl: null,
  //       userTestApplyStatus: null,
  //       userReservationStatus: null,
  //       installSize: null
  //     }
  //   }]
  //   resolve(JSON.stringify(formatGmaeData(demo)))
  // })
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getRecentGameList')
}

export function navigatorMyGame() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorMyGame')
}

export function getLocalGameList() {
  // const formatGmaeData = (list) => {
  //   // 格式化数据，兼容 GameDownloadButton 组件
  //   const _list = JSON.parse(JSON.stringify(list))
  //   return _list.map(_ => {
  //     return Object.assign(_, {
  //       softId: _.softId || '',
  //       softName: _.appName,
  //       maxSeconds: _.maxSeconds || 0,
  //       gameSeconds: _.gameSeconds || 0,
  //       hlSoftName: null,
  //       showInfo: {
  //         vimg: '',
  //         himg: '',
  //         score: '',
  //         softLabels: [],
  //         hlSoftLabels: null,
  //         labelName: null,
  //         ruleLabelName: null,
  //         top: false,
  //         logoFile: _.imageUrl || '',
  //         isFastInstall: false,
  //         installFileSize: '',
  //         mediaScores: null,
  //         awardInfos: null,
  //         rankingLabelInfos: [],
  //         hotNum: 0,
  //         playersNum: 0,
  //         img354x285: '',
  //         img162x285: ''
  //       },
  //       productInfo: {
  //         userPurchasedStatus: 0
  //       },
  //       skuId: '0',
  //       currentTimeActivity: null,
  //       softPurpose: 2,
  //       downloadInfo: {
  //         downloadCount: '',
  //         pcStoreParam: '',
  //         webStoreUrl: '',
  //         tagUrls: [],
  //         bizType: 0,
  //         expectedReleaseTime: null,
  //         reservationCount: 0,
  //         testActivityStatus: null,
  //         testActivityName: null,
  //         testActivityId: null,
  //         testActivityQuestionUrl: null,
  //         userTestApplyStatus: null,
  //         userReservationStatus: null,
  //         installSize: null
  //       },
  //       softDesc: {
  //         captureFileList: [],
  //         videoUrl: '',
  //         videoCoverImg: [],
  //         supportPlatform: [],
  //         whatsNew: null,
  //         supportOsBit: [],
  //         introduction: '',
  //         followerCount: 0,
  //         pkgName: _.packageName || '',
  //         runConfigInfo: null,
  //         isAd: null,
  //         version: _.versionCode || '',
  //         versionCode: _.versionCode || ''
  //       },
  //       firstClassId: 0,
  //       status: true,
  //       rankingListLabelImg: null,
  //       sort: 0,
  //       resizeTimer: null
  //     })
  //   })
  // }
  // return new Promise((resolve, reject) => {
  //   const demo = [{
  //     isNeedUpdate: true,
  //     isInstalled: true,
  //     packageName: '111',
  //     versionCode: '1',
  //     appName: '炉石传说',
  //     iconUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     maxSeconds: 0,
  //     softId: '111',
  //     imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     downloadInfo: {
  //       downloadCount: '',
  //       pcStoreParam: '',
  //       webStoreUrl: '',
  //       tagUrls: [],
  //       bizType: 0,
  //       expectedReleaseTime: null,
  //       reservationCount: 0,
  //       testActivityStatus: null,
  //       testActivityName: null,
  //       testActivityId: null,
  //       testActivityQuestionUrl: null,
  //       userTestApplyStatus: null,
  //       userReservationStatus: null,
  //       installSize: null
  //     }
  //   },
  //   {
  //     isNeedUpdate: true,
  //     isInstalled: true,
  //     packageName: '111',
  //     versionCode: '1',
  //     appName: '炉石传说',
  //     iconUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     maxSeconds: 0,
  //     softId: '1221',
  //     imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     downloadInfo: {
  //       downloadCount: '',
  //       pcStoreParam: '',
  //       webStoreUrl: '',
  //       tagUrls: [],
  //       bizType: 0,
  //       expectedReleaseTime: null,
  //       reservationCount: 0,
  //       testActivityStatus: null,
  //       testActivityName: null,
  //       testActivityId: null,
  //       testActivityQuestionUrl: null,
  //       userTestApplyStatus: null,
  //       userReservationStatus: null,
  //       installSize: null
  //     }
  //   }]
  //   resolve(JSON.stringify(formatGmaeData(demo)))
  // })
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getLocalGameList')
}

// 获取本机游戏总时长
export function getTotalLocklTime() {
  return window.LegionZoneMobile.nativeCall('LegionZone', 'getNetTotalTime')
}

export function getPlayedGameList() {
  // const formatGmaeData = (list) => {
  //   // 格式化数据，兼容 GameDownloadButton 组件
  //   const _list = JSON.parse(JSON.stringify(list))
  //   return _list.map(_ => {
  //     return Object.assign(_, {
  //       softId: _.softId || '',
  //       softName: _.appName,
  //       maxSeconds: _.maxSeconds || 0,
  //       gameSeconds: _.gameSeconds || 0,
  //       hlSoftName: null,
  //       showInfo: {
  //         vimg: '',
  //         himg: '',
  //         score: '',
  //         softLabels: [],
  //         hlSoftLabels: null,
  //         labelName: null,
  //         ruleLabelName: null,
  //         top: false,
  //         logoFile: _.imageUrl || '',
  //         isFastInstall: false,
  //         installFileSize: '',
  //         mediaScores: null,
  //         awardInfos: null,
  //         rankingLabelInfos: [],
  //         hotNum: 0,
  //         playersNum: 0,
  //         img354x285: '',
  //         img162x285: ''
  //       },
  //       productInfo: {
  //         userPurchasedStatus: 0
  //       },
  //       skuId: '0',
  //       currentTimeActivity: null,
  //       softPurpose: 2,
  //       downloadInfo: {
  //         downloadCount: '',
  //         pcStoreParam: '',
  //         webStoreUrl: '',
  //         tagUrls: [],
  //         bizType: 0,
  //         expectedReleaseTime: null,
  //         reservationCount: 0,
  //         testActivityStatus: null,
  //         testActivityName: null,
  //         testActivityId: null,
  //         testActivityQuestionUrl: null,
  //         userTestApplyStatus: null,
  //         userReservationStatus: null,
  //         installSize: null
  //       },
  //       softDesc: {
  //         captureFileList: [],
  //         videoUrl: '',
  //         videoCoverImg: [],
  //         supportPlatform: [],
  //         whatsNew: null,
  //         supportOsBit: [],
  //         introduction: '',
  //         followerCount: 0,
  //         pkgName: _.packageName || '',
  //         runConfigInfo: null,
  //         isAd: null,
  //         version: _.versionCode || '',
  //         versionCode: _.versionCode || ''
  //       },
  //       firstClassId: 0,
  //       status: true,
  //       rankingListLabelImg: null,
  //       sort: 0,
  //       resizeTimer: null
  //     })
  //   })
  // }
  // return new Promise((resolve, reject) => {
  //   const demo = [{
  //     isNeedUpdate: true,
  //     isInstalled: true,
  //     packageName: '111',
  //     versionCode: '1',
  //     appName: '炉石传说',
  //     iconUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     maxSeconds: 0,
  //     softId: '111',
  //     imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     downloadInfo: {
  //       downloadCount: '',
  //       pcStoreParam: '',
  //       webStoreUrl: '',
  //       tagUrls: [],
  //       bizType: 0,
  //       expectedReleaseTime: null,
  //       reservationCount: 0,
  //       testActivityStatus: null,
  //       testActivityName: null,
  //       testActivityId: null,
  //       testActivityQuestionUrl: null,
  //       userTestApplyStatus: null,
  //       userReservationStatus: null,
  //       installSize: null
  //     }
  //   },
  //   {
  //     isNeedUpdate: true,
  //     isInstalled: true,
  //     packageName: '111',
  //     versionCode: '1',
  //     appName: '炉石传说',
  //     iconUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     maxSeconds: 0,
  //     softId: '1221',
  //     imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
  //     downloadInfo: {
  //       downloadCount: '',
  //       pcStoreParam: '',
  //       webStoreUrl: '',
  //       tagUrls: [],
  //       bizType: 0,
  //       expectedReleaseTime: null,
  //       reservationCount: 0,
  //       testActivityStatus: null,
  //       testActivityName: null,
  //       testActivityId: null,
  //       testActivityQuestionUrl: null,
  //       userTestApplyStatus: null,
  //       userReservationStatus: null,
  //       installSize: null
  //     }
  //   }]
  //   resolve(JSON.stringify(formatGmaeData(demo)))
  // })

  return window.LegionZoneMobile.nativeCall('LegionZone', 'getPlayedGameList')
}
