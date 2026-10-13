<template>
  <div class="MediaStage">
    <video
      ref="videoDom"
      v-if="currentObj.type === 'video'"
      :poster="currentObj.poster"
      :src="currentObj.url"
      muted
      autoplay
      loop
      @click="showPreDialog" />
    <img
      v-else-if="currentObj.type === 'image'"
      :src="currentObj.url"
      alt="游戏截图"
      tabindex="0"
      role="button"
      aria-label="查看大图"
      @click="showPreDialog"
      @keydown.enter.prevent.stop="showPreDialog"
      @keydown.space.prevent.stop="showPreDialog">
    <div
      class="tab-header"
      v-if="showAllTab">
      <div
        v-if="lengthList[0]"
        class="item-class"
        :class="{ 'item-class-active': isTabActive === 1 }"
        tabindex="0"
        role="tab"
        :aria-selected="isTabActive === 1 ? 'true' : 'false'"
        @click="tabClick(0)"
        @keydown.enter.prevent.stop="tabClick(0)"
        @keydown.space.prevent.stop="tabClick(0)"
      >
        <span>宣传片</span>
        <span
          class="num-class"
          v-if="lengthList[0] > 1">{{ lengthList[0] }}</span>
      </div>
      <div
        v-if="lengthList[1]"
        class="item-class"
        :class="{ 'item-class-active': isTabActive === 2 }"
        tabindex="0"
        role="tab"
        :aria-selected="isTabActive === 2 ? 'true' : 'false'"
        @click="tabClick(1)"
        @keydown.enter.prevent.stop="tabClick(1)"
        @keydown.space.prevent.stop="tabClick(1)"
      >
        <span>真机试玩</span>
        <span
          class="num-class"
          v-if="lengthList[1] > 1">{{ lengthList[1] }}</span>
      </div>
      <div
        v-if="lengthList[2]"
        class="item-class"
        :class="{ 'item-class-active': isTabActive === 3 }"
        tabindex="0"
        role="tab"
        :aria-selected="isTabActive === 3 ? 'true' : 'false'"
        @click="tabClick(2)"
        @keydown.enter.prevent.stop="tabClick(2)"
        @keydown.space.prevent.stop="tabClick(2)"
      >
        <span v-if="lengthList[2]">图集</span>
        <span
          class="num-class"
          v-if="lengthList[2] > 1">{{ lengthList[2] }}</span>
      </div>
    </div>
    <div class="arrow-item">
      <div
        v-if="currentIndex > 0"
        class="left-arrow"
        tabindex="0"
        role="button"
        aria-label="上一张"
        @click.stop="scrollList(0)"
        @keydown.enter.prevent.stop="scrollList(0)"
        @keydown.space.prevent.stop="scrollList(0)"></div>
      <div
        v-if="currentIndex < allList.length - 1"
        class="right-arrow"
        tabindex="0"
        role="button"
        aria-label="下一张"
        @click.stop="scrollList(1)"
        @keydown.enter.prevent.stop="scrollList(1)"
        @keydown.space.prevent.stop="scrollList(1)"></div>
    </div>
    <div class="header-mask">
      <section>
        <div class="title-area">
          <h1 class="title">{{ detail.softName }}</h1>
          <img
            v-for="(url, index) in detail.downloadInfo.tagUrls.slice(0, 1)"
            class="img-class"
            :key="index"
            :src="url"
            aria-hidden="true" />
        </div>
        <div class="auth-tags">
          <template v-if="detail.softPurpose !== 2">
            <!-- <span v-if="detail.currentTimeActivity" class="limit">{{ detail.currentTimeActivity.endTime |
              timeLeft(serverCurrentTime) }}</span>
            <span v-else-if="detail.showInfo.ruleLabelName" :class="detail.showInfo.ruleLabelClassName">{{
              detail.showInfo.ruleLabelName }}</span> -->
          </template>
          <template v-if="detail.downloadInfo.tagUrls.length || detail.showInfo.softLabels.length">
            <div
              class="tags"
              v-if="detail.showInfo.softLabels.length">
              <span
                v-for="(softLabel, index) of detail.showInfo.softLabels.slice(0, 3)"
                :key="index"
                tabindex="0"
                role="button"
                :aria-label="softLabel"
                @click.stop="clickGameLibrary(softLabel)"
                @keydown.enter.prevent.stop="clickGameLibrary(softLabel)"
                @keydown.space.prevent.stop="clickGameLibrary(softLabel)">{{ softLabel }}</span>
            </div>
          </template>
        </div>
        <template v-if="detail.softDesc.recommendIntroduction">
          <div class="ai-recommend">
            <TagActivity
              style="margin-top: 10px;"
              :title="detail.softDesc.recommendIntroduction"
              :type="2"
              :game-item="detail" />
          </div>
        </template>
        <div
          v-if="detail.softPurpose === 1"
          class="price">
          <b></b>
          <aside>
            <span
              v-if="detail.productInfo.discount"
              class="discount">{{ detail.productInfo.discount }}</span>
            <span class="currentPrice">¥{{ detail.productInfo.currentPrice }}</span>
            <span
              v-if="detail.productInfo.discount && detail.productInfo.originalPrice"
              class="originalPrice">¥{{
                detail.productInfo.originalPrice }}</span>
          </aside>
        </div>
        <div class="list">
          <ol>
            <li
              v-if="detail.softDesc.positiveReviewRate || detail.expectations"
              class="positiveReviewRate">
              <section
                tabindex="0"
                role="button"
                aria-label="查看推荐率评测"
                @click="scrollToComment"
                @keydown.enter.prevent.stop="scrollToComment"
                @keydown.space.prevent.stop="scrollToComment">
                <p class="recommand-num num-family">
                  <template v-if="detail.downloadInfo.bizType === 0 && detail.softDesc.positiveReviewRate">
                    <i> {{ detail.softDesc.positiveReviewRate }}</i>
                    <i class="symbol-100-1" style="margin-left: -6px;">%</i>
                  </template>
                  <template v-else-if="[1, 2].includes(detail.downloadInfo.bizType) && detail.expectations">
                    {{ fixedNum }}
                  </template>
                </p>
                <div class="recommand-header">
                  <img
                    class="img-class"
                    src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/14/75d2e276-adda-499e-976f-1c05cd63d526.png"
                    aria-hidden="true"
                    alt="" />
                  <template v-if="detail.downloadInfo.bizType === 0 && detail.softDesc.positiveReviewRate">
                    <p class="text">推荐率</p>
                  </template>
                  <template v-else-if="[1, 2].includes(detail.downloadInfo.bizType) && detail.expectations">
                    <p class="text">期待值</p>
                  </template>
                  <img
                    class="img-class"
                    src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/14/07acd792-c574-42cd-8383-bdf968337c64.png"
                    aria-hidden="true"
                    alt="">

                </div>
              </section>
              <i class="banner-i-devier"></i>
            </li>
            <li v-if="detail.showInfo.aiOptFlag && showRemindMeButton && !this.$isBellatorDevice">
              <section>
                <p class="ai-title">AI优化</p>
                <p class="ai-title">LZ专属</p>
              </section>
              <i class="banner-i-devier"></i>
            </li>
            <li
              v-if="detail.softPurpose === 2 && rankingItem"
              class="ranking">
              <section
                tabindex="0"
                role="button"
                :aria-label="'排行榜 TOP ' + rankingItem.num + ' ' + rankingItem.labelName"
                @click.stop="clickRank(rankingItem)"
                @keydown.enter.prevent.stop="clickRank(rankingItem)"
                @keydown.space.prevent.stop="clickRank(rankingItem)">
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
            <li
              v-if="detail.productInfo.exchangePlatform"
              class="exchange">
              <section>
                <p>
                  <i
                    class="iconfont"
                    v-html="detail.productInfo.exchangePlatformFont"></i>{{
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
            <li v-if="![1, 2].includes(detail.downloadInfo.bizType)">
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
          <div class="list-right">
            <div
              v-if="detail.nnId && showNnCommunityButton"
              class="nn-community-btn"
              tabindex="0"
              role="button"
              aria-label="NN社区"
              @click.stop="handleGoToNNCommunity"
              @keydown.enter.prevent.stop="handleGoToNNCommunity"
              @keydown.space.prevent.stop="handleGoToNNCommunity"></div>
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
            <button
              v-else
              ref="ShowPay"
              @click.stop="showPay">立即购买</button>
            <div
              class="followers"
              v-if="![1, 2].includes(detail.downloadInfo.bizType)"
              tabindex="0"
              role="button"
              :aria-label="isFollower ? '取消关注' : '关注'"
              @click.stop="toFollowers"
              @keydown.enter.prevent.stop="toFollowers"
              @keydown.space.prevent.stop="toFollowers">
              <img
                v-if="isFollower"
                src="@/images/gamecenter/concern-normal-new.png"
                alt=""
                aria-hidden="true">
              <img
                v-else
                src="@/images/gamecenter/concern-active-new.png"
                alt=""
                aria-hidden="true">
            </div>
          </div>
        </div>
        <div
          v-if="detail.softPurpose === 3 && !detail.productInfo.userPurchasedStatus"
          class="buy-information">
          <div class="discount-class">{{ detail.productInfo.discount || 0 }}</div>
          <div class="current-price-class">¥{{ detail.productInfo.currentPrice || 0 }}</div>
          <div class="orgin-price-class">¥{{ detail.productInfo.originalPrice || 0 }}</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'
import TagActivity from '@/components/TagNormal/TagActivity'

import { compareVersions } from '@/utils'

const typeList = ['宣传片', '真机试玩', '图集']
export default {
  name: 'MediaStage',
  components: {
    GameDownloadButton,
    TagActivity
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
      currentObj: {},
      lengthList: [0, 0, 0],
      showAllTab: true,
      preTab: -1
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
    },
    version() {
      return this.$store.state.system.version
    },
    showRemindMeButton() {
      return compareVersions(this.version, '2.0.22')
    },
    showNnCommunityButton() {
      return compareVersions(this.version, '2.0.25')
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
    this.allList = [
      ...trailerList,
      ...radioList,
      ...pictureList
    ]
    this.showAllTab = this.lengthList.filter(item => item > 0).length > 1

    this.currentObj = this.allList[this.currentIndex]
    if (this.detail.nnId) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeLoadGameDetailNNEntryShow', 'pv', {
        detail: JSON.stringify({
          gamename: this.detail.softName || '',
          gameID: this.detail.softId || '',
          lenovoid: this.$store.state.user.userInfo?.UserID || ''
        })
      })
    }
  },
  methods: {
    async handleGoToNNCommunity() {
      if (!this.$store.state.user.userInfo) {
        this.$login()
        return
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_storeLoadGameDetailNNEntryClick', 'click', {
        detail: JSON.stringify({
          gamename: this.detail.softName || '',
          gameID: this.detail.softId || '',
          lenovoid: this.$store.state.user.userInfo?.UserID || ''
        })
      })
      const url = `nn://www.nn.com/community/home/${this.detail.nnId}`
      const result = await window.LegionZone.nativeCall('pbase.dll', 'Launch_NNBBS', { cmdline: url })
      if (result?.ret === 1) {
        this.$lzconfirm({
          type: 'warning',
          message: '检测到NN语音社区组件已被卸载，请前往官网重新安装Legion Zone恢复！',
          showCancelButton: false,
          confirmButtonText: '前往官网'
        }).then(() => {
          window.open('https://legionzone.lenovo.com/', '_blank')
        }).catch(() => {})
      }
    },
    scrollList(type) {
      if (type && this.currentIndex < this.allList.length - 1) {
        this.currentIndex++
        this.currentObj = this.allList[this.currentIndex]
      }
      if (!type && this.currentIndex > 0) {
        this.currentIndex--
        this.currentObj = this.allList[this.currentIndex]
      }
      if (this.preTab !== this.isTabActive) {
        this.preTab = this.isTabActive
        this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailPreviewImageTabShow', 'pv', {
          name: typeList[this.preTab - 1] || ''
        })
      }
      return
    },
    clickRank(item) {
      this.$router.push({
        name: 'RankList',
        query: {
          source_p: 'PAD1',
          tab: item.labelCode
        }
      })
    },
    showPreDialog() {
      this.$mediaPlay(
        this.allList,
        this.currentIndex,
        () => {
          this.mediaPlaying = false
        }
      )
    },
    tabClick(index) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailPreviewImageTabShow', 'pv', {
        name: typeList[index] || ''
      })

      this.currentIndex = this.sumUpTo(index)
      this.currentObj = this.allList[this.currentIndex]
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
div.MediaStage {
  width: 100%;
  height: 100%;
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease;

  >img,
  >video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  >img {
    object-position: 0 0;
  }

  .tab-header {
    position: absolute;
    top: 92px;
    left: 50%;
    height: 32px;
    backdrop-filter: blur(100px);
    border: 1px solid rgba(234, 247, 255, 1);
    background: rgba(202, 202, 202, 0);
    transform: skewX(-12deg) translate(-50%, 50%);
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
      color: #000;
    }
  }

  &:hover {

    .left-arrow,
    .right-arrow {
      display: block;
    }
  }

  .arrow-item {
    transform: translate(-50%, -50%);
    height: 44px;
    margin-left: auto;
    width: 100%;
    position: absolute;
    top: 50%;
    left: 50%;
    max-width: 1440px;
  }

  .left-arrow,
  .right-arrow {
    display: none;
    height: 44px;
    width: 44px;
    transform: translate(0%, -100%);
    background-repeat: no-repeat;
    background-size: cover;
    cursor: pointer;
    z-index: 2;
  }

  .left-arrow {
    position: absolute;
    top: 50%;
    left: 40px;
    background-image: url("../../image/list-arrow-left.png");
  }

  .right-arrow {
    position: absolute;
    top: 50%;
    right: 40px;
    background-image: url("../../image/list-arrow-right.png");
  }
}

div.header-mask {
  width: 100%;
  height: 240px;
  position: absolute;
  bottom: 0;
  padding-bottom: 64px;

  &::after {
    position: absolute;
    left: 0;
    bottom: 0;
    content: '';
    width: 100%;
    height: 100%;
    background: linear-gradient(180deg, rgba(15, 10, 8, 0.00) 0%, rgba(0, 0, 0, 1) 60%);
    backdrop-filter: blur(2px);
  }

  >section {
    height: 100%;
    max-width: 1440px;
    margin: 0 auto;
    position: relative;

    .title-area {
      display: flex;
      align-items: top;
      width: calc(100% - 40px);
      position: absolute;
      left: 40px;
      top: 0px;
      z-index: 1;

      .title {
        color: #FFF;
        text-shadow: 0px 4px 5px #000;
        font-size: 42px;
        line-height: 42px;
        font-style: normal;
        font-weight: 700;
        letter-spacing: 1px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .img-class {
        height: 24px;
        margin-top: 21px;
      }
    }

    .ai-recommend {
      position: absolute;
      left: 40px;
      top: 85px;
      width: 100%;
    }

    >div.auth-tags {
      width: calc(100% - 80px);
      position: absolute;
      left: 40px;
      top: 60px;
      z-index: 1;
      display: flex;
      align-items: center;

      >span {
        z-index: 2;
        font-size: 12px;
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
          margin-left: 6px;
          padding: 5px 3px;
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

    .buy-information {
      display: flex;
      align-items: center;
      position: absolute;
      right: 38px;
      top: 110px;
      z-index: 1;
      line-height: 18px;
      //  background-color: rgba(48, 53, 61);
      font-size: 12px;
      width: 260px;

      .discount-class {
        background: #F24A44;
        font-weight: 700;
        color: #fff;
        margin-right: 6px;
        height: 18px;
        padding: 0 4px;
        border-radius: 1px;
        text-align: center;
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

    >div.list {
      width: calc(100% - 80px);
      position: absolute;
      left: 40px;
      right: 0;
      top: 140px;
      z-index: 1;
      display: flex;

      .num-family {
        font-family: 'D-DIN';
      }

      >ol {
        display: flex;
        align-items: center;
        flex: 1;
        height: 47px;

        li:last-child .banner-i-devier {
          display: none !important;
        }

        >li {
          height: 100%;
          width: auto;
          position: relative;
          display: flex;

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

          &.positiveReviewRate {
            height: 100%;

            section {
              .recommand-num {
                background: linear-gradient(180deg, #FFD86B 0%, #EFD672 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 900;
                font-size: 30px;
                height: 24px;
                line-height: 24px;
                text-align: center;
                margin: 0 auto;

                .symbol-100-1 {
                  font-size: 12px;

                }

              }
            }

            >i {
              margin-top: 14px;
            }

            .recommand-header {
              display: flex;
              align-items: baseline;
              height: 19px;

              .text {
                font-size: 12px;
                background: linear-gradient(180deg, #FFD86B 0%, #EFD672 100%);
                background-clip: text;
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin: 0 1px;
              }

              .img-class {
                height: 100%;
                object-fit: cover;
              }
            }
          }

          .ai-title {
            background: linear-gradient(90deg, #A085EE 0%, #E09AB2 50%, #F9AB5F 100%);
            background-clip: text;
            -webkit-text-fill-color: transparent;
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

        .nn-community-btn {
          width: 160px;
          height: 50px;
          cursor: pointer;
          margin-right: 16px;
          background: url('~@/images/gamecenter/nnCommunity/nn-community-game-detail.png') no-repeat center / contain;

          &:hover {
            background-image: url('~@/images/gamecenter/nnCommunity/nn-community-game-detail-hover.png');
          }
        }

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

.tab-header .item-class:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

.followers:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.MediaStage .left-arrow:focus-visible,
.MediaStage .right-arrow:focus-visible,
.MediaStage .nn-community-btn:focus-visible,
.MediaStage .positiveReviewRate section:focus-visible,
.MediaStage .ranking section:focus-visible,
.MediaStage .auth-tags .tags span:focus-visible,
.MediaStage img[role="button"]:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .tab-header .item-class:focus-visible,
  .followers:focus-visible,
  .MediaStage .left-arrow:focus-visible,
  .MediaStage .right-arrow:focus-visible,
  .MediaStage .nn-community-btn:focus-visible,
  .MediaStage .positiveReviewRate section:focus-visible,
  .MediaStage .ranking section:focus-visible,
  .MediaStage .auth-tags .tags span:focus-visible,
  .MediaStage img[role="button"]:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
