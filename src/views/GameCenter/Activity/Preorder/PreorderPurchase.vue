<template>
  <section>
    <!-- 新增字段：purchase.products，商品页签及商品配置数组。 -->
    <div class="purchase-tabs" v-if="displayProducts.length">
      <div
        v-for="(product, index) in displayProducts"
        :key="index"
        :class="['purchase-tab', { active: activeTabIndex === index, 'has-book-mark': hasBookMark(product.skuName) }]"
        @click="activeTabIndex = index"
      >
        {{ product.skuName || `商品${index + 1}` }}
      </div>
    </div>

    <div class="preorder-purchase">
      <div class="purchase-container">
        <!-- 商品详情（只显示当前选中的商品，页签切换时跟着切换） -->
        <div class="purchase-products" v-if="currentProduct">
          <div class="product-item">
            <!-- 新增字段：products[].image，商品竖版图。 -->
            <div class="product-image" v-if="currentProduct.image">
              <img :src="currentProduct.image" alt="" />
            </div>
            <!-- 新增字段：products[].description，商品描述图。 -->
            <div class="product-desc" v-if="currentProduct.description" :style="{ backgroundImage: `url(${currentProduct.description})` }">
              <div
                @click="handleBuy"
                @keydown.enter.prevent="handleBuy"
                @keydown.space.prevent="handleBuy"
                class="product-buy-button"
                :style="{ backgroundImage: `url(${config.buyButton})` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'PreorderPurchase',
  inject: ['activityId', 'getActivityName', 'getReportChannel', 'getReportUrl'],
  props: {
    // 购买区配置
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTabIndex: 0,
      exposeObserver: null,
      exposeTimer: null,
      isExposed: false
    }
  },
  mounted() {
    // 购买页面进入视口即上报曝光；划出再划入视为新的曝光，重复上报。
    if (typeof IntersectionObserver === 'undefined') {
      this.reportBuyShow()
      return
    }
    const rootContainer = this.$el.closest('.Activity') || null
    this.exposeObserver = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.isIntersecting && !this.isExposed) {
        this.isExposed = true
        this.exposeTimer = setTimeout(() => {
          clearTimeout(this.exposeTimer)
          this.exposeTimer = null
          this.reportBuyShow()
        }, 500)
      } else if (!entry.isIntersecting && this.isExposed) {
        this.isExposed = false
        if (this.exposeTimer) {
          clearTimeout(this.exposeTimer)
          this.exposeTimer = null
        }
      }
    }, {
      root: rootContainer,
      threshold: 0
    })
    this.exposeObserver.observe(this.$el)
  },
  beforeUnmount() {
    if (this.exposeTimer) {
      clearTimeout(this.exposeTimer)
      this.exposeTimer = null
    }
    if (this.exposeObserver) {
      this.exposeObserver.disconnect()
      this.exposeObserver = null
    }
  },
  computed: {
    // 商品展示列表：数组顺序就是页签顺序，不依赖排序字段。
    displayProducts() {
      return [...(this.config.products || [])]
    },
    // 当前选中的商品
    currentProduct() {
      return this.displayProducts[this.activeTabIndex] || this.displayProducts[0] || null
    },
    isApp() {
      return !!this.$store.state.system.version
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    channelInfo() {
      return this.$store.state.channelInfo
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') return 4
      if (this.$route.query.source === 'browser') return 9
      return this.$route.query.firstLocal || ''
    }
  },
  methods: {
    handleBuy() {
      const product = this.currentProduct || {}
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_storeCdkDetailBuyClick',
        'click',
        {
          detail: JSON.stringify({
            firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
            secondLocal: 11,
            thirdLocal: '',
            type: 2,
            plateName: this.getActivityName(),
            skuName: product.skuName || '影之刃零',
            softID: product.softId || 'L119634',
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            skuId: product.skuId || '',
            isPreOrder: 'yes',
            channel: this.getReportChannel(),
            url: this.getReportUrl()
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
      this.$emit('buy', this.currentProduct)
    },
    reportBuyShow() {
      this[this.isApp ? '$dataReport' : '$trackEvent'](
        'LZ_gamingCenter',
        'LZ_preOrderH5BuyPageShow',
        'pv',
        {
          detail: JSON.stringify({
            firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
            secondLocal: 11,
            plateName: this.getActivityName(),
            activityid: this.activityId,
            lenovoid: this.userInfo?.UserID || this.channelInfo?.channelUserInfo?.UserId,
            channel: this.getReportChannel(),
            isLabel: this.$route.query.isLabel ? 'yes' : 'no',
            configPolicy: this.$route.query?.configPolicy ? '1' : '0',
            isPreOrder: 'yes',
            url: this.getReportUrl()
          }),
          uuid: this.channelInfo?.channelUserInfo?.uuid || null
        }
      )
    },
    // 判断商品名称是否包含书名号《》（用于调整下划线居中位置）
    hasBookMark(name) {
      return name && (name.indexOf('《') > -1 || name.indexOf('》') > -1)
    }
  }
}
</script>

<style lang="scss" scoped>
.purchase-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.40);
  overflow-x: scroll;
  white-space: nowrap;
  &::-webkit-scrollbar {
    display: none;
  }
  .purchase-tab {
    color: rgba(234, 247, 255, 0.60);
    text-align: center;
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    cursor: pointer;
    transition: all 0.2s;
    padding: 16px 0;
    &:hover {
      color: rgba(255, 255, 255, 0.80);
    }
    &.active {
      color: rgba(255, 255, 255, 0.90);
      text-align: center;
      font-size: 20px;
      font-style: normal;
      font-weight: 900;
      line-height: normal;
      position: relative;
      background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 100%;
        height: 1px;
        border-bottom: 1px solid #FFF;
      }
      // 有书名号《》时：书名号在左侧导致视觉中心偏右，下划线稍微往右偏移，宽度只覆盖文字主体
      &.has-book-mark {
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 53%;
          transform: translateX(-50%);
          width: 105%;
          height: 1px;
          border-bottom: 1px solid #FFF;
        }
      }
    }
  }
}
.preorder-purchase {
  width: 100%;
  height: auto;
  .purchase-products {
    width: 100%;
    height: auto;
    .product-item {
      width: 100%;
      height: 100%;
      display: flex;
      .product-image {
        flex: 1;
        width: auto;
        height: 515px;
        overflow: hidden;
        img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
      }
      .product-desc {
        margin-left: 16px;
        width: 380px;
        height: 515px;
        background-position: center;
        background-repeat: no-repeat;
        background-size: contain;
        position: relative;
        .product-buy-button {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 16px;
          width: 100%;
          height: 56px;
          background-position: center;
          background-repeat: no-repeat;
          background-size: contain;
          cursor: pointer;
          opacity: 0.9;
          &:hover {
            opacity: 1;
          }
        }
      }
    }
  }
}

@media (max-width: 840px) {
  .preorder-purchase {
    width: 100%;
    height: auto;
    .purchase-products {
      width: 100%;
      height: auto;
      .product-item {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        .product-image {
          flex: 0 0 auto;
          width: 100%;
          max-width: 450px;
          height: auto;
          min-width: 0;
          margin: 0 auto;
          overflow: hidden;
          img {
            display: block;
            width: 100%;
            height: auto;
            object-fit: contain;
          }
        }
        .product-desc {
          margin-left: 0;
          width: 100%;
          height: 129vw;
          max-height: 607px;
          background-position: center;
          background-repeat: no-repeat;
          background-size: contain;
          position: relative;
          .product-buy-button {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 28px;
            width: 100%;
            height: 65px;
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
            cursor: pointer;
          }
        }
      }
    }
  }
}
@media (max-width: 482px) {
  .product-desc {
    margin-top: -10px;
  }
}

@media (max-width: 470px) {
  .product-buy-button {
    width: 100%;
    height: 58px!important;
  }
}
@media (max-width: 400px) {
  .product-buy-button {
    width: 100%;
    height: 48px!important;
  }
}
</style>