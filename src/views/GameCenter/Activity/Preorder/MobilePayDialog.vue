<template>
  <div v-if="visible" class="mobile-pay-layer" :class="placement === 'bottom' ? 'is-sheet' : 'is-modal'">
    <div class="mobile-pay-mask" />

    <div class="mobile-pay-dialog" :class="`mobile-pay-dialog--${placement}`">
      <header class="mobile-pay-header">
        <button
          v-if="showBack"
          type="button"
          class="mobile-pay-icon-btn"
          aria-label="返回"
          @click="goBack"
        >
          <img class="mobile-pay-icon" :src="iconBack" alt="" />
        </button>
        <button
          type="button"
          class="mobile-pay-icon-btn mobile-pay-icon-btn--close"
          aria-label="关闭"
          @click="handleClose"
        >
          <img class="mobile-pay-icon" :src="iconClose" alt="" />
        </button>
      </header>

      <div class="mobile-pay-body" :class="`is-${step}`">
        <div v-if="step === 'confirm' && initializing" class="mobile-pay-status">
          <div class="mobile-pay-status__spinner-wrap">
            <img class="mobile-pay-status__spinner" :src="iconLoading" alt="" />
          </div>
        </div>

        <template v-else-if="step === 'confirm'">
          <div class="mobile-pay-amount">
            <p class="mobile-pay-amount__label">付款金额</p>
            <p class="mobile-pay-amount__row">
              <span class="mobile-pay-amount__symbol">{{ order.currencySymbol }}</span>
              <span class="mobile-pay-amount__value">{{ displayAmount }}</span>
            </p>
          </div>
          <div class="mobile-pay-rule" />
          <div class="mobile-pay-confirm-main">
            <div class="mobile-pay-detail">
              <div
                v-for="row in order.details"
                :key="row.key"
                class="mobile-pay-detail__row"
              >
                <span class="mobile-pay-detail__label">{{ detailLabel(row.key) }}</span>
                <span class="mobile-pay-detail__value">{{ row.value }}</span>
              </div>
            </div>
            <div class="mobile-pay-methods">
              <p class="mobile-pay-methods__label">付款方式</p>
              <div class="mobile-pay-methods__grid">
                <button
                  type="button"
                  class="mobile-pay-methods__item"
                  :class="{ 'is-selected': method === 'wechat' }"
                  @click="selectMethod('wechat')"
                >
                  <img class="mobile-pay-methods__icon" :src="iconWechat" alt="" />
                  <span>微信</span>
                  <img v-if="method === 'wechat'" class="mobile-pay-methods__check" :src="iconMethodSelected" alt="" />
                </button>
                <button
                  type="button"
                  class="mobile-pay-methods__item"
                  :class="{ 'is-selected': method === 'alipay' }"
                  @click="selectMethod('alipay')"
                >
                  <img class="mobile-pay-methods__icon" :src="iconAlipay" alt="" />
                  <span>支付宝</span>
                  <img v-if="method === 'alipay'" class="mobile-pay-methods__check" :src="iconMethodSelected" alt="" />
                </button>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="step === 'qrcode'">
          <div class="mobile-pay-amount">
            <p class="mobile-pay-amount__label">付款金额</p>
            <p class="mobile-pay-amount__row">
              <span class="mobile-pay-amount__symbol">{{ order.currencySymbol }}</span>
              <span class="mobile-pay-amount__value">{{ displayAmount }}</span>
            </p>
          </div>
          <div class="mobile-pay-qr">
            <div class="mobile-pay-qr__wrap">
              <img class="mobile-pay-qr__image" :src="qrUrl" alt="扫码支付" />
            </div>
            <p class="mobile-pay-qr__hint">
              <span>请使用</span>
              <span class="mobile-pay-qr__brand">
                <img :src="iconWechat" alt="" />
                <span>微信</span>
              </span>
              <span>或</span>
              <span class="mobile-pay-qr__brand">
                <img :src="iconAlipay" alt="" />
                <span>支付宝</span>
              </span>
              <span>扫码支付</span>
            </p>
          </div>
        </template>

        <div v-else-if="['loading', 'allocating', 'failure'].includes(step)" class="mobile-pay-status">
          <div v-if="step !== 'failure'" class="mobile-pay-status__spinner-wrap">
            <img class="mobile-pay-status__spinner" :src="iconLoading" alt="" />
          </div>
          <img v-else class="mobile-pay-status__caution" :src="iconCaution" alt="" />
          <p class="mobile-pay-status__title">{{ statusTitle }}</p>
          <p class="mobile-pay-status__hint">{{ order.failMessage || statusHint }}</p>
        </div>

        <template v-else-if="step === 'success'">
          <div class="mobile-pay-success">
            <img class="mobile-pay-success__icon" :src="iconCheckSuccess" alt="" />
            <p class="mobile-pay-success__title">{{ order.activationCode ? '激活码已生成' : '交易成功' }}</p>
            <div class="mobile-pay-success__code">
              <span class="mobile-pay-success__label">激活码:</span>
              <span class="mobile-pay-success__group">
                <span class="mobile-pay-success__value">{{ order.activationCode || order.status || '-' }}</span>
                <button
                  v-if="order.activationCode"
                  type="button"
                  class="mobile-pay-copy-btn"
                  aria-label="复制激活码"
                  @click.stop="copyText(order.activationCode)"
                >
                  <img :src="iconCopy" alt="" />
                </button>
              </span>
            </div>
          </div>
          <div class="mobile-pay-rule" />
          <div class="mobile-pay-detail">
            <div
              v-for="row in successDetails"
              :key="row.key"
              class="mobile-pay-detail__row"
            >
              <span class="mobile-pay-detail__label">{{ detailLabel(row.key) }}</span>
              <span class="mobile-pay-detail__group">
                <span class="mobile-pay-detail__value">{{ row.value }}</span>
                <button
                  v-if="row.key === 'orderNo'"
                  type="button"
                  class="mobile-pay-copy-btn"
                  aria-label="复制订单号"
                  @click.stop="copyText(row.value)"
                >
                  <img :src="iconCopy" alt="" />
                </button>
              </span>
            </div>
          </div>
        </template>

        <div v-else-if="step === 'activation'" class="mobile-pay-activation">
          <div ref="activationScroll" class="mobile-pay-activation__scroll" @scroll="syncActivationThumb">
            <div class="mobile-pay-activation__row">
              <span class="mobile-pay-activation__label">激活码:</span>
              <span class="mobile-pay-activation__code-value">{{ order.activationCode || order.status || '-' }}</span>
              <button
                v-if="order.activationCode"
                type="button"
                class="mobile-pay-copy-btn"
                aria-label="复制激活码"
                @click.stop="copyText(order.activationCode)"
              >
                <img :src="iconCopy" alt="" />
              </button>
            </div>
            <template v-for="(item, index) in activationSteps" :key="`divider-${index}`">
              <div class="mobile-pay-activation__divider" />
              <div class="mobile-pay-activation__step">
                <div class="mobile-pay-activation__copy">
                  <p class="mobile-pay-activation__heading">{{ item.heading }}</p>
                  <div class="mobile-pay-activation__copy-stack">
                    <div class="mobile-pay-activation__body">
                      <span v-if="item.body">{{ item.body }}</span>
                      <a
                        v-if="item.linkHref"
                        class="mobile-pay-activation__link"
                        href="javascript:void(0)"
                        role="button"
                        @click.prevent="openActivationLink(item)"
                      >{{ item.linkText }}</a>
                    </div>
                    <p v-if="item.hint" class="mobile-pay-activation__hint">{{ item.hint }}</p>
                  </div>
                </div>
                <img class="mobile-pay-activation__image" :src="item.image" :alt="item.heading" />
              </div>
            </template>
          </div>
          <div ref="activationTrack" class="mobile-pay-activation__scrollbar" aria-hidden="true">
            <div
              class="mobile-pay-activation__thumb"
              :style="{ height: `${thumbHeight}px`, transform: `translateY(${thumbOffset}px)` }"
            />
          </div>
        </div>
      </div>

      <footer v-if="showDualActions || showBackAction" class="mobile-pay-footer">
        <template v-if="showDualActions">
          <button type="button" class="mobile-pay-btn mobile-pay-btn--secondary" @click="openActivation">
            查看激活方式
          </button>
          <button type="button" class="mobile-pay-btn mobile-pay-btn--primary" @click="handleClose">
            完成
          </button>
        </template>
        <button
          v-else-if="showBackAction"
          type="button"
          class="mobile-pay-btn mobile-pay-btn--secondary mobile-pay-btn--full"
          @click="goBack"
        >
          返回
        </button>
      </footer>
      <button
        v-else-if="showPayAction"
        type="button"
        class="mobile-pay-footer mobile-pay-footer--single"
        @click="submitPay"
      >
        立即支付
      </button>
      <div
        v-else
        class="mobile-pay-footer mobile-pay-footer--spacer"
        :class="{ 'mobile-pay-footer--no-margin': activationOnly }"
      />
    </div>
  </div>
</template>

<script>
import iconBack from './payment/assets/icon-back.svg'
import iconClose from './payment/assets/icon-close.svg'
import iconCaution from './payment/assets/icon-caution.svg'
import iconLoading from './payment/assets/icon-loading.svg'
import iconCheckSuccess from './payment/assets/icon-check-success.svg'
import iconCopy from './payment/assets/icon-copy.svg'
import iconMethodSelected from './payment/assets/icon-method-selected.svg'
import iconWechat from './payment/assets/icon-wechat.svg'
import iconAlipay from './payment/assets/icon-alipay.svg'
import activationStep1 from './payment/assets/activation-step1.png'
import activationStep2 from './payment/assets/activation-step2.png'
import activationStep3 from './payment/assets/activation-step3.png'
import {
  createCommodityOrderQrcode,
  createCommodityPayTrade,
  commodityOrderPoll,
  commodityInfo,
  isSuccessCode,
  generateCommodityUuid
} from '@/api/cdkMall'
import { checkThirdAppInstalled, openExternalUrl } from '@/nativeApiPad/common'

const DETAIL_LABELS = {
  game: '游戏',
  platform: '平台',
  version: '版本',
  language: '语言',
  orderNo: '订单号'
}

// 第三方钱包包名（原生 GETINSTALL 判定是否安装）
const WECHAT_PKG = 'com.tencent.mm'
const ALIPAY_PKG = 'com.eg.android.AlipayGphone'

// 支付渠道（v2 order/pay/trade 的 payCode）
const PAY_CODES = {
  wechat: 'WX_MB',
  alipay: 'ALI_MB'
}

const ACTIVATION_STEPS = [
  {
    heading: '步骤1',
    body: '下载steam',
    linkText: 'https://store.steampowered.com/about/',
    linkHref: 'https://store.steampowered.com/about/',
    hint: '如果打不开请在联想应用商店下载雷神/迅游加速器加速steam',
    image: activationStep1
  },
  {
    heading: '步骤2',
    body: '启动steam，点击steam主页左上的游戏模块选择在steam上激活产品。',
    image: activationStep2
  },
  {
    heading: '步骤3',
    body: '将获取的激活码复制到此位置，完成激活（如图）。后续在steam游戏库中可以找到该游戏并下载、游玩。',
    image: activationStep3
  }
]

export default {
  name: 'MobilePayDialog',
  emits: ['close', 'pay-success'],
  inject: {
    // 祖先 Activity 的 provide，返回活动名称，用于打点 plateName
    getActivityName: {
      default: null
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 商品信息（含 skuId / currentPrice / skuName）
    product: {
      type: Object,
      default: null
    },
    // 活动 ID（订单关联）
    activityId: {
      type: [String, Number],
      default: ''
    },
    // 仅展示兑换方式（复用激活码页，不进入支付流程）
    activationOnly: {
      type: Boolean,
      default: false
    },
    // 外部传入的激活码（订单中心查看兑换方式时使用）
    activationCode: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      activationSteps: ACTIVATION_STEPS,
      iconBack,
      iconClose,
      iconCaution,
      iconLoading,
      iconCheckSuccess,
      iconCopy,
      iconMethodSelected,
      iconWechat,
      iconAlipay,
      step: 'confirm',
      method: 'wechat',
      initializing: false,
      order: {
        amount: 0,
        currencySymbol: '¥',
        details: [],
        activationCode: '',
        orderNo: '',
        status: ''
      },
      qrUrl: '',
      orderUuid: '',
      commodityPromise: null,
      timer: null,
      pollTimer: null,
      pollStartTime: 0,
      pollCount: 0,
      placement: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 'bottom' : 'center') : 'bottom',
      thumbHeight: 80,
      thumbOffset: 0,
      boundScroller: null,
      resizeObserver: null
    }
  },
  computed: {
    isApp() {
      return !!this.$store.state.system.version
    },
    // 端外浏览器按设备类型分流：pad 走二维码，phone 走 trade。
    // 反转策略：默认 pad（二维码），仅明确识别为手机才走 trade。
    // 原因：很多平板浏览器开「桌面模式」后 UA 伪装成 Windows/Macintosh，
    // 不含 Android/iPad/Mobile，无法正向识别；反过来「只认明确手机」最稳。
    deviceKind() {
      if (typeof navigator === 'undefined') return 'phone'
      const ua = navigator.userAgent || ''

      // 明确的手机：iPhone/iPod，或带 Mobile 的 Android 手机。
      if (/iPhone|iPod/i.test(ua)) return 'phone'
      if (/Android/i.test(ua) && /Mobile/i.test(ua)) return 'phone'

      // 其余（iPad、iPadOS 桌面模式、安卓平板、桌面模式安卓 pad、桌面）统一走二维码。
      return 'pad'
    },
    showBack() {
      if (this.activationOnly) return false
      return ['qrcode', 'loading', 'failure', 'activation'].includes(this.step)
    },
    showPayAction() {
      return this.step === 'confirm'
    },
    showDualActions() {
      if (this.activationOnly) return false
      return this.step === 'success'
    },
    showBackAction() {
      return this.step === 'failure'
    },
    showFooterSpacer() {
      return ['qrcode', 'loading', 'allocating'].includes(this.step)
    },
    displayAmount() {
      const value = Number(this.order.amount)
      if (Number.isNaN(value)) return '0.00'
      return value.toFixed(2)
    },
    statusTitle() {
      if (this.step === 'allocating') return '支付成功，正在分配激活码'
      if (this.step === 'failure') return '支付失败'
      return '正在等待支付，请稍后'
    },
    statusHint() {
      if (this.step === 'allocating') return '可在我的订单中查看历史订单'
      if (this.step === 'failure') return '请更换支付方式或稍后重试'
      return '若长时间无响应，请更换支付方式'
    },
    successDetails() {
      const details = [...(this.order.details || [])]
      if (this.order.orderNo) {
        details.push({ key: 'orderNo', value: this.order.orderNo })
      }
      return details
    },
    // 打点数据来源
    userInfo() {
      return this.$store.state.user.userInfo
    },
    channelInfo() {
      return this.$store.state.channelInfo
    },
    // 渠道（当前所在 app）：LegionZone（端内）/ LeAppStore（商店）/ LeExternal（浏览器）
    reportChannel() {
      if (this.isApp) return 'LegionZone'
      const q = this.$route?.query || {}
      if (q.fromChannelName) return 'LeAppStore'
      return 'LeExternal'
    },
    // 支付渠道（chan）：
    //   端内 App → LegionZoneMobile
    //   端外浏览器 → 默认 LeExternal；URL 带 channel 时取 URL 上的值（运营投放渠道）
    payChan() {
      if (this.isApp) return 'LegionZoneMobile'
      return this.$route?.query?.channel || 'LeExternal'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.resetFlow()
        this.lockScroll()
        if (this.activationOnly) {
          this.initActivationOnly()
        } else {
          this.initOrder()
        }
      } else {
        this.unlockScroll()
        this.clearTimer()
        this.clearPoll()
        this.unbindActivation()
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
    this.unbindActivation()
    window.removeEventListener('resize', this.updatePlacement)
  },
  methods: {
    updatePlacement() {
      this.placement = window.innerWidth < 768 ? 'bottom' : 'center'
    },
    // 弹窗打开时锁定背后活动页滚动，避免上下滑动穿透。
    lockScroll() {
      const root = document.documentElement
      this._scrollTop = window.pageYOffset || root.scrollTop || 0
      root.style.overflow = 'hidden'
      if (document.body) document.body.style.overflow = 'hidden'
      // 活动页实际滚动容器是 .Activity，等弹窗 DOM 挂载后再定位并锁定。
      this.$nextTick(() => {
        const container = this.$el && this.$el.closest ? this.$el.closest('.Activity') : null
        this._scrollContainer = container || document.querySelector('.Activity')
        if (this._scrollContainer) this._scrollContainer.style.overflow = 'hidden'
      })
    },
    unlockScroll() {
      const root = document.documentElement
      if (document.body) document.body.style.overflow = ''
      root.style.overflow = ''
      if (this._scrollContainer) {
        this._scrollContainer.style.overflow = ''
        this._scrollContainer = null
      }
      const container = document.querySelector('.Activity')
      if (container) container.style.overflow = ''
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
      this.orderUuid = ''
      this.commodityPromise = null
      this.initializing = false
      this.step = 'confirm'
      this.method = 'wechat'
      this.qrUrl = ''
    },
    initOrder() {
      this.order = {
        amount: 0,
        currencySymbol: '¥',
        details: [],
        activationCode: '',
        orderNo: '',
        status: ''
      }
      // 商品信息（游戏/平台/版本/价格）以 info 接口返回为准，请求完成后再渲染确认页
      this.initializing = true
      this.commodityPromise = this.fetchCommodityInfo().finally(() => {
        this.initializing = false
      })
    },
    initActivationOnly() {
      // 订单中心查看兑换方式：直接进入激活码页，不发起支付流程。
      this.initializing = false
      this.order = {
        amount: 0,
        currencySymbol: '¥',
        details: [],
        activationCode: this.activationCode || '',
        orderNo: '',
        status: ''
      }
      this.step = 'activation'
      this.$nextTick(() => this.bindActivation())
    },
    async fetchCommodityInfo() {
      const sid = this.product?.skuId
      if (!sid) return null
      try {
        const res = await commodityInfo(sid)
        if (!res || !isSuccessCode(res.code) || !res.data) return null
        const d = res.data
        const details = []
        if (d.sname) details.push({ key: 'game', value: d.sname })
        if (d.exchangePlatform) details.push({ key: 'platform', value: d.exchangePlatform })
        if (d.editionNote) details.push({ key: 'version', value: d.editionNote })
        if (d.pertainArea) details.push({ key: 'language', value: d.pertainArea })
        if (details.length) this.order.details = details
        if (d.pricePresent !== undefined && d.pricePresent !== null && d.pricePresent !== '') {
          this.order.amount = d.pricePresent
        }
        return res
      } catch (e) {
        console.warn('获取商品信息失败', e)
        return null
      }
    },
    selectMethod(method) {
      this.method = method
    },
    // 打点公共字段（预购页购买链路三处埋点共用）
    baseReportDetail() {
      return {
        plateName: (this.getActivityName && this.getActivityName()) || '',
        skuName: this.product?.skuName || '',
        lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId || '',
        skuId: this.product?.skuId || '',
        channel: this.reportChannel,
        url: this.reportChannel === 'LeExternal' ? window.location.href : ''
      }
    },
    emitReport(action, label, detail) {
      const params = {
        detail: JSON.stringify(detail),
        uuid: this.channelInfo?.channelUserInfo?.uuid || null
      }
      this[this.isApp ? '$dataReport' : '$trackEvent']('LZ_gamingCenter', action, label, params)
    },
    // 「立即支付」入口：先区分端内 / 端外，再各自走独立流程，便于后续单独调整细节。
    submitPay() {
      if (!this.product?.skuId) {
        this.$errorMessage('缺少商品信息，请联系运营人员')
        return
      }

      this.emitReport('LZ_storeCdkBuyWholeProPopClick', 'click', this.baseReportDetail())

      if (this.isApp) {
        this.submitPayInApp()
      } else {
        this.submitPayInBrowser()
      }
    },

    // 端内支付：先判断所选渠道钱包是否已安装（微信/支付宝）；
    // 已安装 -> trade 拉起钱包；未安装 -> qrcode 展示二维码，均后台轮询订单。
    submitPayInApp() {
      Promise.resolve(this.commodityPromise).then(() => {
        this.resolveWalletInstalled(this.method).then(installed => {
          if (installed) {
            this.startTradePay()
          } else {
            this.startQrcodePay()
          }
        })
      })
    },

    // 端外（浏览器）支付：不判断钱包安装，直接走 trade。
    // 按设备类型分流：pad 直接展示二维码，phone 直接调 trade。
    submitPayInBrowser() {
      Promise.resolve(this.commodityPromise).then(() => {
        if (this.deviceKind === 'pad') {
          this.startQrcodePay()
        } else {
          this.startTradePay()
        }
      })
    },
    resolveWalletInstalled(method) {
      const pkg = method === 'alipay' ? [ALIPAY_PKG] : [WECHAT_PKG]
      // 端外（浏览器）不判断钱包是否安装，直接进入 trade 支付流程。
      if (!this.isApp) {
        console.log(`[支付] ${method} 端外环境，跳过安装判断直接调 trade`, { pkg })
        return Promise.resolve(true)
      }
      return checkThirdAppInstalled(pkg.map(packageName => ({ packageName, versionCode: '', vcnumber: '0' })))
        .then(result => {
          const installed = Array.isArray(result)
            ? result.some(o => o?.isInstalled)
            : !!(result && result[0] && result[0].isInstalled)
          console.log(`[支付] ${method} 是否安装`, { pkg, result, installed })
          return installed
        })
        .catch(err => {
          console.log(`[支付] ${method} 判断安装失败，默认视为未安装`, { pkg, err })
          return false
        })
    },
    payParams() {
      const params = {
        sid: this.product.skuId,
        price: this.order.amount,
        chan: this.payChan,
        plat: 'LegionZoneMobile'
      }
      return params
    },
    // 已装钱包：调 trade 下单并拉起支付，返回支付 url 后交给原生拉起；后台用 uuid 轮询订单。
    startTradePay() {
      this.step = 'loading'
      this.orderUuid = generateCommodityUuid()
      // 购买弹窗曝光：2=微信/支付宝（调起 trade 拉起第三方应用）
      this.emitReport('LZ_storeCdkDetailBuyPopupShow', 'pv', { ...this.baseReportDetail(), status: 2 })
      createCommodityPayTrade({
        ...this.payParams(),
        payCode: PAY_CODES[this.method],
        channel: 'mobile',
        uuid: this.orderUuid
      }).then(res => {
        if (res && isSuccessCode(res.code) && res.data?.url) {
          const url = res.data.url
          // 后端可能返回新的订单关联标识，优先使用
          if (res.data.uuid) this.orderUuid = res.data.uuid
          if (this.isApp) {
            openExternalUrl(url)
          } else {
            // 端外浏览器：新开窗口打开支付链接。
            // Safari 会在异步回调里拦截 window.open（返回 null），此时降级为当前窗口跳转。
            const win = window.open(url, '_blank')
            if (!win) {
              window.location.href = url
            }
          }
          this.startPolling()
        } else {
          this.failPay((res && (res.msg || res.message)) || '请更换支付方式或稍后重试')
        }
      }).catch(err => {
        this.failPay(err?.message || '请更换支付方式或稍后重试')
      })
    },
    // 未装钱包：调 qrcode 拿二维码展示，用返回 uuid 轮询订单。
    startQrcodePay() {
      this.step = 'loading'
      this.orderUuid = generateCommodityUuid()
      // 购买弹窗曝光：1=二维码（点击后、请求接口之前上报）
      this.emitReport('LZ_storeCdkDetailBuyPopupShow', 'pv', { ...this.baseReportDetail(), status: 1 })
      createCommodityOrderQrcode({
        ...this.payParams(),
        uuid: this.orderUuid
      }).then(res => {
        if (res && isSuccessCode(res.code) && res.data) {
          if (res.data.uuid) this.orderUuid = res.data.uuid
          const qrcode = res.data.qrcode || res.data.qrcodeUrl || res.data.url || res.data.qrCode || ''
          if (qrcode) {
            this.qrUrl = qrcode
            this.step = 'qrcode'
            this.startPolling()
          } else {
            // 购买弹窗曝光：3=异常
            this.emitReport('LZ_storeCdkDetailBuyPopupShow', 'pv', { ...this.baseReportDetail(), status: 3 })
            this.failPay('请更换支付方式或稍后重试')
          }
        } else {
          // 购买弹窗曝光：3=异常
          this.emitReport('LZ_storeCdkDetailBuyPopupShow', 'pv', { ...this.baseReportDetail(), status: 3 })
          this.failPay((res && (res.msg || res.message)) || '请更换支付方式或稍后重试')
        }
      }).catch(err => {
        // 购买弹窗曝光：3=异常
        this.emitReport('LZ_storeCdkDetailBuyPopupShow', 'pv', { ...this.baseReportDetail(), status: 3 })
        this.failPay(err?.message || '请更换支付方式或稍后重试')
      })
    },
    startPolling() {
      this.clearPoll()
      this.pollCount = 0
      this.pollStartTime = Date.now()
      this.pollOrder()
    },
    pollOrder() {
      if (!this.orderUuid) return
      this.clearPoll()
      this.pollTimer = setTimeout(() => {
        commodityOrderPoll(this.orderUuid).then(res => {
          if (!res || !isSuccessCode(res.code)) {
            this.pollAgain()
            return
          }
          const data = res.data
          // data 为空：支付结果尚未返回，继续轮询。
          if (!data) {
            this.pollAgain()
            return
          }
          // data 非空：支付结果已返回，停止轮询。
          // statusVal 决定结果展示（2:交易成功，其余为失败/退款等，展示 status 描述）。
          if (data.statusVal === 2 || data.statusVal === '2') {
            this.onPaySuccess(data)
          } else {
            this.failPay(data.status || `支付失败（状态码：${data.statusVal ?? ''}）`)
          }
        }).catch(() => this.pollAgain())
      }, 3000)
    },
    pollAgain() {
      // 超过 60s 仍未拿到支付结果，视为支付失败，停止轮询。
      if (Date.now() - this.pollStartTime >= 60000) {
        this.failPay('支付超时，请重试。如已扣费，请在订单中心页面查询订单。')
        return
      }
      this.pollCount += 1
      if (this.pollCount >= 60) {
        this.failPay('请更换支付方式或稍后重试')
        return
      }
      this.pollOrder()
    },
    onPaySuccess(data) {
      this.clearTimer()
      this.clearPoll()
      this.step = 'allocating'
      this.order.activationCode = data.code || this.order.activationCode
      this.order.status = data.status || ''
      this.order.orderNo = data.oid != null ? String(data.oid) : ''
      this.order.exchangeUrl = data.exchangeUrl || ''
      // 支付结果曝光：1=成功出现激活码，3=成功但无激活码
      const hasCode = !!this.order.activationCode
      this.emitReport('LZ_storeCdkDetailPayResultShow', 'pv', {
        ...this.baseReportDetail(),
        status: hasCode ? 1 : 3,
        errmessage: hasCode ? '' : '支付成功但未返回激活码'
      })
      // 支付成功：通知父组件刷新页面数据（抽奖次数/任务状态/订单列表）
      this.$emit('pay-success')
      this.timer = setTimeout(() => {
        this.step = 'success'
      }, 800)
    },
    failPay(message) {
      this.clearTimer()
      this.clearPoll()
      this.step = 'failure'
      this.order.failMessage = message
      // 支付结果曝光：2=失败
      this.emitReport('LZ_storeCdkDetailPayResultShow', 'pv', {
        ...this.baseReportDetail(),
        status: 2,
        errmessage: message || ''
      })
    },
    goBack() {
      this.clearTimer()
      this.clearPoll()
      this.orderUuid = ''
      this.qrUrl = ''
      if (this.step === 'activation') {
        this.step = 'success'
        return
      }
      this.step = 'confirm'
    },
    openActivation() {
      this.step = 'activation'
      this.$nextTick(() => this.bindActivation())
    },
    openActivationLink(item) {
      if (!item?.linkHref) return
      // app 内：第三方地址需走 external 接口跳转，避免内嵌 WebView 打不开。
      if (this.isApp) {
        openExternalUrl(item.linkHref)
        return
      }
      // 端外浏览器：优先新开窗口；Safari 会在异步或非用户手势下拦截 window.open，
      // 返回 null 时降级为当前窗口跳转，保证链接始终可打开。
      const win = window.open(item.linkHref, '_blank', 'noopener,noreferrer')
      if (!win) {
        window.location.href = item.linkHref
      }
    },
    syncActivationThumb() {
      const scroller = this.boundScroller || this.$refs.activationScroll
      const track = this.$refs.activationTrack
      if (!scroller || !track) return
      const { scrollTop, scrollHeight, clientHeight } = scroller
      const styles = window.getComputedStyle(track)
      const padTop = Number.parseFloat(styles.paddingTop) || 0
      const padBottom = Number.parseFloat(styles.paddingBottom) || 0
      const trackInner = Math.max(track.clientHeight - padTop - padBottom, 1)
      const nextHeight = Math.min(80, Math.max(32, (clientHeight / Math.max(scrollHeight, 1)) * trackInner))
      const maxOffset = Math.max(trackInner - nextHeight, 0)
      const maxScroll = Math.max(scrollHeight - clientHeight, 0)
      this.thumbHeight = nextHeight
      this.thumbOffset = maxScroll === 0 ? 0 : (scrollTop / maxScroll) * maxOffset
    },
    bindActivation() {
      this.unbindActivation()
      const scroller = this.$refs.activationScroll
      if (!scroller) return
      this.boundScroller = scroller
      scroller.scrollTop = 0
      scroller.addEventListener('scroll', this.syncActivationThumb, { passive: true })
      this.resizeObserver = new ResizeObserver(() => this.syncActivationThumb())
      this.resizeObserver.observe(scroller)
      this.syncActivationThumb()
    },
    unbindActivation() {
      if (this.boundScroller) this.boundScroller.removeEventListener('scroll', this.syncActivationThumb)
      this.boundScroller = null
      if (this.resizeObserver) this.resizeObserver.disconnect()
      this.resizeObserver = null
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
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
.mobile-pay-layer {
  position: fixed;
  inset: 0;
  z-index: 1100;
}

.mobile-pay-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.mobile-pay-dialog {
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
    animation: mobile-pay-sheet-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
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

@keyframes mobile-pay-sheet-in {
  from {
    transform: translate3d(0, 100%, 0);
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}

.mobile-pay-header {
  position: relative;
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 48px;
}

.mobile-pay-icon-btn {
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

.mobile-pay-icon {
  display: block;
  width: 32px;
  height: 32px;
}

.mobile-pay-body {
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

  &.is-confirm,
  &.is-success {
    padding: 0;
  }

  &.is-qrcode {
    gap: 16px;
    align-items: center;
    justify-content: center;
    margin-top: -80px;
  }

  &.is-activation {
    gap: 0;
    padding: 0;
  }
}

.mobile-pay-confirm-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
}

.mobile-pay-rule {
  flex-shrink: 0;
  width: calc(100% - 32px);
  height: 0.5px;
  margin-inline: auto;
  background: #39404d;
}

.mobile-pay-amount {
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

.mobile-pay-detail {
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

.mobile-pay-methods {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  width: 100%;
  padding: 24px 16px;

  &__label {
    margin: 0;
    color: rgba(234, 247, 255, 0.4);
    font-size: 14px;
    line-height: normal;
  }

  &__grid {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  &__item {
    position: relative;
    display: flex;
    flex: 1;
    gap: 8px;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 8px 16px;
    overflow: hidden;
    border: 1px solid transparent;
    border-radius: 4px;
    background: rgba(57, 64, 77, 0.3);
    color: rgba(234, 247, 255, 0.8);
    font-size: 14px;
    cursor: pointer;

    &.is-selected {
      border-color: #3887ff;
    }
  }

  &__icon {
    width: 24px;
    height: 24px;
  }

  &__check {
    position: absolute;
    right: -1px;
    bottom: -1px;
    width: 20px;
    height: 20px;
  }
}

.mobile-pay-qr {
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

.mobile-pay-status {
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
    animation: mobile-pay-spin 0.9s linear infinite;
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

@keyframes mobile-pay-spin {
  to {
    transform: rotate(360deg);
  }
}

.mobile-pay-success {
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

  &__code {
    display: flex;
    gap: 4px;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
    min-width: 0;
  }

  &__label {
    flex-shrink: 0;
    color: rgba(234, 247, 255, 0.6);
    font-size: 16px;
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
    color: #eaf7ff;
    font-size: 16px;
    line-height: 22px;
    text-align: right;
    overflow-wrap: anywhere;
    word-break: break-all;
  }

  &__status {
    margin: 0;
    color: #eaf7ff;
    font-size: 14px;
    line-height: 22px;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
}

.mobile-pay-copy-btn {
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

.mobile-pay-activation {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  &__scroll {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 24px;
    align-items: center;
    min-height: 0;
    padding: 16px;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      width: 0;
      height: 0;
      display: none;
    }
  }

  &__row {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
    padding: 0 16px;
  }

  &__label {
    flex-shrink: 0;
    color: rgba(234, 247, 255, 0.6);
    font-size: 14px;
    line-height: 26px;
    white-space: nowrap;
  }

  &__code-value {
    min-width: 0;
    color: #eaf7ff;
    font-size: 14px;
    line-height: 26px;
    overflow-wrap: anywhere;
    word-break: break-all;
  }

  &__divider {
    flex-shrink: 0;
    width: 100%;
    height: 0.5px;
    background: linear-gradient(90deg, rgba(234, 247, 255, 0) 0%, rgba(234, 247, 255, 0.2) 50.3124%, rgba(234, 247, 255, 0) 100%);
  }

  &__step {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    width: 100%;
  }

  &__copy {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    width: 100%;
    text-align: center;
  }

  &__copy-stack {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: stretch;
    width: 100%;
  }

  &__heading {
    margin: 0;
    color: #eaf7ff;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.5;
    text-align: center;
  }

  &__body {
    margin: 0;
    width: 100%;
    color: rgba(234, 247, 255, 0.8);
    font-size: 14px;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  &__hint {
    margin: 0;
    width: 100%;
    color: rgba(234, 247, 255, 0.4);
    font-size: 12px;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }

  &__link {
    margin-left: 8px;
    color: #386efe;
    text-decoration: none;
    overflow-wrap: anywhere;
    word-break: break-all;
  }

  &__image {
    display: block;
    flex-shrink: 0;
    width: 100%;
    max-width: 380px;
    height: auto;
    aspect-ratio: 380 / 213;
    object-fit: cover;
    border-radius: 4px;
  }

  &__scrollbar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 12px;
    padding: 12px 4px 32px;
    overflow: hidden;
    pointer-events: none;
  }

  &__thumb {
    flex-shrink: 0;
    width: 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.12);
    will-change: transform;
  }
}

.mobile-pay-footer {
  display: flex;
  flex-shrink: 0;
  gap: 16px;
  margin: 16px;

  &--no-margin {
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

.mobile-pay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 54px;
  border: 0;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  line-height: 22px;
  cursor: pointer;

  &--full {
    width: 100%;
  }

  &--primary {
    background: #386efe;
    color: #eaf7ff;
  }

  &--secondary {
    background: #39404d;
    color: #eaf7ff;
  }
}
</style>
