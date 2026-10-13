<template>
  <!-- 迅游加速器专属支付弹窗：与 CDK 商城 MobilePayDialog 完全独立，避免影响原有购买链路 -->
  <div v-if="visible" class="accel-pay-layer" :class="placement === 'bottom' ? 'is-sheet' : 'is-modal'">
    <div class="accel-pay-mask" />

    <div class="accel-pay-dialog" :class="`accel-pay-dialog--${placement}`">
      <header class="accel-pay-header">
        <button
          type="button"
          class="accel-pay-icon-btn accel-pay-icon-btn--close"
          aria-label="关闭"
          @click="handleClose"
        >
          <img class="accel-pay-icon" :src="iconClose" alt="" />
        </button>
      </header>

      <div class="accel-pay-body" :class="`is-${step}`">
        <template v-if="step === 'qrcode'">
          <div class="accel-pay-amount">
            <p class="accel-pay-amount__label">付款金额</p>
            <p class="accel-pay-amount__row">
              <span class="accel-pay-amount__symbol">{{ order.currencySymbol }}</span>
              <span class="accel-pay-amount__value">{{ displayAmount }}</span>
            </p>
          </div>
          <div class="accel-pay-qr">
            <div class="accel-pay-qr__wrap">
              <img class="accel-pay-qr__image" :src="qrUrl" alt="扫码支付" />
            </div>
            <p class="accel-pay-qr__hint">
              <span>请使用</span>
              <span class="accel-pay-qr__brand">
                <img :src="qrBrandList[0].icon" alt="" />
                <span>{{ qrBrandList[0].label }}</span>
              </span>
              <template v-if="qrBrandList[1]">
                <span>或</span>
                <span class="accel-pay-qr__brand">
                  <img :src="qrBrandList[1].icon" alt="" />
                  <span>{{ qrBrandList[1].label }}</span>
                </span>
              </template>
              <span>扫码支付</span>
            </p>
          </div>
        </template>

        <div v-else-if="['loading', 'allocating', 'failure', 'blocked'].includes(step)" class="accel-pay-status">
          <div v-if="step === 'loading' || step === 'allocating'" class="accel-pay-status__spinner-wrap">
            <img class="accel-pay-status__spinner" :src="iconLoading" alt="" />
          </div>
          <img v-else class="accel-pay-status__caution" :src="iconCaution" alt="" />
          <p class="accel-pay-status__title">{{ statusTitle }}</p>
          <p v-if="order.failMessage || statusHint" class="accel-pay-status__hint">{{ order.failMessage || statusHint }}</p>
        </div>

        <template v-else-if="step === 'success'">
          <div class="accel-pay-success">
            <img class="accel-pay-success__icon" :src="iconCheckSuccess" alt="" />
            <p class="accel-pay-success__title">交易成功</p>
          </div>
          <div class="accel-pay-rule" />
          <div class="accel-pay-detail">
            <div
              v-for="row in successDetails"
              :key="row.key"
              class="accel-pay-detail__row"
            >
              <span class="accel-pay-detail__label">{{ detailLabel(row.key) }}</span>
              <span class="accel-pay-detail__group">
                <span class="accel-pay-detail__value">{{ row.value }}</span>
                <button
                  v-if="row.key === 'orderNo'"
                  type="button"
                  class="accel-pay-copy-btn"
                  aria-label="复制订单号"
                  @click.stop="copyText(row.value)"
                >
                  <img :src="iconCopy" alt="" />
                </button>
              </span>
            </div>
          </div>
        </template>
      </div>

      <button
        v-if="showFinishAction"
        type="button"
        class="accel-pay-footer accel-pay-footer--single"
        @click="handleClose"
      >
        完成
      </button>
      <div v-else class="accel-pay-footer accel-pay-footer--spacer" />
    </div>
  </div>
</template>

<script>
import iconClose from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-close.svg'
import iconCaution from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-caution.svg'
import iconLoading from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-loading.svg'
import iconCheckSuccess from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-check-success.svg'
import iconCopy from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-copy.svg'
import iconWechat from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-wechat.svg'
import iconAlipay from '@/views/GameCenter/Activity/Preorder/payment/assets/icon-alipay.svg'
import QRCode from 'qrcode'
import {
  createXunyouAcceleratorOrder,
  queryXunyouAcceleratorOrder,
  XUNYOU_ACCELERATOR_PAY_CODE,
  XUNYOU_CLIENT_SOURCE,
  XUNYOU_ORDER_BIZ_BLOCK_CODE
} from '@/api/accelerator.js'
import { checkThirdAppInstalled, openExternalUrl } from '@/nativeApiPad/common'

// 商品类型：3-连续包月（自动续费）
const PRODUCT_TYPE_AUTO_RENEW = 3
// 订单状态：2-支付成功；3-退款中 4-退款成功
const ORDER_STATUS_PAID = 2
const ORDER_STATUS_REFUND = [3, 4]

// 第三方钱包包名（原生 GETINSTALL 判定是否安装）
const WECHAT_PKG = 'com.tencent.mm'
const ALIPAY_PKG = 'com.eg.android.AlipayGphone'

const DETAIL_LABELS = {
  product: '商品',
  renew: '续费',
  orderNo: '订单号'
}

export default {
  name: 'AcceleratorPayDialog',
  emits: ['close', 'pay-success'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 选中的迅游套餐（legion_product，source=4）
    pkg: {
      type: Object,
      default: null
    },
    // 页面已选中的付款方式；弹窗直接按它下单，为空或当前套餐不支持时回退到首个可用方式
    payMethod: {
      type: String,
      default: ''
    },
    // 选中套餐在展示列表中的序号（页面侧计算，从 1 开始）：#41 的 planLocal
    planLocal: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      iconClose,
      iconCaution,
      iconLoading,
      iconCheckSuccess,
      iconCopy,
      // 弹窗不再展示确认页，打开即进入下单流程，初始态直接是 loading
      step: 'loading',
      method: 'wechat',
      // 下单进行中标记：端内需先异步查询钱包是否安装，异步期间
      // 若重复触发下单会生成两个订单（后者的订单号会覆盖前者的轮询目标）。
      submitting: false,
      order: {
        amount: 0,
        currencySymbol: '¥',
        details: [],
        orderNo: '',
        status: '',
        failMessage: '',
        // 业务拦截文案（如「已有自动续费服务生效中」）：与支付失败文案分开存放
        blockMessage: ''
      },
      qrUrl: '',
      pollOrderId: '',
      // 本次下单返回的订单 ID，供 #41 曝光埋点使用
      payOrderId: '',
      // #41 曝光去重标记：弹窗每次打开（resetFlow）算一次新生命周期
      payPopupShown: false,
      // #42 发起支付弹窗点击去重标记：pay / cancel 各自只报一次
      payPopupClickReported: [],
      // #43 支付结果去重标记：同一次弹窗生命周期只报一次成功/失败/取消/超时
      payResultReported: false,
      timer: null,
      pollTimer: null,
      pollStartTime: 0,
      pollCount: 0,
      placement: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'bottom' : 'center') : 'bottom'
    }
  },
  computed: {
    isApp() {
      return !!this.$store.state.system.version
    },
    /**
     * 客户端来源（对应后端 XunyouAcceleratorPayReq.clientSource）：
     *   1 = legion 完整版 App
     *   2 = legion lite 版 App
     *   3 = 网页-移动端
     *   4 = 网页-PC 端
     * 仅用于订单来源统计，不影响支付链路。
     * 说明：当前 store 未提供 isLiteVersion 标记，端内会落到 1（完整版）；
     * 后续若接入 lite 标记，只需让 isLiteVersion 有值即可自动上报 2。
     */
    clientSource() {
      if (!this.isApp) return XUNYOU_CLIENT_SOURCE
      return this.$store.state.system.isLiteVersion ? 2 : 1
    },
    // 连续包月仅支持支付宝代扣；普通套餐支持微信 + 支付宝
    isAutoRenew() {
      return Number(this.pkg?.productType) === PRODUCT_TYPE_AUTO_RENEW
    },
    payMethodList() {
      if (this.isAutoRenew) {
        return [{ key: 'alipay', label: '支付宝', icon: iconAlipay }]
      }
      return [
        { key: 'wechat', label: '微信', icon: iconWechat },
        { key: 'alipay', label: '支付宝', icon: iconAlipay }
      ]
    },
    qrBrandList() {
      return this.payMethodList
    },
    // 端外浏览器按设备类型分流：默认二维码，仅明确识别为手机才走 trade（与移动支付弹窗策略一致）
    deviceKind() {
      if (typeof navigator === 'undefined') return 'phone'
      const ua = navigator.userAgent || ''
      if (/iPhone|iPod/i.test(ua)) return 'phone'
      if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'phone'
      return 'pad'
    },
    showFinishAction() {
      return this.step === 'success'
    },
    displayAmount() {
      const value = Number(this.order.amount)
      if (Number.isNaN(value)) return '0.00'
      return value.toFixed(2)
    },
    statusTitle() {
      if (this.step === 'allocating') return '支付成功，正在确认权益'
      // 业务拦截（如已有生效的自动续费服务）：直接把后端文案当标题，不显示「支付失败」
      if (this.step === 'blocked') return this.order.blockMessage
      if (this.step === 'failure') return '支付失败'
      return '正在等待支付，请稍后'
    },
    statusHint() {
      if (this.step === 'allocating') return '可在我的订单中查看历史订单'
      // 业务拦截的说明就是标题本身，不再补通用失败提示
      if (this.step === 'blocked') return ''
      if (this.step === 'failure') return '请更换支付方式或稍后重试'
      return '若长时间无响应，请更换支付方式'
    },
    successDetails() {
      const details = [...(this.order.details || [])]
      if (this.order.orderNo) {
        details.push({ key: 'orderNo', value: this.order.orderNo })
      }
      return details
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetFlow()
        this.lockScroll()
        this.initOrder()
        // 套餐与付款方式已在页面选好，弹窗不再需要确认页，打开即拉起支付
        this.submitPay()
      } else {
        this.unlockScroll()
        this.clearTimer()
        this.clearPoll()
      }
    }
  },
  mounted() {
    window.addEventListener('resize', this.updatePlacement)
  },
  beforeUnmount() {
    this.unlockScroll()
    this.clearTimer()
    this.clearPoll()
    window.removeEventListener('resize', this.updatePlacement)
  },
  methods: {
    updatePlacement() {
      this.placement = window.innerWidth < 768 ? 'bottom' : 'center'
    },
    // 弹窗打开时锁定背后页面滚动，避免上下滑动穿透。
    lockScroll() {
      const root = document.documentElement
      this._scrollTop = window.pageYOffset || root.scrollTop || 0
      root.style.overflow = 'hidden'
      if (document.body) document.body.style.overflow = 'hidden'
    },
    unlockScroll() {
      const root = document.documentElement
      if (document.body) document.body.style.overflow = ''
      root.style.overflow = ''
    },
    detailLabel(key) {
      return DETAIL_LABELS[key] || key
    },
    clearTimer() {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    },
    clearPoll() {
      if (this.pollTimer) {
        clearTimeout(this.pollTimer)
        this.pollTimer = null
      }
    },
    resetFlow() {
      this.clearTimer()
      this.clearPoll()
      this.pollCount = 0
      this.pollOrderId = ''
      this.step = 'loading'
      // 复位下单守卫：弹窗每次重新打开都应允许再次支付
      this.submitting = false
      // 复位埋点状态：#41 每次打开算一次新生命周期
      this.payPopupShown = false
      this.payPopupClickReported = []
      this.payResultReported = false
      this.payOrderId = ''
      // 延续页面已选中的付款方式；未传或当前套餐不支持时回退到首个可用方式
      const inherited = this.payMethodList.some(item => item.key === this.payMethod)
        ? this.payMethod
        : ''
      this.method = inherited || this.payMethodList[0]?.key || 'wechat'
      this.qrUrl = ''
    },
    // 订单金额与明细来自所选套餐
    initOrder() {
      const pkg = this.pkg || {}
      this.order = {
        amount: pkg.productCurrentPriceYuan ?? 0,
        currencySymbol: '¥',
        details: [
          { key: 'product', value: pkg.productName || '' },
          ...(this.isAutoRenew ? [{ key: 'renew', value: '到期自动续费' }] : [])
        ],
        orderNo: '',
        status: '',
        failMessage: '',
        blockMessage: ''
      }
    },
    // 支付产品码：
    //  连续包月 -> 已装支付宝：支付宝移动代扣(ALI_DK_MB)
    //             未装支付宝：支付宝扫码代扣(ALI_DK_SC)
    //  普通套餐 -> 支付宝(ALI_MB) / 微信(WX_MB) / 聚合二维码(COLLECT_CODE)
    resolvePayCode(mode) {
      if (this.isAutoRenew) {
        return mode === 'qrcode' ? XUNYOU_ACCELERATOR_PAY_CODE.QR_DK : XUNYOU_ACCELERATOR_PAY_CODE.ALI_DK
      }
      if (mode === 'qrcode') return XUNYOU_ACCELERATOR_PAY_CODE.QR
      return this.method === 'alipay' ? XUNYOU_ACCELERATOR_PAY_CODE.ALI : XUNYOU_ACCELERATOR_PAY_CODE.WX
    },
    submitPay() {
      // 防重复提交：本方法到真正发起下单之间存在异步窗口（端内要先查钱包是否安装），
      // 这里用 submitting 兜住重复调用。
      if (this.submitting) return
      if (!this.pkg?.id) {
        this.failPay('缺少套餐信息，请重新选择')
        return
      }
      this.submitting = true
      this.step = 'loading'
      if (this.isApp) {
        this.submitPayInApp()
      } else {
        this.submitPayInBrowser()
      }
    },
    // 端内支付：判断所选钱包是否已安装；已安装拉起钱包，未安装展示二维码。
    submitPayInApp() {
      this.resolveWalletInstalled(this.method).then(installed => {
        // 等待钱包探测期间用户可能已关闭弹窗，此时放弃下单，避免产生"取消后仍下单"的孤儿订单
        if (!this.submitting) return
        if (installed) {
          this.startTradePay()
        } else {
          this.startQrcodePay()
        }
      })
    },
    // 端外浏览器：不判断钱包安装，按设备类型分流（pad 二维码 / phone trade）。
    submitPayInBrowser() {
      if (this.deviceKind === 'pad') {
        this.startQrcodePay()
      } else {
        this.startTradePay()
      }
    },
    resolveWalletInstalled(method) {
      const pkg = method === 'alipay' ? [ALIPAY_PKG] : [WECHAT_PKG]
      if (!this.isApp) return Promise.resolve(true)
      return checkThirdAppInstalled(pkg.map(packageName => ({ packageName, versionCode: '', vcnumber: '0' })))
        .then(result => {
          const installed = Array.isArray(result)
            ? result.some(o => o?.isInstalled)
            : !!(result && result[0] && result[0].isInstalled)
          return installed
        })
        .catch(() => false)
    },
    // 已装钱包：下单拿支付链接并拉起支付，随后轮询订单状态。
    startTradePay() {
      this.step = 'loading'
      createXunyouAcceleratorOrder({
        productId: this.pkg.id,
        payProductCode: this.resolvePayCode('trade'),
        clientSource: this.clientSource
      }).then(data => {
        if (!this.submitting) return
        if (!data || !data.payUrl || data.orderId === undefined || data.orderId === null) {
          this.failPay('请更换支付方式或稍后重试')
          return
        }
        this.payOrderId = String(data.orderId)
        this.openPayUrl(data.payUrl)
        this.startPolling(data.orderId)
        // 拉起支付成功即曝光支付弹窗（拉起失败走 failPay，不上报）
        this.reportPayPopupShow()
        // #42 已拉起钱包支付 → pay=pay
        this.reportPayPopupClick('pay')
      }).catch(err => {
        if (!this.submitting) return
        this.handleOrderError(err)
      })
    },
    // 未装钱包：下单拿二维码内容，渲染成二维码图片后轮询。
    startQrcodePay() {
      this.step = 'loading'
      createXunyouAcceleratorOrder({
        productId: this.pkg.id,
        payProductCode: this.resolvePayCode('qrcode'),
        clientSource: this.clientSource
      }).then(async data => {
        if (!this.submitting) return
        if (!data || !data.payUrl || data.orderId === undefined || data.orderId === null) {
          this.failPay('请更换支付方式或稍后重试')
          return
        }
        if (!/^data:image/i.test(data.payUrl)) {
          data.payUrl = await QRCode.toDataURL(data.payUrl)
        }
        if (!this.submitting) return
        this.payOrderId = String(data.orderId)
        this.qrUrl = data.payUrl
        this.step = 'qrcode'
        this.startPolling(data.orderId)
        // 二维码支付页展示出来才算曝光（下单失败走 failPay，不上报）
        this.reportPayPopupShow()
        // #42 已展示二维码支付页 → pay=pay
        this.reportPayPopupClick('pay')
      }).catch(err => {
        if (!this.submitting) return
        this.handleOrderError(err)
      })
    },
    // 打开支付链接：App 内走原生外部跳转，端外浏览器新开窗口（被拦截则当前窗口跳转）
    openPayUrl(url) {
      if (!url) return
      if (this.isApp) {
        openExternalUrl(url)
        return
      }
      const win = window.open(url, '_blank')
      if (!win) {
        window.location.href = url
      }
    },
    // 二维码内容：后端可能返回内容串，也可能已是图片地址
    async toQrImage(content) {
      if (!content) return ''
      if (/^(data:image|https?:)/i.test(content)) return content
      return QRCode.toDataURL(content)
    },
    startPolling(orderId) {
      this.clearPoll()
      this.pollCount = 0
      this.pollStartTime = Date.now()
      this.pollOrderId = orderId
      this.pollOrder()
    },
    pollOrder() {
      if (!this.pollOrderId) return
      this.clearPoll()
      this.pollTimer = setTimeout(() => {
        queryXunyouAcceleratorOrder(this.pollOrderId).then(res => {
          if (!res || res.code !== 10000 || !res.data) {
            this.pollAgain()
            return
          }
          const status = Number(res.data.orderStatus)
          if (status === ORDER_STATUS_PAID) {
            this.onPaySuccess(res.data)
            return
          }
          if (ORDER_STATUS_REFUND.includes(status)) {
            this.failPay('订单已退款')
            return
          }
          this.pollAgain()
        }).catch(() => this.pollAgain())
      }, 3000)
    },
    pollAgain() {
      if (Date.now() - this.pollStartTime >= 60000) {
        this.failPay('支付超时，请重试。如已扣费，请在订单中心页面查询订单。', 'timeout')
        return
      }
      this.pollCount += 1
      if (this.pollCount >= 60) {
        this.failPay('请更换支付方式或稍后重试', 'timeout')
        return
      }
      this.pollOrder()
    },
    onPaySuccess(data) {
      this.clearTimer()
      this.clearPoll()
      this.step = 'allocating'
      this.order.orderNo = data?.orderId !== undefined && data?.orderId !== null
        ? String(data.orderId)
        : (this.pollOrderId !== undefined && this.pollOrderId !== null ? String(this.pollOrderId) : '')
      this.order.status = data?.orderStatus || ''
      // #43 支付结果：成功
      this.reportPayResult('success')
      this.$emit('pay-success')
      this.timer = setTimeout(() => {
        this.step = 'success'
      }, 800)
    },
    failPay(message, result = 'failure') {
      this.clearTimer()
      this.clearPoll()
      this.step = 'failure'
      // 失败后允许用户重试，复位下单守卫
      this.submitting = false
      this.order.failMessage = message
      // #43 支付结果：默认 failure，轮询超时场景由调用方显式传 timeout
      this.reportPayResult(result)
    },
    /**
     * 下单业务拦截（如已有生效的自动续费服务，后端 code=1）。
     * 这不是支付失败：本次并未拉起支付，直接把后端文案作为结果展示；
     * 口径与雷神一致（雷神前端也按 code===1 单独展示后端文案）。
     * 不上报 #42/#43：支付弹窗未曝光、支付也未发起，报了会污染支付漏斗。
     */
    blockPay(message) {
      this.clearTimer()
      this.clearPoll()
      this.step = 'blocked'
      this.submitting = false
      this.order.blockMessage = message
    },
    // 下单失败统一分流：业务拦截走 blockPay，其余仍按支付失败处理
    handleOrderError(err) {
      if (Number(err?.code) === XUNYOU_ORDER_BIZ_BLOCK_CODE) {
        this.blockPay(err?.message || '暂时无法下单，请稍后重试')
        return
      }
      this.failPay(err?.message || '请更换支付方式或稍后重试')
    },
    // #41 公共字段（口径同 #39，#39 detail 的字段）
    payReportFields() {
      const amount = Number(this.pkg?.productCurrentPriceYuan)
      return {
        orderid: this.payOrderId,
        payMethod: this.method,
        planId: String(this.pkg?.id ?? ''),
        planName: String(this.pkg?.productName || ''),
        planLocal: this.planLocal,
        amount: Number.isNaN(amount) ? 0 : Number(amount.toFixed(2))
      }
    },
    // #41 支付弹窗曝光（pv，去重：弹窗每次打开只报一次）
    reportPayPopupShow() {
      if (this.payPopupShown) return
      this.payPopupShown = true
      this.$dataReport('LZ_myGames', 'LZ_accelPayPopupShow', 'pv', {
        detail: JSON.stringify(this.payReportFields())
      })
    },
    /**
     * #42 发起支付弹窗点击（click）
     * resultpay=pay：已拉起对应支付方式（钱包跳转 / 二维码展示）；
     * resultpay=cancel：用户在支付完成前关闭弹窗。
     * 去重：pay / cancel 各自只报一次，避免重复点击重复上报；
     * 支付结果（成功/失败/超时）已上报后，关闭弹窗不再补报 cancel。
     */
    reportPayPopupClick(pay) {
      if (this.payPopupClickReported.includes(pay)) return
      if (pay === 'cancel' && this.payResultReported) return
      this.payPopupClickReported.push(pay)
      this.$dataReport('LZ_myGames', 'LZ_accelPayPopupClick', 'click', {
        detail: JSON.stringify({ ...this.payReportFields(), resultpay: pay })
      })
    },
    /**
     * #43 支付结果上报（report）
     * result=success / failure / cancel / timeout。
     * 去重：同一次弹窗生命周期只报一次，确保 success 之后关闭弹窗不会再报 cancel。
     */
    reportPayResult(result) {
      if (this.payResultReported) return
      this.payResultReported = true
      this.$dataReport('LZ_myGames', 'LZ_accelPayResultReport', 'report', {
        detail: JSON.stringify({ ...this.payReportFields(), result })
      })
    },
    copyText(text) {
      if (!text) return
      const success = () => this.$successMessage('复制成功')
      const fail = () => this.$errorMessage('复制失败')
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(success).catch(() => {
          if (this.copyByTextarea(text)) success()
          else fail()
        })
        return
      }
      if (this.copyByTextarea(text)) success()
      else fail()
    },
    copyByTextarea(value) {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const copied = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copied
    },
    handleClose() {
      // 关闭时终止本次支付生命周期：submitPay / startTradePay / startQrcodePay 的异步回调
      // 都以 submitting 作为守卫，置 false 才能让「钱包探测中或下单中关闭弹窗」真正放弃后续
      // 拉起支付与轮询，避免取消后仍下单、仍唤起钱包的孤儿订单（下单请求已发出的除外）。
      this.submitting = false
      // 支付完成前关闭弹窗视为取消（#42 pay=cancel / #43 result=cancel）；
      // 两个上报方法内部按生命周期去重，成功/失败/超时已上报时不会再补报 cancel。
      // 业务拦截（blocked）没有曝光过支付弹窗、也没发起支付，不补报 cancel，避免孤儿埋点。
      if (this.step !== 'blocked') {
        this.reportPayPopupClick('cancel')
        this.reportPayResult('cancel')
      }
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.accel-pay-layer {
  position: fixed;
  inset: 0;
  z-index: 1100;
}

.accel-pay-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.accel-pay-dialog {
  position: absolute;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1e232b;
  color: #eaf7ff;
  box-shadow: 0 2px 20px rgba(13, 13, 13, 0.8);

  &--bottom {
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    height: min(594px, calc(100vh - 40px));
    max-height: calc(100vh - 40px);
    border-radius: 8px 8px 0 0;
    animation: accel-pay-sheet-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  &--center {
    top: 50%;
    left: 50%;
    width: min(600px, calc(100% - 32px));
    height: min(594px, calc(100vh - 40px));
    max-height: calc(100vh - 40px);
    border-radius: 8px;
    box-shadow: 0 0 0 0.5px #39404d, 0 2px 20px rgba(13, 13, 13, 0.8);
    transform: translate(-50%, -50%);
  }
}

@keyframes accel-pay-sheet-in {
  from {
    transform: translate3d(0, 100%, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}

.accel-pay-header {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 48px;
}

.accel-pay-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  &--close {
    margin-left: auto;
  }
}

.accel-pay-icon {
  display: block;
  width: 32px;
  height: 32px;
}

.accel-pay-body {
  position: relative;
  z-index: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  padding: 0 16px;
  overflow-y: auto;
  overflow-x: hidden;

  &.is-success {
    padding: 0;
  }

  &.is-qrcode {
    gap: 16px;
    align-items: center;
    justify-content: center;
    margin-top: -80px;
  }
}

.accel-pay-rule {
  flex-shrink: 0;
  width: calc(100% - 32px);
  height: 0.5px;
  margin-inline: auto;
  background: #39404d;
}

.accel-pay-amount {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  padding-bottom: 16px;
  text-align: center;

  &__label {
    margin: 0;
    color: rgba(234, 247, 255, 0.4);
    font-size: 14px;
    line-height: 21px;
  }

  &__row {
    display: flex;
    gap: 4px;
    align-items: flex-end;
    justify-content: center;
    margin: 0;
    color: #eaf7ff;
    font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    font-weight: 500;
  }

  &__symbol {
    font-size: 24px;
    line-height: 1.4;
  }

  &__value {
    font-size: 32px;
    line-height: 38px;
  }
}

.accel-pay-detail {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 0 16px;
  overflow: auto;

  &__row {
    display: flex;
    gap: 4px;
    align-items: flex-start;
    justify-content: space-between;
    min-height: 48px;
    padding: 12px 16px;
  }

  &__label {
    flex-shrink: 0;
    color: rgba(234, 247, 255, 0.6);
    font-size: 14px;
    line-height: 22px;
    white-space: nowrap;
  }

  &__group {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    min-width: 0;
  }

  &__value {
    min-width: 0;
    color: rgba(234, 247, 255, 0.8);
    font-size: 14px;
    line-height: 22px;
    text-align: right;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
}

.accel-pay-qr {
  display: flex;
  flex-direction: column;
  gap: 48px;
  align-items: center;

  &__wrap {
    display: flex;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    width: 164px;
    height: 164px;
    padding: 12px;
    border: 2px solid rgba(255, 255, 255, 0.12);
  }

  &__image {
    display: block;
    width: 140px;
    height: 140px;
    object-fit: cover;
  }

  &__hint {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin: 0;
    color: rgba(234, 247, 255, 0.4);
    font-size: 14px;
    line-height: normal;
    text-align: center;
    white-space: nowrap;
  }

  &__brand {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    color: #eaf7ff;

    img {
      width: 24px;
      height: 24px;
    }
  }
}

.accel-pay-status {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  text-align: center;

  &__spinner-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 88px;
    height: 88px;
  }

  &__spinner {
    width: 56px;
    height: 56px;
    animation: accel-pay-spin 0.9s linear infinite;
  }

  &__caution {
    width: 80px;
    height: 80px;
  }

  &__title {
    margin: 0;
    color: #eaf7ff;
    font-size: 16px;
    line-height: normal;
  }

  &__hint {
    margin: 0;
    color: rgba(234, 247, 255, 0.6);
    font-size: 14px;
    line-height: normal;
  }
}

@keyframes accel-pay-spin {
  to {
    transform: rotate(360deg);
  }
}

.accel-pay-success {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 0 16px 16px;
  text-align: center;

  &__icon {
    width: 48px;
    height: 48px;
  }

  &__title {
    margin: 0;
    color: #eaf7ff;
    font-size: 16px;
    line-height: normal;
  }
}

.accel-pay-copy-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  img {
    display: block;
    width: 18px;
    height: 18px;
  }
}

.accel-pay-footer {
  display: flex;
  flex-shrink: 0;
  gap: 16px;
  margin: 16px;

  &--spacer {
    height: 0;
    margin: 0;
  }

  &--single {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 54px;
    margin: 16px;
    border: 0;
    border-radius: 4px;
    background: #386efe;
    color: #eaf7ff;
    font-size: 16px;
    font-weight: 500;
    line-height: 22px;
    cursor: pointer;
  }
}

</style>
