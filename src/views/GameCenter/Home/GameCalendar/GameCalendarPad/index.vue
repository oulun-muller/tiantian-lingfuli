<template>
<div
  class="GameCalendar"
  v-if="rankSoftList.data.length">
  <h3 class="title-wrap">
    <span class="title-bac gc-text-stroke-around">{{ moduleEname }}</span>
    <span v-if="!$isPadDevice"  class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ rankSoftList.name }}&nbsp;<i class="gc-title-quote-icon"></i></span>
    <span v-else  class="gc-title-text">{{ rankSoftList.name }}</span>
  </h3>
  <div :class="{
      'list-wrapper':true,
      'left-mask':showPrevPageButton,
      'right-mask':showNextPageButton}"
    ref="list-wrapper">
    <ul
    ref="ul-wrapper"
    :class="{'ulActive':ulActive}"
    :style="{
      '--uWidth': uWidth,
      transform: `translateX(${transX}px)`
    }">
    <li
      v-for="(item, index) of rankSoftList.data"
      :key="item.id"
      @click="toDetail(item.softInfo)"
      :class="{ 'isHover': index === curBigCrad2 }"
      :style="{
        width: `${item._width}px`
      }"
      @mouseenter="!$isPadDevice && curBigCradIn(index)"
      @mouseleave="!$isPadDevice && curBigCradOut()">
      <section class="bigCard" v-if="index===curBigCrad2">
        <div class="date" >
          <span>{{ filterEventDate(item) }}</span>
          <i></i>
        </div>
        <b :style="{ backgroundImage: `url('${ item.himg || defaultImg }')` }">
        <sub class="horn-right"></sub>
        <sub class="horn-left"></sub>
        <sub class="bor-top"></sub>
        <sub class="bor-right"></sub>
        <sub class="bor-bottom"></sub>
        <sub class="bor-left"></sub>
        <sub class="bor-dot0"></sub>
        <sub class="bor-dot1"></sub>
        <sub class="bor-dot2"></sub>
        <img
          v-if="!item.himg && item.softInfo.showInfo.logoFile"
          :src="item.softInfo.showInfo.logoFile" alt="">
        <div
          :class="{
            'hover_content':true
          }">
          <div class="tagType">
            <span v-if="item.softInfo.downloadInfo.tagUrls.length">
              <img
                :src="item.softInfo.downloadInfo.tagUrls[0]"
                alt="">
            </span>
            <template v-if="item.softInfo.showInfo.mediaScores.length">
              <p
                v-for="(scoresItem, scoresIndex) of item.softInfo.showInfo.mediaScores.slice(0,2)"
                :key="scoresIndex">
                <i>{{ scoresItem.score }}</i>{{ scoresItem.mediaName }}
              </p>
            </template>
          </div>
          <ol>
            <template v-if="item.softInfo.showInfo.softLabels.length">
              <li
                v-for="(tagItem, tagIndex) of item.softInfo.showInfo.softLabels.slice(0, 4)"
                :key="tagIndex">{{ tagItem }}</li>
            </template>
          </ol>
          <p v-if="item.softInfo.softDesc.introduction">{{ item.softInfo.softDesc.introduction }}</p>
        </div>
        <div
          class="concern"
          @click.stop="toFollowers"
          v-if="getShowFollowers(item)" >
          <img v-if="isFollower" src="../image/concern-active.png" alt="">
          <img v-else src="../image/concern-normal.png" alt="">
          <p>{{ item.softInfo.softDesc.followerCount }}</p>
        </div>
        </b>
        <div class="bottom_big">
          <div class="left">
            <h1>{{ item.softInfo.softName }}</h1>
            <p class="download">{{ filterDescriptiveInformation(item) }}</p>
          </div>
          <div class="right">
            <GameDownloadButton
              class="downloadButton"
              buttonStyle="abnormal"
              :downloadInfo="item.softInfo.downloadInfo"
              :soft-desc="item.softInfo.softDesc"
              :soft-id="item.softInfo.softId"
              :soft-purpose="item.softInfo.softPurpose"
              :product-info="item.softInfo.productInfo"
              :user-purchased-status="item.softInfo.productInfo.userPurchasedStatus"
              :version="item.softInfo.softDesc.version"
              :soft-name="item.softInfo.softName"
              :logo-file="item.softInfo.showInfo.logoFile"
              :fast-install="item.softInfo.showInfo.isFastInstall"
              :drinfo="drinfo(item.softInfo)"
              :hideEventDate="item.hideEventDate===1" />
          </div>
        </div>
      </section>
      <section class="smallCard" v-else>
        <div class="date">
          <span>{{ filterEventDate(item) }}</span>
          <i></i>
        </div>
        <!-- himg:横图，vimg:竖图 -->
        <b :style="{ backgroundImage: `url('${ item.vimg || defaultImg }')` }">
          <sub class="horn-right"></sub>
          <sub class="horn-left"></sub>
          <sub class="bor-top"></sub>
          <sub class="bor-right"></sub>
          <sub class="bor-bottom"></sub>
          <sub class="bor-left"></sub>
          <sub class="bor-dot0"></sub>
          <img
            v-if="!item.vimg && item.softInfo.showInfo.logoFile"
            :src="item.softInfo.showInfo.logoFile" alt="">
          <footer
            :class="{'is-online':item.eventType===0 ||
            ([1, 2].includes(item.eventType) && item.eventStatus === 2)}">{{ filterEventType(item) }}</footer>
        </b>
        <div class="bottom_small">
          <h1>{{ item.softInfo.softName }}</h1>
          <p class="download">{{ filterDescriptiveInformation(item) }}</p>
        </div>
      </section>
    </li>
    </ul>
    <button v-if="showPrevPageButton && !$isPadDevice" class="prev" @click="prevPage"></button>
    <button v-if="showNextPageButton && !$isPadDevice" class="next" @click="nextPage"></button>
  </div>
  <div
    class="bar"
    v-if="((cWidth<1400 && rankSoftList.data.length>5) || (cWidth>1400 && rankSoftList.data.length>6))">
    <span class="left"></span>
    <Slider
      class="slider"
      v-model="progress"
      @input="onInput" />
    <span class="right"></span>
  </div>
</div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'
import GameDownloadButton from '@/components/GameDownloadButton/index.vue'
import Slider from '../Slider/index.vue'
import {
  getFollowers,
  toFollowers
} from '@/api/gameCenter'
export default {
  name: 'GameCalendar',
  components: {
    GameDownloadButton,
    Slider
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png'),
      thirdLocal: '',
      curBigCrad2: -1,
      curBigCrad3: -1,
      cWidth: 900,
      progress: 0,
      x: 0,
      ulActive: true,
      marginRight: 22,
      isFollower: false
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
    const listWrapperRef = this.$refs['list-wrapper']
    const listWrapperEl = listWrapperRef?.$el || listWrapperRef
    if (listWrapperEl && listWrapperEl.nodeType === 1) {
      this.resizeObserver.observe(listWrapperEl)
    }
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      this.gameReport()
    }
  },
  activated() {
    this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
    const listWrapperRef2 = this.$refs['list-wrapper']
    const listWrapperEl2 = listWrapperRef2?.$el || listWrapperRef2
    if (listWrapperEl2 && listWrapperEl2.nodeType === 1) {
      this.resizeObserver.observe(listWrapperEl2)
    }
    const isFirstIn2 = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn2) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      this.gameReport()
    }
  },
  deactivated() {
    clearTimeout(this.timer)
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    window.onresize = null
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    window.onresize = null
    this.resizeObserver && this.resizeObserver.disconnect()
  },
  watch: {
    curBigCrad2: {
      handler: function(value) {
        this.$nextTick(async() => {
          if (value !== -1) {
            this.isFollower = false
            if (!this.userInfo) {
              return
            }
            this.isFollower = await getFollowers({
              softId: this.softId
            })
          }
        })
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
      return 1
    },
    moduleEname() {
      return this.moduleData.moduleEname
    },
    rankSoftList() {
      const _rankSoftList = {
        fillType: -1,
        name: '',
        id: '',
        data: []
      }
      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null
      if (_data) {
        _rankSoftList.fillType = _data.fillType
        _rankSoftList.name = _data.name
        _rankSoftList.id = _data.id
      }
      if (_rankSoftList.fillType === 4) {
        _rankSoftList.data = _data.rankingListSoftCalendars.map((item, index) => {
          let col = 5
          if (this.cWidth > 1400) {
            col = 6
          }
          if (this.$isPadDevice) {
            const _width = Math.floor((this.cWidth) / col)
            item._width = _width * 2.242
          } else {
            const _width = Math.floor((this.cWidth + 22) / col) - 22
            if (index === this.curBigCrad2) {
              item._width = _width * 2 + 30
            } else {
              item._width = Math.floor((this.cWidth + 22) / col) - 22
            }
          }
          return item
        })
      }
      return _rankSoftList
    },
    itemWidth() {
      let col = 5
      if (this.cWidth > 1400) {
        col = 6
      }
      return Math.floor((this.cWidth + 22) / col) - 22
    },
    extrWidth() {
      if (this.curBigCrad2 > -1) {
        return (this.itemWidth * 2 + 30) - this.itemWidth
      }
      return 0
    },
    uWidth() {
      const _width = ((this.rankSoftList.data.length * (this.marginRight + this.itemWidth)) - this.marginRight) + this.extrWidth + 'px'
      return _width
    },
    transX() {
      if (this.$isPadDevice) {
        return
      }
      if (this.cWidth < 1400 && this.rankSoftList.data.length < 5) {
        return
      }
      if (this.cWidth > 1400 && this.rankSoftList.data.length < 6) {
        return
      }
      if (this.curBigCrad2 === 0) {
        return 0
      } else if (this.curBigCrad2 > 0 && this.curBigCrad2 < this.rankSoftList.data.length - 1) {
        return this.x - (this.extrWidth / 2)
      } else if (this.curBigCrad2 === this.rankSoftList.data.length - 1) {
        return this.x - this.extrWidth
      } else {
        return this.x
      }
    },
    mark() {
      if (!this.rankSoftList.data.length) {
        return
      }
      const _markItem = this.rankSoftList.data.find(item => item.mark === 1)
      if (_markItem) {
        return _markItem.eventDate?.slice(5)
      }
      return this.rankSoftList.data[0].eventDate?.slice(5)
    },
    drinfo() {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: `${this.rankSoftList.name}_游戏日历 ` || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    },
    showPrevPageButton() {
      if (this.progress > 1) {
        return true
      }
      return false
    },
    showNextPageButton() {
      let cardLength = false
      if (this.cWidth < 1400 && this.rankSoftList.data.length > 5) {
        cardLength = true
      } else if (this.cWidth > 1400 && this.rankSoftList.data.length > 6) {
        cardLength = true
      }
      if (this.progress !== 100 && cardLength) {
        return true
      }
      return false
    },
    softId() {
      return this.rankSoftList.data[this.curBigCrad2].softInfo.softId
    },
    softId2() {
      return this.rankSoftList.data[this.curBigCrad3].softInfo.softId
    }
  },
  methods: {
    filterEventType(item) {
      if ([0].includes(item.eventType)) {
        return '正式上线'
      }
      if ([1, 2].includes(item.eventType) && item.eventStatus === 1) {
        if (item.hideEventDate === 1) {
          return '游戏预约'
        }
        return '正在预约'
      }
      if ([1, 2].includes(item.eventType) && item.eventStatus === 2) {
        return '正式上线'
      }
      if ([4].includes(item.eventType)) {
        if (!item.activityName) {
          return '游戏测试'
        }
        if ([0, 2].includes(item.eventStatus)) {
          return item.activityName || ''
        }
        if (item.eventStatus === 1) {
          return `正在${item.activityName || ''}`
        }
      }
    },
    filterDescriptiveInformation(item) {
      if ([0].includes(item.eventType)) {
        return item.eventTip || ''
      }
      if ([1, 2].includes(item.eventType) && [1, 2].includes(item.eventStatus)) {
        return item.eventTip || ''
      }
      if ([4].includes(item.eventType)) {
        if (!item.activityName) {
          return item.eventTip || ''
        }
        if (item.eventStatus === 0) {
          return '敬请期待'
        }
        if (item.eventStatus === 1) {
          return item.eventTip || ''
        }
        if (item.eventStatus === 2) {
          return '已结束'
        }
      }
    },
    filterEventDate(item) {
      if (item.hideEventDate === 1 && [1, 2].includes(item.softInfo.downloadInfo.bizType)) {
        return '敬请期待'
      }
      if (item.hideEventDate === 1 && [4].includes(item.softInfo.downloadInfo.bizType) && item.eventStatus === 0) {
        return '敬请期待'
      }
      if (!item.eventDate) {
        return '敬请期待'
      }
      return item.eventDate?.slice(5)
    },
    curBigCradIn(index) {
      if (this.ulActive === false) {
        this.ulActive = true
      }
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.curBigCrad2 = index
        this.curBigCrad3 = index
      }, 150)
    },
    curBigCradOut() {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.curBigCrad2 = -1
      }, 150)
    },
    toDetail(item) {
      this.curBigCrad2 = -1
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_p: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: `${this.rankSoftList.name}_游戏日历`,
          plateName: this.rankSoftList.name
        }
      })
    },
    handleMouseDown() {
      this.ulActive = false
    },
    handleMouseUp() {
      this.ulActive = true
    },
    onInput(progress) {
      if (this.$refs['list-wrapper'] && this.$refs['ul-wrapper']) {
        const uWidth = this.$refs['ul-wrapper'].offsetWidth - 22
        const totalWidth = uWidth - this.cWidth
        const currentWidth = (progress / 100) * (totalWidth)
        this.x = (-currentWidth)
      }
    },
    init(date) {
      this.$nextTick(() => {
        if (!this.$refs['list-wrapper'] || !this.$refs['ul-wrapper']) return
        const uWidth = this.$refs['ul-wrapper'].offsetWidth
        const totalWidth = uWidth - this.cWidth
        if (date) {
          const dateIndex = this.rankSoftList.data.findIndex(item => item.eventDate?.slice(5) === date)
          if (dateIndex > -1) {
            const curX = (this.marginRight + this.itemWidth) * dateIndex
            if (this.cWidth >= uWidth) {
              this.x = 0
            } else if ((curX + this.cWidth) > uWidth + 22) {
              if (dateIndex > this.rankSoftList.data.length - 4) {
                this.x = -totalWidth
              } else {
                this.x = -curX + (this.cWidth / 2) - (this.itemWidth / 2)
              }
            } else {
              if ([0, 1, 2].includes(dateIndex)) {
                this.x = 0
              } else {
                this.x = -curX + (this.cWidth / 2) - (this.itemWidth / 2)
              }
            }
            this.progress = (Math.abs(this.x) / totalWidth) * 100
          }
        } else {
          this.progress = 0
          this.x = 0
        }
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.ulActive = true
        }, 300)
      })
    },
    resizeObserverHandle(entries) {
      if (!entries || entries.length <= 0 || entries[0].borderBoxSize.length <= 0) return
      this.cWidth = entries[0].borderBoxSize[0].inlineSize
      const _SAVE_GAME_CALENDAR_LOCATION = sessionStorage.getItem('SAVE_GAME_CALENDAR_LOCATION')
      if (!_SAVE_GAME_CALENDAR_LOCATION) {
        this.$nextTick(() => {
          this.ulActive = false
          this.init(this.mark)
        })
      } else {
        sessionStorage.removeItem('SAVE_GAME_CALENDAR_LOCATION')
      }
    },
    prevPage() {
      if (this.$refs['ul-wrapper']) {
        const uWidth = this.$refs['ul-wrapper'].offsetWidth - 22
        const totalWidth = uWidth - this.cWidth
        if (this.progress === 0 || totalWidth < 0) {
          return
        }
        const curX = this.x + ((this.marginRight + this.itemWidth) * 2)
        if (curX > 0) {
          this.x = 0
          this.progress = 0
        } else {
          this.x = curX
          this.progress = (Math.abs(this.x) / totalWidth) * 100
        }
      }
    },
    nextPage() {
      if (this.$refs['ul-wrapper']) {
        const uWidth = this.$refs['ul-wrapper'].offsetWidth - 22
        const totalWidth = uWidth - this.cWidth
        if (this.progress === 100 || totalWidth < 0) {
          return
        }
        const curX = Math.abs(this.x - ((this.marginRight + this.itemWidth) * 2))
        if (curX > totalWidth) {
          this.x = -totalWidth
          this.progress = 100
        } else {
          this.x = -curX
          this.progress = (Math.abs(this.x) / totalWidth) * 100
        }
      }
    },
    toFollowers() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.toFollowersReport()
      toFollowers(this.softId, this.isFollower).then(res => {
        this.isFollower = res.data
        if (this.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softInfo.softId === this.softId2) {
              o.softInfo.softDesc.followerCount++
            }
            return o
          })
        } else {
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softInfo.softId === this.softId2 && o.softInfo.softDesc.followerCount > 0) {
              o.softInfo.softDesc.followerCount--
            }
            return o
          })
          this.confirmReport(2)
        }
      }).catch((err) => {
        if (err && typeof err.type === 'number') {
          this.confirmReport(1)
        }
      })
    },
    toFollowersReport() {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softInfo.softId === this.softId2).softInfo.softName || ''
      }
      let _stateGame = 1
      let _statePage = 1
      const _downloadInfo = this.rankSoftList.data.find(item => item.softInfo.softId === this.softId2).softInfo.downloadInfo || null
      if (_downloadInfo) {
        if ([1, 2].includes(_downloadInfo.bizType)) {
          _stateGame = 2
        } else if (_downloadInfo.bizType === 4) {
          _stateGame = 3
        }
        if ([1, 2].includes(_downloadInfo.bizType)) {
          if (_downloadInfo.userReservationStatus === 0) {
            _statePage = 2
          } else if (_downloadInfo.userReservationStatus === 1) {
            _statePage = 3
          }
        } else if (_downloadInfo.bizType === 4) {
          if (_downloadInfo.testActivityStatus === 0) {
            _statePage = 4
          } else {
            if (_downloadInfo.userTestApplyStatus === 0) {
              _statePage = 5
            } else if ([1].includes(_downloadInfo.userTestApplyStatus)) {
              _statePage = 6
            } else if ([2].includes(_downloadInfo.userTestApplyStatus)) {
              _statePage = 1
            }
          }
        }
      }
      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        details: JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: `${this.moduleData.rankingLists[0].name}_游戏日历`,
          skuName: _skuName,
          softID: this.softId2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.isFollower ? 2 : 1
        })
      })
    },
    confirmReport(confirmType) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softInfo.softId === this.softId2).softInfo.softName || ''
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
          softID: this.softId2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    getShowFollowers(item) {
      if ([2, 3].includes(item?.softInfo?.downloadInfo?.bizType)) {
        return false
      }
      return true
    },
    gameReport() {
      let _rankingListSoftCalendars = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 4) {
        _moduleName = `${this.moduleData.rankingLists[0].name}_游戏日历`
        if (this.moduleData.rankingLists[0].rankingListSoftCalendars.length) {
          _rankingListSoftCalendars = this.moduleData.rankingLists[0].rankingListSoftCalendars.map(o => {
            let _bizType = 1
            if ([1, 2].includes(o.softInfo.downloadInfo.bizType)) {
              _bizType = 2
            } else if (o.softInfo.downloadInfo.bizType === 4) {
              _bizType = 3
            }
            let buttonType = 1
            if ([1, 2].includes(o.softInfo.downloadInfo.bizType)) {
              if (o.softInfo.downloadInfo.userReservationStatus === 0) {
                buttonType = 2
              } else if (o.softInfo.downloadInfo.userReservationStatus === 1) {
                buttonType = 3
              }
            } else if (o.softInfo.downloadInfo.bizType === 4) {
              if (o.softInfo.downloadInfo.testActivityStatus === 0) {
                buttonType = 4
              } else {
                if (o.softInfo.downloadInfo.userTestApplyStatus === 0) {
                  buttonType = 5
                } else if ([1].includes(o.softInfo.downloadInfo.userTestApplyStatus)) {
                  buttonType = 6
                } else if ([2].includes(o.softInfo.downloadInfo.userTestApplyStatus)) {
                  buttonType = 1
                }
              }
            }
            const _name_download = `${o.softInfo.softName}_${o.softInfo.softId}_${_bizType}_${buttonType}`
            return {
              name_cdk: _name_download
            }
          })
        }
      }
      const _download = _rankingListSoftCalendars.map(o => o.name_cdk).join(',')
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
    }
  }
}
</script>

<style lang="scss" src="./index.scss" scoped></style>
