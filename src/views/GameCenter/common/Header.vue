<template>
  <header :class="{ sticky: scrollTop > 180 }">
    <div
      class="search-wrap"
      draggable
      @dragstart.prevent="$startDrag"
      @dblclick.self="$toggleMaximize">
      <div class="search" draggable @dragstart.prevent.stop>
        <input
          type="text"
          v-model.trim="keyword"
          @keydown.enter="toSearch"
          @click.stop="handleShowSearchUp"
          @focus="handleShowSearchUp"
          @input="searchGameListByKeyword"
          @mouseenter="handleIsEntered">
        <i class="iconfont" tabindex="0" role="button" aria-label="搜索" @click.stop="toSearch" @keydown.enter.prevent.stop="toSearch" @keydown.space.prevent.stop="toSearch"></i>
        <span
          class="placeholder"
          v-if="!isEntered"><i class="title">{{ defaultKeyword }}</i><i v-if="!$isPadDevice" class="sub-title">{{ description }}</i></span>
        <UpSearch
          @click.stop
          v-if="showSearchUp"
          :keyword="keyword"
          :show-search-up="showSearchUp"
          :search-word="searchWord"
          :search-game-list="searchGameList"
          @selectSearchWord="selectSearchWord"
          search-up-source="searchPage"
          :first-local="firstLocal" />
      </div>
    </div>
    <nav class="router-wrap" role="tablist" aria-label="游戏中心导航" @keydown="onTablistKeydown">
      <router-link to="/gameCenter/index" role="tab" :aria-selected="$route.path === '/gameCenter/index' || $route.path === '/gameCenter/'" aria-label="精选" @click="onTabClick('精选', '/gameCenter/index')">
        <span class="tab" >精选<i v-if="tabTip && tabTip['精选']" class="tips jx" aria-hidden="true">{{ tabTip['精选'] }}</i></span>
      </router-link>
      <router-link to="/gameCenter/activityZone" role="tab" :aria-selected="$route.path === '/gameCenter/activityZone'" :aria-label="activityTabName" @click="onTabClick(activityTabName, '/gameCenter/activityZone')">
        <span class="tab">{{ activityTabName }}<i v-if="tabTip && (tabTip[activityTabName] || tabTip['活动'] || tabTip['福利&活动'])" class="tips jx" aria-hidden="true">{{ tabTip[activityTabName] || tabTip['活动'] || tabTip['福利&活动'] }}</i></span>
      </router-link>
      <router-link to="/gameCenter/reserveZone" v-if="showReservePage" role="tab" :aria-selected="$route.path === '/gameCenter/reserveZone'" aria-label="火爆预约" @click="onTabClick('火爆预约', '/gameCenter/reserveZone')">
        <span class="tab">火爆预约<i v-if="tabTip && tabTip['火爆预约']" class="tips hb" aria-hidden="true">{{ tabTip['火爆预约'] }}</i></span>
      </router-link>
      <router-link to="/gameCenter/rankList" role="tab" :aria-selected="$route.path === '/gameCenter/rankList'" aria-label="排行榜" @click="onTabClick('排行榜', '/gameCenter/rankList')">
        <span class="tab">排行榜<i v-if="tabTip && tabTip['榜单']" class="tips bd" aria-hidden="true">{{ tabTip['榜单'] }}</i></span>
      </router-link>
      <!-- <router-link to="/gameCenter/miniGame" @click="toMiniGame">
        <span class="tab">小游戏<i v-if="tabTip && tabTip['小游戏']" class="tips jx">{{ tabTip['小游戏'] }}</i></span>
      </router-link> -->
      <router-link
        v-if="gameCenterTabShow && gameCenterTabShow['LEGION PLAY']===1"
        to="/gameCenter/magazine"
        role="tab"
        :aria-selected="$route.path === '/gameCenter/magazine'"
        aria-label="LEGION PLAY">
        <span class="tab" >LEGION PLAY<i v-if="tabTip && tabTip['LEGION PLAY']" class="tips lp" aria-hidden="true">{{ tabTip['LEGION PLAY'] }}</i></span>
      </router-link>
      <div class="click-class">
        <span class="tab up" :class="{'class-acctive' : routeFlage}" role="tab" :aria-selected="routeFlage ? 'true' : 'false'" :tabindex="routeFlage ? 0 : -1" aria-label="游戏库" @click.stop="clickGame" @keydown.enter.prevent.stop="clickGame" @keydown.space.prevent.stop="clickGame">游戏库<i class="iconfont" aria-hidden="true">&#xe632;</i>
          <i v-if="tabTip && tabTip['游戏库']" class="tips yxk" aria-hidden="true">{{ tabTip['游戏库'] }}</i>
          <UpTag class="UpTag"/>
        </span>
      </div>
    </nav>
  </header>
</template>
<script>
import UpTag from './UpTag'
import UpSearch from '@/components/UpSearch'
import {
  queryCDKListByKey,
  searchDefaultWords,
  searchHotWords
} from '@/api/cdkMall'
import { getGameToolsTab, getTabTip, getGameTab } from '@/api/gameCenter.js'
import { compareVersions } from '@/utils'
import { activityTabLabel } from '@/utils/welfareVersionGate'
import { getGameMsgDataReport, reportTabClick } from '@/utils/dataReport'
export default {
  components: {
    UpTag,
    UpSearch
  },
  data() {
    return {
      tabTip: {},
      defaultKeyword: '',
      showSearchUp: false,
      searchWord: [],
      searchGameList: [],
      keyword: '',
      description: '',
      showGameToolsTab: false,
      isEntered: false,
      gameCenterTabShow: null,
      routeFlage: false,
      gameTabActiteList: ['/gameCenter/gameTools', '/gameCenter/cdkMall', '/gameCenter/gameLibrary']
    }
  },
  computed: {
    activityTabName() {
      return activityTabLabel(this.version)
    },
    showReservePage() {
      return compareVersions(this.version, '2.0.17')
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return '4'
      }
      return this.$route.query.firstLocal || '3'
    },
    version() {
      return this.$store.state.system.version
    },
    system() {
      return this.$store.state.system
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    currentPath() {
      return this.$route.path
    }
  },
  watch: {
    keyword: {
      handler(newValue) {
        if (!newValue) {
          this.isEntered = false
        } else {
          this.isEntered = true
        }
      }
    },
    currentPath(newPath, oldPath) {
      console.log('当前路径变化：', oldPath, '->', newPath)
      // 解决其他页面返回游戏中心，激活态消失
      if (this.gameTabActiteList.includes(this.$route.path)) {
        this.routeFlage = true
      } else {
        this.routeFlage = false
      }
      this.$nextTick(() => this.updateTabindexes())
    }
  },
  props: {
    scrollTop: {
      type: Number,
      default: 0
    }
  },
  created() {
    this.routeFlage = false

    // 解决其他页面返回游戏中心，激活态消失
    if (this.gameTabActiteList.includes(this.$route.path)) {
      this.routeFlage = true
    } else {
      this.routeFlage = false
    }
  },
  mounted() {
    this.getDefaultKeyword()
    document.removeEventListener('click', this.hideSearchUp)
    document.addEventListener('click', this.hideSearchUp)
    document.addEventListener('keydown', this.onDocKeydown)
    this.$nextTick(() => this.updateTabindexes())
    getGameToolsTab().then(res => {
      this.showGameToolsTab = res
    })
    getTabTip().then(res => {
      try {
        this.tabTip = JSON.parse(res)
      } catch (error) {
        this.tabTip = {}
      }
    })
    getGameTab().then(res => {
      this.gameCenterTabShow = res
      this.$nextTick(() => this.updateTabindexes())

      if (this.gameCenterTabShow && this.gameCenterTabShow['LEGION PLAY']) {
        this.$dataReport(
          'LZ_gamingCenter',
          'LZ_storeLegionPlayEnterPageShow',
          'pv',
          {
            detail: JSON.stringify({
              firstLocal: this.firstLocal,
              secondLocal: 9,
              thirdLocal: '',
              plateName: '',
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          }
        )
      }
    })
    this.activityZoneReportShow()
  },
  activated() {
    document.removeEventListener('click', this.hideSearchUp)
    document.addEventListener('click', this.hideSearchUp)
    document.addEventListener('keydown', this.onDocKeydown)
  },
  deactivated() {
    clearTimeout(this.timer)
    document.removeEventListener('click', this.hideSearchUp)
    document.removeEventListener('keydown', this.onDocKeydown)
    this.showSearchUp = false
    this.keyword = ''
    this.searchWord = []
    this.searchGameList = []
  },
  beforeUnmount() {
    document.removeEventListener('click', this.hideSearchUp)
    document.removeEventListener('keydown', this.onDocKeydown)
  },
  methods: {
    // 无障碍适配左右键盘切换
    updateTabindexes() {
      const nav = this.$el && this.$el.querySelector('[role="tablist"]')
      if (!nav) return
      const tabs = Array.from(nav.querySelectorAll('[role="tab"]'))
      // 找到当前激活的 tab（aria-selected="true"）
      const activeTab = tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]
      tabs.forEach(t => {
        t.setAttribute('tabindex', t === activeTab ? '0' : '-1')
      })
    },
    onTablistKeydown(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const tabs = Array.from(this.$el.querySelectorAll('[role="tab"]'))
      const current = document.activeElement
      const idx = tabs.indexOf(current)
      if (idx === -1) return
      e.preventDefault()
      const next = e.key === 'ArrowRight'
        ? (idx + 1) % tabs.length
        : (idx - 1 + tabs.length) % tabs.length
      tabs.forEach(t => t.setAttribute('tabindex', '-1'))
      tabs[next].setAttribute('tabindex', '0')
      tabs[next].focus()
    },
    getDefaultKeyword() {
      const params = {
        locationId: 1,
        activeTime: this.system.activeTime,
        legionChannel: this.system.Channel,
        legionModel: this.system.MTMInfo.ReadableMachineName,
        legionMtCode: this.system.MTMInfo.MTCode,
        legionVersion: this.system.version,
        mac: this.system.mac,
        osBits: this.system.MTMInfo.OSBit,
        osVersion: this.system.MTMInfo.OS,
        sn: this.system.MTMInfo.MachineName
      }

      searchDefaultWords(params, '搜你想玩的游戏').then(res => {
        this.defaultKeyword = res.keyword
        this.description = res.description
      })
    },
    handleShowSearchUp() {
      this.showSearchUp = true
      this.getSearchWord()
      document.removeEventListener('click', this.hideSearchUp)
      this.$nextTick(() => {
        document.addEventListener('click', this.hideSearchUp)
      })
    },
    hideSearchUp() {
      this.showSearchUp = false
    },
    onDocKeydown(e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && this.showSearchUp) {
        this.showSearchUp = false
        this.$el.querySelector('input').blur()
      }
    },
    getSearchWord() {
      const params = {
        locationId: 1,
        activeTime: this.system.activeTime,
        legionChannel: this.system.Channel,
        legionModel: this.system.MTMInfo.ReadableMachineName,
        legionMtCode: this.system.MTMInfo.MTCode,
        legionVersion: this.system.version,
        mac: this.system.mac,
        osBits: this.system.MTMInfo.OSBit,
        osVersion: this.system.MTMInfo.OS,
        sn: this.system.MTMInfo.MachineName
      }

      searchHotWords(params).then(res => {
        this.searchWord = res
      })
    },
    selectSearchWord(keyword) {
      this.$router.push({
        name: 'GameCenterSearch',
        query: { keyword: keyword }
      })
    },
    handleIsEntered() {
      if (this.keyword) {
        this.isEntered = true
      } else {
        this.isEntered = false
      }
    },
    searchGameListByKeyword() {
      this.isEntered = true
      this.searchGameList = []
      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.getSearchGameList()
      }, 200)
    },
    getSearchGameList() {
      // 移动端已无搜索快捷页 UI，不拉预览、不上报 type:1
      if (this.$isPadDevice) {
        return
      }

      const params = {
        currentClientVersion: this.version,
        current: 1,
        size: 3,
        key: this.keyword
      }

      queryCDKListByKey(params).then(res => {
        this.searchGameList = res.records
        this.searchGameReport(res.records, 1)
      }).catch(() => {})
    },
    toSearch() {
      if (!this.keyword) {
        if (this.defaultKeyword !== '搜你想玩的游戏') {
          this.keyword = this.defaultKeyword
        }
      }

      if (!this.keyword) {
        this.$message({
          message: '请输入你想玩的游戏',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })
        return
      }

      this.$router.push({
        name: 'GameCenterSearch',
        query: { keyword: this.keyword }
      })
    },
    searchGameReport(data, type) {
      const _cdk = data.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
      const _download = data.filter(o => [2, 3].includes(o.softPurpose)).map(o => {
        const report = getGameMsgDataReport(o)
        const _bizType = report.stateGame
        const buttonType = report.statePage

        let _firstClassId = 1// 1:游戏，2：工具
        if (o.softPurpose === 3) { // 3:杂志游戏
          _firstClassId = 3
        }

        if (Number(o.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          _firstClassId = 2
        }

        let _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
        if (_firstClassId === 2 || _firstClassId === 3) {
          _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}_${_firstClassId}`
        }

        return {
          name_download: _name_download
        }
      }).map(o => o.name_download).join(',')

      if (_cdk) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkSearchListShow', 'pv', {
          details: JSON.stringify({
            from: 1,
            type: type,
            plateName: this.keyword,
            nameAndIDVersion: _cdk,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }

      if (_download) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeLoadGameSearchListShow', 'pv', {
          details: JSON.stringify({
            from: this.$isPadDevice ? 'PAD' : 1,
            type: type,
            plateName: this.keyword,
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }
    },
    onTabClick(tabName, route) {
      reportTabClick(tabName, route)
    },
    clickGame() {
      reportTabClick('游戏库', '/gameCenter/gameLibrary')
      this.$router.push({
        path: `/gameCenter/gameLibrary`
      })
      this.routeFlage = true
    },
    handleNNStore() {
      window.LegionZone.nativeCall('pbase.dll', 'Launch_NNBBS', { cmdline: this.nnStoreUrl })
    }
  }
}
</script>
<style lang="scss" scoped>
header {
  position: relative;
  z-index: 10;
  width: 100%;
  background: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.00) 100%);
  transition: background-color 0.3s ease;
  &.sticky {
    background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, #000 10%, #000 100%);
    opacity: 1;
    transition: background-color 0.3s ease;
    padding-bottom: 14px;
  }
  .search-wrap {
    padding: 24px 0 0px 40px;
    > div.search {
      position: relative;
      width: 300px;
      height: 36px;
      > input {
        width: 100%;
        height: 100%;
        background-color: transparent;
        border: none;
        outline: none;
        padding-left: 20px;
        font-size: 14px;
        color: #EAF7FF;
        background-color: rgba(14, 18, 23, 0.8);
        box-sizing: border-box;
        border: 1px solid rgba(88, 94, 102, 0.8);
        padding-right: 36px;
        &:hover {
          border: 1px solid rgba(56, 110, 254, 0.8);
        }
        &:focus {
          border: 1px solid rgba(56, 110, 254, 0.8);
        }
      }
      ::-webkit-input-placeholder {
        color: rgba(234, 247, 255, .6);
        font-weight: 700;
      }
      > i {
        display: inline-block;
        width: 16px;
        height: 16px;
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        background: url('@/images/gamecenter/game-search.png') no-repeat;
        background-size: cover;
      }
      .placeholder {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        max-width: 263px;
        overflow: hidden;
        white-space: nowrap;
        padding-left: 20px;
        box-sizing: border-box;
        .title {
          font-weight: 700;
          color: rgba(234, 247, 255, .6);
        }
        .sub-title{
          font-weight: 400;
          font-size: 14px;
          color: rgba(234, 247, 255, .6);
          margin-left: 20px;
          white-space: nowrap;
        }
      }
    }
    &.sticky {
      background: none;
      background-color: #101010;
    }
  }
  .router-wrap {
    display: inline-block;
    padding: 24px 0 0px 40px;
    .tab {
      position: relative;
      .tips {
        position: absolute;
        background: transparent url('~@/images/gamecenter/magazine/highlight-icon.png') no-repeat center center/ 100% 100%;
        height: 24px;
        color: #FFF;
        text-shadow: 0px 1px 1px rgb(0 0 0 / 25%);
        font-size: 12px;
        font-family: "Microsoft YaHei";
        font-weight: 700;
        transform: scale(0.8);
        font-style: italic;
        padding: 3px 20px 7px 20px;
        line-height: 12px;
        width: max-content;
        &.lp{
          top: -24px;
          left: 70px;
        }
        &.hb {
          top: -24px;
          left: 43px;
        }
        &.jx,&.bd {
          left: 5px;
          top: -24px;
        }
        &.cdk, &.yxk{
          left: 15px;
          top: -24px;
        }
        &.gj{
          left: 23px;
          top: -24px;
        }
      }
    }
    .click-class{
      cursor: pointer;
      display: inline-block;
    }
    .router-link-active {
      vertical-align: 2px;
    }
    .tab {
      font-size: 16px;
      margin-right: 22px;
      font-weight: 700;
      color: rgba(234, 247, 255, 0.5);
      vertical-align: middle;
      position: relative;
      &.up {
        .iconfont {
          margin-left: 3px;
          display: inline-block;
          font-size: 12px;
          transition: all 0.1s linear;
          vertical-align: middle;
          font-weight: lighter;
          // transform: rotateZ(-180deg);
        }
        .UpTag {
          display: none;
        }
        &:hover {
          .iconfont {
            transform: rotateZ(180deg);
          }
          .UpTag {
            display: block;
          }
        }
      }
    }
    .router-link-active .tab {
      color: #EAF7FF;
      font-weight: 700;
      line-height: 20px;
      font-size: 20px;
      opacity: 1;
       :deep(.rest) {
        position: absolute;
        left: -193px;
        top: 20px;
        height: auto;
      }
    }
    .class-acctive {
        color: #EAF7FF;
      font-weight: 700;
      line-height: 20px;
      font-size: 20px;
      opacity: 1;
  }
  }
}

header .search > i.iconfont:focus-visible,
header .router-wrap .click-class > span.tab:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

header .router-wrap a:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  header .search > i.iconfont:focus-visible,
  header .router-wrap .click-class > span.tab:focus-visible {
    outline: 2px solid Highlight;
  }
  header .router-wrap a:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
