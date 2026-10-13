import { getLegacyLenovoId, getMiniGameDeviceInfo } from '@/compat/legacyGlobals'

// ─── Tab 页面加载三阶段埋点 ──────────────────────────────────────────────────

/**
 * 创建页面加载埋点上报器，上报三个阶段：开始加载、第一帧、加载完成
 *
 * 用法：
 *   import { createTabPageReporter } from '@/utils/dataReport'
 *
 *   // created / activated 开头
 *   this._reporter = createTabPageReporter('精选', '/gameCenter/index')
 *   this._reporter.reportStart()
 *
 *   // mounted 里，requestAnimationFrame 内
 *   requestAnimationFrame(() => this._reporter.reportFirstFrame())
 *
 *   // 接口 finally 里（或缓存恢复后的 rAF 内）
 *   this._reporter.reportLoaded()
 *
 * @param {string} tabName  页面名称，作为 loadPage 字段上报
 * @param {string} route    当前页面路由路径，作为 source 字段上报
 */
export function createTabPageReporter(tabName, route) {
  let _firstFrameDone = false
  let _startTime = 0

  function report(eventName, extra) {
    (window.__LZ_DATA_REPORT__)(
      'LZ_appActive',
      eventName,
      'report',
      {
        detail: JSON.stringify({
          source: route,
          timestamp: Date.now(),
          loadPage: tabName,
          ...extra
        })
      }
    )
  }

  return {
    /** 时长-开始加载：initWithReport 内调用 */
    reportStart() {
      console.log('reportStart', tabName)
      _startTime = Date.now()
      report('LZ_timeStartLoad')
    },

    /** 时长-第一帧完成：mounted 里 requestAnimationFrame 回调内调用 */
    reportFirstFrame() {
      console.log('reportFirstFrame', tabName)
      _firstFrameDone = true
      report('LZ_timeFirstFrameDone', { duration: Date.now() - _startTime })
    },

    /** 时长-加载完成：接口 finally 或缓存恢复后调用。
     *  若 FirstFrame 尚未完成（接口比首帧渲染更快），延一帧保证时序正确。
     */
    reportLoaded() {
      console.log('reportLoaded', tabName)
      const _duration = Date.now() - _startTime
      if (!_firstFrameDone) {
        requestAnimationFrame(() => report('LZ_timeLoadComplete', { duration: _duration }))
      } else {
        report('LZ_timeLoadComplete', { duration: _duration })
      }
    }
  }
}

/**
 * Tab 点击埋点
 * @param {string} tabName  tab 名称：精选 / 福利&活动 / 排行榜 / 游戏库 / 火爆预约
 * @param {Vue}    vm       Vue 组件实例，用于读取当前路由
 */
export function reportTabClick(tabName, route) {
  (window.__LZ_DATA_REPORT__)(
    'LZ_appActive',
    'LZ_timeStartClick',
    'click',
    {
      detail: JSON.stringify({
        source: route,
        timestamp: Date.now(),
        loadPage: tabName
      })
    }
  )
}

// ─── 小游戏曝光 ───────────────────────────────────────────────────────────────

/**
 * @description: 小游戏曝光
 */
export async function reportMinigameExpose(item, childIndex, actionType, othenrParams = {}) {
  const enumObj = { 0: 'LZ_miniGameOrdinaryShow', 1: 'LZ_miniGameShow', 2: 'LZ_miniGameSearchListOrdinaryShow', 3: 'LZ_miniGameSearchListShow' }
  const action = enumObj[actionType]
  const { moduleName = '', firstLocal = '', secondLocal = '', from = null, type = null } = othenrParams
  const _parentGetMiniGameDeviceInfo = await getMiniGameDeviceInfo()
  const { qone32 = '', qone40 = '' } = _parentGetMiniGameDeviceInfo
  const isAdd = item?.softDesc?.isAd ? '广告' : item?.softDesc?.isAd === false ? '非广告' : ''
  const objParams = {
    plateName: moduleName,
    nameAndIDVersion: `${item.softName || othenrParams?.softName}_${item?.softId}_${isAdd}`,
    lenovoid: getLegacyLenovoId(),
    qone32,
    qone40,
    alg_rid: item.softDesc?.runConfigInfo?.rid,
    source_id: item.softDesc?.runConfigInfo?.resourcePos || othenrParams?.sourceID || '',
    position: childIndex + 1,
    gametype: item?.gameType === 1 ? 'apk' : ''
  }
  from && (objParams.from = from)
  type && (objParams.type = type)
  firstLocal && (objParams.firstLocal = firstLocal)
  secondLocal && (objParams.secondLocal = secondLocal)

  (window.__LZ_DATA_REPORT__)('LZ_minigames', action, 'pv', {
    detail: JSON.stringify(objParams)
  })
}

/**
 * @description: 点击小游戏启动
 * {
    firstLocal：1.APP首页（主界面）2.我的游戏 3.游戏中心 4.推送 7.社区 8.APP首页的弹窗 11.导航栏小游戏 12.桌面图标,
    secondLocal:1精选  7.搜索(游戏中心和导航栏小游戏)  10.APP首页搜索 12.社区（首页和推送） 13.我的游戏（首页和推送）,
    thirdLocal(可为空): 2.搜索快捷页面 3.搜索结果页,
    plateName:(模块名称:上报上具体名称，如果没有模块名称则为空；如果是搜索上报搜索内容_位置）,
    skuName: (商品名称即游戏名称）,
    softID: (软件ID),
    softType: (小游戏类别),--广告和非广告
    type:1.详情页 2.非详情,
    classify:1.导航栏 2.游戏中心tab 3.其他
    lenovoid: (登录的联想账号)
    gametype： 1 apk 2 weixin小游戏
  }
 */
export async function reportMinigameOpen({ firstLocal, secondLocal, thirdLocal, plateName, skuName, softID, softType, type = 2, source_id, alg_rid, position, gametype }) {
  const _parentGetMiniGameDeviceInfo = await getMiniGameDeviceInfo()
  const { qone32 = '', qone40 = '' } = _parentGetMiniGameDeviceInfo
  (window.__LZ_DATA_REPORT__)('LZ_minigames', 'LZ_miniGameInitiateClick', 'click', {
    detail: JSON.stringify({
      firstLocal,
      secondLocal,
      thirdLocal,
      plateName,
      skuName,
      softID,
      softType,
      type,
      lenovoid: getLegacyLenovoId(),
      qone32,
      qone40,
      source_id,
      alg_rid,
      position,
      gametype
    })
  })
}

/**
 * APK 小游戏安装全链路埋点
 * action 区分事件，status 仅下载/安装结果类事件传入（'success' | 'fail'）
 */
export async function reportApkInstall({ action, eventType }, params = {}) {
  const { qone32 = '', qone40 = '' } = await getMiniGameDeviceInfo()
  const { status, ...rest } = params
  const detail = {
    ...rest,
    lenovoid: getLegacyLenovoId(),
    qone32,
    qone40
  }
  if (status !== undefined) detail.status = status
  (window.__LZ_DATA_REPORT__)('LZ_minigames', action, eventType, { detail: JSON.stringify(detail) })
}

export function getGameMsgDataReport(item) {
  let stateGame = 1
  let statePage = 1 // 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),8.立即购买 9.帖子进入
  let gameClass = 1
  switch (item.downloadInfo.bizType) {
    case 0:
      stateGame = 1
      break
    case 1:
    case 2:
      stateGame = 2
      break
    case 4:
      stateGame = 3
      break
  }
  if (item.softPurpose === 3) {
    stateGame = 4
    gameClass = 3
  }

  if ([1, 2].includes(item.downloadInfo.bizType)) {
    if (item.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
      statePage = 2
    } else if (item.downloadInfo.userReservationStatus === 1) {
      statePage = 3
    }
  } else if (item.downloadInfo.bizType === 4) {
    if (item.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
      statePage = 4
    } else {
      if (item.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
        statePage = 5
      } else if ([1].includes(item.downloadInfo.userTestApplyStatus)) {
        statePage = 6
      } else if ([2].includes(item.downloadInfo.userTestApplyStatus)) {
        statePage = 1
      }
    }
  } else if (item.softPurpose === 3 && !item.productInfo?.userPurchasedStatus) {
    if (item.productInfo?.currentPrice === 0) {
      statePage = 9
    } else if (item.productInfo?.currentPrice > 0) {
      statePage = 8
    }
  }

  return { statePage,
    stateGame,
    gameClass,
    skuName: item.softName,
    softID: item.softId
  }
}

