<template>
  <div class="order-center-page">
    <!-- 顶部标题栏（复用“我的”系列页面结构，返回按钮调客户端 goBack） -->
    <div class="top-header">
      <div
        class="back-btn"
        tabindex="0"
        role="button"
        aria-label="返回"
        @click="handleBack"
        @keydown.enter.prevent.stop="handleBack"
        @keydown.space.prevent.stop="handleBack"
      >
        <span class="sp sp1"></span>
      </div>
      <div class="title-text">我的订单</div>
    </div>

    <!-- Tab 切换：加速器订单 / 游戏订单（加速器 Tab 仅客户端 ≥ 2.0.18 展示） -->
    <div class="tab-bar" role="tablist">
      <div
        v-if="showAcceleratorTab"
        class="tab-item"
        :class="{ 'is-active': activeTab === ACCELERATOR_TAB }"
        role="tab"
        tabindex="0"
        :aria-selected="activeTab === ACCELERATOR_TAB ? 'true' : 'false'"
        @click="switchTab(ACCELERATOR_TAB)"
        @keydown.enter.prevent="switchTab(ACCELERATOR_TAB)"
        @keydown.space.prevent="switchTab(ACCELERATOR_TAB)"
      >
        加速器订单
      </div>
      <div
        class="tab-item"
        :class="{ 'is-active': activeTab === GAME_TAB }"
        role="tab"
        tabindex="0"
        :aria-selected="activeTab === GAME_TAB ? 'true' : 'false'"
        @click="switchTab(GAME_TAB)"
        @keydown.enter.prevent="switchTab(GAME_TAB)"
        @keydown.space.prevent="switchTab(GAME_TAB)"
      >
        游戏订单
      </div>
    </div>

    <!-- 订单列表内容区（样式与 OrderCenterDialog 一致） -->
    <div class="scroll-box" ref="scrollBox">
      <!-- ==================== 加速器订单 ==================== -->
      <template v-if="showAcceleratorTab && activeTab === ACCELERATOR_TAB">
        <div class="list-wrap" v-if="accelOrderList.length || accelLoading">
          <section class="list-content">
            <div class="accel-order-item" v-for="order in accelOrderList" :key="order.orderId">
              <div class="accel-main">
                <span class="accel-name">{{ order.productName || '-' }}</span>
                <span class="accel-price">¥{{ formatPrice(accelDisplayPrice(order)) }}</span>
              </div>
              <div class="accel-sub">
                <span class="accel-meta">
                  <span>{{ formatAccelTime(order) }}</span>
                  <span v-if="order.payChannelName" class="accel-channel">{{ order.payChannelName }}</span>
                </span>
                <span class="accel-status">{{ order.orderStatusName || '-' }}</span>
              </div>
            </div>

            <div class="loading-more" v-if="accelLoading && accelOrderList.length > 0">
              <img :src="loadingImg" class="loading-icon-small" alt="加载中" />
              <span>加载中...</span>
            </div>
            <div class="loading-more" v-else-if="accelHasMore && accelOrderList.length > 0">
              <span>加载更多</span>
            </div>
          </section>
        </div>
        <div v-else class="no-content">暂无订单记录</div>
      </template>

      <!-- ==================== 游戏订单（沿用既有实现） ==================== -->
      <template v-else>
      <div class="list-wrap" v-if="orderList.length || loading">
        <section class="list-content">
          <div class="loading-wrap" v-if="loading && orderList.length === 0">
            <img :src="loadingImg" class="loading-icon" alt="加载中" />
            <span class="loading-text">加载中...</span>
          </div>

          <div class="order-item" v-for="(order, index) in orderList" :key="index">
            <div class="order-header">
              <div class="order-game-name"><span class="span">游戏：</span>{{ order.sname || order.softName || order.gameName || order.productName || '-' }}</div>
            </div>
            <div class="order-body">
              <span class="order-no"><span class="span">订单号：</span>{{ order.oid || order.orderNo || order.orderId || '-' }}</span>
              <span
                v-if="order.oid || order.orderNo || order.orderId"
                class="copy-text"
                role="button"
                tabindex="0"
                @click="copyOrderNo(order)"
                @keydown.enter.prevent="copyOrderNo(order)"
              >
                <img :src="copyIcon" alt="">
              </span>
            </div>
            <div class="order-footer">
              <span class="order-time"><span class="span">购买时间：</span>{{ formatTime(order.createTime || order.orderTime) }}</span>
              <div class="order-price"><span class="span">价格：</span>¥{{ formatPrice(order.payPrice || order.price || order.amount) }}</div>
              <div v-if="hasCdkey(order)" class="order-cdkey">
                <i>
                  <span class="cdkey-label">激活码：</span>
                  <span class="cdkey-value">{{ order.code || order.cdkey || order.activationCode || order.exchangeCode }}</span>
                </i>
                <span
                  class="copy-text"
                  role="button"
                  tabindex="0"
                  @click="copyCdkey(order)"
                  @keydown.enter.prevent="copyCdkey(order)"
                >
                  <img :src="copyIcon" alt="">
                </span>
              </div>
              <div class="copy-expire" v-if="order.expire"><span class="cdkey-label">有效期：</span><span class="expire-value">{{ order.expire }}</span></div>
              <el-button v-if="isUnpaid(order)" type="primary" size="mini" @click="goPay(order)">去支付</el-button>
            </div>
            <div
              class="order-exchange"
              role="button"
              tabindex="0"
              @click="openExchange(order)"
              @keydown.enter.prevent="openExchange(order)"
            >
              <span>查看兑换方式</span>
            </div>
          </div>

          <div class="loading-more" v-if="loading && orderList.length > 0">
            <img :src="loadingImg" class="loading-icon-small" alt="加载中" />
            <span>加载中...</span>
          </div>
          <div class="loading-more" v-else-if="hasMore && orderList.length > 0">
            <span>加载更多</span>
          </div>
        </section>
      </div>
      <div v-else class="no-content">暂无订单记录</div>
      </template>
    </div>

    <p class="customService">
      <a
        href="https://wpa1.qq.com/Rv8GtYe8?_type=wpa&qidian=true"
        target="_blank"
      >
        <i class="iconfont"><img :src="logoQq" alt=""></i>联想客服QQ：800182717
      </a>
    </p>

    <!-- 移动端支付弹层（微信/支付宝） -->
    <MobilePayDialog
      :visible="showMobilePayDialog"
      :product="selectedProduct"
      @close="showMobilePayDialog = false"
      @pay-success="onPaySuccess"
    />

    <!-- 兑换方式弹窗（复用支付后激活码页） -->
    <MobilePayDialog
      :visible="showExchangeDialog"
      :activation-only="true"
      :activation-code="exchangeCode"
      @close="showExchangeDialog = false"
    />
  </div>
</template>

<script>
import signRequest from '@/utils/signRequest.js'
import loadingImg from '@/images/loading.png'
import copyIcon from './copy.png'
import logoQq from './logo-qq.png'
import MobilePayDialog from '@/views/GameCenter/Activity/Preorder/MobilePayDialog.vue'
import { getAcceleratorOrders } from '@/api/accelerator.js'

// Tab 标识
const ACCELERATOR_TAB = 'accelerator'
const GAME_TAB = 'game'

// #9 LZ_personalOrderCenterShow 的 handoffType 取值：1 激活码（cdk，游戏订单）/ 2 加速器
const HANDOFF_TYPE_CDK = 1
const HANDOFF_TYPE_ACCELERATOR = 2

export default {
  name: 'OrderCenter',
  components: { MobilePayDialog },
  data() {
    return {
      ACCELERATOR_TAB,
      GAME_TAB,
      // 默认展示加速器订单（与设计稿一致）
      activeTab: ACCELERATOR_TAB,
      // #9 曝光去重：每个 handoffType 在页面一次生命周期内各报一次，来回切 tab 不重复报
      orderCenterShownTypes: [],
      // ===== 加速器订单分页状态 =====
      accelOrderList: [],
      accelCurrent: 1,
      accelSize: 10,
      accelTotal: 0,
      accelHasMore: false,
      accelLoading: false,
      accelLoaded: false,
      // ===== 游戏订单分页状态（沿用既有逻辑） =====
      showMobilePayDialog: false,
      selectedProduct: null,
      showExchangeDialog: false,
      exchangeCode: '',
      loading: false,
      orderList: [],
      current: 1,
      size: 10,
      total: 0,
      hasMore: false,
      loadingImg,
      copyIcon,
      logoQq
    }
  },
  computed: {
    // 迅游加速器订单 Tab 复用全局版本门槛（客户端 ≥ 2.0.18），与迅游入口保持一致
    showAcceleratorTab() {
      return this.$isXunyouEnabled
    }
  },
  created() {
    // 低于版本门槛时不展示加速器 Tab，默认落到游戏订单
    this.activeTab = this.showAcceleratorTab ? ACCELERATOR_TAB : GAME_TAB
  },
  mounted() {
    this.$emit('headerStatus', false)
    this.$store.dispatch('pageLoaded', false)
    const scrollBox = this.$refs.scrollBox
    if (scrollBox) {
      scrollBox.addEventListener('scroll', this.handleScroll)
    }
    // 只加载当前 tab，另一个 tab 首次切换时再请求
    this.loadActiveTab()
    // #9 订单中心曝光：进入页面默认即加速器订单 tab，报 handoffType=2（游戏订单 tab 首次进入时再报 1）
    this.reportOrderCenterShow(HANDOFF_TYPE_ACCELERATOR)
  },
  beforeUnmount() {
    const scrollBox = this.$refs.scrollBox
    if (scrollBox) {
      scrollBox.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    // #9 个人订单中心曝光（pv）：1 激活码（cdk）/ 2 加速器
    // 去重口径：每个 handoffType 在页面一次生命周期内各报一次
    reportOrderCenterShow(handoffType) {
      if (this.orderCenterShownTypes.includes(handoffType)) return
      this.orderCenterShownTypes.push(handoffType)
      this.$dataReport('user', 'LZ_personalOrderCenterShow', 'pv', { handoffType })
    },
    // 切换 tab：首次进入该 tab 时才拉数据，并回到顶部
    switchTab(tab) {
      if (this.activeTab === tab) return
      if (tab === ACCELERATOR_TAB && !this.showAcceleratorTab) return
      this.activeTab = tab
      const scrollBox = this.$refs.scrollBox
      if (scrollBox) {
        scrollBox.scrollTop = 0
      }
      // #9 首次进入游戏订单 tab 时补报 handoffType=1（切回加速器 tab 不重复报）
      this.reportOrderCenterShow(
        tab === ACCELERATOR_TAB ? HANDOFF_TYPE_ACCELERATOR : HANDOFF_TYPE_CDK
      )
      this.loadActiveTab()
    },
    loadActiveTab() {
      // 低版本客户端无加速器 Tab，兜底回落到游戏订单，避免请求加速器订单接口
      if (this.activeTab === ACCELERATOR_TAB && !this.showAcceleratorTab) {
        this.activeTab = GAME_TAB
      }
      if (this.activeTab === ACCELERATOR_TAB) {
        if (!this.accelLoaded) {
          this.loadAccelOrderList()
        }
        return
      }
      if (!this.orderList.length) {
        this.loadOrderList()
      }
    },
    // 当前 tab 是否还有下一页（滚动加载用）
    activeHasMore() {
      return this.activeTab === ACCELERATOR_TAB ? this.accelHasMore : this.hasMore
    },
    activeLoading() {
      return this.activeTab === ACCELERATOR_TAB ? this.accelLoading : this.loading
    },
    // ===== 加速器订单 =====
    async loadAccelOrderList() {
      // 首页加载沿用项目统一的 PageLoading 全屏 loading（alpha:0 透明底 + 居中 loading 图标），
      // 与我的订单其它页面/其它业务页保持一致；加载更多仍用列表内联提示。
      const isFirstPage = this.accelCurrent === 1
      this.accelLoading = true
      if (isFirstPage) {
        this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      }
      try {
        const { records, total } = await getAcceleratorOrders({
          current: this.accelCurrent,
          size: this.accelSize
        })
        this.accelOrderList = this.accelCurrent === 1 ? records : [...this.accelOrderList, ...records]
        this.accelTotal = total
        this.accelHasMore = this.accelOrderList.length < total
        this.accelLoaded = true
      } catch (e) {
        console.error('加载加速器订单失败', e)
      } finally {
        this.accelLoading = false
        if (isFirstPage) {
          this.$store.dispatch('pageLoaded', false)
        }
      }
    },
    // 未支付订单没有实付金额，回退展示下单金额
    accelDisplayPrice(order) {
      const price = order.payPriceYuan !== null && order.payPriceYuan !== undefined
        ? order.payPriceYuan
        : order.orderPriceYuan
      return price
    },
    // 支付时间为空（未支付订单）时展示占位，避免显示空白
    formatAccelTime(order) {
      const time = order.payTimeStr || order.createTime || order.createTimeStr
      if (!time) return '-'
      return this.formatTime(time)
    },
    // 支付成功：刷新订单列表
    onPaySuccess() {
      this.current = 1
      this.loadOrderList()
    },
    async loadOrderList() {
      this.loading = true
      try {
        const res = await signRequest({
          url: `${process.env.MIDDLE_PLATFORM.GATEWAY}/cloud-softwaresale/api/v2/game/order/search`,
          method: 'GET',
          params: {
            page: this.current,
            size: this.size
          }
        })
        if (res && res.code === 10000) {
          const records = res.data?.records || res.data?.list || []
          this.orderList = this.current === 1 ? records : [...this.orderList, ...records]
          this.total = res.data?.total || 0
          this.hasMore = this.orderList.length < this.total
        }
      } catch (e) {
        console.error('加载订单列表失败', e)
      } finally {
        this.loading = false
      }
    },
    handleBack() {
      if (window.LegionZoneMobile && window.LegionZoneMobile.nativeCall) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'goBack')
        return
      }
      if (this.$parentRouter && this.$parentRouter.back) {
        this.$parentRouter.back()
      }
    },
    handleScroll() {
      const scrollBox = this.$refs.scrollBox
      if (!scrollBox) return
      const { scrollTop, scrollHeight, clientHeight } = scrollBox
      if (scrollTop + clientHeight >= scrollHeight - 10 && this.activeHasMore() && !this.activeLoading()) {
        this.loadMore()
      }
    },
    // 按当前 tab 决定加载下一页
    loadMore() {
      if (this.activeLoading() || !this.activeHasMore()) return
      if (this.activeTab === ACCELERATOR_TAB) {
        this.accelCurrent += 1
        this.loadAccelOrderList()
        return
      }
      this.current += 1
      this.loadOrderList()
    },
    formatTime(time) {
      if (!time) return '-'
      if (typeof time === 'string') {
        return time.substring(0, 16).replace('T', ' ')
      }
      return time
    },
    formatPrice(price) {
      const value = Number(price)
      return Number.isNaN(value) ? '0.00' : value.toFixed(2)
    },
    hasCdkey(order) {
      return !!(order.code || order.cdkey || order.activationCode || order.exchangeCode)
    },
    isUnpaid(order) {
      return ['PENDING', 'UNPAID', 'WAIT_PAY'].includes(order.tradeState || order.status)
    },
    copyCdkey(order) {
      const cdkey = order.code || order.cdkey || order.activationCode || order.exchangeCode
      if (!cdkey) return
      const value = String(cdkey)
      const success = () => this.$successMessage('复制成功')
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(success).catch(() => this.copyByTextarea(value))
        return
      }
      this.copyByTextarea(value)
    },
    copyOrderNo(order) {
      const orderNo = order.oid || order.orderNo || order.orderId
      if (!orderNo) return
      this.copyByTextarea(String(orderNo))
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
      this.$successMessage(copied ? '复制成功' : '复制失败，请手动复制')
    },
    openExchange(order) {
      this.exchangeCode = order.code || order.cdkey || order.activationCode || order.exchangeCode || ''
      this.showExchangeDialog = true
    },
    goPay(order) {
      // 手机/Pad 设备（含横屏）统一走微信/支付宝支付弹层，仅 PC 走商城扫码支付组件。
      if (this.$isPadDevice || this.$isPhoneDevice) {
        this.selectedProduct = {
          skuId: order.skuId || order.softId,
          currentPrice: order.price ?? order.amount,
          skuName: order.sname || order.softName || order.gameName || order.productName || ''
        }
        this.showMobilePayDialog = true
        return
      }

      this.$fhPay({
        channel: 'cdkorder',
        type: 0,
        skuId: order.skuId || order.softId,
        price: order.price || order.amount
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.order-center-page {
  $theme-color: #eaf7ff;
  font-family: Microsoft YaHei;
  color: $theme-color;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #000;

  .top-header {
    position: relative;
    flex-shrink: 0;
    padding: 0 30px;
    display: flex;
    align-items: center;
    height: 74px;
    /* 标题栏不加分隔线：与 tab 区之间保持纯色背景，去掉多余的一条线 */

    .back-btn {
      position: absolute;
      left: 30px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      gap: 12px;

      .sp {
        &.sp1 {
          width: 24px;
          height: 24px;
          background-image: url('~@/images/gamecenter/myFollowedGames/arrow-left.svg');
          background-size: 100% 100%;
        }
      }
    }

    .title-text {
      font-weight: 700;
      font-style: Bold;
      font-size: 22px;
      line-height: 29px;
      margin-left: 40px;
    }

    .back-btn:focus-visible {
      outline: 2px solid #4fc3f7;
      outline-offset: 2px;
      border-radius: 2px;
    }
  }

  .scroll-box {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .list-wrap {
    padding: 23px 30px 38px 23px;

    .list-content {
      position: relative;
      /* 订单卡片限宽 800px 并居中：超宽屏下卡片整行铺满会显得被横向拉伸 */
      max-width: 800px;
      margin: 0 auto;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  .loading-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;

    .loading-icon {
      width: 40px;
      height: 40px;
    }

    .loading-text {
      margin-top: 12px;
      font-size: 14px;
      color: #EAF7FF99;
    }
  }

  .order-item {
    padding: 16px;
    margin-bottom: 20px;
    border-radius: 4px;
    background: rgba(57, 64, 77, 0.30);

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .order-game-name {
        flex: 1;
        color: #EAF7FF;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
      }
    }

    .order-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .order-no {
        color: #EAF7FF;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
      }
    }

    .order-footer {
      .order-time {
        color: #EAF7FF;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
      }

      .order-price {
        color: #EAF7FF;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
        margin-top: 8px;
      }

      .order-cdkey {
        margin-top: 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        padding: 10px 0;
        border-top: 1px solid rgba(234, 247, 255, 0.10);

        .cdkey-label {
          font-size: 14px;
          color: rgba(234, 247, 255, 0.40);
        }

        .cdkey-value {
          color: #EAF7FF;
          font-family: "Microsoft YaHei";
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: normal;
        }
      }

      .copy-expire {
        color: rgba(234, 247, 255, 0.40);
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;

        .expire-value {
          color: #EAF7FF;
        }
      }
    }

    .order-exchange {
      margin-top: 10px;
      padding-top: 16px;
      border-top: 1px solid rgba(234, 247, 255, 0.10);
      text-align: center;
      cursor: pointer;

      span {
        color: #386efe;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: normal;
      }
    }
  }

  // ==================== Tab 切换 ====================
  .tab-bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);

    .tab-item {
      position: relative;
      /* 每个 tab 等分整行宽度，文案居中 */
      flex: 1;
      padding: 14px 0 12px;
      margin-right: 0;
      color: rgba(234, 247, 255, 0.60);
      font-size: 16px;
      font-weight: 400;
      line-height: normal;
      text-align: center;
      cursor: pointer;

      &.is-active {
        color: #386efe;
        font-weight: 700;
      }

      // 选中态下划线：铺满整个 tab 宽度，与底部整条线对齐
      &.is-active::after {
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 2px;
        border-radius: 0;
        background-color: #386efe;
      }
    }

    .tab-item:focus-visible {
      outline: 2px solid #4fc3f7;
      outline-offset: 2px;
      border-radius: 2px;
    }
  }

  // ==================== 加速器订单卡片 ====================
  .accel-order-item {
    padding: 16px;
    margin-bottom: 20px;
    border-radius: 4px;
    background: rgba(57, 64, 77, 0.30);

    .accel-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .accel-name {
        flex: 1;
        min-width: 0;
        margin-right: 12px;
        color: #EAF7FF;
        font-size: 16px;
        font-weight: 400;
        line-height: normal;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .accel-price {
        flex-shrink: 0;
        color: #EAF7FF;
        font-size: 18px;
        font-weight: 400;
        line-height: normal;
      }
    }

    .accel-sub {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .accel-meta {
        display: flex;
        align-items: center;
        color: rgba(234, 247, 255, 0.60);
        font-size: 14px;
        line-height: normal;

        .accel-channel {
          margin-left: 10px;
        }
      }

      .accel-status {
        flex-shrink: 0;
        margin-left: 12px;
        color: rgba(234, 247, 255, 0.60);
        font-size: 14px;
        line-height: normal;
      }
    }
  }

  .loading-more,
  .no-more {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #EAF7FF99;
    font-size: 14px;

    .loading-icon-small {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }
  }

  .no-content {
    text-align: center;
    color: #EAF7FF99;
    padding-top: 100px;
  }

  .copy-text {
    cursor: pointer;

    img {
      width: 16px;
      height: 16px;
    }
  }

  .iconfont {
    width: 16px;
    height: 16px;

    img {
      width: 16px;
      height: 16px;
      margin-top: 2px;
      margin-right: 4px;
    }
  }

  .customService {
    flex-shrink: 0;
    width: 100%;
    text-align: center;
    padding: 12px 0;

    a {
      color: rgba(234, 247, 255, 0.60);
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
    }
  }

  .span {
    color: rgba(234, 247, 255, 0.40);
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
  }
}

@media (max-width: 840px) {
  .order-center-page {
    .top-header {
      padding: 0 20px;
    }

    .list-wrap {
      padding: 16px 16px 38px 16px;
    }

    .order-item {
      padding: 12px 12px 16px 12px;
      margin-bottom: 16px;
    }
  }
}

/*
 * 宽屏（>960px，即 window.innerWidth >= 961）：左侧竖向 tab + 右侧订单列表。
 * 用 grid 而不是新增 DOM：标题栏横跨整行，tab 占左列并贯穿到底部，
 * 列表占右列，客服 QQ 行留在右列底部（与设计稿一致，不被侧栏压住）。
 */
@media (min-width: 961px) {
  .order-center-page {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr) auto;

    .top-header {
      grid-row: 1;
      grid-column: 1 / -1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    /* 左侧竖向 tab：选中项为高亮底 + 左边缘蓝色竖条 */
    .tab-bar {
      grid-row: 2 / 4;
      grid-column: 1;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      padding: 20px 0;
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      border-bottom: 0;
      background: #141414;

      /* 必须嵌在 .tab-bar 内：基础样式是 .tab-bar .tab-item，
         平级写会因优先级更低而整段失效（margin-right 会撑窄选中态宽度） */
      .tab-item {
        /* 基础样式的 flex:1 在竖排下会把 tab 纵向撑高，这里必须复位 */
        flex: none;
        padding: 14px 24px;
        margin-right: 0;
        font-size: 16px;
        line-height: 24px;
        text-align: left;

        &.is-active {
          background: rgba(255, 255, 255, 0.06);
        }

        /* 横向的整宽底边下划线在竖排下改为右边缘竖条（贴侧栏与内容区的分隔线） */
        &.is-active::after {
          top: 0;
          right: 0;
          bottom: 0;
          left: auto;
          width: 3px;
          height: auto;
          border-radius: 0;
        }
      }

      .tab-item:focus-visible {
        outline-offset: -2px;
      }
    }

    .scroll-box {
      grid-row: 2;
      grid-column: 2;
    }

    /* 列表限宽居中，避免超宽屏下卡片被横向拉伸 */
    .list-wrap {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 40px 40px;
    }

    .customService {
      grid-row: 3;
      grid-column: 2;
    }
  }
}

@media (forced-colors: active) {
  .order-center-page .top-header .back-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
