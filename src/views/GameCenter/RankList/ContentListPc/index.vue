<template>
  <div class="FourColumnList">
    <div
      v-for="(item,index) of dataList"
      :key="index"
      :tabindex="index === focusedIndex ? 0 : -1"
      role="button"
      :aria-label="item.softInfo && item.softInfo.softName"
      @click="onItemClick(item.softInfo, index)"
      @keydown.enter.prevent.stop="toDetail(item.softInfo)"
      @keydown.space.prevent.stop="toDetail(item.softInfo)"
      @keydown.up.prevent="navigateList(-1)"
      @keydown.down.prevent="navigateList(1)"
      :class="[item.softInfo ? 'pointer' : '', 'wrapper']">
      <div class="item IsRankList">
        <div class="img_box IsRankList_img_box">
          <b
            :style="{backgroundImage: !$isPadDevice ? `url('${getImgUrl(item) || defaultImg}')` : `url('${item.softInfo.showInfo.logoFile}')`}">
            <img
              v-if="!getImgUrl(item) && item.softInfo && item.softInfo.showInfo.logoFile && !$isPadDevice"
              :src="item.softInfo.showInfo.logoFile"
              :alt="item.softInfo.softName || ''">
          </b>
          <i v-if="item.changeNum > 0" class="arrow-up"></i>
          <i v-else-if="item.changeNum < 0" class="arrow-down"></i>
        </div>
        <span
          v-if="item.softInfo && item.softInfo.showInfo && item.softInfo.showInfo.ruleLabelName"
          :class="item.softInfo.showInfo.ruleLabelClassName">{{ item.softInfo.showInfo.ruleLabelName }}
        </span>
        <section>
          <div class="softName">
            <template v-if="rankType>=0">
              <b v-if="index<3" :class="['rankTagB', 'rankTag'+index, 'tab'+rankType]"></b>
              <b v-else class="rankTagOther">TOP {{ index+1 }}</b>
            </template>

            <p class="IsRankList_p">{{ getGameName(item) }}</p>
            <span
              v-if="item.softInfo && item.softInfo.softPurpose===1 && item.softInfo.productInfo.exchangePlatform"
              class="platform">
              <i
                v-if="item.softInfo.productInfo.exchangePlatformFont"
                class="iconfont"
                v-html="item.softInfo.productInfo.exchangePlatformFont"></i>
            </span>
            <img
              v-if="item.softInfo && item.softInfo.downloadInfo && item.softInfo.downloadInfo.tagUrls && item.softInfo.downloadInfo.tagUrls[0]"
              class="auth-icon"
              :src="item.softInfo.downloadInfo.tagUrls[0]"
              :alt="item.softInfo.showInfo && item.softInfo.showInfo.ruleLabelName ? item.softInfo.showInfo.ruleLabelName : ''"
              aria-hidden="true" />
          </div>
          <span v-if="item.playedBefore" class="play-label">{{ item.playedBefore }}</span>
          <ul v-if="item.softInfo && item.softInfo.showInfo && item.softInfo.showInfo.softLabels" class="soft-labels">
            <template>
              <div v-if="item.softInfo.downloadInfo.bizType === 0 && item.softInfo.softDesc.positiveReviewRate" class="soft-recommend-tag">
                <img src="./img/smile-face.svg" class="img-icon" aria-hidden="true" alt=""/>
                <span>推荐率{{ item.softInfo.softDesc.positiveReviewRate }}%</span>
              </div>
              <div v-else-if="[1,2].includes(item.softInfo.downloadInfo.bizType) && item.softInfo.expectations" class="soft-recommend-tag">
                <img src="./img/rocket-icon.svg" class="img-icon" aria-hidden="true" alt=""/>
                <span>期待值{{ fixedNum(item.softInfo.expectations) }}</span>
              </div>
            </template>
            <TagNormal
              v-for="(tagItem, tagIndex) of item.softInfo.showInfo.softLabels.slice(0, softLabelsLenght)"
              class="soft-tag"
              :key="tagIndex"
              :title="tagItem"/>
          </ul>
        </section>

        <div class="score-area">
          <div class="people-num">{{ getPlayNumHtml(item) }}</div>
        </div>
        <div class="button-area">
          <div v-if="item.softInfo && item.softInfo.softPurpose === 3" class="buy-information">
            <div class="orgin-price-class">¥{{ item.softInfo.productInfo.originalPrice || 0 }}</div>
            <div class="current-price-class">¥{{ item.softInfo.productInfo.currentPrice || 0 }}</div>
          </div>
          <template>
            <GameDownloadButton
              v-if="item.softInfo"
              class="downloadButton"
              theme="rect"
              :download-info="item.softInfo.downloadInfo"
              :soft-desc="item.softInfo.softDesc"
              :soft-id="item.softInfo.softId"
              :sku-id="item.softInfo.skuId"
              :soft-purpose="item.softInfo.softPurpose"
              :product-info="item.softInfo.productInfo"
              :user-purchased-status="item.softInfo.productInfo.userPurchasedStatus"
              :version="item.softInfo.softDesc.version"
              :soft-name="item.softInfo.softName"
              :logo-file="item.softInfo.showInfo.logoFile"
              :fast-install="item.softInfo.showInfo.isFastInstall"
              :drinfo="drinfo(item.softInfo)" />
            <div v-else class="empty-btn">
            </div>
          </template></div>
      </div>
    </div>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'

import TagNormal from '@/components/TagNormal'

export default {
  name: 'FourColumnList',
  props: {
    dataList: {
      type: Array,
      required: true
    },
    rankType: {
      type: Number,
      default: -1
    },
    curTab: {
      type: Number,
      default: 5
    },
    firstLocal: {
      type: Number,
      required: true
    }
  },
  components: {
    GameDownloadButton,
    TagNormal
  },
  data() {
    return {
      defaultImg: new URL('../../../../images/gamecenter/searchDefault.png', import.meta.url).href,
      thirdLocal: '',
      focusedIndex: 0
    }
  },
  watch: {
    dataList() {
      this.focusedIndex = 0
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 2
    },
    softLabelsLenght() {
      if (this.$isPadDevice) {
        return 2
      } else if (this.pageType === 'gameHouse') {
        return 3
      }

      return 5
    },
    drinfo() {
      const _curTab = {
        5: '火爆',
        6: '时长',
        7: '飙升',
        8: '小时',
        19: '预约'
      }[this.rankType]

      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD6',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: _curTab,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    }
  },
  methods: {
    fixedNum(num) {
      if (num) {
        return parseFloat(num).toFixed(1)
      }
      return ''
    },
    getImgUrl(item) {
      return item?.softInfo?.showInfo?.himg || item.himg
    },
    getGameName(item) {
      return item?.softInfo?.softName || item.gameName
    },
    getPlayNumHtml(item) {
      let num = Number(item.datas)

      // 处理非数字的情况
      if (isNaN(num)) {
        return '' // 非数字原样返回
      }

      // 大于等于1万时格式化
      if (num >= 10000) {
        // 保留一位小数（可根据需求调整）
        num = (num / 10000).toFixed(1) + '万'
      }
      switch (this.curTab) {
        case 5:
        case 8:
          return `${num}人在玩`
        case 6:
          return `总计${num}小时`
        case 7:
          return `涨幅${num}%`
        case 19:
          return `${num}人预约`
      }
    },
    // 列表项点击事件
    onItemClick(softInfo, index) {
      this.focusedIndex = index
      this.toDetail(softInfo)
    },
    // 无障碍适配 键盘切换列表项
    navigateList(direction) {
      const total = this.dataList.length
      if (!total) return
      const nextIndex = (this.focusedIndex + direction + total) % total
      this.focusedIndex = nextIndex
      this.$nextTick(() => {
        const items = this.$el.querySelectorAll('.wrapper')
        items[nextIndex]?.focus()
      })
    },
    toDetail(softInfo) {
      if (!softInfo) return

      const _curTab = {
        5: '火爆',
        6: '时长',
        7: '飙升',
        8: '小时',
        19: '预约'
      }[this.rankType]

      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: softInfo.softId },
        query: {
          source_p: 'PAD6',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: _curTab
        }
      })
    }
  }
}

</script>

<style lang="scss" src="./index.scss" scoped>

</style>
