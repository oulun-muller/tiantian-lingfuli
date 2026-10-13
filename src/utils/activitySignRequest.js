import axios from 'axios'
import jsrsasign from 'jsrsasign'
import Config from '@/config'
// import store from '@/store'
import Base64 from '@/utils/base64'
import { getLegacyStore, getLegacyUserInfo } from '@/compat/legacyGlobals'
import { refreshLIDToken, markLidTokenFresh } from '@/bridge/legionZoneMobile'

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
 * 字符串签名
 * @param {String} str - 待签名的字符串
 * @returns 签名后的字符串
 */
async function signature(str = '') {
  const privateKeyBase64 = process.env.PRIVATE_KEY
  const privateKey = Base64.decode(privateKeyBase64)
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
async function generateSignParams(params) {
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
    const useChannelInfo = window.location.hash.indexOf('fromChannelName=') !== -1
    const userInfo = getLegacyUserInfo(useChannelInfo) || {}
    if (!config.skipAuthHeaders) {
      if (userInfo && userInfo.Token) {
        config.headers['token'] = userInfo.Token
      }
      if (userInfo && userInfo.Realm) {
        config.headers['realm'] = userInfo.Realm
      }
    } else {
      if (config.headers) {
        delete config.headers.token
        delete config.headers.realm
      }
    }
    if (window.LZ_SERVER_ENV_QA) {
      config.headers['n-d-version'] = 'qa'
    }
    if ((window.__LZ_IS_BELLATOR_DEVICE__)) {
      config.headers['clientType'] = 3
    }
    // 仅福利网关在手机上报 PHONE；其它活动接口保持原 PAD/PC，避免误伤活动专区
    const isWelfareApi = String(config.url || '').includes('/api/v1/welfare')
    config.headers['Lz-Platform'] = (isWelfareApi && window.__LZ_IS_PHONE_DEVICE__)
      ? 'PHONE'
      : ((window.__LZ_IS_PAD_DEVICE__) ? 'PAD' : 'PC')
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
    const id = new Date().getTime()
    const status = error?.response?.status
    const originalRequest = error?.config
    // 福利失败已有 LZ_welfareCenterLoadState，不打活动页这条
    const reqUrl = `${originalRequest?.baseURL || ''}${originalRequest?.url || ''}`
    const skipActivityNotExposed = reqUrl.includes('/api/v1/welfare')

    // 401：先问端侧还登不登着。已登录则重新取票再打一次；没登录不续票。
    if (status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true
      return refreshLIDToken(5000).then(newUserInfo => {
        if (newUserInfo?.Token) {
          markLidTokenFresh()
          const token = newUserInfo.Token
          const realm = newUserInfo.Realm
          originalRequest.headers = originalRequest.headers || {}
          if (!originalRequest.skipAuthHeaders) {
            originalRequest.headers.token = token
            if (realm) {
              originalRequest.headers.realm = realm
            }
          }
          const store = getLegacyStore()
          store?.dispatch('user/syncLIDToken', token).catch(() => {})
          return instance(originalRequest)
        }
        return Promise.reject(error.response?.data || error)
      })
    }

    if (!skipActivityNotExposed) {
      (window.__LZ_DATA_REPORT__)(
        'LZ_gamingCenter',
        'LZ_eventPageNotExposedReason',
        '',
        {
          details: JSON.stringify({
            id,
            token: error?.config?.headers?.token || '',
            errtype: status,
            errmess: JSON.stringify(error?.response?.data)
          })
        }
      )
    }

    if (error.response) {
      const data = error.response.data
      if (data && typeof data === 'object') {
        data.httpStatus = status
      }
      if (status === 401) {
        return Promise.reject(data || error)
      }
      if (data) {
        return Promise.reject(data)
      }
    }

    return Promise.reject(error)
  }
)

export default instance
