import Axios from 'axios'
import { getToken, getRealm } from '@/components/RealNameAuthentication/authentication.js'
import { getsignpart } from '@/utils/index.js'
import jsrsasign from 'jsrsasign'
import { getConfigByKey } from '@/api'
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

export async function generateNewParams(data = {}) {
  data = Object.assign({
    nonce: getsignpart().nonce,
    sign_type: getsignpart().sign_type,
    timestamp: getsignpart().timestamp
  }, data)

  const str = generateSignStr(data)
  data.sign = await signature(str)

  return data
}

async function signature(signParams) {
  const signPrivateKey = ''
  const rsa = jsrsasign.KEYUTIL.getKey(signPrivateKey)
  const sig = new jsrsasign.KJUR.crypto.Signature({ 'alg': 'SHA256withRSA' })
  sig.init(rsa)
  sig.updateString(signParams)
  const sign = jsrsasign.hextob64(sig.sign())
  return sign
}

// ai 获取权限接口
export const getAiPermission = () => {
  const data = {
    lpsust: getToken() || 'ZAgAAAAAAAGE9MTAyOTk2NjczNTQmYj0yJmM9MSZkPTkwNjEmZT01ODcyQTI3NUZDNkYxMzkxQTVDOEI0MkIxNjQ5ODI5OTEmaD0xNzU4NTA3MjgzODk5Jmk9NDMyMDAmbz00YTM0MTU1MmMyNGY0M2QwOWI2ODg2ODM3YjM0NjFkNCZwPW1hYyZxPTAmdXNlcm5hbWU9bGl1a2UyJTQwcXEuY29tJmFtcj1wd2QmaWw9Y24SrrmF-jcgZ8PmW3ebOyt_',
    realm: getRealm() || 'com.zui.game.service',
    client_id: '1482503198688640',
    client_secret: '',
    grant_type: 'lenovoid'
  }
  // return signRequest({
  //   url: '/cloud-auth/oauth/token',
  //   method: 'POST',
  //   data
  // })

  const url = `https://cloud-rest.lenovomm.com/cloud-auth/oauth/token`
  const formData = new URLSearchParams(data)

  return Axios.post(url, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(res => {
    return Promise.resolve(res.data)
  }).catch((error) => {
    return Promise.reject(error.response.data)
  })
}
/**
 * @description 获取猜你喜欢内容
 * @returns {Object}

 */
export async function getGuessYouLike() {
  const res = await getConfigByKey('AI_RECOMMENDED_WORDS')

  if (res) {
    return JSON.parse(res)
  }
  return []
}

