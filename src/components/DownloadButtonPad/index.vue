<template>
  <div :class="{ DownloadButtonPad: true, blue: theme === 'blue', rect: theme === 'rect', installing: stateInfo.status === 1 }" @click.stop>
    <div v-if="stateInfo.status === 4" class="wait">
      <div></div>
      <span>等待中</span>
    </div>
    <div v-else-if="stateInfo.status === 1" class="dl" @click="pause">
      <div><i :style="{ width: `${stateInfo.progress}%` }"></i></div>
      <span>{{ stateInfo.progress }}%</span>
    </div>
    <div v-else-if="stateInfo.status === 0" class="pause autoClick" @click="resume">
      <div><i :style="{ width: `${stateInfo.progress}%` }"></i></div>
      <span>继续</span>
    </div>
    <div v-else-if="stateInfo.status === 6" class="i">
      <div></div>
      <span>安装中</span>
    </div>
    <template v-else-if="stateInfo.status === 3">
      <div v-if="stateInfo.IsGAHaveUpdate" class="normal" @click="add(6)">
        <div></div>
        <span>更新<template v-if="showInstallSize">{{ filterZipSize(stateInfo.ZipSize) }}</template></span>
      </div>
      <div v-else class="installed" @click="open">
        <div></div>
        <span>打开</span>
      </div>
    </template>
    <template v-else>
      <div class="normal autoClick" @click="add(1)">
        <div></div>
        <span>{{ text ? text : (fastInstall ? '快装' : '安装') }}<template v-if="showInstallSize">{{ downloadInfo.installSize }}</template></span>
      </div>
    </template>
  </div>

</template>
<script>
import { StoreLZRunStoreApp } from '@/nativeApiPad/download'

export default {
  name: 'DownloadButtonPad',
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
    },
    softDesc: {
      type: Object,
      default: null
    }
  },
  computed: {
    pkgName() {
      return this.softDesc?.pkgName || ''
    },
    stateInfo() {
      return this.$store.state.softwareStatePad.stateMap[this.pkgName] || {}
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
    async add(statePage) {
      // 埋点8: LZ_loadGameSdkCreateTask - 单个游戏下载按钮点击
      const drinfoObj = this.drinfo ? JSON.parse(this.drinfo) : {}
      const detail = {
        source: drinfoObj.source || 'PAD7.我的-我的游戏',
        source_p: drinfoObj.source_p || 'PAD7.我的-我的游戏',
        source_pp: drinfoObj.source_pp || '',
        firstLocal: drinfoObj.firstLocal || 'PAD',
        secondLocal: drinfoObj.secondLocal || 'PAD',
        thirdLocal: drinfoObj.thirdLocal || 'PAD',
        type: drinfoObj.type || '2',
        plateName: drinfoObj.plateName || '我的游戏-有更新',
        skuName: this.softName,
        softID: this.softId,
        lenovoid: drinfoObj.lenovoid || '',
        stateGame: '1',
        statePage: String(statePage),
        gameClass: '3'
      }
      this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
        detail: JSON.stringify(detail),
        status: '0',
        typeerr: '{}'
      })

      this.$store.dispatch('softwareStatePad/add', {
        hdSoftID: this.softId,
        SoftID: this.pkgName,
        Version: this.version,
        SoftName: this.softName,
        LogoFile: this.logoFile,
        drinfo: this.drinfo,
        vcnumber: this.softDesc?.versionCode,
        apkSize: this.softDesc?.apkSize || 0,
        statePage
      })
    },
    resume() {
      this.$store.dispatch('softwareStatePad/resume', this.pkgName)
    },
    pause() {
      console.log('暂停下载', this.pkgName)
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
div.DownloadButtonPad {
  display: inline-block;
  width: 90px;
  height: 34px;
  > div {
    width: 100%;
    height: 100%;
    position: relative;
    cursor: pointer;
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;
      box-sizing: border-box;
      border: 1px solid transparent;
      border-radius: 999999px;
      background-image: linear-gradient(180deg, rgba(234, 247, 255, 0.4) 0%, rgba(234, 247, 255, 0) 100%);
      background-origin: border-box;
      mask-image: linear-gradient(0deg, #fff, #fff), linear-gradient(0deg, #fff, #fff);
      mask-origin: padding-box, border-box;
      mask-clip: padding-box, border-box;
      mask-composite: exclude;
    }
    > div {
      position: absolute;
      inset: 0;
      z-index: 2;
      box-sizing: border-box;
      border: 1px solid transparent;
      border-radius: 999999px;
      background-image: linear-gradient(180deg, rgba(115, 115, 115, 0.4) 0%, rgba(234, 247, 255, 0.4) 100%);
      background-origin: padding-box;
      overflow: hidden;
      > i {
        display: block;
        width: 0%;
        height: 100%;
        background-image: linear-gradient(90deg, rgba(115, 115, 115, 0.3) 0%, rgba(234, 247, 255, 0.3) 100%);
      }
    }
    > span {
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 3;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: bold;
      color: rgba(234, 247, 255, 1);
    }
    &.wait {
      cursor: default;
      &::before {
        background-image: linear-gradient(180deg, #9CA4A9 0%, #54585B 100%);
      }
      > div {
        background-image: none;
      }
      > span {
        color: rgba(234, 247, 255, 0.6);
      }
    }
    &.dl {
      cursor: default;
      &::before {
        background-image: linear-gradient(180deg, #9CA4A9 0%, #54585B 100%);
      }
      > div {
        background-image: none;
      }
    }
    &.pause {
      &::before {
        background-image: linear-gradient(180deg, #9CA4A9 0%, #54585B 100%);
      }
      > div {
        background-image: none ;
      }
    }
    &.i {
      cursor: default;
      &::before {
        background-image: linear-gradient(180deg, #9CA4A9 0%, #54585B 100%);
      }
      > div {
        background-image: none;
      }
      > span {
        color: rgba(234, 247, 255, 0.6);
      }
    }
    &.installed {
      box-shadow: 0px 0px 5px 0px #00000040 inset;
      // &:hover {
      //   > div {
      //     background-image: linear-gradient(180deg, rgba(115, 115, 115, 0.7) 0%, rgba(234, 247, 255, 0.7) 100%);
      //   }
      // }
    }
    &.normal {
      box-shadow: 0px 0px 5px 0px #00000040 inset;
      // &:hover {
      //   > div {
      //     background-image: linear-gradient(180deg, rgba(115, 115, 115, 0.7) 0%, rgba(234, 247, 255, 0.7) 100%);
      //   }
      // }
    }
  }
  &.blue > div {
    &::before {
      background-image: linear-gradient(180deg, #386EFE 0%, #386EFE 100%);
    }
    > div {
      border: none;
      background-image: linear-gradient(180deg, #386EFE 0%, #386EFE 100%);
      > i {
        background-image: linear-gradient(90deg, #386EFE 0%, #386EFE 100%);
        opacity: 0.25;
      }
    }
    &.wait {
      > div {
        background-image: none;
      }
      > span {
        color: rgba(56, 110, 254, 0.8);
      }
    }
    &.dl {
      > div {
        background-image: none;
      }
      > span {
        color: rgba(56, 110, 254, 1);
      }
    }
    &.pause {
      > div {
        background-image: none;
      }
      > span {
        color: rgba(56, 110, 254, 1);
      }
    }
    &.i {
      > div {
        background-image: none;
      }
      > span {
        color: rgba(56, 110, 254, 0.8);
      }
    }
    &.installed {
      box-shadow: none;
      &::before {
        content: none;
      }
      // &:hover {
      //   > div {
      //     background-image: linear-gradient(180deg, #5390FE 0%, #5390FE 100%);
      //   }
      // }
    }
    &.normal {
      box-shadow: none;
      &::before {
        content: none;
      }
      // &:hover {
      //   > div {
      //     background-image: linear-gradient(180deg, #5390FE 0%, #5390FE 100%);
      //   }
      // }
    }
  }
  &.rect {
    background: none;
    &.installing > div  {
      > div {
        box-shadow: inset 0 0 10px 0px rgb(0 0 0 / 30%);
        background: linear-gradient(to bottom, #505050, #6d7174) ;
        border-image: linear-gradient(245deg, rgba(255,255,255,0.6), rgba(153,153,153,0.6)) 1;
      }
      > span {
        letter-spacing: 1px;
        color: #fff;
      }
    }
  }
  &.rect > div {
    cursor: pointer;
    &::before {
      border-radius: 0;
    }
    > div {
      border-radius: 0;
      background: linear-gradient(298deg, rgb(190 191 191) 0%, rgb(234, 247, 255) 30%);
      border: 1px solid;
      border-image: linear-gradient(245deg, #fff, #999) 1;
    }
    > i {
      background-image: linear-gradient(90deg, #505050 0%, #6d7174 100%)
    }
    span {
      color: #020202;
      letter-spacing: 2px;
      width: 100%;
      text-align: center;
    }
    // &:hover {
    //   > div {
    //     background: linear-gradient(to left, rgba(125, 125, 125, 1),rgba(40, 40, 40, 1));
    //   }
    //   span {
    //     color: #fff;
    //   }
    // }
    &:active {
      > div {
        background: linear-gradient(to left, rgba(95, 91, 91, 1),rgba(16, 16, 16, 1));
      }
      span {
        color: #fff;
      }
    }
    &.dl {
      > div {
        background-image: none;
      }
      > span {
        color: #fff;
      }
    }
    &.pause {
      > div {
        background-image: none;
      }
      > span {
        color: #fff;
      }
    }
  }
}

.PhoneDevice {
  div.DownloadButtonPad.rect > div > div {
    background: linear-gradient(175deg, #929292 5.94%, #EAF7FF 98.2%);
  }
  div.DownloadButtonPad.rect > div.dl > div {
    background-image: none;
  }
      div.DownloadButtonPad.rect > div.pause > div {
    background-image: none;
  }
  .text {
    font-size: 12px;
  }
  .DownloadButtonPad {
    height: 100%;
    width: 100%;
    font-size: 12px;
    // &.rect > div > div{
    //   background: none;
    // }
  }
  .download-button-pad {
    width: 60px;
    height: 60px;
  }
}

</style>
