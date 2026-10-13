import JsEncrypt from 'jsencrypt'
import Base64 from '@/utils/base64'

// 反馈参数加密公钥，与服务端 deviceNo/lenovoid/sn 解密私钥配对（老项目硬编码值，勿用 env 的 Feedback.PUBLIC_KEY）。
export const FEEDBACK_PARAMETER_PUBLIC_KEY = '-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4sr8zNvtKXhvmnvgv/64/YS1LGRKMg/Hgb0nZOGVQH3/Rr6PBz0LBlX7vherxbmz8z8ZxLRkKQQfDvM43/yHgPwdSo5iNkeQKuANYaBq9cGmI5d/XZsw4wCJWTOeqGM2MO7bk0Yqj0/eSYAoHm9kIqLv2AJsSTmRTio5mZ4qo0wIDAQAB-----END PUBLIC KEY-----'

// 将 Base64 编码的 PKCS#8 DER 密钥（反馈私钥）转成 jsencrypt 可用的 PEM 格式。
function getPrivateKey(privateKeyValue) {
  if (!privateKeyValue) {
    throw new Error('Missing feedback RSA private key')
  }
  if (privateKeyValue.indexOf('-----BEGIN') === 0) {
    return privateKeyValue
  }
  const decodedKey = Base64.decode(privateKeyValue)
  if (decodedKey.indexOf('-----BEGIN') === 0) {
    return decodedKey
  }
  return ''
}

export function rsaEncrypt(value, key = FEEDBACK_PARAMETER_PUBLIC_KEY) {
  const encryptor = new JsEncrypt()
  encryptor.setPublicKey(key)
  return encryptor.encrypt(String(value))
}

export function rsaEncryptLong(value) {
  const encryptor = new JsEncrypt()
  encryptor.setPublicKey(FEEDBACK_PARAMETER_PUBLIC_KEY)
  const key = encryptor.getKey()
  const chunks = String(value).match(/.{1,100}/g) || ['']
  return hexToBase64(chunks.map(chunk => key.encrypt(chunk)).join(''))
}

export function rsaDecryptLong(value) {
  if (!process.env.Feedback?.PRIVATE_KEY) return false
  const encryptor = new JsEncrypt()
  encryptor.setPrivateKey(getPrivateKey(process.env.Feedback.PRIVATE_KEY))
  const key = encryptor.getKey()
  const hex = base64ToHex(value)
  const size = ((key.n.bitLength() + 7) >> 3) * 2
  return (hex.match(new RegExp(`.{1,${size}}`, 'g')) || []).map(chunk => key.decrypt(chunk)).join('')
}

function base64ToHex(value) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''; let bits = 0; let buffer = 0
  for (const char of value.replace(/=+$/, '')) {
    const index = chars.indexOf(char)
    if (index < 0) continue
    buffer = (buffer << 6) | index; bits += 6
    if (bits >= 8) { bits -= 8; result += (buffer >> bits & 255).toString(16).padStart(2, '0') }
  }
  return result
}

function hexToBase64(value) {
  let binary = ''
  for (let index = 0; index < value.length; index += 2) binary += String.fromCharCode(parseInt(value.slice(index, index + 2), 16))
  return btoa(binary)
}
