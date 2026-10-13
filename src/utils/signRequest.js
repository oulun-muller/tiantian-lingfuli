import axios from 'axios'
import jsrsasign from 'jsrsasign'
import Config from '@/config'
// import store from '@/store'
import Base64 from '@/utils/base64'
import { callLegacy, getLegacyUserInfo } from '@/compat/legacyGlobals'

/**
 * 生成随机字符串
 * @param {Number} [num = 32] - 字符串长度
 * @returns 随机字符串
 */
function generateRandomString(num = 32) {
  const str = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  const strLength = str.length
  let result = ''
  for (let i = 0; i < num; i++) {
    result += str[Math.floor(Math.random() * strLength)]
  }

  return result
}

/**
 * 对象序列化
 * @param {Object} data - 待序列化的对象
 * @returns 序列化后的字符串
 * @example
 * {
 *   a: 1,
 *   b: 2,
 *   c: 3
 * }
 * ==>
 * a=1&b=2&c=3
 */
function serialization(data = {}) {
  return Object.keys(data).sort().filter(k => {
    if (data[k] === undefined ||
        data[k] === null ||
        data[k] === '' ||
        Number.isNaN(data[k]) ||
        Object.prototype.toString.call(data[k]) === '[object Object]' ||
        Object.prototype.toString.call(data[k]) === '[object Array]' ||
        Object.prototype.toString.call(data[k]) === '[object File]' ||
        Object.prototype.toString.call(data[k]) === '[object Blob]') {
      return false
    }

    return true
  }).map(k => `${k}=${data[k]}`).join('&')
}

/**
 * 获取可用于签名的 PEM 私钥字符串
 * 兼容三种格式：
 * 1. PEM 明文（以 -----BEGIN 开头）：直接使用；
 * 2. Base64 编码的 PEM：解码后使用；
 * 3. Base64 编码的 PKCS#8 DER 密钥（反馈私钥）：包裹成 PEM 使用。
 */
function getPrivateKey(privateKeyValue) {
  if (!privateKeyValue) {
    throw new Error('Missing RSA signing private key')
  }
  if (privateKeyValue.indexOf('-----BEGIN') === 0) {
    return privateKeyValue
  }

  const decodedKey = Base64.decode(privateKeyValue)
  if (decodedKey.indexOf('-----BEGIN') === 0) {
    return decodedKey
  }

  // Feedback credentials are supplied as a Base64-encoded PKCS#8 DER key.
  return ''
}

/**
 * 字符串签名
 * @param {String} str - 待签名的字符串
 * @param {String} privateKeyValue - 签名私钥
 * @returns 签名后的字符串
 */
async function signature(str = '') {
  const privateKey = getPrivateKey(process.env.PRIVATE_KEY)
  const signature = new jsrsasign.KJUR.crypto.Signature({ 'alg': 'SHA256withRSA' })
  const prvKey = jsrsasign.KEYUTIL.getKey(privateKey)
  signature.init(prvKey)
  signature.updateString(str)
  return jsrsasign.hextob64(signature.sign())
}

/**
 * 添加签名参数
 * @param {Object} params - 原始参数对象
 * @returns 添加签名参数后的对象
 */
export async function generateSignParams(params) {
  const _params = {
    appId: process.env.APPID,
    nonce: generateRandomString(10),
    timestamp: new Date().getTime(),
    sign_type: 'RSA2',
    ...params
  }

  _params.sign = await signature(serialization(_params))

  return _params
}

function createFeedbackRequest() {
  const feedback = axios.create({ baseURL: process.env.GATEWAY, timeout: Config.timeout })
  feedback.interceptors.request.use(async config => {
    const userInfo = getLegacyUserInfo() || {}
    if (userInfo.Token) config.headers.token = userInfo.Token
    if (userInfo.Realm) config.headers.realm = userInfo.Realm
    config.headers['Lz-Platform'] = window.__LZ_IS_PAD_DEVICE__ ? 'PAD' : 'PC'
    const method = (config.method || 'get').toUpperCase()
    const params = method === 'GET' ? config.params || {} : config.data
    if (typeof FormData !== 'undefined' && params instanceof FormData) {
      const values = {}
      params.forEach((value, key) => { values[key] = value })
      const signed = await generateFeedbackSignParams(values)
      Object.keys(signed).forEach(key => params.set(key, signed[key]))
      return config
    }
    if (params && Object.prototype.toString.call(params) === '[object Object]') {
      const signed = await generateFeedbackSignParams(params)
      if (method === 'GET') config.params = signed
      else { config.headers['Content-Type'] = 'application/json'; config.data = signed }
    }
    return config
  })
  feedback.interceptors.response.use(response => response.data, error => {
    if (error.response?.status === 401) callLegacy('$refreshLIDToken', Date.now())
    return Promise.reject(error.response?.data || error)
  })
  return feedback
}

export const feedbackAppId = process.env.Feedback?.APPID || ''
export const feedbackPrivateKey = process.env.Feedback?.PRIVATE_KEY || ''
export async function generateFeedbackSignParams(params = {}) {
  const base = { appId: feedbackAppId, nonce: generateRandomString(10), timestamp: new Date().getTime(), sign_type: 'RSA2', ...params }
  base.sign = await signWithKey(serialization(base), feedbackPrivateKey)
  return base
}

async function signWithKey(str, key) {
  const privateKey = getPrivateKey(key)
  const signer = new jsrsasign.KJUR.crypto.Signature({ alg: 'SHA256withRSA' })
  signer.init(jsrsasign.KEYUTIL.getKey(privateKey))
  signer.updateString(str)
  return jsrsasign.hextob64(signer.sign())
}

export const feedbackRequest = createFeedbackRequest()

const instance = axios.create({
  baseURL: process.env.GATEWAY,
  timeout: Config.timeout,
  paramsSerializer(params) {
    return Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null)
      .map(key => `${key}=${encodeURIComponent(params[key])
        .replace(/%3A/gi, ':')
        .replace(/%24/g, '$')
        .replace(/%2C/gi, ',')
        .replace(/%20/g, '+')}`)
      .join('&')
  }
})

instance.interceptors.request.use(
  async config => {
    // 商店渠道（fromChannelName 存在）的 token/realm 在 channelInfo.channelUserInfo，普通登录在 userInfo。
    const useChannelInfo = typeof window !== 'undefined' && window.location.hash.indexOf('fromChannelName=') !== -1
    const userInfo = getLegacyUserInfo(useChannelInfo)
    if (userInfo && userInfo.Token) {
      config.headers['token'] = userInfo.Token
    }
    if (userInfo && userInfo.Realm) {
      config.headers['realm'] = userInfo.Realm
    }
    if (window.LZ_SERVER_ENV_QA) {
      config.headers['n-d-version'] = 'qa'
    }
    if ((window.__LZ_IS_BELLATOR_DEVICE__)) {
      config.headers['clientType'] = 3
    }

    config.headers['Lz-Platform'] = (window.__LZ_IS_PAD_DEVICE__) ? 'PAD' : 'PC'
    const requestMethod = config.method.toLocaleUpperCase()
    if (['PUT', 'POST', 'DELETE', 'PATCH'].includes(requestMethod)) {
      const requestBody = config.data
      if (Object.prototype.toString.call(requestBody) === '[object Object]') {
        config.headers['Content-Type'] = 'application/json'
        config.data = await generateSignParams(requestBody)
      }

      if (Object.prototype.toString.call(requestBody) === '[object FormData]') {
        const data = {}
        requestBody.forEach((value, key) => {
          data[key] = value
        })
        const signData = await generateSignParams(data)
        requestBody.set('appId', signData.appId)
        requestBody.set('nonce', signData.nonce)
        requestBody.set('timestamp', signData.timestamp)
        requestBody.set('sign_type', signData.sign_type)
        requestBody.set('sign', signData.sign)
      }
    } else {
      const requestParams = config.params || {}
      if (Object.prototype.toString.call(requestParams) === '[object Object]') {
        const _params = {}
        const urlSearch = new URL(config.baseURL + config.url).search
        new URLSearchParams(urlSearch).forEach((value, key) => {
          _params[key] = value
        })
        const signData = await generateSignParams({
          ..._params,
          ...requestParams
        })
        requestParams.appId = signData.appId
        requestParams.nonce = signData.nonce
        requestParams.timestamp = signData.timestamp
        requestParams.sign_type = signData.sign_type
        requestParams.sign = signData.sign
        config.params = requestParams
      }
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    const id = new Date().getTime();
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

      if (error.response.data) {
        return Promise.reject(error.response.data)
      }
    }

    return Promise.reject(error)
  }
)

export default instance
