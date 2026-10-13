<template>
  <section :class="['RankList', 'tab'+(curTab)]">
    <div class="mesh-top"></div>
    <div class="mesh-bottom"></div>
    <div class="bac-blur">
    </div>
    <div class="content-wrap">
      <h3 class="title-wrap">
        <span class="title-bac gc-text-stroke-around">{{ moduleData.moduleEname }}</span>
        <span class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ moduleData.moduleName }}&nbsp;<i class="gc-title-quote-icon"></i></span>
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
      <ul class="pic-wrap" v-if="rankingCharts.length">
        <li
          v-for="(item, index) in rankingCharts"
          :key="index"
          :ref="'pic'+index"
          :class="[getClassName(index, item), (isHoverCenterPic && curIndex===index) ? 'is-focus-center':'']"
          @mouseenter="isHoverCenterPic = curIndex===index && true"
          @mouseleave="isHoverCenterPic = curIndex===index && false"
          @click="clickGame(index)"
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
              <div class="marks-wrap">
                <h3 class="title">{{ getGameName(item) }}</h3>
                <div v-if="item.softInfo">
                  <template v-if="item.softInfo.downloadInfo && item.softInfo.downloadInfo.tagUrls.length">
                    <img
                      v-for="url in item.softInfo.downloadInfo.tagUrls.slice(0, 3)"
                      class="auth-icon"
                      :key="url"
                      :src="url"
                      aria-hidden="true" />
                  </template>
                </div>
              </div>
              <template v-if="item.softInfo">
                <div>
                  <!-- <template v-if="item.softInfo.downloadInfo && item.softInfo.downloadInfo.tagUrls.length">
                    <img
                      v-for="url in item.softInfo.downloadInfo.tagUrls.slice(0, 3)"
                      class="auth-icon"
                      :key="url"
                      :src="url" />
                  </template> -->
                  <!-- <template v-if="item.softInfo.showInfo.mediaScores.length">
                    <span v-for="(scoreItem, key) in item.softInfo.showInfo.mediaScores.slice(0,2)" :key="key">
                      <i class="num">
                        {{ scoreItem.score }}<template v-if="scoreItem.scoreType==='3'">%</template>
                      </i>
                      {{ scoreItem.mediaName }}
                    </span>
                  </template> -->
                </div>
                <template v-if="item.softInfo.softDesc.introduction">
                  <p class="info" v-if="item.softInfo.softDesc.introduction">{{ item.softInfo.softDesc.introduction }}</p>
                </template>
                <template v-else-if="item.softInfo.showInfo.softLabels.length">
                  <p class="tags-line">
                    <!-- <span v-for="(one, i) in item.softInfo.showInfo.softLabels.slice(0, 8)" :key="i" class="tag">{{ one }}</span> -->
                    <TagNormal v-for="(one, i) in item.softInfo.showInfo.softLabels.slice(0, 8)" :key="i" :title="one" />
                  </p>
                </template>
                <div style="width: 100%;">
                  <template v-if="item.softInfo.relateActivitys.length" >
                    <TagActivity
                      :plate-name="moduleData.moduleName"
                      :title="item.softInfo.relateActivitys[0].title"
                      :game-item="item.softInfo"/>
                  </template>
                  <template v-else-if="item.softInfo.softDesc.recommendIntroduction">
                    <TagActivity
                      :title="item.softInfo.softDesc.recommendIntroduction"
                      :plate-name="moduleData.moduleName"
                      :type="2"
                      :game-item="item.softInfo"/>
                  </template>
                </div>
                <!-- <p class="info" v-if="item.softInfo.softDesc.introduction">{{ item.softInfo.softDesc.introduction }}</p> -->
                <div class="button-area">
                  <p class="btn-wrap" v-if="item.softInfo.softPurpose===1 || item.softInfo.softPurpose===2">
                    <GameDownloadButton
                      v-if="item.softInfo.softPurpose===2 || item.softInfo.softPurpose===3"
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
                      :drinfo="drinfo(item.softInfo)" />
                    <button v-if="item.softInfo.softPurpose===1" class="common-abnomal-btn" aria-label="立即购买" @click.stop="showPay(item.softInfo)">
                      <i class="text">立即购买</i>
                    </button>
                  </p>
                  <div class="game-rating">
                    <template v-if="item.softInfo.downloadInfo.bizType === 0 && item.softInfo.softDesc.positiveReviewRate">
                      <p class="text">推荐率</p>
                      <div class="rating-num">{{ item.softInfo.softDesc.positiveReviewRate }} <span class="symble-100">%</span></div>
                    </template>
                    <template v-else-if="[1, 2].includes(item.softInfo.downloadInfo.bizType) && item.softInfo.expectations">
                      <p class="text">期待值</p>
                      <div class="rating-num">{{ item.softInfo.expectations }}</div>
                    </template>
                  </div>
                </div>
              </template>
            </template>
            <!-- 没有hover，但有softInfo时 -->
            <template v-else-if="item.softInfo">
              <template v-if="item.softInfo.softDesc.introduction">
                <p class="info" v-if="item.softInfo.softDesc.introduction">{{ item.softInfo.softDesc.introduction }}</p>
              </template>
              <template v-else-if="item.softInfo.showInfo.softLabels.length">
                <p class="tags-line">
                  <!-- <span v-for="(one, i) in item.softInfo.showInfo.softLabels.slice(0, 8)" :key="i" class="tag">{{ one }}</span> -->
                  <TagNormal v-for="(one, i) in item.softInfo.showInfo.softLabels.slice(0, 4)" :key="i" :title="one" />
                </p>
              </template>
              <template v-if="item.softInfo.relateActivitys.length" >
                <TagActivity :title="item.softInfo.relateActivitys[0].title"/>
              </template>
              <template v-else-if="item.softInfo.softDesc.recommendIntroduction">
                <TagActivity
                  :title="item.softInfo.softDesc.recommendIntroduction"
                  :plate-name="moduleData.moduleName"
                  :type="2"
                  :game-item="item.softInfo"/>
              </template>
            </template>
          </div>
          <div class="front-border"></div>
          <span v-if="item.playedBefore" class="label">{{ item.playedBefore }}</span>
        </li>
      </ul>
      <!-- info 信息区域 图片变的时候 重新渲染内容 无动画 -->
      <ul class="pic-info-wrap" v-if="rankingCharts.length">
        <li
          class="info-wrap left"
          @click="clickGame(leftIndex)"
        >
          <p class="rank-title-line">
            <i v-if="rankingCharts[leftIndex].changeNum > 0" class="arrow-up"></i>
            <i v-else-if="rankingCharts[leftIndex].changeNum < 0" class="arrow-down"></i>
            <span :class="['rank', 'rank'+leftIndex]"></span>
          </p><span class="name">
            <i :class="['content', getGameName(rankingCharts[leftIndex]).length > 4 ? 'animation':'']">
              {{ getGameName(rankingCharts[leftIndex]) }}
            </i><i :class="['content', getGameName(rankingCharts[leftIndex]).length > 4 ? 'show animation':'no-show']">
              {{ getGameName(rankingCharts[leftIndex]) }}
            </i>
          </span>
          <span class="play-num" v-html="getPlayNumHtml(leftIndex)"> </span>
        </li>
        <li
          class="info-wrap center"
          @click="clickGame(curIndex)"
        >
          <p class="rank-line rank-title-line">
            <i v-if="rankingCharts[curIndex].changeNum > 0" class="arrow-up"></i>
            <i v-else-if="rankingCharts[curIndex].changeNum < 0" class="arrow-down"></i>
            <span :class="['rank', 'rank'+curIndex]"></span>
            <span class="name">
              <i :class="['content', getGameName(rankingCharts[curIndex]).length > 4 ? 'animation':'']">
                {{ getGameName(rankingCharts[curIndex]) }}
              </i><i :class="['content', getGameName(rankingCharts[curIndex]).length > 4 ? 'show animation':'no-show']">
                {{ getGameName(rankingCharts[curIndex]) }}
              </i>
            </span>
          </p>
          <span class="play-num" v-html="getPlayNumHtml(curIndex)"></span>
          <div class="left-line"></div>
          <div class="right-line"></div>
        </li>
        <li
          class="info-wrap right"
          @click="clickGame(rightIndex)"
        >
          <p class="rank-title-line">
            <i v-if="rankingCharts[rightIndex].changeNum > 0" class="arrow-up"></i>
            <i v-else-if="rankingCharts[rightIndex].changeNum < 0" class="arrow-down"></i>
            <span :class="['rank', 'rank'+rightIndex]"></span>
          </p><span class="name">
            <i :class="['content', getGameName(rankingCharts[rightIndex]).length > 4 ? 'animation':'']">
              {{ getGameName(rankingCharts[rightIndex]) }}
            </i><i :class="['content', getGameName(rankingCharts[rightIndex]).length > 4 ? 'show animation':'no-show']">
              {{ getGameName(rankingCharts[rightIndex]) }}
            </i>
          </span>
          <span class="play-num" v-html="getPlayNumHtml(rightIndex)"></span>
        </li>
      </ul>
      <p class="fenge-line">
        <span class="line"></span>
        <span class="text">{{ getFengeText() }}</span>
        <span class="line"></span>
      </p>
    </div>
    <svg width="0" height="0" viewBox="0 0 390 440" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
import GameDownloadButton from '@/components/GameDownloadButton'

import TagNormal from '@/components/TagNormal'
import TagActivity from '@/components/TagNormal/TagActivity'
import { getGameMsgDataReport } from '@/utils/dataReport'

import { getCurrentBrandConfig } from '@/assets/text'

import defaultImg from '@/images/gamecenter/searchDefault.png'
export default {
  name: 'RankList',
  data() {
    return {
      defaultImg,
      isHoverCenterPic: false,
      curTab: 0,
      curIndex: 0,
      leftIndex: 1,
      rightIndex: 2,
      rankingLists: [],
      thirdLocal: '',
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
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
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
    GameDownloadButton,
    TagNormal,
    TagActivity
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
    clickGame(index) {
      if (this.curIndex === index) {
        if (this.curPic.softInfo) {
          this.$router.push({
            name: 'GameCenterDetail',
            params: { id: this.curPic.softInfo.softId },
            query: {
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
                  const report = getGameMsgDataReport(o)
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
          }
        })

        if (_rankingCharts.length) {
          _rankingCharts = [..._rankingCharts.filter(o => o.softPurpose === 2), ..._rankingCharts.filter(o => o.softPurpose === 1)].slice(0, 3)
          const _cdk = _rankingCharts.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
          const _download = _rankingCharts.map(o => o.name_download).join(',')

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
<style lang="scss" src="./index.scss" scoped>

</style>
