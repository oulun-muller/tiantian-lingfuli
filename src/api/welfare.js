import signRequest from '@/utils/activitySignRequest'

const BASE = '/cloud-legionzone-game-activity-start/api/v1/welfare'

function unwrap(res) {
  if (!res || res.code !== 10000) throw res || new Error('welfare api failed')
  return res.data
}

function getPlatform() {
  if (window.__LZ_IS_PHONE_DEVICE__) return 4
  if (window.__LZ_IS_PAD_DEVICE__) return 2
  return 1
}

function getShelf(path) {
  return signRequest({
    url: `${BASE}${path}`,
    method: 'GET',
    params: { platform: getPlatform() }
  }).then(unwrap)
}

export function getTodayWelfare() {
  return getShelf('/center/today')
}

export function getRecommendWelfare() {
  return getShelf('/center/recommend')
}

export function getUpcomingWelfare() {
  return getShelf('/center/upcoming')
}

export function reserveWelfare(data) {
  return signRequest({ url: `${BASE}/center/reserve`, method: 'POST', data: { ...data, platform: getPlatform() } }).then(unwrap)
}

export function receiveWelfare(data) {
  return signRequest({ url: `${BASE}/resource/receive-record`, method: 'POST', data: { ...data, platform: getPlatform() } }).then(unwrap)
}

export function getPrizeList(params) {
  return signRequest({ url: `${BASE}/prize/list`, method: 'GET', params: { ...params, platform: getPlatform() } }).then(unwrap)
}

export function getPrizeDetail(params) {
  return signRequest({ url: `${BASE}/prize/detail`, method: 'GET', params: { ...params, platform: getPlatform() } }).then(unwrap)
}

export function redeemWelfare(data) {
  return signRequest({ url: `${BASE}/prize/redeem`, method: 'POST', data: { ...data, platform: getPlatform() } }).then(unwrap)
}
