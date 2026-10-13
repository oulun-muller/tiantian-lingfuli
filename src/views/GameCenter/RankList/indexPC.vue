<template>
  <div>
    <div class="wrapper">
      <div v-if="$isPhoneDevice && $isAIPartnerEnabled" class="phone-header">
        <img
          src="@/images/padimg/game_partner_entry_logo.svg"
          class="ai-partner-icon"
          alt="AI游戏伙伴"
          tabindex="0"
          role="button"
          aria-label="AI游戏伙伴"
          @click.stop="toAIDialogue"
          @keydown.enter.prevent.stop="toAIDialogue"
          @keydown.space.prevent.stop="toAIDialogue" />
      </div>
      <div :class="['rank-bac', 'tab'+(curTab)]">
        <ul class="tab-wrap" role="tablist">
          <li
            v-for="(item) in rankList"
            :key="item.ruleCode"
            :class="[curTab===item.ruleCode?'selected':'']"
            :tabindex="curTab === item.ruleCode ? 0 : -1"
            role="tab"
            :aria-selected="curTab===item.ruleCode ? 'true' : 'false'"
            :aria-label="item.ruleName"
            @click="clickTab(item.ruleCode)"
            @keydown.enter.prevent.stop="clickTab(item.ruleCode)"
            @keydown.space.prevent.stop="clickTab(item.ruleCode)"
            @keydown.up.prevent="navigateTab(-1)"
            @keydown.down.prevent="navigateTab(1)"
            @keydown.left.prevent="navigateTab(-1)"
            @keydown.right.prevent="navigateTab(1)"
          >
            <div v-if="showReservePage(item)">
              {{ item.ruleName }}
            </div>
          </li>
        </ul>
        <p class="fenge-line">
          <span class="line"></span>
          <span class="text">{{ getFengeText() }}</span>
          <span class="line"></span>
        </p>
      </div>

      <section class="result-wrap" ref="rankListScrollTop" @scroll="scrollHandle">
        <ContentList
          v-if="rankingCharts.length"
          :cur-tab="curTab"
          :data-list="rankingCharts"
          :rank-type="curTab"
          :first-local="firstLocal" />
      </section>
    </div>
  </div>
</template>
<script>
// 1-火爆榜 2-时长榜 3-飙升榜 4-小时榜 5-预约榜
const TAB_ENUM = {
  5: 1,
  6: 2,
  7: 3,
  8: 4,
  19: 5
}
import ContentList from './ContentListPc'
import { getGCRankListData } from '@/api/gameCenter'
import { compareVersions } from '@/utils'

import { getCurrentBrandConfig } from '@/assets/text'
import { getGameMsgDataReport, createTabPageReporter } from '@/utils/dataReport'
export default {
  inject: ['showOffline'],
  components: {
    ContentList
  },
  data() {
    const { tab } = this.$route.query
    return {
      rankList: [
        {
          ruleCode: 5,
          ruleName: '火爆榜'
        },
        {
          ruleCode: 6,
          ruleName: '时长榜'
        },
        {
          ruleCode: 7,
          ruleName: '飙升榜'
        },
        {
          ruleCode: 8,
          ruleName: '小时榜'
        },
        {
          ruleCode: 19,
          ruleName: '预约榜',
          minVersion: '2.0.17'
        }
      ],
      curTab: Number(tab) || 5,
      rankListScrollTop: 0,
      thirdLocal: '',
      rankingCharts: [],
      BRAND_TEXT_CHINESE: getCurrentBrandConfig('BRAND_TEXT_CHINESE')
    }
  },
  watch: {
    userInfo: {
      handler(newValue, oldValue) {
        // this.$store.dispatch('gameDownloadState/clearState')
        this.init(this.curTab)
      }
    }
  },
  computed: {
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      const _GAME_CENTER_SOURCE_RECORD = Number(sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD'))
      return _GAME_CENTER_SOURCE_RECORD
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 2
    },
    systemVersion() {
      return this.$store.state.system.version
    }
  },
  beforeRouteEnter(to, from, next) {
    if (!['GameCenterDetail'].includes(from.name)) {
      if (window._GAMECENTER_RESTORE) {
        delete window._GAMECENTER_RESTORE['RankList']
      }
    }
    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESTORE['RankList'] = JSON.stringify({
        ...this.$data,
        rankListScrollTop: Math.round(this.$refs.rankListScrollTop.scrollTop)
      })
    }
    next()
  },
  methods: {
    getFengeText() {
      switch (this.curTab) {
        case 5:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}数量生成`
        case 6:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}玩家游戏时长生成`
        case 7:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}玩家数量增长率生成`
        case 8:
          return `榜单基于最近一小时内${this.BRAND_TEXT_CHINESE}玩家数量生成`
        case 19:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}玩家预约人数生成`
        default: ''
      }
    },
    showReservePage(item) {
      if (!item?.minVersion) {
        return true
      }
      return compareVersions(this.systemVersion, item.minVersion)
    },
    scrollHandle(e) {
      this.rankListScrollTop = Math.round(e.target.scrollTop)
    },
    toAIDialogue() {
      this.$dataReport('aIassistant', 'aIassistantEnterClick', 'click')
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorAIAgentFromRankList')
      }
    },
    // 无障碍适配 键盘切换tab
    navigateTab(direction) {
      const visibleTabs = this.rankList.filter(item => this.showReservePage(item))
      const currentIndex = visibleTabs.findIndex(item => item.ruleCode === this.curTab)
      const nextIndex = (currentIndex + direction + visibleTabs.length) % visibleTabs.length
      const nextRuleCode = visibleTabs[nextIndex].ruleCode
      this.clickTab(nextRuleCode)
      this.$nextTick(() => {
        const tabEls = this.$el.querySelectorAll('[role="tab"]')
        const domIndex = this.rankList.findIndex(item => item.ruleCode === nextRuleCode)
        tabEls[domIndex]?.focus()
      })
    },
    clickTab(id) {
      this.curTab = id
      this.gameReport()
      this.init(id)
      this.$nextTick(() => {
        this.$refs.rankListScrollTop.scrollTop = 0
      })
    },
    async initWithReport(id = 5) {
      this._reporter.reportStart()
      await this.init(id)
      this._reporter.reportLoaded()
    },
    init(id = 5) {
      const chartsType = TAB_ENUM[id] || 1
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      const currentClientVersion = this.$store.state.system.version

      return getGCRankListData({ currentClientVersion, chartsType }).then(res => {
        if (res.length) { this.rankingCharts = res[0]?.rankingCharts }
      }).catch((res) => {
        this.$errorMessage(res.message)
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.$store.dispatch('pageLoaded', false)
        setTimeout(() => {
          this.gameReport()
        }, 100)
      })
    },
    gameReport() {
      if (this.rankingCharts.length) {
        const currentTab = this.rankList.find(item => item.ruleCode === this.curTab)
        const _plateName = currentTab ? currentTab.ruleName : ''

        const _rankingCharts = this.rankingCharts.filter(o => o.softInfo).map(o => {
          const report = getGameMsgDataReport(o.softInfo)
          const _bizType = report.stateGame
          const buttonType = report.statePage

          const _name_cdk = `${o.softInfo.softName}_${o.softInfo.softId}`
          const _name_download = `${o.softInfo.softName}_${o.softInfo.softId}_${_bizType}_${buttonType}`
          const _softPurpose = o.softInfo.softPurpose

          return {
            name_cdk: _name_cdk,
            name_download: _name_download,
            softPurpose: _softPurpose
          }
        })

        if (_rankingCharts.length) {
          const _cdk = _rankingCharts.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
          const _download = _rankingCharts.map(o => o.name_download).join(',')

          if (_cdk) {
            this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
              details: JSON.stringify({
                firstLocal: this.firstLocal,
                secondLocal: this.secondLocal,
                thirdLocal: this.thirdLocal,
                plateName: _plateName,
                nameAndIDVersion: _cdk,
                lenovoid: this.userInfo ? this.userInfo.UserID : ''
              })
            })
          }

          if (_download) {
            this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeLoadGameTabPageShow', 'pv', {
              details: JSON.stringify({
                firstLocal: this.firstLocal,
                secondLocal: this.secondLocal,
                thirdLocal: this.thirdLocal,
                plateName: _plateName,
                nameAndIDVersion: _download,
                lenovoid: this.userInfo ? this.userInfo.UserID : ''
              })
            })
          }
        }
      }
    }
  },
  mounted() {
    this._reporter = createTabPageReporter('排行榜', '/gameCenter/rankList')
    this._reporter.reportStart()

    this.$emit('headerStatus', true)
    this.$emit('scrollTop', 0)

    requestAnimationFrame(() => this._reporter.reportFirstFrame())

    if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['RankList']) {
      const {
        rankList,
        curTab,
        rankListScrollTop
      } = JSON.parse(window._GAMECENTER_RESTORE['RankList'])
      delete window._GAMECENTER_RESTORE['RankList']

      this.rankList = rankList
      this.curTab = this.curTab || curTab || Number(this.rankList[0].ruleCode)
      this.rankListScrollTop = rankListScrollTop
      this.$nextTick(() => {
        this.$refs.rankListScrollTop.scrollTop = this.rankListScrollTop
        this._reporter.reportLoaded()
      })
      setTimeout(() => {
        this.gameReport()
      }, 100)
    } else {
      this.initWithReport(this.curTab)
    }
  }
}
</script>
<style lang='scss' scoped>
.wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: #000;
}
.phone-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 20px;
  .ai-partner-icon {
    width: 28px;
    height: 28px;
    cursor: pointer;
  }
}
.result-wrap {
  padding: 0 40px;
  height: calc(100vh - 224px);
  overflow-y: scroll;
}
.PhoneDevice {
  .result-wrap {
    height: calc(100vh - 276px);
  }
}
.rank-bac {
  width: 100%;
  height: 224px;
  padding-top: 104px;
  &.tab5 {
    background: transparent url('~@/images/gamecenter/rank-bac-red.png') no-repeat center center / contain;
  }
  &.tab7 {
    background: transparent url('~@/images/gamecenter/rank-bac-purple.png') no-repeat center center / contain;
  }
  &.tab8 {
    background: transparent url('~@/images/gamecenter/rank-bac-green.png') no-repeat center center / contain;
  }
  &.tab6 {
    background: transparent url('~@/images/gamecenter/rank-bac-blue.png') no-repeat center center / contain;
  }
  &.tab19 {
    background: transparent url('~@/images/gamecenter/rank-bac-yellow.png') no-repeat center center / contain;
  }
}
.tab-wrap {
  display: flex;
  margin: 30px auto 0px auto;
  align-items: baseline;
  justify-content: center;
  li {
    cursor: pointer;
    text-align: center;
    text-shadow: 0px 88.826px 71.061px rgba(255, 255, 255, 0.00), 0px 19.84px 15.872px rgba(255, 255, 255, 0.00), 0px 5.907px 4.726px rgba(255, 255, 255, 0.00);
    font-size: 18px;
    font-style: italic;
    opacity: 0.6;
    padding: 0 13px;
    &:hover {
      opacity: 0.4;
    }
    &.selected {
      cursor: pointer;
      font-size: 26px;
      font-weight: 700;
      opacity: 1;
      background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}
.fenge-line {
  margin-top: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  .line {
    display: inline-block;
    width: 13px;
    height: 1px;
    background-color: #EAF7FF;
    transform: scaleY(0.5);
  }
  .text {
    font-size: 12px;
    color: #EAF7FF;
    font-weight: 290;
    letter-spacing: 1.4px;
    opacity: 0.8;
  }
}
</style>

<style scoped>
.tab-wrap li:focus-visible,
.phone-header img:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .tab-wrap li:focus-visible,
  .phone-header img:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
