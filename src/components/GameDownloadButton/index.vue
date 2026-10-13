<template>
  <div class="GameDownloadButton">
    <!-- 杂志游戏 -->
    <template v-if="softPurpose===3 && newPurchasedStatus!==1">
      <!-- 未购买 -->
      <template v-if="!userPurchasedStatus" >
        <div v-if="buttonStyle==='abnormal'" class="common-abnomal-btn autoClick" tabindex="0" role="button" :aria-label="buyText" @click.stop="clickBuyMagazine" @keydown.enter.prevent.stop="clickBuyMagazine" @keydown.space.prevent.stop="clickBuyMagazine"><i class="text" aria-hidden="true">{{ buyText }}</i></div>
        <div v-else-if="buttonStyle==='rect'" class="common-abnormal-rect-btn autoClick" tabindex="0" role="button" :aria-label="buyText" @click.stop="clickBuyMagazine" @keydown.enter.prevent.stop="clickBuyMagazine" @keydown.space.prevent.stop="clickBuyMagazine"><i class="text" aria-hidden="true">{{ buyText }}</i></div>
        <div v-else class="buyButton common-rect-btn autoClick" tabindex="0" role="button" :aria-label="buyText" @click.stop="clickBuyMagazine" @keydown.enter.prevent.stop="clickBuyMagazine" @keydown.space.prevent.stop="clickBuyMagazine"><span aria-hidden="true">{{ buyText }}</span></div>
      </template>
      <!-- 已购买 -->
      <template v-else>
        <AbShapeDownloadButton v-if="buttonStyle==='abnormal' || buttonStyle==='rect'" v-bind="$props"/>
        <DownloadButton v-else v-bind="$props"/>
      </template>
    </template>
    <!-- 普通游戏 -->
    <template v-else>
      <template v-if="isDownload">
        <template v-if="$isPadDevice">
          <AbShapeDownloadButtonPad v-if="buttonStyle==='abnormal' || buttonStyle==='rect'" v-bind="$props"/>
          <DownloadButtonPad v-else v-bind="$props"/>
        </template>
        <template v-else>
          <AbShapeDownloadButton v-if="buttonStyle==='abnormal' || buttonStyle==='rect'" v-bind="$props"/>
          <DownloadButton v-else v-bind="$props"/>
        </template>
      </template>
      <ReserveButton v-else-if="stateInfo.bizType===1 || stateInfo.bizType===2" v-bind="$props" @reserveSuccess="reserveSuccess"/>
      <ApplyTestButton v-else-if="stateInfo.bizType===4" v-bind="$props"/>
    </template>
    <FreeOrderSuccessDialog v-if="showFreeOrderSuccessDialog" :visible="showFreeOrderSuccessDialog" :order-id="orderId" v-bind="$props" @close="closeFreeOrderDialog"/>
  </div>
</template>
<script>
import DownloadButton from '@/components/DownloadButton/index.vue'
import AbShapeDownloadButton from '@/components/AbShapeDownloadButton'
import ReserveButton from '@/components/ReserveButton'
import ApplyTestButton from '@/components/ApplyTestButton'
import DownloadButtonPad from '@/components/DownloadButtonPad'
import AbShapeDownloadButtonPad from '@/components/AbShapeDownloadButtonPad'
import { getFreeOrder } from '@/api/gameCenter'
import FreeOrderSuccessDialog from './FreeOrderSuccessDialog.vue'

export default {
  name: 'GameDownloadButton',
  inject: { requestTime: { default: () => null }},
  components: {
    DownloadButton,
    AbShapeDownloadButton,
    ReserveButton,
    ApplyTestButton,
    DownloadButtonPad,
    AbShapeDownloadButtonPad,
    FreeOrderSuccessDialog
  },
  data() {
    return {
      newPurchasedStatus: 0,
      showFreeOrderSuccessDialog: false,
      orderId: ''
    }
  },
  props: {
    showInstallSize: {
      type: Boolean,
      default: false
    },
    buttonStyle: {
      type: String,
      default: 'normal' // abnormal
    },
    downloadInfo: {
      type: Object,
      default: null
    },
    theme: { // 主题切换：gray：灰色主题，blue：蓝色主题
      type: String,
      default: 'gray'
    },
    softId: {
      type: String,
      required: true
    },
    softPurpose: {
      type: Number,
      required: true
    },
    userPurchasedStatus: {
      type: Number,
      default: 0
    },
    version: {
      type: String,
      required: true
    },
    softName: {
      type: String,
      required: true
    },
    logoFile: {
      type: String,
      default: ''
    },
    fastInstall: {
      type: Boolean,
      default: false
    },
    drinfo: { // 数据上报附加信息
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    isClick: {
      type: Boolean,
      default: false
    },
    skuId: {
      type: String,
      default: ''
    },
    hideEventDate: {
      type: Boolean,
      default: false
    },
    softDesc: {
      type: Object,
      default: null
    },
    productInfo: {
      type: Object,
      default: null
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    isFreeProduct() {
      // 是免费领取状态
      return this.softPurpose === 3 && !this.userPurchasedStatus && this.productInfo?.currentPrice === 0
    },
    buyText() {
      return this.isFreeProduct ? '免费领取' : '购买'
    },
    stateInfo() {
      return this.$store.state.gameDownloadState.stateMap[this.softId] || {}
    },
    isDownload() {
      return this.stateInfo.bizType === 0 || (this.stateInfo.bizType === 4 && this.stateInfo.testActivityStatus === 1 && this.stateInfo.userTestApplyStatus === 2)
    },
    getRequestTime() {
      return this.requestTime && this.requestTime() || 0
    }
  },
  watch: {
    softId:
    {
      immediate: true,
      handler: function() {
        this.setReserveState()
      }
    },
    getRequestTime:
    {
      immediate: true,
      handler: function(value) {
        this.$nextTick(() => {
          this.setReserveState()
        })
      }
    }
  },
  methods: {
    closeFreeOrderDialog() {
      this.showFreeOrderSuccessDialog = false
    },
    buyMagazine() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeLegionPlayBuyButtonClick', 'click', {
        detail: this.drinfo
      })

      console.log('clickBuyMagazine', this.skuId)

      this.$magazinePay({
        version: this.version,
        productId: this.skuId,
        drinfo: this.drinfo,
        softPurpose: this.softPurpose,
        softName: this.softName,
        softId: this.softId,
        logoFile: this.logoFile,
        downloadInfo: this.downloadInfo
      }).then(() => {
        this.newPurchasedStatus = 1
        this.setReserveState()
      }).catch(() => {})
    },
    clickBuyMagazine() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      console.log('this.isFreeProduct', this.isFreeProduct)
      if (this.isFreeProduct) {
        // 免费领取
        this.freeOrder()
      } else {
        this.buyMagazine()
      }
    },
    freeOrder() {
      this.$dataReport('LZ_gamingCenter', 'LZ_magazineGameFreeButtonClick', 'click', {
        detail: this.drinfo
      })
      getFreeOrder({
        productId: this.skuId,
        clientSource: 1
      }).then(res => {
        if (res) {
          this.newPurchasedStatus = 1
          this.setReserveState()
          this.orderId = res.orderId + ''
          this.$nextTick(() => {
            this.showFreeOrderSuccessDialog = true
          })
          this.$dataReport('LZ_gamingCenter', 'LZ_magazineFreePopupShow', 'pv', {
            detail: this.drinfo
          })
        } else {
          this.$message.error('领取失败，请稍后重试！')
        }
      })
    },
    setReserveState() {
      const next = {
        softID: this.softId,
        softType: this.softPurpose === 3 ? 1 : 0,
        userPurchasedStatus: this.userPurchasedStatus || this.newPurchasedStatus,
        softName: this.softName,
        bizType: this.downloadInfo.bizType,
        userReservationStatus: this.downloadInfo.userReservationStatus,
        userTestApplyStatus: this.downloadInfo.userTestApplyStatus,
        testActivityStatus: this.downloadInfo.testActivityStatus,
        testActivityQuestionUrl: this.downloadInfo.testActivityQuestionUrl
      }
      const prev = this.stateInfo
      const same = Object.keys(next).every((key) => next[key] === prev[key])
      if (same) return

      this.$store.dispatch('gameDownloadState/setState', {
        [this.softId]: {
          ...prev,
          ...next
        }
      })
    },
    reserveSuccess(value) {
      this.$emit('reserveSuccess', value)
    }
  }
}
</script>
<style lang="scss" scoped>
.GameDownloadButton {
  line-height: 0;
}

</style>
