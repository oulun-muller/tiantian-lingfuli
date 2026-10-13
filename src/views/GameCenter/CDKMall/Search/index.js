import { queryCDKList, queryCDKListByKey, searchDefaultWords, searchHotWords } from '@/api/cdkMall'
import DownloadButton from '@/components/DownloadButton'
import FourColumnList from '@/components/FourColumnList'
import FourColumnListPhone from '@/components/FourColumnList_phone'
import FourColumnListPad from '@/components/FourColumnList_pad'
import UpSearch from '@/components/UpSearch'

import { getGameMsgDataReport, createTabPageReporter } from '@/utils/dataReport'

import { REPORT_FROM } from '@/store/enum/buryingPoint'

export default {
  name: 'Search',
  components: {
    DownloadButton,
    FourColumnList,
    FourColumnListPhone,
    FourColumnListPad,
    UpSearch
  },
  data() {
    return {
      defaultKeyword: '',
      searchWord: [],
      searchGameList: [],
      fromRouterName: null,
      current: 0, // 当前页（从1开始）
      keyword: this.$route.query.keyword || '',
      nomore: false,
      cdkList: [],
      fetching: false,
      scrollTop: 0,
      description: '',
      isFocus: false,
      thirdLocal: 3,
      isEntered: true,
      preciseMatch: null
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
      },
      immediate: true
    }
  },
  computed: {
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return '4'
      }
      return this.$route.query.firstLocal || '3'
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 7
    },
    version() {
      return this.$store.state.system.version
    },
    system() {
      return this.$store.state.system
    },
    showSearchUp() {
      return this.isFocus && (this.keyword && this.searchGameList.length > 0 || this.searchWord.length > 0)
    },
    from() {
      // 1 游戏中心
      return REPORT_FROM[this.$route.query.reportFrom] || 1
    }
  },
  beforeRouteEnter(to, from, next) {
    if (!['GameCenterDetail'].includes(from.name)) {
      window._GAMECENTER_RESTORE && delete window._GAMECENTER_RESTORE['Search']
    }

    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESTORE['Search'] = JSON.stringify({
        ...this.$data,
        scrollTop: Math.round(this.$refs.scroller.scrollTop)
      })
    }

    clearTimeout(this.timer2)
    next()
  },
  created() {
    this._reporter = createTabPageReporter('游戏搜索', '/gameCenter/search')
    this._reporter.reportStart()

    if (window._GAMECENTER_RESTORE['Search']) {
      const {
        current,
        keyword,
        nomore,
        cdkList,
        scrollTop,
        preciseMatch
      } = JSON.parse(window._GAMECENTER_RESTORE['Search'])
      delete window._GAMECENTER_RESTORE['Search']

      this.current = current
      this.keyword = keyword
      this.nomore = nomore
      this.cdkList = cdkList
      this.scrollTop = scrollTop
      this.preciseMatch = preciseMatch
      this.$nextTick(() => {
        this.$refs.scroller.scrollTop = this.scrollTop
        this._reporter.reportLoaded()
      })
      this.searchGameReport(this.cdkList, 2)
      if (this.cdkList.length) {
        this.storeAllSearchListShowReport()
      }
    } else {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkSearchClick', 'click', {
        searchContent: this.keyword,
        from: this.$isPadDevice ? 'Pad' : this.from
      })
      this.$store.dispatch('gameDownloadState/clearState')
      this.getCDKListWithReport()
    }
  },
  mounted() {
    requestAnimationFrame(() => this._reporter.reportFirstFrame())
    this.$emit('headerStatus', false)
    this.getDefaultKeyword()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    this.keyword = ''
    this.searchWord = []
    this.searchGameList = []
  },
  methods: {
    onFocus() {
      this.isFocus = true
    },
    onBlur() {
      this.timer2 = setTimeout(() => {
        this.isFocus = false
      }, 200)
    },
    back() {
      // 外链 loadUrl + WebView.goBack 重挂时 from.name 常为空；能退历史就退
      if (this.fromRouterName || window.history.length > 1) {
        this.$router.back()
        return
      }

      this.$router.push({ name: 'GameCenterHome' })
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
      if (this.keyword) {
        this.getSearchGameList()
      } else {
        this.getSearchWord()
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
    selectSearchWord(searchValue) {
      this.keyword = searchValue
      this.getCDKList(true)
    },
    searchGameListByKeyword() {
      this.isEntered = true
      this.searchGameList = []
      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.getSearchGameList()
      }, 200)
    },
    handleIsEntered() {
      if (this.keyword) {
        this.isEntered = true
      } else {
        this.isEntered = false
      }
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

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        if (!this.keyword) {
          this.$message({
            message: '请输入你想玩的游戏',
            type: 'warning',
            duration: 2500,
            customClass: 'lg-message--warning'
          })

          return
        } else {
          this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkSearchClick', 'click', {
            searchContent: this.keyword,
            from: this.$isPadDevice ? 'Pad' : this.from
          })
        }

        this.getCDKList(true)
      }, 100)
    },
    getCDKListWithReport() {
      return this.getCDKList(true).then(() => {
        this._reporter.reportLoaded()
      })
    },
    getCDKList(force) {
      if (this.fetching) return

      if (force) {
        this.current = 0
        this.nomore = false
        this.cdkList = []
      } else if (this.nomore) {
        return
      }

      const params = {
        currentClientVersion: this.version,
        current: this.current + 1,
        size: 20
      }

      if (this.keyword) {
        params.key = this.keyword
      }

      this.fetching = true
      if (force) {
        this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      }
      return queryCDKList(params).then(res => {
        this.nomore = res.records.length < res.size
        this.current = res.current
        this.cdkList = [...this.cdkList, ...res.records]
        // force=true 是新搜索，重置 preciseMatch；分页时只在接口有返回时才覆盖，否则保留第一页缓存的值
        this.preciseMatch = res && res.preciseMatch != null ? res.preciseMatch : (force ? null : this.preciseMatch)
        this.searchGameReport(res.records, 2)
        if (res.records.length) {
          this.storeAllSearchListShowReport()
        }
      }).catch(() => {
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.fetching = false
        if (this.$refs.placeholderWidthInput) {
          this.$refs.placeholderWidthInput.blur()
        }
        if (force) {
          this.$store.dispatch('pageLoaded', false)
        }
      })
    },
    scrollHandle(e) {
      this.scrollTop = Math.round(e.target.scrollTop)

      if (!this.nomore && e.target.scrollTop + e.target.offsetHeight + 300 >= e.target.scrollHeight) {
        this.getCDKList(false)
      }
    },
    searchGameReport(data, type) {
      const _cdk = data.filter(o => o.softPurpose === 1).map(o => `${o.softName}_${o.softId}`).join(',')
      const _download = data.filter(o => [2, 3].includes(o.softPurpose)).map(o => {
        const report = getGameMsgDataReport(o)
        const _bizType = report.stateGame
        const buttonType = report.statePage

        let _firstClassId = 1// 1:游戏，2：工具
        if (o.softPurpose === 3) { // 3杂志游戏
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
            from: this.from,
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
            from: this.$isPadDevice ? 'PAD' : this.from,
            type: type,
            plateName: this.keyword,
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }
    },
    storeAllSearchListShowReport() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeAllSearchListShow', 'pv', {
        detail: JSON.stringify({
          from: this.$isPadDevice ? 'PAD' : this.from,
          type: 2,
          plateName: `${this.keyword}`,
          pagination: this.current,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })
    }
  }
}
