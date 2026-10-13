import Axios from 'axios'
import jsrsasign from 'jsrsasign'
import { randomString } from '@/utils'
import JsEncrypt from 'jsencrypt'
import { getLegacyUserInfo } from '@/compat/legacyGlobals'

/**
 * RSA加密
 */
export function encryptStr(str) {
  const encrypt = new JsEncrypt()
  encrypt.setPublicKey(process.env.RealNameAuthentication.PUBLIC_KEY)
  return encrypt.encrypt(str)
}

/**
 * @description 生成基本入参
 * @returns {Object}
 */
function generateBaseParams() {
  return {
    appId: process.env.RealNameAuthentication.APPID,
    nonce: randomString(10),
    sign_type: 'RSA2',
    timestamp: new Date().getTime()
  }
}

/**
 * @description: 进行参数加密处理
 * @param:
 */
export async function signature(signParams) {
  const data = process.env.RealNameAuthentication.privateKey
  const rsa = jsrsasign.KEYUTIL.getKey(data)
  const sig = new jsrsasign.KJUR.crypto.Signature({ 'alg': 'SHA256withRSA' })
  sig.init(rsa)
  sig.updateString(signParams)
  const sign = jsrsasign.hextob64(sig.sign())

  return sign
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
 * @description 获取Token
 * @returns {String}
 */
export function getToken() {
  const userInfo = getLegacyUserInfo()
  if (userInfo && userInfo.Token) {
    return userInfo.Token
  }

  return ''
}

/**
 * @description 获取Realm
 * @returns {String}
 */
export function getRealm() {
  const userInfo = getLegacyUserInfo()
  if (userInfo && userInfo.Realm) {
    return userInfo.Realm
  }

  return ''
}

/**
 * @description 获取网关
 * @returns {String}
 */
function getGatewayUrl() {
  return process.env.RealNameAuthentication.GATEWAY
}

/**
 * @description 实名认证查询
 * @returns {Object}
 */

export async function realNameAuthenticationQuery() {
  const url = `${getGatewayUrl()}/game-ms-user-identify-core/api/h5/gameCertification/certification`
  return Axios.get(url, {
    headers: {
      'Content-Type': 'application/json',
      'token': getToken(),
      'realm': getRealm()
    },
    params: await generateNewParams()
  }).then(res => {
    return Promise.resolve(res.data)
  }).catch((error) => {
    return Promise.reject(error.response)
  })
}

/**
 * @description 实名认证查询
 * @returns {Object}
 */

export async function goRealNameAuthentication(data) {
  const url = `${getGatewayUrl()}/game-ms-user-identify-core/api/v2/h5/gameCertification/certification`
  const params = await generateNewParams(data)

  return Axios.post(url, params, {
    headers: {
      'Content-Type': 'application/json',
      'token': getToken(),
      'realm': getRealm()
    }
  }).then(res => {
    return Promise.resolve(res.data)
  }).catch((error) => {
    return Promise.reject(error.response.data)
  })
}
