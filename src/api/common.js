import { getByteLength } from '@/utils'
// 转换CDK信息
export function convertCDKInfo(cdkInfo) {
  if (!cdkInfo) return null
  const _showInfo = {
    ruleLabelName: '',
    ruleLabelClassName: 'latest',
    score: 0,
    scoreLevel: 0,
    softLabels: [],
    hlSoftLabels: [],
    himg: '',
    vimg: '',
    img162x285: '',
    img354x285: '',
    logoFile: '',
    isFastInstall: false,
    installFileSize: '',
    playersNum: 0,
    awardInfos: [],
    mediaScores: [],
    rankingLabelInfos: []
  }
  if (cdkInfo.showInfo) {
    _showInfo.ruleLabelName = cdkInfo.showInfo.ruleLabelName || ''
    _showInfo.ruleLabelClassName = {
      热销: 'hot',
      史低: 'lowest',
      新游: 'latest',
      限时特价: 'limit'
    }[_showInfo.ruleLabelName] || 'latest'
    _showInfo.score = Number(cdkInfo.showInfo.score || 0)
    _showInfo.scoreLevel = Math.round(_showInfo.score / 20)
    _showInfo.softLabels = (cdkInfo.showInfo.softLabels || []).filter(o => getByteLength(o) <= 10).slice(0, 9)
    _showInfo.hlSoftLabels = (cdkInfo.showInfo.hlSoftLabels || []).filter(o => getByteLength(o) <= 20).slice(0, 9)
    _showInfo.himg = cdkInfo.showInfo.himg || ''
    _showInfo.vimg = cdkInfo.showInfo.vimg || ''
    _showInfo.img162x285 = cdkInfo.showInfo.img162x285 || ''
    _showInfo.img354x285 = cdkInfo.showInfo.img354x285 || ''
    _showInfo.logoFile = cdkInfo.showInfo.logoFile || ''
    _showInfo.isFastInstall = cdkInfo.showInfo.isFastInstall === '1'
    _showInfo.installFileSize = cdkInfo.showInfo.installFileSize || ''
    _showInfo.playersNum = cdkInfo.showInfo.playersNum || 0
    _showInfo.awardInfos = cdkInfo.showInfo.awardInfos || []
    _showInfo.mediaScores = cdkInfo.showInfo.mediaScores || []
    _showInfo.rankingLabelInfos = cdkInfo.showInfo.rankingLabelInfos || []
    _showInfo.aiOptFlag = cdkInfo.showInfo.aiOptFlag || false
  }

  const _downloadInfo = {
    pcStoreParam: '',
    webStoreUrl: '',
    downloadCount: '1万次安装',
    downloadCountTextLength: 0,
    tagUrls: [], // 认证标签url列表
    bizType: 0, // 0-普通(默认)、1-有包预约、2-无包预约、3、测试
    expectedReleaseTime: '',
    userReservationStatus: 0, // 预约状态 0-未预约1-已预约
    userTestApplyStatus: 0, // 测试申请状态 0-未申请1-已申请2-申请通过
    testActivityName: '',
    testActivityStatus: 0, // 0 未开始；1 进行中；2 已结束
    testActivityQuestionUrl: '',
    reservationCount: 0,
    testActivityId: null,
    installSize: ''
  }
  if (cdkInfo.downloadInfo) {
    _downloadInfo.pcStoreParam = cdkInfo.downloadInfo.pcStoreParam || ''
    _downloadInfo.webStoreUrl = cdkInfo.downloadInfo.webStoreUrl || ''
    _downloadInfo.downloadCount = cdkInfo.downloadInfo.downloadCount || '1万次安装'
    _downloadInfo.downloadCountTextLength = getByteLength(cdkInfo.downloadInfo.downloadCount)
    _downloadInfo.tagUrls = cdkInfo.downloadInfo.tagUrls || []
    _downloadInfo.bizType = cdkInfo.downloadInfo.bizType // 0-普通(默认)、1-有包预约、2-无包预约、3、测试
    _downloadInfo.expectedReleaseTime = cdkInfo.downloadInfo.expectedReleaseTime
    _downloadInfo.releaseRemind = cdkInfo.downloadInfo.releaseRemind
    _downloadInfo.userReservationStatus = cdkInfo.downloadInfo.userReservationStatus // 预约状态 0-未预约1-已预约
    _downloadInfo.userTestApplyStatus = cdkInfo.downloadInfo.userTestApplyStatus // 测试申请状态 0-未申请1-已申请2-申请通过
    _downloadInfo.testActivityName = cdkInfo.downloadInfo.testActivityName || ''
    _downloadInfo.testActivityStatus = cdkInfo.downloadInfo.testActivityStatus || 0 // 测试活动开启 true/flase
    _downloadInfo.testActivityQuestionUrl = cdkInfo.downloadInfo.testActivityQuestionUrl || ''
    _downloadInfo.reservationCount = cdkInfo.downloadInfo.reservationCount || 0
    _downloadInfo.testActivityId = cdkInfo.downloadInfo.testActivityId || ''
    _downloadInfo.installSize = cdkInfo.downloadInfo.installSize || ''
  }

  const _productInfo = {
    currentPrice: 0,
    discount: '',
    originalPrice: 0,
    exchangePlatform: '',
    gamePkgType: '',
    editionNote: '',
    pertainArea: '',
    exchangeProcess: '',
    userPurchasedStatus: 0 // 0-未购买1-已购买（单机杂志）
  }
  if (cdkInfo.productInfo) {
    _productInfo.currentPrice = cdkInfo.productInfo.currentPrice || 0
    _productInfo.discount = cdkInfo.productInfo.discount || ''
    _productInfo.originalPrice = cdkInfo.productInfo.originalPrice || 0
    _productInfo.exchangePlatform = cdkInfo.productInfo.exchangePlatform || ''
    _productInfo.exchangePlatformFont = {
      STEAM: '&#xe680;',
      EPIC: '&#xe67f;',
      UPLAY: '&#xe681;',
      ORIGIN: '&#xe682;'
    }[_productInfo.exchangePlatform.trim().toLocaleUpperCase()] || ''
    _productInfo.gamePkgType = cdkInfo.productInfo.gamePkgType || ''
    _productInfo.editionNote = cdkInfo.productInfo.editionNote || ''
    _productInfo.pertainArea = cdkInfo.productInfo.pertainArea || ''
    _productInfo.exchangeProcess = cdkInfo.productInfo.exchangeProcess || ''
    if (/^DLC$/i.test(_productInfo.gamePkgType) && !_showInfo.softLabels.some(item => item.toUpperCase() === 'DLC')) {
      _showInfo.softLabels.unshift('DLC')
    }
    if (/^DLC$/i.test(_productInfo.gamePkgType) && !_showInfo.hlSoftLabels.some(item => item.toUpperCase() === 'DLC')) {
      _showInfo.hlSoftLabels.unshift('DLC')
    }
    _productInfo.userPurchasedStatus = cdkInfo.productInfo.userPurchasedStatus || 0
  }

  let _currentTimeActivity = null
  if (cdkInfo.currentTimeActivity) {
    _currentTimeActivity = {
      endTime: cdkInfo.currentTimeActivity.endTime || Date.now(),
      startTime: cdkInfo.currentTimeActivity.startTime || Date.now()
    }
  }

  const _softDesc = {
    detailInfo: '',
    language: '',
    mediaList: [],
    configurationRequirement: null,
    supportPlatform: [],
    whatsNew: '',
    version: '',
    versionCode: '',
    supportOsbit: [],
    introduction: '',
    aiReviews: '', // AI评测
    positiveReviewRate: '', // 好评率
    recentPositiveReviewRate: '', // 近期好评率
    reviewsCount: 0, // 测评数
    followerCount: 0, // 关注数
    runConfigInfo: null,
    apkSize: '',
    recommendIntroduction: ''
  }
  if (cdkInfo.softDesc) {
    _softDesc.detailInfo = cdkInfo.softDesc.detailInfo || ''
    _softDesc.language = cdkInfo.softDesc.language || ''
    _softDesc.mediaList = (cdkInfo.softDesc.captureFileList || []).map(o => ({
      type: 'image',
      url: o
    }))
    const _videoCoverImg = cdkInfo.softDesc.videoCoverImg || ''
    const _videoUrl = cdkInfo.softDesc.videoUrl || ''
    if (_videoCoverImg && _videoUrl) {
      _softDesc.mediaList.unshift({
        type: 'video',
        poster: _videoCoverImg,
        url: _videoUrl
      })
    }
    if (cdkInfo.softDesc.configurationRequirement) {
      let {
        system,
        display,
        hardDisk,
        cpu,
        directX,
        ram
      } = cdkInfo.softDesc.configurationRequirement

      system = (system || '').trim()
      display = (display || '').trim()
      hardDisk = (hardDisk || '').trim()
      cpu = (cpu || '').trim()
      directX = (directX || '').trim()
      ram = (ram || '').trim()

      if (system || display || hardDisk || cpu || directX || ram) {
        _softDesc.configurationRequirement = {
          system,
          display,
          hardDisk,
          cpu,
          directX,
          ram
        }
      }
    }
    _softDesc.supportPlatform = cdkInfo.softDesc.supportPlatform || []
    _softDesc.whatsNew = cdkInfo.softDesc.whatsNew || ''
    _softDesc.version = cdkInfo.softDesc.version || ''
    _softDesc.versionCode = cdkInfo.softDesc.versionCode || ''
    _softDesc.supportOsbit = cdkInfo.softDesc.supportOsbit || []
    _softDesc.introduction = cdkInfo.softDesc.introduction || ''
    _softDesc.aiReviews = cdkInfo.softDesc.aiReviews || ''
    _softDesc.positiveReviewRate = cdkInfo.softDesc.positiveReviewRate || ''
    _softDesc.recentPositiveReviewRate = cdkInfo.softDesc.recentPositiveReviewRate || ''
    _softDesc.reviewsCount = cdkInfo.softDesc.reviewsCount || 0
    _softDesc.followerCount = cdkInfo.softDesc.followerCount || 0
    _softDesc.videoCoverImg = cdkInfo.softDesc.videoCoverImg || ''
    _softDesc.videoUrl = cdkInfo.softDesc.videoUrl || ''
    _softDesc.positiveReviewTotal = cdkInfo.softDesc.positiveReviewTotal || 0
    _softDesc.negativeReviewTotal = cdkInfo.softDesc.negativeReviewTotal || 0
    _softDesc.pkgName = cdkInfo.softDesc.pkgName || ''
    _softDesc.isAd = cdkInfo.softDesc.isAd || false
    _softDesc.apkSize = cdkInfo.softDesc.apkSize || false
    _softDesc.recommendIntroduction = cdkInfo.softDesc.recommendIntroduction || ''

    if (cdkInfo.softDesc.runConfigInfo) {
      let {
        appId,
        appType,
        cardId,
        clickType,
        operateTime,
        posCard,
        posInCard,
        recommendId,
        requestInterface,
        resourcePos,
        rid
      } = cdkInfo.softDesc.runConfigInfo

      appId = appId || ''
      appType = appType || 0
      cardId = cardId || ''
      clickType = clickType || 0
      operateTime = operateTime || ''
      posCard = posCard || ''
      posInCard = posInCard || ''
      recommendId = recommendId || ''
      requestInterface = requestInterface || ''
      resourcePos = resourcePos || ''
      rid = rid || ''

      _softDesc.runConfigInfo = {
        appId,
        appType,
        cardId,
        clickType,
        operateTime,
        posCard,
        posInCard,
        recommendId,
        requestInterface,
        resourcePos,
        rid
      }
    }
  }
  return {
    skuId: cdkInfo.skuId || '',
    softId: cdkInfo.softId || '',
    softName: cdkInfo.softName || '',
    hlSoftName: cdkInfo.hlSoftName || '',
    rankingListLabelImg: cdkInfo.rankingListLabelImg || '',
    softPurpose: cdkInfo.softPurpose || 1, // 1: CDK售卖, 2: 推荐下载, 3: 杂志游戏
    firstSyncTime: (cdkInfo.firstSyncTime || '').trim(),
    showInfo: _showInfo,
    downloadInfo: _downloadInfo,
    productInfo: _productInfo,
    currentTimeActivity: _currentTimeActivity,
    softDesc: _softDesc,
    currentTime: cdkInfo.currentTime || Date.now(),
    userSoftReviews: cdkInfo.userSoftReviews,
    firstClassId: cdkInfo.firstClassId,
    status: typeof cdkInfo.status === 'boolean' ? cdkInfo.status : true, // true:已上架，false：未上架
    reducePrice: cdkInfo.reducePrice || '', // 降价金额; 如果没降价返回空
    id: cdkInfo.id || '',
    relateActivitys: cdkInfo.relateActivitys || [],
    relateNotices: cdkInfo.relateNotices || [],
    expectations: cdkInfo.expectations || '',
    trialVideos: cdkInfo.trialVideos || [],
    nnId: cdkInfo.nnId || ''
  }
}
