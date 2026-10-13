<template>
  <div :class="searchUpSource">
    <ul>
      <div
        class="searchWord1"
        v-if="!keyword && searchWord.length"
        :class="{ 'search-word-no-list': !remoteGameList.length }">
        <div class="left">
          <span class="title">热门搜索</span>
          <li
            tabindex="0"
            role="button"
            :aria-label="'热门搜索：' + item.keyword"
            @click.stop="selectSearchWord(item.keyword)"
            @keydown.enter.prevent.stop="selectSearchWord(item.keyword)"
            @keydown.space.prevent.stop="selectSearchWord(item.keyword)"
            v-for="(item, index) in searchWord"
            :key="index"
            class="left-item">
            <i class="index" aria-hidden="true">{{ index + 1 }}</i>
            <span class="text" aria-hidden="true">{{ item.keyword }}</span>
            <b v-if="item.label" :class="{ 'hot': item.label === '2' }" aria-hidden="true"></b>
          </li>
        </div>
        <div class="right" v-if="remoteGameList.length">
          <span class="title">{{ BRAND_TEXT_CHINESE }}er都在玩儿</span>
          <div class="game-list">
            <div
              v-for="(item, index) in remoteGameList"
              :key="index"
              class="game-item"
              tabindex="0"
              role="button"
              :aria-label="item.softName + '，点击查看详情'"
              @click="toDetail2(item, index)"
              @keydown.enter.prevent.stop="toDetail2(item, index)"
              @keydown.space.prevent.stop="toDetail2(item, index)"
            >
              <img v-if="item.showInfo.himg" class="img-class" :src="item.showInfo.himg" :alt="item.softName" />
              <div v-else class="img-class">
                <img class="img-class-logo" :src="item.showInfo.logoFile" />
              </div>
              <div class="text-content">
                <div class="game-title">{{ item.softName }}</div>
                <div v-if="item.softPurpose === 3 && !item.productInfo.userPurchasedStatus" class="buy-information">
                  <div class="current-price-class">¥{{ item.productInfo.currentPrice || 0 }}</div>
                  <div class="orgin-price-class">¥{{ item.productInfo.originalPrice || 0 }}</div>
                </div>
                <div v-else-if="item.softDesc.introduction" class="game-desc">{{ item.softDesc.introduction }}</div>
                <TagRank
                  v-else-if="item.showInfo.rankingLabelInfos.length"
                  style="margin-right: 6px;"
                  :rank-list="item.showInfo.rankingLabelInfos" />
              </div>
              <GameDownloadButton
                class="downloadButton"
                theme="rect"
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
                :drinfo="drinfo(item, index, true)"
                :sku-id="item.skuId" />
            </div>
          </div>
        </div>
      </div>
      <div class="searchHotWord" v-else-if="keyword && searchGameList.length">
        <li
          v-for="(item, index) in searchGameList"
          :key="index"
          v-exposure:multiple="{
            events: [
              {
                handler: () => onExposure(item, 1, index),
                options: { threshold: 0.5 },
                delay: 1000
              },
              {
                handler: () => onExposure(item, 0, index)
              }
            ]
          }"
          tabindex="0"
          role="button"
          :aria-label="item.softName + '，点击查看详情'"
          @click.stop="toDetail(item, index)"
          @keydown.enter.prevent.stop="toDetail(item, index)"
          @keydown.space.prevent.stop="toDetail(item, index)">
          <template>
            <b :style="{ backgroundImage: `url('${item.showInfo.vimg || item.showInfo.logoFile || defaultImg}')` }" aria-hidden="true">
              <img v-if="!item.showInfo.vimg && item.showInfo.logoFile" :src="item.showInfo.logoFile" :alt="item.softName" />
            </b>
            <!-- <aside v-if="item.softPurpose === 1">
              <span class="name-wrap" v-html="item.hlSoftName || item.softName"></span>
              <div>
                <i v-if="item.productInfo.discount" class="discount">{{ item.productInfo.discount }}</i>
                <i class="currentPrice">¥{{ item.productInfo.currentPrice }}</i>
                <i v-if="item.productInfo.discount && item.productInfo.originalPrice" class="originalPrice">¥{{
                  item.productInfo.originalPrice }}</i>
              </div>
            </aside> -->
            <aside>
              <span class="name-wrap" v-html="item.hlSoftName || item.softName"></span>
              <div v-if="item.softPurpose === 3 && !item.productInfo.userPurchasedStatus" class="buy-information">
                <div class="current-price-class">¥{{ item.productInfo.currentPrice || 0 }}</div>
                <div class="orgin-price-class">¥{{ item.productInfo.originalPrice || 0 }}</div>
              </div>
              <p v-else-if="item.softPurpose !== 4">{{ item.downloadInfo.downloadCount }}</p>
            </aside>
            <div
              class="buyButton common-rect-btn"
              v-if="item.softPurpose === 1"
              tabindex="0"
              role="button"
              :aria-label="item.softName + '，点击购买'"
              @click.stop="showPay(item, index)"
              @keydown.enter.prevent.stop="showPay(item, index)"
              @keydown.space.prevent.stop="showPay(item, index)"
            >购买
            </div>
            <div class="buyButton common-rect-btn" v-else-if="item.softPurpose === 4" aria-hidden="true">打开</div>
            <GameDownloadButton
              v-else
              class="downloadButton"
              theme="rect"
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
              :drinfo="drinfo(item, index, false)"
              :sku-id="item.skuId" />
          </template>
        </li>
      </div>
    </ul>
  </div>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import { reportMinigameOpen, reportMinigameExpose } from '@/utils/dataReport'
import { openMiniGameAndPin, parentExposeMiniGame } from '@/utils/miniGame'
import { getCurrentBrandConfig } from '@/assets/text'

import TagRank from '@/components/TagNormal/TagRank'

import { getSearchZoneGameList } from '@/api/gameCenter'
const FORM_PAGE_TYPE = {
  1: 'gameCenter',
  2: 'AppHomepage ',
  3: 'miniGamesHub '
}
export default {
  components: {
    GameDownloadButton,
    TagRank
  },
  props: {
    fromPageType: {
      type: Number,
      default: 1
    },
    showSearchUp: {
      type: Boolean,
      required: true
    },
    searchWord: {
      type: Array,
      required: true
    },
    searchGameList: {
      type: Array,
      required: true
    },
    keyword: {
      type: String,
      required: true
    },
    searchUpSource: {
      type: String,
      required: true
    },
    firstLocal: {
      type: String,
      required: true,
      default: ''
    },
    upSource: {
      type: String,
      default: ''
    },
    miniGameDeviceInfo: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  watch: {
    showSearchUp: {
      immediate: true,
      handler(val) {
        setTimeout(() => {
          if (val && !this.keyword && this.searchWord.length) {
            let hotWords = ''
            this.searchWord.forEach(item => {
              hotWords += item.keyword + ','
            })
            this.$dataReport('LZ_gamingCenter', 'LZ_storeSearchPopularCustomShow', 'pv', {
              detail: JSON.stringify({
                from: this.fromPageType,
                name: hotWords.slice(0, -1),
                lenovoid: this.userInfo?.UserID || ''
              })
            })
          }
        }, 100)
      }
    }
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/search_normal_img.png'),
      thirdLocal: 2,
      remoteGameList: [],
      BRAND_TEXT_CHINESE: getCurrentBrandConfig('BRAND_TEXT_CHINESE')
    }
  },
  created() {
    this.getSearchZoneGameList()
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    secondLocal() {
      return 7
    },
    drinfo() {
      return (item, index, lot = false) => {
        let pplateName = `${this.keyword}_${index + 1}`
        if (lot) {
          pplateName = `搜索运营位_${index + 1}`
        }
        const params = {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: lot ? 6 : 2,
          type: 2,
          plateName: pplateName,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        }

        let _gameClass = 1 // 1游戏，2工具
        if (Number(item.firstClassId) === 2001) { // 2001 是 软件/工具， 2002 是 游戏
          _gameClass = 2
        }

        if (_gameClass === 2) {
          params.gameClass = _gameClass
        }

        return JSON.stringify(params)
      }
    }
  },
  methods: {
    getIconImage(id) {
      try {
        return resolveAsset('images/Index/function/${id}.png')
      } catch (e) {
        return resolveAsset('images/Index/function/1.png')
      }
    },
    selectSearchWord(searchValue) {
      this.$emit('selectSearchWord', searchValue)
      this.$dataReport('LZ_gamingCenter', 'LZ_storeSearchPopularCustomClick', 'click', {
        detail: JSON.stringify({
          from: this.fromPageType,
          name: searchValue,
          lenovoid: this.userInfo?.UserID || ''
        })
      })
    },
    showPay(item, index) {
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
          plateName: `${this.keyword}_${index + 1}` || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          gameVersion: item.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal}_2`,
        type: 0,
        skuId: item.skuId,
        price: item.productInfo.currentPrice,
        plateName: `${this.keyword}_${index + 1}`,
        gameVersion: item.productInfo.gamePkgType || '',
        firstLocal: this.firstLocal,
        secondLocal: this.secondLocal,
        thirdLocal: this.thirdLocal,
        reportType: 2,
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    onExposure(item, exposureType, childIndex) {
      if (item.softPurpose === 4) {
        parentExposeMiniGame(item, childIndex, exposureType, '3') // 3: 搜索弹框
        reportMinigameExpose(item, childIndex, exposureType + 2, {
          moduleName: `${this.keyword}`,
          from: this.upSource === 'miniGame' ? 3 : 1,
          type: 1
        })
      }
    },
    toDetail(item, index) {
      if (item.softPurpose === 4) {
        reportMinigameOpen({
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: 2,
          plateName: `${this.keyword}_快捷搜索`,
          skuName: item.softName,
          softID: item.softId,
          softType: item?.softDesc?.isAd ? '广告' : '非广告', // 广告和非广告
          type: 2,
          lenovoid: this.userInfo?.UserID || '',
          position: index + 1,
          source_id: item.softDesc?.runConfigInfo?.resourcePos,
          alg_rid: item.softDesc?.runConfigInfo?.rid
        })

        openMiniGameAndPin(item, index)
        return
      }
      if (item.type === 'function') {
        switch (item.id) {
          case 15:
            this.$lzsetting()
            break
          case 16:
            this.$store.dispatch('setShowAbout', true)
            break
          default:
            this.$router.push(item.url)
            break
        }
        this.$dataReport('LZ_gamingCenter', 'LZ_homeFunctionSearchClick', 'click', {
          detail: JSON.stringify({
            type: 1,
            searchContent: this.keyword,
            clickfun: item.functionName,
            lenovoid: this.userInfo?.UserID || ''
          })
        })
      } else {
        this.$router.push({
          name: 'GameCenterDetail',
          params: { id: item.softId },
          query: {
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            reportPlateName: `${this.keyword}_${index + 1}`,
            location: 3
          }
        })
      }
    },
    toDetail2(item, index) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeSearchRecomClick', 'click', {
        detail: JSON.stringify({
          from: FORM_PAGE_TYPE[this.fromPageType] || '',
          name: `${item.softName}_${item.softID}`,
          lenovoid: this.userInfo?.UserID || ''
        })
      })
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          reportPlateName: `搜索运营位_${index + 1}`,
          thirdLocal: 6,
          location: 3
        }
      })
    },
    async getSearchZoneGameList() {
      const data = await getSearchZoneGameList()

      if (data.length) {
        this.remoteGameList = [...data]
        this.remoteGameList = this.remoteGameList.slice(0, 3)
        const name = this.remoteGameList.map(item => `${item.softName}_${item.softId}`).join(',') || ''
        this.$dataReport('LZ_gamingCenter', 'LZ_storeSearchRecomShow', 'pv', {
          detail: JSON.stringify({
            from: FORM_PAGE_TYPE[this.fromPageType] || '',
            name,
            lenovoid: this.userInfo?.UserID || ''
          })
        })
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.searchPage {
  position: absolute;
  left: 0px;
  top: 35px;
  height: auto;
  z-index: 9;

  .buy-information {
    display: flex;
    align-items: center;
    padding: 0px 12px 0 0;
    //  background-color: rgba(48, 53, 61);
    font-size: 12px;

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

  >ul {
    height: auto;
    margin-top: 7px;

    .common-rect-btn {
      &:hover {
        color: #000;
      }
    }

    .searchWord1 {

      width: 482px;
      height: 276px;
      display: flex;
      padding: 20px;
      background: rgba(14, 18, 23, 0.9);
      outline: 1px solid rgba(88, 94, 102, .7);
      backdrop-filter: blur(15px);

      .title {
        font-size: 14px;
        font-weight: 700;
        background: linear-gradient(178deg, #FFF 1.88%, #D1D1D1 98.12%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .left {
        width: 157px;
        padding-right: 30px;

        .left-item {
          display: flex;
          align-items: center;
          font-size: 14px;
          height: 16px;
          line-height: 16px;
          font-weight: 400;
          cursor: pointer;
          margin-top: 20px;

          .index {
            font-weight: 700;
          }

          .text {
            margin: 0 6px;

            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          b {
            display: inline-block;
            width: 32px;
            height: 22px;
            margin-left: auto;
            background: linear-gradient(180deg, #FF2C2C 0%, #FF2A2A 100%);
            border-radius: 3px;
            position: relative;
            transform: scale(.72);

            &::after {
              position: absolute;
              left: 50%;
              top: 50%;
              transform: translate(-50%, -50%);
              content: '热';
              font-weight: 600;
              font-size: 12px;
              font-style: italic;
            }

            &.hot {
              background: #4A3CFF;

              &::after {
                content: '新';
              }
            }
          }
        }
      }

      .right {

        width: 100%;

        .game-list {
          width: 100%;
          margin-top: 20px;
          background: rgba(255, 255, 255, 0.04);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 6px;

          .game-item {
            box-sizing: border-box;
            width: 100%;
            display: flex;
            padding: 7px 6px;
            align-items: center;

            &:hover {
              background: rgba(255, 255, 255, 0.10);

              .downloadButton {
                display: block;
                margin-right: 4px;
              }

              .text-content {

                max-width: 105px;
              }
            }

            .img-class {
              width: 59px;
              height: 44px;
              display: flex;
              justify-content: center;
              align-items: center;

              .img-class-logo {
                width: 40px;
                height: 40px;
              }
            }

            .text-content {
              max-width: 150px;
              margin-left: 8px;

              font-size: 12px;

              .game-title {
                font-weight: 700;
                margin-bottom: 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              .game-desc {
                line-height: 14px;
                font-weight: 400;
                opacity: 0.6;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }

            
              :deep(.grey-rect-btn) {
                min-width: 64px;
                height: 28px;
                line-height: 24px;

                .text {
                  font-size: 12px;
                }
              }

              :deep(.common-rect-btn) {
                width: 64px;
                height: 26px;
                line-height: 26px;
                font-size: 12px;
              }
            
          }
        }
      }

      .downloadButton {
        width: 64px;
        height: 26px;
        display: none;
        margin-left: auto;

        
          :deep(div.DownloadButton) {
            width: 64px;
            height: 26px;
          }
        

        :deep(div span) {
          font-size: 12px;
          width: 100%;
        }

        
          :deep(.grey-rect-btn) {
            min-width: 64px;
            width: 64px;
            height: 26px;
            line-height: 24px;
            //  background: linear-gradient(298deg, rgb(190, 191, 191) 0%, rgb(234, 247, 255) 30%);

            .text {
              font-size: 12px;
            }
          }
        
      }
    }

    .search-word-no-list {
      width: 300px;

      .left {
        width: 100%;
      }
    }

    >div.searchHotWord {

      width: 300px;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 20px;
      background: rgba(14, 18, 23, 0.9);
      outline: 1px solid rgba(88, 94, 102, .7);
      backdrop-filter: blur(15px);

      >li {
        margin-top: 14px;
        display: flex;
        align-items: center;
        cursor: pointer;

        .function-bac {
          background-size: 28px 28px;
          background-repeat: no-repeat;
          background-position: 6.5px center;
          border: 1px solid;
          border-image: linear-gradient(to bottom, #39493d, rgb(57 73 61 / 40%)) 1;
          margin-right: 9px;
        }

        .function-wrap,
        .name-wrap {
          :deep(em) {
            color: rgba(56, 110, 254, 1);
            vertical-align: text-bottom;
          }
        }

        &:nth-of-type(1) {
          margin-top: 0px;
        }

        >b {
          width: 38px;
          height: 38px;
          margin-right: 10px;
          background-size: cover;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          img {
            width: 22px;
            height: 22px;
          }
        }

        >aside {
          width: 145px;

          span {
            width: calc(100% - 20px);
            display: inline-block;
            color: #EAF7FF;
            font-size: 12px;
            font-style: normal;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          p {
            color: rgba(234, 247, 255, .5);
            font-size: 12px;
            font-style: normal;
            font-weight: 400;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .buyButton,
        :deep(.buyButton) {
          width: 64px;
          height: 28px;
          text-align: center;
          line-height: 28px;
          font-size: 12px;
          background: linear-gradient(298deg, rgb(190, 191, 191) 0%, rgb(234, 247, 255) 30%);

          &:hover {
            color: #000;
          }
        }

        >div.downloadButton {
          width: 64px;
          height: 28px;

          
            :deep(.DownloadButton) {
              width: 64px;
              height: 28px;
            }
          

          :deep(div span) {
            font-size: 12px;
            width: 100%;
          }

          
            :deep(.grey-rect-btn) {
              min-width: 64px;
              width: 64px;
              height: 28px;
              line-height: 24px;

              .text {
                font-size: 12px;
              }
            }
          
        }
      }
    }
  }
}

.searchPage > ul > div.searchHotWord > li:focus-visible,
.searchPage > ul > .searchWord1 .left-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 4px;
}

.searchPage > ul > .searchWord1 .right .game-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 4px;
}

@media (forced-colors: active) {
  .searchPage > ul > div.searchHotWord > li:focus-visible,
  .searchPage > ul > .searchWord1 .left-item:focus-visible,
  .searchPage > ul > .searchWord1 .right .game-item:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: -2px;
  }
}
</style>
<style lang="scss">
@media (forced-colors: active) {
  .PcDevice .searchPage {
    background: Canvas;
    color: CanvasText;
    forced-color-adjust: auto;
  }

  .PcDevice .searchPage > ul,
  .PcDevice .searchPage .searchWord1,
  .PcDevice .searchPage .searchHotWord,
  .PcDevice .searchPage .left,
  .PcDevice .searchPage .right,
  .PcDevice .searchPage .game-list,
  .PcDevice .searchPage .game-item,
  .PcDevice .searchPage .left-item,
  .PcDevice .searchPage li,
  .PcDevice .searchPage aside,
  .PcDevice .searchPage .text-content {
    background: Canvas;
    border-color: ButtonText;
    color: CanvasText;
    forced-color-adjust: auto;
  }

  .PcDevice .searchPage .searchWord1,
  .PcDevice .searchPage .searchHotWord,
  .PcDevice .searchPage .game-list,
  .PcDevice .searchPage .game-item,
  .PcDevice .searchPage .left-item,
  .PcDevice .searchPage > ul > div.searchHotWord > li {
    border: 1px solid ButtonText;
  }

  .PcDevice .searchPage .title,
  .PcDevice .searchPage .game-title,
  .PcDevice .searchPage .name-wrap,
  .PcDevice .searchPage .text,
  .PcDevice .searchPage em {
    background: none;
    color: CanvasText;
    -webkit-text-fill-color: CanvasText;
  }

  .PcDevice .searchPage .game-desc,
  .PcDevice .searchPage aside p,
  .PcDevice .searchPage .orgin-price-class {
    color: GrayText;
  }

  .PcDevice .searchPage .index,
  .PcDevice .searchPage .current-price-class {
    color: CanvasText;
  }

  .PcDevice .searchPage b,
  .PcDevice .searchPage .img-class,
  .PcDevice .searchPage .function-bac {
    background: Canvas;
    border: 1px solid ButtonText;
    color: CanvasText;
    forced-color-adjust: auto;
  }

  .PcDevice .searchPage .buyButton,
  .PcDevice .searchPage .common-rect-btn,
  .PcDevice .searchPage .downloadButton {
    background: ButtonFace;
    border: 1px solid ButtonText;
    color: ButtonText;
    forced-color-adjust: auto;
  }

  .PcDevice .searchPage .hot,
  .PcDevice .searchPage .active,
  .PcDevice .searchPage .selected,
  .PcDevice .searchPage [aria-selected="true"] {
    background: Highlight;
    border-color: Highlight;
    color: HighlightText;
    -webkit-text-fill-color: HighlightText;
  }

  .PcDevice .searchPage .disabled,
  .PcDevice .searchPage .is-disabled,
  .PcDevice .searchPage [disabled],
  .PcDevice .searchPage [aria-disabled="true"] {
    color: GrayText;
    border-color: GrayText;
  }

  .PcDevice .searchPage > ul > div.searchHotWord > li:focus-visible,
  .PcDevice .searchPage > ul > .searchWord1 .left-item:focus-visible,
  .PcDevice .searchPage > ul > .searchWord1 .right .game-item:focus-visible,
  .PcDevice .searchPage [role="button"]:focus-visible,
  .PcDevice .searchPage [tabindex]:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
