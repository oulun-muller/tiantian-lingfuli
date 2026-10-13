<template>
  <div>
    <div v-if="['wait','pause','i', 'dl'].includes(stateInfo.status)" :class="[buttonStyle==='rect' ? 'abnormal-rect-btn':'abnormal-shape-btn', stateInfo.status === 'i' ? 'border-grey':'']">
      <template v-if="buttonStyle === 'rect'">
        <svg v-if="stateInfo.status === 'dl' || stateInfo.status === 'pause'" width="193" height="40" viewBox="0 0 193 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="installSvg">
            <path d="M0 41V0H194V24L175 41H0Z" />
          </clipPath>
          <defs>
            <linearGradient id="linearGradient" >
              <stop offset="0%" stop-color="#505050" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="#6d7174" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="transparent" />
              <stop offset="100%" stop-color="transparent" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="193" height="40" style="clip-path: url(#installSvg);" fill="url(#linearGradient)" />
        </svg>
      </template>
      <template v-else>
        <svg v-if="stateInfo.status === 'dl' || stateInfo.status === 'pause'" width="140" height="37" viewBox="0 0 149 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="installSvg">
            <path d="M36.0467 0.5H144.748H148.033L137.884 15.9069V27.2812L129.388 39.9937H0.500076V10.4819L4.69136 5.18354H32.4444L36.0467 0.5Z" />
          </clipPath>
          <defs>
            <linearGradient id="linearGradient" >
              <stop offset="0%" stop-color="#505050" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="#6d7174" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="transparent" />
              <stop offset="100%" stop-color="transparent" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="150" height="40" style="clip-path: url(#installSvg);" fill="url(#linearGradient)" />
        </svg>
      </template>
      <template v-if="stateInfo.status === 'wait'">
        <span class="text">等待中</span>
      </template>
      <template v-else-if="stateInfo.status === 'dl'">
        <span class="text" tabindex="0" role="button" :aria-label="`下载中 ${stateInfo.progress}%`" @click.prevent.stop="resume" @keydown.enter.prevent.stop="resume" @keydown.space.prevent.stop="resume">{{ stateInfo.progress }}%</span>
      </template>
      <template v-else-if="stateInfo.status === 'pause'">
        <span class="text autoClick" tabindex="0" role="button" aria-label="继续下载" @click.prevent.stop="resume" @keydown.enter.prevent.stop="resume" @keydown.space.prevent.stop="resume">继续</span>
      </template>
      <template v-else-if="stateInfo.status === 'i'">
        <span class="text">安装中</span>
      </template>

    </div>
    <template v-else>

      <template v-if="stateInfo.status === 'installed'">
        <span v-if="stateInfo.IsGAHaveUpdate" :class="[buttonStyle==='rect' ? 'common-abnormal-rect-btn' : 'common-abnomal-btn', 'autoClick']" tabindex="0" role="button" :aria-label="'立即更新' + (showInstallSize ? stateInfo.ZipSize : '')" @click.prevent.stop="add" @keydown.enter.prevent.stop="add" @keydown.space.prevent.stop="add"><i class="text" aria-hidden="true">立即更新<template v-if="showInstallSize">{{ filterZipSize(stateInfo.ZipSize) }}</template></i></span>
        <span v-else :class="[buttonStyle==='rect' ? 'common-abnormal-rect-btn' : 'common-abnomal-btn', 'autoNext']" tabindex="0" role="button" aria-label="打开游戏" @click.prevent.stop="open" @keydown.enter.prevent.stop="open" @keydown.space.prevent.stop="open"><i class="text" aria-hidden="true">打开</i></span>
      </template>
      <template v-else>
        <span :class="[buttonStyle==='rect' ? 'common-abnormal-rect-btn' : 'common-abnomal-btn', 'autoClick', 'autoNext']" tabindex="0" role="button" :aria-label="'立即' + (fastInstall ? '快速安装' : '安装')" @click.prevent.stop="add" @keydown.enter.prevent.stop="add" @keydown.space.prevent.stop="add"><i class="text" aria-hidden="true">立即{{ fastInstall ? '快装' : '安装' }}<template v-if="showInstallSize">{{ downloadInfo.installSize }}</template></i></span>
      </template>

    </template>
  </div>
</template>
<script>
import { StoreLZRunStoreApp, GALZRunStoreApp } from '@/nativeApi/LZProxy'

export default {
  name: 'AbShapeDownloadButton',
  props: {
    showInstallSize: {
      type: Boolean,
      default: false
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
    downloadInfo: {
      type: Object,
      default: null
    },
    buttonStyle: {
      type: String,
      default: ''
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
      this.$store.dispatch('softwareState/resume', this.softId)
    },
    open() {
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
<style lang="scss" scoped>
.common-abnomal-btn {
  cursor: pointer;
  display: inline-block;
  width: 158px;
  height: 40px;
  line-height: 40px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 1);
  text-align: left;
  background: transparent url('~@/images/gamecenter/normal-btn.png') no-repeat center center/ contain;
  border: 0 none;
  &:hover {
    background-image: url('~@/images/gamecenter/hover-btn.png');
    color: rgba(255, 255, 255, 1);
  }
  &:active {
    background-image: url('~@/images/gamecenter/active-btn.png');
    color: rgba(255, 255, 255, 1);
  }
  .text {
    display: inline-block;
    width: 138px;
    text-align: center;
  }
}
.abnormal-shape-btn {
  position: relative;
  display: inline-block;
  width: 152px;
  height: 38px;
  background: transparent url('~@/images/gamecenter/ab-shape-border.png') no-repeat center center / contain;
  &.border-grey {
    background: transparent url('~@/images/gamecenter/ab-shape-border-grey.png') no-repeat center center / contain;
  }
  svg {
    position: absolute;
    top: 0.5px;
    left: 2px;
  }
  .text {
    cursor: pointer;
    position: absolute;
    display: inline-block;
    width: 142px;
    height: 38px;
    text-align: center;
    line-height: 38px;
    font-weight: 700;
    color: #fff;
    font-size: 15px;
    letter-spacing: 2px;
  }
}

// rect button style
.abnormal-rect-btn {
  position: relative;
  display: inline-block;
  width: 204px;
  height: 50px;
  background: transparent url('~@/images/gamecenter/button/abnormal-rect-border.png') no-repeat center center / cover;
  &.border-grey {
    background: transparent url('~@/images/gamecenter/button/abnormal-rect-border.png') no-repeat center center / cover;
  }
  svg {
    position: absolute;
    top: 6px;
    left: 6px;
  }
  .text {
    cursor: pointer;
    position: absolute;
    display: inline-block;
    width: 204px;
    height: 50px;
    text-align: center;
    line-height: 50px;
    font-weight: 700;
    color: #fff;
    font-size: 15px;
    letter-spacing: 2px;
  }
}
.common-abnormal-rect-btn {
  cursor: pointer;
  display: inline-block;
  width: 204px;
  height: 50px;
  line-height: 50px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 1);
  text-align: left;
  background: transparent url('~@/images/gamecenter/button/abnormal-rect-btn.png') no-repeat center center/ contain;
  border: 0 none;
  &:hover {
    background-image: url('~@/images/gamecenter/button/abnormal-rect-hover-btn.png');
    color: rgba(255, 255, 255, 1);
  }
  &:active {
    background-image: url('~@/images/gamecenter/button/abnormal-rect-active-btn.png');
    color: rgba(255, 255, 255, 1);
  }
  .text {
    display: inline-block;
    width: 204px;
    text-align: center;
  }
}

.common-abnomal-btn:focus-visible,
.common-abnormal-rect-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 4px;
}

.abnormal-shape-btn .text:focus-visible,
.abnormal-rect-btn .text:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .common-abnomal-btn:focus-visible,
  .common-abnormal-rect-btn:focus-visible,
  .abnormal-shape-btn .text:focus-visible,
  .abnormal-rect-btn .text:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
