<template>
  <section class="BigBanner" v-if="curPic">
    <div class="play-wrap">
      <div class="mask"></div>
      <video
        v-if="curPic.videoUrls && curPic.videoUrls.length && curPic.videoUrls[0]"
        ref="videoDom"
        :src="curPic.videoUrls[0]"
        :poster="curPic.imgUrls[0]"
        muted
        autoplay
        class="video"
        tabindex="0"
        role="button"
        :aria-label="(curPic.title || '') + '，点击查看详情'"
        @click="goToDetail"
        @keydown.enter.prevent.stop="goToDetail"
        @keydown.space.prevent.stop="goToDetail"
      ></video>
      <img
        v-else
        :src="curPic.imgUrls[0]"
        class="image"
        tabindex="0"
        role="button"
        :aria-label="(curPic.title || '') + '，点击查看详情'"
        @click="goToDetail"
        @keydown.enter.prevent.stop="goToDetail"
        @keydown.space.prevent.stop="goToDetail"/>
      <span
        v-if="curPic.logoFile"
        class="game-logo"
        :style="{ backgroundImage:`url(${curPic.logoFile})` }"
        aria-hidden="true"
        @click="goToDetail" />
      <div class="info-wrap">
        <div class="tags-wrap">
          <template v-for="(icon, key) in iconList" >
            <template v-if="icon">
              <template v-if="icon.labelName">
                <span
                  :key="'icon-'+key"
                  class="tag"
                  tabindex="0"
                  role="button"
                  :aria-label="icon.labelName + 'TOP' + icon.num + '，点击查看排行榜'"
                  @click="goToRankList(icon)"
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
              <template v-else>
                <img :key="'icon-'+key" class="auth-icon" aria-hidden="true" :src="icon" />
              </template>
            </template>
          </template>
        </div>
        <!-- <div v-if="curPic.softInfo && curPic.softInfo.downloadInfo && curPic.softInfo.downloadInfo.tagUrls.length">
        </div> -->
        <h3 class="name"><i class="text">{{ curPic.title }}</i><i class="text-shadow">{{ curPic.title }}</i></h3>
        <!-- <p class="info" v-if="curPic.description">{{ curPic.description }}</p> -->
        <p class="info" v-if="curPic.softInfo.relateActivitys && curPic.softInfo.relateActivitys.length" >
          <span v-for="bindTag in curPic.softInfo.relateActivitys" :key="bindTag.title" tabindex="0" role="button" :aria-label="bindTag.title" @click="goToBindTag(bindTag, curPic)" @keydown.enter.prevent.stop="goToBindTag(bindTag, curPic)" @keydown.space.prevent.stop="goToBindTag(bindTag, curPic)">
            {{ bindTag.title }}<i class="arrow"></i>
          </span>
        </p>
        <!-- <p class="cdk" v-if="isCDKGame">
          <span v-if="curPic.softInfo.productInfo.discount" class="discount">{{ curPic.softInfo.productInfo.discount }}</span>
          <span class="currentPrice">¥{{ curPic.softInfo.productInfo.currentPrice }}</span>
          <span v-if="curPic.softInfo.productInfo.discount && curPic.softInfo.productInfo.originalPrice" class="originalPrice">¥{{ curPic.softInfo.productInfo.originalPrice }}</span>
          <span v-if="curPic.softInfo.productInfo.exchangePlatformFont" class="iconfont platform" v-html="curPic.softInfo.productInfo.exchangePlatformFont"></span>
        </p> -->
        <p class="btn-wrap">
          <GameDownloadButton
            v-if="isDownloadGame"
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
          <button class="common-abnomal-btn" v-if="isCDKGame" @click="showPay">
            <i class="text">立即购买</i>
          </button>
        </p>
      </div>
    </div>
    <ul class="pg-navigation" aria-hidden="true">
      <li
        v-for="(item, index) in pgList"
        :key="index"
        :class="[curIndex === index ? 'selected':'']"
        @mouseenter="mouseEnterPG(index)"
        @mouseleave="mouseLeavePG"
        @click="goToDetail"
      >
        <div
          class="img-item"
          :style="{ backgroundImage:`url(${item.imgUrls[0]})` }" >
        </div>
      </li>
    </ul>
  </section>
</template>
<script>
const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect()
  // elOffsetBottom 指目标元素的头顶部距离 可视区底部的距离  也就是 目标元素从底部出现向上滚动多少出现动画 可配置
  return (window.innerHeight || document.documentElement.clientHeight) + rect.top - 400
}

import GameDownloadButton from '@/components/GameDownloadButton'
export default {
  name: 'BigBanner',
  data() {
    return {
      curIndex: 0,
      clock: null,
      thirdLocal: '',
      inViewport: true
    }
  },
  props: {
    moduleData: {
      type: Object,
      required: true
    }
  },
  components: {
    GameDownloadButton
  },
  computed: {
    iconList() {
      try {
        let tagList = []
        if (this.curPic.fillDataType === 1 || this.curPic.fillDataType === 2) {
          const showInfoObj = this.curPic?.softInfo?.showInfo || {}
          tagList = showInfoObj.rankingLabelInfos?.slice(0, 1) || []
        }
        const onlineTime = this.curPic.softInfo?.downloadInfo?.releaseRemind || ''
        const onlineTag = onlineTime ? [{ type: 'online-tag', text: onlineTime }] : []
        const tags = [].concat(tagList, ...onlineTag, this.curPic?.softInfo?.downloadInfo?.tagUrls || []).slice(0, 3)
        return tags.filter((item) => item !== null)
      } catch (error) {
        return []
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
    userInfo() {
      return this.$store.state.user.userInfo
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
    isCDKGame() {
      return this.curPic.fillDataType === 1
    },
    isDownloadGame() {
      return [2, 6].includes(this.curPic.fillDataType)
    }
  },
  methods: {
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
            clickType: 2
          })
        }
      )
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
    goToDetail() {
      const usedForReport = this.moduleData.rankingLists?.[0].name || ''
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
            clickType: 1
          })
        }
      )
      // this.bannerGameReport('LZ_storeCurationBannerGameClick', 'click', this.curPic)
      // 1-游戏CDK、2-游戏下载、3-游戏中心榜单（跳转到其他榜单列表、4-社区
      switch (this.curPic.fillDataType) {
        case 1:
        case 2:
        case 6:
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: this.curPic.softInfo.softId },
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
          this.$router.push({
            name: 'GameCenterList',
            query: {
              rankID: this.curPic.relateRankingInfo.id,
              rankName: this.curPic.relateRankingInfo.name,
              reportPlateName: usedForReport,
              plateName: usedForReport
            }
          })
          break
        case 4:
          this.$router.push({
            path: `/forum/micro/detail/${this.curPic.communityInfo.id}`,
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
          this.$router.push({
            path: `/gameCenter/online/index`,
            query: {
              id: this.curPic.activityPageInfo.id,
              firstLocal: this.firstLocal,
              secondLocal: 11,
              plateNameReport: usedForReport
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
      }
    },
    mouseEnterPG(index) {
      clearTimeout(this.clock)
      // 清理上一个视频资源
      if (this.curIndex !== index && this.$refs.videoDom) {
        this.$refs.videoDom.pause()
        this.$refs.videoDom.currentTime = 0
        this.$refs.videoDom.src = null
      }
      this.curIndex = index
    },
    mouseLeavePG() {
      this.startClock()
    },
    startClock() {
      //  清理计时器
      if (this.clock) clearTimeout(this.clock)
      const time = this.curPic?.videoUrls?.length ? 5000 : 3000
      if (this.inViewport) {
        this.bannerGameReport('LZ_storeReservZoneOperatBitsShow', 'pv', this.curPic)
      }

      this.clock = setTimeout(() => {
        // 清理上一个视频资源
        if (this.$refs.videoDom) {
          this.$refs.videoDom.pause()
          this.$refs.videoDom.currentTime = 0
          this.$refs.videoDom.src = null
        }
        this.curIndex = this.curIndex + 1 >= this.pgList.length ? 0 : this.curIndex + 1
        this.startClock()
      }, time)
    },
    bannerGameReport(action, label, item) {
      const skuName = item.softInfo.softName || item.communityInfo.name || item.activityPageInfo.name || item.relateRankingInfo.name
      const softID = item.softInfo.softId || item.communityInfo.id || item.activityPageInfo.id || item.relateRankingInfo.id
      const version = item.activityPageInfo.id ? 2 : (item.communityInfo.id ? 3 : 1)
      this.$dataReport('LZ_gamingCenter', action, label, {
        detail: JSON.stringify({
          plateName: this.moduleData.rankingLists[0].name || '',
          nameAndIDVersion: `${skuName}_${softID}_${version}`,
          lenovoid: this.userInfo?.UserID || ''
          // ,
          // stateGame,
          // statePage,
          // gameClass
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
    window.removeEventListener('scroll', this.scrollHandle, true)
    window.addEventListener('scroll', this.scrollHandle, true)
  },
  beforeUnmount() {
    clearTimeout(this.clock)
    // 清理上一个视频资源
    if (this.$refs.videoDom) {
      this.$refs.videoDom.pause()
      this.$refs.videoDom.currentTime = 0
      this.$refs.videoDom.src = null
    }
    window.removeEventListener('scroll', this.scrollHandle, true)
  }
}
</script>
<style lang="scss" scoped>
.pg-navigation {
  flex: initial;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  li {
    cursor: pointer;
    box-sizing: content-box;
    &:last-child{
      margin-bottom: 0;
    }
    .img-item {
      width: 13.77vw;
      height: 6.37vw;
      max-width: 243px;
      max-height: 117px;
      background-size: cover;
      border-radius: 5px;
      box-sizing: content-box;
    }
    &.selected .img-item {
      border: 1px solid #939ba1;
    }
  }
}
.BigBanner {
  position: relative;
  width: calc(100% - 80px);
  height: 36.67vw;
  max-height: 655px;
  object-fit: cover;
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 0 auto;
  max-width: 1360px;
  .image, .video {
    object-fit: cover;
    width: 100%;
    height: 100%;
    // width: 65.22vw;
    // height: 36.67vw;
    // max-width: 1166px;
    // max-height: 653px;
    border-radius: 5px;
  }
  .play-wrap {
    position: relative;
    flex: auto;
    .mask {
      pointer-events: none;
      position: absolute;
      width: 470px;
      height: 100%;
      background: linear-gradient(to left, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0, 0.7) 100%);
    }
  }
}
.game-logo {
  cursor: pointer;
  position: absolute;
  top: 44px;
  left: 30px;
  width: 132px;
  height: 85px;
  background-size: contain;
  background-repeat: no-repeat;
}
.info-wrap {
  position: absolute;
  bottom: 62px;
  left: 30px;
  .name {
    position: relative;
    margin-bottom: 20px;
    z-index: 0;
    i {
      font-family: "Microsoft YaHei";
      font-size: 32px;
      line-height: 44px;
      font-style: normal;
      font-weight: 700;
    }
    i.text {
      display: inline-block;
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
      font-size: 32px;
      text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.50);
      color: transparent;
    }
  }
  .info {
    cursor: pointer;
    color: #EAF7FF;
    text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.40);
    font-size: 14px;
    margin-bottom: 16px;
    line-height: 14px;
    .arrow {
      margin-left: 3px;
      display: inline-block;
      width: 10px;
      height: 10px;
      background: transparent url('~@/images/gamecenter/right-arrow.png') no-repeat center center/ contain;
    }
  }
  .tags-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 14px;
    height: 25px;
    .online {
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.5);
      color: #95FF38;
      padding: 2.5px 4px;
      vertical-align: 0px;
      font-size: 12px;
      border-radius: 1px;
      letter-spacing: 1px;
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
  p.cdk {
      display: flex;
      align-items: center;
      overflow: hidden;
      > span.discount {
        background-color: #F24A44;
        font-size: 12px;
        color: #EAF7FF;
        font-weight: bold;
        line-height: 1;
        box-sizing: content-box;
        padding: 3px 6px;
        margin-right: 8px;
      }
      > span.currentPrice {
        font-size: 12px;
        color: #EAF7FF;
        font-weight: bold;
        margin-right: 6px;
        padding-bottom: 1px;
      }
      > span.originalPrice {
        font-size: 11px;
        color: rgba(234, 247, 255, 0.6);
        text-decoration: line-through;
        margin-right: 16px;
      }
      > span.platform {
        width: 14px;
        height: 14px;
        font-size: 14px;
        color: rgba(234, 247, 255, 0.4);
      }
    }
  .auth-icon {
    height: 24px;
  }
}
// @media screen and (max-width: 1380px) {
//   .BigBanner {
//     .video, .image {
//       width: 816px;
//     }
//   }
// }

.BigBanner .video:focus-visible,
.BigBanner .image:focus-visible,
.BigBanner .info-wrap .tags-wrap .tag:focus-visible,
.BigBanner .info-wrap .info span:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

@media (forced-colors: active) {
  .BigBanner .video:focus-visible,
  .BigBanner .image:focus-visible,
  .BigBanner .info-wrap .tags-wrap .tag:focus-visible,
  .BigBanner .info-wrap .info span:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
