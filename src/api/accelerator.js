import signRequest from '@/utils/signRequest.js'

/**
 * 迅游加速器套餐相关接口
 * 后端契约：cloud-legionzone-game 的 LegionProductController.selectListV2
 *   POST /cloud-legionzone-game-mobile-core/api/v2/legionproduct，@RequireSign + @RequireNonce（对应 signRequest）
 *   服务前缀 /cloud-legionzone-game-mobile-core（网关按服务名路由，迅游链路统一走新服务）
 *   body: { productFirstType: 1, source: 4, status: 1 }（1=加速器，4=迅游，status:1 只查启用）
 *   resp: R<List<ApiLegionProductResp>>，code===10000 成功
 */

// 来源：2-流星 3-雷神 4-迅游（后端 ProductSourceEnum）
export const PRODUCT_SOURCE = {
  LX: 2,
  LEISHEN: 3,
  XUNYOU: 4
}

// 商品一级类型：1-加速器 2-单机杂志
export const PRODUCT_FIRST_TYPE = {
  ACCELERATOR: 1,
  MAGAZINE: 2
}

// 商品类型：1包月 2计时 3连续包月
export const PRODUCT_TYPE = {
  MONTHLY: 1,
  TIMING: 2,
  AUTO_RENEW: 3
}

/**
 * 查询迅游加速器套餐列表
 * @returns {Promise<Array>} 套餐数组，字段见 ApiLegionProductResp
 *   id / productName / productOriginalPriceYuan / productCurrentPriceYuan
 *   productType / source / promotionInfo / sort / status
 */
export function getXunyouPackages() {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v2/legionproduct',
    method: 'POST',
    data: {
      productFirstType: PRODUCT_FIRST_TYPE.ACCELERATOR,
      source: PRODUCT_SOURCE.XUNYOU,
      status: 1 // 只查启用套餐（参照雷神套餐调用 gameCenter.js:481）
    }
  }).then(res => {
    if (!res || res.code !== 10000) {
      throw new Error(res?.message || '获取网游加速器套餐失败，请稍后重试')
    }
    const list = Array.isArray(res.data) ? res.data : []
    // source=4 迅游（后端可能返回全部 source，前端再过滤一次保证只显示迅游套餐）
    const xunyouList = list.filter(item => item.source === PRODUCT_SOURCE.XUNYOU)
    // 按后端 sort 升序，无 sort 的置后
    return xunyouList.sort((a, b) => {
      const sa = a?.sort ?? Number.MAX_SAFE_INTEGER
      const sb = b?.sort ?? Number.MAX_SAFE_INTEGER
      return sa - sb
    })
  })
}

// ============================================================
// 迅游「加速器」下单 / 轮询（后端新增接口，与雷神完全独立）
// 命名带 Accelerator：迅游后续若接入「变声」，应新增独立的 api 方法，避免混淆。
// ============================================================

/**
 * 迅游加速器支付产品码。
 * 产品规则：
 *  - 普通套餐（包月/包天）：App 内直接调起 微信 / 支付宝；未装钱包则展示二维码支付
 *  - 连续包月：微信不支持连续包月，仅支持支付宝代扣；未装支付宝则展示二维码代扣支付
 * 注：迅游只在 App 内支付，无微信浏览器 H5 场景，因此不使用 WX_JS / WX_DK_JS
 */
export const XUNYOU_ACCELERATOR_PAY_CODE = {
  // 普通套餐
  ALI: 'ALI_MB', // 支付宝移动支付（拉起）
  WX: 'WX_MB', // 微信移动支付（拉起）
  QR: 'COLLECT_CODE', // 聚合二维码支付（微信/支付宝均可扫）
  // 连续包月（仅支付宝代扣）
  ALI_DK: 'ALI_DK_MB', // 支付宝移动代扣（已装支付宝：拉起并签约）
  // 未装支付宝：支付宝扫码代扣，前端渲染二维码并提示「使用支付宝扫码」签约。
  // 注意：不能换成 COLLECT_DK_CODE —— 那是聚合码代扣，在 Pay+ 强制要微信 planId
  // 模板（不传直接返回 400 planId not null），且与「支付宝扫码」的提示语义不符。
  QR_DK: 'ALI_DK_SC' // 支付宝扫码代扣（扫码签约）
}

/**
 * 客户端来源兜底值：3 = 网页-移动端（沿用现有 H5PayReq 约定）。
 * 端内（App）应由调用方按 1=完整版 / 2=lite版 传入，后端仅用于来源统计，不影响支付链路。
 */
export const XUNYOU_CLIENT_SOURCE = 3

/**
 * 迅游下单「业务拦截」返回码：已有自动续费服务生效中（后端用 R.failed(null, 1, msg) 返回）。
 * 与普通失败（FAIL_CODE=500）区分：这不是支付失败，要把后端文案作为业务提示原样展示。
 * 口径与雷神下单接口一致（雷神前端同样按 code===1 分支处理）。
 */
export const XUNYOU_ORDER_BIZ_BLOCK_CODE = 1

/**
 * 迅游加速器下单：创建待支付订单并返回支付/签约链接。
 * 后端契约：XunyouAcceleratorOrderController#getPayUrl
 *   POST /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/payurl
 *   body: { productId, payProductCode, clientSource }
 *   resp: R<OrderPayUrlResp>，code===10000 成功，data: { orderId, payUrl, payPrice, ... }
 * @param {Object} params
 * @param {number|string} params.productId 套餐 id（legion_product.id，source=4 且为加速器）
 * @param {string} params.payProductCode 见 XUNYOU_ACCELERATOR_PAY_CODE
 * @returns {Promise<{orderId:number|string, payUrl:string, payPrice:number}>}
 */
export function createXunyouAcceleratorOrder({ productId, payProductCode, clientSource = XUNYOU_CLIENT_SOURCE }) {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/payurl',
    method: 'POST',
    data: { productId, payProductCode, clientSource }
  }).then(res => {
    if (!res || res.code !== 10000 || !res.data) {
      // 后端失败时 message/msg 二选一，兜底给通用文案
      const error = new Error(res?.message || res?.msg || '下单失败，请稍后重试')
      // 保留业务码：调用方要区分「已有生效协议」这类业务拦截与真正的下单失败
      error.code = res?.code
      throw error
    }
    return res.data
  })
}

/**
 * 加速器订单列表（分页）——「我的订单 - 加速器订单」tab 的数据来源。
 *
 * 后端契约：XunyouAcceleratorOrderController#searchOrders
 *   POST /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/search
 *   body: { current, size }（signRequest 会自动补齐签名公共字段）
 *   resp: R<Page<OrderListQueryResp>>，code===10000 成功
 *     data.records: [{ orderId, productName, payPriceYuan, orderPriceYuan,
 *                      payTimeStr, payChannelName, orderStatusName, orderType, ... }]
 *
 * 注意：
 *  - 这是迅游专属端点，后端固定按 source=4（迅游）+ 加速器 + 状态 2/3/4
 *    （支付完成/退款中/退款完成）过滤，未支付与已失效订单不会返回，
 *    前端不需要传 source，也不要再自行过滤；
 *  - 不要改回 /api/v1/legionuserorder/search：那是雷神/流星/单机杂志共用的
 *    老接口，为避免影响老逻辑，迅游单独走本端点；
 *  - 分页参数必须放在 body：老接口把 current/size 放在 URL 上，
 *    会让「只签请求体」的 signRequest 验签失败；
 *  - 该接口带 @RequireSign + @RequireNonce，必须走 signRequest。
 *
 * @param {Object} params
 * @param {number} params.current 页码，从 1 开始
 * @param {number} params.size 每页条数，后端上限 100
 * @returns {Promise<{records:Array, total:number}>}
 */
export function getAcceleratorOrders({ current = 1, size = 10 } = {}) {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/search',
    method: 'POST',
    data: { current, size }
  }).then(res => {
    if (!res || res.code !== 10000) {
      throw new Error(res?.message || res?.msg || '获取订单列表失败，请稍后重试')
    }
    return {
      records: res.data?.records || [],
      total: res.data?.total || 0
    }
  })
}

/**
 * 迅游加速器订单状态轮询（迅游专属接口，与雷神/流星的订单查询完全独立）。
 *
 * 后端契约：XunyouAcceleratorOrderController#queryOrder
 *   POST /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/query/{orderId}
 *   body: {} （signRequest 会自动补齐签名公共字段）
 *   resp: R<LegionUserOrderResp>，code===10000 成功，data.orderStatus：1待支付/2支付成功/3退款中/4退款成功
 *
 * 说明：不要改用雷神的 /api/v1/legionuserorder/{orderId}——
 * 那是雷神/流星专用端点，迅游有独立的专属端点，互不影响。
 *
 * 轮询场景不做抛错处理：网络抖动返回 null，由调用方继续轮询。
 * @param {number|string} orderId createXunyouAcceleratorOrder 返回的 orderId
 * @returns {Promise<Object|null>} R<LegionUserOrderResp>；失败返回 null
 */
export function queryXunyouAcceleratorOrder(orderId) {
  return signRequest({
    url: `/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/query/${orderId}`,
    method: 'POST',
    data: {}
  }).catch(() => null)
}

/**
 * 查询当前用户生效中的迅游自动续费协议（C 端「管理自动续费」）。
 *
 * 后端契约：XunyouAcceleratorOrderController#listAgreements
 *   GET /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/agreements
 *   resp: R<List<LegionUserAgreementOrderResp>>，
 *         data: [{ id, startTime, serviceContent, productChannelName, nextPayTime, nextPayPrize }]
 *
 * 说明：该接口只返回迅游协议；雷神/流星有各自的 /api/v1/legionuseragreementorder。
 * @returns {Promise<Array>} 协议列表（无则空数组）
 */
export function getXunyouAgreements() {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/agreements',
    method: 'GET',
    params: {}
  }).then(res => {
    if (!res || res.code !== 10000) {
      throw new Error(res?.message || '获取自动续费信息失败，请稍后重试')
    }
    return Array.isArray(res.data) ? res.data : []
  })
}

/**
 * 取消迅游连续包月（停止后续代扣）。
 *
 * 后端契约：XunyouAcceleratorOrderController#cancelAgreement
 *   POST /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/cancel
 *   body: { agreementOrderId }（取自 getXunyouAgreements 返回的 id）
 *   resp: R<Object>，code===10000 成功
 *
 * 说明：后端会用「迅游专属 Pay+ 身份」解约；雷神/流星仍走 /api/v1/legionuserorder/cancel。
 * @param {number|string} agreementOrderId 协议 id
 * @returns {Promise<Object>} R<Object>
 */
export function cancelXunyouAgreement(agreementOrderId) {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/cancel',
    method: 'POST',
    data: { agreementOrderId }
  }).then(res => {
    if (!res || res.code !== 10000) {
      throw new Error(res?.message || '取消失败，请稍后重试')
    }
    return res
  })
}


/**
 * 查询当前用户可领取的迅游福利。
 *
 * 后端契约：XunyouAcceleratorOrderController#giftAvailable
 *   POST /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/gift/available
 *   body: {}（signRequest 会自动补齐签名公共字段）
 *   resp: R<List<XunyouGiftAvailableResp>>，code===10000 成功
 *     data: [{ giftConfigId, giftType, userType, intervalDays, durationDays, claimable, reason }]
 *
 * 说明：
 *  - giftType：1-新人福利 2-回归福利；userType：1-新会员 2-非付费会员 3-付费会员；
 *  - 回归福利的过期间隔由后端配置下发（intervalDays），前端不要写死天数；
 *  - 参数必须放 body：后端验签串包含 URL 查询参数，而 signRequest 只签请求体；
 *  - 不要改回 /api/v1/legionuserorder/search，迅游福利走专属端点。
 *
 * @returns {Promise<Array>} 福利列表（无匹配配置时为空数组）
 */
export function getXunyouGifts() {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/gift/available',
    method: 'POST',
    data: {}
  }).then(res => {
    if (!res || res.code !== 10000) {
      throw new Error(res?.message || '获取福利失败，请稍后重试')
    }
    return Array.isArray(res.data) ? res.data : []
  })
}

/**
 * 领取迅游福利。
 *
 * 后端契约：XunyouAcceleratorOrderController#giftClaim
 *   POST /cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/gift/claim
 *   body: { giftConfigId }
 *   resp: R<Object>，code===10000 成功
 *
 * 说明：新人福利一生一次（重复领取后端返回业务异常），
 * 回归福利按后台配置的过期间隔可重复领取。
 *
 * @param {number|string} giftConfigId 福利配置 id（取 getXunyouGifts 返回的 giftConfigId）
 * @returns {Promise<Object>} R<Object>
 */
export function claimXunyouGift(giftConfigId) {
  return signRequest({
    url: '/cloud-legionzone-game-mobile-core/api/v1/xunyouacceleratororder/gift/claim',
    method: 'POST',
    data: { giftConfigId }
  }).then(res => {
    if (!res || res.code !== 10000) {
      throw new Error(res?.message || '领取失败，请稍后重试')
    }
    return res
  })
}
