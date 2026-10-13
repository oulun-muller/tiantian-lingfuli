import signRequest from '@/utils/signRequest'

// 获取活动专题列表
export function getActivityZone(data) {
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/v2/common/position`,
    method: 'POST',
    data
  }).then(res => {
    if (res.code !== 10000) throw new Error('getActivityZone failed')

    if (!res.data || JSON.stringify(res.data) === '{}') {
      return null
    }

    if (!res.data['0'] || !res.data['0'].length) {
      res.data['0'] = null
    }

    if (!res.data['1'] || !res.data['1'].length) {
      res.data['1'] = null
    }

    if (!res.data['2'] || !res.data['2'].length) {
      res.data['2'] = null
    }

    if (!res.data['0'] && !res.data['1'] && !res.data['2']) {
      return null
    }

    return res.data
  }).catch(() => null)
}

// 活动订阅
export function activitySub(data) {
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/activitysubscription`,
    method: 'POST',
    data
  })
}

// 取消活动订阅
export function cancelActivitySub(data) {
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/activitysubscription`,
    method: 'DELETE',
    data
  })
}
