<template>
  <!-- 订单中心弹框（自己实现弹框壳，不共用公共 Dialog 组件） -->
  <div v-if="visible" class="order-center-dialog" @click.self="handleClose">
    <div class="dialog-content">
      <!-- 关闭按钮 -->
      <div class="dialog-close" role="button" tabindex="0" aria-label="关闭" @click="handleClose" @keydown.enter.prevent="handleClose">×</div>
      <!-- 标题 -->
      <h3 class="dialog-title">我的订单</h3>

      <!-- 订单列表内容区 -->
      <div class="list-wrap" v-if="orderList.length || loading">
        <!-- 列表内容区（可滚动，滚动到底部自动加载更多；隐藏滚动条，但是保留滚动功能） -->
        <section ref="listContent" class="list-content" @scroll="handleScroll">
          <!-- 加载中（用自定义 loading.png 图标，首次加载和加载更多时显示） -->
          <div class="loading-wrap" v-if="loading && orderList.length === 0">
            <img :src="loadingImg" class="loading-icon" alt="加载中" />
            <span class="loading-text">加载中...</span>
          </div>

          <!-- 订单卡片列表（保留原有的卡片布局，只统一颜色风格） -->
          <div class="order-item" v-for="(order, index) in orderList" :key="index">
            <div class="order-header">
              <div class="order-game-name"><span class="span">游戏：</span>{{ order.sname || order.softName || order.gameName || order.productName || '-' }}</div>
            </div>
            <div class="order-body">
              <span class="order-no"><span class="span">订单号：</span>{{ order.oid || order.orderNo || order.orderId || '-' }}</span>
              <span v-if="order.oid || order.orderNo || order.orderId" class="copy-text" role="button" tabindex="0" @click="copyOrderNo(order)" @keydown.enter.prevent="copyOrderNo(order)">
                <img src="./copy.png" alt="">
              </span>

            </div>
            <div class="order-footer">
              <span class="order-time"><span class="span">购买时间：</span>{{ formatTime(order.createTime || order.orderTime) }}</span>
              <div class="order-price"><span class="span">价格：</span>¥{{ formatPrice(order.payPrice || order.price || order.amount) }}</div>
              <!-- 激活码（仅支付成功时显示） -->
              <div v-if="hasCdkey(order)" class="order-cdkey">
                <i>
                  <span class="cdkey-label">激活码：</span>
                  <span class="cdkey-value">{{ order.code || order.cdkey || order.activationCode || order.exchangeCode }}</span>
                </i>
                <span class="copy-text" role="button" tabindex="0" @click="copyCdkey(order)" @keydown.enter.prevent="copyCdkey(order)">
                  <img src="./copy.png" alt="">
                </span>
              </div>
              <div class="copy-expire" v-if="order.expire"><span class="cdkey-label">有效期：</span><span class="expire-value">{{ order.expire }}</span></div>
              <!-- 去支付（未支付时显示） -->
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

          <!-- 加载提示（加载更多时在底部显示 loading 图标） -->
          <div class="loading-more" v-if="loading && orderList.length > 0">
            <img :src="loadingImg" class="loading-icon-small" alt="加载中" />
            <span>加载中...</span>
          </div>
          <div class="loading-more" v-else-if="hasMore && orderList.length > 0">
            <span>加载更多</span>
          </div>
        </section>
        <p class="customService">
          <a
            href="https://wpa1.qq.com/Rv8GtYe8?_type=wpa&qidian=true"
            target="_blank">
            <i class="iconfont"><img src="./logo-qq.png" alt=""></i>联想客服QQ：800182717
          </a>
        </p>
      </div>
      <!-- 空状态 -->
      <div v-else class="no-content">暂无订单记录</div>
    </div>

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
import MobilePayDialog from './MobilePayDialog.vue'

export default {
  name: 'OrderCenterDialog',
  components: { MobilePayDialog },
  props: {
    // 控制弹框显示/隐藏
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      orderList: [],
      showExchangeDialog: false,
      exchangeCode: '',
      current: 1,
      size: 10,
      total: 0,
      hasMore: false,
      loadingImg
    }
  },
  computed: {
    isApp() {
      return !!this.$store.state.system.version
    }
  },
  watch: {
    // 弹框显示时加载订单列表
    visible(val) {
      if (val) {
        this.current = 1
        this.orderList = []
        this.hasMore = true
        this.lockScroll()
        this.loadOrderList()
      } else {
        this.unlockScroll()
      }
    }
  },
  beforeUnmount() {
    this.unlockScroll()
  },
  methods: {
    // 弹窗打开时锁定背后活动页滚动，避免滚动穿透。
    lockScroll() {
      const root = document.documentElement
      root.style.overflow = 'hidden'
      if (document.body) document.body.style.overflow = 'hidden'
      this.$nextTick(() => {
        this._scrollContainer = document.querySelector('.Activity')
        if (this._scrollContainer) this._scrollContainer.style.overflow = 'hidden'
      })
    },
    unlockScroll() {
      document.documentElement.style.overflow = ''
      if (document.body) document.body.style.overflow = ''
      if (this._scrollContainer) {
        this._scrollContainer.style.overflow = ''
        this._scrollContainer = null
      }
      const container = document.querySelector('.Activity')
      if (container) container.style.overflow = ''
    },
    // 加载CDKey订单列表（调用销售中台接口，和legion-zone一致）
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
          if (this.current === 1) {
            this.orderList = records
          } else {
            this.orderList = [...this.orderList, ...records]
          }
          this.total = res.data?.total || 0
          this.hasMore = this.orderList.length < this.total
        }
      } catch (e) {
        console.error('加载CDKey订单列表失败', e)
      } finally {
        this.loading = false
      }

      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'user',
        'LZ_personalOrderCenterShow',
        'pv',
        {
          handoffType: 1
        }
      )
    },

    // 滚动到底部自动加载更多
    handleScroll() {
      const scrollContainer = this.$refs.listContent
      if (!scrollContainer) return
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      // 滚动到距离底部100px时加载更多
      if (scrollHeight - scrollTop - clientHeight < 100) {
        this.loadMore()
      }
    },

    // 加载更多
    loadMore() {
      if (this.loading || !this.hasMore) return
      this.current += 1
      this.loadOrderList()
    },

    // 格式化时间
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

    // 是否有激活码
    hasCdkey(order) {
      return !!(order.code || order.cdkey || order.activationCode || order.exchangeCode)
    },

    // 是否未支付
    isUnpaid(order) {
      return ['PENDING', 'UNPAID', 'WAIT_PAY'].includes(order.tradeState || order.status)
    },

    // 复制激活码
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

    // 查看兑换方式
    openExchange(order) {
      this.exchangeCode = order.code || order.cdkey || order.activationCode || order.exchangeCode || ''
      this.showExchangeDialog = true
    },

    // 去支付
    goPay(order) {
      // 调用 $fhPay 继续支付（复用现有CDK支付组件）
      this.$fhPay({
        channel: 'cdkorder',
        type: 0,
        skuId: order.skuId || order.softId,
        price: order.price || order.amount
      })
    },

    // 关闭弹框
    handleClose() {
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss" scoped>
/* 弹框遮罩层 */
.order-center-dialog {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 999;

  /* 弹框内容区 */
  .dialog-content {
    position: relative;
    width: 600px;
    height: 500px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    overflow: hidden;
    background-color: #171c21;
    color: #fff;
    display: flex;
    flex-direction: column;
  }

  /* 关闭按钮 */
  .dialog-close {
    position: absolute;
    top: 14px;
    right: 16px;
    z-index: 2;
    width: 10px;
    height: 10px;
    font-size: 0;
    background: transparent url('~@/images/Index/close.png') no-repeat center center / contain;
    cursor: pointer;
    &:hover {
      opacity: 0.8;
    }
    &:focus-visible {
      outline: 2px solid #4fc3f7;
      outline-offset: 2px;
      border-radius: 4px;
    }
  }

  /* 标题栏 */
  .dialog-title {
    display: flex;
    align-items: center;
    height: 39px;
    margin: 0;
    padding: 0 16px;
    background: linear-gradient(270deg, #1E232B 0.32%, #2A313C 51.32%, #1E232B 99.78%);
    color: #EAF7FF99;
    font-size: 16px;
    font-weight: 400;
  }
}

/* 列表外层容器 */
.list-wrap {
  padding: 23px 30px 38px 23px;
  flex: 1;
  min-height: 0;

  .list-content {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    /* 隐藏滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}

/* 加载中样式（首次加载，居中显示） */
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

/* 订单卡片样式 */
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
    .order-status {
      font-size: 13px;
      &.status-success { color: #66bb6a; }
      &.status-pending { color: #ffa726; }
      &.status-other { color: #EAF7FF66; }
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

/* 加载更多样式（底部显示） */
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

/* 空状态 */
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
  width: 100%;
  text-align: center;
  margin-top: 10px;
  a {
    color: rgba(234, 247, 255, 0.60);
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .order-center-dialog {
    .dialog-content {
      width: 340px;
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

@media screen and (max-width: 550px) {
  .order-center-dialog .dialog-content {
    width: calc(100vw - 40px);
  }
}

.span {
  color: rgba(234, 247, 255, 0.40);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}
</style>