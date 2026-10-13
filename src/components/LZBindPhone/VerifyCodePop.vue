<template>
  <el-dialog
    :model-value="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :modal="false"
    :append-to-body="true"
    class="lg-dialog verifycode-dialog"
    width="340px"
    @close="closeVerifyPop"
  >
    <p>请输入图形验证码</p>
    <el-form ref="formRef" :model="{ verifyCode }" :rules="formRules">
      <div class="verify-wrap">
        <el-form-item prop="verifyCode">
          <el-input v-model="verifyCode" placeholder="请输入图形验证码"></el-input>
        </el-form-item>
        <img :src="verifyImgUrl" alt="" class="verify-img" @click.stop="getVerifyCode">
      </div>
      <el-button class="submit-btn" @click.stop="clickConfirmVerify">确认</el-button>
    </el-form>
  </el-dialog>
</template>
<script>
import { randomString } from '@/utils/index'
import { getVerifyImg, verifyCodeByST } from './bindAccountRequest'
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      phoneNum: '',
      verifyCode: '',
      verifyImgUrl: '',
      randomStr: '',
      formRules: {
        verifyCode: {
          required: true,
          message: '请输入验证码',
          trigger: 'change'
        }
      }
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.phoneNum = this.phone
          this.getVerifyCode()
        }
      }
    }
  },
  methods: {
    closeVerifyPop() {
      this.verifyCode = ''
      this.$emit('close')
    },
    getVerifyCode() {
      this.randomStr = randomString(8)
      getVerifyImg({ randomStr: this.randomStr }).then(data => {
        this.verifyImgUrl = data
      })
    },
    clickConfirmVerify() {
      this.$refs.formRef.validate().then((valid) => {
        if (!valid) return
        verifyCodeByST({
          phone: this.phoneNum,
          code: this.verifyCode,
          randomStr: this.randomStr
        }).then((res) => {
          this.$dataReport('user', 'LZ_VerificationCodeSendSucc', '')
          if (res) {
            this.verifyCode = ''
            this.$emit('close', res)
          } else {
            this.getVerifyCode()
          }
        })
      }).catch(() => {})
    }
  }
}
</script>
<style lang="scss" scoped>
:deep(.verifycode-dialog) {
  .verify-wrap {
    display: flex;
    justify-content: space-between;
    margin: 12px 0;
    gap: 8px;
    .verify-img {
      width: 112px;
      height: 36px;
    }
  }
  .el-dialog__header {
    padding: 0;
  }

  .submit-btn {
    display: block;
    margin: 0 auto;
    margin-bottom: 45px;
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
}

</style>
