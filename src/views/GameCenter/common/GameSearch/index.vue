<template>
  <header>
    <div
      class="search-wrap"
      draggable
      @dragstart.prevent="$startDrag"
      @dblclick.self="$toggleMaximize">
      <div class="search" draggable @dragstart.prevent.stop>
        <input
          type="text"
          aria-label="搜索游戏"
          v-model.trim="keyword"
          @keydown.enter="toSearch"
          @keydown.esc="hideSearchUp"
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
          @keydown.esc="hideSearchUp"
          v-if="showSearchUp"
          :mini-game-device-info="miniGameDeviceInfo"
          :from-page-type="fromPageType"
          :keyword="keyword"
          :show-search-up="showSearchUp"
          up-source="miniGame"
          :search-word="searchWord"
          :search-game-list="searchGameList"
          @selectSearchWord="selectSearchWord"
          search-up-source="searchPage"
          :first-local="firstLocal" />
      </div>
    </div>
  </header>
</template>
<script>
import UpSearch from '@/components/UpSearch'
import {
  queryCDKListByKey,
  searchDefaultWords,
  searchHotWords
} from '@/api/cdkMall'

import { getGameMsgDataReport } from '@/utils/dataReport'

export default {
  components: {
    UpSearch
  },
  data() {
    return {
      defaultKeyword: '',
      showSearchUp: false,
      searchWord: [],
      searchGameList: [],
      keyword: '',
      description: '',
      isEntered: false,
      hideTag: false
    }
  },
  computed: {
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      return this.$route.query.firstLocal
    },
    version() {
      return this.$store.state.system.version
    },
    system() {
      return this.$store.state.system
    },
    userInfo() {
      return this.$store.state.user.userInfo
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
    }
  },
  props: {
    scrollTop: {
      type: Number,
      default: 0
    },
    upSource: {
      type: String,
      default: ''
    },
    miniGameDeviceInfo: {
      type: Object,
      default: () => {
        return {}
      }
    },
    fromPageType: {
      type: Number,
      default: 0
    },
    isActiveTab: {
      type: String,
      default: ''
    }
  },
  mounted() {
    this.getDefaultKeyword()
    document.removeEventListener('click', this.hideSearchUp)
    document.addEventListener('click', this.hideSearchUp)
    document.addEventListener('keydown', this.onDocKeydown)
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
        query: { keyword: keyword, reportFrom: 'miniGame', firstLocal: this.firstLocal }
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
        query: { keyword: this.keyword, reportFrom: 'miniGame', isActiveTab: this.isActiveTab, firstLocal: this.firstLocal }
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
            from: 3,
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
            from: this.$isPadDevice ? 'PAD' : 3,
            type: type,
            plateName: this.keyword,
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }
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
  .search-wrap {
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
}

header .search > i.iconfont:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  header .search > i.iconfont:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
