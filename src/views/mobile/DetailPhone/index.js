import resolveAsset from '@/compat/resolveAsset'
// phone 单独组件
import MediaRating from '@/views/mobile/DetailPhone/components/MediaRating'
import MediaStage from '@/views/mobile/DetailPhone/components/MediaStagePhone'
import EvaluatioinDialog from '@/views/mobile/components/EvaluatioinDialog/index.vue'
// pad 共用组件
import VerticalGameListPad from '@/views/GameCenter/CDKMall/Detail/verticalGameList/verticalGameListPad'
import GameDownloadButton from '@/components/GameDownloadButton'
import RichTextViewer from '@/views/GameCenter/CDKMall/Detail/RichTextViewer'
import ActivityNotice from '@/views/GameCenter/CDKMall/Detail/activityNotice'
import VideoList from '@/views/GameCenter/CDKMall/Detail/videoList'
import VerticalGameList from '@/views/GameCenter/CDKMall/Detail/verticalGameList'
import { getCDKDetail } from '@/api/cdkMall'
import { getUserSoftReviews } from '@/api/gameEvaluation'
import LegionEvaluation from '@/views/GameCenter/CDKMall/Detail/LegionEvaluation'
// import EvaluatioinDialog from '@/views/GameCenter/CDKMall/Detail/EvaluatioinDialog.vue'
import AIEvaluation from '@/views/GameCenter/CDKMall/Detail/AIEvaluation'
import {
  getFollowers,
  toFollowers
} from '@/api/gameCenter'

export default {
  name: 'Detail',
  components: {
    GameDownloadButton,
    MediaStage,
    RichTextViewer,
    LegionEvaluation,
    EvaluatioinDialog,
    AIEvaluation,
    ActivityNotice,
    VideoList,
    VerticalGameList,
    VerticalGameListPad,
    MediaRating
  },
  filters: {
    // timeLeft(value, currentTime) {
    //   let result = ''
    //   let diffTime = value - currentTime

    //   const ONE_DAY = 24 * 60 * 60 * 1000
    //   if (diffTime > ONE_DAY) {
    //     result += Math.floor(diffTime / ONE_DAY) + '天 '
    //     diffTime = diffTime % ONE_DAY
    //   }

    //   const ONE_HOUR = 60 * 60 * 1000
    //   if (diffTime > ONE_HOUR) {
    //     result += String(Math.floor(diffTime / ONE_HOUR)).padStart(2, 0) + ':'
    //     diffTime = diffTime % ONE_HOUR
    //   } else {
    //     result += '00:'
    //   }

    //   const ONE_MINUTE = 60 * 1000
    //   if (diffTime > ONE_MINUTE) {
    //     result += String(Math.floor(diffTime / ONE_MINUTE)).padStart(2, 0) + ':'
    //     diffTime = diffTime % ONE_MINUTE
    //   } else {
    //     result += '00:'
    //   }

    //   const ONE_SECOND = 1000
    //   if (diffTime > ONE_SECOND) {
    //     result += String(Math.floor(diffTime / ONE_SECOND)).padStart(2, 0)
    //     diffTime = diffTime % ONE_SECOND
    //   } else {
    //     result += '00'
    //   }

    //   return result
    // }
  },
  data() {
    const image = resolveAsset('images/gamecenter/award-image.png')
    return {
      scoreDefaultBac: resolveAsset('images/gamecenter/detail/score-bac-default.png'),
      showEvaDialog: false,
      recommendType: null,
      image,
      fromRouterName: null,
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      ready: false,
      detail: {
        relateActivitys: [],
        softDesc: {
          mediaList: []
        },
        showInfo: {
          mediaScores: [],
          awardInfos: []
        },
        downloadInfo: {}
      },
      mediaIndex: 0,
      detailInfoExpandStatus: 0,
      whatsNewExpandStatus: 0,
      scrollTop: 0,
      // serverCurrentTime: Date.now(),
      plateName: this.$route.query.plateName || '',
      reportPlateName: this.$route.query.reportPlateName || '',
      scale: '1.00',
      canWriteReview: false,
      userReviewInfo: null,
      detailBanner: null,
      isFollower: false,
      clientWidth: false,
      followersLocking: false,
      showPrevButton: false,
      showNextButton: false,
      stateGame: 0,
      statePage: 0,
      gameClass: 0

    }
  },
  computed: {
    stateInfo() {
      return this.$store.state.gameDownloadState.stateMap[this.detail.softId] || {}
    },
    calcTime() {
      return (time) => {
        const showTime = time / 60
        return showTime >= 1 ? `${showTime.toFixed(2)}小时` : `${time % 60}分钟`
      }
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      if (this.$route.query.isTray === 1) {
        return 6
      }
      if (this.$route.query.reportFrom === 'aiDialog') {
        return 11
      }
      const mark = sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD')
      if (mark) {
        return Number(mark)
      }

      return this.$route.query.firstLocal
    },
    secondLocal() {
      return this.$route.query.secondLocal || ''
    },
    thirdLocal() {
      return this.$route.query.thirdLocal || ''
    },
    bgImage() {
      if (!this.detail) return null

      const firstImage = this.detail.softDesc.mediaList.find(o => o.type === 'image')

      if (!firstImage) return null

      return firstImage.url
    },
    backTitle() {
      if (this.fromRouterName === 'CDKMallIndex') {
        return '游戏中心'
      }

      if (this.fromRouterName === 'GameCenterList' && this.plateName) {
        return this.plateName
      }

      return '返回'
    },
    isDLC() {
      if (!this.detail) return false

      return /^DLC$/i.test(this.detail.productInfo.gamePkgType)
    },
    currentMedia() {
      if (this.detail.softDesc.mediaList.length <= 0) return null

      return this.detail.softDesc.mediaList[this.mediaIndex]
    },
    drinfo() {
      const mobileAgent = this.$route.query?.reportFrom === 'aiChat' || ''
      const params = {
        source_pp: this.$route.query.source_pp || '',
        source_p: '',
        source: this.$route.query.source_p || 'PAD1',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: mobileAgent ? 2 : 1,
        plateName: this.reportPlateName || '',
        skuName: this.detail.softName || '',
        softID: this.detail.softId || '',
        lenovoid: this.userInfo?.UserID || '',
        aiStrategy: this.$route.query.aiStrategy || ''
      }

      let _gameClass = 1 // 1游戏，2工具
      if (this.detail?.softPurpose === 3) {
        _gameClass = 3
      }

      if (Number(this.detail.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
        _gameClass = 2
      }

      params.gameClass = _gameClass

      return JSON.stringify(params)
    },
    gameCenterDetailGuide() {
      return this.$store.state.gameCenter.gameCenterDetailGuide
    },
    showTips() {
      return this.gameCenterDetailGuide && !this.isFollower
    },
    rankingItem() {
      if (!this.detail || !this.detail?.showInfo?.rankingLabelInfos?.length) {
        return null
      }

      const _rankingItem = this.detail.showInfo.rankingLabelInfos.sort((a, b) => a.num - b.num)
      return _rankingItem[0]
    },
    fixedNum() {
      if (this.detail.expectations) {
        return parseFloat(this.detail.expectations).toFixed(1)
      }
      return '0.0'
    }
  },
  watch: {
    userInfo: {
      deep: true,
      handler(newValue, oldValue) {
        if (newValue?.UserID === oldValue?.UserID) return
        this.refreshPage(true, 'userChange')
        if (window?._GAMECENTER_RESTORE['Magazine']) {
          delete window._GAMECENTER_RESTORE['Magazine']
        }
      }
    },
    '$route.params.id': {
      handler: function() {
        document.querySelector('.fh-pay-close')?.click()
        this.refreshPage(true)
      }
    }
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  created() {
    const GameCenterDetailGuide = localStorage.getItem('GAME_CENTER_DETAIL_TIPS_GUIDE') !== '1'
    this.$store.dispatch('gameCenter/setGameCenterDetailGuide', GameCenterDetailGuide)
    this.$emit('headerStatus', false)
    this.getCdkDetail()
    this.getUserReviews()
    console.log('window》innerWidth', window.innerWidth)
  },
  beforeUnmount() {
    clearTimeout(this.countDownTimer)
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  methods: {
    getDownloadText(detail) {
      if (this.$isPadDevice) {
        let txt = ''
        const num = (detail.softDesc?.apkSize / 1024 / 1024 / 1024).toFixed(1)
        if (num > 1) {
          txt = num + 'GB'
        } else {
          txt = (detail.softDesc?.apkSize / 1024 / 1024).toFixed(1) + 'MB'
        }
        return '立即安装 ' + txt
      }
      return '立即安装'
    },
    clickPrev() {
      if (this.mediaIndex <= 0) return

      this.mediaIndex--
    },
    clickNext() {
      if (this.mediaIndex >= this.detail.softDesc.mediaList.length - 1) return

      this.mediaIndex++
    },
    toQuestionUrl(url) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailQuestionnaireClick', 'click', {
        nameAndId: this.detail.softName + '_' + this.detail.softId
      })
      window.open(url, '_blank')
    },
    refreshPage(clearState = false, type) {
      this.getCdkDetail(clearState)
      this.getUserReviews(type)
      this.$nextTick(() => {
        this.$refs.legionEvaluation?.refreshPage()
      })
    },
    getUserReviews(type) {
      getUserSoftReviews({ softId: this.$route.params.id }).then(data => {
        this.canWriteReview = data.enableReviews &&
                              (data.userGameDuration >= data.limitGameDuration) &&
                              !data.userSoftReviews
        this.userReviewInfo = data
        if (this.canWriteReview && type !== 'userChange' && this.userReviewInfo?.userGameDuration) {
          this.$nextTick(() => {
            // 发布评测指引曝光
            this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailPublishAssessGuideShow', 'pv', {
              nameAndId: `${this.detail?.softName || ''}_${this.$route.params.id}_${this.stateGame}_${this.statePage}_${this.gameClass}`
            })
          })
        }
      }).catch(() => {
        this.userReviewInfo = {}
      })
    },
    showFengeLine(index) {
      const awardList = this.detail.showInfo.awardInfos
      if (!awardList[index + 1] || awardList[index].type === awardList[index + 1].type) {
        return false
      }
      return true
    },
    clickGameLibrary(item) {
      sessionStorage.setItem('clearStorageLibrary', true)

      this.$router.push({
        name: 'GameLibrary',
        query: {
          source_p: 'PAD1',
          label: item,
          sourceIsDetailFirstLocal: this.firstLocal,
          sourceIsDetailThirdLocal: this.thirdLocal
        }
      })
    },
    back() {
      sessionStorage.removeItem('clearStorageLibrary')
      sessionStorage.setItem('SAVE_GAME_CALENDAR_LOCATION', true)
      if (this.$route?.query?.reportFrom === 'push' && this.$isPadDevice) {
        this.$parentRouter.push('/gameCenter/index')
        return
      }
      if (this.fromRouterName || window.history.length > 1) {
        this.$router.back()
        return
      }

      this.$router.push({ name: 'GameCenterHome',
        query: {
          source_p: 'PAD1'
        }
      })
    },
    getCdkDetail(clearState) {
      this.$store.dispatch('pageLoaded', { status: true, alpha: 1 })
      getCDKDetail(this.$route.params.id).then(res => {
        if (!res) return
        this.detail = res

        this.serverStartTime = res.currentTime
        this.clientStartTime = Date.now()
        //  this.countDown()

        setTimeout(() => {
          if (this.$refs.detailInfo && this.$refs.detailInfo.offsetHeight > 315) {
            this.detailInfoExpandStatus = 1

            if (!this.$refs?.goodvideos?.list?.length && !this.$refs.legionEvaluation) {
              this.detailInfoExpandStatus = 2
            }
          }

          if (this.$refs.whatsNew && this.$refs.whatsNew.offsetHeight >= 90) {
            this.whatsNewExpandStatus = 1
          }

          // if (this.$refs.stage) {
          //   this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
          //   this.resizeObserver.observe(this.$refs.stage)
          // }
          if (clearState) {
            this.$store.dispatch('gameDownloadState/setState', {
              [this.detail.softId]: {
                softID: this.detail.softId,
                softName: this.detail.softName,
                bizType: this.detail.downloadInfo.bizType,
                userReservationStatus: this.detail.downloadInfo.userReservationStatus,
                userTestApplyStatus: this.detail.downloadInfo.userTestApplyStatus,
                testActivityStatus: this.detail.downloadInfo.testActivityStatus,
                testActivityQuestionUrl: this.detail.downloadInfo.testActivityQuestionUrl,
                ...this.$store.state.gameDownloadState.stateMap[this.detail.softId]
              }
            })
          }
          const contentW = this.$refs.contentDom?.clientWidth || 0
          const wrapW = this.$refs.mediasDom?.clientWidth || 0
          this.showNextButton = (contentW > wrapW) && this.detail.softDesc.mediaList.length > 5
        }, 300)
        this.detailReport()
      }).catch(() => {
        this.$message({
          message: '出错了，请稍后重试',
          type: 'error',
          duration: 2500,
          customClass: 'lg-message--error'
        })
      }).finally(() => {
        this.$nextTick(() => {
          this.getFollowers()
        })
        this.ready = true
        this.$store.dispatch('pageLoaded', false)
        this.checkAutoClick()
        this.checkAutoNext()
      })
    },
    checkAutoClick() {
      // 支持运营位跳到详情页时的自动操作
      if (this.$route.query?.actionName === 'autoClick') {
        if (this.$refs.ShowPay) {
          this.showPay()
          return
        }

        const _stateMap = this.$store.state.softwareState.stateMap[this.detail.softId] || {}
        if (_stateMap.status || [1, 2, 4].includes(this.detail?.downloadInfo?.bizType)) {
          this.$refs.GameDownloadButton?.$el?.querySelector('.autoClick')?.click()
          return
        }

        setTimeout(() => {
          this.$refs.GameDownloadButton?.$el?.querySelector('.autoClick')?.click()
        }, 300)
      }
    },
    checkAutoNext() {
      // 支持自动安装/开启 来源于客户端的静默下载完成弹窗
      if (this.$route.query?.actionName === 'autoNext') {
        setTimeout(() => {
          this.$refs.GameDownloadButton?.$el?.querySelector('.autoNext')?.click()
        }, 300)
      }
    },
    // countDown() {
    //   if (!this.detail || !this.detail.currentTimeActivity) return

    //   this.serverCurrentTime = this.serverStartTime + Date.now() - this.clientStartTime

    //   const { endTime, startTime } = this.detail.currentTimeActivity
    //   if (this.serverCurrentTime >= startTime && this.serverCurrentTime < endTime) {
    //     clearTimeout(this.countDownTimer)
    //     this.countDownTimer = setTimeout(this.countDown, 1000)
    //   } else {
    //     this.detail.currentTimeActivity = null
    //     this.detail.showInfo.ruleLabelName = ''
    //   }
    // },
    toTop() {
      if (!this.$refs.scrollDom) return

      this.$refs.scrollDom.scrollTop = 0
    },
    showPay() {
      if (!this.userInfo) {
        this.$login()
        return
      }

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 1,
          plateName: this.reportPlateName || '',
          skuName: this.detail.softName || '',
          softID: this.detail.softId || '',
          gameVersion: this.detail.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal || 0}_${this.secondLocal || 0}_${this.thirdLocal || 0}_1`,
        type: 0,
        skuId: this.detail.skuId,
        price: this.detail.productInfo.currentPrice,
        plateName: this.reportPlateName,
        gameVersion: this.detail.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 1,
        skuName: this.detail.softName || '',
        softID: this.detail.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    scrollHandle(e) {
      this.scrollTop = e.target.scrollTop

      if (e.target.scrollTop + e.target.offsetHeight + 300 >= e.target.scrollHeight) {
        this.$refs.legionEvaluation?.getMoreEvaluation()
      }
    },
    mediaPlay() {
      this.mediaPlaying = true
      this.$mediaPlay(
        this.detail.softDesc.mediaList,
        this.mediaIndex,
        () => {
          this.mediaPlaying = false
        }
      )
    },
    setMediaIndex(mediaIndex) {
      this.mediaIndex = mediaIndex
      this.mediaPlay()
    },
    resizeObserverHandle(entries) {
      if (!entries || entries.length <= 0 || entries[0].borderBoxSize.length <= 0) return

      const inlineSize = entries[0].borderBoxSize[0].inlineSize
      const blockSize = entries[0].borderBoxSize[0].blockSize
      this.clientWidth = entries[0].borderBoxSize[0].inlineSize > 710
      this.scale = Number(Math.min(1.25, inlineSize / 612, blockSize / 344)).toFixed(2)
    },
    hideTipsGuide() {
      this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
    },
    async getFollowers() {
      if (!this.userInfo) {
        return
      }

      const _id = this.$route.params.id
      this.isFollower = await getFollowers({
        softId: _id
      })
    },
    toFollowers() {
      if (this.followersLocking) {
        this.$message({
          message: '点击太快了,请稍后！',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })
        return
      }

      this.followersLocking = true

      this.$store.dispatch('gameCenter/setGameCenterDetailGuide', false)
      if (!this.userInfo) {
        this.$login()
        this.followersLocking = false
        return
      }
      this.toFollowersReport()

      toFollowers(this.detail.softId, this.isFollower).then(res => {
        this.isFollower = res.data
        if (this.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })

          this.detail.softDesc.followerCount++

          if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
            const _GameCenterConcern = JSON.parse(window._GAMECENTER_RESTORE['GameCenterConcern'])
            if (_GameCenterConcern.concernList.length && _GameCenterConcern.concernList.some(o => o.softId === this.detail.softId)) {
              _GameCenterConcern.concernList.map(o => {
                if (o.softId === this.detail.softId) {
                  if (o.unFollowMark && o.unFollowMark === true) {
                    delete o.unFollowMark
                  }
                }
                return o
              })

              _GameCenterConcern.concernListLength++
              window._GAMECENTER_RESTORE['GameCenterConcern'] = JSON.stringify(_GameCenterConcern)
            }
          }

          if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
            const _GameCenterReducedPrice = JSON.parse(window._GAMECENTER_RESTORE['GameCenterReducedPrice'])
            if (_GameCenterReducedPrice.reducedPriceList.length && _GameCenterReducedPrice.reducedPriceList.some(o => o.softId === this.detail.softId)) {
              _GameCenterReducedPrice.reducedPriceList.map(o => {
                if (o.softId === this.detail.softId) {
                  if (o.unFollowMark && o.unFollowMark === true) {
                    delete o.unFollowMark
                  }
                }
                return o
              })

              _GameCenterReducedPrice.reducedPriceListLength++
              window._GAMECENTER_RESTORE['GameCenterReducedPrice'] = JSON.stringify(_GameCenterReducedPrice)
            }
          }

          if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['List']) {
            const _List = JSON.parse(window._GAMECENTER_RESTORE['List'])
            if (_List.cdkList.length && _List.cdkList.some(o => o.softId === this.detail.softId)) {
              _List.cdkList.map(o => {
                if (o.softId === this.detail.softId) {
                  o.softDesc.followerCount++
                }
                return o
              })

              window._GAMECENTER_RESTORE['List'] = JSON.stringify(_List)
            }
          }
        } else {
          if (this.detail.softDesc.followerCount > 0) {
            this.detail.softDesc.followerCount--

            if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterConcern']) {
              const _GameCenterConcern = JSON.parse(window._GAMECENTER_RESTORE['GameCenterConcern'])
              if (_GameCenterConcern.concernList.length && _GameCenterConcern.concernList.some(o => o.softId === this.detail.softId)) {
                _GameCenterConcern.concernList = _GameCenterConcern.concernList.map(o => {
                  if (o.softId === this.detail.softId && !o.unFollowMark) {
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

            if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['GameCenterReducedPrice']) {
              const _GameCenterReducedPrice = JSON.parse(window._GAMECENTER_RESTORE['GameCenterReducedPrice'])
              if (_GameCenterReducedPrice.reducedPriceList.length && _GameCenterReducedPrice.reducedPriceList.some(o => o.softId === this.detail.softId)) {
                _GameCenterReducedPrice.reducedPriceList = _GameCenterReducedPrice.reducedPriceList.map(o => {
                  if (o.softId === this.detail.softId && !o.unFollowMark) {
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

            if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['List']) {
              const _List = JSON.parse(window._GAMECENTER_RESTORE['List'])
              if (_List.cdkList.length && _List.cdkList.some(o => o.softId === this.detail.softId)) {
                _List.cdkList.map(o => {
                  if (o.softId === this.detail.softId) {
                    o.softDesc.followerCount--
                  }
                  return o
                })

                window._GAMECENTER_RESTORE['List'] = JSON.stringify(_List)
              }
            }
          }

          this.confirmReport(2)
        }
      }).catch((err) => {
        if (err && typeof err.type === 'number') {
          this.confirmReport(1)
        }
      }).finally(() => {
        this.followersLocking = false
      })
    },
    toFollowersReport() {
      let _stateGame = 1
      let _statePage = 1

      if ([2, 3].includes(this.detail.softPurpose)) {
        _stateGame = 1
        if ([1, 2].includes(this.detail.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
          _stateGame = 2
        } else if (this.detail.downloadInfo.bizType === 4) {
          _stateGame = 3
        }

        _statePage = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
        if ([1, 2].includes(this.detail.downloadInfo.bizType)) {
          if (this.detail.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
            _statePage = 2
          } else if (this.detail.downloadInfo.userReservationStatus === 1) {
            _statePage = 3
          }
        } else if (this.detail.downloadInfo.bizType === 4) {
          if (this.detail.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
            _statePage = 4
          } else {
            if (this.detail.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
              _statePage = 5
            } else if ([1].includes(this.detail.downloadInfo.userTestApplyStatus)) {
              _statePage = 6
            } else if ([2].includes(this.detail.downloadInfo.userTestApplyStatus)) {
              _statePage = 1
            }
          }
        }
      } else {
        _stateGame = 4
        _statePage = 7
      }

      const params = {
        source_p: this.$route.query.source_p || '',
        source: 'PAD1',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 1,
        plateName: this.reportPlateName,
        skuName: this.detail.softName,
        softID: this.detail.softId,
        lenovoid: this.userInfo ? this.userInfo.UserID : '',
        stateGame: _stateGame,
        statePage: _statePage,
        clicktype: this.isFollower ? 2 : 1,
        aiStrategy: this.$route.query.aiStrategy || ''
      }

      let _firstClassId = 1// 1:游戏，2：工具
      if (this.detail.softPurpose === 3) {
        _firstClassId = 3
      }
      if (Number(this.detail.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
        _firstClassId = 2
      }

      if (_firstClassId === 2 || _firstClassId === 3) {
        params.gameClass = _firstClassId
      }

      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        details: JSON.stringify(params)
      })
    },
    confirmReport(confirmType) {
      let _clickType = confirmType
      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (confirmType === 2 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 3
      } else if (confirmType === 1 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 4
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupClick', 'click', {
        detail: JSON.stringify({
          skuName: this.detail.softName,
          softID: this.detail.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    detailReport() {
      if (this.detail.softPurpose === 1) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailShow', 'pv', {
          detail: JSON.stringify({
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            plateName: this.reportPlateName,
            skuName: this.detail.softName,
            softID: this.detail.softId,
            gameVersion: this.detail.productInfo.gamePkgType || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }

      if ([2, 3].includes(this.detail.softPurpose)) {
        let _bizType = 1
        if ([1, 2].includes(this.detail.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
          _bizType = 2
        } else if (this.detail.downloadInfo.bizType === 4) {
          _bizType = 3
        } else if (this.detail.softPurpose === 3) {
          _bizType = 4
        }

        let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
        if ([1, 2].includes(this.detail.downloadInfo.bizType)) {
          if (this.detail.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
            buttonType = 2
          } else if (this.detail.downloadInfo.userReservationStatus === 1) {
            buttonType = 3
          }
        } else if (this.detail.downloadInfo.bizType === 4) {
          if (this.detail.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
            buttonType = 4
          } else {
            if (this.detail.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
              buttonType = 5
            } else if ([1].includes(this.detail.downloadInfo.userTestApplyStatus)) {
              buttonType = 6
            } else if ([2].includes(this.detail.downloadInfo.userTestApplyStatus)) {
              buttonType = 1
            }
          }
        } else if (this.detail.softPurpose === 3 && !this.detail.productInfo.userPurchasedStatus) {
          if (this.detail.productInfo?.currentPrice === 0) {
            buttonType = 9
          } else if (this.detail.productInfo?.currentPrice > 0) {
            buttonType = 8
          }
        }

        const params = {
          source_pp: this.$route.query.source_pp || '',
          source_p: this.$route.query.source_p || '',
          source: 'PAD1',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          plateName: this.reportPlateName,
          skuName: this.detail.softName,
          softID: this.detail.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _bizType,
          statePage: buttonType,
          aiStrategy: this.$route.query.aiStrategy || ''
        }

        let _firstClassId = 1// 1:游戏，2：工具
        if (this.detail.softPurpose === 3) {
          _firstClassId = 3
        }
        if (Number(this.detail.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          _firstClassId = 2
        }

        params.gameClass = _firstClassId

        this.stateGame = params.stateGame
        this.statePage = params.statePage
        this.gameClass = _firstClassId

        console.log('param233333s', params)

        this.$dataReport('LZ_gamingCenter', 'LZ_storeLoadGameDetailShow', 'pv', {
          detail: JSON.stringify(params)
        })
      }
    },
    clickRecommend(val) {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.recommendType = val
      this.showEvaDialog = true
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailPublishAssessGuideClick', 'click', {
        nameAndId: `${this.detail.softName}_${this.detail.softId}_${this.stateGame}_${this.statePage}_${this.gameClass}`
      })
    },
    jumpActive(jumpUrl) {
      this.$router.push({
        path: `/gameCenter/online/index`,
        query: {
          ...this.$route.query,
          source_p: 'PAD1',
          id: jumpUrl
        }
      })
    },
    scrollToComment() {
      const scrollTop = this.$refs.legionEvaluation?.$el?.getBoundingClientRect()?.top
      const currentScrollTop = this.$refs.scrollDom.scrollTop

      if (scrollTop) {
        this.$refs.scrollDom.scrollTop = scrollTop + currentScrollTop
      }
    }
  }
}
