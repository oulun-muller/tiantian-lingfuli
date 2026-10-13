import signRequest from '@/utils/activitySignRequest'

// 获取活动详情
export function getActivityDetail(id, channel) {
  if (id == null || id === '' || String(id) === 'undefined') {
    return Promise.reject({ code: -1, message: '活动不存在！' })
  }
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/activitypages/${id}?channel=${channel}`,
    method: 'GET'
  }).then(res => {
    if (res.code !== 10000) throw res
    return res.data
  })
}

// 抽奖
export function drawLottery({ deviceId, prizeDrawActivityId, activityPageId, channel, sn }) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/prize/draw',
    method: 'POST',
    data: {
      deviceId,
      prizeDrawActivityId,
      activityPageId,
      channel,
      sn
    }
  }).then(res => {
    if (!res || res.code !== 10000) throw res
    return res.data
  })
}

// 填写实物奖品地址
export function submitPrizeAddress({ drawId, userName, phoneNum, address, channel }) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/prize/draw/contact',
    method: 'POST',
    data: {
      drawId,
      userName,
      phoneNum,
      address,
      channel
    }
  }).then(res => {
    if (res.code !== 10000) throw res

    return res.data
  })
}

// 完成任务领取奖励
export function claimReward({ prizeDrawActivityId, taskId, activityPageId, channel }) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/prize/draw/claimed',
    method: 'POST',
    data: {
      activityPageId,
      prizeDrawActivityId,
      taskId,
      channel
    }
  }).then(res => {
    if (res.code !== 10000) throw res

    return res.data
  })
}

// 中奖记录
export function getPrizeRecord(prizeDrawActivityIds, channel) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/prize/draw/win/record',
    method: 'GET',
    params: {
      prizeDrawActivityIds,
      channel
    }
  }).then(res => {
    if (res.code !== 10000) return []
    return res.data
  }).catch(() => [])
}

// 查询所有活动奖品记录（支持分页）
export function getAllPrizeRecords(channel, current = 1, size = 10) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/prize/draw/win/record/all',
    method: 'GET',
    params: {
      channel,
      current,
      size
    }
  }).then(res => {
    if (res.code !== 10000) return { records: [], total: 0 }
    return res.data || { records: [], total: 0 }
  }).catch(() => ({ records: [], total: 0 }))
}

// 获取绑定 livelink 的 url 或者 绑定 QQ 的 url
export function getBindThirdUrl(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/txlivelink/bind',
    method: 'POST',
    data
  }).then(res => {
    if (res.code !== 10000) return ''
    return res.data
  })
}

// 任务模块领取奖励
export function getTaskClaim(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/prize/task/claimed',
    method: 'POST',
    data
  }).then(res => {
    if (!res) throw new Error('getTaskClaim failed')
    return res
  }).catch(() => null)
}

// 活动任务历史状态二次检查
export function checkChannelTask(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/activity/task/check',
    method: 'POST',
    data
  }).then(res => {
    if (!res?.data) throw new Error('checkChannelTask failed')
    return res.data
  }).catch(() => null)
}

// 刷新任务状态
export function refreshTaskStatus(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/activity/task/finish/check',
    method: 'POST',
    data
  }).then(res => {
    if (!res?.data) throw new Error('refreshTaskStatus failed')
    return res.data?.result || false
  }).catch(() => false)
}
