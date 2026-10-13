<template>
  <div class="swipe-tabs-demo wrapper">
    <div class="tabs-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <div class="tabs-header">
        <div class="ganme-center-router">
          <div class="router-title">
            <div
              v-for="(tab, index) in rankListPad"
              :key="index"
              class="tab"
              :class="{ 'tab-active': curTab === tab.ruleCode }"
              @click="setActiveTab(index)"
              @touchstart="handleChildTouchStart">{{ tab.ruleName }}</div>
          </div>
          <div class="router-operation" @touchstart="handleChildTouchStart">
            <PadGameSearch class="search-class" />
            <div class="icon-item-class">
              <img v-if="isShowMyDevice" src="@/images/padimg/equitment.svg" class="icon-class" @click="toMyDevice" />
              <img v-if="$isAIPartnerEnabled" src="@/images/padimg/game_partner_entry_logo.svg" class="icon-class ai-partner-icon" @click.stop="toAIDialogue" />
            </div>
          </div>
        </div>
        <div class="pad-text">{{ getFengeText() }}</div>
      </div>

      <div class="tabs-content">
        <div class="tabs-content-wrapper" :style="{ transform: `translateX(${contentOffset}px)` }">
          <div v-for="(tab, index) in rankListPad" :key="index" class="tab-content">
            <div class="content">
              <section class="result-wrap" ref="rankListScroller" @scroll="scrollHandle">
                <template v-if="$isPhoneDevice">
                  <ContentListPhone
                    v-if="rankingCharts.length"
                    :cur-tab="curTab"
                    :data-list="rankingCharts"
                    :rank-type="curTab"
                    :first-local="firstLocal" />
                </template>
                <template v-else>
                  <ContentList
                    v-if="rankingCharts.length"
                    :cur-tab="curTab"
                    :data-list="rankingCharts"
                    :rank-type="curTab"
                    :first-local="firstLocal" />
                </template>
                <div class="gap-bottom"></div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ContentList from './ContentList'
import ContentListPhone from './ContentListPhone'
import PadGameSearch from '@/components/PadGameSearch'
import { getGCRankListData } from '@/api/gameCenter'
import { openNativePage } from '@/nativeApiPad/common.js'

import { DEVICE_TYPE } from '@/store/enum/buryingPoint.js'
// 1-火爆榜 2-时长榜 3-飙升榜 4-小时榜 5-预约榜
const TAB_ENUM = {
  5: 1,
  6: 2,
  7: 3,
  8: 4,
  19: 5
}
export default {
  name: 'SwipeTabsDemo',
  inject: ['showOffline'],
  components: {
    ContentList,
    ContentListPhone,

    PadGameSearch
  },
  data() {
    const { tab } = this.$route.query
    return {
      activeTab: 0,
      startX: 0,
      startY: 0,
      currentX: 0,
      isDragging: false,
      contentOffset: 0,
      tabWidth: 0,
      rankListPad: [
        { ruleCode: 5, ruleName: '火爆榜' },
        { ruleCode: 7, ruleName: '飙升榜' },
        { ruleCode: 6, ruleName: '时长榜' }
      ],
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
          ruleName: '预约榜'
        }
      ],
      curTab: Number(tab) || 5,
      rankListScrollTop: 0,
      thirdLocal: '',
      rankingCharts: []
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
    isShowMyDevice() {
      const name = this.$store.state.system.MTMInfo?.ReadableMachineName || ''
      for (const item of DEVICE_TYPE) {
        if (name.includes(item)) {
          return true
        }
      }
      return false
    }
  },
  mounted() {
    this.$dataReport('LZ_gamingCenter', 'leaderboardShow', 'pv', {})
    window.addEventListener('resize', this.handleViewportChange)
    this.tabWidth = this.$el.querySelector('.tabs-content')?.offsetWidth || 0
    if (this.$isPadDevice) {
      this.$emit('headerStatus', false)
    } else {
      this.$emit('headerStatus', true)
    }
    this.$emit('scrollTop', 0)
    this.init(this.curTab)
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile?.removeListener(this._doubleclickTabListener)
    }
    this._doubleclickTabListener = window.LegionZoneMobile?.addListener('doubleclick_tab', this.scrollToTop)
  },
  beforeUnmount() {
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile?.removeListener(this._doubleclickTabListener)
      this._doubleclickTabListener = null
    }
    window.removeEventListener('resize', this.handleViewportChange)
  },
  methods: {
    getFengeText() {
      switch (this.curTab) {
        case 5:
          return '榜单基于昨日拯救者玩家数量生成'
        case 6:
          return '榜单基于昨日拯救者玩家游戏时长生成'
        case 7:
          return '榜单基于昨日拯救者玩家数量增长率生成'
        case 8:
          return '榜单基于最近一小时内拯救者玩家数量生成'
        case 19:
          return '榜单基于截止昨日的拯救者玩家预约人数生成'
      }
    },
    handleChildTouchStart(event) {
      event.stopPropagation()
    },
    toAIDialogue() {
      this.$dataReport('aIassistant', 'aIassistantEnterClick', 'click')
      if (window.LegionZoneMobile) {
        window.LegionZoneMobile.nativeCall('LegionZone', 'navigatorAIAgentFromRankList')
      }
    },
    toMyDevice() {
      console.log('toMyDevice')
      openNativePage('DevicePage')
    },
    scrollHandle(e) {
      this.rankListScrollTop = Math.round(e.target.scrollTop)
    },
    clickTab(index) {
      console.log('clickTab', index)

      const tab = this.rankListPad[index]
      this.curTab = tab.ruleCode
      this.gameReport()
      this.init(this.curTab)
    },
    init(code = 5) {
      const chartsType = TAB_ENUM[code] || 1
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      const currentClientVersion = this.$store.state.system.version || '2.0.20.222'

      getGCRankListData({ currentClientVersion, chartsType }).then(res => {
        this.rankingCharts = res[0].rankingCharts
      }).catch((res) => {
        // this.$errorMessage(res.message)
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
      if (this.rankList.length) {
        let _plateName = ''
        let _rankingCharts = []
        if (this.curTab) {
          const tab = this.rankList.find(item => item.ruleCode === this.curTab)

          _plateName = tab.ruleName
          if (this.rankingCharts && this.rankingCharts.length) {
            _rankingCharts = this.rankingCharts.filter(o => o.softInfo).map(o => {
              let _bizType = 1
              if ([1, 2].includes(o.softInfo.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
                _bizType = 2
              } else if (o.softInfo.downloadInfo.bizType === 4) {
                _bizType = 3
              }

              let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
              if ([1, 2].includes(o.softInfo.downloadInfo.bizType)) {
                if (o.softInfo.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
                  buttonType = 2
                } else if (o.softInfo.downloadInfo.userReservationStatus === 1) {
                  buttonType = 3
                }
              } else if (o.softInfo.downloadInfo.bizType === 4) {
                if (o.softInfo.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
                  buttonType = 4
                } else {
                  if (o.softInfo.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                    buttonType = 5
                  } else if ([1].includes(o.softInfo.downloadInfo.userTestApplyStatus)) {
                    buttonType = 6
                  } else if ([2].includes(o.softInfo.downloadInfo.userTestApplyStatus)) {
                    buttonType = 1
                  }
                }
              }

              const _name_cdk = `${o.softInfo.softName}_${o.softInfo.softId}`
              const _name_download = `${o.softInfo.softName}_${o.softInfo.softId}_${_bizType}_${buttonType}`
              const _softPurpose = o.softInfo.softPurpose

              return {
                name_cdk: _name_cdk,
                name_download: _name_download,
                softPurpose: _softPurpose
              }
            })
          }
        }

        if (_rankingCharts.length) {
          const _cdk = _rankingCharts.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
          const _download = _rankingCharts.filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

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
                firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
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
    },
    scrollToTop() {
      this.$refs.rankListScroller?.[this.activeTab].scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    onTouchStart(e) {
      this.startX = e.touches[0].clientX
      this.startY = e.touches[0].clientY
      this.isDragging = true
    },

    onTouchMove(e) {
      if (!this.isDragging) return

      this.currentX = e.touches[0].clientX
      const diffX = this.currentX - this.startX

      // Only move content if swipe is primarily horizontal
      const diffY = Math.abs(e.touches[0].clientY - this.startY)
      if (Math.abs(diffX) > diffY) {
        e.preventDefault()
        this.contentOffset = -this.activeTab * this.tabWidth + diffX
      }
    },

    onTouchEnd(e) {
      if (!this.isDragging) return
      const touchEndX = e.changedTouches[0].clientX
      // 点击时 不触发切换
      if (Math.abs(touchEndX - this.startX) < 10) {
        return
      }

      this.isDragging = false
      const diffX = this.currentX - this.startX

      // Minimum swipe distance to trigger tab change
      const threshold = this.tabWidth * 0.2

      if (diffX > threshold && this.activeTab > 0) {
        // Swipe right - go to previous tab
        this.setActiveTab(this.activeTab - 1)
      } else if (diffX < -threshold && this.activeTab < this.rankListPad.length - 1) {
        // Swipe left - go to next tab
        this.setActiveTab(this.activeTab + 1)
      } else {
        // Not enough swipe distance - return to current tab
        this.animateToTab(this.activeTab)
      }
    },

    setActiveTab(index) {
      this.activeTab = index
      this.animateToTab(index)
      this.rankingCharts = []
      this.clickTab(index)
    },

    animateToTab(index) {
      this.contentOffset = -index * this.tabWidth
    },
    handleViewportChange() {
      this.tabWidth = document.querySelector('.tabs-content').offsetWidth
      this.contentOffset = -this.activeTab * this.tabWidth
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

.result-wrap {
  padding: 0 40px;
  height: calc(100vh - 116px);
  overflow-y: scroll;

  .gap-bottom {
    height: 108px;
  }

  &::-webkit-scrollbar {
    display: none;
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

// pad 样式
.header-wrap {
  position: absolute;
  top: 0;
}

.pad-text {
  color: #EAF7FF;
  margin-left: 30px;
  margin-bottom: 26px;
  font-family: "Microsoft YaHei";
  font-size: 12px;
  letter-spacing: 1px
}

@media screen and (max-width:800px) {
  .result-wrap {
    padding: 0 3.75vw;
  }
}

.ganme-center-router {
  width: 100%;
  height: 74px;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 10;

  .router-title {
    font-size: 22px;
    display: flex;
    align-items: center;
    justify-content: center;

    .tab {
      color: #EAF7FF;
      opacity: 0.5;
      font-family: "Microsoft YaHei";
      margin-right: 20px;
    }

    .tab-active {
      opacity: 1
    }
  }

  .router-operation {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .icon-item-class {
      display: flex;
      align-items: center;
    }

    .icon-class {
      width: 32px;
      height: 32px;
      margin-left: 16px;
    }

    .search-class {
      width: 30vw;
      flex: 1;
      // height: 48px;
    }
  }

  .router-link-active .tab {
    opacity: 1;
  }

}

.swipe-tabs-demo {
  // padding: 20px;
  // font-family: Arial, sans-serif;

  .tabs-container {
    // border: 1px solid #ccc;
    // border-radius: 8px;
    overflow: hidden;
  }

  // .tabs-header {
  //   display: flex;
  //   background-color: #f5f5f5;
  //   border-bottom: 1px solid #ddd;
  // }

  .tab-item {
    flex: 1;
    // text-align: center;
    // padding: 15px 0;
    // cursor: pointer;
    // transition: all 0.3s ease;
    // font-weight: 500;

    // &.active {
    //   background-color: #007bff;
    //   color: white;
    // }
  }

  .tabs-content {
    position: relative;
    overflow: hidden;
  }

  .tabs-content-wrapper {
    display: flex;
    transition: transform 0.3s ease;
    width: 100%;
    height: 100%;
  }

  .tab-content {
    min-width: 100%;
  }

  .instructions {
    text-align: center;
    margin-top: 20px;
    color: #666;
    font-style: italic;
  }
}

.PhoneDevice {
  .gap-bottom {
    height: 150px;
  }
  .pad-text {
    margin-top: 10px;
    opacity: 0.6;
    margin-left: 20px;
    margin-bottom: 20px;
  }

  .ganme-center-router {
    flex-direction: column;
    align-items: flex-start;
    height: initial;
    padding: 0px 20px;

    .tab {
      font-size: 20px;
      font-weight: 700;
    }

    .router-title {
      order: 2;
      padding: 15px 0px;

    }

    .router-operation {
      order: 1;
      width: 100%;
      padding: 12px 0px;

      .search-class {
        width: 100%;
      }

      .icon-class {
        height: 28px;
        width: 28px;
      }
    }
  }
}
</style>
