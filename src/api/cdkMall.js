import signRequest, { generateSignParams } from '@/utils/signRequest.js'
import { convertCDKInfo } from '@/api/common.js'
import { getConfigByKey } from '@/api'
import Axios from 'axios'
import { getMiniGameDeviceInfo } from '@/compat/legacyGlobals'

// 软件售卖接口成功码兼容：v1 返回 10000，v2 文档返回 "100000"，数字/字符串均兼容。
export function isSuccessCode(code) {
  return code === 10000 || code === '10000' || code === 100000 || code === '100000'
}
// 查询首页数据
export function getHomeData(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softmodule',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('获取cdk数据失败，请稍后重试！')

    if (!res.data.homePageModules || res.data.homePageModules.length <= 0) {
      throw new Error('cdk 页面暂未配置数据，请稍后重试！')
    }

    res.data.homePageModules.forEach(module => {
      if (!module.rankingLists || module.rankingLists.length <= 0) return

      module.rankingLists = module.rankingLists.filter(o => o.rankingListSofts && o.rankingListSofts.length)
      module.rankingLists.forEach((o, index) => {
        o._id = `${o.id}_${index}`
        o.rankingListSofts = o.rankingListSofts.map(convertCDKInfo)
      })
    })

    res.data.homePageModules = res.data.homePageModules.filter(o => o.rankingLists && o.rankingLists.length)
    res.data.homePageModules.sort((a, b) => a.moduleSort - b.moduleSort)

    if (res.data.homePageModules.length <= 0) {
      throw new Error('getHomeData no rank list')
    }

    res.data.currentTime = res.data.currentTime || Date.now()

    return res.data
  })
}

// 获取CDK列表
export async function queryCDKList(params, mode = '') {
  try {
    const _parentGetMiniGameDeviceInfo = await getMiniGameDeviceInfo()
    if (_parentGetMiniGameDeviceInfo) {
      params.qone32 = _parentGetMiniGameDeviceInfo.qone32
      params.qone40 = _parentGetMiniGameDeviceInfo.qone40
    }
  } catch (error) {
    console.warn(error)
  }

  let url = `/cloud-legionzone-game-activity-start/api/v2/soft`

  if (params && params.key) {
    url = `/cloud-legionzone-game-activity-start/api/v3/soft`
  }
  if (mode === 'highlight') {
    url = `/cloud-legionzone-game-activity-start/api/v4/soft`
  }
  return signRequest({
    url: url,
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('queryCDKList failed')

    res.data.records = (res.data.records || []).map(convertCDKInfo)

    return res.data
  })
}
// 搜索栏快捷搜索
export async function queryCDKListByKey(params) {
  const _parentGetMiniGameDeviceInfo = await getMiniGameDeviceInfo()
  if (_parentGetMiniGameDeviceInfo) {
    params.qone32 = _parentGetMiniGameDeviceInfo.qone32
    params.qone40 = _parentGetMiniGameDeviceInfo.qone40
  }
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/v6/soft`,
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('queryCDKListByKey failed')

    res.data.records = (res.data.records || []).map(convertCDKInfo)
    return res.data
  })
}

// 获取CDK详情
export function getCDKDetail(softId) {
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/v1/soft/detail`,
    method: 'GET',
    params: { softId }
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getCDKDetail failed')

    return convertCDKInfo(res.data)
  })
}

// CDK创单接口
export function generateCDKOrder(data) {
  return signRequest({
    url: `${process.env.MIDDLE_PLATFORM.GATEWAY}/cloud-softwaresale/api/v2/order/buy/realqrcode`,
    method: 'POST',
    data
  }).then(res => {
    if (!res) throw new Error('CDK创单失败')

    return res
  }).catch(() => {
    return {
      code: 99999,
      message: '请求失败，请稍后再试'
    }
  })
}

// 软件售卖移动端支付-生成支付二维码（v2），返回 data.uuid + data.qrcode（base64 图片）
export function createCommodityOrderQrcode({ sid, price, uuid, chan = 'legionzone', plat = 'legionzone' } = {}) {
  const data = { sid, price, chan, plat }
  if (uuid !== undefined && uuid !== null && uuid !== '') data.uuid = uuid
  return signRequest({
    url: `${process.env.MIDDLE_PLATFORM.GATEWAY}/cloud-softwaresale/api/v2/order/buy/realqrcode`,
    method: 'POST',
    data
  })
}

// 软件售卖移动端支付-下单并调起支付（v2），返回 data.oid + data.url
// payCode: WX_MB（微信移动 web）/ ALI_MB（支付宝移动 web）/ WX_JS
// channel: pc/mobile；uuid 来自 v2 order/buy/realqrcode 返回值
// 接口要求 application/x-www-form-urlencoded 表单，签名参数（appId/nonce/timestamp/sign_type/sign）由 generateSignParams 注入
export function createCommodityPayTrade({ sid, payCode, price, uuid, chan = 'legionzone', plat = 'legionzone', channel = 'mobile', did } = {}) {
  const data = { uuid, sid, price, plat, chan, payCode, channel }
  if (did !== undefined && did !== null && did !== '') data.did = did

  return generateSignParams(data).then(signed => {
    // 序列化为 urlencoded 表单字符串，交给 signRequest 只补 token/realm 头，避免二次 JSON 签名
    const form = Object.keys(signed)
      .filter(k => signed[k] !== undefined && signed[k] !== null && signed[k] !== '')
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(signed[k])}`)
      .join('&')

    return signRequest({
      url: `${process.env.MIDDLE_PLATFORM.GATEWAY}/cloud-softwaresale/api/v2/order/pay/trade`,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: form
    })
  })
}

// 软件售卖商品信息查询（v1），返回 sname/cname/editionNote/pertainArea 等商品详情
export function commodityInfo(sid, chan = 'legionzone', plat = 'legionzone') {
  return signRequest({
    url: `${process.env.MIDDLE_PLATFORM.GATEWAY}/cloud-softwaresale/api/v1/info/commodity/info`,
    method: 'GET',
    params: { sid, chan, plat }
  })
}

// 生成订单轮询 UUID（与 PC 端保持一致的本地随机串，用于下单/轮询关联）
export function generateCommodityUuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// CDK激活码分配状态轮询接口
export function cdkOrderPoll(uuid) {
  return signRequest({
    url: `${process.env.MIDDLE_PLATFORM.GATEWAY}/cloud-softwaresale/api/v2/order/buy/poll`,
    method: 'GET',
    params: { uuid }
  })
}

// 软件售卖移动端订单状态轮询（v2），支付成功后返回 data（含 oid/code/exchangeUrl/statusVal 等）
export function commodityOrderPoll(uuid) {
  return cdkOrderPoll(uuid)
}

// 预售商品信息（普通/豪华两个 SKU 的定价），用于非预约商品按 SKU 取价。
export async function getPreSaleSoftInfo() {
  const configValue = await getConfigByKey('PRE_ORDER_BUTTON')
  if (!configValue) return null
  const result = JSON.parse(configValue)
  const newResult = {
    isOpen: result.isOpen,
    info: result.info
  }
  const normalPrice = newResult.info.normal
  newResult.info.normal.discount = `${Math.round(((normalPrice.currentPrice - normalPrice.originalPrice) / normalPrice.originalPrice) * 100)}%`
  const luxuryPrice = newResult.info.luxury
  newResult.info.luxury.discount = `${Math.round(((luxuryPrice.currentPrice - luxuryPrice.originalPrice) / luxuryPrice.originalPrice) * 100)}%`
  return newResult
}

// 游戏中心搜索默认词
export function searchDefaultWords(params, defaultValue) {
  const sessionName = 'SEARCH_HOT_WORDS_' + params.locationId
  const cache = JSON.parse(sessionStorage.getItem(sessionName) || null)
  if (cache) return Promise.resolve(cache)

  const _data = {
    keyword: defaultValue,
    description: ''
  }

  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/legionsoftsearchdefaultwords',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('searchDefaultWords failed')

    _data.keyword = res.data.keyword
    _data.description = res.data.description
    sessionStorage.setItem(sessionName, JSON.stringify(_data))

    return _data
  }).catch(() => _data)
}

// 游戏中心搜索热词列表
export function searchHotWords(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/legionsoftsearchhotwords',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('searchHotWords failed')

    return res.data
  }).catch(() => [])
}
// 游戏详情获取推荐游戏列表
export function getRecommendGameList(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softrecommendations',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getRecommendGameList failed')

    return res.data
  }).catch(() => [])
}
// 游戏详情获取 帖子id列表
export function getPostIdList(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/soft/postlist',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getPostIdList failed')

    return res.data
  }).catch(() => null)
}
// 游戏详情获取 帖子详情数据
export function getPostDetail(id) {
  return Axios.post(`https://duosuna.lenovo.com/legionproxy-apis/portal/cms/article/get/${id}`, {}, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => {
    return res?.data?.data
  }).catch(() => null)
}
// 游戏详情获取 活动与公告列表
export function getActivityOrNoticeList(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/soft/notice',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getActivityList failed')

    return res.data
  }).catch(() => [])
}
// 获取ai推荐游戏
export async function getAIRecommendGameList(deviceUuid) {
  const params = {
    moduleType: 1,
    deviceUuid
  }
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/airecommend',
    method: 'GET',
    params
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('getAIRecommendGameList failed')

    return res.data
  }).catch(() => [])
}
