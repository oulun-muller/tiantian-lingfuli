<template>
  <section :class="['RankList', 'tab'+(curTab)]">
    <div class="mesh-top"></div>
    <div class="mesh-bottom"></div>
    <div class="bac-blur">
    </div>
    <div class="content-wrap">
      <h3 class="title-wrap">
        <span class="title-bac gc-text-stroke-around">{{ moduleData.moduleEname }}</span>
        <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ moduleData.moduleName }}&nbsp;<i class="gc-title-quote-icon"></i></span>
        <span v-else class="gc-title-text">{{ moduleData.moduleName }}</span>
      </h3>
      <ul class="tab-wrap">
        <li
          v-for="(item, key) in rankingLists"
          :key="key"
          :class="[curTab===item.ruleCode?'selected':'']"
          @click="clickTab(item.ruleCode)"
        >
          {{ item.ruleName }}
        </li>
        <span class="more-btn" @click="clickToMore">更多</span>
      </ul>
      <!-- 图片区域 渲染之后 数据不变 动画改变位置 -->
      <section class="example-3d ">
        <swiper class="swiper" ref="swiper" :options="swiperOption" @slideChange="clickGame">
          <!-- <swiper-slide>Slide 1</swiper-slide>
          <swiper-slide>Slide 2</swiper-slide>
          <swiper-slide>Slide 3</swiper-slide>
          @mouseenter="isHoverCenterPic = curIndex===index && true"
          @mouseleave="isHoverCenterPic = curIndex===index && false"
          @click="clickGame(index)"
          -->
          <swiper-slide
            v-for="(item, index) in rankingCharts"
            :key="index"
            :ref="'pic'+index"
            :class="[getClassName(index, item), (isHoverCenterPic && curIndex===index) ? 'is-focus-center':'']"
          >
            <img class="image" :src="getImgUrl(item) || defaultImg"/>
            <img
              v-if="!getImgUrl(item) && item.softInfo && item.softInfo.showInfo && item.softInfo.showInfo.logoFile"
              :src="item.softInfo.showInfo.logoFile"
              class="logo-img"
              alt="">
            <!-- 中间卡片 -->
            <div v-if="curIndex===index && (isHoverCenterPic || item.softInfo)" class="detail-wrap">
              <!-- hover时 -->
              <template v-if="isHoverCenterPic">
                <h3 class="title">{{ getGameName(item) }}</h3>
                <template v-if="item.softInfo">
                  <p class="marks-wrap">
                    <template v-if="item.softInfo.downloadInfo && item.softInfo.downloadInfo.tagUrls.length">
                      <img
                        v-for="url in item.softInfo.downloadInfo.tagUrls.slice(0, 3)"
                        class="auth-icon"
                        :key="url"
                        :src="url" />
                    </template>
                    <template v-if="item.softInfo.showInfo.mediaScores.length">
                      <span v-for="(scoreItem, key) in item.softInfo.showInfo.mediaScores.slice(0,2)" :key="key">
                        <i class="num">
                          {{ scoreItem.score }}<template v-if="scoreItem.scoreType==='3'">%</template>
                        </i>
                        {{ scoreItem.mediaName }}
                      </span>
                    </template>
                  </p>
                  <p v-if="item.softInfo.showInfo.softLabels.length" class="tags-line">
                    <span v-for="(one, i) in item.softInfo.showInfo.softLabels.slice(0, 8)" :key="i" class="tag">{{ one }}</span>
                  </p>
                  <p class="info" v-if="item.softInfo.softDesc.introduction">{{ item.softInfo.softDesc.introduction }}</p>
                  <p class="btn-wrap" v-if="item.softInfo.softPurpose===1 || item.softInfo.softPurpose===2">
                    <GameDownloadButton
                      v-if="item.softInfo.softPurpose===2 || item.softInfo.softPurpose===3"
                      button-style="abnormal"
                      :download-info="item.softInfo.downloadInfo"
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
                    <button v-if="item.softInfo.softPurpose===1" class="common-abnomal-btn" @click.stop="showPay(item.softInfo)">
                      <i class="text">立即购买</i>
                    </button>
                  </p>
                </template>
              </template>
              <!-- 没有hover，但有softInfo时 -->
              <template v-else-if="item.softInfo">
                <p v-if="item.softInfo.showInfo.softLabels.length" class="tags-line">
                  <span v-for="(one, i) in item.softInfo.showInfo.softLabels.slice(0, 4)" :key="i" class="tag">{{ one }}</span>
                </p>
                <p v-if="item.softInfo.softDesc.introduction" class="info">{{ item.softInfo.softDesc.introduction }}</p>
              </template>
            </div>
            <div class="front-border"></div>
            <span v-if="item.playedBefore" class="label">{{ item.playedBefore }}</span>
          </swiper-slide>
          <!-- <div class="swiper-pagination" slot="pagination"></div> -->
        </swiper>
      </section>
      <p class="fenge-line">
        <span class="line"></span>
        <span class="text">{{ getFengeText() }}</span>
        <span class="line"></span>
      </p>
    </div>
    <svg width="0" height="0" viewBox="0 0 390 440" fill="none" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="clipRankImg">
        <path
          d="M390 21.479L368.476 0H244.5L227.5 12H165.238L146.5 0H0V426.515L14.018 440H375L390 426.5V21.479Z"
          fill="black"
        />
      </clipPath>
    </svg>
  </section>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import { swiper, swiperSlide } from '@/compat/swiper' // 注意小写
import 'swiper/swiper-bundle.css' // Swiper 4.x 样式路径

import { getCurrentBrandConfig } from '@/assets/text'
const defaultImg = resolveAsset('images/gamecenter/vdefault.png')
export default {
  name: 'RankList',
  data() {
    return {
      defaultImg,
      isHoverCenterPic: true,
      curTab: 0,
      curIndex: 0,
      leftIndex: 1,
      rightIndex: 2,
      rankingLists: [],
      thirdLocal: '',
      swiperOption: {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflowEffect: {
          rotate: 50,
          stretch: 50,
          depth: 260,
          modifier: 1,
          slideShadows: true
        },
        pagination: {
          el: '.swiper-pagination'
        }
      },
      BRAND_TEXT_CHINESE: getCurrentBrandConfig('BRAND_TEXT_CHINESE')
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
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
    drinfo() {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: `${this.moduleData.moduleName}_${this.rankingLists.find(item => item.ruleCode === this.curTab).ruleName}` || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''

        })
      }
    },
    curPic() {
      return this.rankingCharts[this.curIndex]
    },
    rankingCharts() {
      if (!this.curTab) return []
      return this.rankingLists.find(item => item.ruleCode === this.curTab).rankingCharts.slice(0, 3)
    }
  },
  components: {
    swiper,
    swiperSlide,
    GameDownloadButton
  },
  methods: {
    getImgUrl(item) {
      return item?.softInfo?.showInfo?.vimg || item.vimg
    },
    getGameName(item) {
      return item?.softInfo?.softName || item.gameName || ''
    },
    getFengeText() {
      switch (this.curTab) {
        case 5:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}数量生成`
        case 6:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}玩家游戏时长生成`
        case 7:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}玩家数量增长率生成`
        case 8:
          return `榜单基于最近一小时内${this.BRAND_TEXT_CHINESE}玩家数量生成`
        case 19:
          return `榜单基于昨日${this.BRAND_TEXT_CHINESE}玩家预约人数生成`
        default: ''
      }
    },
    getPlayNumHtml(index) {
      switch (this.curTab) {
        case 5:
        case 8:
          return `<i>${this.rankingCharts[index].datas}</i>人在玩`
        case 6:
          return `总计<i>${this.rankingCharts[index].datas}</i>小时`
        case 7:
          return `涨幅<i>${this.rankingCharts[index].datas}</i>%`
        case 19:
          return `<i>${this.rankingCharts[index].datas}</i>人预约`
        default: ''
      }
    },
    clickToMore() {
      const _plateName = `${this.moduleData.moduleName}_${this.rankingLists.find(item => item.ruleCode === this.curTab).ruleName}` || ''
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 1,
          plateName: _plateName,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$router.push({
        name: 'RankList',
        query: {
          source_p: 'PAD2',
          tab: this.curTab
        }
      })
    },
    showPay(item) {
      if (!item) return
      if (!this.userInfo) {
        this.$login()
        return
      }

      const _plateName = `${this.moduleData.moduleName}_${this.rankingLists.find(item => item.ruleCode === this.curTab).ruleName}` || ''

      this.$dataReport('LZ_gamingCenter', 'LZ_storeCdkDetailBuyClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: _plateName,
          skuName: item.softName || '',
          softID: item.softId || '',
          gameVersion: item.productInfo?.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: item.skuId,
        price: item.productInfo?.currentPrice,
        plateName: _plateName,
        gameVersion: item.productInfo?.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    clickTab(index) {
      this.curTab = index
      this.$nextTick(() => {
        this.curIndex = 0
        this.setUpView(0)
      })

      this.gameReport()
    },
    getClassName(index, item) {
      const pointerClass = item.softInfo ? 'pointer' : ''
      const locaClass = this.curIndex === index ? 'center' : this.leftIndex === index ? 'left' : 'right'
      return pointerClass + ' ' + locaClass
    },
    clickGame() {
      const instance = this.$refs.swiper?.swiper
      if (!instance) return
      const index = instance.realIndex
      if (this.curIndex === index) {
        if (this.curPic.softInfo) {
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: this.curPic.softInfo.softId },
            query: {
              source_p: 'PAD2',
              firstLocal: this.firstLocal,
              secondLocal: this.secondLocal,
              thirdLocal: this.thirdLocal,
              reportPlateName: `${this.moduleData.moduleName}_${this.rankingLists.find(item => item.ruleCode === this.curTab).ruleName}`,
              plateName: this.rankingLists.find(item => item.ruleCode === this.curTab).name
            }
          })
        } else {
          return
        }
      } else {
        this.curIndex = index
        this.setUpView(index)
      }
    },
    setUpView(index) {
      const len = this.rankingCharts.length
      if (!len || index < 0 || index >= len) {
        return
      }
      this.leftIndex = index + 1 >= len ? 0 : index + 1
      this.rightIndex = index - 1 < 0 ? len - 1 : index - 1
      const leftEl = this.getPicRefEl(this.leftIndex)
      const rightEl = this.getPicRefEl(this.rightIndex)
      const centerEl = this.getPicRefEl(index)

      if (leftEl && leftEl.style) {
        leftEl.style.transform = `translateX(-282px) translateY(-7px) translateZ(-70px) rotateY(60deg) scale(0.8)`
      }
      if (rightEl && rightEl.style) {
        rightEl.style.transform = `translateX(282px) translateY(-7px) translateZ(-71px) rotateY(-60deg) scale(0.8)`
      }
      if (centerEl && centerEl.style) {
        centerEl.style.transform = `translateZ(0)`
      }
    },
    getPicRefEl(index) {
      const refNode = this.$refs['pic' + index]
      if (!refNode) {
        return null
      }

      const el = Array.isArray(refNode) ? refNode[0] : refNode
      if (!el) {
        return null
      }

      return el.$el || el
    },
    init() {
      this.rankingLists = this.moduleData.rankingLists
      this.curTab = this.moduleData.rankingLists[0].ruleCode
    },
    gameReport() {
      if (this.moduleData.rankingLists && this.moduleData.rankingLists.length) {
        let _plateName = ''
        let _rankingCharts = []
        this.moduleData.rankingLists.forEach(item => {
          if (item.fillType === 3) {
            if (this.curTab === item.ruleCode) {
              _plateName = `${this.moduleData.moduleName}_${item.ruleName}`
              if (item.rankingCharts && item.rankingCharts.length) {
                _rankingCharts = item.rankingCharts.filter(o => o.softInfo).map(o => {
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
          }
        })

        if (_rankingCharts.length) {
          _rankingCharts = [..._rankingCharts.filter(o => o.softPurpose === 2), ..._rankingCharts.filter(o => o.softPurpose === 1)].slice(0, 3)
          const _cdk = _rankingCharts.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
          const _download = _rankingCharts.filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

          if (_cdk) {
            this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkTabPageShow', 'pv', {
              details: JSON.stringify({
                firstLocal: this.firstLocal,
                secondLocal: this.secondLocal,
                thirdLocal: this.thirdLocal,
                plateName: _plateName,
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
                plateName: _plateName,
                nameAndIDVersion: _download,
                lenovoid: this.userInfo ? this.userInfo.UserID : ''
              })
            })
          }
        }
      }
    }
  },
  created() {
    this.$emit('headerStatus', false)
    this.init()
  },
  mounted() {
    this.$nextTick(() => {
      this.setUpView(this.curIndex)
    })

    const isFirstIn = sessionStorage.getItem('RANK_LIST_IS_FIRST_IN')
    if (!isFirstIn) {
      sessionStorage.setItem('RANK_LIST_IS_FIRST_IN', 1)

      this.gameReport()
    }
  },
  activated() {
    const isFirstIn = sessionStorage.getItem('RANK_LIST_IS_FIRST_IN')
    if (!isFirstIn) {
      sessionStorage.setItem('RANK_LIST_IS_FIRST_IN', 1)

      this.gameReport()
    }
  },
  deactivated() {
    sessionStorage.removeItem('RANK_LIST_IS_FIRST_IN')
  }
}
</script>
<style lang="scss" src="./index.scss" scoped></style>
