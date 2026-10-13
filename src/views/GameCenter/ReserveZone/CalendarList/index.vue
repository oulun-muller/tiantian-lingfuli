<template>
  <section class="CalendarList">
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleData.moduleEname }}</span>
      <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ moduleData.moduleName }}&nbsp;<i class="gc-title-quote-icon"></i></span>
      <span v-else class="gc-title-text">{{ moduleData.moduleName }}</span>
    </h3>
    <!-- 月份列表 -->
    <div class="month-wrap" v-if="monthList.length">
      <button
        :class="['prev-page', canPrevMonth ? '' : 'disabled']"
        @click.stop="scrollToMonth(1)"></button>
      <div class="month-scroll-wrap" ref="scrollContainer">
        <ul class="month-list" ref="monthContainer" :style="{ transform: `translateX(${scrollPosition}px)` }">
          <li
            v-for="item in monthList"
            :key="item"
            tabindex="0"
            role="button"
            :aria-label="item + '月份'"
            :class="[item === currentMonth ? 'active' : '']"
            @click="clickMonth(item)"
            @keydown.enter.prevent.stop="clickMonth(item)"
            @keydown.space.prevent.stop="clickMonth(item)"
            v-html="monthText(item)">
          </li>
        </ul>
      </div>
      <button
        :class="['next-page', canNextMonth ? '' : 'disabled']"
        @click.stop="scrollToMonth(-1)"></button>
    </div>
    <!-- 日期游戏列表 -->
    <div class="horizontal-scroll-wrapper">
      <!-- 左箭头按钮 -->
      <div v-if="!isAtStart" class="img-prev-wrap">
        <button
          class="prev"
          @click="scrollToPrevPage"
        >
        </button>
      </div>
      <!-- 虚拟滚动容器 -->
      <div class="horizontal-virtual-scroll" ref="container" @scroll="handleScroll">
        <div
          class="scroll-content"
          :style="{ width: totalWidth + 'px' }"
        >
          <div
            v-for="(item, index) in visibleItems"
            :key="item.id"
            :class="['scroll-item', curIndex===index ? 'current' : '']"
            :style="{
              width: itemWidth + 'px',
              transform: `translateX(${item.position}px)`
            }"
            tabindex="0"
            role="button"
            :aria-label="item.softInfo ? item.softInfo.softName + '，点击查看详情' : ''"
            @click="goToDetail(item)"
            @keydown.enter.prevent.stop="goToDetail(item)"
            @keydown.space.prevent.stop="goToDetail(item)"
            v-exposure="{
              handler: ()=>onExposure(item),
              delay: 1000,
              options: { threshold: 0.5 },
              once: true
            }"
          >
            <span :class="['date', getDateText(item, index).class]">{{ getDateText(item, index).text }}</span>
            <b
              @mouseenter="mouseEnterItem(index)"
              :style="{ backgroundImage:`url(${item.vimg})` }"></b>
            <template v-if="curIndex===index">
              <div @mouseleave="mouseLeaveItem(index)">
                <template v-if="item.softInfo && item.softInfo.softDesc.mediaList[0].type === 'video'">
                  <video ref="videoDom" :src="item.softInfo.softDesc.mediaList[0].url" muted autoplay></video>
                </template>
                <template v-else>
                  <b class="hover-media" :style="{ backgroundImage:`url(${item.softInfo.softDesc.mediaList[0].url})` }"></b>
                </template>
                <div class="detail-wrap" v-if="item.softInfo">
                  <h3 class="title text-linear">{{ item.softInfo.softName }}</h3>
                  <p class="desc" v-if="item.softInfo.softDesc && item.softInfo.softDesc.introduction">{{ item.softInfo.softDesc.introduction }}</p>
                  <div class="tags-wrap" v-if="iconList(item).length">
                    <template v-for="(icon, key) in iconList(item)" >
                      <template v-if="icon">
                        <template v-if="icon.labelName">
                          <span
                            :key="'icon-'+key"
                            class="tag"
                            tabindex="0"
                            role="button"
                            :aria-label="icon.labelName + 'TOP' + icon.num + '，查看榜单'"
                            @click.stop="goToRankList(icon, item)"
                            @keydown.enter.prevent.stop="goToRankList(icon, item)"
                            @keydown.space.prevent.stop="goToRankList(icon, item)">
                            <i class="text-bac">
                            </i><i class="text">
                              <template v-if="icon.labelName">
                                {{ icon.labelName }}TOP{{ icon.num }}
                              </template>
                              <template v-else>
                                {{ icon }}
                              </template>
                            </i>
                          </span>
                        </template>
                        <template v-else-if="icon.type === 'online-tag'">
                          <span class="online" :key="'icon-'+key"><i class="online-icon"></i>{{ icon.text }}</span>
                        </template>
                        <template v-else-if="icon.type === 'soft-label'">
                          <span :key="'icon-'+key" :class="{active:icon.text === 'DLC', 'tag-item': true}">{{ icon.text }}</span>
                        </template>
                        <template v-else>
                          <img :key="'icon-'+key" class="auth-icon" :src="icon" aria-hidden="true" />
                        </template>
                      </template>
                    </template>
                  </div>
                  <p class="reserve-count" v-if="item.softInfo && item.softInfo.downloadInfo && item.softInfo.downloadInfo.reservationCount">{{ item.softInfo.downloadInfo.reservationCount }}人预约</p>
                  <p class="tip">
                    <!-- <span class="link" @click="goToActivity(item)">领限定预约好礼></span> -->
                    <template v-if="item.softInfo.relateActivitys && item.softInfo.relateActivitys.length" >
                      <i class="star"></i>
                      <span class="bindtag" v-for="bindTag in item.softInfo.relateActivitys" :key="bindTag.title" tabindex="0" role="button" :aria-label="bindTag.title" @click.stop="goToBindTag(bindTag, item)" @keydown.enter.prevent.stop="goToBindTag(bindTag, item)" @keydown.space.prevent.stop="goToBindTag(bindTag, item)">
                        <i class="text">{{ bindTag.title }}</i><i class="arrow"></i>
                      </span>
                    </template>
                  </p>
                  <GameDownloadButton
                    v-if="item.softInfo"
                    class="downloadButton"
                    theme="rect"
                    :download-info="item.softInfo.downloadInfo"
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
                    :sku-id="item.softInfo.skuId" />
                </div>
              </div>
            </template>
            <template v-else>
              <div class="name-wrap" v-if="item.softInfo">
                <p class="name">{{ item.softInfo && item.softInfo.softName }}</p>
                <p class="desc" v-if="item.softInfo && item.softInfo.downloadInfo && item.softInfo.downloadInfo.reservationCount">{{ item.softInfo.downloadInfo.reservationCount }}人预约
                  <template v-if="item.softInfo.relateActivitys && item.softInfo.relateActivitys.length" >
                    <i>.</i>
                    <span class="bindtag" v-for="bindTag in item.softInfo.relateActivitys" :key="bindTag.title" tabindex="0" role="button" :aria-label="bindTag.title" @click.stop="goToBindTag(bindTag, item)" @keydown.enter.prevent.stop="goToBindTag(bindTag, item)" @keydown.space.prevent.stop="goToBindTag(bindTag, item)">
                      <i class="text">{{ bindTag.title }}</i><i class="arrow"></i>
                    </span>
                  </template>
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 右箭头按钮 -->
      <div v-if="!isAtEnd" class="img-next-wrap">
        <button
          class="next"
          @click="scrollToNextPage"
          :disabled="isAtEnd"
        >
        </button>
      </div>
    </div>
  </section>
</template>
<script>
import GameDownloadButton from '@/components/GameDownloadButton'
export default {
  props: {
    moduleData: {
      type: Object,
      required: true
    }
  },
  components: {
    GameDownloadButton
  },
  data() {
    return {
      monthScrollLeft: 0,
      manualMonth: '',
      itemWidth: 264,
      buffer: 3,
      scrollLeft: 0,
      containerWidth: 0,
      curYear: new Date().getFullYear(),
      scrollPosition: 0,
      maxScrollPosition: 0,
      curIndex: null,
      items: [],
      monthList: [],
      monthScrollerWidth: 0,
      monthContentWidth: 0
    }
  },
  watch: {
    isAtEnd(value) {
      if (value) {
        this.manualMonth = this.monthList[this.monthList.length - 1]
      }
    },
    isAtStart(value) {
      if (value) {
        this.manualMonth = this.monthList[0]
      }
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    iconList() {
      return (item) => {
        const showInfoObj = item.softInfo?.showInfo || {}
        const tagList = showInfoObj.rankingLabelInfos?.slice(0, 1) || []
        const onlineTime = item.softInfo?.downloadInfo?.releaseRemind || ''
        const onlineTag = onlineTime ? [{ type: 'online-tag', text: onlineTime }] : []
        const softLabels = (item.softInfo?.showInfo?.softLabels || []).map(one => { return { type: 'soft-label', text: one } })
        const tags = [].concat(tagList, ...onlineTag, item.softInfo?.downloadInfo?.tagUrls || [], softLabels).slice(0, 2)
        return tags.filter((item) => item !== null)
      }
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }
      if (this.$route.query.firstLocal) {
        return this.$route.query.firstLocal
      }
      const _GAME_CENTER_SOURCE_RECORD = Number(sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD'))
      return _GAME_CENTER_SOURCE_RECORD
    },
    secondLocal() {
      return 17
    },
    drinfo() {
      return (item) => {
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.moduleData?.rankingLists?.[0].name || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        }

        if (item.softPurpose === 3) {
          params.gameClass = item.softPurpose
        }

        return JSON.stringify(params)
      }
    },
    canPrevMonth() {
      return this.scrollPosition < 0
    },
    canNextMonth() {
      return 0 - this.scrollPosition <= this.monthScrollerWidth - this.monthContentWidth
    },
    monthText() {
      return (date) => {
        if (date === '敬请期待') {
          return '<i class="text">敬请期待</i>'
        }
        const dateArr = date.split('-')
        if (Number(dateArr[0]) !== this.curYear) {
          return `<i>${Number(dateArr[1])}</i>月/${dateArr[0]}`
        } else {
          return `<i>${Number(dateArr[1])}</i>月`
        }
      }
    },
    currentMonth() {
      return this.manualMonth || this.currentVisibleItems?.[2]?.eventDate?.slice(0, -3) || '敬请期待'
    },
    currentVisibleItems() {
      // 计算完全可见的项目范围（不考虑缓冲区）
      const firstVisibleIndex = Math.floor(this.scrollLeft / this.itemWidth)
      const lastVisibleIndex = Math.min(
        this.totalItems - 1,
        Math.floor((this.scrollLeft + this.containerWidth) / this.itemWidth)
      )
      return this.items.slice(firstVisibleIndex, lastVisibleIndex + 1)
    },
    totalItems() {
      return this.items.length
    },
    totalWidth() {
      return this.totalItems * this.itemWidth + 80 - 16
    },
    isAtStart() {
      return this.scrollLeft <= 0
    },
    isAtEnd() {
      return this.scrollLeft >= this.totalWidth - this.containerWidth
    },
    visibleCount() {
      return Math.ceil(this.containerWidth / this.itemWidth) + this.buffer * 2
    },
    startIndex() {
      const start = Math.floor(this.scrollLeft / this.itemWidth) - this.buffer
      return Math.max(0, start)
    },
    endIndex() {
      const end = this.startIndex + this.visibleCount
      return Math.min(this.totalItems - 1, end)
    },
    visibleItems() {
      const items = []
      for (let i = this.startIndex; i <= this.endIndex; i++) {
        items.push({
          ...this.items[i],
          position: i * this.itemWidth
        })
      }
      return items
    }
  },
  created() {
    this.items = this.moduleData?.rankingLists[0]?.rankingListSoftCalendars || []
    const list = []
    this.items.forEach(item => {
      if (item?.eventDate) {
        list.push(item.eventDate.slice(0, -3))
      } else if (item?.hideEventDate === 1) {
        list.push('敬请期待')
      }
    })
    this.monthList = list.length ? [...new Set(list)] : []
    this.manualMonth = this.monthList[0]
    window.addEventListener('resize', this.updateContainerSize)
    this.$nextTick(() => {
      this.monthContentWidth = this.$refs.scrollContainer.clientWidth
      this.monthScrollerWidth = this.$refs.monthContainer.scrollWidth
      this.maxScrollPosition = -(this.monthScrollerWidth - this.containerWidth + 122)
      this.updateContainerSize()
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.updateContainerSize)
  },
  methods: {
    onExposure(item) {
      this.bannerGameReport('LZ_storeReservZoneOperatBitsShow', 'pv', item)
    },
    bannerGameReport(action, label, item) {
      const skuName = item.softInfo?.softName || item.communityInfo?.name || item.activityPageInfo?.name || item.relateRankingInfo?.name
      const softID = item.softInfo?.softId || item.communityInfo?.id || item.activityPageInfo?.id || item.relateRankingInfo?.id
      const version = item.activityPageInfo?.id ? 2 : (item.communityInfo?.id ? 3 : 1)
      this.$dataReport('LZ_gamingCenter', action, label, {
        detail: JSON.stringify({
          plateName: this.moduleData.rankingLists[0].name || '',
          nameAndIDVersion: `${skuName}_${softID}_${version}`,
          lenovoid: this.userInfo?.UserID || ''
        })
      })
    },
    goToRankList(icon, item) {
      this.$router.push({
        path: '/gameCenter/rankList',
        query: {
          tab: icon.labelCode
        }
      })
      const skuName = item.softInfo.softName || item.communityInfo.name || item.activityPageInfo.name || item.relateRankingInfo.name
      const softID = item.softInfo.softId || item.communityInfo.id || item.activityPageInfo.id || item.relateRankingInfo.id
      const version = item.activityPageInfo.id ? 2 : (item.communityInfo.id ? 3 : 1)
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeReservZoneOperatBitsClick',
        'click',
        {
          detail: JSON.stringify({
            plateName: this.moduleData.rankingLists[0].name || '',
            skuName: skuName,
            skuID: softID,
            type: version,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            clickType: 3
          })
        }
      )
    },
    getDateText(item, index) {
      try {
        if ((item?.eventDate === this.visibleItems?.[index - 1]?.eventDate) || (item.hideEventDate === 1 && this.visibleItems?.[index - 1]?.hideEventDate === 1)) {
          return {
            text: '',
            class: 'long'
          }
        } else {
          if (!item.eventDate) {
            return {
              text: '敬请期待',
              class: 'continueing'
            }
          } else if (item.eventDate && item.hideEventDate === 1) {
            return {
              text: '敬请期待',
              class: 'continueing'
            }
          } else if (item.eventDate?.indexOf(this.curYear) !== -1) {
            return {
              text: item.eventDate?.replace(`${this.curYear}-`, '')?.replace(/-/g, '/'),
              class: 'short'
            }
          } else {
            return {
              text: item?.eventDate?.replace(/-/g, '/'),
              class: 'long-date'
            }
          }
        }
      } catch (error) {
        console.error(error, item, index)
        return {
          text: '敬请期待',
          class: 'continueing'
        }
      }
    },
    goToBindTag(bindTag, curPic) {
      if (bindTag.type === 1) {
        this.$router.push({
          path: '/gameCenter/online/index',
          query: {
            id: bindTag.jumpUrl,
            firstLocal: 8,
            secondLocal: 17
          }
        })
      } else {
        this.$router.push({
          path: `/forum/micro/detail/${bindTag.jumpUrl}`,
          query: {
            forumSource: 2
          }
        })
      }
      const item = curPic
      const skuName = item.softInfo.softName || item.communityInfo.name || item.activityPageInfo.name || item.relateRankingInfo.name
      const softID = item.softInfo.softId || item.communityInfo.id || item.activityPageInfo.id || item.relateRankingInfo.id
      const version = item.activityPageInfo.id ? 2 : (item.communityInfo.id ? 3 : 1)
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeReservZoneOperatBitsClick',
        'click',
        {
          detail: JSON.stringify({
            plateName: this.moduleData.rankingLists[0].name || '',
            skuName: skuName,
            skuID: softID,
            type: version,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            clickType: 3
          })
        }
      )
    },
    // goToActivity(item) {
    //   this.$router.push({
    //     path: '/gameCenter/online/index',
    //     query: {
    //       id: '7362001911293952',
    //       firstLocal: 8,
    //       secondLocal: 11
    //     }
    //   })
    // },
    mouseEnterItem(index) {
      this.curIndex = index
    },
    mouseLeaveItem() {
      if (this.$refs.videoDom && this.$refs.videoDom[0]) {
        this.$refs.videoDom[0].pause()
        this.$refs.videoDom[0].currentTime = 0
        this.$refs.videoDom[0].src = null
      }
      this.curIndex = null
    },
    goToDetail(item) {
      if (!item.softInfo) return
      const usedForReport = this.moduleData.rankingLists?.[0].name || ''
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softInfo.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: usedForReport
        }
      })
    },
    scrollToMonth(direction) {
      const scrollAmount = this.containerWidth * 0.76 // 每次滚动容器宽度的一半
      let newPosition = this.monthScrollLeft + (scrollAmount * direction) - 240
      // 限制滚动范围
      newPosition = Math.max(-(this.monthScrollerWidth - this.monthContentWidth + 100), Math.min(0, newPosition))
      this.scrollPosition = newPosition
    },
    clickMonth(month) {
      this.manualMonth = month
      let firstDataIndex
      if (month === '敬请期待') {
        firstDataIndex = this.items.findIndex(item => item.hideEventDate === 1 && !item.eventDate)
      } else {
        firstDataIndex = this.items.findIndex(item => item.eventDate.indexOf(month) !== -1)
      }
      const left = Math.min(
        this.totalWidth - this.containerWidth,
        firstDataIndex * this.itemWidth
      )
      this.$refs.container.scrollTo({
        left: left,
        behavior: 'smooth'
      })
    },
    updateContainerSize() {
      this.containerWidth = this.$refs.container.clientWidth
    },
    handleScroll() {
      this.scrollLeft = this.$refs.container.scrollLeft
    },
    scrollToPrevPage() {
      this.manualMonth = ''
      const newScrollLeft = Math.max(0, this.scrollLeft - this.containerWidth + 110)
      this.$refs.container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    },
    scrollToNextPage() {
      this.manualMonth = ''
      const newScrollLeft = Math.min(
        this.totalWidth - this.containerWidth,
        this.scrollLeft + this.containerWidth - 110
      )
      this.$refs.container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.CalendarList {
  max-width: 1440px;
  margin: 0 auto;
  padding-top: 40px;
  background-image: url("~@/images/gamecenter/reserveZone/calendar-bac.png");
  background-size: 100% 100%;
}
h3.title-wrap {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 17px 0;
  margin-left: 40px;
  .title-bac {
    position: absolute;
    top: 0px;
    left: 0px;
  }
}
.month-wrap {
  position: relative;
  margin: 18px 40px 0 40px;
  .month-scroll-wrap {
    overflow: hidden;
    width: calc(100% - 122px);
    margin: 0 auto;
  }
  .month-list {
    transition: all 0.3s ease;
    white-space: nowrap;
    height: 76px;
    overflow-x: auto;
    width: max-content;
    display: flex;
    align-items: center;
    &::-webkit-scrollbar {
      display: none; /* Chrome/Safari隐藏滚动条 */
    }
    li {
      display: inline-block;
      margin-right: 93px;
      color: rgba(255, 255, 255, 0.2);
      &:focus-visible {
        outline: 2px solid #4fc3f7;
        outline-offset: 4px;
        border-radius: 2px;
      }
      font-size: 20px;
      :deep(i) {
        cursor: pointer;
        text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.6);
        font-family: Baunk;
        font-size: 40px;
        font-weight: 400;
        // line-height: 69px;
        // vertical-align: -4px;
        margin-right: 3px;
        &.text {
          font-size: 20px;
          // vertical-align: 0px;
        }
      }
      &.active {
        line-height: 0;
        color: rgb(234 247 255 / 80%);
        &:focus-visible {
          outline-offset: 16px;
        }
        :deep(i) {
          font-size: 60px;
          background: linear-gradient(0, #929292 20%, #EAF7FF 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: none;
          &.text {
            font-size: 26px;
            // &::before {
            //   content: '';
            //   display: inline-block;
            //   height: 20px
            // }
          }
        }
      }
    }
  }
  button {
    position: absolute;
    top: 50%;
    z-index: 6;
    width: 40px;
    height: 40px;
    margin-top: -20px;
    background-color: transparent;
    border: none;
    outline: none;
    &:focus-visible {
      outline: 2px solid #4fc3f7;
      outline-offset: 2px;
      border-radius: 4px;
    }
    background-image: url("~@/images/gamecenter/reserveZone/month-right.png");
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    cursor: pointer;
    opacity: 0.7;
    &:hover {
      opacity: 1;
    }
    &.prev-page {
      left: 0;
      background-image: url("~@/images/gamecenter/reserveZone/month-left.png");
    }
    &.next-page {
      right: 0;
    }
    &.disabled {
      pointer-events: none;
      opacity: 0.3;
    }
  }
}

.scroll-item {
  position: relative;
  .link {
    cursor: pointer;
  }
  .detail-wrap {
    display: none;
  }
  &.current {
    .detail-wrap {
      animation: detailHeightBack 0.3s forwards;
      display: block;
      position: absolute;
      top: 212px;
      left: 24px;
      width: 241px;
      height: 278px;
      background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(0deg, rgba(112, 118, 150, 0.70) -48.17%, rgba(30, 34, 39, 0.70) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.00) -73.63%, rgba(0, 0, 0, 0.80) -73.63%, rgba(28, 30, 30, 0.90) 80.59%);
      backdrop-filter: blur(5px);
      padding: 20px 20px 0 20px;
      border: 1px solid;
      border-image: linear-gradient(to bottom, #fff, rgb(252 252 252 / 40%)) 1;
      border-top: 0 none;
      h3.title {
        background: linear-gradient(180deg, #929292 20%, #EAF7FF 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      .desc {
        margin-top: 14px;
        color: rgba(234, 247, 255, 0.80);
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 1px;
        margin-top: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-all;
      }
      .reserve-count {
        margin-top: 14px;
        color: rgba(234, 247, 255, 0.80);
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 1px;
      }
      .tip {
        margin-top: 16px;
        color: #FFE2B6;
        font-size: 12px;
        font-weight: 400;
        letter-spacing: 1px;
        .star {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: transparent url('~@/images/gamecenter/reserveZone/star-icon.png') no-repeat center center / contain;
          vertical-align: -2px;
          margin-right: 3px;
        }
      }
      .downloadButton {
        position: absolute;
        bottom: 22px;
        text-align: center;
        left: 50%;
        transform: translateX(-50%);
        :deep(.ReserveButton){
          width: 90px;
        }
      }
    }
  }
}
.date {
  display: inline-block;
  position: relative;
  background: linear-gradient(99deg, #FFF 35.6%, #7F8498 55.26%, #FFF 75.41%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 22px;
  font-weight: 400;
  line-height: 24px;
  height: 24px;
  margin-bottom: 20px;
  margin-top: 20px;
  &::after {
    content: '';
    position: absolute;
    top: 16px;
    width: 264px;
    height: 1px;
    background-color: #51555a;
  }
  &.long::after {
    width: 264px;
    margin-left: -24px;
  }
  &.short::after {
    width: 156px;
    margin-left: 24px;
  }
  &.continueing::after {
    width: 130px;
    margin-left: 24px;
  }
   &.long-date::after {
    width: 96px;
    margin-left: 24px;
  }
}
b {
  display: inline-block;
  width: 240px;
  height: 360px;
  background-size: cover;
  border: 1px solid;
  border-image: linear-gradient(245deg, #fff, #999) 1;
  object-fit: cover;
}
video, .hover-media {
  width: 239px;
  height: 148px;
  position: absolute;
  top: 68px;
  left: 25px;
  background-color: rgb(0 0 0);
  object-fit: cover;
  background-size: cover;
}
.name-wrap {
  .name {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: 14px;
    background: linear-gradient(180deg, #929292 20%, #EAF7FF 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .desc {
    color: rgba(234, 247, 255, 0.80);
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 1px;
    margin-top: 10px;
  }
}
span.tag-item {
  display: inline-block;
  vertical-align: top;
  box-sizing: border-box;
  padding: 4px 8px 4px 8px;
  border: 1px solid rgba(234, 247, 255, 0.2);
  border-radius: 1px;
  font-size: 12px;
  line-height: 1;
  margin-right: 4px;
  text-align: center;
  background: rgba(0, 0, 0, 0.20);
  color: rgb(234 247 255 / 60%);
  font-weight: 400;
  &.active {
    font-weight: bold;
    color: #386EFE;
    border-color: rgba(56, 110, 254, 0.6);
  }
  &:last-child {
    margin-right: 0;
  }
}
.img-wrap {
  position: relative;
  overflow: hidden;
  .img-list {
    display: flex;
    gap: 24px;
  }
}
.img-prev-wrap {
  z-index: 1;
  position: absolute;
  width: 70px;
  height: 426px;
  top: 64px;
  left: 0;
}
.img-next-wrap {
  position: absolute;
  width: 70px;
  height: 426px;
  top: 64px;
  right: 0;
}
button {
  position: absolute;
  top: 42%;
  z-index: 6;
  width: 80px;
  height: 80px;
  margin-top: -20px;
  background-color: transparent;
  border: none;
  outline: none;
  background-image: url("~@/images/gamecenter/reserveZone/arrow-float.png");
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  cursor: pointer;
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
  &.prev {
    left: 30px;
    transform: rotate(180deg);
  }
  &.next {
    right: 30px;
  }
}
.horizontal-scroll-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  padding-bottom: 50px;
  .horizontal-virtual-scroll {
    flex: 1;
    overflow-x: auto;
    position: relative;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-behavior: smooth;
  }

  .horizontal-virtual-scroll::-webkit-scrollbar {
    display: none;
  }

  .scroll-content {
    position: relative;
    height: 520px;
    padding: 0 16px;
  }

  .scroll-item {
    position: absolute;
    will-change: transform;
    padding-left: 24px;
  }

  .nav-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    cursor: pointer;
    font-size: 18px;
    margin: 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
  }

}

.tags-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 14px;
  .auth-icon {
    height: 20px;
    vertical-align: -6px;
  }
  .online {
    background: rgba(0, 0, 0, 0.72);
    border: 1px solid rgb(255 255 255 / 46%);
    color: #95FF38;
    padding: 2.5px 4px;
    vertical-align: 0px;
    font-size: 12px;
    .online-icon {
      vertical-align: -4px;
      display: inline-block;
      width: 16px;
      height: 16px;
      background: transparent url('~@/images/gamecenter/reserveZone/online-icon.png') no-repeat center center/ contain;
    }
  }
  .tag {
    cursor: pointer;
    white-space: nowrap;
    position: relative;
    padding: 2px 8px 4px 4px;
    border: 1px solid rgba(234, 247, 255, 0.2);
    &::before {
      content: '';
      position: relative;
      z-index: 1;
      vertical-align: -3px;
      margin-right: 2px;
      display: inline-block;
      width: 17px;
      height: 17px;
      background: transparent url('@/images/gamecenter/reserveZone/rank-icon.png') no-repeat center center / contain;
    }
    .text {
      position: relative;
      display: inline-block;
      font-size: 12px;
      font-weight: 400;
      color: #FE9903;
    }
    .text-bac {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      color: transparent;
    }
  }
}
@keyframes detailHeightBack {
  0% {
    transform: translateY(5%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
.bindtag {
  cursor: pointer;
  .text {
    display: inline-block;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: -3px;
    color: rgb(234 247 255 / 80%);
  }
}
.detail-wrap {
  .bindtag .text {
    color: #FFE2B6;
  }
}
.arrow {
  margin-left: 3px;
  display: inline-block;
  width: 10px;
  height: 10px;
  background: transparent url('~@/images/gamecenter/right-arrow.png') no-repeat center center/ contain;
}

.month-list li:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.scroll-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

.bindtag:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.tag:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .month-list li:focus-visible,
  .scroll-item:focus-visible,
  .bindtag:focus-visible,
  .tag:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
