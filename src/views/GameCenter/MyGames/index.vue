<template>
  <div class="my-games">
    <div class="top-header">
      <span class="sp sp1">我的游戏</span>
      <span class="sp sp2" v-show="isLogin" @click="toPCGames">电脑游戏记录<i></i></span>
    </div>
    <div class="scroll-box">
      <div class="games-count">
        <div class="top-count">
          <div class="total-con">
            <div class="count-item count-item1">
              <div class="count-inner">
                <div class="count-value">
                  <span class="sp sp1">{{ totalDuration.value }}</span>
                  <span class="sp sp2">{{ totalDuration.label }}</span>
                </div>
                <div class="count-label">
                  <span class="sp sp1">我的游戏总时长</span>
                </div>
              </div>
            </div>
            <div class="count-item count-item2">
              <div class="count-inner">
                <div class="count-value">
                  <span class="sp sp1">{{ playedGamesLen }}</span>
                </div>
                <div class="count-label">
                  <span class="sp sp1 ft14">玩过的游戏</span>
                </div>
              </div>
              <div class="count-inner">
                <div class="count-value">
                  <span class="sp sp1">{{ followedGamesLen }}</span>
                </div>
                <div class="count-label" @click="toFollowedGames">
                  <span class="sp sp1 ft14 arrow">关注的游戏</span>
                </div>
              </div>
            </div>
          </div>
          <div class="line"></div>
          <div class="rank-con">
            <div class="rank-item">
              <div class="icon icon1"></div>
              <div class="label">最近常玩的游戏</div>
              <div class="info">
                <span class="sp sp1">{{ recentDurationGameResp.gameName || '暂无' }}</span>
              </div>
            </div>
            <div class="rank-item">
              <div class="icon icon2"></div>
              <div class="label">最肝的游戏</div>
              <div class="info">
                <span class="sp sp1">{{ maxDurationGameResp.gameName || '暂无' }}</span>
              </div>
            </div>
            <div class="rank-item">
              <div class="icon icon3"></div>
              <div class="label">最高游戏时长</div>
              <div class="info">
                <span class="sp sp1">{{ computedHour(maxDurationGameResp.gameDuration).value }}</span>
                <span class="sp sp2">{{ computedHour(maxDurationGameResp.gameDuration).label }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="rank-con2">
          <div class="rank-item">
            <div class="icon icon1"></div>
            <div class="label">最近常玩的游戏</div>
            <div class="info">
              <span class="sp sp1">{{ recentDurationGameResp.gameName || '暂无' }}</span>
            </div>
          </div>
          <div class="rank-item">
            <div class="icon icon2"></div>
            <div class="label">最肝的游戏</div>
            <div class="info">
              <span class="sp sp1">{{ maxDurationGameResp.gameName || '暂无' }}</span>
            </div>
          </div>
          <div class="rank-item">
            <div class="icon icon3"></div>
            <div class="label">最高游戏时长</div>
            <div class="info">
              <span class="sp sp1">{{ computedHour(maxDurationGameResp.gameDuration).value }}</span>
              <span class="sp sp2">{{ computedHour(maxDurationGameResp.gameDuration).label }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="games-list" :class="{noData: currentTab === 0 ? !localGameList.length : currentTab === 1 ? !filteredPlayedGames.length : currentTab === 2 ? !filteredPlayedGames.length : false}">
        <div class="bottom-header">
          <div class="header-left">
            <span class="sp" :class="{ 'active': currentTab === 0 }" @click="handleTabClick(0)">本机 <template
              v-if="localGameList.length">({{ localGameList.length }})</template></span>
            <span
              v-show="haveUpdatedGames.length"
              class="sp"
              :class="{ 'active': currentTab === 1 }"
              @click="handleTabClick(1)">有更新</span>
            <span class="sp" :class="{ 'active': currentTab === 2 }" @click="handleTabClick(2)">玩过</span>
          </div>
          <div class="header-right" @click="handleSetGameAssistant">
            <span class="sp sp1">设置游戏助手</span>
            <span class="sp sp2"></span>
          </div>
        </div>
        <div class="bottom-list">
          <div class="grid-container" v-if="currentTab === 0">
            <div
              style="display: flex;align-items: center;justify-content: center;flex-direction: column;gap: 30px;height: 100%;"
              v-show="!localGameList.length"
              class="normal">
              <img src="@/images/gamecenter/nothing.png" alt="" width="120" height="120">
              <p>暂时没有本机游戏</p>
            </div>
            <div class="game-list" v-if="localGameList.length">
              <div class="game-item" @click="toDetail(item, index)" v-for="(item, index) in localGameList" :key="index">
                <div class="el">
                  <i class="el-rt"></i>
                  <i class="el-rtl"></i>
                  <i class="el-lbl"></i>
                  <i class="el-tl"></i>
                  <i class="el-rl"></i>
                  <i class="el-bl"></i>
                  <i class="el-ll"></i>
                </div>
                <div :style="{ backgroundImage: `url(${computedImgSrc(item)})` }" class="item-inner">
                  <div class="game-info">
                    <div class="info-left">
                      <div class="game-name">{{ item.appName }}</div>
                      <div class="game-time">
                        <span class="sp sp1">玩了</span>
                        <span class="sp sp2">{{ computedHour(item.sumSeconds).value }}</span>
                        <span class="sp sp1">{{ computedHour(item.sumSeconds).label }}</span>
                      </div>
                    </div>
                    <GameDownloadButton
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
                      :drinfo="drinfo(item, index, true, 0)"
                      sku-id="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="list-container" v-if="currentTab === 1">
            <div class="count-label" v-if="haveUpdatedGames.length">共{{ haveUpdatedGames.length }}款游戏</div>
            <div class="game-list">
              <div
                class="game-item"
                @click="toDetail(item, index)"
                v-for="(item, index) in haveUpdatedGames"
                :key="index">
                <div :style="{ backgroundImage: `url(${item.iconUrl})` }" class="game-img">
                </div>
                <div class="game-info">
                  <div class="info-left">
                    <div class="game-name">{{ item.appName }}</div>
                    <div class="game-time">
                      <span class="sp sp1">玩了</span>
                      <span class="sp sp2">{{ computedHour(item.sumSeconds).value }}</span>
                      <span class="sp sp1">{{ computedHour(item.sumSeconds).label }}</span>
                    </div>
                  </div>
                  <!-- <div class="info-right">立即更新</div> -->
                  <GameDownloadButton
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
                    :drinfo="drinfo(item, index, true, 1)"
                    sku-id="" />
                </div>
              </div>
            </div>
          </div>
          <div class="list-container" v-if="currentTab === 2">
            <div class="count-label" v-if="filteredPlayedGames.length">共{{ filteredPlayedGames.length }}款游戏</div>
            <div
              style="display: flex;align-items: center;justify-content: center;flex-direction: column;gap: 30px;height: 100%;"
              v-show="!filteredPlayedGames.length"
              class="normal">
              <img src="@/images/gamecenter/nothing.png" alt="" width="120" height="120">
              <p>暂时没有玩过的游戏</p>
            </div>
            <div class="game-list" v-show="filteredPlayedGames.length">
              <div
                class="game-item"
                @click="toDetail(item, index)"
                v-for="(item, index) in filteredPlayedGames"
                :key="index">
                <div :style="{ backgroundImage: `url(${item.iconUrl})` }" class="game-img">
                </div>
                <div class="game-info">
                  <div class="info-left">
                    <div class="game-name">{{ item.appName }}</div>
                    <div class="game-time">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'
import { getLocalGameList, getPlayedGameList } from '@/nativeApiPad/common.js'
import {
  totalAndRank,
  concernList
  // fetchGameList
} from '@/api/gameCenter'
export default {
  name: 'MyGames',
  components: {
    GameDownloadButton
  },
  data() {
    return {
      haveUpdatedGames: [], // 有更新
      playedGameList: [],
      localGameList: [],
      recentGames: [],
      recentDurationGameResp: {},
      maxDurationGameResp: {},
      playedGamesLen: 0,
      totalDuration: {
        value: 0,
        label: ''
      }, // 总时长
      followedGamesLen: 0, // 关注的游戏个数
      currentTab: 0
    }
  },
  computed: {
    filteredPlayedGames() {
      return this.playedGameList.filter(item => {
        return item.appName && item.iconUrl
      })
    },
    computedImgSrc() {
      return (item) => {
        let src = ''
        if (item.coverUrl) {
          src = item.coverUrl
        } else if (item.imageUrl) {
          src = item.imageUrl.replace(/^http:\/\//, 'https://')
        }
        return src
      }
    },
    isLogin() {
      return this.userInfo && this.userInfo.UserID
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    computedHour() {
      return (time) => {
        const result = this.millisecondToHour(time)
        return result
      }
    }
  },
  watch: {
    isLogin: {
      handler(val) {
        this.handleFetchData()
      },
      immediate: true
    }
  },
  created() {
  },
  mounted() {
    console.log('mounted', this.isLogin)
    this.$emit('headerStatus', false)
    this.$store.dispatch('pageLoaded', false)

    this.$dataReport('LZ_myGames', 'LZ_myGamesListTabShow', 'pv', {
      detail: JSON.stringify({
        listType: 'local',
        lid: this.isLogin
      })
    })
  },
  methods: {
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
            logoFile: _.imageUrl,
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
    handleFetchData() {
      this.haveUpdatedGames = []
      this.playedGameList = []
      this.localGameList = []
      this.recentGames = []
      this.recentDurationGameResp = {}
      this.maxDurationGameResp = {}
      this.playedGamesLen = 0
      this.totalDuration = {
        value: 0,
        label: ''
      }
      this.followedGamesLen = 0

      this.handleFetchConcernLength()
      this.handleFetchGameStatic()
      this.handleFetchLocalGameList()
      this.handleFetchPlayedGameList()
    },
    handleFetchConcernLength() {
      concernList({
        lowerId: '',
        current: 1,
        size: 1
      }).then(res => {
        if (res && res.total) {
          this.followedGamesLen = res.total
        }
      })
    },
    handleFetchGameStatic() {
      totalAndRank({
        platform: 'pad'
      }).then(res => {
        console.log('.........totalAndRank', res)
        if (res && res.data) {
          const result = res.data
          if (result.total) {
            this.playedGamesLen = result.total
          }
          if (result.maxDurationGameResp) {
            this.maxDurationGameResp = result.maxDurationGameResp
          }
          if (result.recentDurationGameResp) {
            this.recentDurationGameResp = result.recentDurationGameResp
          }
        }
      })
    },
    handleFetchPlayedGameList() {
      if (!this.isLogin) {
        return
      }
      try {
        getPlayedGameList().then(res => {
          if (res) {
            const list = JSON.parse(res)
            console.log('.........玩过（原始）', list)
            if (list && list.length > 0) {
              this.playedGameList = this.formatGmaeData(list)
              this.totalDuration = this.millisecondToHour(list.reduce((total, item) => total + (item.sumSeconds || 0), 0))
            }
            console.log('.........玩过', this.playedGameList)
          } else {
            this.playedGameList = []
          }
        })
      } catch (error) {
        console.log(error)
      }
    },
    handleFetchLocalGameList() {
      if (!this.isLogin) {
        return
      }
      try {
        getLocalGameList().then(res => {
          if (res) {
            const list = JSON.parse(res)
            console.log('.........本机游戏（原始）', list)
            if (list && list.length > 0) {
              this.localGameList = this.formatGmaeData(list)
              // this.totalDuration = this.millisecondToHour(list.reduce((total, item) => total + (item.sumSeconds || 0), 0))
            }
            console.log('.........本机游戏', this.localGameList)

            this.$dataReport('LZ_myGames', 'LZ_myGamesPageShow', 'pv', {
              detail: JSON.stringify({
                localCount: this.localGameList.length,
                lid: this.isLogin
              })
            })

            const needUpdateGames = this.localGameList.filter(item => {
              return item.isNeedUpdate
            })
            this.haveUpdatedGames = needUpdateGames
          } else {
            this.localGameList = []
          }
        })
      } catch (error) {
        console.log(error)
      }
    },
    handleDurationClick() {
      window.LegionZoneMobile.nativeCall('LegionZone', 'intentPhoneGame')

      this.$dataReport('LZ_myGames', 'LZ_myGamesDataTotalTimeClick', 'click')
    },
    toDetail(item) {
      console.log('.........跳转游戏详情', item, item.packageName)
      window.LegionZoneMobile.nativeCall('LegionZone', 'intentGameDetail', {
        packageName: item.packageName
      })

      this.$dataReport('LZ_myGames', 'LZ_myGamesListCardClick', 'click', {
        detail: JSON.stringify({
          listType: this.currentTab === 0 ? 'local' : this.currentTab === 1 ? 'updated' : this.currentTab === 2 ? 'played' : '',
          skuName: item.appName, // 商品名称即游戏名称
          package: item.packageName, // 包名
          lid: this.isLogin
        })
      })
    },
    drinfo(item, index, status, source) {
      const plateName = source === 0 ? '我的游戏-本机' : source === 1 ? '我的游戏-有更新' : source === 2 ? '我的游戏-玩过' : ''
      return JSON.stringify({
        source_p: this.$route.query.source_p || '',
        source: 'PAD7',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 2,
        plateName: plateName,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    handleSetGameAssistant() {
      this.$dataReport('LZ_myGames', 'LZ_myGamesAssistantSettingClick', 'click')
      window.LegionZoneMobile.nativeCall('LegionZone', 'intentGameAssistant')
    },
    toPCGames() {
      window.LegionZoneMobile.nativeCall('LegionZone', 'intentPcGame')
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
    },
    secondsToHour(seconds) {
      return Number((seconds / (3600)).toFixed(2))
    },
    toFollowedGames() {
      this.$router.push({
        name: 'MyFollowedGames',
        query: {
          source_p: 'PAD7'
        }
      })
      this.$dataReport('LZ_myGames', 'LZ_myGamesDataFollowedClick', 'click')
    },
    handleTabClick(index) {
      // this.$store.dispatch('gameCenter/setMyGameCurrentTab', index)
      this.currentTab = index
      this.$dataReport('LZ_myGames', 'LZ_myGamesListTabSwitchClick', 'click', {
        detail: JSON.stringify({
          listType: this.currentTab === 0 ? 'local' : this.currentTab === 1 ? 'updated' : this.currentTab === 2 ? 'played' : '',
          lid: this.isLogin
        })
      })
      this.$dataReport('LZ_myGames', 'LZ_myGamesListTabShow', 'pv', {
        detail: JSON.stringify({
          listType: this.currentTab === 0 ? 'local' : this.currentTab === 1 ? 'updated' : this.currentTab === 2 ? 'played' : '',
          lid: this.isLogin
        })
      })
    }
  },
  unmounted() {
  }
}
</script>

<style lang="scss" scoped>
$theme-color: #EAF7FF;
$triangle-side: 20px;
$triangle-hypotenuse: $triangle-side * 1.41421356; // √2 ≈ 1.41421356

.my-games {
  font-family: Microsoft YaHei;
  color: $theme-color;
  height: 100%;
  background-color: #000;

  &::-webkit-scrollbar {
    display: none;
  }

  .top-header {
    padding: 0 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 74px;

    .sp {
      &.sp1 {
        font-style: 900;
        font-size: 22px;
        line-height: 29px;
      }

      &.sp2 {
        font-style: Regular;
        font-size: 18px;
        line-height: 100%;
        vertical-align: middle;
        display: flex;
        align-items: center;

        i {
          width: 24px;
          height: 24px;
          background-image: url('~@/images/gamecenter/myGames/arrow2.png');
          background-size: 100% 100%;
        }
      }
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

  .games-count {
    padding: 0 30px;

    .sp {
      &.sp1 {
        // font-weight: 700;
      }

      &.sp2 {
        font-weight: 400;
      }
    }

    .icon {
      background-size: 100% 100%;
      background-position: center;

      &.icon1 {
        background-image: url('~@/images/gamecenter/myGames/icon01a.png');
      }

      &.icon2 {
        background-image: url('~@/images/gamecenter/myGames/icon01b.png');
      }

      &.icon3 {
        background-image: url('~@/images/gamecenter/myGames/icon01c.png');
      }
    }

    .label {
      font-family: Microsoft YaHei;
      font-weight: 400;
      font-size: 13px;
      line-height: 24px;
      letter-spacing: 0px;
    }

    .info {
      display: flex;
      gap: 4px;

      .sp {
        font-family: Microsoft YaHei;
        font-weight: 700;
        font-size: 14px;
        line-height: 24px;
        letter-spacing: 0px;

        &.sp2 {
          color: rgba($color: $theme-color, $alpha: 0.6);
        }
      }
    }

    .top-count {
      width: 100%;
      height: 156px;
      background-image: url('~@/images/gamecenter/myGames/bg01.png');
      background-size: 100% 100%;
      display: flex;
      align-items: center;
      position: relative;

      .total-con {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .count-item {
          display: flex;

          .count-inner {
            .count-value {
              display: flex;
              align-items: baseline;
              justify-content: center;
              gap: 8px;

              .sp {
                &.sp1 {
                  height: 69px;
                  font-family: Arial;
                  font-size: 60px;
                  line-height: 100%;
                  letter-spacing: -1.3px;
                  text-align: center;
                  font-weight: 700;
                  text-shadow: 0px 2px 24px #EAF7FF4D;
                }

                &.sp2 {
                  font-size: 26px;
                  line-height: 100%;
                  letter-spacing: 0px;
                  text-align: center;
                  font-weight: 700;
                }
              }
            }

            .count-label {
              display: flex;
              align-items: center;
              gap: 4px;
              position: relative;

              .sp {
                &.sp1 {
                  font-size: 16px;
                  line-height: 17px;
                  letter-spacing: 0px;
                  text-align: center;
                  position: relative;

                  &.arrow {
                    &::before {
                      content: '';
                      position: absolute;
                      right: -20px;
                      top: 50%;
                      transform: translateY(-50%);
                      width: 16px;
                      height: 16px;
                      background-image: url('~@/images/gamecenter/myGames/arrow.png');
                      background-size: 100% 100%;
                    }
                  }
                }

                &.ft14 {
                  font-size: 14px;
                }
              }
            }
          }

          &.count-item1 {
            margin-left: 90px;
          }

          &.count-item2 {
            margin-right: 60px;
            gap: 32px;

            .count-inner {
              .count-value {
                .sp1 {
                  font-size: 46px;
                  line-height: 100%;
                  letter-spacing: -1px;
                  display: flex;
                  align-items: center;
                }
              }
            }
          }
        }
      }

      .line {
        width: 1px;
        height: 120px;
        background-image: url('~@/images/gamecenter/myGames/line.png');
        background-size: 100% 100%;
        display: none;
      }

      .rank-con {
        flex: 0 0 auto;
        display: none;
        margin-right: 70px;
        gap: 12px;
        flex-flow: column;

        .rank-item {
          display: flex;
          align-items: center;

          .icon {
            width: 24px;
            height: 24px;
            flex: 0 0 auto;
          }

          .label {
            width: 100px;
            margin: 0 20px 0 5px;
          }

          .info {
            .sp {
              &.sp1 {
                max-width: 80px;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
              }
            }
          }
        }
      }
    }

    .rank-con2 {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 42px;

      .rank-item {
        flex: 1;
        display: flex;
        align-items: center;
        background-image: url('~@/images/gamecenter/myGames/bg02.png');
        background-size: 100% 100%;
        height: 71px;
        position: relative;
        justify-content: center;
        flex-flow: column;

        .icon {
          width: 40px;
          height: 40px;
          position: absolute;
          left: 12px;
          top: -12px;
        }

        .label {
          font-size: 14px;
          color: rgba($color: $theme-color, $alpha: 0.6);
        }
      }
    }
  }

  .games-list {
    padding: 30px 25px 30px 30px;
    backdrop-filter: blur(40px);
    border-top-left-radius: 18px;
    border-top-right-radius: 18px;
    margin-top: 40px;
    background-image: url('~@/images/gamecenter/myGames/bg03.png');
    background-size: cover;
    background-position: right;
    min-height: calc(100% - 310px);
    &.noData {
      height: calc(100% - 310px);
      .bottom-list {
        height: calc(100% - 35px);
      }
    }

    .bottom-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        gap: 14px;

        .sp {
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba($color: $theme-color, $alpha: 0.05);
          font-weight: 400;
          font-size: 14px;
          font-weight: 400;
          font-size: 14px;
          color: rgba($color: $theme-color, $alpha: 0.6);
          padding: 0 39px;
          box-sizing: border-box;
          border: 1px solid transparent;

          &.active {
            border-image: linear-gradient(to left, #FFFFFF, #999999) 1;
          }
        }
      }

      .header-right {
        display: flex;
        align-items: center;

        .sp {

          &.sp2 {
            width: 24px;
            height: 24px;
            background-image: url('~@/images/gamecenter/myGames/arrow2.png');
            background-size: 100% 100%;
          }
        }
      }
    }

    .bottom-list {
      height: 100%;
      .grid-container {
        padding: 30px 0 100px 0;
        height: 100%;
        .game-list {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;

          .game-item {
            width: calc(50% - 10px);

            flex: 0 0 calc(50% - 10px);
            height: 292px;
            position: relative;

            .el {
              position: absolute;
              width: 100%;
              height: 100%;
              left: 0;
              top: 0;
              z-index: 9;
              pointer-events: none;

              &-rt {
                width: 10px;
                height: 10px;
                background-image: url('~@/images/gamecenter/myGames/icon02.png');
                background-size: 100% 100%;
                position: absolute;
                top: 0;
                right: 0;
              }

              &-rtl {
                position: absolute;
                top: 20px;
                right: 0;
                height: 0;
                border-top: 1px solid #ffffff;
                transform: rotate(45deg);
                transform-origin: top right;
                width: $triangle-hypotenuse;
              }

              &-lbl {
                position: absolute;
                bottom: -0.5px;
                left: -7.5px;
                height: 0;
                border-bottom: 1px solid;
                border-image-source: linear-gradient(to left, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.01));
                border-image-slice: 1;
                transform: rotate(45deg);
                transform-origin: top right;
                width: $triangle-hypotenuse;
              }

              &-tl {
                border-top: 1px solid;
                border-image-source: linear-gradient(to right, rgb(255, 255, 255), rgb(255, 255, 255));
                border-image-slice: 1;
                position: absolute;
                top: 0;
                left: 0;
                width: calc(100% - 20px);
                height: 1px;
              }

              &-rl {
                border-right: 1px solid;
                border-image-source: linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0.2));
                border-image-slice: 1;
                position: absolute;
                bottom: 0;
                right: 0;
                height: calc(100% - 20px);
                width: 1px;
              }

              &-bl {
                border-bottom: 1px solid;
                border-image-source: linear-gradient(to left, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border-image-slice: 1;
                position: absolute;
                bottom: 0;
                right: 0;
                height: 1px;
                width: calc(100% - 20px);
              }

              &-ll {
                border-left: 1px solid;
                border-image-source: linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0.1));
                border-image-slice: 1;
                position: absolute;
                top: 0;
                left: 0;
                height: calc(100% - 20px);
                width: 1px;
              }
            }

            .item-inner {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
              background-size: cover;

              .game-info {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding: 20px;

                &::before {
                  content: '';
                  width: 100%;
                  height: 118px;
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0.85%, #000000 75.65%);
                  z-index: -1;
                }

                .info-left {
                  display: flex;
                  flex-direction: column;
                  gap: 9px;

                  .game-name {
                    font-weight: 700;
                    font-size: 16px;
                    line-height: 21px;
                    background: linear-gradient(177.77deg, #929292 1.88%, #EAF7FF 98.12%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                  }

                  .game-time {
                    display: flex;
                    align-items: center;
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

                .info-right {
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

            &.list-item {
              width: 100%;
            }
          }
        }
      }

      .list-container {
        padding: 25px 0 50px 0;
        height: 100%;

        .count-label {
          font-weight: 400;
          font-size: 14px;
          color: $theme-color;
        }

        .game-list {
          display: flex;
          flex-flow: column;
          gap: 20px;
          margin-top: 20px;

          .game-item {
            height: 96px;
            position: relative;
            box-sizing: border-box;

            .game-img {
              position: absolute;
              top: -1px;
              left: -1px;
              width: 96px;
              height: 96px;
              background-size: cover;
              border-radius: 8px;
            }

            .game-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              height: 100%;
              padding: 0 24px 0 116px;
              background: linear-gradient(77deg,rgba(30, 34, 39, 0.2) 4.98%,rgba(112, 118, 150, 0.2) 100.17%);
              border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;

              .info-left {
                display: flex;
                flex-direction: column;
                gap: 9px;

                .game-name {
                  font-weight: 700;
                  font-size: 16px;
                  line-height: 21px;
                  background: linear-gradient(177.77deg, #929292 1.88%, #EAF7FF 98.12%);
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                }

                .game-time {
                  display: flex;
                  align-items: center;
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

              .info-right {
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
    }
  }
}

@media screen and (min-width: 1280px) {
  .my-games .games-count .top-count {
    height: 199px;
    background-image: url('~@/images/gamecenter/myGames/bg01h.png');
    gap: 134px;
  }

  .my-games .games-count .top-count .line {
    display: block;
  }

  .my-games .games-count .top-count .rank-con {
    display: flex;
  }

  .my-games .games-count .top-count .total-con .count-item.count-item1 {
    margin-left: 180px;
  }

  .my-games .games-count .top-count .total-con .count-item.count-item2 {
    margin-right: 0;
  }

  .my-games .games-count .rank-con2 {
    display: none;
  }

  .my-games .games-list {
    min-height: calc(100% - 240px);
  }
  .my-games .games-list.noData {
    height: calc(100% - 240px);
  }

  .my-games .games-list .bottom-list .grid-container .game-list .game-item {
    flex: 0 0 calc(33.333% - 13.333px);
  }
}
@media screen and (max-width: 798px) {
  .my-games .games-list .bottom-list .list-container .game-list .game-item {
    height: 12vw;
  }
  .my-games .games-list .bottom-list .list-container .game-list .game-item .game-img {
    width: 12vw;
    height: 12vw;
  }
  .my-games .games-list .bottom-list .list-container .game-list .game-item .game-info {
    padding: 0 3vw 0 14.5vw;
  }
  .my-games .games-count .top-count .total-con .count-item.count-item1 {
    margin-left: 10vw;
  }
  .my-games .games-count .top-count .total-con .count-item.count-item1 .count-inner .count-value .sp1 {
    font-size: 50px;
    height: 60px;
  }
  .my-games .games-count .top-count .total-con .count-item.count-item2 .count-inner .count-value .sp1{
    font-size: 38px;
  }
  .my-games .games-count .rank-con2 .rank-item .icon {
    width: 5vw;
    height: 5vw;
  }
  .my-games .games-list .bottom-list .list-container .game-list .game-item .game-info .info-left {
    gap: 6px;
  }
  .my-games .games-list .bottom-list .grid-container .game-list .game-item {
    height: 228px;
  }
}

</style>
