// 查询首页数据
import signRequest from '@/utils/signRequest.js'
import request from '@/utils/request'
import { getConfigByKey } from '@/api'
import { callLegacyAsync, getLegacyStore, getLegacyStoreState } from '@/compat/legacyGlobals'
import { convertCDKInfo } from '@/api/common.js'

function getGameDownloadStateMap() {
  return getLegacyStoreState('gameDownloadState.stateMap', {})
}

function setGameDownloadState(key, payload) {
  const store = getLegacyStore()
  return store?.dispatch?.('gameDownloadState/setState', {
    [key]: payload
  })
}
/**
 * 获取首页广告弹框
 */
export function getHomePagepopUp(data) {
  try {
    return signRequest({
      url: '/cloud-legionzone-game-activity-start/api/v1/homepagepopup',
      method: 'GET',
      params: data
    }).then(res => {
      if (!res || res.code !== 10000 || !res.data) throw new Error('getHomePagepopUp failed')

      return res.data
    }).catch(() => null)
  } catch {
    return Promise.resolve(null)
  }
}
export function getGCHomeData(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softmodule/search',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('获取游戏中心接口失败，请稍后重试！')

    if (!res.data.records || res.data.records.length <= 0) {
      throw new Error('获取游戏中心配置页面数据失败，请稍后重试！')
    }
    res.data.records.forEach(module => {
      if (!module.rankingLists || module.rankingLists.length <= 0) return
      module.rankingLists = module.rankingLists.filter(o =>
        (o.fillType === 1 && o.rankingListSofts && o.rankingListSofts.length) ||
        (o.fillType === 2 && o.rankingListPositions && o.rankingListPositions.length) ||
        (o.fillType === 3 && o.rankingCharts && o.rankingCharts.length >= 3) ||
        (o.fillType === 4 && o.rankingListSoftCalendars && o.rankingListSoftCalendars.length) ||
        (o.fillType === 5 && o.userReviews && o.userReviews.length) ||
        (o.fillType === 6 && o.miniGames && o.miniGames.length) ||
        (o.fillType === 9)
      )

      module.rankingLists.forEach((o, index) => {
        o._id = `${o.id}_${index}`
        o.rankingListSofts = o.rankingListSofts && o.rankingListSofts.map(convertCDKInfo)
        o.rankingListPositions && o.rankingListPositions.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
        o.rankingCharts && o.rankingCharts.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
        o.rankingListSoftCalendars && o.rankingListSoftCalendars.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
        o.userReviews && o.userReviews.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
      })
    })
    res.data.records = res.data.records.filter(o => o.rankingLists && o.rankingLists.length)
    res.data.records.sort((a, b) => a.moduleSort - b.moduleSort)

    // if (res.data.records.length <= 0) {
    //   throw new Error('游戏中心暂无配置榜单数据，请稍后重试！')
    // }
    res.data.currentTime = res.data.currentTime || Date.now()
    return res.data
  })
}

export function getGCRankListData(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/rankingcharts',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('获取榜单数据失败，请稍后重试！')
    res.data = res.data.filter(item => item.rankingCharts && item.rankingCharts.length)
    res.data.forEach((o, index) => {
      o._id = `${o.id}_${index}`
      o.rankingCharts && o.rankingCharts.forEach(item => {
        item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
      })
    })
    return res.data
  })
}
/**
 * 是否显示游戏工具
 * @returns {Boolean} ""
 */
export function getGameToolsTab() {
  const cache = JSON.parse(sessionStorage.getItem('SHOW_GAME_TOOLS_TAB'))
  if (cache || cache === false) return Promise.resolve(cache)

  return getConfigByKey('SHOW_GAME_TOOLS_TAB').then(res => {
    sessionStorage.setItem('SHOW_GAME_TOOLS_TAB', JSON.stringify(res === '1'))

    return res === '1'
  }).catch(() => false)
}
/**
 * 是否显示legion play
 * @returns {Boolean} ""
 */
export function getGameTab() {
  try {
    const cache = sessionStorage.getItem('GAME_CENTER_TAB_SHOW')
    if (cache) return Promise.resolve(JSON.parse(cache))

    return getConfigByKey('GAME_CENTER_TAB_SHOW').then(res => {
      sessionStorage.setItem('GAME_CENTER_TAB_SHOW', res)
      return JSON.parse(res)
    }).catch(() => null)
  } catch (e) {
    return Promise.resolve(null)
  }
}

/**
 * 游戏工具列表
 * @returns {Object}
 */
export function getSelectTagList(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softmodule',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) return []

    if (!res.data.homePageModules || res.data.homePageModules.length <= 0) {
      return []
    }

    if (!res.data.homePageModules[0].rankingLists || res.data.homePageModules[0].rankingLists.length <= 0) {
      return []
    }

    if (!res.data.homePageModules[0].rankingLists[0].id) {
      return []
    }

    res.data.homePageModules = res.data.homePageModules.filter(o => o.moduleStyle === 13)
    res.data.homePageModules.sort((a, b) => a.moduleSort - b.moduleSort)

    res.data.homePageModules.forEach(module => {
      module.rankingLists.forEach(o => {
        if (o.rankingListSofts && o.rankingListSofts.length) {
          o.rankingListSofts = o.rankingListSofts.map(convertCDKInfo)
        }
      })
    })

    return res.data.homePageModules
  })
}

// 玩过的游戏
export function fetchGameList(data) {
  return signRequest({
    url: '/cloud-legionzone-mobile-game-core/api/v1/gameList',
    method: 'POST',
    data
  })
}

// 获取游戏数据
export function totalAndRank(data) {
  return signRequest({
    url: '/cloud-legionzone-mobile-game-core/api/v1/totalAndRank',
    method: 'POST',
    data
  })
}

// 获取关注列表
export function concernList(params) {
  const url = `/cloud-legionzone-game-activity-start/api/v1/softwishlist`
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
  //   resolve({ records: formatGmaeData(demo) })
  // })

  // const url = `/cloud-legionzone-game-activity-start/api/v1/softwishlist`

  return signRequest({
    url: url,
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('concernList failed')

    res.data.records = (res.data.records || []).map(convertCDKInfo)

    return res.data
  })
}

// 获取是否已经关注
export function getFollowers(params) {
  const _stateInfo = getGameDownloadStateMap()[params.softId] || {}
  if (typeof _stateInfo.isFollower === 'boolean') {
    return Promise.resolve(_stateInfo.isFollower)
  }

  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softwishlist/exist',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getFollowers failed')

    const stateInfoNew = getGameDownloadStateMap()[params.softId] || {}
    setGameDownloadState(params.softId, {
      ...stateInfoNew,
      isFollower: res.data
    })
    return res.data
  }).catch(() => false)
}

// 关注
export function followers(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softwishlist',
    method: 'POST',
    data
  })
}

// 取消关注
export function unFollowers(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softwishlist',
    method: 'DELETE',
    data
  })
}

export async function toFollowers(softId, isFollower) {
  return new Promise((resolve, reject) => {
    if (!softId || typeof isFollower !== 'boolean' || typeof softId !== 'string') {
      reject({
        data: null,
        message: '参数错误!'
      })
      return
    }

    const _stateInfo = getGameDownloadStateMap()[softId] || {}
    const isPhoneDevice = (window.__LZ_IS_PHONE_DEVICE__) || false
    try {
      if (isFollower) {
        const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
        if (!CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
          (window.__LZ_DATA_REPORT__)('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupShow', 'pv')
          callLegacyAsync('$lzconfirm', {
            layout: 1,
            type: 'warning',
            title: '提示',
            message: '确认取消关注此游戏吗 ？',
            subMessage: '取消关注后您将无法再收到此游戏的折扣、活动提醒',
            showCancelButton: isPhoneDevice,
            rememberKey: 'CANCEL_APPOINTMENTS_AND_FOLLOWERS'
          }).then(() => {
            unFollowers({ softId }).then(() => {
              resolve({
                data: !isFollower,
                message: 'Success'
              })
              setGameDownloadState(softId, {
                ..._stateInfo,
                isFollower: false
              })
            }).catch((err) => {
              reject({
                data: null,
                message: err
              })
            })
          }).catch((type) => {
            reject({
              data: null,
              type: type
            })
          })
        } else {
          unFollowers({ softId }).then(() => {
            resolve({
              data: !isFollower,
              message: 'Success'
            })
            setGameDownloadState(softId, {
              ..._stateInfo,
              isFollower: false
            })
          }).catch((err) => {
            reject({
              data: null,
              message: err
            })
          })
        }
      } else {
        followers({ softId }).then(() => {
          resolve({
            data: !isFollower,
            message: 'Success'
          })
          setGameDownloadState(softId, {
            ..._stateInfo,
            isFollower: true
          })
        }).catch((err) => {
          reject({
            data: null,
            message: err
          })
        })
      }
    } catch (err) {
      reject({
        data: null,
        message: err
      })
    }
  })
}

/**
 * 获取游戏杂志详情数据
 * @returns
 */
export function getGCMagazineData() {
  return signRequest({
    url: '/cloud-legionzone-game-core/api/v2/legionproduct',
    method: 'POST',
    data: {
      productType: 4,
      productFirstType: 2,
      status: 1
    }
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getGCMagazineData failed')

    return res.data
  }).catch(() => null)
}

/**
 * 根据游戏ids获取游戏详情
 * @returns
 */
export function getGCMagazineGameList({ softIds }) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/soft/list',
    method: 'GET',
    params: {
      softIds
    }
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getGCMagazineGameList failed')
    res.data = res.data.map(convertCDKInfo)
    return res.data
  }).catch(() => [])
}

/**
 * 兑换码兑换
 * @returns
 */
export function redeemCodeRedemption(code) {
  return request({
    url: '/cloud-legionzone-game-core/api/v1/legionproductvouchercode/change',
    method: 'POST',
    data: code
  })
}

/**
 * 是否显示TAB上的提示
 * @returns {Boolean} ""
 */
export function getTabTip() {
  return getConfigByKey('GAME_CENTER_TAB_TIP').then(res => {
    return res
  }).catch(() => null)
}

// 获取是否已经点赞（有缓存）
export function getSoftreviewslikes(params) {
  const _stateInfo = getGameDownloadStateMap()[params.reviewsId] || {}
  if (typeof _stateInfo.isLikes === 'boolean') {
    return Promise.resolve(_stateInfo.isLikes)
  }

  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviewslikes',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getSoftreviewslikes failed')

    const stateInfoNew = getGameDownloadStateMap()[params.reviewsId] || {}
    setGameDownloadState(params.reviewsId, {
      ...stateInfoNew,
      isLikes: res.data
    })
    return res.data
  }).catch(() => false)
}

// 获取预约专区数据
export function getReserveZoneData(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softmodule',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('获取游戏中心接口失败，请稍后重试！')

    if (!res.data.homePageModules || res.data.homePageModules.length <= 0) {
      throw new Error('获取游戏中心配置页面数据失败，请稍后重试！')
    }

    res.data.homePageModules.forEach(module => {
      if (!module.rankingLists || module.rankingLists.length <= 0) return
      module.rankingLists = module.rankingLists.filter(o =>
        (o.fillType === 1 && o.rankingListSofts && o.rankingListSofts.length) ||
        (o.fillType === 2 && o.rankingListPositions && o.rankingListPositions.length) ||
        (o.fillType === 3 && o.rankingCharts && o.rankingCharts.length >= 3) ||
        (o.fillType === 8 && o.rankingListSoftCalendars && o.rankingListSoftCalendars.length) ||
        (o.fillType === 5 && o.userReviews && o.userReviews.length)
      )
      module.rankingLists.forEach((o, index) => {
        o._id = `${o.id}_${index}`
        o.rankingListSofts = o.rankingListSofts && o.rankingListSofts.map(convertCDKInfo)
        o.rankingListPositions && o.rankingListPositions.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
        o.rankingCharts && o.rankingCharts.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
        o.rankingListSoftCalendars && o.rankingListSoftCalendars.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
        o.userReviews && o.userReviews.forEach(item => {
          item.softInfo = (item.softInfo && convertCDKInfo(item.softInfo)) || null
        })
      })
    })
    res.data.homePageModules = res.data.homePageModules.filter(o => o.rankingLists && o.rankingLists.length)
    res.data.homePageModules.sort((a, b) => a.moduleSort - b.moduleSort)

    if (res.data.homePageModules.length <= 0) {
      throw new Error('暂无配置榜单数据，请稍后重试！')
    }
    res.data.currentTime = res.data.currentTime || Date.now()
    return res.data
  })
}
// 搜索区获取运营位游戏
export function getSearchZoneGameList() {
  const params = {
    location: 1
  }
  try {
    return signRequest({
      url: '/cloud-legionzone-game-activity-start/api/search-recommend',
      method: 'GET',
      params
    }).then(res => {
      if (!res || res.code !== 10000) throw new Error('获取游戏中心接口失败，请稍后重试！')

      res.data = res.data.map(convertCDKInfo)
      return res.data
    })
  } catch (error) {
    console.error('getSearchZoneGameList error:', error)
    return Promise.resolve([])
  }
}
// 免费领取接口
export function getFreeOrder(data) {
  return signRequest({
    url: '/cloud-legionzone-game-core/api/v1/legionuserorder/free',
    method: 'POST',
    data
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('免费领取失败，请稍后重试！')

    return res.data
  }).catch(() => null)
}
