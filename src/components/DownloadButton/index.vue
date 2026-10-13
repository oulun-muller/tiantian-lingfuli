<template>
  <div :class="{ DownloadButton: true, blue: theme === 'blue', rect: theme === 'rect', installing: stateInfo.status === 'i' }" @click.stop>
    <div v-if="stateInfo.status === 'wait'" class="wait">
      <div></div>
      <span>等待中</span>
    </div>
    <div v-else-if="stateInfo.status === 'dl'" class="dl">
      <div><i :style="{ width: `${stateInfo.progress}%` }"></i></div>
      <span>{{ stateInfo.progress }}%</span>
    </div>
    <div v-else-if="stateInfo.status === 'pause'" class="pause autoClick" tabindex="0" role="button" aria-label="继续下载" @click="resume" @keydown.enter.prevent.stop="resume" @keydown.space.prevent.stop="resume">
      <div><i :style="{ width: `${stateInfo.progress}%` }"></i></div>
      <span aria-hidden="true">继续</span>
    </div>
    <div v-else-if="stateInfo.status === 'i'" class="i">
      <div></div>
      <span>安装中</span>
    </div>
    <template v-else-if="stateInfo.status === 'installed'">
      <div v-if="stateInfo.IsGAHaveUpdate" class="normal" tabindex="0" role="button" :aria-label="'更新' + (showInstallSize ? filterZipSize(stateInfo.ZipSize) : '')" @click="add" @keydown.enter.prevent.stop="add" @keydown.space.prevent.stop="add">
        <div></div>
        <span aria-hidden="true">更新<template v-if="showInstallSize">{{ filterZipSize(stateInfo.ZipSize) }}</template></span>
      </div>
      <div v-else class="installed" tabindex="0" role="button" aria-label="打开游戏" @click="open" @keydown.enter.prevent.stop="open" @keydown.space.prevent.stop="open">
        <div></div>
        <span aria-hidden="true">打开</span>
      </div>
    </template>
    <template v-else>
      <div class="normal autoClick" tabindex="0" role="button" :aria-label="text ? text : (fastInstall ? '快速安装' : '安装')" @click="add" @keydown.enter.prevent.stop="add" @keydown.space.prevent.stop="add">
        <div></div>
        <span aria-hidden="true">{{ text ? text : (fastInstall ? '快装' : '安装') }}<template v-if="showInstallSize">{{ downloadInfo.installSize }}</template></span>
      </div>
    </template>
  </div>
</template>

<script>
import { StoreLZRunStoreApp, GALZRunStoreApp } from '@/nativeApi/LZProxy'

export default {
  name: 'DownloadButton',
  props: {
    showInstallSize: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'gray'
    },
    softId: {
      type: String,
      required: true
    },
    softPurpose: {
      type: Number,
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
    fastInstall: {
      type: Boolean,
      default: false
    },
    drinfo: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    },
    isClick: {
      type: Boolean,
      default: false
    },
    downloadInfo: {
      type: Object,
      default: null
    }
  },
  computed: {
    stateInfo() {
      return this.$store.state.softwareState.stateMap[this.softId] || {}
    }
  },
  created() {
    this.$store.dispatch('softwareState/checkInstalled', { softId: this.softId, softType: this.softPurpose === 3 ? 1 : 0 })
  },
  methods: {
    filterZipSize(val) {
      if (!val) return ''
      const num = (val / 1024 / 1024 / 1024).toFixed(1)
      if (num > 1) {
        return num + 'GB'
      } else {
        return (val / 1024 / 1024).toFixed(1) + 'MB'
      }
    },
    async add() {
      if (this.isClick) {
        this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      }
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

      this.$store.dispatch('softwareState/add', {
        SoftID: this.softId,
        Version: this.version,
        SoftName: this.softName,
        LogoFile: this.logoFile,
        drinfo: this.drinfo
      })
    },
    resume() {
      if (this.isClick) {
        this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      }

      this.$store.dispatch('softwareState/resume', this.softId)
    },
    open() {
      if (this.isClick) {
        this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      }
      const { firstLocal, lenovoid, skuName, softID } = JSON.parse(this.drinfo)
      if (this.stateInfo.SoftType === 1) {
        GALZRunStoreApp(this.stateInfo.SoftID, firstLocal === 2 ? 1 : 2)
        this.$dataReport('LZ_myGames', 'LZ_magazineGameStartClick', 'click', {
          detail: JSON.stringify({
            from: firstLocal === 2 ? 1 : 2,
            lenovoid,
            gameName: skuName,
            softid: softID
          })
        })
      } else {
        StoreLZRunStoreApp(this.stateInfo.mainExePath)
        this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
          detail: JSON.stringify({ ...JSON.parse(this.drinfo), stateGame: 1, statePage: 2 }),
          status: 1,
          typeerr: JSON.stringify({ errortype: '', errormess: '' })
        })
      }
    }
  }
}
</script>

<style lang="scss" src="./index.scss" scoped>

</style>
