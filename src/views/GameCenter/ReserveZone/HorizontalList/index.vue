<template>
  <section class="HorizontalList">
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleData.moduleEname }}</span>
      <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ moduleData.moduleName }}&nbsp;<i
        class="gc-title-quote-icon"></i></span>
      <span v-else class="gc-title-text">{{ moduleData.moduleName }}</span>
      <span class="more" tabindex="0" role="button" @click="toList()" @keydown.enter.prevent.stop="toList()" @keydown.space.prevent.stop="toList()">查看全部 <i
        class="iconfont icon2"
        :style="{ height: '12px' }">&#xe632;</i></span>
    </h3>
    <section
      class="list-box"
      ref="stage"
      v-exposure="{
        handler: () => onExposure(),
        delay: 1000,
        options: { threshold: 1 },
        once: true
      }">
      <div
        v-for="(item, index) of rankingListSofts"
        :key="item.id + index"
        class="list-item-box"
        :class="{ 'list-item-box-two  list-container-border': index === activeIndex }"
        tabindex="0"
        role="button"
        :aria-label="item.softName + '，点击查看详情'"
        @click="toGameDetail(item)"
        @keydown.enter.prevent.stop="toGameDetail(item)"
        @keydown.space.prevent.stop="toGameDetail(item)">
        <template v-if="index === activeIndex">
          <sub class="horn-right"></sub>
          <sub class="horn-left"></sub>
          <sub class="bor-dot2"></sub>
          <div class="radio-img-class">
            <template v-if="item && item.softDesc.mediaList[0].type === 'video'">
              <video ref="videoDom" class="img-item" :src="item.softDesc.mediaList[0].url" autoplay muted loop></video>
            </template>
            <template v-else>
              <img class="img-item" :src="item.softDesc.mediaList[0].url" />
            </template>
          </div>
          <div class="content-area">
            <img :src="item.rankingListLabelImg" class="back-img" />
            <div class="text-container">
              <div class="list-title">{{ item.softName }}</div>
              <!-- <div class="desc" :style="{ marginTop: '14px' }">{{ item.softDesc.introduction }}</div> -->
              <div :style="{ marginTop: '10px' }">
                <div class="tags-wrap" v-if="targetList.length">
                  <template v-for="(icon, key) in targetList(item)">
                    <template v-if="icon || icon.labelName || icon.num || icon.text">
                      <template v-if="icon.labelName">
                        <span :key="'icon-' + key" class="tag" tabindex="0" role="button" :aria-label="icon.labelName + ' TOP' + icon.num" @click.stop="goToRankList(icon, item)" @keydown.enter.prevent.stop="goToRankList(icon, item)" @keydown.space.prevent.stop="goToRankList(icon, item)">
                          <i class="text-bac"></i>
                          <i class="text">
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
                        <span class="online" :key="'icon-' + key"><i class="online-icon"></i>{{ icon.text }}</span>
                      </template>
                      <template v-else-if="icon.type === 'img'">
                        <img :key="'icon-' + key" class="auth-icon" :src="icon.url" />
                      </template>
                      <template v-else>
                        <span :key="'icon-' + key" class="tag-text"> {{ icon }}</span>
                      </template>
                    </template>
                  </template>
                </div>
              </div>
              <div :style="{ marginTop: '10px' }" class="flex-center-item">
                <span class="desc">{{ item.downloadInfo.reservationCount + hackObj[index] }}人预约</span>
                <template v-if="item.relateActivitys.length">
                  <span style="margin: 0 8px">·</span>
                  <img src="./star-icon.png" class="icon1" />
                  <span
                    class="activite-text"
                    tabindex="0"
                    role="button"
                    :aria-label="item.relateActivitys[0].title || '活动'"
                    @click.stop="toDetailActivity(item.relateActivitys[0])"
                    @keydown.enter.prevent.stop="toDetailActivity(item.relateActivitys[0])"
                    @keydown.space.prevent.stop="toDetailActivity(item.relateActivitys[0])">{{ item.relateActivitys[0].title || '' }}</span>
                  <img src="./next-icon.png" class="icon1" />
                </template>
              </div>
              <GameDownloadButton
                class="button-class"
                button-style="abnormal"
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
                :drinfo="drinfo(item)"
                :sku-id="item.skuId"
                @reserveSuccess="(value) => reserveSuccess(value, index)" />
            </div>
          </div>
        </template>
        <template v-else>
          <div class="list-item-img list-container-border" @mouseenter="curBigCradIn(index)">
            <sub class="horn-right"></sub>
            <sub class="horn-left"></sub>
            <sub class="bor-dot2"></sub>
            <img :src="item.rankingListLabelImg" class="img" />
          </div>
          <div>
            <div class="list-title article-item">{{ item.softName }}</div>
            <div class=" text-small-container">
              <span>{{ item.downloadInfo.reservationCount + hackObj[index] }}人预约</span>
              <template v-if="item.relateActivitys.length">
                <span style="margin: 0 8px">·</span>
                <span class="text-ellipsis" tabindex="0" role="button" :aria-label="item.relateActivitys[0].title" @click.stop="toDetailActivity(item.relateActivitys[0])" @keydown.enter.prevent.stop="toDetailActivity(item.relateActivitys[0])" @keydown.space.prevent.stop="toDetailActivity(item.relateActivitys[0])">{{
                  item.relateActivitys[0].title }}</span>
                <i class="iconfont icon2">&#xe632;</i>
              </template>
            </div>
          </div>
        </template>
      </div>
    </section>
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
      rankingListSofts: [],
      activeIndex: 0,
      relateActivity: {},
      moduleId: '',
      moduleName: '',
      secondLocal: 17,
      numbList: [0, 0, 0, 0, 0],
      hackObj: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0
      },
      resizeObserver: null
    }
  },
  mounted() {
    const componentData = this.moduleData.rankingLists[0]

    this.rankingListSofts = componentData.rankingListSofts?.slice(0, 5) || []
    this.moduleId = componentData.id
    this.moduleName = componentData.name

    this.resizeObserver = new ResizeObserver(this.resizeObserverHandle)
    const stageRef = this.$refs.stage
    const stageEl = stageRef?.$el || stageRef
    if (stageEl && stageEl.nodeType === 1) {
      this.resizeObserver.observe(stageEl)
    }
  },
  computed: {
    drinfo() {
      return (item) => {
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.moduleName || '',
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
    userInfo() {
      return this.$store.state.user.userInfo
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }
      return this.$route.query.firstLocal || 2
    }
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect() // 停止所有观察
      this.resizeObserver = null // 释放引用
    }
  },
  methods: {
    curBigCradIn(index) {
      this.activeIndex = index
    },
    goToRankList(rankItem, gameItem) {
      this.$router.push({
        path: '/gameCenter/rankList',
        query: {
          tab: rankItem.labelCode
        }
      })
      this.$dataReport('LZ_gamingCenter', 'LZ_storeReservZoneOperatBitsClick', 'click', {
        detail: JSON.stringify({
          type: 1,
          skuName: gameItem.softName,
          skuID: gameItem.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          plateName: this.moduleName,
          clickType: 3
        })
      })
    },
    toDetailActivity(aItem) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeReservZoneOperatBitsClick', 'click', {
        detail: JSON.stringify({
          type: 1,
          skuName: aItem.title,
          skuID: aItem.jumpUrl,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          plateName: this.moduleName,
          clickType: 2
        })
      })
      if (Number(aItem.jumpType) === 2) {
        this.$router.push({
          path: `/forum/micro/detail/${aItem.jumpUrl}`,
          query: {
            forumSource: 2
          }
        })
      } else {
        this.$router.push({
          name: 'GameCenterOnline',
          query: {
            id: aItem.jumpUrl,
            secondLocal: this.secondLocal
          }
        })
      }
    },
    toGameDetail(item) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeReservZoneOperatBitsClick', 'click', {
        detail: JSON.stringify({
          type: 1,
          skuName: item.softName,
          skuID: item.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          plateName: this.moduleName,
          clickType: 1
        })
      })
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          plateName: this.moduleName
        }
      })
    },
    targetList(item) {
      try {
        const rankingLabelInfos = item?.showInfo?.rankingLabelInfos || []
        const upActivity = item?.downloadInfo?.releaseRemind ? [{ type: 'online-tag', text: item?.downloadInfo?.releaseRemind }] : []
        const authentication = item?.downloadInfo?.tagUrls?.map(item => {
          return { type: 'img', url: item }
        }) || []
        const gameTags = item?.showInfo?.softLabels || []
        const result = [...rankingLabelInfos, ...upActivity, ...authentication, ...gameTags].slice(0, 3) || []

        return result
      } catch (error) {
        return []
      }
    },
    toList() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 1,
          plateName: this.moduleName,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$router.push({
        name: 'GameCenterList',
        query: {
          rankID: this.moduleId,
          rankName: this.moduleName,
          secondLocal: this.secondLocal
        }
      })
    },
    onExposure() {
      const gameList = this.rankingListSofts.map(item => {
        return `${item.softId}_${item.softName}_1`
      }) || []
      //  const gameStr = gameList.join(',')

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeReservZoneOperatBitsShow',
        'pv',
        {
          detail: JSON.stringify({
            plateName: this.moduleData.moduleName,
            nameAndIDVersion: gameList,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        }
      )
    },
    reserveSuccess(value, index) {
      if (value) {
        this.hackObj[index] = this.hackObj[index] + 1
      } else {
        this.hackObj[index] = this.hackObj[index] - 1
      }
    },
    resizeObserverHandle(entries) {
      if (!entries || entries.length <= 0 || entries[0].borderBoxSize.length <= 0) return

      const cWidth = window.innerWidth

      if (cWidth < 1440 && this.activeIndex === 4) {
        this.activeIndex = 0
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.HorizontalList {
  width: 100%;
  //  background: linear-gradient(0deg, rgba(0, 0, 0, 0.60) 38.87%, rgba(0, 0, 0, 0.00) 100%);
  box-sizing: border-box;
  overflow: hidden;
  max-width: 1440px;
  margin: 50px auto 50px;
  //padding: 0 40px;

  h3.title-wrap {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 17px 0px 40px 0px;
    margin: 0 40px;

    .title-bac {
      position: absolute;
      top: 0px;
      left: 0px;
    }

    .more {
      line-height: 14px;
      font-weight: 400;
      font-size: 14px;
      opacity: 0.6;
      z-index: 9;
      cursor: pointer;
      margin-top: 14px;
      line-height: 14px;
      height: 14px;

      &:hover {
        color: #386EFE;
        opacity: 1;
      }

      &:focus-visible {
        outline: 2px solid #4fc3f7;
        outline-offset: 4px;
        border-radius: 2px;
        opacity: 1;
      }
    }
  }

  .list-box {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    aspect-ratio: 1032 /396;
    //width: 1120px;
    //  height: 436px;
    margin: 0 40px;

    .list-item-box {
      box-sizing: border-box;
      flex: 1;
      min-height: 100%;
      align-self: stretch;
      transition: flex 0.3s ease-in-out;
      overflow: hidden;

      display: flex;
      flex-direction: column;

      &:nth-child(5) {
        display: none;
      }

      &:focus-visible {
        outline: 2px solid #4fc3f7;
        outline-offset: -2px;
        border-radius: 8px;
      }

    }

    .list-item-box-two {
      height: 100%;
      flex: 2.09;
      transition: flex 0.3s ease-in-out;
      overflow: hidden;

      .radio-img-class {
        flex: 1;
        aspect-ratio: 16 / 9;
        // flex: 1;
        overflow: hidden;

        video {
          height: 100%;
          width: 100%;
          //  object-fit: cover //  aspect-ratio: 16/9
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .content-area {
        height: 173px;
        position: relative;
        overflow: hidden;
        width: 100%;
        border: 1px solid transparent;

        .back-img {
          width: 100%;
          height: 100%;
          position: absolute;
          z-index: 1;
          top: 0;
          left: 2;
          right: 2;
          bottom: 0;
        }

      }

      .text-container {
        height: 100%;
        box-sizing: border-box;
        width: 100%;
        padding: 16px 28px 20px;
        position: relative;
        overflow: hidden;
        z-index: 2;
        font-size: 12px;
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(0deg, rgba(112, 118, 150, 0.40) -49.15%, rgba(30, 34, 39, 0.40) 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.00) -74.77%, rgba(0, 0, 0, 0.80) -74.77%, rgba(28, 30, 30, 0.90) 80.46%);
        backdrop-filter: blur(6px);

      }
    }

    .list-item-img {
      flex: 1;
      width: 100%;

      .img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .list-title {
      font-size: 18px;
      font-weight: 700;
      width: 100%;
      background: linear-gradient(0, #FFF 1.88%, #929292 98.12%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .article-item {
      // display: flex;
      // align-items: center;
      margin-top: 13px;
    }

    .desc {
      color: rgba(234, 247, 255, 0.80);
      letter-spacing: 1px;
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-small-container {
      margin-top: 13px;
      color: rgba(234, 247, 255, 0.80);
      letter-spacing: 1px;
      font-size: 12px;
      display: flex;
      align-items: center;
      white-space: nowrap;
    }

    .list-container-border {
      position: relative;
      border: 1px solid transparent;
      overflow: hidden;

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        /* 覆盖整个元素 */
        z-index: 1;
        background:
          /* 顶部边框 */
          linear-gradient(to right, #fff, #fff) top / 100% 1px no-repeat,

          /* 底部边框 */
          linear-gradient(to right, rgba(252, 252, 252, 0.2), rgba(252, 252, 252, 0.2)) bottom / 100% 1px no-repeat;
      }

      /* 伪元素2：控制左侧和右侧边框 */
      &::after {
        content: "";
        position: absolute;
        inset: 0;
        /* 覆盖整个元素 */
        z-index: 1;
        background:
          /* 右侧边框： */
          linear-gradient(to top, rgba(252, 252, 252, 0.2), #fff) right / 1px 100% no-repeat,

          /* 左侧边框 */
          linear-gradient(to bottom, #fff, rgba(252, 252, 252, 0.2)) left / 1px 100% no-repeat;
      }

      sub.horn-right {
        position: absolute;
        right: -1px;
        top: 0;
        width: 20px;
        height: 20px;
        background: url('@/images/gamecenter/horn-right.png') no-repeat;
        background-size: 100% 100%;
        background-position: center center;
        z-index: 2;
      }

      sub.horn-left {
        position: absolute;
        left: 0;
        bottom: 0;
        width: 20px;
        height: 18px;
        background: url('./hoc-left.png') no-repeat;
        background-size: 100% 100%;
        background-position: center center;
        z-index: 3;
      }
    }

  }

  .icon1 {
    display: inline-block;
    vertical-align: middle;
    width: 12px;
    height: 12px;
    margin-right: 3px;
  }

  .icon2 {
    display: inline-block;
    vertical-align: lighter;
    font-weight: lighter;
    font-size: 10px;
    transform: rotate(-90deg);
  }

  .text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
    cursor: pointer
  }

  .tags-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    overflow: hidden;

    .online {
      background: rgba(0, 0, 0, 0.72);
      border: 1px solid rgb(255 255 255 / 46%);
      color: #95FF38;
      padding: 3px 4px;
      vertical-align: 0px;
      font-size: 11px;
      height: 22px;
      box-sizing: border-box;
      line-height: 18px;

      .online-icon {
        vertical-align: -4px;
        display: inline-block;
        width: 16px;
        height: 16px;
        background: transparent url('~@/images/gamecenter/reserveZone/online-icon.png') no-repeat center center/ contain;
      }
    }

    .tag-text {
      height: 22px;
      padding: 2px 8px 4px 8px;
      border: 1px solid rgba(234, 247, 255, 0.2);
    }

    .tag {
      position: relative;
      padding: 2px 8px 4px 8px;
      border: 1px solid rgba(234, 247, 255, 0.2);
      cursor: pointer;
      height: 22px;

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

  .button-class {
    margin-top: 16px;

  }

  .auth-icon {
    height: 22px;
  }

  // sub.bor-dot2 {
  //   position: absolute;
  //   left: 0;
  //   bottom: 14px;
  //   width: 1px;
  //   height: 1px;
  //   background: rgb(32 31 31);
  //   z-index: 10;
  // }

  .flex-center-item {
    display: flex;
    align-items: center;
  }
  .activite-text {
    color: rgba(255, 226, 182, 1);
    cursor:pointer;
     letter-spacing: 1px;
  }

}

@media screen and (min-width: 1440px) {
  .HorizontalList .list-box .list-item-box:nth-child(5) {
    display: flex;
  }
  .HorizontalList .list-box {
    aspect-ratio: 1380/ 436;
  }
}

</style>

<style scoped>
.HorizontalList .tag:focus-visible,
.HorizontalList .activite-text:focus-visible,
.HorizontalList .text-ellipsis:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .HorizontalList .tag:focus-visible,
  .HorizontalList .activite-text:focus-visible,
  .HorizontalList .text-ellipsis:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
