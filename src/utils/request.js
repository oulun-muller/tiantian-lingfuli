import { callLegacy, getLegacyUserInfo } from '@/compat/legacyGlobals'
import axios from 'axios'
import Config from '@/config'
import { getsignpart, signature } from './index.js'

/**
 * @description 生成基本入参
 * @returns {Object}
 */
function generateBaseParams() {
  const baseParms = {
    appId: process.env.APPID,
    nonce: getsignpart().nonce,
    sign_type: getsignpart().sign_type,
    timestamp: getsignpart().timestamp
  }
  return baseParms
}

/**
 * @description 生成签名串
 * @returns {String}
 */
function generateSignStr(data) {
  return Object.keys(data).sort().filter(k => {
    if (data[k] === undefined || data[k] === null || data[k] === '' || Number.isNaN(data[k]) || Object.prototype.toString.call(data[k]) === '[object Object]' || Object.prototype.toString.call(data[k]) === '[object Array]') {
      return false
    }

    return true
  }).map(k => `${k}=${data[k]}`).join('&')
}

/**
 * @description 生成新的参数
 * @returns {Object}
 */
async function generateNewParams(data = {}) {
  data = Object.assign(generateBaseParams(), data)
  const str = generateSignStr(data)

  data.sign = await signature(str)
  return data
}

/**
 * @description: 创建axios实例
 */
const instance = axios.create({
  baseURL: process.env.GATEWAY,
  timeout: Config.timeout
})

/**
 * @description: 请求拦截器
 */
instance.interceptors.request.use(async config => {
  const userInfo = getLegacyUserInfo() || {}
  // 通用请求头
  if (userInfo.Token) {
    config.headers['token'] = userInfo.Token
  }
  if (userInfo.Realm) {
    config.headers['realm'] = userInfo.Realm
  }
  if (window.LZ_SERVER_ENV_QA) {
    config.headers['n-d-version'] = 'qa'
  }
  if ((window.__LZ_IS_BELLATOR_DEVICE__)) {
    config.headers['clientType'] = 3
  }
  config.headers['Lz-Platform'] = (window.__LZ_IS_PAD_DEVICE__) ? 'PAD' : 'PC'
  if (['PUT', 'POST', 'PATCH', 'DELETE'].includes(config.method.toLocaleUpperCase()) && Object.prototype.toString.call(config.data) !== '[object FormData]') {
    config.headers['Content-Type'] = 'application/json'
    config.data = await generateNewParams(config.data)
  }
  return config
}, error => {
  return Promise.reject(error)
})

/**
 * @description: 响应拦截器
 */
instance.interceptors.response.use(response => {
  const { status } = response // 来自服务器响应的 HTTP 状态码
  if (status < 200 || status > 300) {
    return Promise.reject(response.data)
  } else {
    return Promise.resolve(response.data)
  }
}, error => {
  // 处理响应错误
  const id = Date.now()
  (window.__LZ_DATA_REPORT__)(
    'LZ_gamingCenter',
    'LZ_eventPageNotExposedReason',
    '',
    {
      details: JSON.stringify({
        id,
        token: error?.config?.headers?.token || '',
        errtype: error?.response?.status,
        errmess: JSON.stringify(error?.response?.data)
      })
    }
  )
  if (error.response) {
    if (error.response.status === 401) {
      callLegacy('$refreshLIDToken', id)
      return Promise.reject(new Error('TOKEN失效，认证失败'))
    }

    return Promise.reject(error.response.data)
  }

  return Promise.reject(error)
})

export default instance
