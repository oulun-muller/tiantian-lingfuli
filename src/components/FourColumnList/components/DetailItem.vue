<template>
  <div class="game-detail-item-online">
    <div class="game-detail-item-first" @click="toGameDetail(false)">
      <div
        class="img_box"
        :style="{ backgroundImage: `url('${item.showInfo.himg || defaultImg}')` }">
        <div class="img-class" v-if="!item.showInfo.himg && item.showInfo.logoFile" :src="item.showInfo.logoFile"></div>
      </div>
      <div class="info_box">
        <div class="info_box_header">
          <div class="name">{{ item.softName }}</div>
          <img
            class="official-server"
            v-if="item.downloadInfo && item.downloadInfo.tagUrls && item.downloadInfo.tagUrls[0]"
            :src="item.downloadInfo.tagUrls[0]"
            alt="官方标签" />
        </div>
        <div class="tag-list">
          <!-- 推荐率/期待值  标签 -->
          <template>
            <div v-if="[1, 2].includes(item.downloadInfo.bizType) && item.expectations" class="tag-item">
              <span class="pointer-class">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="12" viewBox="0 0 13 12" fill="none">
                  <path
                    d="M6.15156 0.14806C6.05957 0.0534059 5.93319 0 5.8012 0H4.80886C4.6115 0 4.43352 0.118744 4.35774 0.300977L2.40237 5.0033C2.37539 5.06818 2.33474 5.12647 2.28319 5.17421L0.156633 7.14321C0.0567691 7.23567 0 7.3656 0 7.5017V11.5114C0 11.7813 0.218738 12 0.488566 12H9.90656C10.1125 12 10.2963 11.8709 10.3662 11.6772L12.7641 5.02723C12.8789 4.70881 12.643 4.37294 12.3045 4.37294H7.55811C7.28824 4.37294 7.06949 4.15414 7.06954 3.88427L7.0701 1.2916C7.07013 1.1644 7.02055 1.0422 6.9319 0.950986L6.15156 0.14806Z"
                    fill="url(#paint0_linear_154_7643)" />
                  <defs>
                    <linearGradient
                      id="paint0_linear_154_7643"
                      x1="6.5"
                      y1="0"
                      x2="6.5"
                      y2="12"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#FFD86B" />
                      <stop offset="1" stop-color="#EFD672" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span class="recommand-num">期待值{{ fixedNum }}</span>
            </div>
            <div v-else-if="item.softDesc.positiveReviewRate" class="tag-item">
              <span class="pointer-class">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="12" viewBox="0 0 13 12" fill="none">
                  <path
                    d="M6.15156 0.14806C6.05957 0.0534059 5.93319 0 5.8012 0H4.80886C4.6115 0 4.43352 0.118744 4.35774 0.300977L2.40237 5.0033C2.37539 5.06818 2.33474 5.12647 2.28319 5.17421L0.156633 7.14321C0.0567691 7.23567 0 7.3656 0 7.5017V11.5114C0 11.7813 0.218738 12 0.488566 12H9.90656C10.1125 12 10.2963 11.8709 10.3662 11.6772L12.7641 5.02723C12.8789 4.70881 12.643 4.37294 12.3045 4.37294H7.55811C7.28824 4.37294 7.06949 4.15414 7.06954 3.88427L7.0701 1.2916C7.07013 1.1644 7.02055 1.0422 6.9319 0.950986L6.15156 0.14806Z"
                    fill="url(#paint0_linear_154_7643)" />
                  <defs>
                    <linearGradient
                      id="paint0_linear_154_7643"
                      x1="6.5"
                      y1="0"
                      x2="6.5"
                      y2="12"
                      gradientUnits="userSpaceOnUse">
                      <stop stop-color="#FFD86B" />
                      <stop offset="1" stop-color="#EFD672" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span class="recommand-num">推荐率<span class="num">{{ item.softDesc.positiveReviewRate }}%</span> </span>
            </div>
          </template>
          <!-- 排名标签 -->
          <TagRank
            v-if="item.showInfo.rankingLabelInfos.length"
            style="margin-bottom: 14px;"
            :rank-list="item.showInfo.rankingLabelInfos" />
          <!-- 普通标签 -->
          <div v-for="(tag, index) of PTagList" :key="index" class="tag-item" style="opacity: 0.7;">{{ tag }}</div>
        </div>
        <div class="desc">{{ item.softDesc.introduction }}</div>
      </div>
      <aside v-if="item.softPurpose !== 4" class="download-count">
        <p>{{ item.downloadInfo.downloadCount }}</p>
      </aside>
      <aside class="right-box">
        <GameDownloadButton
          class="downloadButton"
          theme="rect"
          :download-info="item.downloadInfo"
          :soft-desc="item.softDesc"
          :soft-id="item.softId"
          :soft-purpose="item.softPurpose"
          :product-info="item.productInfo"
          :user-purchased-status="item.productInfo.userPurchasedStatus"
          :version="item.softDesc.version"
          :soft-name="item.softName"
          :logo-file="item.showInfo.logoFile"
          :fast-install="item.showInfo.isFastInstall"
          :drinfo="drinfo"
          :sku-id="item.skuId" />
      </aside>
    </div>
    <div class="line">
    </div>
    <div class="activity-box">
      <div class="activity-show" v-if="preciseMatch.latestActivity && preciseMatch.latestActivity.type === 1" @click="toActivePage">
        <!-- 橙色横幅 SVG 背景（精确还原 Figma 设计） -->
        <div class="activity-title"><span class="activity-dot"></span>限时活动</div>
        <div class="activity-desc">{{ preciseMatch.latestActivity.longTitle }}</div>
        <div class="left-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="6" height="12" viewBox="0 0 6 12" fill="none">
            <path
              d="M5.86328 5.86328L0 11.7266L-8.87888e-08 9.69531L3.83301 5.86328L-4.23838e-07 2.03027L-5.12584e-07 0L5.86328 5.86328Z"
              fill="#EAF7FF" />
          </svg>
        </div>
      </div>
      <div class="evaluation-list-show" v-if="evaluationList && evaluationList.length > 1" @click="toGameDetail(true)">
        <!-- 蓝色横幅 SVG 背景（精确还原 Figma 设计） -->
        <div class="evaluation-title"><span class="evaluation-dot"></span>拯救者玩家评测</div>
        <div class="evaluation-list">
          <transition name="ticker-slide">
            <div class="review-ticker-item" :key="tickerIndex">
              <span class="reviewer">{{ evaluationList[tickerIndex].reviewer }}</span>{{
                evaluationList[tickerIndex].content
              }}
            </div>
          </transition>
        </div>
        <div class="left-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="6" height="12" viewBox="0 0 6 12" fill="none">
            <path
              d="M5.86328 5.86328L0 11.7266L-8.87888e-08 9.69531L3.83301 5.86328L-4.23838e-07 2.03027L-5.12584e-07 0L5.86328 5.86328Z"
              fill="#EAF7FF" />
          </svg>
        </div>
      </div>
    </div>
    <div class="img-list-box" v-if="videoImgList.length > 0">
      <button v-show="showLeftArrow" class="scroll-arrow scroll-arrow--left" @click="scrollImgBy(-398)">
      </button>
      <div class="img-list" ref="imgList" @scroll="updateScrollArrows">
        <div
          v-for="(img, index) in videoImgList"
          :key="index"
          class="img-list-item"
          @click="showPreDialog(index, img.type)">
          <template v-if="img.type === 'video'">
            <video :src="img.url" controls class="video-item" autoplay muted loop></video>
          </template>
          <template v-else>
            <img :src="img.url" alt="" class="img-item">
          </template>
        </div>
      </div>
      <button v-show="showRightArrow" class="scroll-arrow scroll-arrow--right" @click="scrollImgBy(398)">
      </button>
      <div v-show="showRightArrow" class="scroll-arrow--shadow"></div>
    </div>

  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import TagRank from './TagRank.vue'

export default {
  name: '',
  components: {
    GameDownloadButton,
    TagRank
  },
  props: {
    item: {
      type: Object,
      default: () => { }
    },
    preciseMatch: {
      type: Object,
      default: () => { }
    },
    tagList: {
      type: Array,
      default: () => {
        return []
      }
    },
    keyword: {
      type: String,
      default: () => ''
    },
    drinfo: {
      type: String,
      default: () => ''
    },
    firstLocal: {
      type: [String, Number],
      default: () => ''
    },
    secondLocal: {
      type: [String, Number],
      default: ''
    },
    thirdLocal: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      tickerIndex: 0, // 当前显示的条目索引
      tickerTimer: null,
      showLeftArrow: false, // img-list-box 左箭头
      showRightArrow: false // img-list-box 右箭头
    }
  },
  computed: {
    // 直接映射，不再追加副本（用 transition 切换，tickerIndex 取模循环）
    evaluationList() {
      const reviews = this.preciseMatch?.reviews
      if (!reviews || !reviews.length) return []
      return reviews.map(item => ({
        reviewer: item.userName,
        content: item.content
      }))
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    videoImgList() {
      const viode = this.preciseMatch?.trialVideos.map(item =>
        ({
          type: 'video',
          img: item.videoImgUrl,
          url: item.videoUrl
        })
      ) || []
      const img = this.preciseMatch?.captureFileList.map(item =>
        ({
          type: 'image',
          url: item
        })
      ) || []

      return [...viode, ...img]
    },
    // 期待值/推荐率 标签
    PTagList() {
      return this.tagList?.slice(0, 3) || []
    },
    // 期待值/推荐率 标签
    fixedNum() {
      if (!this.item?.expectations) return ''
      return parseFloat(this.item?.expectations).toFixed(1) || ''
    }
  },
  watch: {
    // evaluationList(val) {
    //   this.stopTicker()
    //   if (val && val.length > 1) {
    //     this.tickerIndex = 0
    //     this.startTicker()
    //   }
    // },
    // videoImgList() {
    //   // 数据更新后重新检测滚动状态
    //   this.$nextTick(this.updateScrollArrows)
    // }
  },
  created() {
    this.$dataReport('LZ_gamingCenter', 'LZ_storeGameSearchInterventionShow', 'pv', {
      detail: JSON.stringify({
        from: 1,
        plateName: this.keyword,
        skuName: this.item.softName || '',
        softID: this.item.softId || '',
        lenovoid: this.userInfo?.UserID || ''
      })
    })
  },
  mounted() {
    console.log(this.tagList)
    if (this.evaluationList && this.evaluationList.length > 1) {
      this.startTicker()
    }
    this.$nextTick(this.updateScrollArrows)

    // 埋点上报
    if (this.preciseMatch?.latestActivity) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeGameSearchResultActivityEntryShow', 'pv', {
        detail: JSON.stringify({
          from: 1,
          plateName: this.keyword,
          skuName: this.item.softName || '',
          softID: this.item.softId || '',
          lenovoid: this.userInfo?.UserID || '',
          moduleCon: `${this.preciseMatch?.latestActivity?.longTitle || ''}_${this.preciseMatch?.latestActivity?.jumpUrl || ''}`
        })
      })
    }
  },
  beforeUnmount() {
    this.stopTicker()
  },
  methods: {
    startTicker() {
      // tickerIndex 取模循环，Vue transition 负责滑入滑出动画
      this.tickerTimer = setInterval(() => {
        this.tickerIndex = (this.tickerIndex + 1) % this.evaluationList.length
      }, 3000) // 每 3s 切换一条
    },
    stopTicker() {
      if (this.tickerTimer) {
        clearInterval(this.tickerTimer)
        this.tickerTimer = null
      }
    },
    // 每次 img-list 滚动后更新箭头显示状态
    updateScrollArrows() {
      const el = this.$refs.imgList
      if (!el) return
      this.showLeftArrow = el.scrollLeft > 0
      this.showRightArrow = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    },
    // 横向滚动，offset 正数向右 / 负数向左，每次 2 个 item（179px + 20px gap = 199px）
    scrollImgBy(offset) {
      const el = this.$refs.imgList
      if (!el) return
      el.scrollBy({ left: offset, behavior: 'smooth' })
    },
    toActivePage() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeGameSearchResultActivityEntryClick', 'click', {
        detail: JSON.stringify({
          from: 1,
          plateName: this.keyword,
          skuName: this.item.softName || '',
          softID: this.item.softId || '',
          lenovoid: this.userInfo?.UserID || '',
          moduleCon: `${this.preciseMatch?.latestActivity?.jumpUrl || ''}_${this.preciseMatch?.latestActivity?.title || ''}`
        })
      })
      this.$router.push({
        path: `/gameCenter/online/index`,
        query: {
          id: this.preciseMatch.latestActivity?.jumpUrl || '',
          configPolicy: '1'
        }
      })
    },
    toGameDetail(needScroll = false) {
      console.log(needScroll)
      this.$dataReport('LZ_gamingCenter', 'LZ_storeGameSearchResultReviewEntryClick', 'click', {
        detail: JSON.stringify({
          from: 1,
          plateName: this.keyword,
          skuName: this.item.softName || '',
          softID: this.item.softId || '',
          lenovoid: this.userInfo?.UserID || ''
        })
      })
      this.$router.push({
        path: `/gameCenter/detail/${this.item.softId}`,
        query: {
          scrollTo: needScroll ? 'comment' : '',
          configPolicy: '1',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: `${this.keyword}_1`
        }
      })
    },
    showPreDialog(index, type) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeGameSearchResultVideoImageClick', 'click', {
        detail: JSON.stringify({
          from: 1,
          plateName: this.keyword,
          skuName: this.item.softName || '',
          softID: this.item.softId || '',
          lenovoid: this.userInfo?.UserID || '',
          type: type
        })
      })
      this.$mediaPlay(
        this.videoImgList,
        index,
        () => { }
      )
    }
  }
}
</script>

<style scoped lang="scss">
.game-detail-item-online {
  width: 100%;
  min-height: 90px;
  border-radius: 4px;
  border: 1px solid rgba(200, 199, 254, 0.1);
  background: linear-gradient(180deg, #191E25 0%, rgba(16, 19, 23, 0.50) 100%);
  box-shadow: 0 4.533px 34px 0 rgba(0, 0, 0, 0.35);
  padding: 24px;
  margin-bottom: 20px;

  .game-detail-item-first {
    width: 100%;
    height: 100%;
    display: flex;
    margin-bottom: 24px;

    .img_box {
      width: 160px;
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: url("~@/images/gamecenter/searchDefault.png") no-repeat center center;
      background-size: cover;
      border: 1px solid rgba(234, 247, 255, 1);

      .img-class {
        width: 42px;
        height: 42px;
        object-fit: cover;
      }
    }

    .info_box {
      width: 46%;
      margin-left: 20px;

      .info_box_header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-bottom: 14px;

        .name {
          color: #eaf7ff;
          font-size: 18px;
          font-style: normal;
          font-weight: 700;
          letter-spacing: 1px;
          background: linear-gradient(180deg, rgba(146, 146, 146, 1) 0%, rgba(234, 247, 255, 1) 82.86%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .official-server {
          width: 58px;
          height: 20px;
          object-fit: fill;
        }
      }

      .tag-list {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: nowrap;
        gap: 4px;

        .tag-item {
          border: 0.5px solid rgba(255, 255, 255, 0.3);
          font-size: 12px;
          color: #eaf7ff;
          padding: 0px 4px;
          height: 22px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: flex-start;

          .recommand-num {
            font-weight: 700;
            color: rgba(255, 216, 107, 1)
          }

          .pointer-class {
            margin-right: 4px;

            svg {
              display: block;
            }
          }
        }
      }

      .desc {
        color: rgba(234, 247, 255, 0.80);
        font-size: 12px;
        font-style: normal;
        font-weight: 400;
        letter-spacing: 1px;
      }
    }

    .download-count {
      color: rgba(234, 247, 255, 0.70);
      font-family: "Microsoft YaHei";
      font-size: 14px;
      opacity: 0.6;
      display: flex;
      align-items: center;
    }

    .right-box {
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: flex-start;

      .downloadButton {
        width: 90px;
        height: 34px;
        font-size: 12px;


          :deep(div.DownloadButton>div>span) {
            font-size: 12px;
          }

      }
    }
  }

  .line {
    width: 100%;
    height: 1px;
    background: rgba(234, 247, 255, 0.1);
    margin-bottom: 20px;
  }

  .left-icon {
    width: 6px;
    height: 12px;
    opacity: 0.6;
    margin-left: auto;

    svg {
      display: block;
    }
  }

  .activity-box {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;

    .activity-show {
      display: flex;
      align-items: center;
      font-size: 12px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      min-width: 476px;
      width: 100%;
      height: 42px;
      padding: 0 20px;
      background-image: url("./image/background2.svg");
      background-size: 100% 100%; // 或 cover，看是否需要等比
      background-repeat: no-repeat;

      .activity-title {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        background: linear-gradient(180deg, #EAF7FF 0%, #737373 82.86%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-right: 12px;

        .activity-dot {
          display: inline-block;
          width: 20px;
          height: 20px;
          background: url("./image/icon1.png") no-repeat center center;
          background-size: cover;
        }
      }

      .activity-desc {
        flex: 1;
        font-size: 12px;
        color: #eaf7ff;
        line-height: 26px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .evaluation-list-show {
      display: flex;
      align-items: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      min-width: 476px;
      width: 100%;
      height: 42px;
      padding: 0 20px;
      background-image: url("./image/background1.svg");
      background-size: 100% 100%; // 或 cover，看是否需要等比
      background-repeat: no-repeat;

      .evaluation-title {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 700;
        white-space: nowrap;
        background: linear-gradient(180deg, #EAF7FF 0%, #737373 82.86%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-right: 12px;

        .evaluation-dot {
          display: inline-block;
          width: 20px;
          height: 20px;
          background: url("./image/icon2.png") no-repeat center center;
          background-size: cover;
        }
      }

      .evaluation-list {
        position: relative;
        overflow: hidden;
        height: 20px;
        // 宽度由当前显示的 review-ticker-item 内容决定
      }

      // ticker-slide transition：从下滑入、向上滑出
      .ticker-slide-enter-active {
        transition: transform 0.4s ease, opacity 0.4s ease;
      }

      .ticker-slide-leave-active {
        transition: transform 0.4s ease, opacity 0.4s ease;
        position: absolute; // 离场时脱离文档流，不占宽度
        top: 0;
      }

      .ticker-slide-enter {
        transform: translateY(100%);
        opacity: 0;
      }

      .ticker-slide-leave-to {
        transform: translateY(-100%);
        opacity: 0;
      }

      .review-ticker-item {
        height: 20px;
        line-height: 20px;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        .reviewer {
          color: rgba(234, 247, 255, 0.60);
          margin-right: 6px;
        }
      }
    }
  }

  .img-list-box {
    position: relative;
    width: 100%;

    .img-list {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: 20px;
      overflow-x: auto;
      overflow-y: hidden;

      &::-webkit-scrollbar {
        display: none;
      }

      .img-list-item {
        width: 179px;
        height: 111px;
        object-fit: cover;
        flex-shrink: 0;

        .video-item {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .img-item {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .scroll-arrow {
      position: absolute;
      top: 50%;
      z-index: 1;
      border: none;
      cursor: pointer;
      width: 32px;
      height: 32px;
      background-image: url('~@/components/MediaPlay/Main/next.png');
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
      background-color: transparent;
      opacity: 0.7;

      &:hover {
        opacity: 1;
      }

      &--left {
        left: 0;
        transform: translateY(-50%) rotate(180deg);
      }

      &--right {
        right: 0;
        transform: translateY(-50%);
        z-index: 2;

        // &::before {
        //   content: '';
        //   position: absolute;
        //   right: -4px;
        //   top: 0;
        //   transform: translateY(-48px);
        //   width: 26.77px;
        //   height: 116.186px;
        //  background: linear-gradient(62deg, rgba(22, 26, 32, 0.30) 17.02%, #161A20 82.72%);
        //  filter: blur(2px);
        //   pointer-events: none;
        //   z-index: -1;
        //   opacity: 1;
        // //  background-image: url('./image/shadow1.png');
        // }
      }

      &--shadow {
        content: '';
        position: absolute;
        right: 0px;
        top: 0;
        width: 26px;
        height: 124px;
        transform: translateY(-8px);
        // background: linear-gradient(69deg, rgba(22, 26, 32, 0.30) 13.63%, #161A20 58.94%);
//          filter: blur(4px);
// background: linear-gradient(69deg, rgba(22, 26, 32, 0.30) 13.63%, #161A20 58.94%);

        pointer-events: none;
        z-index: 1;
        background-image: url('./image/shadow1.png');
        background-size: cover;
        background-repeat: no-repeat;
      }
    }
  }

}

</style>
