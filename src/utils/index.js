import jsrsasign from 'jsrsasign'
import Base64 from '@/utils/base64'
import { launchNNBBS } from '@/nativeApi/Pbase'
import LZConfirm from '@/components/LZConfirm'
/**
 * 获取字符串字节长度
 * @param {String} str - 字符串
 * @returns {Number} 字节长度
 */
export function getByteLength(str = '') {
  let byteLength = 0
  for (let i = 0, len = str?.length; i < len; i++) {
    byteLength += str.charCodeAt(i) > 255 ? 2 : 1
  }

  return byteLength
}

/**
 * @description: 所有post请求必须进行参数加密处理增加安全性
 * @param:
 * 请求接口中的所有参数
 */
export async function signature(signParams) {
  const data = process.env.PRIVATE_KEY
  const signPrivateKey = Base64.decode(data)
  const rsa = jsrsasign.KEYUTIL.getKey(signPrivateKey)
  const sig = new jsrsasign.KJUR.crypto.Signature({ 'alg': 'SHA256withRSA' })
  sig.init(rsa)
  sig.updateString(signParams)
  const sign = jsrsasign.hextob64(sig.sign())
  return sign
}
export function getsignpart() {
  const _data = {}
  _data.nonce = randomString(10)
  _data.appId = process.env.APPID
  _data.timestamp = new Date().getTime()
  _data.sign_type = 'RSA2'
  return _data
}

// 生成10个随机字符串
export function randomString(e) {
  e = e || 32
  const t = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  const a = t.length
  let n = ''
  for (let i = 0; i < e; i++) n += t.charAt(Math.floor(Math.random() * a))
  return n
}
export function parseUrl(url = '') {
  url = url || ''
  url = url.replace(/^(file:)?\/\//, 'http://')

  if (!/^https?:\/\//.test(url)) {
    url = 'http://' + url
  }

  return url
}

// 获取滚动内容的高度
export function getContentScroll(id) {
  // 获取id对应的DOM元素
  let idDom = null
  if (id) {
    idDom = document.getElementById(id)
  }
  // 获取id对应的DOM元素底部距离视口顶部的距离
  let idBottom = 0
  if (idDom) {
    idBottom = idDom.getBoundingClientRect().bottom
  }
  // 计算滚动内容的高度
  const height = `calc(100vh - ${idBottom}px)`
  // 返回滚动内容的高度
  return height
}

export function compareVersions(currentVersion, specifyVersion) {
  // 将版本号按点分割成数组
  const v1Parts = currentVersion.split('.').map(Number)
  const v2Parts = specifyVersion.split('.').map(Number)

  // 获取最大段数
  const maxLength = Math.max(v1Parts.length, v2Parts.length)

  // 逐段比较
  for (let i = 0; i < maxLength; i++) {
    // 如果某一段不存在，则视为 0
    const num1 = v1Parts[i] || 0
    const num2 = v2Parts[i] || 0

    if (num1 > num2) {
      return true // currentVersion 大于 specifyVersion
    } else if (num1 < num2) {
      return false // currentVersion 小于 specifyVersion
    }
  }

  // 如果所有段都相等，则两个版本号相等
  return true
}
/**
 * 获取首页弹框，首页运营位，导航栏跳转类型
 * @param {Number} 数字 1: 游戏中心，2：游戏中心详情，3：游戏中心详情并下载，4：活动，5：榜单列表，6：游戏中心子tab，7：我的设备子tab，8：我的游戏，9：社区，10：社区详情，11：服务中心，12：外部链接，13：自定义路由，14:小游戏聚合页，
 * @param {Object} 对象
 */
export function goToOperation(_jumpType, _jumpContent, source = '', router) {
  const defaultPath = {
    1: {
      path: '/gameCenter/index'
    },
    8: {
      name: 'MyGameIndex',
      query: {
        resetSource: true
      }
    },
    9: {
      path: `/forum/micro`,
      query: {
        firstLocal: 8
      }
    },
    11: {
      name: 'ServiceIndex'
    },
    14: {
      path: '/gameCenter/miniGame?isActiveTab=sidebarMiniGame&firstLocal=8'
    }
  }

  switch (_jumpType) {
    case 1:
    case 8:
    case 9:
    case 11:
    case 14:
      if (_jumpType === 1) {
        sessionStorage.setItem('GAME_CENTER_SOURCE_RECORD', 8)
      }

      router.push(defaultPath[_jumpType])
      break
    case 2:
    case 3:
      if (_jumpContent.softInfo?.id) {
        let _path = `/gameCenter/detail/${_jumpContent.softInfo.id}`
        if (_jumpType === 3) {
          _path = _path + '?actionName=autoClick'
        }
        router.push({
          path: _path,
          query: {
            firstLocal: 8,
            secondLocal: '',
            thirdLocal: ''
          }
        })
      }
      break
    case 4:
      if (_jumpContent.activityPageInfo?.id) {
        const _query = {
          firstLocal: source === 'navigationBar' ? 10 : 8,
          secondLocal: 11,
          thirdLocal: ''
        }

        if (source === 'navigationBar') {
          _query.isActiveTab = 'sidebarOperation'
        }

        router.push({
          path: `/gameCenter/online/index`,
          query: {
            id: _jumpContent.activityPageInfo.id,
            ..._query
          }
        })
      }
      break
    case 5:
      if (_jumpContent.rankingListInfo?.id) {
        sessionStorage.setItem('GAME_CENTER_SOURCE_RECORD', 8)
        router.push({
          path: '/gameCenter/list',
          query: {
            rankID: _jumpContent.rankingListInfo.id,
            rankName: _jumpContent.rankingListInfo.name
          }})
      }
      break
    case 6:
      if (_jumpContent.gameCenterTabInfo?.id) {
        const _path = {
          '1': '/gameCenter/index',
          '2': '/gameCenter/rankList?firstLocal=8',
          '3': '/gameCenter/cdkMall?firstLocal=8',
          '4': '/gameCenter/gameLibrary?firstLocal=8',
          '5': '/gameCenter/gameTools?firstLocal=8',
          '6': '/gameCenter/miniGame?firstLocal=8',
          '7': '/gameCenter/activityZone?firstLocal=8'
        }
        if (_jumpContent.gameCenterTabInfo.id !== '6') {
          sessionStorage.setItem('GAME_CENTER_SOURCE_RECORD', 8)
        }

        router.push({
          path: _path[_jumpContent.gameCenterTabInfo.id]
        })
      }
      break
    case 7:
      if (_jumpContent.myDeviceInfo?.id) {
        const _path = {
          '1': 'MyDeviceLighting',
          '2': 'MyDeviceDisplay',
          '3': 'MyDevicePower',
          '4': 'MyDeviceMore'
        }
        router.push({
          name: _path[_jumpContent.myDeviceInfo.id]
        })
      }
      break
    case 10:
      if (_jumpContent.postInfo?.id) {
        router.push({
          path: `/forum/micro/detail/${_jumpContent.postInfo.id}`,
          query: {
            forumSource: 4
          }
        })
      }
      break
    case 12:
    case 13:
      if (_jumpContent.urlLinkInfo?.url) {
        if (_jumpType === 12) {
          window.open(_jumpContent.urlLinkInfo.url, '_blank')
        } else {
          router.push({
            path: `${_jumpContent.urlLinkInfo.url}`,
            query: {
              firstLocal: 8
            }
          })
        }
      }
      break
  }
}

/**
 * 启动 NN 语音社区，若组件未安装则弹框引导用户前往官网重新安装
 * @param {string} url nn:// 协议 URL
 */
export async function launchNNBBSWithCheck(url) {
  const res = await launchNNBBS(url).catch(() => null)
  if (res?.ret !== 1) return

  try {
    await LZConfirm({
      type: 'warning',
      message: '检测到NN语音社区组件已被卸载，请前往官网重新安装Legion Zone恢复！',
      confirmButtonText: '前往官网',
      showCancelButton: false
    })
    window.open('https://legionzone.lenovo.com/', '_blank')
  } catch {
    // 用户取消，无需处理
  }
}
