import request from '@/utils/request'

/**
 * 查询配置管理后台的配置信息
 * @param {String} configKey 配置信息唯一标识配置key
 * @returns {String}
 */
export function getConfigByKey(configKey) {
  return request({
    url: '/cloud-legionzone/api/v1/config',
    method: 'post',
    data: { configKey }
  }).then(res => {
    if (!res || res.code !== 10000 || !res.data || res.data.configValue === undefined) throw new Error(`getConfigByKey[${configKey}] failed`)

    return res.data.configValue
  })
}
