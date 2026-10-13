import Main from './Main/index.vue'
import { mountServiceComponent } from '@/compat/mountService'

/**
 * 调起无码预售购买弹窗（复用商城预售支付链路）
 * @param {String} option.firstId - 第一个 ID（拼接在 URL 路径中）
 * @param {String} option.secondId - 第二个 ID（拼接在 URL 路径中）
 * @param {String} option.taskId - 购买任务 ID（订单关联，可选）
 * @param {Function} option.onClose - 弹窗关闭回调
 */
export default function FHPay({
  firstId = '25271',
  secondId = '46251',
  taskId = '',
  onClose = null
} = {}) {
  mountServiceComponent(Main, {
    firstId,
    secondId,
    taskId,
    onClose
  })
}
