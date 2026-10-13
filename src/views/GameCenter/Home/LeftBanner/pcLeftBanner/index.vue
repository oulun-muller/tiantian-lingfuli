<template>
  <div
    class="LeftBanner"
    v-if="rankSoftList.data.length">
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleEname }}</span>
      <span class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ rankSoftList.name }}&nbsp;<i class="gc-title-quote-icon"></i></span>
    </h3>
    <div
      :id="`leftBannerViewport${currentBanner.id}`"
      class="container"
      tabindex="0"
      role="button"
      :aria-label="(currentBanner.softInfo && currentBanner.softInfo.softName ? currentBanner.softInfo.softName : currentBanner.title || '') + '，点击查看详情'"
      @pointerenter="play"
      @pointerleave="play"
      @click="toDetail(currentBanner)"
      @keydown.enter.prevent.stop="toDetail(currentBanner)"
      @keydown.space.prevent.stop="toDetail(currentBanner)">
      <div
        v-if="inViewport"
        class="left animated"
        :class="{ 'leftBannerFadeInLeft': inViewport }">
        <div
          style="
          width: 50vw;
          height: 45.284vw;
          max-width: 870px;
          max-height: 720px;
          overflow: hidden;
          "
          v-show="currentBanner.sv"
          :class="`movingFigure${currentBanner.id}`"></div>
        <img v-show="currentBanner.imgUrls" class="leftBannerImg" :src="currentBanner.imgUrls" :alt="currentBanner.softInfo && currentBanner.softInfo.softName ? currentBanner.softInfo.softName : currentBanner.title || ''" aria-hidden="true">
      </div>
      <div
        v-if="inViewport"
        class="center animated"
        :class="{ 'leftBannerFadeInRight': inViewport }">
        <!-- 纯游戏 -->
        <section v-if="[1,2,6].includes(currentBanner.fillDataType)">
          <h2>{{ currentBanner.softInfo.softName }}</h2>
          <p
            v-if="currentBanner.description"
            class="content">{{ currentBanner.description }}</p>
          <div class="auth-wrap" v-if="currentBanner.softInfo.downloadInfo && currentBanner.softInfo.downloadInfo.tagUrls.length">
            <img
              v-for="(url, index) in currentBanner.softInfo.downloadInfo.tagUrls.slice(0, 3)"
              class="auth-icon"
              :key="index"
              :src="url"
              aria-hidden="true" />
          </div>
          <ul v-if="currentBanner.softInfo.showInfo.softLabels.length">
            <li
              v-for="(tagItem, tagIndex) of currentBanner.softInfo.showInfo.softLabels.slice(0, 4)"
              :key="tagIndex">{{ tagItem }}</li>
          </ul>
          <p class="cdk" v-if="currentBanner.softInfo.softPurpose === 1">
            <span v-if="currentBanner.softInfo.productInfo.discount" class="discount">{{ currentBanner.softInfo.productInfo.discount }}</span>
            <span class="currentPrice">¥{{ currentBanner.softInfo.productInfo.currentPrice }}</span>
            <span v-if="currentBanner.softInfo.productInfo.discount && currentBanner.softInfo.productInfo.originalPrice" class="originalPrice">¥{{ currentBanner.softInfo.productInfo.originalPrice }}</span>
            <span v-if="currentBanner.softInfo.productInfo.exchangePlatformFont" class="iconfont platform" v-html="currentBanner.softInfo.productInfo.exchangePlatformFont"></span>
          </p>
          <div class="button">
            <div
              class="buyButton common-abnomal-btn"
              v-if="currentBanner.softInfo.softPurpose === 1"
              tabindex="0"
              role="button"
              aria-label="购买"
              @click.stop="showPay(currentBanner)"
              @keydown.enter.prevent.stop="showPay(currentBanner)"
              @keydown.space.prevent.stop="showPay(currentBanner)"><i class="text" aria-hidden="true">购买</i></div>
            <GameDownloadButton
              v-else
              button-style="abnormal"
              :download-info="currentBanner.softInfo.downloadInfo"
              :soft-desc="currentBanner.softInfo.softDesc"
              :soft-id="currentBanner.softInfo.softId"
              :soft-purpose="currentBanner.softInfo.softPurpose"
              :product-info="currentBanner.softInfo.productInfo"
              :user-purchased-status="currentBanner.softInfo.productInfo.userPurchasedStatus"
              :version="currentBanner.softInfo.softDesc.version"
              :soft-name="currentBanner.softInfo.softName"
              :logo-file="currentBanner.softInfo.showInfo.logoFile"
              :fast-install="currentBanner.softInfo.showInfo.isFastInstall"
              :drinfo="drinfo(currentBanner)"
              :sku-id="currentBanner.softInfo.skuId" />
          </div>
        </section>
        <!-- 运营位 -->
        <section v-else-if="[3,4,5,8].includes(currentBanner.fillDataType)" class="nonGaming">
          <h2>{{ currentBanner.title }}</h2>
          <p
            class="content"
            v-if="currentBanner.description">{{ currentBanner.description }}</p>
        </section>
      </div>
      <div class="right">
        <span
          v-if="rankSoftList.data.length>1"
          class="dotIndicator">
          <i
            v-for="(item, index) of rankSoftList.data"
            :key="item.id"
            :class="{ active: activeIndex === index }"
            tabindex="0"
            role="button"
            :aria-label="`切换到第${index + 1}项`"
            :aria-pressed="activeIndex === index ? 'true' : 'false'"
            @pointerenter="setActiveIndex(index)"
            @keydown.enter.prevent.stop="setActiveIndex(index)"
            @keydown.space.prevent.stop="setActiveIndex(index)"></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'

import SVGA from 'svgaplayerweb'
const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect()
  // elOffsetBottom 指目标元素的头顶部距离 可视区底部的距离  也就是 目标元素从底部出现向上滚动多少出现动画 可配置
  const elOffsetBottom = 50
  return (window.innerHeight || document.documentElement.clientHeight) - (rect.top + elOffsetBottom)
}
export default {
  name: 'LeftBanner',
  components: {
    GameDownloadButton
  },
  data() {
    return {
      activeIndex: 0,
      inViewport: false,
      thirdLocal: ''
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  watch: {
    inViewport: {
      handler(newVal) {
        if (newVal) {
          this.play()
          this.startPlay()
        } else {
          this.stop()
          this.player && this.player.stopAnimation(true)
          this.player && this.player.clear()
        }
      },
      deep: true
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
      const _rankingListPositions = {
        fillType: -1,
        name: '',
        id: '',
        data: []
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankingListPositions.fillType = _data.fillType
        _rankingListPositions.name = _data.name
        _rankingListPositions.id = _data.id
      }

      // fillType: 1:纯游戏 2：运营位
      if (_rankingListPositions.fillType === 2) {
        _rankingListPositions.data = _data.rankingListPositions.map((o, i) => {
          const _data = {
            fillDataType: '', // 1-游戏CDK、2-游戏下载、3-游戏中心榜单（跳转到其他榜单列表、4-社区
            description: '',
            title: '',
            sv: '',
            imgUrls: '',
            videoUrls: '',
            softInfo: null,
            communityInfo: {
              id: '',
              name: ''
            },
            relateRankingInfo: {
              id: '',
              name: ''
            },
            activityPageInfo: {
              id: '',
              name: ''
            }
          }
          _data.fillDataType = o.fillDataType
          _data.description = o.description
          _data.title = o.title
          if (o.imgUrls && o.imgUrls.length) {
            const match = o.imgUrls[0].match(/.*\.(.*)/)
            const extension = match ? match[1] : ''

            if (extension === 'svga') {
              _data.sv = o.imgUrls[0]
            } else {
              _data.imgUrls = o.imgUrls[0]
            }
          }

          if (o.videoUrls && o.videoUrls.length) {
            _data.videoUrls = o.videoUrls[0]
          }

          if ([1, 2, 6].includes(o.fillDataType) && o.softInfo) {
            const showInfo = o.softInfo.showInfo || {}
            const rankingLabelInfos = showInfo.rankingLabelInfos || []
            const softLabels = showInfo.softLabels || []
            const _softInfo = { ...o.softInfo }

            if (rankingLabelInfos.length) {
              const _rankingLabelInfos = rankingLabelInfos.map(item => `${item.labelName}TOP${item.num}`).splice(0, 2)

              _softInfo.showInfo = {
                ...showInfo,
                softLabels: [..._rankingLabelInfos, ...softLabels]
              }
            }

            _data.softInfo = _softInfo
          } else if (o.fillDataType === 3) {
            const relateRankingInfo = o.relateRankingInfo || {}
            _data.relateRankingInfo.id = relateRankingInfo.id || ''
            _data.relateRankingInfo.name = relateRankingInfo.name || ''
          } else if (o.fillDataType === 4) {
            const communityInfo = o.communityInfo || {}
            _data.communityInfo.id = communityInfo.id || ''
            _data.communityInfo.name = communityInfo.name || ''
          } else if (o.fillDataType === 8) {
            const activityPageInfo = o.activityPageInfo || {}
            _data.activityPageInfo.id = activityPageInfo.id || ''
            _data.activityPageInfo.name = activityPageInfo.name || ''
          }

          _data.id = `${i + 1}_${new Date().getTime()}_${Math.floor((Math.random() * 1000) + 1)}`

          return _data
        }).slice(0, 5)
      }

      return _rankingListPositions
    },
    currentBanner() {
      return this.rankSoftList.data[this.activeIndex] || null
    },
    drinfo() {
      return (item) => {
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.rankSoftList.name || '',
          skuName: item.softInfo.softName || '',
          softID: item.softInfo.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        }

        if (item.softInfo.softPurpose === 3) {
          params.gameClass = item.softInfo.softPurpose
        }

        return JSON.stringify(params)
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.scrollHandle()
      window.removeEventListener('scroll', this.scrollHandle, true)
      window.addEventListener('scroll', this.scrollHandle, true)
    })

    const isFirstIn = sessionStorage.getItem(`LEFT_BANNER_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`LEFT_BANNER_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      this.gameReport()
      this.magazineReport()
    }
  },
  activated() {
    this.$nextTick(() => {
      this.scrollHandle()
      window.removeEventListener('scroll', this.scrollHandle, true)
      window.addEventListener('scroll', this.scrollHandle, true)
    })

    const isFirstIn = sessionStorage.getItem(`LEFT_BANNER_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`LEFT_BANNER_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      this.gameReport()
      this.magazineReport()
    }
  },
  beforeUnmount() {
    this.stop()
    this.player && this.player.stopAnimation(true)
    this.player && this.player.clear()
    window.removeEventListener('scroll', this.scrollHandle, true)
  },
  deactivated() {
    this.stop()
    this.player && this.player.stopAnimation(true)
    this.player && this.player.clear()
    window.removeEventListener('scroll', this.scrollHandle, true)
    sessionStorage.removeItem(`LEFT_BANNER_IS_FIRST_IN_${this.rankSoftList.id}`)
  },
  methods: {
    scrollHandle() {
      if (!this.currentBanner?.id) return
      const el = document.getElementById(`leftBannerViewport${this.currentBanner.id}`)
      if (el) {
        this.inViewport = isElementInViewport(el) > 0
      }
    },
    play() {
      if (this.rankSoftList.data.length === 1) {
        return
      }

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.next()
        this.play()
        this.startPlay()
      }, this.currentBanner.sv ? 5000 : 3000)
    },
    next() {
      if (this.activeIndex >= this.rankSoftList.data.length - 1) {
        this.activeIndex = 0
        return
      }

      this.activeIndex = this.activeIndex + 1
    },
    startPlay() {
      if (this.currentBanner?.sv) {
        this.$nextTick(() => {
          this.player && this.player.stopAnimation(true)
          this.player && this.player.clear()
          const dom = `.movingFigure${this.currentBanner.id}`
          this.player = new SVGA.Player(dom)
          const parser = new SVGA.Parser(dom)
          parser.load(this.currentBanner.sv, videoItem => {
            this.player.setVideoItem(videoItem)
            this.player.startAnimation()
          })
        })
      } else {
        this.player && this.player.stopAnimation(true)
        this.player && this.player.clear()
      }
    },
    setActiveIndex(activeIndex) {
      this.stop()

      this.activeIndex = activeIndex
      if (this.currentBanner?.sv) {
        this.startPlay()
      }
    },
    stop() {
      clearTimeout(this.timer)
    },
    toDetail(item) {
      if (!item) return
      const softInfo = item.softInfo || {}
      const relateRankingInfo = item.relateRankingInfo || {}
      const communityInfo = item.communityInfo || {}
      const activityPageInfo = item.activityPageInfo || {}
      if ([1, 2, 6].includes(item.fillDataType)) {
        if (!softInfo.softId) return
        this.$router.push({
          name: 'GameCenterDetail',
          params: { id: softInfo.softId },
          query: {
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            reportPlateName: this.rankSoftList.name,
            plateName: this.rankSoftList.name
          }
        })
      } else if (item.fillDataType === 3) {
        const rankID = relateRankingInfo.id
        const rankName = relateRankingInfo.name
        if (!rankID) return

        this.$router.push({
          name: 'GameCenterList',
          query: {
            rankID,
            rankName
          }})
      } else if (item.fillDataType === 4) {
        const id = communityInfo.id
        if (!id) return
        const toLocation = {
          path: `/forum/micro/detail/${id}`,
          query: {
            isMessage: 0,
            faceName: '',
            circleName: '',
            plateName: '10',
            force: Date.now(),
            forumSource: 2
          }
        }
        this.$router.push(toLocation)
      } else if (item.fillDataType === 5) {
        this.$router.push({
          name: 'Magazine',
          query: {
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            plateNameReport: this.rankSoftList.name
          }
        })
      } else if (item.fillDataType === 8) {
        if (!activityPageInfo.id) return
        this.$router.push({
          path: `/gameCenter/online/index`,
          query: {
            id: activityPageInfo.id,
            source_pp: 'PAD2',
            source_p: 'PAD2',
            firstLocal: this.firstLocal,
            secondLocal: 11
            //, plateNameReport: this.rankSoftList.name
          }
        })
      } else if (item.fillDataType === 9) {
        this.$router.push({
          name: 'ActivityZone',
          query: {
            firstLocal: this.firstLocal,
            secondLocal: 11,
            plateNameReport: this.rankSoftList.name
          }
        })
      }
    },
    showPay(item) {
      if (!this.userInfo) {
        this.$login()
        return
      }

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.rankSoftList.name || '',
          skuName: item.softInfo.softName || '',
          softID: item.softInfo.softId || '',
          gameVersion: item.softInfo.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: item.softInfo.skuId,
        price: item.softInfo.productInfo.currentPrice,
        plateName: this.rankSoftList.name,
        gameVersion: item.softInfo.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: item.softInfo.softName || '',
        softID: item.softInfo.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
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
                    plateName: this.moduleData.rankingLists[0].name,
                    lenovoid: this.userInfo ? this.userInfo.UserID : ''
                  })
                }
              )
            })
          }
        }
      }
    }
  }
}

</script>
<style lang="scss" scoped>
div.LeftBanner {
  padding: 72px 38px 0 40px;
  box-sizing: content-box;
  max-width: 1760px;
  margin: 0 auto;
  position: relative;
  &::after {
    position: absolute;
    left: -74px;
    top: 50px;
    width: 206px;
    height: 540px;
    content: "";
    background: url('@/images/gamecenter/left-banner-logo.png') no-repeat;
    background-size: 100% 100%;
  }
  h3.title-wrap {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 17px 0;
    .title-bac {
      position: absolute;
      top: 0px;
      left: 0px;
    }
  }
  div.container {
    margin: 0 auto;
    display: flex;
    width: 100%;
    height: 45.29vw;
    max-width: 1350px;
    max-height: 720px;
    position: relative;
    cursor: pointer;
    > div.left {
      flex: 1;
      img.leftBannerImg {
        width: 50vw;
        height: 45.284vw;
        max-width: 870px;
        max-height: 720px;
        object-fit: cover;
      }
    }
    > div.center {
      width: 31.134vw;
      max-width: 495px;
      height: 100%;
      margin-right: 30px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-bottom: 12%;
      > section {
        > h2 {
          width: 100%;
          text-align: right;
          font-size: 36px;
          font-style: normal;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow-wrap: break-word;
          background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        > p.content {
          margin-top: 14px;
          color: #EAF7FF;
          text-align: right;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 22px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow-wrap: break-word;
          opacity: .6;
        }
        > ul {
          margin-top: 14px;
          text-align: right;
          line-height: 32px;
          > li {
            display: inline-block;
            vertical-align: top;
            box-sizing: border-box;
            padding: 5px 8px 6px 8px;
            margin-left: 8px;
            text-align: center;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            line-height: 1;
            text-transform: capitalize;
            -webkit-text-fill-color: transparent;
            background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
            background-clip: text;
            border: 1px solid rgba(234, 247, 255, 0.2);
            > i.iconfont {
              display: inline-block;
              margin-left: 4px;
              font-size: 12px;
              transform: scale(0.8);
              font-weight: 500;
              text-transform: capitalize;
              -webkit-text-fill-color: transparent;
              background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
              background-clip: text;
            }
          }
        }
        > p.cdk {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: right;
          > span.discount {
            background-color: #F24A44;
            font-size: 16px;
            color: #EAF7FF;
            font-weight: bold;
            line-height: 1;
            box-sizing: content-box;
            padding: 4px 9px 4px 6px;
            margin-right: 8px;
          }
          > span.currentPrice {
            font-size: 16px;
            color: #EAF7FF;
            font-weight: bold;
            margin-right: 10px;
            padding-bottom: 1px;
          }
          > span.originalPrice {
            font-size: 14px;
            color: rgba(234, 247, 255, 0.6);
            text-decoration: line-through;
            margin-right: 14px;
          }
          > span.platform {
            width: 16px;
            height: 16px;
            font-size: 16px;
            color: rgba(234, 247, 255, 0.4);
          }
        }
        > div.button {
          margin-top: 30px;
          position: absolute;
          right: 0;
          > div.buyButton, :deep(.buyButton) {
            width: 148px;
            height: 39px;
            line-height: 39px;
            font-size: 15px;
            }
        }
      }
    }
    > div.right {
      width: 1.61vw;
      max-width: 25.5px;
      height: 25.944vw;
      max-height: 412.5px;
      margin-top: 9.7%;
      background: url('@/images/gamecenter/right-banner-logo2.png') no-repeat;
      background-size: 100% 100%;
      > span.dotIndicator {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;
        i {
          width: 0.568vw;
          max-width: 90px;
          height: 1.788vw;
          margin-bottom: 5px;
          max-height: 285px;
          cursor: pointer;
          background: url('@/images/gamecenter/left-banner-button-normal.png') no-repeat;
          background-size: 100% 100%;
          margin-left: 0.6vw;
          &.active {
            width: 1.1vw;
            height: 2.634vw;
            max-width: 150px;
            max-height: 420px;
            background: url('@/images/gamecenter/left-banner-button-active.png') no-repeat;
            background-size: 100% 100%;
            margin-left: 0.9vw;
          }
        }
      }
    }
  }
}
.auth-wrap {
  margin-top: 16px;
  text-align: right;
  .auth-icon {
    height: 24px;
    margin-right: 6px;
    margin-bottom: 6px;
  }
}
.animated {
  -webkit-animation-duration: 1.2s;
  animation-duration: 1.2s;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
}
@keyframes leftBannerFadeInLeft {
  0% {
    transform: translateX(-20%);
    opacity: 0;
  }
  80% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.9;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.leftBannerFadeInLeft {
  -webkit-animation-name: leftBannerFadeInLeft;
  animation-name: leftBannerFadeInLeft;
}
@keyframes leftBannerFadeInRight {
  0% {
    opacity: 0;
    transform: translateX(20%);
  }
  80% {
    opacity: 0.7;
  }
  90% {
    opacity: 0.9;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.leftBannerFadeInRight {
  -webkit-animation-name: leftBannerFadeInRight;
  animation-name: leftBannerFadeInRight;
}

@media screen and (min-width: 1660px) {
  div.LeftBanner div.container > div.center > section > p.content {
    margin-top: 15px;
    font-size: 16px;
  }

  div.LeftBanner div.container > div.center > section > ul {
    margin-top: 15px;
  }

  div.LeftBanner div.container > div.center > section > div.button {
    margin-top: 31px;
  }
}
@media screen and (min-width: 1920px) {
  div.LeftBanner div.container > div.center > section > p.content {
    margin-top: 16px;
    font-size: 18px;
  }

  div.LeftBanner div.container > div.center > section > ul {
    margin-top: 16px;
  }

  div.LeftBanner div.container > div.center > section > div.button {
    margin-top: 32px;
  }
}

div.LeftBanner div.container:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

div.LeftBanner div.container > div.right > span.dotIndicator i:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

div.LeftBanner div.container > div.center > section > div.button > div.buyButton:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

@media (forced-colors: active) {
  div.LeftBanner div.container:focus-visible,
  div.LeftBanner div.container > div.right > span.dotIndicator i:focus-visible,
  div.LeftBanner div.container > div.center > section > div.button > div.buyButton:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
