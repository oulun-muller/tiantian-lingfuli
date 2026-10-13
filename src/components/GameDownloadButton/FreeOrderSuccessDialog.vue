<template>
  <el-dialog
    :model-value="visible"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :modal="true"
    :append-to-body="true"
    class="lg-dialog freeorder-dialog"
    width="400px"
    @close="closeDialog"
  >
    <div class="content-wrap">
      <span class="done-icon"></span>
      <h3>恭喜您！领取成功！</h3>
      <p>您可以在<b>“我的游戏”</b>中管理所有游戏</p>
      <el-button class="grey-rect-btn" @click="clickDownloadSoft">安装游戏</el-button>
    </div>
  </el-dialog>
</template>
<script>
export default {
  name: 'FreeOrderSuccessDialog',
  props: {
    orderId: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    },
    softPurpose: {
      type: Number,
      required: true
    },
    softId: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    softName: {
      type: String,
      required: true
    },
    logoFile: {
      type: String,
      default: ''
    },
    drinfo: { // 数据上报附加信息
      type: String,
      default: ''
    },
    downloadInfo: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
    }
  },
  computed: {
    stateInfo() {
      return this.$store.state.softwareState.stateMap[this.softId] || {}
    }
  },
  methods: {
    closeDialog() {
      this.reportData(2)
      this.$emit('close', false)
    },
    async clickDownloadSoft() {
      this.reportData(1)
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
      // 点击安装游戏
      this.$store.dispatch('softwareState/add', {
        SoftID: this.softId,
        Version: this.version,
        SoftName: this.softName,
        LogoFile: this.logoFile,
        drinfo: this.drinfo
      })
      this.closeDialog()
    },
    reportData(type) {
      let _drinfo = JSON.parse(this.drinfo)

      _drinfo = {
        ..._drinfo,
        ...{
          clickType: type,
          orderId: this.orderId
        }
      }
      // 数据上报
      this.$dataReport('LZ_gamingCenter', 'LZ_magazineFreePopupClick', 'pv', {
        detail: JSON.stringify(_drinfo)
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.freeorder-dialog {
  .content-wrap {
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    .done-icon {
      margin-top: 20px;
      display: inline-block;
      width: 56px;
      height: 56px;
      background: url('~@/images/icon/done-icon.png') no-repeat;
      background-size: cover;
    }
    h3, p {
      margin-top: 20px;
    }
    p {
      color: rgb(234 247 255 / 50%);
      b {
        color: #eaf7ff;
      }
    }
    .grey-rect-btn {
      margin-top: 60px;
      margin-bottom: 40px;
      &:focus-visible {
        outline: 2px solid #4fc3f7;
        outline-offset: 2px;
      }
    }
  }
}

</style>
