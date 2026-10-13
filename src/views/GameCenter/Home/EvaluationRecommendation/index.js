import resolveAsset from '@/compat/resolveAsset'

import {
  getFollowers,
  toFollowers,
  getSoftreviewslikes
} from '@/api/gameCenter'
import {
  gameReviewslikes,
  deleteGameReviewslikes
} from '@/api/gameEvaluation'
import { getGameMsgDataReport } from '@/utils/dataReport'

import { swiper, swiperSlide } from '@/compat/swiper' // 注意小写

import 'swiper/swiper-bundle.css' // Swiper 4.x 样式路径
export default {
  name: 'EvaluationRecommendation',
  data() {
    return {
      defaultImg: new URL('../../../../images/gamecenter/hdefault.png', import.meta.url).href,
      thirdLocal: '',
      pageNo: 0,
      cWidth: 0,
      cardWidth: 0,
      itemCradWidth: 750,
      currentIndex: 0,
      locking: false,
      focusedIndex: 0,
      swiperOption: {
        spaceBetween: 20,
        breakpoints: {
          800: {
            slidesPerView: 1
          },
          1260: {
            slidesPerView: 'auto'
          },
          3000: {
            slidesPerView: 'auto'
          }
          // 2000: {
          //   slidesPerView: 3
          // }
        }
      }
    }
  },
  components: {
    swiper,
    swiperSlide
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  mounted() {
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    this.$nextTick(() => {
      this.getCWidth()
      window.addEventListener('resize', this.handleResize)
    })

    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      clearTimeout(this.timer)
      this.gameReport()
    }
    this.getFollowers()
    this.getSoftreviewslikes()
  },
  activated() {
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    this.$nextTick(() => {
      this.getCWidth()
      window.addEventListener('resize', this.handleResize)
    })

    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      clearTimeout(this.timer)
      this.gameReport()
    }
    this.getFollowers()
    this.getSoftreviewslikes()
  },
  deactivated() {
    clearTimeout(this.timer)
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    window.removeEventListener('resize', this.handleResize)
  },
  watch: {
    pageNo: {
      immediate: true,
      handler: function() {
        this.$nextTick(() => {
          this.getFollowers()
          this.getSoftreviewslikes()
        })
      }
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    window.removeEventListener('resize', this.handleResize)
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
      return 1
    },
    rankSoftList() {
      const _rankingLists = {
        fillType: -1,
        name: '',
        id: '',
        data: []
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankingLists.fillType = _data.fillType
        _rankingLists.name = _data.name
        _rankingLists.id = _data.id
      }

      if (_rankingLists.fillType === 5) {
        _rankingLists.data = _data.userReviews.filter((item, index) => index <= 7)
      }

      return _rankingLists
    },
    moduleEname() {
      return this.moduleData.moduleEname
    },
    pageStyle() {
      if (this.pageNo === 0) {
        return { transform: `translate(0, 0)` }
      } else if (this.pageNo === 1) {
        return { transform: `translate(-${this.pageNo * (this.itemCradWidth - (this.cardWidth / 2 - (this.pageNo * 20)))}px, 0px)` }
      } else if (this.pageNo === this.rankSoftList.data.length - 1) {
        return { transform: `translate(-${this.pageNo * this.itemCradWidth - (this.cardWidth - (this.pageNo * 20) - 40)}px, 0px)` }
      }

      return { transform: `translate(-${this.pageNo * this.itemCradWidth - (this.cardWidth / 2 - (this.pageNo * 20))}px, 0px)` }
    },
    softId() {
      if (!this.rankSoftList.data.length) {
        return
      }

      return this.rankSoftList.data[this.pageNo]?.softInfo?.softId
    },
    reviewsId() {
      if (!this.rankSoftList.data.length) {
        return
      }

      return this.rankSoftList.data[this.pageNo]?.reviewsInfo?.id
    },
    avatar() {
      return this.$store.state.user.avatar
    }
  },
  methods: {
    filterDuration(time) {
      if (!time) {
        return `0分钟`
      }

      const showTime = time / 60
      const hourTime = showTime >= 10 ? `${Math.round(showTime)}小时` : (showTime >= 1 ? `${showTime.toFixed(2)}小时` : `${time % 60}分钟`)
      return hourTime
    },
    // 键盘事件
    onGridKeydown(e) {
      const total = this.rankSoftList.data.length
      if (total === 0) return
      let next = this.focusedIndex
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        next = (this.focusedIndex + 1) % total
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        next = (this.focusedIndex - 1 + total) % total
      } else {
        return
      }
      this.focusedIndex = next
      this.pageNo = next
      this.$nextTick(() => {
        const items = Array.from(this.$refs.ulList?.children || [])
        if (items[next]) items[next].focus()
      })
    },
    getCWidth() {
      if (this.$refs.sliderWrapper) {
        this.cWidth = this.$refs.sliderWrapper.offsetWidth
        this.cardWidth = this.cWidth - this.itemCradWidth
      }
      this.getExtraGameStatus()
    },
    onSwiperChange() {
      this.currentIndex = this.$refs.swiper?.swiper?.realIndex || 0
    },
    handleResize() {
      this.getCWidth()
    },
    async getExtraGameStatus() {
      if (this.cWidth < 1118 || this.locking || !this.userInfo) {
        return
      }

      const secondItem = this.rankSoftList.data[1]
      const softId = secondItem?.softInfo?.softId
      if (!softId || !this.reviewsId) {
        return
      }

      this.locking = true
      this.$emit('upDataFollower', {
        softId,
        isFollower: await getFollowers({ softId })
      })

      this.$emit('upDataLikes', {
        reviewsId: this.reviewsId,
        isLikes: await getSoftreviewslikes({ softId, reviewsId: this.reviewsId })
      })
    },
    async getFollowers() {
      if (!this.userInfo || !this.softId) {
        return
      }

      const _isFollower = await getFollowers({
        softId: this.softId
      })
      this.$emit('upDataFollower', {
        softId: this.softId,
        isFollower: _isFollower
      })
    },
    async getSoftreviewslikes() {
      if (!this.userInfo || !this.softId || !this.reviewsId) {
        return
      }

      const _isLikes = await getSoftreviewslikes({
        softId: this.softId,
        reviewsId: this.reviewsId
      })
      this.$emit('upDataLikes', {
        reviewsId: this.reviewsId,
        isLikes: _isLikes
      })
    },
    toFollowers(item) {
      if (!this.userInfo) {
        this.$login()
        return
      }

      try {
        this.toFollowersReport(item)
        this.detailClickReport(item, 2)
      } catch {
        //
      }

      toFollowers(
        item.softInfo.softId,
        item.softInfo.isFollower
      ).then(res => {
        this.$emit('upDataFollower', {
          softId: item.softInfo.softId,
          isFollower: res.data
        })

        if (item.softInfo.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })

          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softInfo.softId === item.softInfo.softId) {
              o.softInfo.softDesc.followerCount++
            }

            return o
          })
        } else {
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softInfo.softId === item.softInfo.softId && o.softInfo.softDesc.followerCount > 0) {
              o.softInfo.softDesc.followerCount--
            }

            return o
          })

          this.confirmReport(2, item)
        }
      }).catch((err) => {
        if (err && typeof err.type === 'number') {
          this.confirmReport(1, item)
        }
        // nothing
      })
    },
    toZan(item) {
      if (!this.userInfo) {
        this.$login()
        return
      }

      this.detailClickReport(item, 1)
      let _userName = ''
      if (this.avatar && this.avatar.nickName) {
        _userName = this.avatar.nickName
      }

      if (item.reviewsInfo.isLikes) {
        deleteGameReviewslikes({
          softId: item.softInfo.softId,
          reviewsId: item.reviewsInfo.id,
          userName: _userName
        }, item.reviewsInfo.id).then(() => {
          this.$emit('upDataLikes', {
            reviewsId: item.reviewsInfo.id,
            isLikes: false
          })

          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.reviewsInfo.id === item.reviewsInfo.id && o.reviewsInfo.likeCount > 0) {
              o.reviewsInfo.likeCount--
            }

            return o
          })

          this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
            clickType: 11,
            nameAndId: `${item.softInfo.softName}_${item.softInfo.softId}`
          })
        })
      } else {
        gameReviewslikes({
          softId: item.softInfo.softId,
          reviewsId: item.reviewsInfo.id,
          userName: _userName
        }, item.reviewsInfo.id).then(() => {
          this.$emit('upDataLikes', {
            reviewsId: item.reviewsInfo.id,
            isLikes: true
          })

          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.reviewsInfo.id === item.reviewsInfo.id) {
              o.reviewsInfo.likeCount++
            }

            return o
          })

          this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
            clickType: 6,
            nameAndId: `${item.softInfo.softName}_${item.softInfo.softId}`
          })
        })
      }
    },
    toComment(item) {
      this.detailClickReport(item, 3)
      this.toDetail(item, true)
    },
    toDetail(item, force = false) {
      if (!item?.softInfo?.softId) {
        return
      }
      if (!force) {
        this.detailClickReport(item, 4)
      }

      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softInfo?.softId },
        query: {
          source_p: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankSoftList?.name,
          plateName: this.rankSoftList?.name,
          needScroll: true
        }
      })
    },
    prevPage() {
      if (this.pageNo - 1 < 0) {
        this.pageNo = 0
        return
      }

      this.pageNo--
    },
    nextPage() {
      if (this.pageNo + 1 >= this.rankSoftList.data.length) {
        this.pageNo = this.rankSoftList.data.length
        return
      }

      this.pageNo++
    },
    toIndicator(index) {
      this.pageNo = index
    },
    toFollowersReport(_item) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softInfo.softId === _item.softInfo.softId).softInfo.softName || ''
      }

      let _stateGame = 1
      let _statePage = 1

      if (this.rankSoftList.data.find(item => item.softInfo.softId === _item.softInfo.softId).softPurpose === 2) {
        const _downloadInfo = this.rankSoftList.data.find(item => item.softInfo.softId === _item.softInfo.softId).downloadInfo || null
        if (_downloadInfo) {
          if ([1, 2].includes(_downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
            _stateGame = 2
          } else if (_downloadInfo.bizType === 4) {
            _stateGame = 3
          }

          if ([1, 2].includes(_downloadInfo.bizType)) {
            if (_downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
              _statePage = 2
            } else if (_downloadInfo.userReservationStatus === 1) {
              _statePage = 3
            }
          } else if (_downloadInfo.bizType === 4) {
            if (_downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
              _statePage = 4
            } else {
              if (_downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                _statePage = 5
              } else if ([1].includes(_downloadInfo.userTestApplyStatus)) {
                _statePage = 6
              } else if ([2].includes(_downloadInfo.userTestApplyStatus)) {
                _statePage = 1
              }
            }
          }
        }
      } else {
        _stateGame = 4
        _statePage = 7
      }

      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        details: JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: this.moduleData.rankingLists[0].name,
          skuName: _skuName,
          softID: _item.softInfo.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.rankSoftList.data[this.pageNo].softInfo.isFollower ? 2 : 1
        })
      })
    },
    confirmReport(confirmType, _item) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softInfo.softId === _item.softInfo.softId).softInfo.softName || ''
      }

      let _clickType = confirmType
      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (confirmType === 2 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 3
      } else if (confirmType === 1 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 4
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupClick', 'click', {
        detail: JSON.stringify({
          skuName: _skuName,
          softID: _item.softInfo.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    gameReport() {
      let _userReviews = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 5) {
        _moduleName = this.moduleData.rankingLists[0].name

        if (this.moduleData.rankingLists[0].userReviews.length) {
          _userReviews = this.moduleData.rankingLists[0].userReviews.map(o => {
            const report = getGameMsgDataReport(o)
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
        }
      }

      const _cdk = _userReviews.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
      const _download = _userReviews.filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

      if (_cdk) {
        this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
          details: JSON.stringify({
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            plateName: _moduleName,
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
            plateName: _moduleName,
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        })
      }
    },
    detailClickReport(_item, clickType) {
      let _stateGame = 1
      let _statePage = 1
      let _gameClass = 1

      const { softPurpose } = _item.softInfo
      if (softPurpose === 1) {
        _stateGame = 4
        _gameClass = 4
        _statePage = 8
      }

      if (softPurpose === 3) {
        _gameClass = 3
      }

      if (_item.softInfo.downloadInfo && typeof _item.softInfo.downloadInfo.bizType === 'number') {
        const {
          softInfo: {
            downloadInfo:
            {
              bizType,
              userReservationStatus,
              testActivityStatus,
              userTestApplyStatus
            }
          }
        } = _item
        if ([1, 2].includes(bizType)) {
          _stateGame = 2
          if (userReservationStatus === 0) {
            _statePage = 2
          } else {
            _statePage = 3
          }
        } else if (bizType === 4) {
          _stateGame = 3
          if (testActivityStatus === 1) {
            _statePage = {
              0: 5,
              1: 6
            }[userTestApplyStatus]
          } else {
            _statePage = 4
          }
        }
      }

      const { firstClassId } = _item.softInfo
      if (Number(firstClassId) === 2001) {
        _gameClass = 2
      }

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCurationAmwayWallClick', 'click', {
        detail: JSON.stringify({
          skuName: _item.softInfo.softName,
          softID: _item.softInfo.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          gameClass: _gameClass,
          clickType: clickType
        })
      })
    }
  }
}
