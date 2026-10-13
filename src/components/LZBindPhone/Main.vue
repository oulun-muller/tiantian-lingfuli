<template>
  <el-dialog
    :model-value="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    class="lg-dialog bindphone-dialog"
    title="绑定手机号"
    width="400px"
    @close="closeBindPhone"
  >
    <el-form ref="formRef" :model="form" :rules="formRules">
      <p class="info">请输入手机号</p>
      <el-form-item prop="phone">
        <el-input
          v-model="form.phone"
          maxlength="11"
          placeholder="你的联系方式">
        </el-input>
      </el-form-item>

      <p class="info verify-info">输入短信验证码</p>
      <el-form-item prop="verifyCode">
        <el-input v-model="form.verifyCode" placeholder="请输入验证码">
          <template #append><span :class="{'clocking': startClock}" tabindex="0" role="button" :aria-label="startClock ? `已发送，请等待${count}秒` : '获取验证码'" @click="clickVerifyBtn" @keydown.enter.prevent.stop="clickVerifyBtn" @keydown.space.prevent.stop="clickVerifyBtn">{{ startClock? `已发送（${count}s）`: '获取验证码' }}</span></template>
        </el-input>
      </el-form-item>
      <el-button class="submit-btn" @click.stop="clickSubmit">确认<i v-if="isLoading" class="loading"></i></el-button>
    </el-form>
    <VerifyCodePop :visible="showVerifyPop" :phone="form.phone" @close="val=>closeVerifyPop(val)"/>
  </el-dialog>
</template>
<script>
import VerifyCodePop from './VerifyCodePop'
import { bindAccountByST } from './bindAccountRequest'

export default {
  name: 'Main',
  components: {
    VerifyCodePop
  },
  data() {
    return {
      reject: null,
      resolve: null,
      isLoading: false,
      visible: true,
      imgCode: '',
      image: '',
      code: '',
      form: {
        phone: '',
        verifyCode: ''
      },
      formRules: {
        phone: [{
          required: true,
          message: '请输入手机号',
          trigger: 'change'
        },
        {
          validator(rule, value, callback) {
            if (!value || /^1[3456789]\d{9}$/i.test(value)) {
              callback()
            } else {
              callback(new Error('手机号输入错误'))
            }
          },
          trigger: ['blur', 'change']
        }],
        verifyCode: {
          required: true,
          message: '请输入验证码',
          trigger: 'change'
        }
      },
      showVerifyPop: false,
      count: 60,
      startClock: false,
      intervalTimer: null
    }
  },
  computed: {
    userInfo: function() {
      return this.$store.state.user.userInfo
    }
  },
  beforeUnmount() {
    if (this.intervalTimer) clearInterval(this.intervalTimer)
  },
  methods: {
    closeBindPhone() {
      this.$dataReport('user', 'LZ_bindPhoneNumberPopupClick', 'click', {
        clickType: 2
      })
      this.visible = false
    },
    startClockTimer() {
      if (this.startClock) return
      this.startClock = true
      if (this.intervalTimer) clearInterval(this.intervalTimer)
      this.intervalTimer = setInterval(() => {
        if (this.count > 0) {
          this.count--
        } else {
          this.count = 60
          this.startClock = false
          clearInterval(this.intervalTimer)
        }
      }, 1000)
    },
    closeVerifyPop(val) {
      if (val) {
        this.startClockTimer()
      }
      this.showVerifyPop = false
    },
    clickVerifyBtn() {
      this.$dataReport('user', 'LZ_getVerificationCodeClick', 'click')
      this.$refs.formRef.validateField(['phone']).then(valid => {
        if (valid) {
          this.showVerifyPop = true
        }
      }).catch(() => {})
    },

    clickSubmit() {
      this.$dataReport('user', 'LZ_bindPhoneNumberPopupClick', 'click', {
        clickType: 1
      })
      if (this.isLoading) return
      this.$refs.formRef.validate().then((res) => {
        if (!res) return
        this.isLoading = true
        bindAccountByST({
          phone: this.form.phone,
          code: this.form.verifyCode
        }).then((res) => {
          // lenovoid 需要等1s才会更新结果
          setTimeout(() => {
            this.isLoading = false
            if (res) {
              this.showVerifyPop = false
              this.visible = false
              window.LegionZone.nativeCall('DoudouPlugin.dll', 'BindPhoneDone', {})
              this.resolve()
            }
          }, 1000)
        }).catch(() => {
          this.isLoading = false
          this.reject()
        })
      }).catch(() => {})
    }

  }
}
</script>
<style lang="scss" scoped>
:deep(.bindphone-dialog), .verifycode-dialog {
  background: linear-gradient(180deg, #272F38 0%, #1A1E24 100%);
  .el-dialog__header {
    font-size: 14px;
    font-weight: 400;
    line-height: 24px;
    color: rgba(234, 247, 255, 0.60);
  }
  .el-dialog__body {
    padding: 30px 30px 24px 30px;
  }
  .info {
    color: #EAF7FF;
    font-size: 14px;
    font-weight: 400;
    line-height: 24px;
    margin-bottom: 12px;
  }
  .verify-info {
    margin-top: 30px;
  }

  .clocking {
    color: rgba(234, 247, 255, 0.6);
  }
  .submit-btn {
    display: block;
    margin: 0 auto;
    margin-top: 45px;
  }
  .el-input__inner {
    background-color: rgba(0, 0, 0, 0.40);
    line-height: 36px;
    height: 36px;
    border-radius: 0;
    border: 0 none;
  }
  .el-form-item__content::after {
    display: none;
  }
  .el-form-item__error {
    padding-top: 6px;
    color: #892838;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
  }
  .is-error .el-form-item__content {
    border: 1px solid #cf2a40;
  }
  .el-input-group__append {
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0.40);
    border-radius: 0;
    border: 0 none;
    color: #EAF7FF;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
  }
  input[type="text"]::placeholder {
    color: rgba(234, 247, 255, 0.30);
  }
  .el-button--default {
    background: linear-gradient(271deg, #CACACA 0.28%, #EDF8FF 102.01%);
    border: 1px solid #A3A3A3;
    color: #000;
    font-size: 14px;
    font-weight: 700;
    line-height: 22px;
    letter-spacing: 2px;
  }
  .loading {
    position: absolute;
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(234, 247, 255, 0.8);
    border-top-color: rgba(0, 0, 0, 0.2);
    border-right-color: rgba(0, 0, 0, 0.2);
    border-bottom-color: rgba(0, 0, 0, 0.2);
    border-radius: 100%;
    animation: circle infinite 0.75s linear;
    margin-top: 4px;
    margin-left: 4px;
    vertical-align: -3px;
  }
}

@keyframes circle {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}

:deep(.el-input-group__append span:focus-visible) {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  :deep(.el-input-group__append span:focus-visible) {
    outline: 2px solid Highlight;
  }
}
</style>
