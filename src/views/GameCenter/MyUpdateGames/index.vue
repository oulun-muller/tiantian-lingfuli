<template>
  <div class="followed-games">
    <div class="top-header">
      <div class="back-btn" @click="handleBack">
        <span class="sp sp1"></span>
        <span class="sp sp2">游戏更新</span>
      </div>
      <button v-if="showUpdateAll" class="btn-update-all" @click="handleUpdateAll">全部更新</button>
    </div>
    <div class="scroll-box">
      <div class="games-list" v-if="ready && list && list.length">
        <div class="list-header">
          <h1>共{{ list.length }}款游戏</h1>
        </div>
        <div class="game-outer" v-for="(item, index) in list" :key="index">
          <div class="game-item" @click="toDetail(item, index)">
            <div :style="{ backgroundImage: `url(${item.iconUrl})` }" class="game-img">
            </div>
            <div class="game-info">
              <div class="info-left">
                <div class="game-name">{{ item.appName }}</div>
                <div class="game-tags">
                  <span class="sp sp1">玩了</span>
                  <span class="sp sp2">{{ computedHour(item.sumSeconds).value }}</span>
                  <span class="sp sp1">{{ computedHour(item.sumSeconds).label }}</span>
                </div>
              </div>
              <GameDownloadButton
                v-if="item.softId || item.isInstall"
                class="downloadinfo-rightButton"
                theme="rect"
                :download-info="item.downloadInfo"
                :soft-desc="item.softDesc"
                :soft-id="item.softId"
                :soft-purpose="item.softPurpose"
                :product-info="item.productInfo"
                :user-purchased-status="0"
                :version="item.softDesc.version"
                :soft-name="item.softName"
                :logo-file="item.showInfo.logoFile"
                :fast-install="false"
                :drinfo="drinfo(item, index, true, 2)"
                sku-id="" />
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="ready && (!list || !list.length)"
        style="display: flex;align-items: center;justify-content: center;flex-direction: column;gap: 30px;height: 100%;"
        class="normal">
        <img src="@/images/gamecenter/nothing.png" alt="" width="120" height="120">
        <p>暂时没有可更新的游戏</p>
      </div>
    </div>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'
import { getLocalGameList } from '@/nativeApiPad/common.js'
import { compareVersions } from '@/utils'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'
export default {
  name: 'MyRecordGames',
  components: { GameDownloadButton },
  data() {
    return {
      list: [],
      ready: false
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    lid() {
      return getLegacyLenovoId()
    },
    showUpdateAll() {
      if (!this.ready || !this.list || !this.list.length) return false
      const version = this.$store.state.system && this.$store.state.system.version
      if (!version) return false
      return compareVersions(version, '2.0.10')
    },
    computedHour() {
      return (time) => {
        const result = this.millisecondToHour(time)
        return result
      }
    }
  },
  mounted() {
    this.$emit('headerStatus', false)
    this.$store.dispatch('pageLoaded', false)
    this.$dataReport('LZ_myGames', 'LZ_myGamesListTabShow', 'pv', {
      detail: JSON.stringify({
        listType: 'updated',
        lid: this.userInfo ? this.userInfo.UserID : ''
      })
    })
    this.fetchList()
    this.$store.dispatch('softwareStatePad/syncDLList')
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : ''
    const params = new URLSearchParams(hashQuery)
    if (params.get('autoDownload') === 'true') {
      const unwatch = this.$watch('ready', (val) => {
        if (val && this.showUpdateAll && this.list && this.list.length > 0) {
          this.handleUpdateAll()
          unwatch()
        }
      }, { immediate: true })
    }
  },
  beforeUnmount() { },
  methods: {
    fetchList() {
      try {
        getLocalGameList().then(res => {
          if (res) {
            const _list = JSON.parse(res)
            console.log('.........更新（原始）', _list)
            if (_list && _list.length > 0) {
              const handleList = this.formatGmaeData(_list)
              this.list = handleList.filter(item => {
                return item.isNeedUpdate && item.iconUrl
              })
              console.log('.........更新（兼容下载后）', this.list)
            }
          }
          this.ready = true
        }).catch(promiseError => {
          console.log('Promise rejected:', promiseError)
          this.ready = true
        })
      } catch (error) {
        console.log('Sync error:', error)
        this.ready = true
      }
    },
    toDetail(item) {
      console.log('.........跳转游戏详情', item, item.packageName)
      window.LegionZoneMobile.nativeCall('LegionZone', 'intentGameDetail', {
        packageName: item.packageName
      })

      this.$dataReport('LZ_myGames', 'LZ_myGamesListCardClick', 'click', {
        detail: JSON.stringify({
          listType: 'updated',
          skuName: item.appName, // 商品名称即游戏名称
          package: item.packageName, // 包名
          lid: this.userInfo ? this.userInfo.UserID : ''
        })
      })
    },
    drinfo(item) {
      return JSON.stringify({
        plateName: '我的游戏-有更新',
        source_p: this.$route.query.source_p || '',
        source: 'PAD7',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 2,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    formatGmaeData(list) {
      // 格式化数据，兼容 GameDownloadButton 组件
      const _list = JSON.parse(JSON.stringify(list))
      return _list.map(_ => {
        return Object.assign(_, {
          softId: _.softId || '',
          softName: _.appName,
          maxSeconds: _.maxSeconds,
          hlSoftName: null,
          showInfo: {
            vimg: '',
            himg: '',
            score: '',
            softLabels: [],
            hlSoftLabels: null,
            labelName: null,
            ruleLabelName: null,
            top: false,
            logoFile: _.iconUrl,
            isFastInstall: false,
            installFileSize: '',
            mediaScores: null,
            awardInfos: null,
            rankingLabelInfos: [],
            hotNum: 0,
            playersNum: 0,
            img354x285: '',
            img162x285: ''
          },
          productInfo: {
            userPurchasedStatus: 0
          },
          skuId: '0',
          currentTimeActivity: null,
          softPurpose: 2,
          downloadInfo: {
            downloadCount: '',
            pcStoreParam: '',
            webStoreUrl: '',
            tagUrls: [],
            bizType: 0,
            expectedReleaseTime: null,
            reservationCount: 0,
            testActivityStatus: null,
            testActivityName: null,
            testActivityId: null,
            testActivityQuestionUrl: null,
            userTestApplyStatus: null,
            userReservationStatus: null,
            installSize: null
          },
          softDesc: {
            captureFileList: [],
            videoUrl: '',
            videoCoverImg: [],
            supportPlatform: [],
            whatsNew: null,
            supportOsBit: [],
            introduction: '',
            followerCount: 0,
            pkgName: _.packageName,
            runConfigInfo: null,
            isAd: null,
            version: _.versionCode,
            versionCode: _.versionCode
          },
          firstClassId: 0,
          status: true,
          rankingListLabelImg: null,
          sort: 0
        })
      })
    },
    handleUpdateAll() {
      // 埋点7: LZ_myupdateAllUpdateClick - 点击全部更新按钮
      this.$dataReport('my', 'LZ_myupdateAllUpdateClick', 'click', {
        num: this.list.length.toString()
      })

      if (this.$isPadDevice) {
        const padStateMap = this.$store.state.softwareStatePad.stateMap
        this.list.forEach(game => {
          // 埋点8: 无论游戏当前下载状态如何，全部更新操作都要为每个游戏上报一次
          const detail = {
            source: 'PAD7.我的-我的游戏',
            source_p: 'PAD7.我的-我的游戏',
            source_pp: '',
            firstLocal: 'PAD',
            secondLocal: 'PAD',
            thirdLocal: 'PAD',
            type: '2',
            plateName: '我的游戏-有更新',
            skuName: game.appName,
            softID: game.softId || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            stateGame: '1',
            statePage: '6',
            gameClass: '3'
          }
          this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
            detail: JSON.stringify(detail),
            status: '0',
            typeerr: '{}'
          })

          const state = padStateMap[game.packageName]
          if (state && (state.status === 1 || state.status === 4 || state.status === 5 || state.status === 6)) return
          if (state && state.status === 0) {
            this.$store.dispatch('softwareStatePad/resume', game.packageName)
            return
          }

          this.$store.dispatch('softwareStatePad/add', {
            hdSoftID: game.softId || '',
            SoftID: game.packageName,
            Version: String(game.versionCode || ''),
            SoftName: game.appName,
            LogoFile: game.iconUrl || '',
            vcnumber: String(game.versionCode || ''),
            apkSize: 0,
            drinfo: '{}'
          })
        })
      } else {
        const phoneStateMap = this.$store.state.softwareState.stateMap
        this.list.forEach(game => {
          // 埋点8: 无论游戏当前下载状态如何，全部更新操作都要为每个游戏上报一次
          const detail = {
            source: 'PAD7.我的-我的游戏',
            source_p: 'PAD7.我的-我的游戏',
            source_pp: '',
            firstLocal: 'PAD',
            secondLocal: 'PAD',
            thirdLocal: 'PAD',
            type: '2',
            plateName: '我的游戏-有更新',
            skuName: game.appName,
            softID: game.softId || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            stateGame: '1',
            statePage: '6',
            gameClass: '3'
          }
          this.$dataReport('LZ_myGames', 'LZ_loadGameSdkCreateTask', '', {
            detail: JSON.stringify(detail),
            status: '0',
            typeerr: '{}'
          })

          const state = phoneStateMap[game.softId]
          if (state && state.status === 'pause') {
            this.$store.dispatch('softwareState/resume', game.softId)
            return
          }

          this.$store.dispatch('softwareState/add', {
            SoftID: game.softId || '',
            Version: String(game.versionCode || ''),
            SoftName: game.appName,
            LogoFile: game.iconUrl || '',
            drinfo: '{}'
          })
        })
      }
    },
    handleBack() {
      window.LegionZoneMobile.nativeCall('LegionZone', 'goBack')
    },
    millisecondToHour(milliseconds) {
      // 根据毫秒数转换为合适的时间单位
      const totalSeconds = milliseconds / 1000
      const totalMinutes = totalSeconds / 60
      const totalHours = totalMinutes / 60
      // 判断时间单位并返回对应的值和标签
      if (totalHours >= 1) {
        // 满整小时的，保留两位小数
        return { value: Number(totalHours.toFixed(2)) || 0, label: 'h' }
      } else if (totalMinutes >= 1) {
        // 不够小时的，返回分钟
        return { value: Math.floor(totalMinutes) || 0, label: 'm' }
      } else {
        // 不够分钟的，返回秒
        return { value: Math.floor(totalSeconds) || 0, label: 's' }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.followed-games {
  $theme-color: #EAF7FF;
  $triangle-side: 20px;
  font-family: Microsoft YaHei;
  color: $theme-color;
  height: 100%;
  background-color: #000;

  .top-header {
    padding: 0 30px 0 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 74px;

    .back-btn {
      display: flex;
      align-items: center;
      gap: 12px;

      .sp {
        &.sp1 {
          width: 24px;
          height: 24px;
          background-image: url('~@/images/gamecenter/myFollowedGames/arrow-left.svg');
          background-size: 100% 100%;
        }

        &.sp2 {
          font-weight: 700;
          font-style: Bold;
          font-size: 22px;
          line-height: 29px;
        }
      }
    }

    .btn-update-all {
      background: transparent;
      border: none;
      color: rgba(234, 247, 255, 0.9);
      font-size: 20px;
      font-weight: 400;
      height: 26px;
      line-height: 26px;
      padding: 0;
      margin-right: 24px;
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  .scroll-box {
    height: calc(100% - 74px);
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .games-list {
    display: flex;
    flex-flow: column;
    gap: 20px;
    padding: 20px 30px;

    .game-item {
      background: rgba($color: #000000, $alpha: .2);
      height: 96px;
      position: relative;
      box-sizing: border-box;
      display: flex;
      align-items: center;

      .game-img {
        // position: absolute;
        // top: -1px;
        // left: -1px;
        width: 96px;
        height: 96px;
        background-size: cover;
        border-radius: 8px;
      }

      .game-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex: 1;
        height: 100%;
        padding: 0 24px 0 20px;
        background: linear-gradient(77deg, rgba(30, 34, 39, 0.2) 4.98%, rgba(112, 118, 150, 0.2) 100.17%);

        .info-left {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
          flex: 1;

          .game-name {
            font-weight: 700;
            font-size: 16px;
            line-height: 21px;
            background: linear-gradient(177.77deg, #929292 1.88%, #EAF7FF 98.12%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .game-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;

            .sp {
              font-weight: 400;
              font-size: 14px;
              line-height: 24px;

              &.sp1 {
                color: rgba($color: $theme-color, $alpha: 0.7);
              }

              &.sp2 {
                color: $theme-color;
                font-weight: 700;
              }
            }
          }
        }

        .info-center {
          flex: 0 0 auto;
          padding-right: 100px;
        }

        .info-right {
          flex: 0 0 auto;
          border: 1px solid;
          background: linear-gradient(to bottom, #999, #fff);
          border-image: linear-gradient(245deg, #fff, #999) 1;
          color: #020202;
          font-weight: 700;
          font-size: 14px;
          line-height: 14px;
          letter-spacing: 2px;
          vertical-align: middle;
          height: 34px;
          line-height: 34px;
          box-sizing: border-box;
          padding: 0 12px;
        }
      }
    }
  }
}

h1 {
  color: rgba(234, 247, 255, .4);
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

@media screen and (max-width: 798px) {
  .followed-games .games-list .game-item {
    height: 12vw;
  }

  .followed-games .games-list .game-item .game-img {
    width: 12vw;
    height: 12vw;
  }

  .followed-games .games-list .game-item .game-info {
        padding: 0 24px 0 20px;
  }

  .followed-games .games-list .game-item .game-info .info-center {
    padding-right: 12vw;
  }
}

.PhoneDevice {
  .top-header {
    height: 56px;
    padding: 0 20px;
  }

  .games-list {
    margin-top: 16px;
    padding: 0px 20px 30px;
    gap: 16px;
  }
    .followed-games .top-header .back-btn .sp.sp2 {
    font-size: 20px;
    line-height: 22px;
    height: 24px;
  }

  .followed-games .top-header .btn-update-all {
    font-size: 18px;
    margin-right: 0;
  }

  .downloadinfo-rightButton {
    width: 60px;
    height: 28px;
  }

  .game-outer {
    height: 74px;

    .game-item {
      height: 100%;
      background: transparent;

      .game-img {
        height: 74px;
        width: 74px;
        border-radius: 12px;
        position: relative;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 12px;
          padding: 0.5px;
          background: linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0.2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
      }
      .game-info {
        padding: 0 0px 0 16px;
      }
    }
  }

  .followed-games .top-header .back-btn .sp.sp2 {
    font-size: 20px;
  }
}
</style>
