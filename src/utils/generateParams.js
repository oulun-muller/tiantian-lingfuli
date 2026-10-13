import { getsignpart, signature } from '../utils/index.js'
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
export async function generateNewParams(data = {}) {
  data = Object.assign(generateBaseParams(), data)
  const str = generateSignStr(data)

  data.sign = await signature(str)
  return data
}
