<template>
  <div class="mini-game-home-box" @scroll="scrollHandle">
    <GameSearch v-if="showGameSearch" class="header-class" :mini-game-device-info="miniGameDeviceInfo" is-active-tab="sidebarMiniGame" :from-page-type="3"/>
    <div v-else class="header-box"></div>

    <!-- Tab 导航，吸顶紧跟搜索栏 -->
    <div class="tab-nav-sticky">
      <div class="container">
        <nav class="mini-game-tab-nav" role="tablist">
          <button
            class="mini-game-tab-nav__item"
            :class="{ 'mini-game-tab-nav__item--active': activeTab === 'recommended' }"
            role="tab"
            :aria-selected="activeTab === 'recommended'"
            @click="switchTab('recommended')"
            @keydown.enter.prevent.stop="switchTab('recommended')"
            @keydown.space.prevent.stop="switchTab('recommended')"
          >推荐</button>
          <button
            v-if="supportApkFlage"
            class="mini-game-tab-nav__item"
            :class="{ 'mini-game-tab-nav__item--active': activeTab === 'mine' }"
            role="tab"
            :aria-selected="activeTab === 'mine'"
            @click="switchTab('mine')"
            @keydown.enter.prevent.stop="switchTab('mine')"
            @keydown.space.prevent.stop="switchTab('mine')"
          >我的</button>
        </nav>
      </div>
    </div>

    <div class="container">

      <!-- 推荐 tab -->
      <div v-show="activeTab === 'recommended'">
        <div class="game-list-box" :class="{'recently-game-translate': isNoTranslate}">
          <div class="box-background-img"></div>
          <div class="recently-game" v-if="recentlyGameList.length">
            <img class="icon" src="@/images/gamecenter/miniGame/clock.svg" aria-hidden="true">
            <div class="text">最近在玩</div>
            <div
              v-for="(item, index) in recentlyGameList"
              :key="index"
              tabindex="0"
              role="button"
              :aria-label="(item.app_name || '游戏') + '，点击打开'"
              @click="clickMiniGame(item,index)"
              @keydown.enter.prevent.stop="clickMiniGame(item,index)"
              @keydown.space.prevent.stop="clickMiniGame(item,index)"
              v-exposure:multiple="{
                events: [
                  {
                    handler: () => onExposure(item, 1,index),
                    options: { threshold: 0.5 },
                    delay: 1000
                  },
                  {
                    handler: () => onExposure(item,0,index)
                  }
                ]
              }">
              <img class="img" :src="item.icon_url" :alt="item.app_name || '游戏'" />
            </div>
          </div>
          <!-- 其他游戏模块 -->
          <component
            v-for="item of homePageModules"
            :mini-game-device-info="miniGameDeviceInfo"
            class="mini-game-module"
            :key="item.moduleId"
            :support-apk-flage="supportApkFlage"
            :is="MODULE_TYPE[item.moduleStyle]"
            :module-sort="item.moduleSort"
            :module-name="item.moduleName"
            :ranking-lists="item.rankingLists"
            :first-local="firstLocal"
            :rule-code-mapping="handelRULE_CODE_ENUM(item.rankingLists)"
          >
          </component>
        </div>
      </div>

      <!-- 我的 tab -->
      <div v-if="activeTab === 'mine'">
        <MiniGameMine ref="mineTab" :first-local="firstLocal" @switch-tab="switchTab"/>
      </div>

    </div>

    <!-- 安装完成 Toast，悬浮在视口右下角
    <MiniGameInstallToast ref="installToast" /> -->
  </div>
</template>
<script>

const MODULE_TYPE = {
  '15': 'MiniGameListVertical',
  '16': 'MiniGameListOneToFour',
  '17': 'MiniGameListMore',
  '23': 'MiniGameThree'
}
import GameSearch from '@/views/GameCenter/common/GameSearch'
import MiniGameListVertical from './MiniGameListVertical'
import MiniGameListOneToFour from './MiniGameListOneToFour'
import MiniGameListMore from './MiniGameListMore'
import MiniGameThree from './MiniGameThree'
import MiniGameMine from './MiniGameMine'
// import MiniGameInstallToast from './MiniGameInstallToast'

import { getMiniGameRecentPlay } from '@/nativeApi/LZProxy'
import { getGCHomeData } from '@/api/gameCenter'
import { reportMinigameOpen, reportMinigameExpose, createTabPageReporter, reportTabClick } from '@/utils/dataReport'
import { openMiniGameAndPin, parentExposeMiniGame, checkMiniGameEnv } from '@/utils/miniGame'
export default {
  name: 'MiniGame',
  data() {
    return {
      result: '',
      MODULE_TYPE: MODULE_TYPE,
      recentlyGameList: [],
      homePageModules: [],
      miniGameDeviceInfo: null,
      fetching: false,
      scrollTop: 0,
      current: 1,
      size: 3,
      isNoTranslate: false,
      supportApkFlage: false,
      featuredGames: [],
      activeTab: 'recommended',
      showGameSearch: true,
      RULE_CODE_ENUM: {
        '22': '97',
        '23': '96',
        '24': '95',
        '25': '94',
        '12': '12',
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17',
        '18': '18'
      }
    }
  },
  components: {
    GameSearch,
    MiniGameListVertical,
    MiniGameListOneToFour,
    MiniGameListMore,
    MiniGameThree,
    MiniGameMine
  },
  computed: {
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      return this.$route.query.firstLocal
    },
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  methods: {
    switchTab(tab) {
      reportTabClick(tab === 'recommended' ? '推荐' : '我的', '/gameCenter/miniGame')
      this.activeTab = tab
    },
    scrollHandle(e) {
      this.scrollTop = e.target.scrollTop
      this.$emit('scrollTop', e.target.scrollTop)

      if (e.target.scrollTop + e.target.offsetHeight + 800 >= e.target.scrollHeight) {
        this.init()
      }
    },
    handelRULE_CODE_ENUM(list) {
      const item = list[0] || {}
      return this.RULE_CODE_ENUM[item?.ruleCode] || ''
    },

    onExposure(item, exposureType, childIndex) {
      parentExposeMiniGame(item, childIndex, exposureType, '5') // 5: 最近在玩
      reportMinigameExpose(item, childIndex, exposureType, {
        moduleName: '最近在玩',
        firstLocal: this.firstLocal,
        secondLocal: 14,
        softName: item.app_name
      })
    },
    // 最近再玩列表
    async getRecentlyGameList() {
      const res = await getMiniGameRecentPlay()
      if (res?.length) {
        this.recentlyGameList = res
      }
    },
    async initWithReport() {
      await this.init()
      this._reporter.reportLoaded()
    },
    async init() {
      if (this.nomore || this.fetching) return
      this.fetching = true

      try {
        this.miniGameDeviceInfo = this.$store.state.miniGameDeviceInfo
        if (!this.miniGameDeviceInfo) {
          this.miniGameDeviceInfo = await this.$parentGetMiniGameDeviceInfo() || null
        }
        await getGCHomeData({
          // currentClientVersion: this.$store.state.system.version,
          current: this.current,
          size: this.size,
          moduleType: 4,
          qone32: this.miniGameDeviceInfo?.qone32,
          qone40: this.miniGameDeviceInfo?.qone40,
          macAddr: this.$store.state.system.mac,
          isSupportApkGame: this.supportApkFlage
        }).then((res) => {
          this.homePageModules = [...this.homePageModules, ...res.records] || []
          this.nomore = !res.hasMore
          this.current = this.current + 1

          if (this.homePageModules[0]?.moduleStyle === 17) {
            this.isNoTranslate = true
          }
        }).catch((res) => {
          console.error(res)
        })
      } catch (e) {
        console.error('init error:', e)
      } finally {
        this.$store.dispatch('pageLoaded', false)
        this.fetching = false
      }
    },
    clickMiniGame(item, index) {
      const { launch_info_str } = item
      let launchInfo = {}
      if (launch_info_str) {
        launchInfo = JSON.parse(launch_info_str)
      }

      const userInfo = this.$store.state.user?.userInfo || null

      reportMinigameOpen({
        firstLocal: this.firstLocal,
        secondLocal: 14,
        plateName: '最近在玩',
        skuName: item.app_name,
        softID: '',
        softType: '空', // 广告和非广告
        type: 2,
        lenovoid: userInfo ? userInfo?.UserID : '',
        position: index + 1
      })
      openMiniGameAndPin(item, index, {
        appID: item?.pkg_name,
        resourcePos: launchInfo?.applet_click_report_info?.sceneID,
        recommendID: launchInfo?.applet_click_report_info?.recommendID,
        requestInterface: launchInfo?.applet_click_report_info?.request_interface,
        app_name: item.app_name,
        icon_url: item.icon_url,
        pkg_name: item.pkg_name
      })
    }
  },
  async created() {
    this._reporter = createTabPageReporter('推荐', '/gameCenter/miniGame')
    this._reporter.reportStart()
    this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
    try {
      const res = await checkMiniGameEnv()
      if (res?.ret === 1) {
        this.supportApkFlage = true
      }
      if (this.supportApkFlage) {
        this.$store.dispatch('miniGameInstallState/init')
      }
    } catch (e) {
      console.error('checkMiniGameEnv error:', e)
    }
    this.initWithReport()
    this.getRecentlyGameList()
  },
  mounted() {
    requestAnimationFrame(() => this._reporter.reportFirstFrame())
    this.$emit('headerStatus', false)
    this.$dataReport('LZ_minigames', 'LZ_miniGamePageShow', 'pv', {
      detail: JSON.stringify({
        firstLocal: this.firstLocal,
        secondLocal: 14,
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    })
    // 监听安装完成事件，弹出 Toast
    // this.$root.$on('mini-game-installed', ({ gameName, iconUrl, pkgName }) => {
    //   this.$refs.installToast?.show({ gameName, iconUrl, pkgName })
    // })
  },
  beforeUnmount() {
    // this.$root.$off('mini-game-installed')
  }
}
</script>

<style scoped lang="scss">

.mini-game-home-box {
    background-color: #000; // linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000 20px, #000 100%);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow-y: scroll;
    overflow-x: hidden;
  &::-webkit-scrollbar {
  width: 0; /* Chrome/Safari/Edge */
  height: 0;
  display: none; /* 完全隐藏滚动条 */
}

    .header-class {
        position: sticky;
        top: 0;
        left: 0;
        height: 40px;
        width: 100%;
        padding: 24px 40px 0;
        background-color: #000;
        z-index: 3;
    }
    .header-box {
        width: 100%;
        height: 120px;
        position: sticky;
        top: 0;
        left: 0;
        background-color: #000;
        z-index: 2;
    }
}

.tab-nav-sticky {
    position: sticky;
    top: 60px; // 与 .header-class 高度对齐
    z-index: 2;
    background-color: #000;
    padding-top: 20px;
}

.container {
    position: relative;
    max-width: 1440px;
    width: 100%;
  //  height: 100%;
    margin: 0 auto;
    padding: 0 40px 10px;
}

// Tab 导航
.mini-game-tab-nav {
  display: flex;
  align-items: flex-end;
  gap: 26px;
  height: 26px;
  font-weight: 700;
  line-height: normal;
  white-space: nowrap;
  color: #eaf7ff;
  //margin-bottom: 20px;

  &__item {
    flex-shrink: 0;
    font-size: 16px;
    font-weight: 700;
    opacity: 0.5;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: #eaf7ff;
    transition: opacity 0.2s ease, font-size 0.2s ease;

    &:hover {
      opacity: 0.75;
    }

    &--active {
      font-size: 20px;
      opacity: 1;
      cursor: default;
    }
  }
}

.game-list-box {
    position: relative;
    margin-top: 26px;
    padding-bottom: 30px;
    .box-background-img {
        position: absolute;
        top: -20px;
        left: 0;
        width: 572px;
        height: 155px;

        background-image: url('../images/miniGameBack.png');
        background-repeat: no-repeat;
    }
}

// 新手引导
.beginner-guide {
    width: 420px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: #1E242B;

    >.icon {
        margin-right: 4px;
    }

    >.text {
        color: rgba(234, 247, 255, 0.60);
        font-size: 14px;
        font-weight: 400;
        line-height: 24px;
    }
}

.recently-game {
    width: max-content;
    height: 46px;
    position: absolute;
    right: 0;
    top: 0;
    transform: translate(0, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    border: 1px solid #DCDCDC;
    background: rgba(0, 0, 0, 0.20);
    padding: 8px 10px;
    margin-left: auto;
    gap: 6px;

    .text {
        color: #EAF7FF;
        font-size: 14px;
        font-weight: 700;
        margin-right: 7px;
    }

    .img {
      height: 30px;
      width: 30px;
      cursor: pointer;
      border-radius: 50%;
    }
}
.recently-game-translate {
  padding-top: 48px
}
.mini-game-module {
    margin-bottom: 40px;
}

.recently-game > div:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 50%;
}

@media (forced-colors: active) {
  .recently-game > div:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
