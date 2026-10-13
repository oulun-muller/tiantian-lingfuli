<template>
  <Dialog class="contact-pop" :visible="visible" :title="`${popType === 'add' ? '填写': '查看' }联系方式`" @close="$emit('close')">
    <div class="contact-content">
      <h3 class="info">请填写您的有效联系方式，以帮助我们联系到您并发放奖品。</h3>
      <ul class="form-wrap">
        <li>
          <p class="label">姓名</p>
          <input :disabled="doubleCheckPop || popType!=='add'" v-model="form.userName" type="text" placeholder="请输入姓名" >
        </li>
        <li>
          <p class="label">电话</p>
          <input :disabled="doubleCheckPop || popType!=='add'" v-model="form.phoneNum" type="text" placeholder="请输入电话" >
        </li>
        <li>
          <p class="label">地址</p>
          <textarea :disabled="doubleCheckPop || popType!=='add'" v-model="form.address" type="text" placeholder="请输入详细地址" />
        </li>
      </ul>
      <div v-if="popType=== 'add'" class="common-rect-btn submit-btn" tabindex="0" role="button" aria-label="确认提交" @click="clickConfirm" @keydown.enter.prevent.stop="clickConfirm" @keydown.space.prevent.stop="clickConfirm">确认提交</div>
    </div>
    <div v-if="doubleCheckPop" class="double-check-pop">
      <p class="info">请确认个人信息内容，提交将后无法修改</p>
      <div class="btn-wrap">
        <div class="cancel-btn" tabindex="0" role="button" aria-label="取消" @click="doubleCheckPop = false" @keydown.enter.prevent.stop="doubleCheckPop = false" @keydown.space.prevent.stop="doubleCheckPop = false">取消</div>
        <div class="common-rect-btn" tabindex="0" role="button" aria-label="确认提交" @click="clickSubmit" @keydown.enter.prevent.stop="clickSubmit" @keydown.space.prevent.stop="clickSubmit">确认提交</div>
      </div>
    </div>
  </Dialog>
</template>
<script>
import { submitPrizeAddress } from '@/api/activity'
export default {
  props: {
    source: {
      type: String,
      default: ''
    },
    visible: {
      type: Boolean,
      default: false
    },
    popType: {
      type: String,
      default: 'add'
    },
    drawId: {
      type: Number,
      default: null
    },
    contactInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: {
        userName: '',
        phoneNum: '',
        address: ''
      },
      doubleCheckPop: false,
      fromChannel: this.$route.query?.fromChannelName || ''
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  mounted() {
    this.$dataReport(
      'LZ_gamingCenter',
      'LZ_fillContactInformationPopupShow',
      'pv',
      {
        detail: JSON.stringify({
          source: this.source === 'lottery' ? 1 : 2,
          status: this.popType === 'add' ? 2 : 1,
          lenovoid: this.userInfo?.UserID || ''
        })
      }
    )

    if (!this.contactInfo?.userName) return
    const { userName, phoneNum, address } = this.contactInfo
    this.form = {
      userName,
      phoneNum,
      address
    }
  },
  methods: {
    clickSubmit() {
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_submitContactInformationClick',
        'click',
        {
          detail: JSON.stringify({
            source: this.source === 'lottery' ? 1 : 2,
            lenovoid: this.userInfo?.UserID || ''
          })
        }
      )
      submitPrizeAddress({
        drawId: this.drawId || this.contactInfo.id,
        ...this.form,
        channel: this.fromChannel || 'LegionZone'
      }).then(res => {
        this.$successMessage('提交成功!')
        this.$dataReport(
          'LZ_gamingCenter',
          'LZ_fillContactInformationResults',
          '',
          {
            detail: JSON.stringify({
              source: this.source === 'lottery' ? 1 : 2,
              status: 1,
              lenovoid: this.userInfo?.UserID || ''
            })
          }
        )
      }).catch(err => {
        this.$errorMessage(err.message || '请稍后再试！')
        this.$dataReport(
          'LZ_gamingCenter',
          'LZ_fillContactInformationResults',
          '',
          {
            detail: JSON.stringify({
              source: this.source === 'lottery' ? 1 : 2,
              status: 2,
              error: err.message,
              lenovoid: this.userInfo?.UserID || ''
            })
          }
        )
      }).finally(() => {
        this.doubleCheckPop = false
        this.$emit('close')
      })
    },
    clickConfirm() {
      if (this.doubleCheckPop) return
      const valid = this.validateForm()
      if (!valid) return
      this.doubleCheckPop = true
    },
    validateForm() {
      if (!this.form.userName || !this.form.phoneNum || !this.form.address) {
        this.$errorMessage('请输入完整信息')
        return false
      }
      if (!/^1[3456789]\d{9}$/i.test(this.form.phoneNum)) {
        this.$errorMessage('请输入正确的手机号')
        return false
      }
      return true
    }
  }
}
</script>
<style lang="scss" scoped>
.contact-content {
  padding: 23px 30px;
  min-height: 400px;
  .info {
    color: #EAF7FF99;
    font-size: 12px;
    font-weight: 400;
    line-height: 20px;
  }
  .form-wrap {
    .label {
      color: #EAF7FF;
      font-size: 14px;
      font-weight: 400;
      &::before {
        content: "*";
        color: #FF0000;
        vertical-align: -3px;
        margin-right: 2px;
      }
    }
    li {
      margin-top: 30px;
      .label {
        margin-bottom: 9px;
      }
      input, textarea {
        width: 100%;
        border: 1px solid #3f454a;
        background-color: transparent;
        padding: 9px 12px;
        color: #EAF7FF;
        &:focus {
          border: 1px solid #386EFE;
          ::placeholder {
            color: #EAF7FF;
          }
        }
      }
      textarea {
        height: 60px;
      }
    }
  }
  .submit-btn {
    display: block;
    margin: 44px auto;
  }
}
.double-check-pop {
  position: absolute;
  top: 132px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  height: 232px;
  border: 1px solid #2e3439;
  background-color: #1a1e24;
  .info {
    font-size: 14px;
    font-weight: 400;
    text-align: center;
    margin: 86px 0 65px 0;
  }
  .btn-wrap {
    text-align: center;
    margin-bottom: 32px;
    .cancel-btn {
      cursor: pointer;
      display: inline-block;
      width: 120px;
      height: 36px;
      line-height: 34px;
      border: 1px solid;
      border-image: linear-gradient(245deg, #fff, #999) 1;
      color: #EAF7FF;
      margin-right: 20px;
      vertical-align: -1px;
    }
  }
}

.PhoneDevice {
  .contact-content {
    padding: 23px 16px;
    .form-wrap li input {
      width: 100%;
    }
    .form-wrap li textarea {
      width: 100%;
    }
    .info {
      font-size: 14px;
    }
  }

}
</style>

<style scoped>
.contact-content .submit-btn:focus-visible,
.double-check-pop .btn-wrap .cancel-btn:focus-visible,
.double-check-pop .btn-wrap .common-rect-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .contact-content .submit-btn:focus-visible,
  .double-check-pop .btn-wrap .cancel-btn:focus-visible,
  .double-check-pop .btn-wrap .common-rect-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
