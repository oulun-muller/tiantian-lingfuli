<template>
  <div class="MediaStage">
    <div class="swiper-scroll-wrapper">
      <!-- <div class="header-back-mask"></div> -->
      <!-- <swiper ref="swiper" @slideChangeTransitionEnd="onChange" class="swiper-container1" :style="{ aspectRatio: trailerList.length ? '20 / 11' : 'auto' }">
        <swiper-slide v-for="(item, videoIndex) in trailerList" :key="videoIndex" class="video-swipe">
          <video
            ref="videoDom"
            class="img-video-class"
            :poster="item.poster"
            :src="item.url"
            muted
            autoplay
            loop />
        </swiper-slide>
        <swiper-slide v-for="(item, videoIndex) in radioList" :key="videoIndex" class="video-swipe">
          <video
            ref="videoDom"
            class="img-video-class"
            :poster="item.poster"
            :src="item.url"
            muted
            autoplay
            loop />
        </swiper-slide>
        <swiper-slide>
          <swiper ref="imgSwiper" :options="imageSwiperOptions" @slideChangeTransitionEnd="onChange(1)">
            <swiper-slide v-for="(item, pIndex) in pictureList" :key="pIndex" class="img-swipe">
              <img :src="item.url" alt="" class="swiper-img">
            </swiper-slide>
          </swiper>
        </swiper-slide>
      </swiper> -->
      <div class="swiper-wrapper" @scroll="scrollHandle" ref="swiperScroll">
        <div v-for="(item,index) in allList" :key="index" class="scroll-item">
          <video
            ref="videoDom"
            v-if="item.type === 'video'"
            class="video-swipe"
            :poster="item.poster"
            :src="item.url"
            muted
            autoplay
            loop />
          <img ref="imgDom" v-else-if="item.type === 'image'" :src="item.url" alt="" class="img-class">
        </div>
      </div>
      <ul class="pad-device-nav" v-if="allList.length > 1">
        <li v-for="(item, index) in allList" :key="index" :class="[currentIndex === index ? 'selected':'']">
        </li>
      </ul>
    </div>
    <div class="tab-header" v-if="showAllTab">
      <div
        v-if="lengthList[0]"
        class="item-class"
        :class="{ 'item-class-active': isTabActive === 1 }"
        @click.stop="tabClick(0)"><span>宣传片</span> <span class="num-class" v-if="lengthList[0] > 1">{{ lengthList[0]
        }}</span></div>
      <div
        v-if="lengthList[1]"
        class="item-class"
        :class="{ 'item-class-active': isTabActive === 2 }"
        @click.stop="tabClick(1)"><span>真机试玩</span> <span class="num-class" v-if="lengthList[1] > 1">{{ lengthList[1]
        }}</span></div>
      <div
        v-if="lengthList[2]"
        class="item-class"
        :class="{ 'item-class-active': isTabActive === 3 }"
        @click.stop="tabClick(2)"><span v-if="lengthList[2]">图集</span> <span
          class="num-class"
          v-if="lengthList[2] > 1">{{
            lengthList[2] }}</span></div>
    </div>
    <div class="header-text-item" :style="{padding: '0 30px'}">
      <div class="header-mask">
        <section>
          <h1>{{ detail.softName }}</h1>
          <div class="auth-tags">
            <template v-if="detail.softPurpose !== 2">
            <!-- <span v-if="detail.currentTimeActivity" class="limit">{{ detail.currentTimeActivity.endTime |
              timeLeft(serverCurrentTime) }}</span>
            <span v-else-if="detail.showInfo.ruleLabelName" :class="detail.showInfo.ruleLabelClassName">{{
              detail.showInfo.ruleLabelName }}</span> -->
            </template>
            <template v-if="detail.downloadInfo.tagUrls.length || detail.showInfo.softLabels.length">
              <img
                v-for="(url, index) in detail.downloadInfo.tagUrls.slice(0, 1)"
                class="tag-icon"
                :key="index"
                :src="url" />
              <div class="tags" v-if="detail.showInfo.softLabels.length">
                <span
                  v-for="(softLabel, index) of detail.showInfo.softLabels.slice(0, 3)"
                  :key="index"
                  @click.stop="clickGameLibrary(softLabel)">{{ softLabel }}</span>
              </div>
            </template>
          </div>
          <div v-if="detail.softPurpose === 1" class="price">
            <b></b>
            <aside>
              <span v-if="detail.productInfo.discount" class="discount">{{ detail.productInfo.discount }}</span>
              <span class="currentPrice">¥{{ detail.productInfo.currentPrice }}</span>
              <span v-if="detail.productInfo.discount && detail.productInfo.originalPrice" class="originalPrice">¥{{
                detail.productInfo.originalPrice }}</span>
            </aside>
          </div>
          <div class="list">
            <ol>
              <li v-if="detail.softDesc.positiveReviewRate || detail.expectations" class="positiveReviewRate">
                <section @click="scrollToComment">
                  <div class="recommand-num num-family">
                    <template v-if=" detail.downloadInfo.bizType === 0 && detail.softDesc.positiveReviewRate">
                      <i> {{ detail.softDesc.positiveReviewRate }}</i>
                      <i class="symbol-100-1">%</i>
                    </template>
                    <template v-else-if="[1, 2].includes(detail.downloadInfo.bizType) && detail.expectations">
                      {{ fixedNum }}
                    </template>
                  </div>
                  <div class="recommand-header">
                    <img
                      class="img-class"
                      src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/14/75d2e276-adda-499e-976f-1c05cd63d526.png" />
                    <template v-if="detail.downloadInfo.bizType === 0 && detail.softDesc.positiveReviewRate">
                      <p class="text">推荐率</p>
                    </template>
                    <template v-else-if="[1, 2].includes(detail.downloadInfo.bizType) && detail.expectations">
                      <p class="text">期待值</p>
                    </template>
                    <img
                      class="img-class"
                      src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/14/07acd792-c574-42cd-8383-bdf968337c64.png">

                  </div>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="detail.softPurpose === 2 && rankingItem" class="ranking">
                <section @click.stop="clickRank(rankingItem)">
                  <p>TOP&nbsp;{{ rankingItem.num }}</p>
                  <p>{{ rankingItem.labelName }}</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="detail.softPurpose === 2 && detail.showInfo.installFileSize">
                <section>
                  <p>{{ detail.showInfo.installFileSize }}</p>
                  <p>文件大小</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="detail.firstClassId === '2001'">
                <section>
                  <p>{{ detail.softDesc.version }}</p>
                  <p>版本号</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li
                v-if="detail.softPurpose === 2 && detail.downloadInfo.bizType === 0 && detail.downloadInfo.downloadCount">
                <section>
                  <p>{{ detail.downloadInfo.downloadCount.slice(0, -2) }}</p>
                  <p>下载次数</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="[1, 2].includes(detail.downloadInfo.bizType) && detail.downloadInfo.reservationCount">
                <section>
                  <p>{{ detail.downloadInfo.reservationCount }}</p>
                  <p>预约人数</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="detail.productInfo.exchangePlatform" class="exchange">
                <section>
                  <p>
                    <i class="iconfont" v-html="detail.productInfo.exchangePlatformFont"></i>{{
                      detail.productInfo.exchangePlatform }}
                  </p>
                  <p>游戏平台</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="detail.firstClassId === '2001'">
                <section>
                  <p>{{ detail.firstSyncTime.replace(/^(\d{1,4}-\d{1,2}-\d{1,2}).*$/, '$1') }}</p>
                  <p>更新时间</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="![1, 2].includes(detail.downloadInfo.bizType) && detail.softDesc.followerCount">
                <section>
                  <p>{{ detail.softDesc.followerCount }}</p>
                  <p>关注人数</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
              <li v-if="[1, 2].includes(detail.downloadInfo.bizType) && detail.downloadInfo.expectedReleaseTime">
                <section>
                  <p>{{ detail.downloadInfo.expectedReleaseTime }}</p>
                  <p>上线时间</p>
                </section>
                <i class="banner-i-devier"></i>
              </li>
            </ol>
            <div class="list-right" v-if="!$isPadDevice">
              <GameDownloadButton
                v-if="[2, 3].includes(detail.softPurpose)"
                button-style="rect"
                :download-info="detail.downloadInfo"
                :soft-desc="detail.softDesc"
                :soft-id="detail.softId"
                :soft-purpose="detail.softPurpose"
                :product-info="detail.productInfo"
                :user-purchased-status="detail.productInfo.userPurchasedStatus"
                :version="detail.softDesc.version"
                :soft-name="detail.softName"
                :logo-file="detail.showInfo.logoFile"
                :fast-install="detail.showInfo.isFastInstall"
                :drinfo="drinfo"
                text="立即安装"
                :is-click="true"
                :sku-id="detail.skuId"
                ref="GameDownloadButton" />
              <button v-else ref="ShowPay" @click.stop="showPay">立即购买</button>
              <div class="followers" v-if="![1, 2].includes(detail.downloadInfo.bizType)" @click.stop="toFollowers">
                <img v-if="isFollower" src="@/images/gamecenter/concern-normal-new.png" alt="">
                <img v-else src="@/images/gamecenter/concern-active-new.png" alt="">
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'

const typeList = ['宣传片', '真机试玩', '图集']
export default {
  name: 'MediaStage',
  components: {
    GameDownloadButton
  },
  props: {
    detail: {
      type: Object,
      default() {
        return {}
      }
    },
    rankingItem: {
      type: Object,
      default() {
        return {}
      }
    },
    isFollower: {
      type: Boolean,
      default: false
    },
    imgVideoList: {
      type: Array,
      default() {
        return []
      }
    },
    drinfo: { // 数据上报附加信息
      type: String,
      default: ''
    },
    clickGameLibrary: {
      type: Function,
      default() {
        return () => { }
      }

    },
    scrollToComment: {
      type: Function,
      default() {
        return () => { }
      }

    },
    showPay: {
      type: Function,
      default() {
        return () => { }
      }

    },
    toFollowers: {
      type: Function,
      default() {
        return () => { }
      }

    }
  },
  data() {
    return {
      currentIndex: 0,
      allList: [],
      lengthList: [0, 0, 0],
      showAllTab: true,
      // preTab: -1,
      // trailerList: [],
      // pictureList: [],
      // radioList: [],
      widthList: []
      // imageSwiperOptions: {
      //   // 禁止循环，确保滚动距离精确
      //   loop: false,
      //   // 每次滚动一个slide
      //   slidesPerView: 'auto',
      //   spaceBetween: 15,
      //   slidesPerGroup: 1,
      //   // 不允许部分显示
      //   //  watchSlidesProgress: true,
      //   // 启用自由模式但锁定轴向
      //   //  freeMode: true,
      //   freeModeSticky: true,
      //   freeModeMomentumRatio: 0.2,
      //   freeModeMomentumBounceTime: 100,
      //   // 横向滚动
      //   direction: 'horizontal',
      //   // 鼠标滚轮控制
      //   mousewheel: {
      //     enabled: true,
      //     sensitivity: 1,
      //     // 确保每次滚动一个图片宽度
      //     releaseOnEdges: true
      //   },
      //   // 触摸滑动也固定距离
      //   touchReleaseOnEdges: true
      // }
    }
  },
  beforeUnmount() {
    const videos = Array.isArray(this.$refs.videoDom) ? this.$refs.videoDom : [this.$refs.videoDom]
    videos.forEach(video => {
      if (!video || typeof video.pause !== 'function') return
      video.pause()
      video.currentTime = 0
      video.src = null
    })
  },
  computed: {
    isTabActive() {
      const indx = this.currentIndex

      if (indx < this.lengthList[0] && indx > -1) {
        return 1
      } else if (indx < (this.lengthList[1] + this.lengthList[0]) && indx > (this.lengthList[0] - 1)) {
        return 2
      } else if (indx < (this.lengthList[2] + this.lengthList[1] + this.lengthList[0])) {
        return 3
      }
      return 0
    },
    fixedNum() {
      if (this.detail.expectations) {
        return parseFloat(this.detail.expectations).toFixed(1)
      }
      return ''
    }
  },
  mounted() {
    const trailerList = this.detail.softDesc.mediaList.filter(item => item.type === 'video') || []
    const radioList = this.detail.trialVideos.map(iterator => {
      return {
        url: iterator.videoUrl,
        type: 'video'
      }
    }) || []
    const pictureList = this.detail.softDesc.mediaList.filter(item => item.type === 'image') || []
    this.lengthList[0] = trailerList?.length || 0
    this.lengthList[1] = radioList?.length || 0
    this.lengthList[2] = pictureList?.length || 0
    // this.trailerList = trailerList
    // this.pictureList = pictureList
    // this.radioList = radioList
    this.allList = [
      ...trailerList,
      ...radioList,
      ...pictureList
    ]
    this.showAllTab = this.lengthList.filter(item => item > 0).length > 1
    this.getGameHouseList()
  },
  methods: {
    onChange(type) {
      if (type) {
        this.currentIndex = this.$refs.imgSwiper.swiper.realIndex + (this.$refs.swiper.swiper.realIndex || 0)
      } else {
        this.currentIndex = this.$refs.swiper.swiper.realIndex
      }
    },
    scrollHandle(e) {
      // 清除之前的定时器
      clearTimeout(this.scrollDebounceTimer)

      // 设置新的防抖定时器
      this.scrollDebounceTimer = setTimeout(() => {
        const scrollLeft = e.target.scrollLeft
        let currentLeft = 0
        const allLenght = this.widthList.reduce((accumulator, current) => accumulator + current, 0)
        const innerWeight = window.innerWidth
        if (scrollLeft + innerWeight > allLenght - 1) {
          this.currentIndex = this.allList?.length - 1 || 0
          return
        }
        for (let i = 0; i < this.widthList.length; i++) {
          const item = this.widthList[i]
          currentLeft = currentLeft + item
          if (scrollLeft < currentLeft) {
            this.currentIndex = i
            break
          } else if (i === this.widthList.length - 1) {
            this.currentIndex = i
          }
        }
      }, 200)
    },
    getGameHouseList() {
      setTimeout(() => {
        const videoWidth = this.$refs?.videoDom?.[0]?.offsetWidth
        const imgWidth = this.$refs?.imgDom?.[0]?.offsetWidth
        this.widthList = this.allList.map(item => {
          if (item.type === 'video') {
            return videoWidth + 10
          } else {
            return imgWidth
          }
        })
      }, 1000)
    },

    // scrollList(type) {
    //   if (type && this.currentIndex < this.allList.length - 1) {
    //     this.currentIndex++
    //   }
    //   if (!type && this.currentIndex > 0) {
    //     this.currentIndex--
    //   }
    //   if (this.preTab !== this.isTabActive) {
    //     this.preTab = this.isTabActive
    //     this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailPreviewImageTabShow', 'pv', {
    //       name: typeList[this.preTab - 1] || ''
    //     })
    //   }
    //   return
    // },
    clickRank(item) {
      this.$router.push({
        name: 'RankList',
        query: {
          source_p: 'PAD1',
          tab: item.labelCode
        }
      })
    },
    tabClick(index) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailPreviewImageTabShow', 'pv', {
        name: typeList[index] || ''
      })
      this.currentIndex = this.sumUpTo(index)

      if (this.$refs.swiperScroll) {
        const left = this.widthList.slice(0, this.currentIndex).reduce((a, b) => a + b, 0) || 0
        this.$refs.swiperScroll.scrollLeft = left
      }
    },
    sumUpTo(index) {
      if (index <= 0) return 0
      if (index > this.lengthList.length) index = this.lengthList.length
      return this.lengthList.slice(0, index).reduce((a, b) => a + b, 0)
    }

  }
}
</script>

<style lang="scss" scoped>
.MediaStage {
  width: 100%;
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease;
  margin-bottom: 20px;

  .swiper-scroll-wrapper {
        position: relative;
  }
  // .header-back-mask {
  //   position: absolute;
  //   z-index: 4;
  //   bottom: 0;
  //   width: 100%;
  //   height: 120px;
  //   background: linear-gradient(to Top, rgba(0, 0, 0, 0.60) 0%, rgba(0, 0, 0, 0.00) 100%);
  // }

  .swiper-wrapper {
    background-color: #191E2C;
    max-height: 500px;
    position: relative;
    width: 100%;
    height: 100%;
    overflow-x: scroll;
    display: flex;
    align-items: center;
      .video-swipe {
        width: 100vw;
          // aspect-ratio: 20/ 11;
      }
      .img-class {
        // width: 31vw;
        // aspect-ratio: 248 / 440;
        max-height: 500px;
        width: auto;
        object-fit: cover;
      }
      .scroll-item {
        max-height: 100%;
        margin-right: 10px;
        &:last-child {
          margin-right: 0;

        }
      }
      // .img-swipe {
      //   width: auto !important;
      //   height: 100%;
      // }
  }

  // .swiper-container1 {
  //     // aspect-ratio: 20 / 11;
  //     .video-swipe {
  //       width: 100% !important;
  //       height: 100%;
  //     }
  //     .img-swipe {
  //       width: auto !important;
  //       height: 100%;
  //     }

  // }

 .img-video-class{
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
        .swiper-img {
        //  width: 200px;
        height: 100%;
            object-fit: cover;
        aspect-ratio: 31 / 50;
      }

  >img {
    object-position: 0 0;
  }

  .tab-header {
    position: absolute;
    z-index: 5;
    top: 80px;
    left: 50%;
    height: 32px;
    backdrop-filter: blur(100px);
    border: 1px solid rgba(234, 247, 255, 1);
    background: rgba(202, 202, 202, 0);
    transform: skewX(-12deg) translate(-50%, 50%) !important;
    display: flex;
    align-items: center;
    color: #EAF7FF;
    cursor: pointer;

    .item-class {
      width: 88px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      font-size: 14px;

      span {
        display: inline-block;
        transform: skewX(12deg);
      }
    }

    .num-class {
      vertical-align: -1px;
    }

    .item-class-active {
      background-color: #fff;
      color: #000 !important;
    }
  }
}

.header-text-item {
  margin-top: -70px;
  position: relative;
  z-index: 5;
}

.header-mask {
  position: relative;
  margin: 20px 0;
  width: 100%;
  height: 164px;
  padding: 18px 24px 20px;
   pointer-events: none;
   border-radius: 8px;
   backdrop-filter: blur(100px);
   background-color: rgba(255, 255, 255, 0.03);

        .positiveReviewRate {
          display: flex;
            height: 48px;
            // width: 80px;

          // .banner-i-devier {
          //   display: inline-block;
          //   border: 1px solid rgba(255, 255, 255, 0.15);
          //   width: 0;
          //   height: 32px;
          //   margin: 12px 19px 12px;
          //   transform: skewX(-12deg);
          // }

            section {
              .recommand-num {
                background: linear-gradient(180deg, #FFD86B 0%, #EFD672 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 700;
                font-size: 18px;
                height: 18px;
              //  line-height: 24px;
                text-align: center;
                margin: 0 auto;

                .symbol-100-1 {
                  margin-left: -3px;
                  font-size: 18px;

                }

              }
            }

            >i {
              margin-top: 14px;
            }

            .recommand-header {
              display: flex;
              align-items: baseline;
              height: 18px;

              .text {
                font-size: 12px;
                background: linear-gradient(180deg, #FFD86B 0%, #EFD672 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 3px;
              }

              .img-class {
                height: 100%;
                object-fit: cover;
              }
            }
     }

  // &::after {
  //   position: absolute;
  //   left: 0;
  //   bottom: 0;
  //   content: '';
  //   width: 100%;
  //   height: 100%;
  //   background: linear-gradient(180deg, rgba(15, 10, 8, 0.00) 0%, rgba(0, 0, 0, 1) 60%);
  //   backdrop-filter: blur(2px);
  // }

  section {
    height: 100%;
    max-width: 1440px;
    margin: 0 auto;
    position: relative;

    >h1 {
      width: calc(100% - 40px);
      // position: absolute;
      // left: 40px;
      // top: 0px;
      color: #FFF;
    //  font-size: 24px;
    font-size: 32px;
    line-height: 35px;
      font-style: normal;
      font-weight: 700;
      letter-spacing: 1px;
      z-index: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    div.auth-tags {
      width: calc(100% - 80px);
      margin-top: 12px;
      display: flex;
      align-items: center;

      >span {
        z-index: 2;
        font-size: 11px;
        font-style: italic;
        color: #FFFFFF;
        font-weight: bold;
        line-height: 1;
        box-sizing: content-box;
        padding: 4px 21px 6px 19px;
        text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.31);
        border: 1px solid transparent;
        background-origin: border-box;
        background-clip: padding-box, border-box;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-image: linear-gradient(0deg, #0C9B34, #0C9B34), linear-gradient(135deg, #4AD370 7.43%, #0C8E30 94.88%);

        &.hot {
          background-image: linear-gradient(0deg, #EB2051, #EB2051), linear-gradient(135deg, #FF5981 7.43%, #A9062E 94.88%);
        }

        &.lowest {
          background-image: linear-gradient(0deg, #2420EB, #2420EB), linear-gradient(135deg, #6B68FF 7.43%, #13119A 94.88%);
        }

        &.limit {
          background-image: linear-gradient(0deg, #7D1BF9, #7D1BF9), linear-gradient(135deg, #B275FF 7.43%, #4C0E9B 94.88%);
        }
      }

      .tag-icon {
        height: 22px;
        margin-right: 6px;

        &:last-child {
          margin-right: 0;
        }
      }

      >div.tags {
        height: 22px;

        >span {
          display: inline-block;
          height: 100%;
          line-height: 11px;
          border: 0.5px solid rgba(255, 255, 255, 0.2);
          background: rgba(0, 0, 0, 0.20);
          backdrop-filter: blur(5px);
          margin-right: 6px;
          padding: 6px;
          color: #EAF7FF;
          font-size: 12px;
          font-style: normal;
          font-weight: 480;
          text-transform: capitalize;
          cursor: pointer;
          opacity: 0.7;
        }
      }
    }

    >div.price {
      width: calc(100% - 80px);
      position: absolute;
      left: 40px;
      top: 89px;
      display: flex;
      align-items: center;
      z-index: 2;
      padding-right: 10px;
      box-sizing: border-box;

      >b {
        display: inline-block;
        flex: 1;
      }

      >aside {
        width: 238px;
        display: inline-block;
        display: flex;
        align-items: center;

        >span.discount {
          background-color: #F24A44;
          font-size: 14px;
          color: #EAF7FF;
          font-weight: 600;
          line-height: 1;
          box-sizing: content-box;
          padding: 2.5px 11px 3px;
          margin-right: 10px;
        }

        >span.currentPrice {
          font-size: 20px;
          color: #EAF7FF;
          font-weight: bold;
          margin-right: 6px;
        }

        >span.originalPrice {
          font-size: 20px;
          color: rgba(234, 247, 255, 0.4);
          text-decoration: line-through;
        }
      }
    }

    .list {
      width: calc(100% - 80px);
      display: flex;
      margin-top: 16px;

      .num-family {
        font-family: 'D-DIN';
      }
      >ol {
        display: flex;
        align-items: center;
        flex: 1;
        height: 40px;

        li:last-child .banner-i-devier {
          display: none !important;
        }

        >li {
          height: 100%;
          width: auto;
          position: relative;
          display: flex;
          justify-content: flex-start;

          section {
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            p:nth-of-type(2) {
              color: rgba(255, 255, 255, .8);
              font-size: 12px;
              font-style: normal;
              font-weight: 400;
              margin-top: auto;
            }

            p:nth-of-type(1) {
              color: #FFF;
              font-size: 18px;
              font-style: normal;
              font-weight: 700;
              line-height: 18px;
            }
          }

          .banner-i-devier {
            display: inline-block;
            border: 1px solid rgba(255, 255, 255, 0.15);
            width: 0;
            height: 32px;
            margin: 12px 19px 12px;
            transform: skewX(-12deg);
          }

          &.ranking {
            section {
              cursor: pointer;
            }
          }

          &.exchange {
            section {
              p:nth-of-type(2) {
                .iconfont {
                  font-weight: 400;
                  color: rgba(234, 247, 255, .7);
                  display: inline-block;
                  margin-right: 8px;
                  font-size: 16px;
                }
              }
            }
          }
        }
      }

      >div.list-right {
        display: flex;
        align-items: center;

        :deep(div.GameDownloadButton) {
          width: 204px;
          height: 50px;
          margin-top: -5px;

          .text {
            font-size: 16px;
            letter-spacing: 2px;
          }
        }

        button {
          background: none;
          border: none;
          width: 204px;
          height: 50px;
          border: none;
          background: url('~@/images/gamecenter/special-normal.png') no-repeat;
          background-size: cover;
          background-position: center center;
          color: #000;
          text-align: center;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 2px;
          cursor: pointer;

          &:hover {
            background: url('~@/images/gamecenter/special-hover.png') no-repeat;
            background-size: cover;
            background-position: center center;
            color: rgba(255, 255, 255, 1);
          }

          &:active {
            color: rgba(255, 255, 255, 0.6);
            background: url('~@/images/gamecenter/special-click.png') no-repeat;
            background-size: cover;
            background-position: center center;
          }
        }

        >div.followers {
          width: 42px;
          height: 42px;
          background: url('~@/images/gamecenter/follower-mask.png') no-repeat;
          background-size: cover;
          background-position: center center;
          margin-left: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-top: -3px;

          img {
            width: 20px;
            height: 20px;
            object-fit: cover;
          }
        }
      }
    }

    >div.medias {
      position: absolute;
      left: 40px;
      top: 225px;
      width: calc(100% - 80px);
      height: 76px;
      overflow: hidden;
      font-size: 0;
      z-index: 2;
      cursor: pointer;

      &.show-prev::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        height: 76px;
        width: 29px;
        background: linear-gradient(90deg, rgb(0, 0, 0), rgba(0, 0, 0, 0));
        z-index: 6;
      }

      &.show-next::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        height: 76px;
        width: 29px;
        background: linear-gradient(-90deg, rgba(0, 0, 0), rgba(0, 0, 0, 0));
      }

      >button {
        position: absolute;
        top: 50%;
        z-index: 6;
        width: 40px;
        height: 40px;
        margin-top: -20px;
        background-color: transparent;
        border: none;
        outline: none;
        background-image: url("~@/components/MediaPlay/Main/next.png");
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        cursor: pointer;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }

        &.prev {
          left: 0;
          transform: rotate(180deg);
        }

        &.next {
          right: 0;
        }
      }

      >ul {
        display: inline-block;
        vertical-align: top;
        white-space: nowrap;
        height: 76px;
        transform: translate(0, 0);
        transition: transform 0.2s ease;

        >li {
          display: inline-block;
          vertical-align: top;
          width: 162px;
          height: 76px;
          margin-right: 14px;
          overflow: hidden;
          position: relative;
          border-radius: 4px;

          &:hover:after,
          &.active:after {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            border: 1px solid #ffffff73;
            border-radius: 4px;
            // border-image: linear-gradient(to right, #a3a3a3 0%, #fff 45%, #424242 100%) 1;
          }

          &.is-video {
            &::before {
              content: '';
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              width: 25px;
              height: 25px;
              background: url('~@/images/gamecenter/play.png') no-repeat;
              background-size: cover;
              background-position: center center;
              z-index: 999;
            }
          }

          >img,
          >video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }
      }
    }
  }
}

// pad

.PadDevice {
  // .swiper-slide {
  //   width: auto; // 确保每个幻灯片都是100%宽度
  //   height: 100%;
  //   position: relative;
  // }
  .pad-device-nav {
  position: absolute;
  z-index: 5;
  bottom: 70px;
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
      width: 20px;
      background: linear-gradient(90deg, #CACACA 0%, #EDF8FF 100%);
    }
  }
}
}

@media screen and (max-width: 800px) {
  // .header-mask section .list > ol > li section {
  //   justify-content: flex-start;
  // }
  .header-mask section .list > ol > li section p {
    &:nth-of-type(1) {
      font-size: 16px;
    }
    &:nth-of-type(2) {
      margin-top: 8px;
    }
}
// .header-mask section > h1 {
//   font-size: 22px;
//   text-shadow: none;
// }
.header-text-item {
  margin-top: -8.75vw;
}
.PadDevice  .pad-device-nav {
  bottom: 8.75vw;
}
// .header-mask .positiveReviewRate {
//   right: 0;
// }

}
</style>
