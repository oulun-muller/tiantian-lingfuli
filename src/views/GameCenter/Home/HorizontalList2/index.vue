<!--
   横向列表 新样式
-->
<template>
  <div
    class="HorizontalList2"
    v-if="rankingListSofts.length"
    v-exposure="{
      handler: ()=>onExposure(),
      delay: 1000,
      options: { threshold: 0.5 },
      once: true
    }"
  >
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleData.moduleEname }}</span>
      <span class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ moduleData.moduleName }}&nbsp;<i class="gc-title-quote-icon"></i></span>
      <!-- <span class="more" @click="toList(rankSoftList.id,rankSoftList.name)">更多</span> -->
      <span class="more" @click="toGameList" tabindex="0" role="button" @keydown.enter.prevent.stop="toGameList" @keydown.space.prevent.stop="toGameList">更多</span>
    </h3>
    <ul class="list-wrap" role="listbox" :aria-label="moduleData.moduleName" ref="stage" @keydown="onGridKeydown">
      <li
        v-for="(item, index) in rankingListSofts"
        :key="index"
        class="card-item"
        :tabindex="index === focusedIndex ? 0 : -1"
        role="option"
        :aria-selected="index === focusedIndex"
        :aria-label="item.softName + '，点击查看详情'"
        :style="{ backgroundImage: `url('${ item.showInfo.vimg || defaultImg }')` }"
        @focus="focusedIndex = index"
        @click="toDetail(item)"
        @mouseenter="curIndex= index"
        @mouseleave="curIndex= -1"
        @keydown.enter.prevent.stop="toDetail(item)"
        @keydown.space.prevent.stop="toDetail(item)"
      >
        <!-- 容器外壳 -->
        <sub class="horn-right"></sub>
        <sub class="horn-left"></sub>
        <sub class="bor-top"></sub>
        <sub class="bor-right"></sub>
        <sub class="bor-bottom"></sub>
        <sub class="bor-left"></sub>
        <sub class="bor-dot0"></sub>
        <sub class="bor-dot1"></sub>
        <sub class="bor-dot2"></sub>
        <!-- 内容 -->
        <section class="card-content-hover" v-if="index === curIndex">
          <div class="radio-img-class">
            <template v-if="item && item.softDesc.mediaList[0].type === 'video'">
              <video ref="videoDom" class="img-item" :src="item.softDesc.mediaList[0].url" autoplay muted loop></video>
            </template>
            <template v-else>
              <img class="img-item" :src="item.softDesc.mediaList[0].url" />
            </template>
          </div>
          <div class="hover-content">
            <div class="header-title">
              <div class="title">{{ item.softName }}</div>
              <div class="tagType">
                <span v-if="item.downloadInfo.tagUrls.length">
                  <img :src="item.downloadInfo.tagUrls[0]" alt="" class="logo-img">
                </span>
              </div>
            </div>
            <div style="margin-top: 10px;">
              <template v-if="item.softDesc.introduction">
                <div class="game-introduction">{{ item.softDesc.introduction }}</div>
              </template>
              <div v-if="item.showInfo.softLabels.length" style="margin-top: 10px;">
                <TagNormal
                  v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0, 4)"
                  style="margin-right: 4px;"
                  :key="tagIndex"
                  :title="tagItem" />
              </div>
            </div>
            <div class="tags-wrap">
              <TagRank v-if="item.showInfo.rankingLabelInfos.length" style="margin-right: 6px;margin-top: 10px;" :rank-list="item.showInfo.rankingLabelInfos" />
              <template v-if="item.relateActivitys.length">
                <TagActivity
                  style="margin-top: 10px;"
                  :class="{ 'tag-has-rank': item.showInfo.rankingLabelInfos.length }"
                  :title="item.relateActivitys[0].title"
                  :plate-name="moduleData.moduleName"
                  :game-item="item"/>
              </template>
              <template v-else-if="item.softDesc.recommendIntroduction">
                <TagActivity
                  style="margin-top: 10px;"
                  :class="{ 'tag-has-rank': item.showInfo.rankingLabelInfos.length }"
                  :title="item.softDesc.recommendIntroduction"
                  :plate-name="moduleData.moduleName"
                  :type="2"
                  :game-item="item"/>
              </template>
            </div>
            <div class="bottom-btn">
              <GameDownloadButton
                class="downloadButton"
                :download-info="item.downloadInfo"
                :soft-desc="item.softDesc"
                theme="rect"
                :soft-id="item.softId"
                :soft-purpose="item.softPurpose"
                :product-info="item.productInfo"
                :user-purchased-status="item.productInfo.userPurchasedStatus"
                :version="item.softDesc.version"
                :soft-name="item.softName"
                :logo-file="item.showInfo.logoFile"
                :fast-install="item.showInfo.isFastInstall"
                :sku-id="item.skuId"
                :drinfo="drinfo(item)" />
              <div v-if="item.softPurpose === 3 && !item.productInfo.userPurchasedStatus" class="buy-information">
                <div class="discount-class">{{ item.productInfo.discount || 0 }}</div>
                <div class="current-price-class">¥{{ item.productInfo.currentPrice || 0 }}</div>
                <div class="orgin-price-class">¥{{ item.productInfo.originalPrice || 0 }}</div>
              </div>
              <template >
                <div v-if="item.downloadInfo.bizType === 0 && item.showInfo.playersNum" class="people-num">{{ gamePeopleFilter(item.showInfo.playersNum ) }}人玩过</div>
                <div v-else-if="[1, 2].includes(item.downloadInfo.bizType) && item.downloadInfo.reservationCount" class="people-num">{{ gamePeopleFilter( item.downloadInfo.reservationCount ) }}人已预约</div>
              </template>
            </div>
            <div class="game-rating">
              <template v-if="item.downloadInfo.bizType === 0 && item.softDesc.positiveReviewRate">
                <p class="text">推荐率</p>
                <div class="rating-num">{{ item.softDesc.positiveReviewRate }} <span class="symble-100">%</span></div>
              </template>
              <template v-else-if="[1, 2].includes(item.downloadInfo.bizType) && item.expectations">
                <p class="text">期待值</p>
                <div class="rating-num">{{ item.expectations }}</div>
              </template>
            </div>
          </div>
        </section>
        <section v-else class="card-content-nohover">
          <img
            v-if="!item.showInfo.vimg && item.showInfo.logoFile"
            :src="item.showInfo.logoFile"
            class="logo-file"
            aria-hidden="true"
            alt="">
          <div class="card-content">
            <div class="header-title">
              <div class="title">{{ item.softName }}</div>
              <div class="tagType">
                <span v-if="item.downloadInfo.tagUrls.length">
                  <img :src="item.downloadInfo.tagUrls[0]" alt="" class="logo-img">
                </span>
              </div>
            </div>
            <div style="margin-top: 10px;">
              <template v-if="item.softDesc.introduction">
                <div class="game-introduction">{{ item.softDesc.introduction }}</div>
              </template>
              <template v-else>
                <div v-if="item.showInfo.softLabels.length">
                  <TagNormal
                    v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0, 4)"
                    style="margin-right: 4px;"
                    :key="tagIndex"
                    :title="tagItem" />
                </div>
              </template>
            </div>
            <div style="margin-top: 10px;" class="tags-wrap">
              <TagRank v-if="item.showInfo.rankingLabelInfos.length" style="margin-right: 6px;" :rank-list="item.showInfo.rankingLabelInfos"/>
              <template v-if="item.relateActivitys.length">
                <TagActivity
                  :class="{ 'tag-has-rank': item.showInfo.rankingLabelInfos.length }"
                  :title="item.relateActivitys[0].title"
                  :plate-name="moduleData.moduleName"
                  :game-item="item"/>
              </template>
              <template v-else-if="item.softDesc.recommendIntroduction">
                <TagActivity
                  :class="{ 'tag-has-rank': item.showInfo.rankingLabelInfos.length }"
                  :title="item.softDesc.recommendIntroduction"
                  :plate-name="moduleData.moduleName"
                  :type="2"
                  :game-item="item"/>
              </template>
            </div>
          <!-- <div class="mask-wrap"></div> -->
          </div>
        </section>
        <!-- <img class="image" :src="getImgUrl(item) || defaultImg"/>
        <img
          v-if="!getImgUrl(item) && item.softInfo && item.softInfo.showInfo && item.softInfo.showInfo.logoFile"
          :src="item.softInfo.showInfo.logoFile"
          class="logo-img"
          alt=""> -->
      </li>
    </ul>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'


import TagNormal from '@/components/TagNormal'
import TagActivity from '@/components/TagNormal/TagActivity'
import TagRank from '@/components/TagNormal/TagRank'
import GameDownloadButton from '@/components/GameDownloadButton'

import { getGameMsgDataReport } from '@/utils/dataReport.js'
export default {
  name: '',
  components: {
    TagNormal,
    TagActivity,
    TagRank,
    GameDownloadButton
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png'),
      list: [{ type: 1 }, { type: 0 }, { type: 1 }, { type: 1 }],
      tagList: ['测试标签', '测试标签'],
      curIndex: -1,
      secondLocal: 1,
      aiGameList: [],
      rankingListSofts: [],
      focusedIndex: 0
    }
  },
  computed: {
    rankListObj() {
      if (this.moduleData?.rankingLists.length) {
        return this.moduleData.rankingLists[0]
      }
      return {}
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    firstLocal() {
      if (this.$route.query.reportFrom === 'push') {
        return 4
      }

      const _GAME_CENTER_SOURCE_RECORD = Number(sessionStorage.getItem('GAME_CENTER_SOURCE_RECORD'))
      return _GAME_CENTER_SOURCE_RECORD
    },
    drinfo(item) {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          firstLocal: this.firstLocal,
          secondLocal: 1,
          type: 2,
          plateName: this.moduleData.moduleEname || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    }
  },
  async mounted() {
    const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || {}
    const mouduleId = _data.id

    try {
      const aiGame = await this.$store.dispatch('aiGameRecommend/requestModuleData', { moduleId: mouduleId })
      this.aiGameList = [...aiGame]
    } catch (error) {
      this.aiGameList = []
    }
    if (this.moduleData?.rankingLists.length) {
      this.rankingListSofts = this.moduleData.rankingLists[0].rankingListSofts
    }

    this.rankingListSofts = [...this.aiGameList, ...this.rankingListSofts].slice(0, 4)
  },
  methods: {
    // 网格键盘事件
    onGridKeydown(e) {
      const total = this.rankingListSofts.length
      if (total === 0) return
      let next = this.focusedIndex
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (this.focusedIndex + 1) % total
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (this.focusedIndex - 1 + total) % total
      } else {
        return
      }
      this.focusedIndex = next
      this.$nextTick(() => {
        const items = Array.from(this.$refs.stage.children)
        if (items[next]) items[next].focus()
      })
    },
    onExposure() {
      const _rankingListSofts = this.rankListObj.rankingListSofts.map(item => {
        const { statePage, stateGame } = getGameMsgDataReport(item)
        const aiStrategy = item?.isAiGame ? this.$store.state.aiGameRecommend.moduleGameConfigs?.fillingStrategyKey : 'no'
        item['aiStrategy'] = aiStrategy
        const obj = `${item.softName}_${item.softId}_${stateGame}_${statePage}_${aiStrategy}`
        return obj
      })
      const _download = _rankingListSofts.join(',')
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeLoadGameTabPageShow', 'pv', {
        details: JSON.stringify({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          plateName: this.moduleData.moduleName,
          nameAndIDVersion: _download,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })
    },
    toGameList() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 1,
          plateName: this.rankListObj?.name,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$router.push({
        name: 'GameCenterList',
        query: {
          rankID: this.rankListObj.id,
          rankName: this.rankListObj.name
        }})
    },
    toDetail(item) {
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.moduleData.moduleName,
          plateName: this.moduleData.moduleName
        }
      })
    }
  }
}
</script>

<style lang="scss" src="./index.scss" scoped>

</style>
