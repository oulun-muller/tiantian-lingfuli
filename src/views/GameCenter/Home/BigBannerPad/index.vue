<template>
  <div class="big-banner-pad BigBanner">
    <swiper v-if="pgList.length" ref="swiper" :options="swiperOption">
      <swiper-slide v-for="(curPic, k) in pgList" :key="k" class="swiper-slide">
        <video
          v-if="curPic.videoUrls && curPic.videoUrls[0]"
          ref="videoDom"
          :src="curPic.videoUrls[0]"
          :poster="curPic.imgUrls[0]"
          loop
          muted
          autoplay
          class="video"
          @click="goToDetail(curPic)"
          :style="{ width: liWidth + 'px' }"></video>
        <img
          v-else
          :src="curPic.imgUrls[0]"
          class="image"
          @click="goToDetail(curPic)"
          :style="{ width: liWidth + 'px' }" />
        <div class="info-wrap">
          <div class="text-info">
            <h3 class="name"><i class="text">{{ curPic.title }}</i>
              <!-- <i class="text-shadow">{{ curPic.title }}</i> -->
            </h3>
            <p class="info" v-if="curPic.description">{{ curPic.description }}</p>
            <div v-if="curPic.softInfo && curPic.softInfo.downloadInfo && curPic.softInfo.downloadInfo.tagUrls.length">
              <img
                v-for="(url, index) in curPic.softInfo.downloadInfo.tagUrls.slice(0, 3)"
                class="auth-icon"
                :key="index"
                :src="url" />
            </div>
            <div class="tags-wrap" v-if="tagList(curPic).length">
              <div v-for="(rankItem, key) in tagList(curPic)" :key="key" class="tag">
                <div class="text">
                  <template v-if="rankItem.labelName">
                    {{ rankItem.labelName }}TOP{{ rankItem.num }}
                  </template>
                  <template v-else>
                    {{ rankItem }}
                  </template>
                </div>
              </div>
            </div>
          </div>
          <p class="btn-wrap">
            <GameDownloadButton
              v-if="isDownloadGame(curPic)"
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
          </p>
        </div>
        <div class="bottom-shadow"></div>
      </swiper-slide>
    </swiper>
    <ul v-if="pgList.length > 1" class="pad-device-nav">
      <li v-for="(item, index) in pgList" :key="index" :class="[curIndex === index ? 'selected' : '']">
      </li>
    </ul>
  </div>
</template>
<script>
const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect()
  // elOffsetBottom 指目标元素的头顶部距离 可视区底部的距离  也就是 目标元素从底部出现向上滚动多少出现动画 可配置
  return (window.innerHeight || document.documentElement.clientHeight) + rect.top
}
import GameDownloadButton from '@/components/GameDownloadButton'
import { swiper, swiperSlide } from '@/compat/swiper' // 注意小写
import 'swiper/swiper-bundle.css' // Swiper 4.x 样式路径

export default {
  name: 'BigBannerPad',
  data() {
    const vm = this
    return {
      liWidth: 0,
      curIndex: 0,
      clock: null,
      thirdLocal: '',
      inViewport: false,
      swiperOption: {
        autoplay: {
          delay: 5000,
          disableOnInteraction: false,
          waitForTransition: true,
          pauseOnMouseEnter: false
        },
        on: {
          slideChange: function() {
            // 这里的 this 是 Swiper 实例
            vm.curIndex = this.realIndex
          }
        }
      }
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
    swiper,
    swiperSlide
  },
  computed: {
    swiper() {
      return this.$refs.swiper?.swiper || null
    },
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
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
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
    // curPic() {
    //   return this.moduleData.rankingLists[0]?.rankingListPositions[this.curIndex]
    // },
    tagList() {
      // 游戏榜单标签或游戏标签；优先展示榜单标签，最多展示2个
      return (item) => {
        if (item.fillDataType === 1 || item.fillDataType === 2) {
          const showInfoObj = item?.softInfo?.showInfo || {}
          return (showInfoObj.rankingLabelInfos || []).concat(showInfoObj.softLabels || []).slice(0, 2)
        }
        return []
      }
    },
    isCDKGame() {
      return (item) => {
        return item.fillDataType === 1
      }
    },
    isDownloadGame() {
      return (item) => {
        return [2, 6].includes(item.fillDataType)
      }
    }
  },
  methods: {
    goToDetail(curPic) {
      if (!curPic) return
      this.bannerGameReport('LZ_storeCurationBannerGameClick', 'click', curPic)
      const usedForReport = this.moduleData.rankingLists?.[0].name || ''
      const softInfo = curPic.softInfo || {}
      const relateRankingInfo = curPic.relateRankingInfo || {}
      const communityInfo = curPic.communityInfo || {}
      const activityPageInfo = curPic.activityPageInfo || {}
      // 1-游戏CDK、2-游戏下载、3-游戏中心榜单（跳转到其他榜单列表、4-社区
      switch (curPic.fillDataType) {
        case 1:
        case 2:
        case 6:
          if (!softInfo.softId) return
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: softInfo.softId },
            query: {
              source_p: 'PAD2',
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
              source_p: 'PAD2',
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
              source_p: 'PAD2',
              firstLocal: this.firstLocal,
              secondLocal: 11,
              plateNameReport: usedForReport
            }
          })
          break
      }
    },
    getStyle(curIndex, index) {
      const num = (1 - 0.2 * Math.abs(curIndex - index))
      return 'opacity: ' + Math.max(num, 0.4)
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

      if (communityInfo.id) {
        stateGame = 5 // 5 社区
        statePage = 9
        gameClass = 5
      } else if (activityPageInfo.id) {
        stateGame = 6
        statePage = 0
        gameClass = 0
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
          skuName: softInfo.softName || communityInfo.name || activityPageInfo.name || relateRankingInfo.name,
          softID: softInfo.softId || communityInfo.id || activityPageInfo.id || relateRankingInfo.id,
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
          _rankingListPositions = this.moduleData.rankingLists[0].rankingListPositions.filter(o => [1, 2].includes(o.fillDataType)).map(o => {
            let _bizType = 1
            if ([1, 2].includes(o.softInfo.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
              _bizType = 2
            } else if (o.softInfo.downloadInfo.bizType === 4) {
              _bizType = 3
            }

            let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
            if ([1, 2].includes(o.softInfo.downloadInfo.bizType)) {
              if (o.softInfo.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
                buttonType = 2
              } else if (o.softInfo.downloadInfo.userReservationStatus === 1) {
                buttonType = 3
              }
            } else if (o.softInfo.downloadInfo.bizType === 4) {
              if (o.softInfo.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
                buttonType = 4
              } else {
                if (o.softInfo.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                  buttonType = 5
                } else if ([1].includes(o.softInfo.downloadInfo.userTestApplyStatus)) {
                  buttonType = 6
                } else if ([2].includes(o.softInfo.downloadInfo.userTestApplyStatus)) {
                  buttonType = 1
                }
              }
            }

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
      const _download = _rankingListPositions.filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

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
      // 确保Swiper初始化后自动播放开始
      this.$nextTick(() => {
        if (this.swiper && this.swiper.autoplay) {
          this.swiper.autoplay.start()
        }
      })
      this.liWidth = document.documentElement.clientWidth
      // this.startClock()
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

        window.removeEventListener('orientationchange', this.resizeHandle)
        window.addEventListener('orientationchange', this.resizeHandle)

        window.removeEventListener('resize', this.resizeHandle)
        window.addEventListener('resize', this.resizeHandle)
      })
    },
    resizeHandle() {
      // 更新swiper以适应新的屏幕尺寸
      if (this.swiper) {
        this.swiper.update()
        // 如果需要，也可以更新swiper的其他属性
        this.swiper.updateSize()
        this.swiper.updateSlides()
        this.liWidth = document.documentElement.clientWidth
      }
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
    const videoList = this.$refs?.videoDom
    videoList?.forEach((video) => {
      if (video) {
        video.pause()
        video.currentTime = 0
        video.src = null
      }
    })
    window.removeEventListener('scroll', this.scrollHandle, true)
  },
  beforeUnmount() {
    clearTimeout(this.clock)
    // 清理上一个视频资源
    const videoList = this.$refs?.videoDom
    videoList?.forEach((video) => {
      if (video) {
        video.pause()
        video.currentTime = 0
        video.src = null
      }
    })
    window.removeEventListener('scroll', this.scrollHandle, true)
    window.removeEventListener('orientationchange', this.resizeHandle)
    window.removeEventListener('resize', this.resizeHandle)
  }
}
</script>
<style lang="scss" scoped>
.swiper {
  max-height: 427px;
  margin-bottom: 50px;
}

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
  height: 43.37vw;
  max-height: 427px;
  object-fit: cover;
  margin-bottom: 50px;

  .image,
  .video {
    object-fit: cover;
    // position: absolute;
    // width: 100%; // 修改为100%，确保与屏幕同宽
    width: 100% !important;
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
    height: 43.37vw;
    max-height: 600px;
    opacity: 0.8;
    background: linear-gradient(90deg, #000 0%, rgba(9, 21, 28, 0) 100%);
  }

  .right-shadow {
    pointer-events: none;
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 43.37vw;
    max-height: 600px;
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
  z-index: 2;
  position: absolute;
  bottom: 25px;
  left: 20px;
  width: calc(100% - 40px);
  display: flex;
  justify-content: space-between;
  align-items: end;

  .name {
    position: relative;
    margin-bottom: 16px;
    z-index: 0;

    i {
      font-family: "Microsoft YaHei";
      font-size: 3.37vw;
      line-height: 3.37vw;
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
    color: #EAF7FF;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.40);
    font-size: 14px;
    margin-bottom: 16px;
    line-height: 14px;
  }

  .tags-wrap {
    height: 25px;
    line-height: 25px;
    display: flex;
    align-items: center;

    .tag {
      position: relative;
      margin-right: 8px;
      padding:  0px 8px;
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
    height: 24px;
    margin-right: 6px;
    margin-bottom: 12px;
  }
}

.btn-wrap {
  margin-top: 30px;
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
    width: 12px;
    height: 4px;
    background: linear-gradient(90deg, #929292 0%, rgb(234 247 255 / 50%) 100%);
    display: inline-block;
    transition: opacity 0.3s;
    transform: skew(-45deg, 0);

    &.selected {
      background: linear-gradient(90deg, #CACACA 0%, #EDF8FF 100%);
    }
  }
}

.swiper-wrapper {
  width: 100%;
  height: 450px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.swiper-slide {
  width: 100%; // 确保每个幻灯片都是100%宽度
  height: 53.37vw;
  max-height: 427px;
  position: relative;
}

.slide-image {
  height: 100%;
  object-fit: cover;
}

.bottom-shadow {
  pointer-events: none;
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 124px;
  background: linear-gradient(0, #000 0, rgba(0, 0, 0, 0) 100%);
  z-index: 1;
}

@media screen and (max-width: 850px) {
  .BigBanner {
    height: 53.37vw;
    max-height: 427px;
    margin-bottom: 24px;
  }
}

@media screen and (min-width: 850px) {
  .info-wrap .text-info .name .text {
    font-size: 36px;
    line-height: 36px;
  }
}

.PhoneDevice {

  .info-wrap .name {
    margin-bottom: 10px;

    i {
      font-size: 20px;
      font-weight: 700;
      //  text-shadow: 0 4px 4px rgba(0, 0, 0, 0.50);
      margin-bottom: 11px;

     filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.50));
    }
  }

  .info {
    font-size: 12px;
    margin-bottom: 10px;
  }

  .info-wrap {
    bottom: 22px;
    .tags-wrap {
      height: 22px;
      .text {
        height: 100%;
        top:  -2px;
      }
    }
  }

  .pad-device-nav {
    bottom: -12px;
    li {
      width: 8px;
          &.selected {
      width: 10px;
      height: 4px;
    }
    }
  }

  .info-wrap .tags-wrap .tag .text {
    font-weight: 400;
  }
}
</style>
