import signRequest from '@/utils/signRequest'
import { convertCDKInfo } from '@/api/common.js'

/**
 * 小游戏详情
 * @param {Object} miniGameDeviceInfo 小游戏设备信息
 * @returns {Object}
 */
export function getMiniGamedetailData(miniGameDeviceInfo) {
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/v2/soft/detail`,
    method: 'GET',
    params: miniGameDeviceInfo
  }).then(res => {
    if (res.code !== 10000) throw new Error('getMiniGamedetailData failed')

    if (!res.data) {
      return null
    }

    return convertCDKInfo(res.data)
  }).catch(() => null)
}

/**
 * 小游戏推荐
 * @param {Object} miniGameDeviceInfo 小游戏设备信息
 * @returns {Array}
 */
export function getMiniGameLikes(miniGameDeviceInfo) {
  return signRequest({
    url: `/cloud-legionzone-game-activity-start/api/v5/soft`,
    method: 'GET',
    params: miniGameDeviceInfo
  }).then(res => {
    if (res.code !== 10000) throw new Error('getMiniGameLikes failed')

    if (!res || !res.data || !res.data.length) {
      return null
    }

    return res.data.map(convertCDKInfo)
  }).catch(() => null)
}
