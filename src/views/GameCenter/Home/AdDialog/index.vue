<template>
  <el-dialog
    :model-value="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="false"
    :show-close="false"
    class="lg-dialog ad-dialog"
    title=""
    width="45vw"
    @close="closeAd"
  >
    <div
      @click="clickImg"
      @keydown.enter.prevent="clickImg"
      @keydown.space.prevent="clickImg"
      tabindex="0"
      role="button"
      :aria-label="'广告图片' + (homePagepopUpData.imgUrl ? '，点击查看详情' : '')"
      class="dialog-content"
      :style="{ backgroundImage: `url(${ homePagepopUpData.imgUrl || imgUrl})` }">
      <span class="close-icon" tabindex="0" role="button" aria-label="关闭广告" @click.stop="closeAd" @keydown.enter.prevent.stop="closeAd" @keydown.space.prevent.stop="closeAd"></span>
      <div v-if="homePagepopUpData.btnImgUrl" class="btn" tabindex="0" role="button" aria-label="广告按钮" @click.stop="clickBtn" @keydown.enter.prevent.stop="clickBtn" @keydown.space.prevent.stop="clickBtn" :style="{ backgroundImage: `url(${ homePagepopUpData.btnImgUrl || imgUrl})` }"></div>
      <p v-if="homePagepopUpData.showRemindCloseBtn" class="remind-text" @click.stop="toggoleRemind">
        <span
          :class="['checkbox', notRemind?'select':'' ]"
          role="checkbox"
          :aria-checked="notRemind ? 'true' : 'false'"
          tabindex="0"
          @keydown.enter.prevent.stop="toggoleRemind"
          @keydown.space.prevent.stop="toggoleRemind"
        ></span>不再提醒</p>
    </div>
  </el-dialog>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import { goToOperation } from '@/utils'
import { getHomePagepopUp } from '@/api/gameCenter'
export default {
  data() {
    return {
      visible: false,
      imgUrl: resolveAsset('images/gamecenter/hdefault.png'),
      notRemind: false,
      homePagepopUpData: {},
      currentData: null,
      lsData: {}
    }
  },
  computed: {
    system() {
      return this.$store.state.system
    }
  },
  methods: {
    toggoleRemind() {
      this.notRemind = !this.notRemind
      this.setData({
        isCheckedRemind: this.notRemind
      })
    },
    closeAd() {
      console.log('closeAd')
      this.visible = false
    },
    clickBtn() {
      // this.clickReport(4)
      const { btnJumpType, btnJumpContent } = this.homePagepopUpData
      if (!btnJumpType || !btnJumpContent) return
      goToOperation(btnJumpType, btnJumpContent, '', this.$router)
      this.visible = false
    },
    clickImg() {
      const { imgJumpType, imgJumpContent } = this.homePagepopUpData
      if (!imgJumpType || !imgJumpContent) return
      goToOperation(imgJumpType, imgJumpContent, '', this.$router)
      this.visible = false
    },
    setData(data) {
      const homeData = {
        ...this.lsData,
        ...data
      }
      localStorage.setItem('HomeAdConfig', JSON.stringify(homeData))
    },
    setDialogStatus() {
      /** 服务端数据
       * 不再提醒 showRemindCloseBtn: true false
       * 默认展开 unfold: 2-首次 3-每次
       */
      const { showRemindCloseBtn, unfold, id } = this.homePagepopUpData
      /** 用户信息 ls:
       * isCheckedRemind: 勾选过不再提醒
       * isShowed: 展示过
       */
      try {
        this.lsData = JSON.parse(localStorage.getItem('HomeAdConfig')) || {}
      } catch (e) {
        this.lsData = {}
      }
      const { isCheckedRemind, isShowed, lid } = this.lsData
      if (id !== lid) {
        localStorage.removeItem('HomeAdConfig')
        this.lsData = {
          lid: id,
          isCheckedRemind: false,
          isShowed: false
        }
        this.setData(this.lsData)
      }
      if (showRemindCloseBtn && isCheckedRemind) {
        this.visible = false
        return
      }
      if (unfold === 2 && isShowed) {
        this.visible = false
        return
      }
      if (unfold === 3 && isCheckedRemind) {
        this.visible = false
        return
      }
      this.visible = true
      this.setData({
        isShowed: true
      })
    }
  },
  mounted() {
    getHomePagepopUp({
      activeTime: this.system?.activeTime || '',
      legionChannel: this.system?.Channel || 'unknow',
      legionModel: this.system?.MTMInfo?.ReadableMachineName || 'unknow',
      legionMtCode: this.system?.MTMInfo?.MTCode || 'unknow',
      legionVersion: this.system?.version || 'unknow',
      mac: this.system?.mac || 'unknow',
      osBits: this.system?.MTMInfo?.OSBit || 'unknow',
      osVersion: this.system?.MTMInfo?.OS || 'unknow',
      sn: this.system?.MTMInfo?.MachineName || 'unknow'
    }).then(res => {
      if (!res) {
        return
      }

      this.homePagepopUpData = res
      this.setDialogStatus()
    }).finally(() => {
    })
  }
}
</script>
<style lang="scss">
.ad-dialog.lg-dialog {
  padding: 0;
  transform: translate(-50%, -56%) !important;
  max-width: 300px;
  .dialog-content {
    width: 45vw;
    height: 60vw;
    max-width: 300px;
    max-height: 400px;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center center;
    .remind-text {
      position: absolute;
      bottom: -34px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 16px;
      .checkbox {
        margin-right: 8px;
        border: 1px solid #ffffff7a;
        display: inline-block;
        width: 16px;
        height: 16px;
        vertical-align: -2px;
        &.select {
          background-color: #335EFF;
          color: #fff;
          border: 0 none;
          &::before {
            content: '√';
            position: absolute;
            top: 2.5px;
            left: 2.5px;
          }
        }
      }
    }
    .close-icon {
      position: absolute;
      top: -42px;
      right: 12px;
      width: 4vw;
      height: 4vw;;
      max-width: 32px;
      max-height: 32px;
      background: url(@/images/icon/close-icon.png) no-repeat center center / 100% 100%;
      cursor: pointer;
      &:focus-visible {
        outline: 2px solid #4fc3f7;
        outline-offset: 2px;
        border-radius: 4px;
      }
    }
    .btn {
      position: absolute;
      width: 260px;
      height: 72px;
      bottom: 36px;
      left: 50%;
      transform: translateX(-50%);
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center center;
      cursor: pointer;
      &:focus-visible {
        outline: 2px solid #4fc3f7;
        outline-offset: 2px;
        border-radius: 4px;
      }
    }
  }
  .el-dialog__header {
    padding: 0;
    .el-dialog__close {
      padding: 10px;
      margin-left: -14px;
    }
  }
  .el-dialog__body {
    padding: 0;
  }
}

.ad-dialog .dialog-content:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

.ad-dialog .checkbox:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .ad-dialog .dialog-content:focus-visible,
  .ad-dialog .checkbox:focus-visible,
  .ad-dialog .close-icon:focus-visible,
  .ad-dialog .btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
