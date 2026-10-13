<template>
  <button
    class="game-item-btn common-round-btn"
    :disabled="isDisabled"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
    @click.stop="handleClick"
  >
    {{ displayLabel }}
  </button>
</template>

<script>

import { reportMinigameOpen, reportApkInstall } from '@/utils/dataReport'
import { openMiniGameAndPinAndInstall, cancelDownloadInstall } from '@/utils/miniGame'

export default {
  name: 'ApkInstallButton',
  props: {
    game: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    firstLocal: {
      type: [String, Number],
      required: true
    },
    ruleCodeMapping: {
      type: String,
      default: ''
    },
    moduleName: {
      type: String,
      default: ''
    },
    supportApkFlage: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      isHovering: false
    }
  },
  computed: {
    installState() {
      const pkgName = this.game.softDesc?.pkgName
      return this.$store.state.miniGameInstallState.stateMap[pkgName] ||
        { status: 'idle', progress: 0 }
    },
    isDownloading() {
      return this.installState.status === 'downloading'
    },
    label() {
      const { status, progress } = this.installState
      return {
        idle: '安装',
        pending: '待下载',
        downloading: `${progress}%`,
        installing: '安装中',
        installed: '打开',
        failed: '重试'
      }[status] || '安装'
    },
    // hover 下载中（有进度）时显示"取消"，其他状态不显示
    displayLabel() {
      if (this.isDownloading && this.isHovering) return '取消'
      return this.label
    },
    isDisabled() {
      const { status } = this.installState
      return status === 'pending' || status === 'installing'
    }
  },
  watch: {
    // 状态变为 installed 时，通知父页面弹 Toast
    'installState.status'(newStatus, oldStatus) {
      if (oldStatus === newStatus) return
      const { nativeStatus } = this.installState
      const params = {
        skuName: this.game?.softName || this.game?.app_name || '',
        softID: this.game?.softId || '',
        pkgName: this.game?.softDesc?.pkgName || '',
        firstLocal: this.firstLocal,
        secondLocal: 14,
        plateName: this.moduleName,
        position: this.index + 1,
        type: 2,
        softType: this.game?.softDesc?.isAd ? '广告' : '非广告',
        gametype: this.game?.gameType === 1 ? 'apk' : ''
      }
      // 开始下载（从 pending/idle → downloading 时报一次）
      if (newStatus === 'downloading' && oldStatus !== 'downloading') {
        reportApkInstall({ action: 'LZ_miniGameStartsDownloading', eventType: 'click' }, { ...params, status: '1' })
      }
      // 下载结果
      if ((newStatus === 'installing' || newStatus === 'failed') && oldStatus === 'downloading') {
        reportApkInstall({ action: 'LZ_miniGameDownloadResult', eventType: 'click' }, { ...params, status: newStatus === 'installing' ? '1' : '2', errormess: nativeStatus || '' })
      }
      if (newStatus === 'installing' && oldStatus === 'downloading') {
        reportApkInstall({ action: 'LZ_miniGameStartsInstalling', eventType: 'click' }, { ...params, status: '1' })
      }
      // 安装结果
      if ((newStatus === 'installed' || newStatus === 'failed') && oldStatus === 'installing') {
        reportApkInstall({ action: 'LZ_miniGameInstallationResult', eventType: 'click' }, { ...params, status: newStatus === 'installed' ? '1' : '2', errormess: nativeStatus || '' })
      }
      // 安装成功 & Toast 弹出
      if (newStatus === 'installed' && oldStatus !== 'installed') {
        // this.$root.$emit('mini-game-installed', {
        //   gameName: this.game.softName || this.game.app_name || '',
        //   iconUrl: this.game.showInfo?.logoFile || this.game.icon_url || '',
        //   pkgName: this.game.softDesc?.pkgName || this.game.pkg_name || ''
        // })
        this.$message({
          message: '安装成功！',
          type: 'success',
          duration: 2500,
          customClass: 'lg-message--success'
        })
      //  reportApkInstall({ action: 'LZ_miniGameInstallSuccessPopupShow', eventType: 'pv' }, params)
      }
    }
  },
  methods: {
    async handleClick() {
      const pkgName = this.game.softDesc?.pkgName
      const { status } = this.installState

      if (!this.supportApkFlage) {
        this.$message({
          message: '当前app版本过低或系统不支持vb虚拟环境,需要开启后才能安装app',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })
        return
      }

      // 下载中点击 → 取消
      if (status === 'downloading') {
        console.log('取消下载', this.game.softDesc, pkgName)
        const res = await cancelDownloadInstall(pkgName)
        console.log('取消下载', res)

        if (res?.ret === 0) {
          this.$message({
            message: '取消成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
        }
        this.$store.dispatch('miniGameInstallState/cancelInstall', pkgName)
        return
      }

      if (this.isDisabled) return
      const userInfo = this.$store.state.user?.userInfo || null
      if (status === 'installed') {
        reportMinigameOpen({
          firstLocal: this.firstLocal,
          secondLocal: 14,
          plateName: this.moduleName,
          skuName: this.game?.softName || this.game?.app_name || '',
          softID: this.game?.softId || '',
          softType: this.game?.softDesc?.isAd ? '广告' : '非广告',
          type: 2,
          lenovoid: userInfo ? userInfo?.UserID : '',
          position: this.index + 1,
          gametype: this.game?.gameType === 1 ? 'apk' : '',
          alg_rid: this.game.softDesc?.runConfigInfo?.rid || '',
          source_id: this.game.softDesc?.runConfigInfo?.resourcePos || ''
        })
        openMiniGameAndPinAndInstall(this.game, this.index, {
          ruleCodeMapping: this.ruleCodeMapping
        })
        return
      }
      // idle / failed
      reportApkInstall(
        { action: 'LZ_miniGameInstallButtonclick', eventType: 'click' },
        {
          skuName: this.game?.softName || this.game?.app_name || '',
          softID: this.game?.softId || '',
          pkgName,
          firstLocal: this.firstLocal,
          secondLocal: 14,
          plateName: this.moduleName,
          position: this.index + 1,
          type: 2,
          softType: this.game?.softDesc?.isAd ? '广告' : '非广告',
          gametype: this.game?.gameType === 1 ? 'apk' : ''
        }
      )
      const res = await openMiniGameAndPinAndInstall(this.game, this.index, {})
      console.log('打开游戏', res)
      if (res?.ret === 0) {
        this.$store.dispatch('miniGameInstallState/startInstall', pkgName)
        this.isHovering = false // 重置 hover，避免 downloading 到来时直接显示"取消"而非进度
      }
    }
  },
  mounted() {
    // this.$root.$emit('mini-game-installed', {
    //   gameName: this.game.softName || this.game.app_name || '',
    //   iconUrl: this.game.showInfo?.logoFile || this.game.icon_url || '',
    //   pkgName: this.game.softDesc?.pkgName || this.game.pkg_name || ''
    // })
  }
}
</script>

<style scoped lang="scss">
</style>
