<template>
  <div class="Main" :class="{'PhoneDevice': $isPhoneDevice}" @click.stop>
    <div :class="{ wide: layout === 1 }" class="confirm-content">
      <section>
        <h1>{{ title }}<button @click="operate(1)" /></h1>
        <div class="content">
          <img v-if="!$isPhoneDevice" :src="icon" alt="">
          <div class="text-content">
            <p v-if="message" v-html="message" />
            <p v-if="subMessage" v-html="subMessage" />
          </div>
        </div>
      </section>
      <footer>
        <div>
          <button v-if="showCancelButton" ref="cancelBtn" @click="operate(2)">{{ cancelButtonText }}</button>
          <button ref="confirmBtn" @click="operate(4)" :class="{ 'unShowCancelButton':!showCancelButton && rememberKey }">{{ confirmButtonText }}</button>
        </div>
        <el-checkbox
          v-if="rememberKey && !$isPhoneDevice"
          v-model="rememberChecked"
          @change="rememberChange">不再提示</el-checkbox>
      </footer>
    </div>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

const INFO_ICON = new URL('./info.png', import.meta.url).href
const WARNING_ICON = new URL('./warning.png', import.meta.url).href

export default {
  name: 'Main',
  data() {
    return {
      layout: 0, // 0：正常布局（上下），1：宽布局（左右）
      type: 'info',
      title: '提示',
      message: '',
      subMessage: '',
      rememberKey: '',
      rememberDays: 30,
      rememberChecked: false,
      cancelButtonText: '取消',
      confirmButtonText: '确定',
      showCancelButton: true,
      reject: null,
      resolve: null
    }
  },
  computed: {
    icon() {
      return this.type === 'warning' ? WARNING_ICON : INFO_ICON
    }
  },
  mounted() {
    document.addEventListener('keydown', this.keydown)
    this.$nextTick(() => {
      if (this.$refs.confirmBtn) {
        this.$refs.confirmBtn.focus()
      }
    })
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.keydown)
  },
  methods: {
    keydown(e) {
      if (e.key === 'Escape') {
        this.operate(3)
      }
    },
    operate(type) {
      if (type === 4) {
        this.resolve()
      } else {
        this.reject(type)
      }

      this.$destroy()
    },
    rememberChange(rememberChecked) {
      if (rememberChecked) {
        localStorage.setItem(this.rememberKey, '1')
      } else {
        localStorage.removeItem(this.rememberKey)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .Main {
    position: fixed;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 999999;
    background-color: rgba(0, 0, 0, 0.5);
    .confirm-content {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 500px;
      height: auto;
      transform: translate(-50%, -50%);
      background: linear-gradient(180deg, #272F38 0%, #1A1E24 100%);
      box-shadow: 0px 6px 16px 4px rgba(13, 13, 13, 0.2), 0px 4px 8px 0px rgba(13, 13, 13, 0.32), 0px 2px 3px -2px #0D0D0D;
      border: 1px solid rgba(234, 247, 255, 0.1);
      > section {
        background: linear-gradient(180deg, #1B2027 0%, #14191E 100%);
        padding-top: 10px;
        > h1 {
          font-weight: normal;
          font-size: 14px;
          color: rgba(234, 247, 255, 0.6);
          padding-left: 16px;
          padding-right: 12px;
          height: 24px;
          display: flex;
          align-items: center;
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
        > div.content {
          > img {
            display: block;
            width: 80px;
            height: 80px;
            margin: 0 auto;
          }
          > div {
            padding: 24px;
            padding-top: 8px;
            > p {
              font-size: 14px;
              color: #EAF7FF;
              line-height: 24px;
              text-align: center;
              &:nth-child(2) {
                margin-top: 4px;
                color: rgba(234, 247, 255, 0.4);
              }
            }
          }
        }
      }
      > footer {
        height: auto;
        background: linear-gradient(180deg, #1E232A 0%, #1A1E24 100%);
        position: relative;
        > div {
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: center;
          > button {
            outline: none;
            cursor: pointer;
            width: 120px;
            height: 36px;
            font-size: 14px;
            color: rgba(234, 247, 255, 0.6);
            letter-spacing: 2px;
            margin-right: 30px;
            background: linear-gradient(360deg, rgba(57, 64, 77, 0.3) 0%, rgba(57, 64, 77, 0) 100%);
            border: 1px solid rgba(234, 247, 255, 0.3);
            &:hover {
              background: linear-gradient(360deg, rgba(57, 64, 77, 0.5) 0%, rgba(57, 64, 77, 0) 100%);
              border: 1px solid rgba(234, 247, 255, 0.6);
              color: rgba(234, 247, 255, 1);
            }
            &:active {
              background: linear-gradient(360deg, rgba(57, 64, 77, 0.3) 0%, rgba(57, 64, 77, 0) 100%);
              border: 1px solid rgba(234, 247, 255, 0.4);
              color: rgba(234, 247, 255, 0.7);
            }
            &:disabled {
              cursor: not-allowed;
              background: linear-gradient(360deg, rgba(57, 64, 77, 0.3) 0%, rgba(57, 64, 77, 0) 100%);
              border: 1px solid rgba(234, 247, 255, 0.2);
              color: rgba(234, 247, 255, 0.2);
            }
            &:last-child {
              margin-right: 0;
              background: none;
              border: none;
              color: rgba(234, 247, 255, 1);
              text-shadow: 0px 3px 1px rgba(234, 247, 255, 0.2);
              background-repeat: no-repeat;
              background-size: contain;
              background-position: center;
              background-image: url("./button_normal.png");
              &:hover {
                background-image: url("./button_hover.png");
              }
              &:active {
                background-image: url("./button_active.png");
              }
              &:disabled {
                background-image: url("./button_disabled.png");
                color: rgba(234, 247, 255, 0.2);
                text-shadow: none;
              }
              &:focus-visible {
                outline: 2px solid #4fc3f7;
                outline-offset: 2px;
              }
            }
            &:focus-visible {
              outline: 2px solid #4fc3f7;
              outline-offset: 2px;
            }
            &.unShowCancelButton {
              margin-left: 333px;
            }
          }
        }
        .el-checkbox {
          position: absolute;
          left: 39px;
          top: 50%;
          transform: translateY(-50%);
        }
        :deep(.el-checkbox) {
          box-sizing: content-box;
          .el-checkbox__label {
            font-size: 14px;
            color: rgba(234, 247, 255, 0.4);
            padding-left: 10px;
          }
        }
      }
      &.wide {
        width: 500px;
        > section {
          > div.content {
            padding: 24px 36px 55px 36px;
            display: flex;
            align-items: center;
            > img {
              width: 50px;
              height: 50px;
              margin: -10px 0 0 1px;
            }
            > div {
              margin-left: 10px;
              width: 0;
              flex: 1 1 auto;
              padding: 0;
              > p {
                text-align: left;
                margin-left: 8px;
                &:nth-child(1) {
                  font-size: 16px;
                }
                &:nth-child(2) {
                  font-size: 14px;
                  margin-top: 9px;
                }
              }
            }
          }
        }
      }
    }
  }

  .PhoneDevice {
      .confirm-content {
        width: 300px;
        &.wide {
          width: 300px;
        }
    }
    .confirm-content.wide > section > div.content {
      padding: 24px 10px ;
    div {
        margin-left: 0;
    }
    }
    .confirm-content > footer > div > button.unShowCancelButton {
      margin-left: auto;
      height: 36px;
      width: 100px;
      margin-right: 10px;
    }
    .text-content {
      text-align: center;
      margin-left: 0;
    }
     .confirm-content.wide > section > div.content > div > p:nth-child(1) {
      text-align: center;
      font-size: 14px;
      margin-left: 0;
    }
         .confirm-content.wide > section > div.content > div > p:nth-child(2) {
                text-align: center;
      font-size: 12px;
            margin-left: 0;
    }
     .confirm-content > footer > div > button {
      margin-right: 12px;
    }
  }

  @media (max-width: 550px) {
    .Main .confirm-content,
    .Main .confirm-content.wide {
      width: calc(100vw - 40px);
    }
  }

</style>
