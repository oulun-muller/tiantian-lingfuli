/**
 * Activity Message Helper
 * 统一管理活动页面的消息发送方式
 * 支持三种消息发送方式：
 * 1. activitySDK（JSSDK 桥接）
 * 2. iframe postMessage（渠道集成）
 * 3. 直接调用（LegionZone App）
 */

/**
 * 检查 ActivityJSBridge 是否可用
 * @returns {boolean}
 */
function isActivityJSBridgeAvailable() {
  return typeof window.ActivityJSBridge !== 'undefined' &&
    typeof window.ActivityJSBridge.nativeCall === 'function'
}

/**
 * 发送消息的统一入口
 * @param {Object} options - 消息配置
 * @param {string} options.type - 消息类型
 * @param {Object} options.payload - 消息载荷
 * @param {boolean} options.fromChannel - 是否来自渠道
 * @param {Function} options.fallback - 降级回调函数（非 SDK 非渠道时执行）
 */
export function sendMessage(options) {
  const { type, payload = {}, fromChannel, fallback } = options

  // 优先使用 ActivityJSBridge
  if (isActivityJSBridgeAvailable()) {
    return sendViaActivityJSBridge(type, payload)
  }

  // 其次使用 iframe postMessage（渠道）
  if (fromChannel) {
    return sendViaPostMessage(type, payload)
  }

  // 最后执行降级逻辑（直接调用）
  if (typeof fallback === 'function') {
    return fallback()
  }
}

/**
 * 通过 ActivityJSBridge 发送消息
 * @param {string} type - 消息类型
 * @param {Object} payload - 消息载荷
 */
function sendViaActivityJSBridge(type, payload) {
  return window.ActivityJSBridge.nativeCall('Activity', type, payload)
    .then(res => {
      return JSON.parse(res)
    })
    .catch(err => {
      console.error('[MessageHelper] ActivityJSBridge 错误:', type, err)
      throw err
    })
}

/**
 * 通过 postMessage 发送消息（渠道）
 * @param {string} type - 消息类型
 * @param {Object} payload - 消息载荷
 */
function sendViaPostMessage(type, payload) {
  const message = { type }

  // 根据消息类型决定是否包含 payload
  if (Object.keys(payload).length > 0) {
    message.payload = payload
  }

  // 特殊处理：某些消息类型的参数直接放在顶层
  if (type === 'ACTIVITY_GET_USER_INFO' && 'showLoginPop' in payload) {
    message.showLoginPop = payload.showLoginPop
  }

  top.postMessage(JSON.stringify(message), '*')
}

/**
 * 获取用户信息
 * @param {Object} options
 * @param {boolean} options.showLoginPop - 是否显示登录弹窗
 * @param {boolean} options.fromChannel - 是否来自渠道
 * @param {Function} options.fallback - 降级回调
 * @returns {Promise|undefined} 使用 ActivityJSBridge 时返回 Promise，其他情况无返回值
 */
export function getUserInfo(options = {}) {
  return sendMessage({
    type: 'ACTIVITY_GET_USER_INFO',
    payload: {
      showLoginPop: options.showLoginPop !== false
    },
    fromChannel: options.fromChannel,
    fallback: options.fallback
  })
}

/**
 * 执行任务
 * @param {Object} options
 * @param {string} options.softId - 软件 ID
 * @param {string} options.taskType - 任务类型
 * @param {string} options.taskId - 任务 ID
 * @param {string} options.taskName - 任务名称
 * @param {Object} options.extraParams - 额外参数
 * @param {boolean} options.fromChannel - 是否来自渠道
 * @param {Function} options.fallback - 降级回调
 */
export function doTask(options = {}) {
  sendMessage({
    type: 'ACTIVITY_DO_TASK',
    payload: {
      pkgName: options.pkgName,
      softId: options.softId,
      taskType: options.taskType,
      taskId: options.taskId,
      taskName: options.taskName,
      extraParams: options.extraParams
    },
    fromChannel: options.fromChannel,
    fallback: options.fallback
  })
}

/**
 * 发送第三方 URL
 * @param {Object} options
 * @param {string} options.url - 第三方 URL
 * @param {string} options.urlType - URL 类型
 * @param {boolean} options.fromChannel - 是否来自渠道
 * @param {Function} options.fallback - 降级回调
 */
export function sendThirdUrl(options = {}) {
  sendMessage({
    type: 'ACTIVITY_THIRD_URL',
    payload: {
      url: options.url,
      urlType: options.urlType
    },
    fromChannel: options.fromChannel,
    fallback: options.fallback
  })
}

/**
 * 获取回调地址
 * @param {Object} options
 * @param {string} options.activityId - 活动 ID
 * @param {Object} options.businessParams - 业务参数
 * @param {boolean} options.fromChannel - 是否来自渠道
 * @param {Function} options.fallback - 降级回调
 * @returns {Promise|undefined} 使用 ActivityJSBridge 时返回 Promise，其他情况无返回值
 */
export function getCallbackUrl(options = {}) {
  return sendMessage({
    type: 'ACTIVITY_GET_CALLBACK_URL',
    payload: {
      activityId: options.activityId,
      businessParams: options.businessParams
    },
    fromChannel: options.fromChannel,
    fallback: options.fallback
  })
}
