<template>
  <div class="Main" @click.stop>
    <div>
      <section>
        <h1>{{ title }}<button aria-label="关闭" @click="operate(1)" /></h1>
        <el-form
          ref="applyTestConfirm"
          :model="form"
          :rules="rules"
          label-width="94px"
          label-position="left"
          class="lg-form">
          <p>请输入手机号</p>
          <el-form-item prop="phone">
            <el-input
              class="input"
              v-model.trim="form.phone"
              type="text"
              maxlength="11"
              placeholder="你的联系方式"/>
          </el-form-item>
        </el-form>
      </section>
      <footer>
        <div>
          <button
            :class="{'type2':type===2}"
            :aria-label="confirmButtonText"
            @click="operate(2)">{{ confirmButtonText }}</button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Main',
  data() {
    return {
      form: {
        phone: ''
      },
      title: '申请测试资格',
      type: 1,
      confirmButtonText: '申请',
      reject: null,
      resolve: null,
      rules: {
        phone: {
          validator(rule, value, callback) {
            if (!value) {
              callback(new Error('手机号不能为空'))
            } else if (!/^1[3456789]\d{9}$/.test(value)) {
              callback('手机号格式错误')
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      }
    }
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    keydown(e) {
      if (e.key === 'Escape') {
        this.operate(1)
      }
    },
    operate(type) {
      if (type === 2) {
        this.$refs.applyTestConfirm.validate().then(() => {
          this.resolve({
            success: true,
            phone: this.form.phone,
            type: this.type // 1：申请，2：填写问卷并申请
          })
          this.$destroy()
          this.$el.parentNode.removeChild(this.$el)
        })
      } else {
        this.reject(type)
        this.$destroy()
        this.$el.parentNode.removeChild(this.$el)
      }
    }
  }
}
</script>
<style lang="scss" scoped>
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
      width: 400px;
      height: 223px;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, #272F38 0%, #1A1E24 100%);
      box-shadow: 0px 6px 16px 4px rgba(13, 13, 13, 0.2), 0px 4px 8px 0px rgba(13, 13, 13, 0.32), 0px 2px 3px -2px #0D0D0D;
      border: 1px solid rgba(234, 247, 255, 0.1);
      > section {
        padding: 12px 12px 10px 16px;
        > h1 {
          display: flex;
          align-items: center;
          color: rgba(234, 247, 255, 0.60);
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 24px;
          > button {
            background-color: transparent;
            outline: none;
            border: none;
            width: 24px;
            height: 24px;
            background-image: url("./close.png");
            background-repeat: no-repeat;
            background-size: 16px 16px;
            background-position: center;
            margin-left: auto;
            cursor: pointer;
          }
        }
        > .el-form {
          margin: 30px 0 0 13px;
          > p {
            color: #EAF7FF;
            font-size: 14px;
            font-style: normal;
            font-weight: 400;
            line-height: 24px;
            margin-bottom: 13px;
          }
          .el-form-item {
            .input {
              width: 340px;
              height: 36px;
              background: rgba(0, 0, 0, 0.3);
              outline: none;
              border: none;
              color: #EAF7FF;
              font-size: 13px;
              font-style: normal;
              font-weight: 400;
              line-height: 22px;
              box-sizing: border-box;
              margin-left: -94px;
              margin-top: 10px;
              margin-top: -2px;
              &:hover {
                outline: 1px solid rgba(56, 110, 254, 0.8);
              }
              &:focus {
                outline: 1px solid rgba(56, 110, 254, 0.8);
              }
              :deep(.el-input__inner) {
                height: 36px;
                border: none;
                padding: 0 12px;
                font-size: 13px;
              }
            }
            :deep(.el-form-item__error) {
              margin-left: -94px;
              margin-top: 2px;
            }
          }
          ::-webkit-input-placeholder {
            color: rgba(234, 247, 255, 0.30);
            font-size: 13px;
            font-style: normal;
            font-weight: 400;
            line-height: 22px;
          }
        }
      }
      > footer {
        > div {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          > button {
            width: 126px;
            height: 36px;
            border: none;
            color: #000;
            text-align: center;
            font-size: 14px;
            font-style: normal;
            font-weight: 700;
            line-height: 22px;
            letter-spacing: 2px;
            background: linear-gradient(to bottom, rgb(146, 146, 146), rgb(234, 247, 255));
            border: 1px solid;
            border-image: linear-gradient(245deg, #fff, #999) 1;
            cursor: pointer;
            margin-top: -4px;
            &:hover {
              color: #fff;
              background: linear-gradient(to left, rgb(125, 125, 125), rgb(40, 40, 40));
            }
            &.type2 {
              width: 340px;
              height: 36px;
            }
          }
        }
      }
    }
  }
</style>

<style scoped>
div.Main > div > section > h1 > button:focus-visible,
div.Main > div > footer > div > button:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

@media (forced-colors: active) {
  div.Main > div > section > h1 > button:focus-visible,
  div.Main > div > footer > div > button:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
