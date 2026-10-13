<template>
  <div :class="{'preorder-page':true}" v-if="preorderConfig">
    <div class="preorder-header"></div>
    <!-- 顶部模块 -->
    <section id="preorder-top" class="preorder-module-top">
      <!-- 顶部立即预购只负责定位到购买区，不直接触发支付。 -->
      <PreorderTop :config="preorderConfig.top" @buy="scrollToPurchase" @intro="scrollToGamePreview" @orders="openOrderCenter" />
    </section>

    <!-- 购买区模块 -->
    <section id="preorder-purchase" :class="{'preorder-module-buy':true,'preorder-module-buy-app':isApp || fromChannel}">
      <PreorderPurchase
        :config="preorderConfig.purchase"
        :activity-id="activityId"
        @buy="handleBuyClick"
      />
    </section>

    <section id="preorder-lottery" :class="{'preorder-module-lottery':true,'preorder-module-lottery-app':isApp || fromChannel}" v-if="hasLotteryModule">
      <div class="lottery-container-header">
        <h1>超值抽奖</h1>
        <div class="lottery-container-actions">
          <span @click="openActivityRule">活动规则</span>
          <i></i>
          <span @click="openAwardList">我的奖品</span>
        </div>
      </div>
      <div class="preorder-lottery-section">
        <!-- 抽奖组件（SuperDraw或SlotMachine，根据游戏模板类型） -->
        <!-- 预购页所有环境都将购买任务定位到立即购买区域；普通活动页不受影响。 -->
        <component
          :is="gameTemplateComponent"
          ref="GameTemplate"
          :base-info="baseInfo"
          :prize-draw="prizeDraw"
          @refreshPage="refreshPage"
          :first-local="firstLocal"
          :second-local="secondLocal"
          :third-local="thirdLocal"
          :plate-name-report="plateNameReport"
          :scroll-to-purchase-on-finish="true"
          @scroll-to-purchase="scrollToPurchase"
          @toLenovoLogin="$emit('toLenovoLogin')"
          :all-prize-ids="allPrizeIds" />
      </div>
    </section>

    <!-- 游戏预览模块：复用标准活动页的预览组件，按设备选择布局。 -->
    <section id="preorder-game-preview" :class="{'preorder-module-preview':true,'preorder-module-preview-app':isApp || fromChannel}" v-if="hasGamePreview">
      <h1>游戏介绍</h1>
      <GameDetailPad v-if="isPreorderMobile" :base-info="baseInfo" />
      <GameDetail v-else :base-info="baseInfo" />
    </section>

    <!-- 尾页模块 -->
    <PreorderEnding :config="preorderConfig.top" :config-top="preorderConfig.ending" :class="{'preorder-module-ending':true,'preorder-module-ending-app':isApp || fromChannel}" @buy="scrollToPurchase" @intro="scrollToGamePreview" @orders="openOrderCenter" />

    <!-- 侧边模块导航 -->
    <PreorderProgressNav
      ref="PreorderProgressNav"
      :current-module="currentModule"
      :has-lottery="hasLotteryModule"
      :has-game-preview="hasGamePreview"
      @navigate="scrollToModule"
    />

    <!-- 订单中心弹框（浏览器，复用公共 Dialog 组件，和我的奖品弹框同一个壳） -->
    <OrderCenterDialog
      :visible="showOrderDialog"
      @close="showOrderDialog = false"
    />
    <AwardList
      v-if="showAwardList"
      :visible="showAwardList"
      :all-prize-ids="allPrizeIds"
      :base-info="baseInfo"
      @close="showAwardList = false"
    />
    <ActivityRuleDialog
      :visible="showActivityRule"
      :rule-text="baseInfo.rule"
      @close="showActivityRule = false"
    />

    <!-- 移动端支付弹层（微信/支付宝） -->
    <MobilePayDialog
      :visible="showMobilePayDialog"
      :product="selectedProduct"
      :activity-id="activityId"
      @close="showMobilePayDialog = false"
      @pay-success="refreshPage"
    />

  </div>
  <div v-else class="preorder-error">
    <p>活动配置缺失，请联系运营人员</p>
  </div>
</template>

<script>
import PreorderTop from './PreorderTop.vue'
import PreorderPurchase from './PreorderPurchase.vue'
import PreorderEnding from './PreorderEnding.vue'
import PreorderProgressNav from './PreorderProgressNav.vue'
import OrderCenterDialog from './OrderCenterDialog.vue'
import ActivityRuleDialog from './ActivityRuleDialog.vue'
import MobilePayDialog from './MobilePayDialog.vue'
import AwardList from '../common/AwardList.vue'
import GameDetail from '../GameDetail'
import GameDetailPad from '../GameDetailPad'
// 预售购买弹窗（复用CDK详情页的无码预售购买链路）
import DetailFHPay from '../../CDKMall/Detail/FHPay'
// 抽奖活动模块（复用原来的实现，包含任务和抽奖规则）
import SuperDrawPad from '../SuperDraw/SuperDrawPad.vue'
import SuperDrawPc from '../SuperDraw/SuperDrawPc.vue'
import SlotMachinePad from '../SlotMachine/SlotMachinePad.vue'
import { GAME_TEMPLATE_IDS, resolveGameTemplateId } from '../gameTemplateRegistry'

const GAME_TEMPLATE_COMPONENTS = Object.freeze({
  [GAME_TEMPLATE_IDS.SUPER_DRAW]: { pc: SuperDrawPc, mobile: SuperDrawPad },
  [GAME_TEMPLATE_IDS.SLOT_MACHINE]: { pc: SuperDrawPc, mobile: SlotMachinePad }
})

export default {
  name: 'GamePreorderPage',
  components: {
    PreorderTop,
    PreorderPurchase,
    PreorderEnding,
    PreorderProgressNav,
    OrderCenterDialog,
    ActivityRuleDialog,
    MobilePayDialog,
    AwardList,
    SuperDrawPad,
    SuperDrawPc,
    SlotMachinePad,
    GameDetail,
    GameDetailPad
  },
  emits: ['login', 'logout', 'toLenovoLogin', 'refreshPage'],
  props: {
    // 原有字段：活动基础信息容器；新增预购字段位于 gamePreorderConfig。
    baseInfo: {
      type: Object,
      required: true
    },
    // 活动ID
    activityId: {
      type: [String, Number],
      default: ''
    },
    // 原有字段：prizeDraw，预购页复用的抽奖活动数据。
    prizeDraw: {
      type: Object,
      default: null
    },
    // 原有字段：taskPrizeList，预购页复用的抽奖任务列表。
    taskPrizeList: {
      type: Array,
      default: () => []
    },
    // 所有奖品ID（抽奖活动模块用）
    allPrizeIds: {
      type: Array,
      default: null
    },
    firstLocal: {
      type: String,
      default: ''
    },
    secondLocal: {
      type: String,
      default: ''
    },
    thirdLocal: {
      type: String,
      default: ''
    },
    // 板块名称（抽奖活动模块打点用）
    plateNameReport: {
      type: String,
      default: ''
    },
    // 登录态由活动父组件统一维护，预售页只通知父组件执行登录。
    loginLoggedIn: {
      type: Boolean,
      default: false
    },
    isApp: {
      type: Boolean,
      required: true
    },
    fromChannel: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 当前所在模块（用于侧边模块导航高亮）：top/purchase/lottery/intro
      currentModule: 'top',
      // 订单中心弹框
      showOrderDialog: false,
      showAwardList: false,
      showActivityRule: false,
      // 从购买任务“去完成”进入购买区时暂存当前任务，用于定位购买商品。
      selectedPurchaseTask: null,
      // 移动端支付弹层
      showMobilePayDialog: false,
      selectedProduct: null,
      // 预售页按屏幕宽度选择移动端或 PC 组件
      isPreorderMobile: typeof window !== 'undefined' && window.innerWidth < 840
    }
  },
  computed: {
    // 新增字段：baseInfo.gamePreorderConfig，预购页专属配置。
    preorderConfig() {
      return this.baseInfo?.gamePreorderConfig || null
    },
    // 抽奖活动组件（根据游戏模板类型决定渲染SuperDraw还是SlotMachine）
    gameTemplateComponent() {
      const templateId = resolveGameTemplateId(this.prizeDraw?.gameTemplateId)
      const components = GAME_TEMPLATE_COMPONENTS[templateId]
      return components ? components[this.isPreorderMobile ? 'mobile' : 'pc'] : null
    },
    // 原有字段：prizeDraw 存在时显示抽奖活动模块。
    hasLotteryModule() {
      return !!this.prizeDraw
    },
    // 原有字段：showGamePreview 和 gamePreviewInfos，预购页复用游戏预览能力。
    hasGamePreview() {
      return this.baseInfo?.showGamePreview === 1 && (this.baseInfo?.gamePreviewInfos || []).length >= 3
    },
    // 第三方 App 内置浏览器（微信/QQ/微博/抖音/B站等），这些 WebView 无法稳定完成 H5 支付。
    isInAppWebview() {
      if (typeof navigator === 'undefined') return false
      const ua = navigator.userAgent || ''
      return /MicroMessenger|WeiBo|weibo|QQ\//i.test(ua) ||
        /MQQBrowser/i.test(ua) ||
        /ByteDance|aweme|Toutiao|NewsArticle/i.test(ua) ||
        /BILIGAME|BiliApp/i.test(ua)
    },
    },
  mounted() {
    // 监听滚动，更新当前序号
    this.scrollContainer = this.$el.closest('.Activity') || this.$el.parentElement
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', this.handleScroll, { passive: true })
      this.handleScroll()
    }
    window.addEventListener('resize', this.updatePreorderDevice)
  },
  beforeUnmount() {
    if (this.scrollContainer) this.scrollContainer.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.updatePreorderDevice)
    this.clearPreorderPayRefreshTimer()
  },
  methods: {
    // 屏幕尺寸变化时更新预售页设备类型
    updatePreorderDevice() {
      this.isPreorderMobile = window.innerWidth < 840
    },
    // 滚动监听，更新当前模块（侧边导航高亮）和介绍页内部页码
    handleScroll() {
      const container = this.scrollContainer
      if (!container) return
      this.$refs.PreorderProgressNav?.collapse()
      const containerRect = container.getBoundingClientRect()
      const scrollBase = container.scrollTop + container.clientHeight / 2

      // ========== 1. 更新当前模块（侧边导航高亮）==========
      const moduleIds = ['preorder-top', 'preorder-purchase']
      if (this.hasLotteryModule) {
        moduleIds.push('preorder-lottery')
      }
      if (this.hasGamePreview) {
        moduleIds.push('preorder-game-preview')
      }

      let currentModule = 'top'
      for (let i = 0; i < moduleIds.length; i++) {
        const el = document.getElementById(moduleIds[i])
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const moduleTop = rect.top - containerRect.top + container.scrollTop
        const moduleBottom = moduleTop + rect.height
        if (scrollBase >= moduleTop && scrollBase < moduleBottom) {
          currentModule = moduleIds[i].replace('preorder-', '')
          break
        }
        if (i === moduleIds.length - 1 && scrollBase >= moduleBottom) {
          currentModule = moduleIds[i].replace('preorder-', '')
        }
      }
      this.currentModule = currentModule
    },

    // 点击侧边导航，滚动到指定模块
    scrollToModule(moduleId) {
      const el = document.getElementById(moduleId)
      const container = this.scrollContainer
      if (el && container) {
        const containerRect = container.getBoundingClientRect()
        const targetTop = el.getBoundingClientRect().top - containerRect.top + container.scrollTop
        // 顶部模块贴顶；其余模块预留 50px 顶部间距。
        const offset = moduleId === 'preorder-top' ? 0 : 50
        container.scrollTo({ top: Math.max(0, targetTop - offset), behavior: 'smooth' })
      }
    },

    // 顶部按钮定位到立即购买区域，避免误触发支付。
    scrollToPurchase(task = null) {
      // 只有购买 CDKey 任务才保留任务上下文；顶部等普通导航进入购买区不绑定任务。
      this.selectedPurchaseTask = task?.taskType === 11 ? task : null
      const el = document.getElementById('preorder-purchase')
      const container = this.scrollContainer
      if (el && container) {
        const containerRect = container.getBoundingClientRect()
        const targetTop = el.getBoundingClientRect().top - containerRect.top + container.scrollTop
        container.scrollTo({ top: Math.max(0, targetTop - 50), behavior: 'smooth' })
      }
    },

    // 顶部和尾页的游戏介绍定位到游戏详情模块。
    scrollToGamePreview() {
      const el = document.getElementById('preorder-game-preview')
      const container = this.scrollContainer
      if (el && container) {
        const containerRect = container.getBoundingClientRect()
        const targetTop = el.getBoundingClientRect().top - containerRect.top + container.scrollTop
        container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
      }
    },

    // 购买区按钮点击后才进入登录/支付流程。
    handleBuyClick(product) {
      // 第三方 App 内置浏览器（微信/QQ/微博/抖音/B站等）无法稳定完成 H5 支付，
      // 在登录之前即提示引导到外部浏览器，避免先登录再被拦截。
      if (!this.isApp && this.isInAppWebview) {
        this.$lzconfirm({
          type: 'warning',
          message: '请在浏览器中打开此页面',
          showCancelButton: false,
          confirmButtonText: '知道了'
        }).catch(() => {})
        return
      }

      // 未登录先调起登录。
      if (!this.loginLoggedIn) {
        console.log('[预购页] 购买时未登录，调起登录')
        this.$emit('login')
        return
      }

      // 手机/Pad 设备（含横屏）走新支付接口（微信/支付宝），PC 走商城预售支付组件。
      if (this.$isPadDevice || this.$isPhoneDevice) {
        this.openMobilePay(product)
        return
      }

      // 已登录，调用商城预售支付组件；活动参数仅用于订单关联，不改变商品支付参数。
      this.openFHPay(product, this.selectedPurchaseTask)
    },

    // 移动端购买：弹出微信/支付宝支付方式选择弹层。
    openMobilePay(product) {
      if (!product?.skuId) {
        console.warn('预购页移动端购买：skuId 为空', product)
        return
      }
      this.selectedProduct = product
      this.showMobilePayDialog = true
    },

    openFHPay(product) {
      if (!product?.skuId || !product?.productionId) {
        console.warn('预购页购买：skuId 或 productionId 为空', product)
        return
      }

      // 支付只提交商品信息。中台按 SKU 配置决定是否回调活动服务，不依赖 taskId。
      const payParams = {
        firstId: product.productionId,
        secondId: product.skuId
      }
      payParams.onClose = () => {
        // 支付弹框关闭后延迟补刷一次，避免 iframe 回调稍晚到达。
        clearTimeout(this._preorderPayRefreshTimer)
        this._preorderPayRefreshTimer = setTimeout(() => {
          this.refreshPage()
        }, 2000)
      }
      DetailFHPay(payParams)
    },

    // Legion Zone 客户端内跳转到客户端订单页，外部浏览器继续使用活动页订单弹框。
    openOrderCenter() {
      // 未登录时统一调起登录（和购买按钮、顶部"登录"按钮走同一套逻辑）
      if (!this.loginLoggedIn) {
        console.log('[预购页] 查看订单时未登录，调起登录')
        this.$emit('login')
        return
      }

      // 已登录，打开订单中心弹框
      this.showOrderDialog = true
    },
    openAwardList() {
      if (!this.loginLoggedIn) {
        this.$emit('login')
        return
      }
      this.showAwardList = true
    },
    // 打开独立的活动规则弹框
    openActivityRule() {
      this.showActivityRule = true
    },

    // 刷新页面（抽奖组件/任务卡片触发，通知父组件重新获取活动数据）
    refreshPage() {
      this.$emit('refreshPage')
    },
    clearPreorderPayRefreshTimer() {
      if (this._preorderPayRefreshTimer) {
        clearTimeout(this._preorderPayRefreshTimer)
        this._preorderPayRefreshTimer = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.preorder-page {
  overflow-x: hidden;
  width: 100%;
  min-height: 100vh;
  background: rgba(0, 0, 0, 1);
  color: #fff;
  position: relative;
  padding-bottom: 120px;
  > section {
    margin-bottom: 0;
  }
}
.preorder-header {
  width: 100%;
  height: 53px;
  background-color: transparent;
}

.preorder-module-top,.preorder-module-buy {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
}
.preorder-module-buy {
  margin-top: 80px;
  padding: 0 16px;
  &.preorder-module-buy-app {
    margin-top: 40px;
  }
}
.preorder-module-lottery {
  max-width: 1280px;
  margin: 80px auto 0 auto;
  box-sizing: border-box;
  &.preorder-module-lottery-app {
    margin: 40px auto 0 auto;
  }
  .lottery-container-header {
    padding: 16px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(255, 255, 255, 0.24);
    margin: 0 auto;
    h1 {
      margin: 0;
      color: #eaf7ff;
      font-size: 20px;
      font-weight: 700;
      line-height: normal;
      letter-spacing: 2px;
      text-transform: capitalize;
      background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .lottery-container-actions {
      display: flex;
      align-items: center;
      gap: 20px;
      color: rgba(234, 247, 255, 0.6);
      font-size: 22px;
      line-height: 1;
      span {
        cursor: pointer;
        color: rgba(234, 247, 255, 0.60);
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        letter-spacing: 1px;
        text-transform: capitalize;
        &:hover { color: rgba(234, 247, 255, 0.8); }
      }
      i {
        display: block;
        width: 1px;
        height: 16px;
        background: rgba(234, 247, 255, 0.3);
        margin-top: 2px;
      }
    }
  }
  :deep(.SuperDraw) {
    max-width: 1280px;
    padding: 0 0;
    margin: 0px auto 0 auto;
    .title {
      display: none;
    }
    &::before {
      display: none;
    }
    &::after {
      display: none;
    }
  }
}

.preorder-module-ending {
  max-width: 1280px;
  margin: 80px auto 0px auto;
  &.preorder-module-ending-app {
    margin: 40px auto 0px auto;
  }
}

.preorder-module-preview {
  margin: 0 16px;
  h1 {
    max-width: 1280px;
    margin: 0 auto;
    font-family: "Microsoft YaHei";
    font-size: 20px;
    font-style: normal;
    font-weight: 700;
    line-height: normal;
    letter-spacing: 2px;
    text-transform: capitalize;
    background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 16px 0;
  }
  &.preorder-module-preview-app {
    margin-top: 40px;
  }
  margin-top: 80px;
  :deep(.GameDetail), :deep(.GameDetailPad) {
    .title {
      margin-top: 0;
      display: none;
      &:before {
        display: none;
      }
    }
  }
  // :deep(.container) {
  //   padding: 60px 0;
  // }
}
// 抽奖活动模块容器（复用老模板的Banner+抽奖组件，加间距区分模块）
.preorder-lottery-section {
  width: 100%;
  padding: 0px 0;
  position: relative;
  :deep(.SlotMachine) {
    .task-list.slot-task-list {
      padding-bottom: 20px;
    }
  }
}
.preorder-error {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #040404;
  color: rgba(234, 247, 255, 0.6);
  p {
    font-size: 16px;
  }
}
@media (max-width: 1280px) {
  .preorder-module-buy {
    margin-top: 0px;
  }
  .preorder-module-lottery {
    padding: 0 16px;
  }
}
@media (max-width: 1380px) {
   .preorder-module-lottery {
    padding: 0 16px;
  }
}
@media (max-width: 1500px) {
   .preorder-module-lottery {
    padding: 0 16px;
  }
}
@media (max-width: 840px) {
  .preorder-module-buy {
    margin-top: 0px;
  }
  .preorder-module-lottery {
    margin: 40px auto 0 auto;
    :deep(.SuperDraw) {
      width: auto;
      .wrapper {
        justify-content: center;
      }
    }
    :deep(.task-list-pad) {
      width: auto;
    }
  }
  .preorder-module-preview {
    margin-top: 40px;
  }
  .preorder-module-ending {
    margin: 40px auto 0px auto;
  }
}
</style>