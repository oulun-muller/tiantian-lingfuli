<template>
  <section v-if="(isLenovoDevice || $isBellatorDevice) && userInfo">
    <div class="Main" @click.stop>
      <div>
        <header>
          <h1>{{ title }}<button @click="operate(1)" aria-label="关闭" /></h1>
        </header>
        <div class="pay-loading" v-if="!ready">
          <img src="@/images/loading.png" alt="">
        </div>
        <div class="pay-content" v-if="ready && pageType===1">
          <section class="left">
            <h1 :style="{marginBottom: '30px'}">订单信息</h1>
            <div class="game-info">
              <div class="title-class">游戏</div>
              <div class="text-class">{{ orderList.productInfo.productName }}</div>
            </div>
            <div class="game-info" v-if="!$isBellatorDevice">
              <div class="title-class">平台</div>
              <div>
                <img src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/12/25/c3dca957-4acb-4dcd-ac45-b46228a23657.png" class="img-class" alt="legion Zone"/>
              </div>
            </div>
            <!-- <p>{{ orderList.productInfo.softInfo | filterSoftName }}</p> -->
            <footer :style="{marginTop: '100px'}">
              <p>注意：</p>
              <el-checkbox v-model="authenticationChecked">1.您需完成实名认证并年满18周岁才可使用游戏；</el-checkbox>
            </footer>
          </section>
          <section class="right">
            <b :class="{'is-mask':qrCodeMask}">
              <img :src="orderList.payUrl" alt="">
              <sub v-if="qrCodeMask">勾选左侧条款后<br>显示付款码</sub>
            </b>
            <p>付款金额 :<span>{{ orderList.productInfo.productCurrentPriceYuan }}</span>元 </p>
            <span>
              <img src="./image/wei.png" alt="">
              <img src="./image/zhifubao.png" alt="">
              <i>扫码完成支付</i>
            </span>
          </section>
        </div>
        <div class="pay-success" v-if="ready && pageType===2">
          <img src="./image/success.png" alt="">
          <p>恭喜您<i>！</i>支付成功<i>！</i></p>
          <span>您可以在<i>“我的游戏”</i>中管理所有游戏</span>
          <button @click.stop="operate(2)">安装游戏</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { callLegacy, getLegacyStoreState, getLegacyUserInfo } from '@/compat/legacyGlobals'
import QRCode from 'qrcode'
import {
  getPayUrl,
  getOrderDetail
} from '@/api/myGameNew.js'
export default {
  name: 'Main',
  data() {
    return {
      serviceClauseUrl: process.env.WEB.serviceClause,
      title: '购买游戏',
      confirmButtonText: '安装游戏',
      version: '',
      drinfo: '',
      reject: null,
      resolve: null,
      ready: false,
      productId: 0,
      pageType: -1,
      authenticationChecked: true,
      orderList: null,
      productType: null
    }
  },
  computed: {
    stateInfo() {
      return getLegacyStoreState(['softwareState', 'stateMap', this.softId], {})
    },
    qrCodeMask() {
      return !this.authenticationChecked
    },
    userInfo() {
      return getLegacyUserInfo()
    },
    isLenovoDevice() {
      return getLegacyStoreState('system.isLenovoDevice', false)
    },
    isShowUrl() {
      if (!this.orderList) {
        return false
      }

      if (this.orderList.payUrl && this.authenticationChecked) {
        return true
      }

      return false
    }
  },
  filters: {
    filterSoftName(val) {
      if (!val) {
        return ''
      }

      return val.map(item => item.softName).map(item => item).join(',')
    }
  },
  created() {
    if (!this.isLenovoDevice && !this.$isBellatorDevice) {
      this.$message({
        message: '仅联想设备可以使用！',
        type: 'warning',
        duration: 2500,
        customClass: 'lg-message--warning'
      })

      this.operate(3)
      return
    }

    if (!this.userInfo) {
      this.$login()
      this.operate(3)
      return
    }

    this.pageType = 1
    this.getPayUrl()
  },
  methods: {
    getPayUrl() {
      if (!this.productId) {
        callLegacy('$message', {
          message: '产品Id不能为空',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })

        return
      }

      getPayUrl({
        productId: this.productId,
        clientSource: 1
      }).then(res => {
        if (!res || res.code !== 10000 || !res.data) throw new Error('getPayUrl failed')

        this.handleData(res.data)
      }).catch((err) => {
        callLegacy('$message', {
          message: err.message || '获取支付订单失败',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
        this.urlReport(err.message)
      }).finally(() => {
        this.ready = true
      })
    },
    async handleData(data) {
      await QRCode.toDataURL(data.payUrl).then(url => {
        data.payUrl = url
      })
      this.orderList = data
      this.urlReport()
      this.orderStatusLoop()
    },
    orderStatusLoop() {
      clearTimeout(this.timer)
      let clocking = false

      getOrderDetail(this.orderList.orderId).then(res => {
        if (!res || res.code !== 10000 || !res.data) throw new Error('getOrderDetail failed')
        this.productType = res.data.productType

        if (res.data.orderStatus === 2 && res.data.syncStatus === 3) {
          clearTimeout(this.timer)
          clocking = true
          this.pageType = 2
          this.resolve(true)

          let _drinfo = JSON.parse(this.drinfo)

          _drinfo = {
            ..._drinfo,
            orderId: this.orderList.orderId
          }

          this.$dataReport(
            'LZ_gamingCenter',
            'LZ_storeLegionPlayPayResultPopupShow',
            'pv',
            {
              detail: JSON.stringify(_drinfo)
            }
          )
        }
      })

      if (!clocking) {
        this.timer = setTimeout(this.orderStatusLoop, 1000)
      }
    },
    urlReport(errMessage = '') {
      let _drinfo = JSON.parse(this.drinfo)

      _drinfo = {
        ..._drinfo,
        ...{
          ifQRCode: !errMessage ? 1 : 2,
          notQRerr: errMessage,
          orderId: this.orderList?.orderId
        }
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeLegionPlayBuyPopupShow',
        'pv',
        {
          detail: JSON.stringify(_drinfo)
        }
      )
    },
    async startDownload() {
      if (this.softPurpose === 3 && !this.stateInfo.IsGAHaveUpdate) {
        const realNameAuthRes = await this.$realNameAuthentication({
          gameName: this.softName,
          softid: this.softId
        })
        if (!realNameAuthRes) return
        await this.$gamePathSetting({
          logoFile: this.logoFile,
          softName: this.softName,
          zipSize: this.downloadInfo?.installSize || '',
          softid: this.softId
        }).then(() => {}).catch(() => {})
      }
      this.$store.dispatch('softwareState/add', {
        SoftID: this.softId,
        Version: this.version,
        SoftName: this.softName,
        LogoFile: this.logoFile,
        drinfo: this.drinfo
      })
    },
    operate(type) {
      if (type === 2) {
        // 区分是否是单机游戏，如果单机游戏 直接下载 实名认证等等。如果不是单机 就跳转
        if (this.productType === 5) {
          this.startDownload()
        } else {
          this.$parentRouter.push({ path: '/mygame/index', query: { needScroll: true }})
        }
        this.buySuccessClick(1)
      }

      if (this.pageType === 2) {
        this.buyStatusReport(3)
        if (type === 1) {
          this.buySuccessClick(2)
        }
      } else if (this.isShowUrl) {
        this.buyStatusReport(1)
      } else {
        this.buyStatusReport(2)
      }

      this.reject()
      this.$destroy()
      this.$el?.parentNode.removeChild(this.$el)
      clearTimeout(this.timer)
    },
    buyStatusReport(type) {
      let _drinfo = JSON.parse(this.drinfo)

      _drinfo = {
        ..._drinfo,
        ...{
          status: type,
          orderId: this.orderList?.orderId
        }
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeLegionPlayBuyWholeProPopXClick',
        'click',
        {
          detail: JSON.stringify(_drinfo)
        }
      )
    },
    buySuccessClick(type) {
      let _drinfo = JSON.parse(this.drinfo)

      _drinfo = {
        ..._drinfo,
        ...{
          clickType: type,
          orderId: this.orderList?.orderId
        }
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeLegionPlayPayResultPopupClick',
        'click',
        {
          detail: JSON.stringify(_drinfo)
        }
      )
    }
  }
}
</script>

<style lang="scss" scoped>
  section {
    div.Main {
      position: fixed;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 999999;
      background-color: rgba(0, 0, 0, 0.5);
      > div {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 840px;
        height: 468px;
        transform: translate(-50%, -50%);
        background: rgba(30, 35, 43, 1);
        border: 1px solid rgba(234, 247, 255, 0.1);
        overflow: hidden;
        > header {
          height: 39px;
          background: linear-gradient(270deg, #1E232B 0.32%, #2A313C 51.32%, #1E232B 99.78%);
          > h1 {
            color: #EAF7FF;
            font-weight: normal;
            font-size: 14px;
            height: 24px;
            display: flex;
            align-items: center;
            padding: 14px 13px 0 15px;
            > button {
              background-color: transparent;
              outline: none;
              border: none;
              width: 24px;
              height: 24px;
              background-image: url("./image/close.png");
              background-repeat: no-repeat;
              background-size: 16px 16px;
              background-position: center;
              margin-left: auto;
              cursor: pointer;
              &:focus-visible {
                outline: 2px solid #4fc3f7;
                outline-offset: 2px;
              }
            }
          }
        }
        .pay-content {
          height: calc(100% - 40px);
          overflow-x: hidden;
          overflow-y: scroll;
          padding: 69px 84px 10px 84px;
          box-sizing: border-box;
          display: flex;
          > section.left {
            width: 360px;
            margin-right: 120px;
            > h1 {
              color: #EAF7FF;
              font-size: 20px;
              font-style: normal;
              font-weight: 700;
              line-height: 18px;
            }
            > p {
              color: #EAF7FF;
              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: 24px;
              margin: 30px 0 79px 0;
            }
            > footer {
              > p {
                color: rgba(234, 247, 255, 0.60);
                font-size: 12px;
                font-style: normal;
                font-weight: 400;
                line-height: 22px;
             }
             .el-checkbox {
              margin-top: 12px;
              :deep(.el-checkbox__label) {
                font-size: 13px;
                color: rgba(234, 247, 255, 0.40);
              }
              &.is-checked {
                :deep(.el-checkbox__label) {
                  font-size: 13px;
                  color: rgba(234, 247, 255, 0.60);
                }
              }
              &:nth-of-type(2) {
                margin-top: 15px;
              }
             }
             > span {
              > a {
                font-size: 13px;
                color: #386EFE;
                cursor: pointer;
              }
             }
            }
          }
          > section.right {
            flex: 1;
            margin-top: -2px;
            > b {
              display: inline-block;
              width: 180px;
              height: 180px;
              border: 2px solid;
              border-image: linear-gradient(to bottom, rgba(234, 247, 255, .7),rgba(234, 247, 255, .7), rgba(179, 200, 255, 0.54)) 1;
              background: linear-gradient(180deg, #39404D 0%, #000 100%);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              &.is-mask {
                position: relative;
                &::after {
                  position: absolute;
                  left: 0;
                  top: 0;
                  content: '';
                  width: 100%;
                  height: 100%;
                  background: rgba(30, 35, 43, 0.66);
                  backdrop-filter: blur(2.5px);
                  text-align: center;
                  line-height: 100%;
                }
                > sub {
                  position: absolute;
                  z-index: 1;
                  color: #EAF7FF;
                  text-align: center;
                  font-size: 14px;
                  font-style: normal;
                  font-weight: 700;
                  line-height: 24px;
                }
              }
              img {
                width: 164px;
                height: 164px;
              }
            }
            > p {
              text-align: center;
              margin-top: 19px;
              color: #EAF7FF;
              font-size: 14px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
              span {
                font-size: 24px;
                margin:0 6px;
                font-weight: 700;
              }
            }
            > span {
              display: block;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-top: 14px;
              > img {
                width: 16px;
                height: 16px;
                margin-right: 8px;
                &:nth-of-type(2) {
                  width: 14px;
                  height: 14px;
                }
              }
              > i {
                font-size: 12px;
                color: rgba(234, 247, 255, .6);
              }
            }
          }

          .game-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 20px;
            .img-class {
              width: 105px;
              height: 16px;
              display: block;
            }
            .title-class {
              font-size: 14px;
              opacity: 0.6;
              width: 28px;
            }
            .text-class {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
        > div.pay-success {
          padding: 79px 0 50px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          > img {
            width: 88px;
            height: 88px;
          }
          > p {
            color: #EAF7FF;
            text-align: center;
            font-size: 20px;
            font-style: normal;
            font-weight: 700;
            line-height: normal;
            margin-top: 25px;
            > i {
              display: inline-block;
              width: 20px;
              transform: translateX(5px);
            }
          }
          > span {
            color: rgba(234, 247, 255, 0.60);
            text-align: center;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
            margin-top: 16px;
            > i {
              color: #EAF7FF;
              font-size: 14px;
              font-style: normal;
              font-weight: 400;
              line-height: normal;
            }
          }
          > button {
            margin-top: 88px;
            cursor: pointer;
            width: 120px;
            height: 36px;
            color: #000;
            text-align: center;
            font-size: 14px;
            font-style: normal;
            font-weight: 700;
            line-height: 22px;
            letter-spacing: 1px;
            border-radius: 0;
            background: linear-gradient(to bottom, rgb(146, 146, 146), rgb(234, 247, 255));
            border: 1px solid;
            border-image: linear-gradient(245deg, #fff, #999) 1;
            &:focus-visible {
              outline: 2px solid #4fc3f7;
              outline-offset: 2px;
            }
            &:hover {
              color: #fff;
              background: linear-gradient(to left, rgb(125, 125, 125), rgb(40, 40, 40));
              border: 1px solid;
              border-image: linear-gradient(245deg, #fff, #999) 1;
            }
            &:active {
              color: #fff;
              background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
            }
          }
        }
        > div.pay-loading {
          height: calc(100% - 40px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }

  @media (max-width: 550px) {
    section div.Main > div {
      width: calc(100vw - 40px);
    }
  }

</style>
