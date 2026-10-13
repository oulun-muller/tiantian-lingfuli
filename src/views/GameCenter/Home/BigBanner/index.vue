<template>
  <section class="BigBanner" v-if="curPic" v-swiper="{ prev: handlePrev, next: handleNext }">
    <video
      v-if="curPic.videoUrls && curPic.videoUrls[0]"
      ref="videoDom"
      :src="curPic.videoUrls[0]"
      :poster="curPic.imgUrls[0]"
      muted
      autoplay
      class="video"
      tabindex="0"
      role="button"
      :aria-label="(curPic.title || (curPic.softInfo && curPic.softInfo.softName) || '') + '，点击查看详情'"
      @click="goToDetail()"
      @keydown.enter.prevent.stop="goToDetail()"
      @keydown.space.prevent.stop="goToDetail()"
      @keydown.left.prevent.stop="handlePrev"
      @keydown.right.prevent.stop="handleNext"></video>
    <img
      v-else
      :src="curPic.imgUrls[0]"
      class="image"
      tabindex="0"
      role="button"
      :aria-label="(curPic.title || (curPic.softInfo && curPic.softInfo.softName) || '') + '，点击查看详情'"
      @click="goToDetail()"
      @keydown.enter.prevent.stop="goToDetail()"
      @keydown.space.prevent.stop="goToDetail()"
      @keydown.left.prevent.stop="handlePrev"
      @keydown.right.prevent.stop="handleNext" />
    <div class="left-shadow" aria-hidden="true"></div>
    <div class="right-shadow" aria-hidden="true"></div>
    <div class="bottom-shadow" aria-hidden="true"></div>
    <div class="info-wrap">
      <div class="info-title">
        <h3 class="name"><i class="text">{{ curPic.title }}</i><i class="text-shadow">{{ curPic.title }}</i></h3>
        <div
          v-if="curPic.softInfo && curPic.softInfo.downloadInfo && curPic.softInfo.downloadInfo.tagUrls.length"
          class="tag-img">
          <img
            v-for="(url, index) in curPic.softInfo.downloadInfo.tagUrls.slice(0, 3)"
            class="auth-icon"
            :key="index"
            :src="url"
            aria-hidden="true" />
        </div>
      </div>
      <p class="info" v-if="curPic.description">{{ curPic.description }}</p>
      <div class="tags-wrap" v-if="tagList.length">
        <!-- <span
          v-for="(rankItem, key) in tagList"
          :key="key"
          class="tag">
          <i class="text-bac">
          </i><i class="text">
            <template v-if="rankItem.labelName">
              {{ rankItem.labelName }}TOP{{ rankItem.num }}
            </template>
<template v-else>
              {{ rankItem }}
            </template>
</i>
</span> -->
        <TagNormal v-for="(rankItem, key) in tagList" :key="key" :title="rankItem" style="margin-right: 4px;" />
      </div>
      <div class="tag-wrap-2">
        <TagRank
          v-if="curPic.softInfo && curPic.softInfo.showInfo && curPic.softInfo.showInfo.rankingLabelInfos && curPic.softInfo.showInfo.rankingLabelInfos.length"
          style="margin-right: 6px;"
          :rank-list="curPic.softInfo.showInfo.rankingLabelInfos" />
        <template v-if="curPic.softInfo.relateActivitys && curPic.softInfo.relateActivitys.length">
          <TagActivity
            :title="curPic.softInfo.relateActivitys[0].title"
            :plate-name="curPic.title"
            :game-item="curPic.softInfo" />
        </template>
      </div>
      <!-- <p class="cdk" v-if="isCDKGame">
        <span v-if="curPic.softInfo.productInfo.discount" class="discount">{{ curPic.softInfo.productInfo.discount }}</span>
        <span class="currentPrice">¥{{ curPic.softInfo.productInfo.currentPrice }}</span>
        <span v-if="curPic.softInfo.productInfo.discount && curPic.softInfo.productInfo.originalPrice" class="originalPrice">¥{{ curPic.softInfo.productInfo.originalPrice }}</span>
        <span v-if="curPic.softInfo.productInfo.exchangePlatformFont" class="iconfont platform" v-html="curPic.softInfo.productInfo.exchangePlatformFont"></span>
      </p> -->
      <div class="btn-wrap">
        <GameDownloadButton
          v-if="isDownloadGame && curPic.softInfo"
          class="download-btn"
          button-style="abnormal"
          :download-info="curPic.softInfo.downloadInfo"
          :soft-desc="curPic.softInfo.softDesc"
          :soft-id="curPic.softInfo.softId"
          :soft-purpose="curPic.softInfo.softPurpose"
          :product-info="curPic.softInfo.productInfo"
          :user-purchased-status="curPic.softInfo.productInfo.userPurchasedStatus"
          :version="curPic.softInfo.softDesc.version"
          :soft-name="curPic.softInfo.softName"
          :logo-file="curPic.softInfo.showInfo.logoFile"
          :fast-install="curPic.softInfo.showInfo.isFastInstall"
          :drinfo="drinfo(curPic.softInfo)"
          :sku-id="curPic.softInfo.skuId" />

        <!-- <button class="common-abnomal-btn" v-if="isCDKGame" @click="showPay">
          <i class="text">立即购买</i>
        </button> -->
        <button class="common-abnomal-btn" v-if="isDetailGame" @click="goToDetail()">
          <i class="text">查看详情</i>
        </button>
        <div v-if="curPic.softInfo && curPic.softInfo.softPurpose === 3 && !curPic.softInfo.productInfo.userPurchasedStatus" class="buy-information">
          <div class="discount-class">{{ curPic.softInfo.productInfo.discount || 0 }}</div>
          <div class="current-price-class">¥{{ curPic.softInfo.productInfo.currentPrice || 0 }}</div>
          <div class="orgin-price-class">¥{{ curPic.softInfo.productInfo.originalPrice || 0 }}</div>
        </div>
      </div>
    </div>
    <ul v-if="!$isPadDevice" class="pg-navigation" role="list">
      <li
        v-for="(item, index) in pgList"
        :key="index"
        :class="[curIndex === index ? 'selected' : '']"
        :style="getStyle(curIndex, index)"
        tabindex="0"
        role="button"
        :aria-label="(item.title || (item.softInfo && item.softInfo.softName) || '') + (curIndex === index ? '，当前选中，点击查看详情' : '，点击切换')"
        :aria-current="curIndex === index ? 'true' : 'false'"
        @mouseenter="mouseEnterPG(index)"
        @mouseleave="mouseLeavePG"
        @click="goToDetail(item)"
        @keydown.enter.prevent.stop="goToDetail(item)"
        @keydown.space.prevent.stop="goToDetail(item)">
        <div class="wrapper" aria-hidden="true">
          <span class="text">
            {{ item.title || (item.softInfo && item.softInfo.softName) }}
          </span><span class="text-bac">
            {{ item.title || (item.softInfo && item.softInfo.softName) }}
          </span>
        </div>
      </li>
    </ul>

    <ul v-if="$isPadDevice && pgList.length > 1" class="pad-device-nav" aria-hidden="true">
      <li v-for="(item, index) in pgList" :key="index" :class="[curIndex === index ? 'selected' : '']">
      </li>
    </ul>
  </section>
</template>
<script>
const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect()
  // elOffsetBottom 指目标元素的头顶部距离 可视区底部的距离  也就是 目标元素从底部出现向上滚动多少出现动画 可配置
  return (window.innerHeight || document.documentElement.clientHeight) + rect.top
}

import GameDownloadButton from '@/components/GameDownloadButton'
import TagNormal from '@/components/TagNormal'
import TagActivity from '@/components/TagNormal/TagActivity'
import TagRank from '@/components/TagNormal/TagRank'
import { getGameMsgDataReport } from '@/utils/dataReport'
import { launchNNBBSWithCheck } from '@/utils'
export default {
  name: 'BigBanner',
  data() {
    return {
      curIndex: 0,
      clock: null,
      thirdLocal: '',
      inViewport: false
    }
  },
  props: {
    moduleData: {
      type: Object,
      required: true
    }
  },
  components: {
    GameDownloadButton,
    TagNormal,
    TagActivity,
    TagRank
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
    drinfo() {
      return (item) => {
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.moduleData.rankingLists?.[0].name || '',
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
    pgList() {
      return this.moduleData.rankingLists[0]?.rankingListPositions
    },
    curPic() {
      return this.moduleData.rankingLists[0]?.rankingListPositions[this.curIndex]
    },
    tagList() {
      // 游戏榜单标签或游戏标签；优先展示榜单标签，最多展示2个
      if (this.curPic.fillDataType === 1 || this.curPic.fillDataType === 2) {
        const showInfoObj = this.curPic?.softInfo?.showInfo || {}
        return (showInfoObj.softLabels || []).slice(0, 3)
      }
      return []
    },
    isCDKGame() {
      return this.curPic.fillDataType === 1
    },
    isDownloadGame() {
      return [2, 6].includes(this.curPic.fillDataType)
    },
    isDetailGame() {
      return [8, 10, 11].includes(this.curPic.fillDataType)
    }
  },
  watch: {
  },
  methods: {
    handlePrev() {
      console.log('prev')
      this.curIndex = this.curIndex - 1 < 0 ? this.pgList.length - 1 : this.curIndex - 1
    },
    handleNext() {
      console.log('next')
      this.curIndex = this.curIndex + 1 >= this.pgList.length ? 0 : this.curIndex + 1
    },
    showPay() {
      if (!this.userInfo) {
        // this.$login()
        return
      }
      const usedForReport = this.moduleData.rankingLists?.[0].name || ''

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: usedForReport || '',
          skuName: this.curPic.softInfo.softName || '',
          softID: this.curPic.softInfo.softId || '',
          gameVersion: this.curPic.softInfo.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: this.curPic.softInfo.skuId,
        price: this.curPic.softInfo.productInfo.currentPrice,
        plateName: usedForReport,
        gameVersion: this.curPic.softInfo.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: this.curPic.softInfo.softName || '',
        softID: this.curPic.softInfo.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    goToDetail(item = this.curPic) {
      if (!item) return
      this.bannerGameReport('LZ_storeCurationBannerGameClick', 'click', item)
      const usedForReport = this.moduleData.rankingLists?.[0].name || ''
      const softInfo = item.softInfo || {}
      const relateRankingInfo = item.relateRankingInfo || {}
      const communityInfo = item.communityInfo || {}
      const activityPageInfo = item.activityPageInfo || {}
      // 1-游戏CDK、2-游戏下载、3-游戏中心榜单（跳转到其他榜单列表、4-社区
      switch (item.fillDataType) {
        case 1:
        case 2:
        case 6:
          if (!softInfo.softId) return
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: softInfo.softId },
            query: {
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              reportPlateName: usedForReport,
              plateName: usedForReport
            }
          })
          break
        case 3:
          if (!relateRankingInfo.id) return
          this.$router.push({
            name: 'GameCenterList',
            query: {
              rankID: relateRankingInfo.id,
              rankName: relateRankingInfo.name,
              reportPlateName: usedForReport,
              plateName: usedForReport
            }
          })
          break
        case 4:
          if (!communityInfo.id) return
          this.$router.push({
            path: `/forum/micro/detail/${communityInfo.id}`,
            query: {
              forumSource: 2
            }
          })
          break
        case 5:
          this.$router.push({
            name: 'Magazine',
            query: {
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              plateNameReport: usedForReport
            }
          })
          break
        case 8:
          if (!activityPageInfo.id) return
          this.$router.push({
            path: `/gameCenter/online/index`,
            query: {
              id: activityPageInfo.id,
              source_pp: 'PAD2',
              source_p: 'PAD2',
              firstLocal: this.firstLocal,
              secondLocal: 11
              // ,plateNameReport: usedForReport
            }
          })
          break
        case 9:
          this.$router.push({
            name: 'ActivityZone',
            query: {
              firstLocal: this.firstLocal,
              secondLocal: 11,
              plateNameReport: usedForReport
            }
          })
          break
        case 10:
          // nn 社区
          if (item.thirdUrl) {
            launchNNBBSWithCheck(item.thirdUrl)
          }
          break
        case 11:
          // 三方链接
          if (item.thirdUrl) {
            window.open(item.thirdUrl, '_blank')
          }
          break
      }
    },
    mouseEnterPG(index) {
      clearTimeout(this.clock)
      // 清理上一个视频资源
      if (this.curIndex !== index && this.$refs.videoDom) {
        this.clearVideo()
      }
      this.curIndex = index
      this.bannerGameReport('LZ_storeCurationBannerGameShow', 'pv', this.curPic)
    },
    mouseLeavePG() {
      this.startClock()
    },
    getStyle(curIndex, index) {
      const num = (1 - 0.2 * Math.abs(curIndex - index))
      return 'opacity: ' + Math.max(num, 0.4)
    },
    startClock() {
      //  清理计时器
      if (this.clock) clearTimeout(this.clock)
      const time = this.curPic?.videoUrls?.length ? 5000 : 3000
      this.clock = setTimeout(() => {
        // 清理上一个视频资源
        if (this.$refs.videoDom) {
          this.clearVideo()
        }
        if (this.inViewport) {
          this.bannerGameReport('LZ_storeCurationBannerGameShow', 'pv', this.curPic)
        }
        this.curIndex = this.curIndex + 1 >= this.pgList.length ? 0 : this.curIndex + 1
        this.startClock()
      }, time)
    },
    clearVideo() {
      const video = this.$refs.videoDom
      if (!video || typeof video.pause !== 'function') return
      video.pause()
      video.currentTime = 0
      video.src = null
    },
    bannerGameReport(action, label, item) {
      if (!item) return
      const softInfo = item.softInfo || {}
      const downloadInfo = softInfo.downloadInfo || {}
      const productInfo = softInfo.productInfo || {}
      const communityInfo = item.communityInfo || {}
      const activityPageInfo = item.activityPageInfo || {}
      const relateRankingInfo = item.relateRankingInfo || {}
      let stateGame = 0
      let statePage = 1 // 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),8.立即购买 9.帖子进入
      let gameClass = 0

      if (item.fillDataType === 10) {
        // nn 社区
        stateGame = 0
        statePage = 0
        gameClass = 0
      } else if (item.fillDataType === 11) {
        // 三方链接
        stateGame = 0
        statePage = 0
        gameClass = 0
      } else if (item.fillDataType === 9) {
        // 三方链接
        stateGame = 6
        statePage = 11
        gameClass = 7
      } else if (communityInfo.id) {
        stateGame = 5 // 5 社区
        statePage = 9
        gameClass = 5
      } else if (activityPageInfo.id) {
        stateGame = 6
        statePage = 10
        gameClass = 6
      } else if (relateRankingInfo.id) {
        stateGame = 0
        statePage = 0
        gameClass = 0
      } else if (item.fillDataType === 5) {
        stateGame = 1
        statePage = 0
        gameClass = 3
      } else if (softInfo.softPurpose === 1) {
        stateGame = 4 // 4 cdk
        statePage = 8
        gameClass = 4
      } else if (softInfo.softPurpose === 3) {
        stateGame = 1
        gameClass = 3
        if (!productInfo.userPurchasedStatus) {
          statePage = 8
        }
      } else {
        stateGame = 1
        gameClass = 1 // 1游戏，2工具
        if (Number(softInfo.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          gameClass = 2
        }
        switch (downloadInfo.bizType) {
          case 0:
            stateGame = 1
            break
          case 1:
          case 2:
            stateGame = 2
            break
          case 4:
            stateGame = 3
            break
        }
      }

      if ([1, 2].includes(downloadInfo.bizType)) {
        if (downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
          statePage = 2
        } else if (downloadInfo.userReservationStatus === 1) {
          statePage = 3
        }
      } else if (downloadInfo.bizType === 4) {
        if (downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
          statePage = 4
        } else {
          if (downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
            statePage = 5
          } else if ([1].includes(downloadInfo.userTestApplyStatus)) {
            statePage = 6
          } else if ([2].includes(downloadInfo.userTestApplyStatus)) {
            statePage = 1
          }
        }
      }
      this.$dataReport('LZ_gamingCenter', action, label, {
        detail: JSON.stringify({
          plateName: this.moduleData.rankingLists?.[0]?.name || '',
          skuName: softInfo.softName || communityInfo.name || activityPageInfo.name || relateRankingInfo.name || item.title,
          softID: softInfo.softId || communityInfo.id || activityPageInfo.id || relateRankingInfo.id || item.thirdUrl,
          lenovoid: this.userInfo?.UserID || '',
          stateGame,
          statePage,
          gameClass
        })
      })
    },
    gameReport() {
      let _rankingListPositions = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 2) {
        _moduleName = this.moduleData.rankingLists[0].name

        if (this.moduleData.rankingLists[0].rankingListPositions.length) {
          _rankingListPositions = this.moduleData.rankingLists[0].rankingListPositions.filter(o => [1, 2, 6].includes(o.fillDataType)).map(o => {
            const report = getGameMsgDataReport(o.softInfo)
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
      const _cdk = _rankingListPositions.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
      const _download = _rankingListPositions.map(o => o.name_download).join(',')

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
    magazineReport() {
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 2) {
        if (this.moduleData.rankingLists[0].rankingListPositions.length) {
          if (this.moduleData.rankingLists[0].rankingListPositions.some(o => o.fillDataType === 5)) {
            this.moduleData.rankingLists[0].rankingListPositions.filter(o => [5].includes(o.fillDataType)).map(o => {
              this.$dataReport(
                'LZ_gamingCenter',
                'LZ_storeLegionPlayEnterPageShow',
                'pv',
                {
                  detail: JSON.stringify({
                    firstLocal: this.firstLocal,
                    secondLocal: this.secondLocal,
                    thirdLocal: this.thirdLocal,
                    plateName: this.moduleData.rankingLists[0].name || '',
                    lenovoid: this.userInfo ? this.userInfo.UserID : ''
                  })
                }
              )
            })
          }
        }
      }
    },
    init() {
      this.curIndex = 0
      this.startClock()
      const isFirstIn = sessionStorage.getItem('BIG_BANNER_IS_FIRST_IN')
      if (!isFirstIn) {
        sessionStorage.setItem('BIG_BANNER_IS_FIRST_IN', 1)
        this.gameReport()
        this.magazineReport()
      }
      this.$nextTick(() => {
        this.scrollHandle()
        window.removeEventListener('scroll', this.scrollHandle, true)
        window.addEventListener('scroll', this.scrollHandle, true)
      })
    },
    scrollHandle() {
      const el = document.querySelector('.BigBanner')
      if (el) {
        this.inViewport = isElementInViewport(el) > 0
      }
    }
  },
  mounted() {
    this.init()
  },
  activated() {
    this.init()
  },
  deactivated() {
    sessionStorage.removeItem('BIG_BANNER_IS_FIRST_IN')
    clearTimeout(this.clock)
    // 清理上一个视频资源
    if (this.$refs.videoDom) {
      this.clearVideo()
    }
    window.removeEventListener('scroll', this.scrollHandle, true)
  },
  beforeUnmount() {
    clearTimeout(this.clock)
    // 清理上一个视频资源
    if (this.$refs.videoDom) {
      this.clearVideo()
    }
    window.removeEventListener('scroll', this.scrollHandle, true)
  }
}
</script>
<style lang="scss" scoped>
.pg-navigation {
  width: 280px;
  position: absolute;
  right: 0px;
  top: 53%;
  transform: translateY(-50%);
  text-align: right;

  li {
    cursor: pointer;
    margin: 5px 0;

    .text {
      display: inline-block;
      text-align: right;
      padding: 6px 40px;
      font-size: 16px;
      line-height: 40px;
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 280px;
      overflow: hidden;
      font-weight: 290;
      color: #EAF7FF;
      text-shadow: 0px 5.159px 5.159px rgb(0 0 0 / 25%);
    }

    .text-bac {
      display: none;
    }

    &.selected {
      .wrapper {
        margin: 15px 0;
        position: relative;
        display: inline-block;
        line-height: 0;
        background: linear-gradient(90deg, rgba(7, 6, 22, 0.00)3.01%, rgba(2, 2, 7, 0.70)66.4%, rgba(0, 0, 0, 0.00)118.26%);
      }

      .text {
        font-size: 20px;
        font-weight: 700;
        opacity: 1;
        border-top: 1px solid;
        border-bottom: 1px solid;
        border-image: linear-gradient(to right, rgba(255, 255, 255, 0) 10%, rgb(255, 255, 255) 50%, rgba(255, 255, 255, 0) 90%) 1;
        background: linear-gradient(178deg, #FFF 1.88%, #D1D1D1 98.12%);
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .text-bac {
        display: inline-block;
        font-size: 20px;
        position: absolute;
        top: 1px;
        left: 0px;
        width: 100%;
        height: 100%;
        text-shadow: 0px 4px 4px rgb(0 0 0 / 50%);
        padding: 6px 40px;
        line-height: 40px;
        color: transparent;
        z-index: -1;
        white-space: nowrap;
        max-width: 210px;
        overflow: hidden;
      }
    }
  }
}

.BigBanner {
  position: relative;
  width: 100%;
  height: 600px;
  object-fit: cover;

  .image,
  .video {
    object-fit: cover;
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .top-shadow {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 124px;
    opacity: 0.9;
    background: linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.00) 100%);
  }

  .left-shadow {
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 300px;
    height: 600px;
    opacity: 0.8;
    background: linear-gradient(90deg, #000 0%, rgba(9, 21, 28, 0) 100%);
  }

  .right-shadow {
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 600px;
    opacity: 0.8;
    background: linear-gradient(270deg, #000 0%, rgba(9, 21, 28, 0) 100%);
  }

  .bottom-shadow {
    pointer-events: none;
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 124px;
    background: linear-gradient(0, #000 0, rgba(0, 0, 0, 0) 100%);
  }
}

.info-wrap {
  position: absolute;
  bottom: 94px;
  left: 40px;

  .info-title {
    display: flex;
    align-items: baseline;
  }

  .tag-img {
    margin-left: 10px;
  }

  .name {
    position: relative;
    margin-bottom: 16px;
    z-index: 0;

    i {
      font-family: "Microsoft YaHei";
      font-size: 36px;
      line-height: 36px;
      font-style: normal;
      font-weight: 700;
    }

    i.text {
      max-width: 360px;
      background: linear-gradient(178deg, #FFF 1.88%, #D1D1D1 98.12%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    i.text-shadow {
      z-index: -1;
      position: absolute;
      top: 0;
      left: 0;
      font-size: 36px;
      text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.50);
      color: transparent;
    }
  }

  .info {
    color: rgba(234, 247, 255, 0.80);
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.40);
    font-size: 12px;
    margin-bottom: 10px;
    line-height: 12px;
  }

  .tag-wrap-2 {
    display: flex;
    align-items: center;
  }

  .tags-wrap {
    margin-bottom: 14px;
    height: 20px;
    display: flex;

    .tag {
      position: relative;
      margin-right: 8px;
      padding: 2px 8px 4px 8px;
      border: 1px solid rgba(234, 247, 255, 0.2);

      .text {
        position: relative;
        display: inline-block;
        font-size: 12px;
        font-weight: 700;
        color: #EAF7FF;
        background: linear-gradient(178deg, #929292 1.88%, #eaf7ff 98.12%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
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

  p.cdk {
    display: flex;
    align-items: center;
    overflow: hidden;

    >span.discount {
      background-color: #F24A44;
      font-size: 12px;
      color: #EAF7FF;
      font-weight: bold;
      line-height: 1;
      box-sizing: content-box;
      padding: 3px 6px;
      margin-right: 8px;
    }

    >span.currentPrice {
      font-size: 12px;
      color: #EAF7FF;
      font-weight: bold;
      margin-right: 6px;
      padding-bottom: 1px;
    }

    >span.originalPrice {
      font-size: 11px;
      color: rgba(234, 247, 255, 0.6);
      text-decoration: line-through;
      margin-right: 16px;
    }

    >span.platform {
      width: 14px;
      height: 14px;
      font-size: 14px;
      color: rgba(234, 247, 255, 0.4);
    }
  }

  .auth-icon {
    height: 20px;
    margin-right: 6px;
    margin-bottom: 12px;
  }
}

.btn-wrap {
  margin-top: 30px;
  display: flex;
  align-items: center;
  .download-btn {
    position: relative;
    z-index: 2;
  }

  .buy-information {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 6px 12px 6px 32px;
    //  background-color: rgba(48, 53, 61);
    font-size: 12px;
    position: relative;
    left:-30px;
    backdrop-filter: blur(10px);
    // background-color: rgba(234, 247, 255, 0.08);

    .discount-class {
      height: 18px;
      padding: 0 4px;
      line-height: 18px;
      border-radius: 1px;
      text-align: center;
      background: #F24A44;
      font-weight: 700;
      color: #fff;
      margin-right: 6px;
    }

    .orgin-price-class {
      opacity: 0.3;
      text-decoration: line-through 1px rgba(234, 247, 255, );
      /* 删除线：类型 粗细 颜色 */
      margin-left: 4px
    }

    .current-price-class {
      font-weight: 700;
    }
  }
}

.pad-device-nav {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;

  li {
    margin: 0 6px;
    cursor: pointer;
    width: 18px;
    height: 6px;
    background: linear-gradient(90deg, #929292 0%, rgb(234 247 255 / 50%) 100%);
    display: inline-block;
    transition: opacity 0.3s;
    transform: skew(-45deg, 0);

    &.selected {
      width: 20px;
      background: linear-gradient(90deg, #CACACA 0%, #EDF8FF 100%);
    }
  }
}

@media screen and (max-width: 850px) {
  .BigBanner {
    height: 427px;
  }
}

.pg-navigation li:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.video:focus-visible,
.image:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

@media (forced-colors: active) {
  .pg-navigation li:focus-visible {
    outline: 2px solid Highlight;
  }
  .video:focus-visible,
  .image:focus-visible {
    outline: 2px solid Highlight;
  }
}

</style>
