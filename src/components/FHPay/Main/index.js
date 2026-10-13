import { generateCDKOrder, cdkOrderPoll } from '@/api/cdkMall'

import { getCurrentBrandConfig } from '@/assets/text'
const LOADING_DURATION = 500

export default {
  name: 'Main',
  data() {
    return {
      channel: 'LegionZoneMobile',
      type: 0, // 0：支付流程，1：显示CDK
      skuId: null, // 支付流程--SKU ID
      price: null, // 支付流程--价格
      stage: 0, // 0：loading，1：加载payUrl，2：payUrl加载成功，3：加载cdkUrl，4：cdkUrl加载成功，-1：错误
      payUrl: '', // CDK支付地址
      cdkUrl: '', // 显示CDK的地址
      message: '', // 错误消息
      loadingStartTime: Date.now(),
      plateName: '',
      skuName: '',
      gameVersion: '',
      lenovoid: '',
      firstLocal: '',
      secondLocal: '',
      thirdLocal: '',
      reportType: '',
      softID: '',
      onClose: null,
      reportChannel: 'LegionZone',
      reportIsPreOrder: 'no',
      reportUrl: '',
      BRAND_TEXT: getCurrentBrandConfig('BRAND_TEXT')
    }
  },
  created() {
    this.init()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  methods: {
    init() {
      if (this.type === 1) return

      clearTimeout(this.timer)
      this.stage = 0
      this.payUrl = ''
      this.cdkUrl = ''
      this.message = ''
      this.loadingStartTime = Date.now()
      generateCDKOrder({
        sid: this.skuId,
        price: this.price,
        chan: this.channel,
        plat: 'LegionZoneMobile'
      }).then(res => {
        if (this && this._isDestroyed) return

        if (res.code !== 10000) {
          this.payLoaded(false, res.message)
          return
        }

        this.uuid = res.data.uuid
        this.payUrl = res.data.url
        this.stage = 1
        this.timer = setTimeout(() => {
          this.payLoaded(false, '请求超时，请稍后再试')
        }, 5000)
      })
    },
    payLoaded(success, message = '') {
      clearTimeout(this.timer)

      let delay = LOADING_DURATION - Date.now() + this.loadingStartTime
      if (delay < 0 || delay > LOADING_DURATION) {
        delay = 0
      }
      this.timer = setTimeout(() => {
        if (success) {
          this.stage = 2
          this.polling()
          this.storeCdkDetailBuyShowReport(success)
        } else {
          this.stage = -1
          this.message = message
          this.storeCdkDetailBuyShowReport(success, message)

          this.storeCdkDetailPayResultShowReport(2, message)
        }
      }, delay)
    },
    storeCdkDetailBuyShowReport(success, message = '') {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyShow', 'pv', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: this.reportType,
          softID: this.softID,
          plateName: this.plateName,
          skuName: this.skuName,
          gameVersion: this.gameVersion,
          lenovoid: this.lenovoid,
          skuId: this.skuId,
          isPreOrder: this.reportIsPreOrder,
          channel: this.reportChannel,
          url: this.reportUrl,
          ifQRCode: success ? 1 : 2,
          notQRerr: !success ? message : ''
        })
      })
    },
    polling() {
      if (this && this._isDestroyed) return

      this.timer = setTimeout(() => {
        cdkOrderPoll(this.uuid).then(res => {
          if (!res || res.code !== 10000) {
            this.storeCdkDetailPayResultShowReport(3, 'CDK激活码分配失败')
            throw new Error('CDK激活码分配失败')
          }

          if (res.data && res.data.exchangeUrl) {
            this.cdkUrl = res.data.exchangeUrl
            this.stage = 3
            this.timer = setTimeout(this.cdkLoaded, 5000)
          } else {
            this.polling()
          }
        }).catch(this.polling)
      }, 1500)
    },
    cdkLoaded() {
      clearTimeout(this.timer)
      this.stage = 4

      this.storeCdkDetailPayResultShowReport(1)
    },
    storeCdkDetailPayResultShowReport(status, errmessage = '') {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailPayResultShow', 'pv', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: this.reportType,
          plateName: this.plateName,
          skuName: this.skuName,
          softID: this.softID,
          gameVersion: this.gameVersion,
          lenovoid: this.lenovoid,
          skuId: this.skuId,
          isPreOrder: this.reportIsPreOrder,
          channel: this.reportChannel,
          url: this.reportUrl,
          status: status,
          errmessage: errmessage
        })
      })
    },
    close() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkBuyWholeProPopXClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: this.reportType,
          plateName: this.plateName,
          skuName: this.skuName,
          softID: this.softID,
          gameVersion: this.gameVersion,
          lenovoid: this.lenovoid,
          skuId: this.skuId,
          isPreOrder: this.reportIsPreOrder,
          channel: this.reportChannel,
          url: this.reportUrl,
          status: {
            4: 3,
            3: 4,
            2: 1
          }[this.stage] || 2
        })
      })

      if (typeof this.onClose === 'function') {
        this.onClose()
      }
      this.$destroy()
      document.body.removeChild(this.$el)
    }
  }
}
