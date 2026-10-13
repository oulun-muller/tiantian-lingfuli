<template>
  <div :class="['magazine', needSmooth?'scroll-smooth':'']" ref="magazinePage" @scroll="scrollHandler">
    <div :class="['top-bac', gaScrollTop > 180 ? 'invisible':'']">
      <span class="games-icon"></span>
    </div>
    <template v-if="!pageLoading && !magazineData">
      <div class="empty-game">
        <img class="img" src="@/images/gamecenter/nothing.png" alt="">
        <p class="text">暂无游戏哦 ！</p>
      </div>
    </template>
    <template v-else>
      <section class="mag-banner" v-if="magazineData">
        <div class="img" :style="{ backgroundImage: `url(${magazineData.gameMagazine.imgUrl})` }"></div>
        <div :class="['info-content', 'ab-red-button', buyStatus ? 'disable' : '']" tabindex="0" role="button" :aria-label="buyStatus ? '已拥有' : '立即购买'" @click="clickBuyMagazine(4)" @keydown.enter.prevent.stop="clickBuyMagazine(4)" @keydown.space.prevent.stop="clickBuyMagazine(4)">
          <i class="text" aria-hidden="true">{{ buyStatus ? '已拥有' : '立即购买' }}</i>
        </div>
      </section>
      <section class="mag-catalog" v-if="gameList.length">
        <h3 class="catalog-title">
          <span class="title">游戏目录</span>
          <div v-if="!buyStatus" class="exchange-code" tabindex="0" role="button" aria-label="使用兑换码" @click="upRedemptionCode" @keydown.enter.prevent.stop="upRedemptionCode" @keydown.space.prevent.stop="upRedemptionCode">使用兑换码</div>
        </h3>
        <ul class="game-list">
          <li v-for="(item, index) in gameList" :key="index" class="game-item" tabindex="0" role="button" :aria-label="item.softName + '，点击跳转'" @click="scrollToGame(index)" @keydown.enter.prevent.stop="scrollToGame(index)" @keydown.space.prevent.stop="scrollToGame(index)">
            <img class="img" :src="item.showInfo.logoFile" :alt="item.softName"/>
            <p class="name">{{ item.softName }}</p>
          </li>
        </ul>
      </section>
      <section class="mag-list" v-if="gameList.length">
        <!-- sgame -->
        <div class="s-game" ref="sGame">
          <div class="bac-img">
            <img
              v-if="sGame.softDesc.mediaList[0].type === 'image'"
              class="content-area"
              :src="sGame.softDesc.mediaList[0].url"
              aria-hidden="true"
              @click="toDetail(sGame)"/>
            <template v-else>
              <video
                class="content-area"
                ref="sGameVideo"
                :src="sGame.softDesc.mediaList[0].url"
                :poster="sGame.softDesc.mediaList[0].poster || defaultImg"
                muted
                loop
                preload
                @mouseenter="mouseEnterVideo('sGameVideo')"
                @mouseleave="mouseLeaveVideo('sGameVideo')"
                @click="toDetail(sGame)"
              >
              </video>
              <i v-show="playingName!=='sGameVideo'" class="play-icon"></i>
            </template>
            <div class="detail-info" tabindex="0" role="button" :aria-label="sGame.softName + '，点击查看详情'" @click.prevent.stop="toDetail(sGame)" @keydown.enter.prevent.stop="toDetail(sGame)" @keydown.space.prevent.stop="toDetail(sGame)">
              <h3 class="sgame-title">
                <span class="title">《{{ sGame.softName }}》</span>
                <template v-if="sGame.showInfo.softLabels.length">
                  <span class="tag" v-for="(one, i) in sGame.showInfo.softLabels.slice(0, 4)" :key="i">{{ one }}</span>
                </template>
              </h3>
              <div class="desc-info">
                <p class="desc">{{ sGame.softDesc.introduction }}</p>
                <template v-if="sGame.productInfo.userPurchasedStatus">
                  <GameDownloadButton
                    class="downloadButton"
                    button-style="abnormal"
                    :download-info="sGame.downloadInfo"
                    :soft-desc="sGame.softDesc"
                    :soft-id="sGame.softId"
                    :soft-purpose="3 || sGame.softPurpose"
                    :product-info="sGame.productInfo"
                    :user-purchased-status="sGame.productInfo.userPurchasedStatus"
                    :version="sGame.softDesc.version"
                    :soft-name="sGame.softName"
                    :logo-file="sGame.showInfo.logoFile"
                    :fast-install="sGame.showInfo.isFastInstall"
                    :drinfo="drinfo(sGame)"
                    :sku-id="sGame.skuId" />
                </template>
                <template v-else>
                  <span v-if="sGame.productInfo" class="price">Steam原价 ￥{{ sGame.productInfo.originalPrice }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>
        <!-- gamelist -->
        <div v-for="(item, index) in gameList.slice(1)" :key="index" class="game-wrapper" :ref="'gameItem'+index">
          <div v-if="index % 2 === 0" class="game-right">
            <div class="content-wrap" tabindex="0" role="button" :aria-label="item.softName + '，点击查看详情'" @click="toDetail(item)" @keydown.enter.prevent.stop="toDetail(item)" @keydown.space.prevent.stop="toDetail(item)">
              <div class="info">
                <h3 class="title">《{{ item.softName }}》</h3>
                <template v-if="item.productInfo.userPurchasedStatus">
                  <GameDownloadButton
                    class="downloadButton"
                    button-style="abnormal"
                    :download-info="item.downloadInfo"
                    :soft-desc="item.softDesc"
                    :soft-id="item.softId"
                    :soft-purpose="3 || item.softPurpose"
                    :product-info="item.productInfo"
                    :user-purchased-status="item.productInfo.userPurchasedStatus"
                    :version="item.softDesc.version"
                    :soft-name="item.softName"
                    :logo-file="item.showInfo.logoFile"
                    :fast-install="item.showInfo.isFastInstall"
                    :drinfo="drinfo(item)"
                    :sku-id="item.skuId" />
                </template>
                <template v-else>
                  <p class="price">Steam原价 ￥{{ item.productInfo.originalPrice }}</p>
                </template>
              </div>
              <div class="img-wrap">
                <div class="img-bac" :style="{ backgroundImage: `url(${item.softDesc.mediaList[0].poster || defaultImg})` }"></div>
                <img
                  v-if="item.softDesc.mediaList[0].type === 'image'"
                  class="content-area"
                  :src="item.softDesc.mediaList[0].url"
                />
                <template v-else>
                  <video
                    class="content-area"
                    :ref="'gameVideo'+ index"
                    :src="item.softDesc.mediaList[0].url"
                    :poster="item.softDesc.mediaList[0].poster || defaultImg"
                    muted
                    loop
                    preload
                    @mouseenter="mouseEnterVideo('gameVideo'+ index)"
                    @mouseleave="mouseLeaveVideo('gameVideo'+ index)"
                  >
                  </video>
                  <i v-show="playingName!=='gameVideo'+ index" class="play-icon"></i>
                </template>
              </div>
            </div>
            <div class="desc-wrap" aria-hidden="true" @click="toDetail(item)">
              <p class="tags" v-if="item.showInfo.softLabels.length">
                <span class="tag" v-for="(one, i) in item.showInfo.softLabels.slice(0, 4)" :key="i">{{ one }}</span>
              </p>
              <p class="desc">{{ item.softDesc.introduction }}</p>
            </div>
          </div>
          <div v-else class="game-left">
            <div class="content-wrap" tabindex="0" role="button" :aria-label="item.softName + '，点击查看详情'" @click="toDetail(item)" @keydown.enter.prevent.stop="toDetail(item)" @keydown.space.prevent.stop="toDetail(item)">
              <div class="img-wrap" >
                <div class="img-bac" :style="{ backgroundImage: `url(${item.softDesc.mediaList[0].poster || defaultImg})` }"></div>
                <img
                  v-if="item.softDesc.mediaList[0].type === 'image'"
                  class="content-area"
                  :src="item.softDesc.mediaList[0].url"
                />
                <template v-else>
                  <video
                    class="content-area"
                    :ref="'gameVideo'+ index"
                    :src="item.softDesc.mediaList[0].url"
                    :poster="item.softDesc.mediaList[0].poster || defaultImg"
                    muted
                    loop
                    preload
                    @mouseenter="mouseEnterVideo('gameVideo'+ index)"
                    @mouseleave="mouseLeaveVideo('gameVideo'+ index)"
                  >
                  </video>
                  <i v-show="playingName!=='gameVideo'+ index" class="play-icon"></i>
                </template>
              </div>
              <div class="info">
                <h3 class="title">《{{ item.softName }}》</h3>
                <template v-if="item.productInfo.userPurchasedStatus">
                  <GameDownloadButton
                    class="downloadButton"
                    button-style="abnormal"
                    :download-info="item.downloadInfo"
                    :soft-desc="item.softDesc"
                    :soft-id="item.softId"
                    :soft-purpose="3 || item.softPurpose"
                    :product-info="item.productInfo"
                    :user-purchased-status="item.productInfo.userPurchasedStatus"
                    :version="item.softDesc.version"
                    :soft-name="item.softName"
                    :logo-file="item.showInfo.logoFile"
                    :fast-install="item.showInfo.isFastInstall"
                    :drinfo="drinfo(item)"
                    :sku-id="item.skuId" />
                </template>
                <template v-else>
                  <p class="price">Steam原价 ￥{{ item.productInfo.originalPrice }}</p>
                </template>
              </div>
            </div>
            <div class="desc-wrap" aria-hidden="true" @click="toDetail(item)">
              <p class="tags" v-if="item.showInfo.softLabels.length">
                <span class="tag" v-for="(one, i) in item.showInfo.softLabels.slice(0, 4)" :key="i">{{ one }}</span>
              </p>
              <p class="desc">{{ item.softDesc.introduction }}</p>
            </div>
          </div>
        </div>
      </section>
      <section class="product-wrap">
        <h3 class="product-title"><span class="title">产品介绍</span></h3>
        <ul class="product-info">
          <li class="product-info-item">
            <span class="icon fire"></span>
            <h4>口碑爆款集结</h4>
            <p>百万级畅销作品，高口碑好评如潮!精品游戏即刻开启，超多玩法一网打尽!</p>
          </li>
          <li class="product-info-item">
            <span class="icon pocket"></span>
            <h4>性价比巅峰</h4>
            <p>疯狂骨折价，畅享超值体验。10 合 1 国产精品，一份价格，十倍欢乐！</p>
          </li>
          <li class="product-info-item">
            <span class="icon lz"></span>
            <h4>专属游戏平台</h4>
            <p>{{ BRAND_TEXT }} 平台为您的游戏提供专属适配和库管理，保证安全稳定，高速流畅的体验。</p>
          </li>
          <li class="product-info-item">
            <span class="icon pc"></span>
            <h4>联想电脑专享</h4>
            <p>联想电脑用户独享福利!一经激活，永久入库，随时畅玩。(*本产品仅支持联想电脑使用)</p>
          </li>
        </ul>
      </section>

      <section class="faq-wrap">
        <h3 class="faq-title"><span class="title">常见问题解答</span></h3>
        <ul class="faq-list">
          <li>
            <h4 class="question">1. 什么是Legionplay臻享玩？</h4>
            <div class="answer">Legionplay臻享玩是联想推出的一款游戏合集包产品，基础版包含10款国产精选单机游戏。</div>
          </li>
          <li>
            <h4 class="question">2. 如何购买Legionplay臻享玩？</h4>
            <div class="answer">
              <p>您可以通过以下三种方式购买：</p>
              <p>· 在{{ BRAND_TEXT }}平台直接购买；</p>
              <p>· 联想官方渠道购买产品序列号兑换码，并在{{ BRAND_TEXT }}（或Lite版）激活。</p>
              <p>· 在其他联想授权渠道购买产品序列号兑换码，并在{{ BRAND_TEXT }}（或Lite版）激活。</p>
            </div>
          </li>
          <li>
            <h4 class="question">3. 购买后如何获取游戏？</h4>
            <div class="answer">您在{{ BRAND_TEXT }}购买后，所有游戏将自动与您登录的联想账户绑定。若您是在其他联想官方或授权渠道购买的产品序列号兑换码，需要您先在{{ BRAND_TEXT }}（或Lite版）激活并与您的联想账户绑定。因此，请保管好您的联想账户及密码。 绑定成功后游戏会自动入库，永久保留。</div>
          </li>
          <li>
            <h4 class="question">4. 激活兑换码时有什么限制吗？</h4>
            <div class="answer">产品序列号兑换码一旦在{{ BRAND_TEXT }}（或Lite版）激活成功，游戏将永久绑定到您的联想账户且不予退款，因此请确保兑换时所使用的联想账户是您希望绑定的账户。</div>
          </li>
          <li>
            <h4 class="question">5. 如何查看我已购买的游戏？</h4>
            <div class="answer">您可以在{{ BRAND_TEXT }}（或Lite版）中登录您的联想账户，通过访问“我的游戏”页面，查看您的游戏库，所有已购买的游戏都会列出在其中。</div>
          </li>
          <li>
            <h4 class="question">6. 如果我遇到问题，如何联系支持？</h4>
            <div class="answer">如果您遇到任何问题，请<a target="_blank" class="link" href="https://wpa1.qq.com/EbFal53H?_type=wpa&qidian=true" >联系客服</a>告知我们，我们将尽快为您解决。</div>
          </li>
        </ul>
      </section>
      <section v-if="showFixBottom && magazineData" class="bottom-price">
        <span class="to-top" tabindex="0" role="button" aria-label="返回顶部" @click.prevent.stop="toTop" @keydown.enter.prevent.stop="toTop" @keydown.space.prevent.stop="toTop"></span>
        <span class="price-text">Steam原价 <i class="delete-price">￥{{ magazineData.productOriginalPriceYuan }}</i> ，现仅需</span> <span class="cur-price"><i class="signal">￥</i>{{ magazineData.productCurrentPriceYuan }}</span>
        <div :class="['ab-red-button', buyStatus ? 'disable' : '']" tabindex="0" role="button" :aria-label="buyStatus ? '已拥有' : '立即购买'" @click="clickBuyMagazine(5)" @keydown.enter.prevent.stop="clickBuyMagazine(5)" @keydown.space.prevent.stop="clickBuyMagazine(5)">
          <i class="text" aria-hidden="true">{{ buyStatus ? '已拥有' : '立即购买' }}</i>
        </div>
      </section>
      <RedemptionCode
        v-if="showRedemptionCode"
        :show-redemption-code="showRedemptionCode"
        :product-name="magazineData.productName || ''"
        @hideRedemptionCode="hideRedemptionCode" />
    </template>
  </div>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import { getGCMagazineData, getGCMagazineGameList } from '@/api/gameCenter'
import RedemptionCode from './RedemptionCode'
import { getCurrentBrandConfig } from '@/assets/text'
export default {
  data() {
    return {
      gaScrollTop: 0,
      needSmooth: false,
      defaultImg: new URL('../../../images/gamecenter/hdefault.png', import.meta.url).href,
      playingName: '',
      magazineData: null,
      gameList: [],
      showFixBottom: false,
      showRedemptionCode: false,
      plateNameReport: this.$route.query.plateNameReport || '',
      BRAND_TEXT: getCurrentBrandConfig('BRAND_TEXT')
    }
  },
  computed: {
    pageLoading() {
      return this.$store.state.pageLoading.status
    },
    sGame() {
      return this.gameList[0]
    },
    buyStatus() {
      // true 表示已拥有；false 表示未购买
      return !!this.magazineData?.gameMagazine?.userPurchasedStatus
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
      return this.$route.query.secondLocal || 9
    },
    thirdLocal() {
      return ''
    },
    drinfo() {
      return (item) => {
        return JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.magazineData.productName || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo?.UserID || '',
          gameClass: 3
        })
      }
    }
  },
  watch: {
    userInfo: {
      handler() {
        this.init()
      }
    }
  },
  components: {
    GameDownloadButton,
    RedemptionCode
  },
  beforeRouteEnter(to, from, next) {
    if (!['GameCenterDetail'].includes(from.name)) {
      if (window._GAMECENTER_RESTORE) {
        delete window._GAMECENTER_RESTORE['Magazine']
      }
    }
    next(vm => {
      vm.fromRouterName = from.name
    })
  },
  beforeRouteLeave(to, from, next) {
    if (['GameCenterDetail'].includes(to.name)) {
      window._GAMECENTER_RESTORE['Magazine'] = JSON.stringify({
        ...this.$data,
        magazinePage: Math.round(this.$refs.magazinePage.scrollTop)
      })
    }
    next()
  },
  created() {
    if (window._GAMECENTER_RESTORE && window._GAMECENTER_RESTORE['Magazine']) {
      const {
        magazineData,
        gameList,
        magazinePage
      } = JSON.parse(window._GAMECENTER_RESTORE['Magazine'])
      delete window._GAMECENTER_RESTORE['Magazine']

      this.magazineData = magazineData
      this.gameList = gameList
      this.magazinePage = magazinePage
      this.$nextTick(() => {
        this.$refs.magazinePage.scrollTop = this.magazinePage
      })
    } else {
      this.init()
    }
  },
  mounted() {
    this.$emit('headerStatus', true)
    this.$emit('scrollTop', 0)
  },
  methods: {
    toTop() {
      this.needSmooth = true
      this.$nextTick(() => {
        this.$refs.magazinePage.scrollTop = 0
      })
      setTimeout(() => {
        this.needSmooth = false
      }, 1500)
    },
    async init() {
      this.$store.dispatch('pageLoaded', { status: true, alpha: 0 })

      const data = await getGCMagazineData()
      if (!data || !data.length) {
        this.$store.dispatch('pageLoaded', false)
        return
      }
      this.magazineData = data[0]
      this.gameList = await getGCMagazineGameList({ softIds: JSON.stringify(data[0].gameMagazine.softIds) })
      this.magazineDataReport()

      this.$store.dispatch('pageLoaded', false)
    },
    clickBuyMagazine(type) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeLegionPlayBuyButtonClick', 'click', {
        detail: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: type,
          plateName: '',
          type: 2,
          skuName: '',
          softID: '',
          lenovoid: this.userInfo?.UserID || ''
        })
      })

      this.$magazinePay({
        productId: this.magazineData.id,
        drinfo: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: type,
          plateName: '',
          type: 2,
          skuName: '',
          softID: '',
          lenovoid: this.userInfo?.UserID || ''
        })
      }).then((res) => {
        if (res) {
          this.init()
        }
      }).catch(() => {})
    },
    scrollHandler(e) {
      this.gaScrollTop = Math.round(e.target.scrollTop)
      this.showFixBottom = this.gaScrollTop > 330
      this.$emit('scrollTop', this.gaScrollTop)
    },
    scrollToGame(index) {
      this.needSmooth = true
      const node = index === 0 ? this.$refs['sGame'] : this.$refs['gameItem' + (index - 1)][0]
      this.$nextTick(() => {
        this.$refs.magazinePage.scrollTop = node.offsetTop - 184
      })
      setTimeout(() => {
        this.needSmooth = false
      }, 1500)
    },
    toDetail(item) {
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: ''
        }
      })
    },
    mouseEnterVideo(refName) {
      let video = this.$refs[refName]
      if (Array.isArray(video)) {
        video = video[0]
      }
      if (this.playTimer) clearTimeout(this.playTimer)
      if (this.pauseTimer) clearTimeout(this.pauseTimer)
      this.playTimer = setTimeout(() => {
        this.playingName = refName
        try {
          video?.play()
        } catch (error) {
          console.warn(error)
        }
      }, 500)
    },
    mouseLeaveVideo(refName) {
      let video = this.$refs[refName]
      if (Array.isArray(video)) {
        video = video[0]
      }
      if (this.playTimer) clearTimeout(this.playTimer)
      if (this.pauseTimer) clearTimeout(this.pauseTimer)
      this.pauseTimer = setTimeout(() => {
        this.playingName = ''
        video?.pause()
      }, 650)
    },
    upRedemptionCode() {
      this.showRedemptionCode = true

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeRedeemCodesEnterClick',
        'click',
        {
          plateName: this.magazineData.productName || ''
        }
      )
    },
    hideRedemptionCode(value = false) {
      if (value) {
        this.init()
      } else {
        this.showRedemptionCode = false
      }
    },
    magazineDataReport() {
      let _nameAndIDVersion = ''
      if (this.gameList.length) {
        _nameAndIDVersion = this.gameList.map(o => `${o.softId}_${o.softName}`).join(',')
      }

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeHomeLegionPlayPageShow',
        'pv',
        {
          detail: JSON.stringify({
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            plateName: this.plateNameReport || this.magazineData.productName || '',
            nameAndIDVersion: _nameAndIDVersion,
            lenovoid: this.userInfo ? this.userInfo.UserID : ''
          })
        }
      )
    }
  },
  beforeUnmount() {
    clearTimeout(this.playTimer)
    clearTimeout(this.pauseTimer)
  }
}
</script>
<style lang="scss" src="./index.scss" scoped>

</style>
