import resolveAsset from '@/compat/resolveAsset'
import Header from '../common/Header'
import GameDownloadButton from '@/components/GameDownloadButton'
import { queryCDKList } from '@/api/cdkMall'
import { getSelectTagList } from '@/api/gameCenter'
import { getGameToolsTab } from '@/api/gameCenter.js'
export default {
  name: 'GameTools',
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      scrollTop: 0,
      gameToolsScrollTop: 0,
      fromRouterName: null,
      current: 0,
      nomore: false,
      fetching: false,
      isLoad: false,
      selectTagList: [],
      curSelectTag: '',
      gameToolsList: [],
      thirdLocal: ''
    }
  },
  components: {
    Header,
    GameDownloadButton
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
      return 8
    },
    version() {
      return this.$store.state.system.version
    },
    drinfo() {
      const _thirdLocal = this.selectTagList.filter(item => item.id === this.curSelectTag).map(item => item.name).join(',')

      return (item) => {
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: _thirdLocal,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        }

        let _gameClass = 1 // 1游戏，2工具
        if (Number(item.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          _gameClass = 2
        }

        if (_gameClass === 2) {
          params.gameClass = _gameClass
        }

        return JSON.stringify(params)
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    if (!['GameCenterDetail'].includes(from.name)) {
      if (window._GAMECENTER_RESTORE) {
        delete window._GAMECENTER_RESTORE['GameTools']
      }
    }

    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESTORE['GameTools'] = JSON.stringify({
        ...this.$data,
        gameToolsScrollTop: Math.round(this.$refs.gameToolsScrollTop.scrollTop)
      })
    }

    next()
  },
  async created() {
    const _gameToolsTab = await getGameToolsTab()
    if (!_gameToolsTab) {
      this.$router.replace({
        name: 'GameCenterHome'
      })
    }

    if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameTools']) {
      const {
        current,
        nomore,
        selectTagList,
        curSelectTag,
        gameToolsList,
        gameToolsScrollTop
      } = JSON.parse(window._GAMECENTER_RESTORE['GameTools'])

      delete window._GAMECENTER_RESTORE['GameTools']

      this.current = current
      this.nomore = nomore
      this.selectTagList = selectTagList
      this.curSelectTag = curSelectTag
      this.gameToolsList = gameToolsList
      this.gameToolsScrollTop = gameToolsScrollTop

      this.$nextTick(() => {
        this.$refs.gameToolsScrollTop.scrollTop = this.gameToolsScrollTop
      })
    } else {
      this.getSelectTagList()
    }
  },
  mounted() {
    this.$emit('headerStatus', true)
    this.$emit('scrollTop', 0)
  },
  methods: {
    getSelectTagList() {
      getSelectTagList({ currentClientVersion: this.version, moduleType: 3 }).then(res => {
        if (!res || !res.length) {
          this.isLoad = true
          return
        }

        this.selectTagList = res.map(item => ({
          name: item.moduleName,
          id: item.rankingLists[0].id
        }))

        this.curSelectTag = this.selectTagList[0].id
        if (this.curSelectTag) {
          this.getGameToolsList(true)
        }
      })
    },
    getGameToolsList(force) {
      if (this.fetching) return

      if (force) {
        this.current = 0
        this.nomore = false
        this.gameToolsList = []
      } else if (this.nomore) {
        return
      }

      const params = {
        currentClientVersion: this.version,
        current: this.current + 1,
        size: 20
      }

      if (this.curSelectTag) {
        params.rankingListId = this.curSelectTag
      }

      this.fetching = true
      if (force) {
        this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      }
      queryCDKList(params).then(res => {
        this.nomore = res.records.length < res.size
        this.current = res.current
        this.gameToolsList = [...this.gameToolsList, ...res.records]
        this.gameReport(res.records)
      }).catch(() => {
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.isLoad = true
        this.fetching = false
        if (force) {
          this.$store.dispatch('pageLoaded', false)
        }
      })
    },
    selectTag(item) {
      this.curSelectTag = item.id
      this.isLoad = false
      this.getGameToolsList(true)
    },
    goDetail(item) {
      const _thirdLocal = this.selectTagList.filter(item => item.id === this.curSelectTag).map(item => item.name).join(',')
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: _thirdLocal
        }
      })
    },
    scrollHandle(e) {
      this.gameToolsScrollTop = Math.round(e.target.scrollTop)

      if (!this.nomore && e.target.scrollTop + e.target.offsetHeight + 300 >= e.target.scrollHeight) {
        this.getGameToolsList(false)
      }
    },
    gameReport(data) {
      if (data.length) {
        const _data = data.map(k => ({
          name: `${k.softName}_${k.softId}_1_1_2`,
          softPurpose: k.softPurpose
        }))

        const _download = _data.filter(o => o.softPurpose === 2).map(o => o.name).join(',')

        if (_download) {
          const _thirdLocal = this.selectTagList.filter(item => item.id === this.curSelectTag).map(item => item.name).join(',')

          this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeLoadGameTabPageShow', 'pv', {
            details: JSON.stringify({
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              plateName: _thirdLocal,
              nameAndIDVersion: _download,
              lenovoid: this.userInfo ? this.userInfo.UserID : ''
            })
          })
        }
      }
    }
  }
}
