import signRequest from '@/utils/activitySignRequest'

export function getNewGuideGameList(data) {
  return signRequest({
    url: '/cloud-legionzone-game-activity-start/api/v1/softmodule/single',
    method: 'get',
    params: data
  }).then(res => {
    if (!res || res.code !== 10000) throw new Error('获取新手引导列表失败')
    return res?.data || null
  }).catch(() => null)
}
