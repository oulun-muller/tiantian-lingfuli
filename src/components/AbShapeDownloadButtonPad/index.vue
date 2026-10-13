<template>
  <div>
    <div v-if="[4,0,6,1].includes(stateInfo.status)" :class="[buttonStyle==='rect' ? 'abnormal-rect-btn':'abnormal-shape-btn', stateInfo.status === 'i' ? 'border-grey':'']">
      <template v-if="buttonStyle === 'rect'">
        <svg v-if="stateInfo.status === 1 || stateInfo.status === 0" width="193" height="40" viewBox="0 0 193 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="installSvg">
            <path d="M0 41V0H194V24L175 41H0Z" />
          </clipPath>
          <defs>
            <linearGradient :id="linearID" >
              <stop offset="0%" stop-color="#505050" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="#6d7174" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="transparent" />
              <stop offset="100%" stop-color="transparent" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="193" height="40" style="clip-path: url(#installSvg);" :fill="`url(#${linearID})`" />
        </svg>
      </template>
      <template v-else>
        <svg v-if="stateInfo.status === 1 || stateInfo.status === 0" :width="svgStyle.width" :height="svgStyle.height" viewBox="0 0 149 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <clipPath id="installSvg">
            <path d="M36.0467 0.5H144.748H148.033L137.884 15.9069V27.2812L129.388 39.9937H0.500076V10.4819L4.69136 5.18354H32.4444L36.0467 0.5Z" />
          </clipPath>
          <defs>
            <linearGradient :id="linearID" >
              <stop offset="0%" stop-color="#505050" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="#6d7174" />
              <stop :offset="`${stateInfo.progress || 0}%`" stop-color="transparent" />
              <stop offset="100%" stop-color="transparent" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="150" height="40" style="clip-path: url(#installSvg);" :fill="`url(#${linearID})`" />
        </svg>
      </template>
      <template v-if="stateInfo.status === 4">
        <span class="text">等待中</span>
      </template>
      <template v-else-if="stateInfo.status === 1">
        <span class="text" @click.prevent.stop="pause">{{ stateInfo.progress }}%</span>
      </template>
      <template v-else-if="stateInfo.status === 0">
        <span class="text autoClick" @click.prevent.stop="resume">继续</span>
      </template>
      <template v-else-if="stateInfo.status === 6">
        <span class="text">安装中</span>
      </template>

    </div>
    <template v-else>

      <template v-if="stateInfo.status === 3">
        <span v-if="stateInfo.IsGAHaveUpdate" :class="[buttonStyle==='rect' ? 'common-abnormal-rect-btn' : 'common-abnomal-btn', 'autoClick']" @click.prevent.stop="add"><i class="text">立即更新<template v-if="showInstallSize">{{ filterZipSize(stateInfo.ZipSize) }}</template></i></span>
        <span v-else :class="[buttonStyle==='rect' ? 'common-abnormal-rect-btn' : 'common-abnomal-btn', 'autoNext']" @click.prevent.stop="open"><i class="text">{{ text ? text : '打开' }}</i></span>
      </template>
      <template v-else>
        <span :class="[buttonStyle==='rect' ? 'common-abnormal-rect-btn' : 'common-abnomal-btn', 'autoClick', 'autoNext']" @click.prevent.stop="add"><i class="text">{{ text ? text : (fastInstall ? '立即快装' : '立即安装') }}<template v-if="showInstallSize">{{ downloadInfo.installSize }}</template></i></span>
      </template>

    </template>
  </div>
</template>
<script>
import { StoreLZRunStoreApp } from '@/nativeApiPad/download'

export default {
  name: 'AbShapeDownloadButtonPad',
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
    softDesc: {
      type: Object,
      default: null
    },
    buttonStyle: {
      type: String,
      default: ''
    },
    text: {
      type: String,
      default: ''
    }
  },
  computed: {
    pkgName() {
      return this.softDesc?.pkgName || ''
    },
    stateInfo() {
      return this.$store.state.softwareStatePad.stateMap[this.pkgName] || {}
    },
    linearID() {
      return `LG_${this.pkgName}`
    },
    svgStyle() {
      if (this.$isPhoneDevice) {
        return {
          width: '106',
          height: '26'
        }
      }
      return {
        width: '140',
        height: '37'
      }
    }
  },
  created() {
    this.$store.dispatch('softwareStatePad/checkInstalled', { softId: this.pkgName, version: this.version, vcnumber: this.softDesc?.versionCode })
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
      this.$store.dispatch('softwareStatePad/add', {
        hdSoftID: this.softId,
        SoftID: this.pkgName,
        Version: this.version,
        SoftName: this.softName,
        LogoFile: this.logoFile,
        drinfo: this.drinfo,
        vcnumber: this.softDesc?.versionCode,
        apkSize: this.softDesc?.apkSize || 0
      })
    },
    resume() {
      this.$store.dispatch('softwareStatePad/resume', this.pkgName)
    },
    pause() {
      this.$store.dispatch('softwareStatePad/pause', this.pkgName)
    },
    open() {
      StoreLZRunStoreApp(this.pkgName)
      this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
        detail: JSON.stringify({ ...JSON.parse(this.drinfo), stateGame: 1, statePage: 2 }),
        status: 1,
        typeerr: JSON.stringify({ errortype: '', errormess: '' })
      })
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
  line-height: 42px;
  font-size: 15px;
  font-weight: 700;
  color: rgba(0, 0, 0, 1);
  text-align: left;
  background: transparent url('~@/images/gamecenter/normal-btn.png') no-repeat center center/ contain;
  border: 0 none;
  // &:hover {
  //   background-image: url('~@/images/gamecenter/hover-btn.png');
  //   color: rgba(255, 255, 255, 1);
  // }
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
  // &:hover {
  //   background-image: url('~@/images/gamecenter/button/abnormal-rect-hover-btn.png');
  //   color: rgba(255, 255, 255, 1);
  // }
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

.PhoneDevice {
  .common-abnomal-btn {
    height: 26px;
    width: 106px;
    font-size: 12px;
    line-height: 0;
    .text {
      width: 90%;
      height: 100%;
      line-height: 26px;
    }
  }
  .abnormal-shape-btn {
    height: 26px;
    width: 106px;
    .text {
      width: 90%;
      height: 100%;
      line-height: 26px;
    }
  }
}
</style>
