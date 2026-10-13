<template>
  <div class="GameCenterIndex">
    <div
      v-if="modules.length"
      :class="['gamecenter-home', 'popover-relative-dom', $isPhoneDevice ? '' : $isPadDevice ? 'PadDevice' : 'PcDevice']"
      ref="scroller"
      @scroll="scrollHandle">
      <!-- <Test/> -->
      <component
        v-for="item of renderModules"
        :key="item.moduleId"
        :is="moduleComponentEnum[item.moduleStyle]"
        :module-data="item"
        @upDataFollower="upDataFollower"
        @upDataLikes="upDataLikes">
      </component>
      <div class="gap"></div>
    </div>
    <AdDialog v-if="$isPadDevice" />
  </div>
</template>
<script>
// import Test from './test'
import BigBanner from './BigBanner'
import BigBannerPad from './BigBannerPad'
import RankList from './RankList'
import RankListPad from './RankListPad'
import HorizontalList from './HorizontalList'
import HorizontalList2 from './HorizontalList2'
import DoubleArrayList from './DoubleArrayList'
import LeftBanner from './LeftBanner'
import RightBanner from './RightBanner'
import GameCalendar from './GameCalendar'
import BetaTestGame from './BetaTestGame'
import EvaluationRecommendation from './EvaluationRecommendation'
import MiniGameList from './MiniGameList'
import RecentGame from './RecentGame'
import { getGCHomeData } from '@/api/gameCenter'
import { createTabPageReporter } from '@/utils/dataReport'
// 榜单样式 5 6 7 8 9 10
// 5-全屏banner(填充方式2),
// 6-左图banner(填充方式2),
// 7-右图banner(填充方式2),
// 8-游戏排行榜(填充方式3),
// 9-横向列表(填充方式1),
// 10-3X2列表(填充方式1)
import AdDialog from './AdDialog'

export default {
  name: 'GameCenterIndex',
  provide() {
    return {
      requestTime: () => this.requestTime
    }
  },
  inject: ['showOffline'],
  components: {
    // Test,
    BigBanner,
    BigBannerPad,
    RankList,
    RankListPad,
    HorizontalList,
    DoubleArrayList,
    LeftBanner,
    RightBanner,
    GameCalendar,
    BetaTestGame,
    EvaluationRecommendation,
    MiniGameList,
    AdDialog,
    HorizontalList2,
    RecentGame
  },
  data() {
    return {
      scrollTop: 0,
      modules: [],
      requestTime: null,
      current: 1,
      size: 6,
      fetching: false,
      nomore: false
    }
  },
  computed: {
    isLogin() {
      return this.userInfo && this.userInfo.UserID
    },
    bannerName() {
      return this.$isPadDevice ? 'BigBannerPad' : 'BigBanner'
    },
    moduleComponentEnum() {
      return {
        5: this.bannerName,
        6: 'LeftBanner',
        7: 'RightBanner',
        8: this.rankListName,
        9: 'HorizontalList',
        10: 'DoubleArrayList',
        11: 'GameCalendar',
        12: 'BetaTestGame',
        14: 'EvaluationRecommendation',
        15: 'MiniGameList',
        22: 'HorizontalList2',
        25: this.isLogin ? 'RecentGame' : '',
        27: this.bannerName
      }
    },
    renderModules() {
      return this.modules.filter(item => this.moduleComponentEnum[item.moduleStyle])
    },
    rankListName() {
      return this.$isPadDevice ? '' : 'RankList'
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }
      if (this.$route.query.reportFrom === 'aiDialog') {
        return 11
      }

      const _GAME_CENTER_SOURCE_RECORD = Number(sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD'))
      return _GAME_CENTER_SOURCE_RECORD
    },
    version() {
      return this.$store.state.system.version
    },
    isLiteVersion() {
      return this.$store.state.system.isLiteVersion || false
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    stateInfo() {
      return this.$store.state.gameDownloadState.stateMap
    }
  },
watch: {
    userInfo: {
      handler(newValue, oldValue) {
        if (newValue?.UserID === oldValue?.UserID) return
        this.$store.dispatch('gameDownloadState/clearState')
        this.modules = []
        this.current = 1
        this.nomore = false
        this.init()
      }
    }
  },
  methods: {
    scrollHandle(e) {
      this.scrollTop = e.target.scrollTop
      this.$emit('scrollTop', e.target.scrollTop)

      if (e.target.scrollTop + e.target.offsetHeight + 500 >= e.target.scrollHeight) {
        this.init()
      }
    },
    async initWithReport() {
      this._reportLoadedDone = false
      await this.init()
      this._reporter?.reportLoaded()
    },
    async init() {
      console.log('精选页面 init，已加载模块数=', this.modules.length, 'nomore=', this.nomore, 'fetching=', this.fetching)
      if (this.nomore || this.fetching) return
      if (!this.$isPadDevice) {
        this.$store.dispatch('aiGameRecommend/initData')
      }
      this.fetching = true
      try {
        // addListener 返回 { event, id }，removeListener 需用该返回值精确删除，避免 keep-alive 下监听累积。
        if (this._doubleclickTabListener) {
          window.LegionZoneMobile?.removeListener(this._doubleclickTabListener)
        }
        this._doubleclickTabListener = window.LegionZoneMobile?.addListener('doubleclick_tab', this.scrollToTop)
        const res = await getGCHomeData({
          currentClientVersion: this.version,
          current: this.current,
          size: this.size,
          moduleType: this.isLiteVersion ? 8 : 2
        })
        if (!res || !Array.isArray(res.records)) {
          throw new Error('精选页返回数据异常，请稍后重试')
        }
        console.log('精选页面数据请求成功', JSON.stringify(res))
        console.log('精选页面 moduleStyles=', res.records.map(item => item.moduleStyle), 'rankListName=', this.rankListName, 'isLogin=', this.isLogin)
            res.records.map(item => {
              if (item.moduleStyle === 14 && item.rankingLists && item.rankingLists[0] && item.rankingLists[0].fillType === 5 && item.rankingLists[0].userReviews && item.rankingLists[0].userReviews.length) {
                item.rankingLists[0].userReviews.map(_item => {
                  if (_item.reviewsInfo) {
                    if (this.stateInfo[_item.reviewsInfo.id] && typeof this.stateInfo[_item.reviewsInfo.id].isLikes === 'boolean') {
                      _item.reviewsInfo.isLikes = this.stateInfo[_item.reviewsInfo.id].isLikes
                    } else {
                      _item.reviewsInfo.isLikes = false
                    }
                  }

                  if (_item.softInfo) {
                    if (this.stateInfo[_item.softInfo.softId] && typeof this.stateInfo[_item.softInfo.softId].isFollower === 'boolean') {
                      _item.softInfo.isFollower = this.stateInfo[_item.softInfo.softId].isFollower
                    } else {
                      _item.softInfo.isFollower = false
                    }
                  }
                  return _item
                })
              }
              return item
            })
            this.current = this.current + 1
            this.modules = this.modules.concat(res.records)
            console.log('精选页面 modules 处理数据之后', JSON.stringify(res.records), JSON.stringify(this.modules))
            console.log('精选页面 modules 赋值后 modules.length=', this.modules.length, 'renderModules.length=', this.renderModules.length, 'renderStyles=', this.renderModules.map(i => i.moduleStyle))
            this.requestTime = res.currentTime
            this.nomore = !res.hasMore
            // 防御：请求返回但所有模块都被过滤无法渲染时，停止翻页，避免滚动触发无限请求导致卡死。
            if (!this.nomore && this.modules.length > 0 && this.renderModules.length === 0) {
              this.nomore = true
            }
      } catch (res) {
        console.error('精选页面数据请求失败', res)
        this.$errorMessage(res?.message || '精选页加载失败，请稍后重试')
      } finally {
        console.log('精选页finally...')
        this.$store.dispatch('pageLoaded', false)
        this.fetching = false
      }
    },
    scrollToTop() {
      this.$refs.scroller.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },
    upDataFollower(obj) {
      this.modules.forEach(item => {
        if (item.moduleStyle === 14 && item.rankingLists && item.rankingLists[0] && item.rankingLists[0].fillType === 5 && item.rankingLists[0].userReviews && item.rankingLists[0].userReviews.length) {
          item.rankingLists[0].userReviews.forEach(_item => {
            if (_item.softInfo.softId === obj.softId) {
              _item.softInfo.isFollower = obj.isFollower
            }
          })
        }
      })
    },
    upDataLikes(obj) {
      this.modules.forEach(item => {
        if (item.moduleStyle === 14 && item.rankingLists && item.rankingLists[0] && item.rankingLists[0].fillType === 5 && item.rankingLists[0].userReviews && item.rankingLists[0].userReviews.length) {
          item.rankingLists[0].userReviews.forEach(_item => {
            if (_item.reviewsInfo.id === obj.reviewsId) {
              _item.reviewsInfo.isLikes = obj.isLikes
            }
          })
        }
      })
    }
  },
  beforeRouteEnter(to, from, next) {
    window._GAMECENTER_Home_FROM_NAME = from.name
    next()
  },
  deactivated() {
    console.log('精选页面 deactivated，当前保存的 scrollTop=', this.scrollTop)
    this.fetching = false
    if (this._doubleclickTabListener) {
      window.LegionZoneMobile?.removeListener(this._doubleclickTabListener)
      this._doubleclickTabListener = null
    }
    if (this.restoreScrollTimer) {
      cancelAnimationFrame(this.restoreScrollTimer)
      this.restoreScrollTimer = null
    }
    // 不需要重新读取 scrollTop，因为 keep-alive 会重置 DOM 的 scrollTop
    // scrollHandle 已经实时保存了正确的值
  },
  activated() {
    console.log('精选页面 activated 开始，this.scrollTop=', this.scrollTop, 'modules.length=', this.modules.length)
    this._reporter = createTabPageReporter('精选', '/gameCenter/index')
    this._reporter.reportStart()

    requestAnimationFrame(() => this._reporter.reportFirstFrame())

    this.$dataReport('LZ_gamingCenter', 'homepageShow', 'pv')

    console.log('精选页面 activated', JSON.stringify(this.$store.state.system))
    this.$emit('headerStatus', true)
    this.$emit('scrollTop', 0)
    this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkShow', 'pv', {
      from: this.firstLocal
    })

    console.log('精选页面 来源路由：', window._GAMECENTER_Home_FROM_NAME)
    if (['GameCenterDetail', 'GameCenterList', 'GameCenterActivity'].includes(window._GAMECENTER_Home_FROM_NAME) && this.modules.length) {
      console.log('精选页面 需要恢复滚动，目标位置：', this.scrollTop)
      // 缓存恢复：keep-alive 重新插入的 DOM 在 nextTick 后即已是真实尺寸，
      // 不再固定等待 300ms；只有极少数因 header 状态切换引起二次布局的情况才需要按帧重试
      this.$nextTick(() => {
        if (this.restoreScrollTimer) {
          cancelAnimationFrame(this.restoreScrollTimer)
          this.restoreScrollTimer = null
        }

        const targetScrollTop = this.scrollTop
        let attempts = 0
        const maxAttempts = 20 // 最多尝试 20 次（按帧计算，约 1/3 秒）

        const tryRestore = () => {
          const scroller = this.$refs.scroller
          if (!scroller) return

          const maxScrollTop = scroller.scrollHeight - scroller.clientHeight
          attempts++

          console.log(`精选页面 尝试恢复 ${attempts}/${maxAttempts}：`, {
            targetScrollTop,
            scrollHeight: scroller.scrollHeight,
            clientHeight: scroller.clientHeight,
            maxScrollTop
          })

          // 如果页面高度足够，或者已经尝试太多次，就恢复滚动
          if (maxScrollTop >= targetScrollTop || attempts >= maxAttempts) {
            scroller.scrollTop = targetScrollTop

            this.$nextTick(() => {
              console.log('精选页面 恢复后实际位置：', scroller.scrollTop, '目标位置：', targetScrollTop)
              if (Math.abs(scroller.scrollTop - targetScrollTop) > 10) {
                console.warn('精选页面 滚动恢复失败，内容高度不足')
              } else {
                console.log('精选页面 滚动恢复成功！')
              }
            })

            this.restoreScrollTimer = null
            this._reporter.reportLoaded()
          } else {
            // 页面高度还不够，用 requestAnimationFrame 按帧重试，比 setTimeout(100) 更快更顺滑
            this.restoreScrollTimer = requestAnimationFrame(tryRestore)
          }
        }

        // 首次立即尝试，DOM 已随 keep-alive 激活同步插入，通常一次即可命中
        tryRestore()
      })
    } else {
      console.log('精选页面 不需要恢复滚动，重新加载数据')
      // this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })
      this.scrollTop = 0
      this.modules = []
      this.current = 1
      this.nomore = false
      this.initWithReport()

      // this.$store.dispatch('aiGameRecommend/setInstalledGames', { idList: [{ SoftID: 'L116501' }, { SoftID: 'T10000' }, { SoftID: '2033' }] })
    }
  }
}
</script>
<style lang="scss" scoped>
.gamecenter-home.PadDevice {
  height: calc(100vh - 75px);
}
.gamecenter-home {
  width: 100%;
  height: 100vh;
  overflow-y: scroll;
  overflow-x:hidden;
  background-color: #000;
  padding-bottom: 40px;
  &.PcDevice {
    position: absolute;
    top: 0;
    left: 0;
  }
  &::-webkit-scrollbar {
    display: none;
  }
}

.PhoneDevice {
  .gap {
    height: 180px;
    width: 100%;
  }
}
</style>
<style lang="scss">
  .gc-title-text {
    position: relative;
  }

</style>
