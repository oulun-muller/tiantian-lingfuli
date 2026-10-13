import request from '@/utils/request.js'

/**
 * @description H5 生成支付链接
 */
export function getPayUrl(data) {
  return request({
    url: `/cloud-legionzone-game-core/api/v1/legionuserorder/payurl`,
    method: 'post',
    data
  })
}

/**
 * @description H5 根据orderId查询订单信息
 */
export function getOrderDetail(orderId, data) {
  return request({
    url: `/cloud-legionzone-game-core/api/v1/legionuserorder/${orderId}`,
    method: 'post',
    data
  })
}
