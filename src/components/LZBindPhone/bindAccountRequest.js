import Axios from 'axios'
import { callLegacy, getLegacyStore } from '@/compat/legacyGlobals'
// import store from '@/store'

const domainUrl = 'https://passport.lenovo.com'
/**
 * 使用DOMParser解析XML字符串
 */
function getXml(xmlString) {
  try {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml')
    if (xmlDoc && xmlDoc.getElementsByTagName('Error').length > 0) {
      const errorCodeElement = xmlDoc.getElementsByTagName('Code')[0]
      if (errorCodeElement) {
        const errorCode = errorCodeElement.textContent || errorCodeElement.innerText // 兼容不同浏览器
        return errorCode
      } else {
        return '<Code>元素未找到'
      }
    } else {
      return 'XML解析失败或<Error>元素未找到'
    }
  } catch (e) {
    return 'XML解析失败'
  }
}

/**
 * 获取验证码图片
 */
export function getVerifyImg({ randomStr }) {
  const isFromChannel = !!window.location.href.match(/fromChannelName=/)
  const store = getLegacyStore()
  const { Realm } = store?.state?.user?.userInfo || {}
  const { Realm: channelRealm } = store?.state?.channelInfo?.channelUserInfo || {}
  return Axios.get(`${domainUrl}/capt/1.2/getimage`, {
    params: {
      t: randomStr,
      source: `${isFromChannel ? channelRealm : Realm}_LegionZone`
    },
    responseType: 'arraybuffer'
  }).then(res => {
    let binary = ''
    const bytes = new Uint8Array(res.data)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return 'data:image/jpeg;base64,' + window.btoa(binary)
  }).catch(() => null)
}

function serializeData(data) {
  let str = ''
  for (const [key, value] of Object.entries(data)) {
    if (str !== '') {
      str += '&'
    }
    str += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  }
  return str
}

/**
 * 验证校验码
 */
export function verifyCodeByST({ phone, code, randomStr }) {
  const isFromChannel = !!window.location.href.match(/fromChannelName=/)
  const store = getLegacyStore()
  const { Realm, Token } = store?.state?.user?.userInfo || {}
  const { Realm: channelRealm, Token: channelToken } = store?.state?.channelInfo?.channelUserInfo || {}
  const formData = serializeData({
    username: phone,
    type: 5,
    realm: isFromChannel ? channelRealm : Realm,
    t: randomStr,
    code,
    lpsust: isFromChannel ? channelToken : Token
  })
  return Axios.post(`${domainUrl}/accounts/1.4/sendVerifyCodeByST`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(res => {
    callLegacy('$message', {
      message: '发送成功',
      type: 'success',
      duration: 2500,
      customClass: 'lg-message--success'
    })
    return true
  }).catch((err) => {
    if (err.response && err.response.data) {
      const xmlString = getXml(err.response.data)
      const xmlCode = {
        'USS-0121': '无效的realm',
        'USS-0540': '无效的ST',
        'USS-0135': '无效的请求参数',
        'USS-0140': '无效的图形验证码',
        'USS-0100': '用户名格式不正确，手机或邮箱格式有问题',
        'USS-0231': '相同类型账号不能绑定',
        'USS-0104': '用户已存在',
        'USS-0151': '多次请求会被锁定，需要10分钟后再尝试'
      }
      callLegacy('$message', {
        message: xmlCode[String(xmlString)],
        type: 'warning',
        duration: 2500,
        customClass: 'lg-message--warning'
      })
    }
    return false
  })
}
/**
 * 绑定手机号
 */
export function bindAccountByST({ phone, code }) {
  const isFromChannel = !!window.location.href.match(/fromChannelName=/)
  const store = getLegacyStore()
  const { Realm, Token, UserID } = store?.state?.user?.userInfo || {}
  const { Realm: channelRealm, Token: channelToken, UserID: channelUserID } = store?.state?.channelInfo?.channelUserInfo || {}
  const formData = serializeData({
    lpsust: isFromChannel ? channelToken : Token,
    realm: isFromChannel ? channelRealm : Realm,
    asaccount: phone,
    ascode: code,
    deviceidtype: 'muuid',
    deviceid: '00000000000',
    source: `${isFromChannel ? channelRealm : Realm}_LegionZone`
  })

  return Axios.post(`${domainUrl}/accounts/1.4/bindAccountByST`, formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(res => {
    callLegacy('$message', {
      message: '绑定成功',
      type: 'success',
      duration: 2500,
      customClass: 'lg-message--success'
    })
    callLegacy('$dataReport', 'user', 'LZ_bindPhoneNumberSucc', '', {
      detail: JSON.stringify({
        lenovoid: UserID || channelUserID,
        status: 1
      })
    })
    return true
  }).catch((err) => {
    if (err.response && err.response.data) {
      const xmlString = getXml(err.response.data)
      const xmlCode = {
        'USS-0140': '校验码错误',
        'USS-0540': 'ST错误',
        'USS-0121': 'realm停用或无法使用',
        'USS-0124': 'cache无数据，用户必须先请求发送验证码，才能绑定辅助账号，以防别人冒用',
        'USS-0135': '无效的请求参数',
        'USS-0104': '用户名已经存在',
        'USS-0103': '无此用户',
        'USS-0231': '绑定账号不符合规则',
        'USS-0100': '无效的用户名'
      }
      callLegacy('$message', {
        message: xmlCode[String(xmlString)],
        type: 'warning',
        duration: 2500,
        customClass: 'lg-message--warning'
      })
      callLegacy('$dataReport', 'user', 'LZ_bindPhoneNumberSucc', '', {
        detail: JSON.stringify({
          lenovoid: UserID,
          status: 2,
          errmsg: xmlCode[String(xmlString)]
        })
      })
    }
    return false
  })
}
