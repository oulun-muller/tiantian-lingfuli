import signRequest from '@/utils/signRequest.js'
import { getLegacyStore, getLegacyStoreState } from '@/compat/legacyGlobals'

function getGameDownloadStateMap() {
  return getLegacyStoreState('gameDownloadState.stateMap', {})
}

function setGameDownloadState(key, payload) {
  const store = getLegacyStore()
  return store?.dispatch?.('gameDownloadState/setState', {
    [key]: payload
  })
}

// 创建评测&回复
export function addGameViews(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviews',
    method: 'POST',
    data
  }).then(res => {
    return res
  })
}

// 删除评测&回复
export function deleteGameViews(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviews',
    method: 'DELETE',
    data
  }).then(res => {
    return res
  })
}

// 分页查询评测&回复
export function searchGameViews(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviews/search',
    method: 'GET',
    params
  }).then(res => {
    return res
  })
}

// 点赞
export function gameReviewslikes(data, _reviewsId) {
  let _stateInfo = {}
  if (_reviewsId) {
    _stateInfo = getGameDownloadStateMap()[_reviewsId]
  }

  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviewslikes',
    method: 'POST',
    data
  }).then(res => {
    if (_reviewsId) {
      setGameDownloadState(_reviewsId, {
        ..._stateInfo,
        isLikes: true
      })
    }

    return res
  }).catch(() => {
    throw new Error('点赞失败')
  })
}

// 取消点赞
export function deleteGameReviewslikes(data, _reviewsId) {
  let _stateInfo = {}
  if (_reviewsId) {
    _stateInfo = getGameDownloadStateMap()[_reviewsId]
  }

  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviewslikes',
    method: 'DELETE',
    data
  }).then(res => {
    if (_reviewsId) {
      setGameDownloadState(_reviewsId, {
        ..._stateInfo,
        isLikes: false
      })
    }

    return res
  }).catch(() => {
    throw new Error('取消点赞失败')
  })
}

// 预约游戏
export function reserveReviewslikes(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/softreservation',
    method: 'POST',
    data
  }).then(res => {
    return res
  })
}

// 取消预约游戏
export function unReserveReviewslikes(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/softreservation',
    method: 'DELETE',
    data
  }).then(res => {
    return res
  })
}

// 测试游戏申请
export function applyTestGame(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softtestapply',
    method: 'POST',
    data
  }).then(res => {
    return res
  })
}

// 是否有资格测评
export function getUserSoftReviews(params) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softreviews',
    method: 'GET',
    params
  }).then(res => {
    return res.data
  })
}
