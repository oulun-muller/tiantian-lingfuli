import { StoreLZRunStoreApp, GALZRunStoreApp } from '@/nativeApi/LZProxy'

export default {
  name: 'DownloadButton',
  props: {
    showInstallSize: {
      type: Boolean,
      default: false
    },
    theme: { // 主题切换：gray：灰色主题，blue：蓝色主题
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
    drinfo: { // 数据上报附加信息
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
  filters: {
    filterZipSize(val) {
      if (!val) return ''
      const num = (val / 1024 / 1024 / 1024).toFixed(1)
      if (num > 1) {
        return num + 'GB'
      } else {
        return (val / 1024 / 1024).toFixed(1) + 'MB'
      }
    }
  },
  created() {
    this.$store.dispatch('softwareState/checkInstalled', { softId: this.softId, softType: this.softPurpose === 3 ? 1 : 0 })
  },
  methods: {
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
            from: firstLocal === 2 ? 1 : 2, // 1我的游戏 2游戏中心
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
