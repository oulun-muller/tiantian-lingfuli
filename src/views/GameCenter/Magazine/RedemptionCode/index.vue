<template>
  <section>
    <div class="Main" @click.stop v-if="isLenovoDevice && userInfo">
      <div>
        <header>
          <h1>使用兑换码<button aria-label="关闭" @click="operate(1)" /></h1>
        </header>
        <section v-if="pageType===1">
          <div class="code-content">
            <h1>输入兑换码，对应游戏商品将添加至您的账号中</h1>
            <p>兑换码示例：XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</p>
            <el-form
              ref="codeQuery"
              :model="form"
              :rules="rules"
              label-width="94px"
              label-position="left"
              class="lg-form">
              <el-form-item prop="code">
                <el-input
                  class="input"
                  v-model.trim="form.code"
                  type="text"
                  placeholder="请输入兑换码"
                  @focus="showErrMessage=false"
                  @input="handleCode" />
              </el-form-item>
            </el-form>
            <div class="err-mess" v-if="errMessage && showErrMessage">{{ errMessage }}</div>
            <footer>
              <button @click="operate(2)">确认兑换</button>
            </footer>
          </div>
        </section>
        <section v-if="pageType===2">
          <div class="success-content">
            <img src="./image/success.png" alt="">
            <h1>恭喜您！成功兑换《{{ serverProductName }}》</h1>
            <span>您可以在<i>“我的游戏”</i>中管理所有游戏</span>
            <footer>
              <button @click="operate(3)">安装游戏</button>
            </footer>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script>

import { redeemCodeRedemption } from '@/api/gameCenter'
export default {
  name: 'Main',
  data() {
    return {
      form: {
        code: ''
      },
      errMessage: '',
      showErrMessage: false,
      pageType: -1,
      serverProductName: '',
      rules: {
        code: [
          { required: true, message: '兑换码不能为空', trigger: 'blur' },
          { validator: (rule, value, callback) => {
            const reg = /^[A-Za-z0-9-]+$/
            if (value && !reg.test(value)) {
              callback(new Error('兑换码格式不正确'))
            } else {
              callback()
            }
          } }
        ]
      }
    }
  },
  props: {
    showRedemptionCode: {
      type: Boolean,
      default: false
    },
    productName: {
      type: String,
      default: ''
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    isLenovoDevice() {
      return this.$store.state.system.isLenovoDevice
    }
  },
  created() {
    if (!this.isLenovoDevice) {
      this.$message({
        message: '仅联想设备可以使用！',
        type: 'warning',
        duration: 2500,
        customClass: 'lg-message--warning'
      })

      this.$emit('hideRedemptionCode')
      return
    }

    if (!this.userInfo) {
      this.$login()

      this.$emit('hideRedemptionCode')
      return
    }

    this.pageType = 1
    this.$dataReport(
      'LZ_gamingCenter',
      'LZ_storeRedeemCodesPopupShow',
      'pv',
      {
        plateName: this.productName
      }
    )
  },
  methods: {
    operate(type) {
      if (type === 2) {
        this.$dataReport(
          'LZ_gamingCenter',
          'LZ_storeRedeemCodesPopupClick',
          'click',
          {
            plateName: this.productName,
            clickType: 1
          }
        )

        this.$refs.codeQuery.validate().then(() => {
          redeemCodeRedemption({ code: this.form.code.replace(/-/g, '') }).then(res => {
            if (!res || !res.code || res.code !== 10000) {
              this.errMessage = res.message || '兑换失败，请稍后再试！'
              this.showErrMessage = true
              this.redeemResultReport('', 2)
              return
            }

            this.$message({
              message: '兑换成功！',
              type: 'success',
              duration: 2500,
              customClass: 'lg-message--success'
            })

            this.serverProductName = res.data.productName || ''
            this.redeemResultReport(this.serverProductName, 1)
            this.pageType = 2
            this.$emit('hideRedemptionCode', true)
          }).catch((error) => {
            this.errMessage = error.message || '兑换失败，请稍后再试！'
            this.showErrMessage = true
            this.redeemResultReport('', 2)
          })
        }).catch(() => {})

        return
      }

      if (type === 3) {
        this.$parentRouter.push({ path: '/mygame/index', query: { needScroll: true }})
        this.$dataReport(
          'LZ_gamingCenter',
          'LZ_storeRedeemCodesResultPopupClick',
          'click',
          {
            detail: JSON.stringify({
              plateName: this.productName,
              lenovoid: this.userInfo ? this.userInfo.UserID : '',
              clickType: 1
            })
          }
        )
      }

      if (type === 1) {
        if (this.pageType === 1) {
          this.$dataReport(
            'LZ_gamingCenter',
            'LZ_storeRedeemCodesPopupClick',
            'click',
            {
              plateName: this.productName,
              clickType: 2
            }
          )
        } else if (this.pageType === 2) {
          this.$dataReport(
            'LZ_gamingCenter',
            'LZ_storeRedeemCodesResultPopupClick',
            'click',
            {
              detail: JSON.stringify({
                plateName: this.productName,
                lenovoid: this.userInfo ? this.userInfo.UserID : '',
                clickType: 2
              })
            }
          )
        }
      }

      this.$emit('hideRedemptionCode')
    },
    redeemResultReport(productName, status) {
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeRedeemCodesResultPopupShow',
        'pv',
        {
          detail: JSON.stringify({
            plateName: productName,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            status: status,
            errmessage: status === 2 ? this.errMessage : ''
          })
        }
      )
    },
    handleCode(val) {
      const str = val.replace(/-/g, '')
      const formattedStr = str.replace(/(.{5})/g, '$1-').replace(/-$/, '')
      this.form.code = formattedStr
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
            }
          }
        }
        > section {
          > div.code-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            > h1 {
              color: #EAF7FF;
              font-size: 20px;
              font-style: normal;
              font-weight: 700;
              line-height: 17px;
              margin-top: 98px;
            }
            > p {
              color: rgba(234, 247, 255, 0.40);
              font-size: 14px;
              font-style: normal;
              font-weight: 400;
              line-height: 8px;
              margin-top: 24px;
              margin-left: -6px;
            }
            .el-form {
              margin-top: 0;
              width: 420px;
              :deep(.el-input--small .el-input__inner) {
                height: 36px;
                line-height: 36px;
                text-align: center;
                font-weight: 700;
              }
              :deep(.el-form-item__content) {
                margin-left: 0!important;
                margin-top: 46px;
                .el-form-item__error {
                  color: rgba(207, 42, 64, 0.80);
                  padding-top: 8px;
                }
              }
              :deep(.el-form-item.is-error .el-input__inner) {
                border: 1px solid #CF2A40;
              }
            }
            > div.err-mess {
              color: rgba(207, 42, 64, 0.80);
              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              line-height: 12px;
              position: absolute;
              bottom: 182px;
              left: 209px;
            }
            > footer {
              width: 120px;
              height: 36px;
              margin-top: 89px;
              > button {
                width: 120px;
                height: 36px;
                cursor: pointer;
                color: #000;
                text-align: center;
                font-size: 14px;
                font-style: normal;
                font-weight: 700;
                line-height: 22px;
                letter-spacing: 2px;
                border-radius: 0;
                background: linear-gradient(to bottom, rgb(146, 146, 146), rgb(234, 247, 255));
                border: 1px solid;
                border-image: linear-gradient(245deg, #fff, #999) 1;
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
          }
          > div.success-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            > img {
              width: 88px;
              height: 88px;
              margin-top: 80px;
            }
            > h1 {
               color: #EAF7FF;
               text-align: center;
               font-size: 20px;
               font-style: normal;
               font-weight: 700;
               line-height: normal;
               margin-top: 26px;
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
            > footer {
              width: 120px;
              height: 36px;
              margin-top: 89px;
               > button {
                width: 120px;
                height: 36px;
                cursor: pointer;
                color: #000;
                text-align: center;
                font-size: 14px;
                font-style: normal;
                font-weight: 700;
                line-height: 22px;
                letter-spacing: 2px;
                border-radius: 0;
                background: linear-gradient(to bottom, rgb(146, 146, 146), rgb(234, 247, 255));
                border: 1px solid;
                border-image: linear-gradient(245deg, #fff, #999) 1;
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
          }
        }
      }
    }
  }
</style>

<style scoped>
section div.Main > div > header > h1 > button:focus-visible,
section div.Main > div > section > div > footer > button:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

@media (forced-colors: active) {
  section div.Main > div > header > h1 > button:focus-visible,
  section div.Main > div > section > div > footer > button:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
