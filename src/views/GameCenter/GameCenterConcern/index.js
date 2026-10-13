
import {
  queryCDKList,
  searchDefaultWords,
  searchHotWords
} from '@/api/cdkMall'

import UpSearch from '@/components/UpSearch'
import All from './All'
import ReducedPrice from './ReducedPrice'

export default {
  name: 'GameCenterConcern',
  components: {
    UpSearch,
    All,
    ReducedPrice
  },
  data() {
    return {
      defaultKeyword: '',
      showSearchUp: false,
      searchWord: [],
      searchGameList: [],
      keyword: '', // 搜索关键字
      description: '',
      isEntered: false,
      concernListLength: 0,
      reducedPriceListLength: 0,
      activeName: '1'
    }
  },
  watch: {
    userInfo: {
      async handler(newValue) {
        if (!newValue) {
          this.back()
          return
        }
      }
    },
    reducedPriceListLength: {
      handler(newValue) {
        if (!newValue) {
          this.activeName = '1'
        }
      }
    }
  },
  computed: {
    firstLocal() {
      return '5'
    },
    secondLocal() {
      return ''
    },
    thirdLocal() {
      return ''
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
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESTORE['GameCenterActiveName'] = this.activeName
      if (this.activeName === '1') {
        if (this.$refs.all) {
          this.$refs.all.storageData()
        }
      } else {
        if (this.$refs.reducedPrice) {
          this.$refs.reducedPrice.storageData()
        }
      }
    } else {
      if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
        delete window._GAMECENTER_RESTORE['GameCenterReducedPrice']
      }

      if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
        delete window._GAMECENTER_RESTORE['GameCenterConcern']
      }

      if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterActiveName']) {
        delete window._GAMECENTER_RESTORE['GameCenterActiveName']
      }
    }

    next()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    document.removeEventListener('click', this.hideSearchUp)
    document.removeEventListener('keydown', this.onDocKeydown)
    this.showSearchUp = false
    this.keyword = ''
    this.searchWord = []
    this.searchGameList = []
  },
  mounted() {
    this.$emit('headerStatus', false)
    this.getDefaultKeyword()
    document.addEventListener('click', this.hideSearchUp)
    document.addEventListener('keydown', this.onDocKeydown)

    if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterActiveName']) {
      this.$nextTick(() => {
        this.activeName = window._GAMECENTER_RESTORE['GameCenterActiveName']
      })
    }

    if (this.$route.query.activeName && this.$route.query.activeName === '2') {
      this.$nextTick(() => {
        this.activeName = this.$route.query.activeName
      })
    }

    this.initConcernList()
    this.initReducedPriceList()
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
        query: { keyword: keyword }
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
      // 移动端已无搜索快捷页 UI，不拉预览
      if (this.$isPadDevice) {
        return
      }

      const params = {
        currentClientVersion: this.version,
        current: 1,
        size: 3,
        key: this.keyword
      }

      queryCDKList(params).then(res => {
        this.searchGameList = res.records
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
    back() {
      this.$router.push({ name: 'GameCenterIndex' })
    },
    initConcernList() {
      if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
        this.$nextTick(() => {
          if (this.$refs.all) {
            this.$refs.all.updateData()
          }
        })
      } else {
        this.$nextTick(() => {
          if (this.$refs.all) {
            this.$refs.all.getConcernList(true)
          }
        })
      }
    },
    initReducedPriceList() {
      if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
        this.$nextTick(() => {
          if (this.$refs.reducedPrice) {
            this.$refs.reducedPrice.updateData()
          }
        })
      } else {
        this.$nextTick(() => {
          if (this.$refs.reducedPrice) {
            this.$refs.reducedPrice.getReducedPriceList(true)
          }
        })
      }
    },
    handleClick(tab, event) {
      this.activeName = tab.name

      if (tab.name === '1') {
        this.initConcernList()
      } else {
        this.initReducedPriceList()
      }
    },
    setConcernListLength(concernListLength) {
      this.concernListLength = concernListLength
    },
    setReducedPriceListLength(reducedPriceListLength) {
      this.reducedPriceListLength = reducedPriceListLength
    },
    deleteCurrent(item) {
      if (this.$refs.all) {
        const _Index = this.$refs.all.concernList.findIndex(o => o.softId === item.softId)
        if (_Index > -1) {
          this.$refs.all.concernList.splice(_Index, 1)
          if (this.$refs.all.concernListLength > 0) {
            this.$refs.all.concernListLength--
          }

          if (this.concernListLength > 0) {
            this.concernListLength--

            if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
              const _GameCenterConcern = JSON.parse(window._GAMECENTER_RESTORE['GameCenterConcern'])
              if (_GameCenterConcern.concernList.length && _GameCenterConcern.concernList.some(o => o.softId === item.softId)) {
                _GameCenterConcern.concernList = _GameCenterConcern.concernList.map(o => {
                  if (o.softId === item.softId && !o.unFollowMark) {
                    o.unFollowMark = true
                  }
                  return o
                })

                if (_GameCenterConcern.concernListLength > 0) {
                  _GameCenterConcern.concernListLength--
                }

                window._GAMECENTER_RESTORE['GameCenterConcern'] = JSON.stringify(_GameCenterConcern)
              }
            }
          }
        }
      }

      if (this.$refs.reducedPrice) {
        const _Index = this.$refs.reducedPrice.reducedPriceList.findIndex(o => o.softId === item.softId)
        if (_Index > -1) {
          this.$refs.reducedPrice.reducedPriceList.splice(_Index, 1)
          if (this.$refs.reducedPrice.reducedPriceListLength > 0) {
            this.$refs.reducedPrice.reducedPriceListLength--
          }

          if (this.reducedPriceListLength > 0) {
            this.reducedPriceListLength--

            if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
              const _GameCenterReducedPrice = JSON.parse(window._GAMECENTER_RESTORE['GameCenterReducedPrice'])
              if (_GameCenterReducedPrice.reducedPriceList.length && _GameCenterReducedPrice.reducedPriceList.some(o => o.softId === item.softId)) {
                _GameCenterReducedPrice.reducedPriceList = _GameCenterReducedPrice.reducedPriceList.map(o => {
                  if (o.softId === item.softId && !o.unFollowMark) {
                    o.unFollowMark = true
                  }
                  return o
                })

                if (_GameCenterReducedPrice.reducedPriceListLength > 0) {
                  _GameCenterReducedPrice.reducedPriceListLength--
                }
                window._GAMECENTER_RESTORE['GameCenterReducedPrice'] = JSON.stringify(_GameCenterReducedPrice)
              }
            }
          }
        }
      }
    }
  }
}
