<template>
  <section class="RankList">
    <div class="title-wrap">
      <span class="title">预约榜</span>
      <p class="desc">— 榜单基于截止昨日的{{ BRAND_TEXT_CHINESE }}玩家预约人数生成 —</p>
    </div>
    <!-- top3 内容 -->
    <ul class="top-3-wrap">
      <li
        v-for="index in 3"
        :key="`top-${index}`"
        :class="['top-wrapper', `top-${index}`]"
        tabindex="0"
        role="button"
        :aria-label="topData(index) && topData(index).softInfo ? topData(index).softInfo.softName + '，点击查看详情' : ''"
        @click.stop="toDetail(topData(index).softInfo)"
        @keydown.enter.prevent.stop="toDetail(topData(index).softInfo)"
        @keydown.space.prevent.stop="toDetail(topData(index).softInfo)"
        v-exposure="{
          handler: ()=>onExposure(topData(index)),
          delay: 1000,
          options: { threshold: 1 },
          once: true
        }"
      >
        <template >
          <div
            class="media-wrap"
            @mouseenter="mouseEnterItem(index)"
            @mouseleave="mouseLeaveItem(index)">
            <video
              v-if="curIndex===index &&
                topData(index).softInfo &&
                topData(index).softInfo.softDesc &&
                topData(index).softInfo.softDesc.mediaList[0] &&
                topData(index).softInfo.softDesc.mediaList[0].type === 'video'"
              ref="videoDom"
              class="video-item"
              :src="topData(index).softInfo.softDesc.mediaList[0].url"
              :poster="getImgUrl(topData(index))"
              autoplay
              muted>
            </video>
            <img v-else class="img-item" :src="getImgUrl(topData(index))" />
          </div>
          <div class="content-wrap">
            <div class="detail-wrap">
              <span class="title">{{ getGameName(topData(index)) }}</span>
              <div v-if="iconList(topData(index)).length">
                <div class="tags-wrap" v-if="iconList(topData(index)).length">
                  <template v-for="(icon, key) in iconList(topData(index))" >
                    <template v-if="icon">
                      <template v-if="icon.labelName">
                        <span
                          :key="'icon-'+key"
                          class="tag"
                          tabindex="0"
                          role="button"
                          :aria-label="icon.labelName + 'TOP' + icon.num + '，查看榜单'"
                          @click.stop="goToRankList(icon)"
                          @keydown.enter.prevent.stop="goToRankList(icon)"
                          @keydown.space.prevent.stop="goToRankList(icon)">
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
                <!-- <ul class="soft-labels" v-if="showSoftLabels(topData(index))">
                  <li
                    v-for="(tagItem) of topData(index).softInfo.showInfo.softLabels.slice(0, 2 - iconList.length)"
                    :key="tagItem"
                    :class="{active:tagItem === 'DLC'}">{{ tagItem }}</li>
                </ul> -->
              </div>
              <span class="desc">{{ topData(index).datas || 0 }}人预约
                <template v-if="topData(index).softInfo && topData(index).softInfo.relateActivitys && topData(index).softInfo.relateActivitys.length" >
                  <i>.</i>
                  <span class="bindtag" v-for="bindTag in topData(index).softInfo.relateActivitys" :key="bindTag.title" tabindex="0" role="button" :aria-label="bindTag.title" @click.stop="goToBindTag(bindTag, topData(index))" @keydown.enter.prevent.stop="goToBindTag(bindTag, topData(index))" @keydown.space.prevent.stop="goToBindTag(bindTag, topData(index))">
                    <i class="text">{{ bindTag.title }}</i><i class="arrow"></i>
                  </span>
                </template>
              </span>
            </div>
            <GameDownloadButton
              v-if="topData(index) && topData(index).softInfo && topData(index).softInfo.softId"
              class="downloadButton"
              theme="rect"
              :download-info="topData(index).softInfo.downloadInfo"
              :soft-desc="topData(index).softInfo.softDesc"
              :soft-id="topData(index).softInfo.softId"
              :soft-purpose="topData(index).softInfo.softPurpose"
              :product-info="topData(index).softInfo.productInfo"
              :user-purchased-status="topData(index).softInfo.productInfo.userPurchasedStatus"
              :version="topData(index).softInfo.softDesc.version"
              :soft-name="topData(index).softInfo.softName"
              :logo-file="topData(index).softInfo.showInfo.logoFile"
              :fast-install="topData(index).softInfo.showInfo.isFastInstall"
              :drinfo="drinfo(topData(index).softInfo)"
              :sku-id="topData(index).softInfo.skuId" />
          </div>
        </template>
      </li>
    </ul>
    <div
      v-for="(item,index) of rankList.slice(3)"
      :key="index"
      tabindex="0"
      role="button"
      :aria-label="item.softInfo ? (item.softInfo.softName + '，点击查看详情') : ''"
      @click="toDetail(item.softInfo)"
      @keydown.enter.prevent.stop="toDetail(item.softInfo)"
      @keydown.space.prevent.stop="toDetail(item.softInfo)"
      :class="[item.softInfo ? 'pointer' : '', 'wrapper']"
      v-exposure="{
        handler: ()=>onExposure(item),
        delay: 1000,
        options: { threshold: 1 },
        once: true
      }">
      <div class="item IsRankList">
        <div class="img_box IsRankList_img_box">
          <b
            :style="{backgroundImage:`url('${getImgUrl(item)}')`}">
            <img
              v-if="!getImgUrl(item) && item.softInfo && item.softInfo.showInfo.logoFile"
              :src="item.softInfo.showInfo.logoFile"
              alt="">
          </b>
        </div>
        <span
          v-if="item.softInfo && item.softInfo.showInfo && item.softInfo.showInfo.ruleLabelName"
          :class="item.softInfo.showInfo.ruleLabelClassName">{{ item.softInfo.showInfo.ruleLabelName }}
        </span>
        <section>
          <div class="softName">
            <b class="rankTagOther">TOP {{ index+4 }}</b>
            <p class="IsRankList_p">{{ getGameName(item) }}</p>
            <span
              v-if="item.softInfo && item.softInfo.softPurpose===1 && item.softInfo.productInfo.exchangePlatform"
              class="platform">
              <i
                v-if="item.softInfo.productInfo.exchangePlatformFont"
                class="iconfont"
                v-html="item.softInfo.productInfo.exchangePlatformFont"></i>
            </span>
          </div>
          <span v-if="item.playedBefore" class="play-label">{{ item.playedBefore }}</span>
          <img
            v-if="item.softInfo && item.softInfo.downloadInfo && item.softInfo.downloadInfo.tagUrls && item.softInfo.downloadInfo.tagUrls[0]"
            class="auth-icon"
            :src="item.softInfo.downloadInfo.tagUrls[0]" />
          <ul v-if="item.softInfo && item.softInfo.showInfo && item.softInfo.showInfo.softLabels" class="soft-labels">
            <li
              v-for="(tagItem, tagIndex) of item.softInfo.showInfo.softLabels.slice(0, 5)"
              :key="tagIndex"
              :class="{active:tagItem === 'DLC'}">{{ tagItem }}</li>
          </ul>
        </section>
        <aside>
          <p>{{ item.datas }}人预约</p>
        </aside>
        <template v-if="item.softInfo">
          <div
            class="buyButton common-rect-btn"
            v-if="item.softInfo.softPurpose===1"
            tabindex="0"
            role="button"
            aria-label="购买"
            @click.stop="showPay(item.softInfo)"
            @keydown.enter.prevent.stop="showPay(item.softInfo)"
            @keydown.space.prevent.stop="showPay(item.softInfo)">购买</div>
          <GameDownloadButton
            v-else
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
        </template>
      </div>
    </div>
    <div class="more" tabindex="0" role="button" aria-label="查看全部预约榜" @click="clickMore" @keydown.enter.prevent.stop="clickMore" @keydown.space.prevent.stop="clickMore">查看全部<i class="arrow" aria-hidden="true"></i></div>
  </section>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'

import { getCurrentBrandConfig } from '@/assets/text'
export default {
  props: {
    moduleData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      curIndex: null,
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      topIndex: [1, 0, 2],
      BRAND_TEXT_CHINESE: getCurrentBrandConfig('BRAND_TEXT_CHINESE')
    }
  },
  components: {
    GameDownloadButton
  },
  computed: {
    iconList() {
      return (item) => {
        const onlineTime = item.softInfo?.downloadInfo?.releaseRemind || ''
        const onlineTag = onlineTime ? [{ type: 'online-tag', text: onlineTime }] : []
        const softLabels = (item.softInfo?.showInfo?.softLabels || []).map(one => { return { type: 'soft-label', text: one } })
        const tags = [].concat(...onlineTag, item.softInfo?.downloadInfo?.tagUrls || [], softLabels).slice(0, 2)
        return tags.filter((item) => item !== null)
      }
    },
    topData() {
      return (index) => {
        return this.rankList?.[this.topIndex?.[index - 1]]
      }
    },
    userInfo() {
      return this.$store.state.user.userInfo
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
    rankList() {
      return this.moduleData.rankingLists[0]?.rankingCharts
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
    }
  },
  methods: {
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
    clickMore() {
      this.$router.push({
        path: '/gameCenter/rankList',
        query: {
          tab: 19
        }
      })
    },
    goToRankList(rankItem) {
      this.$router.push({
        path: '/gameCenter/rankList',
        query: {
          tab: rankItem.labelCode
        }
      })
      const item = this.curPic
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
    getImgUrl(item) {
      const imageIndex = item.softInfo?.softDesc?.mediaList?.findIndex(item => item.type === 'image')
      if (item.softInfo?.softDesc?.videoCoverImg) {
        return item.softInfo.softDesc.videoCoverImg
      } else if (imageIndex !== -1) {
        return item.softInfo.softDesc.mediaList[imageIndex].url
      } else {
        return this.defaultImg
      }
    },
    getGameName(item) {
      return item?.softInfo?.softName || item.gameName
    },
    getPlayNumHtml(item) {
      switch (this.curTab) {
        case 5:
        case 8:
          return `${item.datas}人在玩`
        case 6:
          return `总计${item.datas}小时`
        case 7:
          return `涨幅${item.datas}%`
      }
    },
    toDetail(softInfo) {
      if (!softInfo) return
      const usedForReport = this.moduleData.rankingLists?.[0].name || ''
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: softInfo.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: usedForReport
        }
      })
    }
  }
}
</script>
<style lang="scss" scoped>
  .bindtag {
    cursor: pointer;
    .text {
      display: inline-block;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: -3px;
      color: rgb(234 247 255 / 80%);
    }
  }
  .arrow {
    margin-left: 3px;
    display: inline-block;
    width: 10px;
    height: 10px;
    background: transparent url('~@/images/gamecenter/right-arrow.png') no-repeat center center/ contain;
  }
  .pointer {
    cursor: pointer;
  }
  .wrapper {
    max-width: 1440px;
    margin: 0 auto;
  }
  .RankList {
    padding-top: 50px;
    padding: 0 40px;
    margin-bottom: 63px;
    .top-1, .top-3 {
      .content-wrap {
        height: calc(100% - 11vw - 15px);
        margin-top: 14px !important;
      }
    }
    .top-2 {
      .content-wrap {
        height: calc(100% - 12.2vw - 24px);
      }
    }
    .title-wrap {
      text-align: center;
      background: transparent url('~@/images/gamecenter/reserveZone/rank-title-bac.png') no-repeat center center / cover;
      width: 100%;
      height: 275px;
      padding-top: 81px;
      max-width: 1440px;
      margin: 0 auto;
      .title {
        font-size: 30px;
        font-weight: 700;
        letter-spacing: 1px;
        background: linear-gradient(178deg, #929292 20%, #EAF7FF 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      p.desc {
        margin-top: 20px;
        font-size: 12px;
        font-weight: 290;
        line-height: 12px;
        letter-spacing: 1.68px;
      }
    }
    .top-3-wrap {
      display: flex;
      justify-content: space-between;
      align-items: end;
      margin-bottom: 54px;
      max-width: 1280px;
      margin: -60px auto 30px auto;
      .top-wrapper {
        position: relative;
        width: 23.91vw;
        height: 20.43vw;
        max-width: 380px;
        max-height: 323px;
        &::before {
          content: '';
          width: 95px;
          height: 34px;
          position: absolute;
          top: -1px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2;
        }
        &.top-2 {
          width: 26.52vw;
          height: 22.53vw;
          max-width: 423px;
          max-height: 359px;
          .media-wrap {
            height: 12.2vw;
            max-height: 196px;
          }
        }
        &.top-1::before {
          background: transparent url('~@/images/gamecenter/reserveZone/top2.png') no-repeat center center / cover;
        }
        &.top-2::before {
          background: transparent url('~@/images/gamecenter/reserveZone/top1.png') no-repeat center center / cover;
        }
        &.top-3::before {
          background: transparent url('~@/images/gamecenter/reserveZone/top3.png') no-repeat center center / cover;
        }
        &::after {
          pointer-events: none;
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          top: -1px;
          left: -1px;
          background: transparent url('~@/images/gamecenter/reserveZone/rank-top-bac.png') no-repeat center center / cover;
        }
        .media-wrap {
          height: 11vw;
          max-height: 176px;
          video, img {
            width: 99.3%;
            height: 100%;
            object-fit: cover;
          }
        }
        .content-wrap {
          z-index: 1;
          margin-top: 24px;
          position: absolute;
          display: flex;
          justify-content: space-between;
          width: 100%;
          padding: 0 24px 0 20px;
          .downloadButton {
            position: absolute;
            bottom: 20px;
            right: 20px;
          }
          .detail-wrap {
            display: flex;
            flex-direction: column;
            gap: 12px;
            .title {
              background: linear-gradient(178deg, #929292 10%, #EAF7FF 100%);
              background-clip: text;
              -webkit-text-fill-color: transparent;
              font-size: 18px;
              font-weight: 700;
              letter-spacing: 1px;
              max-width: 200px;
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
            }
            .desc {
              font-size: 12px;
              font-weight: 400;
              letter-spacing: 1px;
              color: rgba(234, 247, 255, 0.80);
            }
          }
        }
      }
    }
  }
  .item {
    width: 100%;
    height: 76px;
    margin-bottom: 20px;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.20)0%, rgba(0, 0, 0, 0.20)100%), linear-gradient(77deg, rgba(30, 34, 39, 0.20)4.98%, rgba(112, 118, 150, 0.20)100.17%);
    position: relative;
    display: flex;
    &.IsRankList {
      height: 80px;
    }
    > div.img_box {
      position: relative;
      width: 143px;
      height: 76px;
      overflow: hidden;
      &.IsRankList_img_box {
        height: 80px;
      }
      > b {
        display: inline-block;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;
        transition: transform .4s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        > img {
          width: 42px;
          height: 42px;
          object-fit: cover;
        }
      }
      .arrow-up {
        position: absolute;
        top: 0;
        left: 0;
        width: 22px;
        height: 22px;
        background: transparent url('~@/images/gamecenter/arrow-up.png') no-repeat center center / contain;
      }
      .arrow-down {
        position: absolute;
        top: 0;
        left: 0;
        width: 22px;
        height: 22px;
        background: transparent url('~@/images/gamecenter/arrow-down.png') no-repeat center center / contain;
      }
    }
    > span {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 3;
      font-size: 12px;
      font-style: italic;
      color: #ffffff;
      font-weight: bold;
      line-height: 1;
      box-sizing: content-box;
      padding: 4px 7px 6px 5px;
      text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.31);
      border: 1px solid transparent;
      background-origin: border-box;
      background-clip: padding-box, border-box;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-image: linear-gradient(0deg, #0c9b34, #0c9b34),
        linear-gradient(135deg, #4ad370 7.43%, #0c8e30 94.88%);
      &.hot {
        background-image: linear-gradient(0deg, #eb2051, #eb2051),
          linear-gradient(135deg, #ff5981 7.43%, #a9062e 94.88%);
      }
      &.lowest {
        background-image: linear-gradient(0deg, #2420eb, #2420eb),
          linear-gradient(135deg, #6b68ff 7.43%, #13119a 94.88%);
      }
      &.limit {
        background-image: linear-gradient(0deg, #7d1bf9, #7d1bf9),
          linear-gradient(135deg, #b275ff 7.43%, #4c0e9b 94.88%);
      }
    }
    > section {
      width: 47.3%;
      margin-left: 20px;
      > div.softName {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        > b.rankTagB {
          margin-top: 6px;
        }
        > b.rankTag0 {
          display: inline-block;
          width: 63px;
          height: 20px;
          &.tab0 {
            background: url('@/images/gamecenter/nob-red-top1.png') no-repeat;
            background-size: contain;
          }
          &.tab2 {
            background: url('@/images/gamecenter/nob-purple-top1.png') no-repeat;
            background-size: contain;
          }
          &.tab3 {
            background: url('@/images/gamecenter/nob-green-top1.png') no-repeat;
            background-size: contain;
          }
          &.tab1 {
            background: url('@/images/gamecenter/nob-blue-top1.png') no-repeat;
            background-size: contain;
          }
        }
        > b.rankTag1 {
          display: inline-block;
          width: 63px;
          height: 20px;
          &.tab0 {
            background: url('@/images/gamecenter/nob-red-top2.png') no-repeat;
            background-size: contain;
          }
          &.tab2 {
            background: url('@/images/gamecenter/nob-purple-top2.png') no-repeat;
            background-size: contain;
          }
          &.tab3 {
            background: url('@/images/gamecenter/nob-green-top2.png') no-repeat;
            background-size: contain;
          }
          &.tab1 {
            background: url('@/images/gamecenter/nob-blue-top2.png') no-repeat;
            background-size: contain;
          }
        }
        > b.rankTag2 {
          display: inline-block;
          width: 63px;
          height: 20px;
          &.tab0 {
            background: url('@/images/gamecenter/nob-red-top3.png') no-repeat;
            background-size: contain;
          }
          &.tab2 {
            background: url('@/images/gamecenter/nob-purple-top3.png') no-repeat;
            background-size: contain;
          }
          &.tab3 {
            background: url('@/images/gamecenter/nob-green-top3.png') no-repeat;
            background-size: contain;
          }
          &.tab1 {
            background: url('@/images/gamecenter/nob-blue-top3.png') no-repeat;
            background-size: contain;
          }
        }
        > b.rankTagOther {
          display: inline-block;
          height: 23px;
          line-height: 23px;
          background: url('@/images/gamecenter/num-bac.png') no-repeat;
          background-size: 100% 100%;
          text-shadow: 0px 1.24px 1.317px rgba(0, 0, 0, 0.54);
          font-family: Orbitron;
          font-size: 12px;
          font-style: normal;
          font-weight: 900;
          font-variant: small-caps;
          padding: 0 19px 0 10px;
          box-sizing: border-box;
          white-space: nowrap;
        }
        p {
          color: #eaf7ff;
          font-size: 16px;
          font-style: normal;
          font-weight: 700;
          line-height: 16px;
          margin: 14px 0;
          display: -webkit-box !important;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          &.IsRankList_p {
            margin: 16px 0 12px 10px;
            background: linear-gradient(0, #FFF 1.88%, #929292 98.12%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        }
        > span.platform {
          margin-top: 5px;
          margin-left: 12px;
          font-size: 12px;
          color: rgba(234, 247, 255, 0.6);
          > i {
            display: inline-block;
            margin-right: 8px;
            font-size: 16px;
          }
        }
      }
      .play-label {
        line-height: 12px;
        padding: 5px 6px 6px 6px;
        font-size: 12px;
        background: linear-gradient(143deg, #474F5F 0%, #343B47 44.6%, #232831 89.03%);
        display: inline-block;
      }
      > ul {
        display: inline-block;
        white-space: nowrap;
        line-height: 20px;
        > li {
          display: inline-block;
          vertical-align: top;
          box-sizing: border-box;
          padding: 4px 8px 5px 8px;
          border: 1px solid rgba(234, 247, 255, 0.2);
          font-size: 12px;
          line-height: 1;
          margin-right: 8px;
          text-align: center;
          background: linear-gradient(178deg, #929292 1.88%, #eaf7ff 98.12%);
          background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 400;
          opacity: 0.6;
          &.active {
            font-weight: bold;
            color: #386EFE;
            border-color: rgba(56, 110, 254, 0.6);
          }
          &:last-child {
            margin-right: 0;
          }
        }
      }
    }
    > aside {
      height: 100%;
      margin-left: 20px;
      display: flex;
      justify-content: center;
      flex-direction: column;
      > i.discount {
        background-color: #f24a44;
        font-size: 14px;
        color: #eaf7ff;
        font-weight: bold;
        width: 46px;
        height: 22px;
        text-align: center;
        line-height: 22px;
        margin-bottom: 8px;
      }
      > div.price {
        > i.currentPrice {
          font-size: 16px;
          color: #eaf7ff;
          font-weight: bold;
        }
        > i.originalPrice {
          font-size: 12px;
          color: rgba(234, 247, 255, 0.4);
          text-decoration: line-through;
          margin-left: 6px;
        }
      }
      > p {
        color: rgba(234, 247, 255, .6);
        font-style: normal;
        font-weight: 400;
        font-size: 12px;
      }
    }
    > div.buyButton{
      position: absolute;
      right: 30px;
      top: 24px;
      z-index: 8;
      width: 98px;
      height: 34px;
      text-align: center;
      line-height: 32px;
      font-size: 14px;
    }
    :deep(.buyButton) {
      z-index: 8;
      width: 98px;
      height: 34px;
      text-align: center;
      line-height: 32px;
      font-size: 14px;
    }
    > div.downloadButton {
      position: absolute;
      right: 12px;
      top: 24px;
      z-index: 8;
      width: 98px;
      height: 34px;
      :deep(div span) {
        font-size: 14px;
        width: 100%;
      }
    }
    &:hover {
      background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.3) 100%), linear-gradient(77deg, rgba(30, 34, 39, 0.3) 4.98%, rgba(112, 118, 150, 0.3) 100.17%);
      > div.img_box {
        > b {
         transform: scale(1.15);
       }
     }
    }
  }
.auth-icon {
  height: 22px;
  margin-right: 4px;
  vertical-align: -6px;
}
// .soft-labels {
//   display: inline-block;
//   white-space: nowrap;
//   line-height: 20px;
  span.tag-item, .soft-labels li {
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
// }

  :deep(.grey-rect-btn) {
    .text {
      font-size: 14px;
    }
  }

.tags-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
    white-space: nowrap;
    position: relative;
    padding: 2px 8px 4px 8px;
    border: 1px solid rgba(234, 247, 255, 0.2);
    &::before {
      content: '';
      position: relative;
      z-index: 1;
      vertical-align: -3px;
      margin-right: 2px;
      display: inline-block;
      width: 16px;
      height: 16px;
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
.more {
  cursor: pointer;
  width: 100%;
  text-align: center;
  padding: 25px 0;
  color: #EAF7FF;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%), linear-gradient(77deg, rgba(30, 34, 39, 0.2) 4.98%, rgba(112, 118, 150, 0.2) 100.17%);
  max-width: 1440px;
  margin: 0 auto;
  .arrow {
    margin-left: 3px;
    display: inline-block;
    width: 10px;
    height: 10px;
    background: transparent url('~@/images/gamecenter/right-arrow.png') no-repeat center center/ contain;
  }
}
.downloadButton {

    :deep(.ReserveButton) {
      width: 90px;
      height: 34px;
      line-height: 32px;
    }
    :deep(.DownloadButton) {
      width: 90px;
      height: 34px;
      line-height: 32px;
    }

}
@media screen and (min-width: 1540px) {
  .RankList .top-1 .content-wrap, .RankList .top-3 .content-wrap {
    min-height: 131px;
  }
  .RankList .top-2 .content-wrap {
    min-height: 139px;
  }
}

.top-3-wrap .top-wrapper:focus-visible,
.wrapper:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

.more:focus-visible,
.item .buyButton:focus-visible,
.bindtag:focus-visible,
.tag:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .top-3-wrap .top-wrapper:focus-visible,
  .wrapper:focus-visible,
  .more:focus-visible,
  .item .buyButton:focus-visible,
  .bindtag:focus-visible,
  .tag:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
