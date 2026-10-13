<template>
  <section>
    <!-- 已经实名认证未满18周岁 -->
    <div class="Main notFull" @click.stop v-if="realNameStatus === 1">
      <div>
        <header>
          <h1>{{ title }}<button @click="operate(1)" aria-label="关闭" /></h1>
        </header>
        <div class="content">
          <img src="./image/icon.png" alt="">
          <p>根据相关法律法规，需年满18周岁才可获取游戏。</p>
        </div>
        <footer>
          <div>
            <button @click="operate(2)">确定</button>
          </div>
        </footer>
      </div>
    </div>
    <!-- 未实名认证 -->
    <div class="Main" @click.stop v-if="realNameStatus === 2">
      <div>
        <header>
          <h1>{{ title }}<button @click="operate(1)" aria-label="关闭" /></h1>
        </header>
        <div class="content">
          <p>根据相关法律法规，需完成实名认证并年满18周岁才可获取游戏。 实名信息提交后不可修改，请谨慎填写。</p>
          <el-form
            ref="realNameAuthenticationQuery"
            :model="form"
            :rules="rules"
            label-width="94px"
            label-position="left"
            class="lg-form">
            <p>真实姓名</p>
            <el-form-item prop="name">
              <el-input
                class="input"
                v-model.trim="form.name"
                type="text"
                placeholder="请输入名字"
                @focus="showErrMessage=false" />
            </el-form-item>
            <p>身份证号码</p>
            <el-form-item prop="id">
              <el-input
                class="input"
                v-model.trim="form.id"
                type="text"
                placeholder="请输入证件号码"
                @focus="showErrMessage=false" />
            </el-form-item>
          </el-form>
        </div>
        <div class="err-mess" v-if="errMessage && showErrMessage">{{ errMessage }}</div>
        <footer>
          <div>
            <button @click="operate(3)">{{ confirmButtonText }}</button>
          </div>
        </footer>
      </div>
    </div>
  </section>
</template>

<script>
import { callLegacy, getLegacyUserInfo } from '@/compat/legacyGlobals'
import {
  realNameAuthenticationQuery,
  goRealNameAuthentication,
  encryptStr
} from './authentication'

export default {
  name: 'Main',
  data() {
    return {
      form: {
        name: '',
        id: ''
      },
      title: '实名认证',
      confirmButtonText: '提交认证',
      gameName: '',
      softid: '',
      reject: null,
      resolve: null,
      realNameStatus: -1, // 1：已经实名认证，未满18周岁 2：未实名认证，需要弹框去实名认证
      rules: {
        name: [
          { required: true, message: '请填写姓名', trigger: 'blur' }
        ],
        id: [
          { required: true, message: '请填写身份证号码', trigger: 'blur' }
        ]
      },
      errMessage: '',
      showErrMessage: false
    }
  },
  computed: {
    userInfo() {
      return getLegacyUserInfo()
    }
  },
  created() {
    if (!this.userInfo) {
      this.$login()

      this.reject()
      this.$destroy()
      this.$el.parentNode.removeChild(this.$el)
      return
    }

    this.checkRealNameStatus()
  },
  methods: {
    checkRealNameStatus(showConfirm = false) {
      realNameAuthenticationQuery().then(res => {
        if (!res || !res.code) throw new Error('failed')

        const { code, data } = res
        if (code === 20001) { // 未实名认证
          this.realNameStatus = 2
          this.$dataReport(
            'LZ_myGames',
            'LZ_realnameAuthenticationPopupShow',
            'pv',
            {
              detail: JSON.stringify({
                lenovoid: this.userInfo ? this.userInfo.UserID : '',
                gameName: this.gameName,
                softid: this.softid
              })
            }
          )
          return
        }

        if (code !== 10000 || !data) throw new Error('failed')

        if (code === 10000 && data) {
          if (data.age < 18) { // 已经实名认证但不满18周岁
            this.realNameStatus = 1

            if (showConfirm) {
              this.realNameResultReport(3)
            }
            return
          }

          if (data.age >= 18) { // 已经实名认证且满18周岁
            if (showConfirm) {
              callLegacy('$message', {
                message: '实名认证成功',
                type: 'success',
                duration: 2500,
                customClass: 'lg-message--success'
              })

              this.realNameResultReport(1)
            }

            this.resolve(true)
            this.$destroy()
            this.$el.parentNode.removeChild(this.$el)
            return
          }
        }
      }).catch((err) => {
        this.realNameStatus = 2
        throw new Error(err)
      })
    },
    operate(type) {
      if (type === 3) {
        this.realNameClickReport(1)
        this.$refs.realNameAuthenticationQuery.validate().then(() => {
          goRealNameAuthentication({
            name: encryptStr(this.form.name),
            idNumber: encryptStr(this.form.id)
          }).then((res) => {
            if (!res || !res.code) throw new Error('goRealNameAuthentication failed')

            if ([30000, 20002, 20003, 20004, 20005].includes(res.code)) {
              this.errMessage = {
                30000: '系统繁忙，请稍后再试！',
                20002: '实名信息不匹配，请重新输入',
                20003: '国家认证中心系统繁忙，请稍后再试！',
                20004: '国家认证中心校验实名信息中，请耐心等待',
                20005: '证件信息错误，请重新输入'
              }[res.code]

              this.showErrMessage = true
              this.realNameResultReport(2)
              return
            }

            if (res.code !== 10000 || !res.data) throw new Error('goRealNameAuthentication failed')

            this.checkRealNameStatus(true)
          }).catch(() => {
            this.errMessage = '出错了，请稍后再试！'
            this.showErrMessage = true
            this.realNameResultReport(2)
          })
        })
      } else {
        this.realNameClickReport(2)
        this.reject()
        this.$destroy()
        this.$el.parentNode.removeChild(this.$el)
      }
    },
    realNameClickReport(clickType) {
      this.$dataReport(
        'LZ_myGames',
        'LZ_realnameAuthenticationPopupClick',
        'click',
        {
          detail: JSON.stringify({
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            gameName: this.gameName,
            softid: this.softid,
            clickType: clickType
          })
        }
      )
    },
    realNameResultReport(status) {
      this.$dataReport(
        'LZ_myGames',
        'LZ_realnameAuthenticationResultPopupShow',
        'pv',
        {
          detail: JSON.stringify({
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            gameName: this.gameName,
            softid: this.softid,
            status: status,
            errmessage: status === 2 ? this.errMessage : ''
          })
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
        width: 600px;
        height: 422px;
        transform: translate(-50%, -50%);
        background: linear-gradient(180deg, #1a1f25 0%, #14161b 92.44%);
        box-shadow: 0px 6px 16px 4px rgba(13, 13, 13, 0.2), 0px 4px 8px 0px rgba(13, 13, 13, 0.32), 0px 2px 3px -2px #0D0D0D;
        border: 1px solid rgba(234, 247, 255, 0.1);
        overflow: hidden;
        > header {
          height: 65px;
          > h1 {
            font-weight: normal;
            font-size: 14px;
            color: rgba(234, 247, 255, 0.6);
            height: 24px;
            display: flex;
            align-items: center;
            padding: 20px 10px 0 15px;
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
        > div.content {
          color: rgba(234, 247, 255, .6);
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: 20px;
          padding: 0 30px;
          box-sizing: border-box;
          .el-form {
            margin-top: 14px;
            p {
              color: #EAF7FF;
              font-size: 16px;
              font-style: normal;
              font-weight: 400;
              line-height: 24px;
              &:nth-of-type(2) {
                margin-top: 24px;
              }
            }
            :deep(.el-form-item__content) {
              margin-left: 0!important;
              margin-top: 18px;
              width: 539px;
              .el-input__inner {
                border-color: rgba(234, 247, 255, .2);
                background-color:transparent;
                height: 32px;
                line-height: 32px;
                padding: 0 10px;
                caret-color: rgba(56, 110, 254, 1);
              }
              ::-webkit-input-placeholder {
                color: rgba(234, 247, 255, 0.40);
                font-size: 13px;
                font-style: normal;
                font-weight: 400;
                line-height: 22px;
              }
              :focus {
                border-color: rgba(56, 110, 254, .8);
              }
              .el-form-item__error {
                color: rgba(207, 42, 64, 0.80);
                font-size: 12px;
                font-style: normal;
                font-weight: 400;
                line-height: 12px;
                margin-top: 2px;
              }
            }
            :deep(.el-form-item.is-error .el-input__inner) {
              border: 1px solid #CF2A40;
            }
          }
        }
        > div.err-mess {
          position: absolute;
          left: 30px;
          bottom: 111px;
          color: rgba(207, 42, 64, 0.80);
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: 12px;
        }
        > footer {
          height: auto;
          position: relative;
          > div {
            height: 87px;
            display: flex;
            align-items: center;
            justify-content: center;
            > button {
              margin-bottom: 4px;
              cursor: pointer;
              width: 120px;
              height: 36px;
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
        }
      }
      &.notFull {
        > div {
          width: 400px;
          height: 257px;
          > header {
            height: 37px;
            > h1 {
              padding: 20px 11px 0 15px;
            }
          }
          > div.content {
            color: #EAF7FF;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 20px;
            padding-left: 30px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            > img {
              width: 80px;
              height: 80px;
            }
            > p {
              margin-top: 7px;
              margin-left: 14px;
            }
          }
          > footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 83px;
            background: linear-gradient(180deg, #1E232A 0%, #1A1E24 100%);
            > div {
              height: 100%;
              > button {
                width: 120px;
                height: 36px;
                color: #EAF7FF;
                background: none;
                border: none;
                background: url('./image/button_normal.png') no-repeat;
                background-size: 100% 100%;
                background-position:top center;
                margin-bottom: 0;
                &:focus-visible {
                  outline: 2px solid #4fc3f7;
                  outline-offset: 2px;
                }
                &:hover {
                  background: url('./image/button_hover.png') no-repeat;
                  background-size: 100% 100%;
                  background-position:top center;
                }
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 550px) {
    .Main > div {
      width: calc(100vw - 40px);
    }
    .Main > div .lg-form .el-form-item__content {
      width: auto;
    }
  }

</style>
