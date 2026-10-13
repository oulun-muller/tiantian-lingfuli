<template>
  <div
    class="HorizontalList"
    v-if="rankSoftList.data.length">
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleEname }}</span>
      <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ rankSoftList.name }}&nbsp;<i class="gc-title-quote-icon"></i></span>
      <span v-else class="gc-title-text">{{ rankSoftList.name }}</span>
      <span class="more" @click="toList(rankSoftList.id,rankSoftList.name)">更多</span>
    </h3>
    <div class="scroll-wrap">
      <swiper ref="stage" :options="swiperOption">
        <swiper-slide
          v-for="(item) of rankSoftList.data"
          :key="item.softId"
          class="isHover">
          <section class="bigCard" @click="toDetail(item)">
            <b :style="{ backgroundImage: `url('${ item.showInfo.img354x285 || item.showInfo.himg || defaultImg }')` }">
              <sub class="cover-top"></sub>
              <sub class="horn-right"></sub>
              <sub class="horn-left"></sub>
              <sub class="bor-top"></sub>
              <sub class="bor-right"></sub>
              <sub class="bor-bottom"></sub>
              <sub class="bor-left"></sub>
              <sub class="bor-dot0"></sub>
              <sub class="bor-dot1"></sub>
              <sub class="bor-dot2"></sub>
              <img
                v-if="!item.showInfo.img354x285 && !item.showInfo.himg && item.showInfo.logoFile"
                :src="item.showInfo.logoFile"
                alt="">
              <div
                :class="{
                  'hover_content':true
                }">
                <div class="tagType">
                  <span v-if="item.downloadInfo.tagUrls.length">
                    <img :src="item.downloadInfo.tagUrls[0]" alt="">
                  </span>
                  <template v-if="item.showInfo.mediaScores.length">
                    <p
                      v-for="(scoresItem, scoresIndex) of item.showInfo.mediaScores.slice(0,2)"
                      :key="scoresIndex">
                      <i>{{ scoresItem.score }}</i>{{ scoresItem.mediaName }}
                    </p>
                  </template>
                </div>
                <ol>
                  <template v-if="item.showInfo.softLabels.length">
                    <li
                      v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0, 4)"
                      :key="tagIndex">{{ tagItem }}</li>
                  </template>
                </ol>
                <p v-if="item.softDesc.introduction">{{ item.softDesc.introduction }}</p>
              </div>
              <div
                class="concern"
                @click.stop="toFollowers"
                v-if="![1,2].includes(item.downloadInfo.bizType)" >
                <img v-if="isFollower" src="../image/concern-active.png" alt="">
                <img v-else src="../image/concern-normal.png" alt="">
                <p>{{ item.softDesc.followerCount }}</p>
              </div>
            </b>
            <div class="bottom_big">
              <div class="left">
                <h1>{{ item.softName }}</h1>
                <p class="cdk" v-if="item.softPurpose === 1">
                  <span v-if="item.productInfo.discount" class="discount">{{ item.productInfo.discount }}</span>
                  <span class="currentPrice">¥{{ item.productInfo.currentPrice }}</span>
                  <span v-if="item.productInfo.discount && item.productInfo.originalPrice" class="originalPrice">¥{{ item.productInfo.originalPrice }}</span>
                  <span v-if="item.productInfo.exchangePlatformFont" class="iconfont platform" v-html="item.productInfo.exchangePlatformFont"></span>
                </p>
                <p class="download" v-else-if="item.showInfo.playersNum>=100">最近{{ item.showInfo.playersNum }}人玩过</p>
                <p class="download" v-else>{{ item.downloadInfo.downloadCount }}</p>
              </div>
              <div class="right" @click.stop="(e) => {e.preventDefault()}">
                <div
                  class="buyButton common-abnomal-btn"
                  @click.stop="showPay(item)"
                  v-if="item.softPurpose === 1"><i class="text">立即购买</i></div>
                <GameDownloadButton
                  v-else
                  class="downloadButton"
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
                  :sku-id="item.skuId" />
              </div>
            </div>
          </section>
        </swiper-slide>
      </swiper>
    </div>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import { swiper, swiperSlide } from '@/compat/swiper'
import 'swiper/swiper-bundle.css'

import {
  getFollowers,
  toFollowers
} from '@/api/gameCenter'

export default {
  name: 'HorizontalList',
  components: {
    GameDownloadButton,
    swiper,
    swiperSlide
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png'),
      thirdLocal: '',
      curBigCrad: 0,
      isFollower: false,
      swiperOption: {
        direction: 'horizontal',
        slidesPerView: 1.13,
        slidesPerGroup: 1,
        spaceBetween: 20,
        centeredSlides: true,
        touchRatio: 1, // 触摸灵敏度
        longSwipes: true, // 允许长距离滑动
        longSwipesRatio: 0.5, // 超过50%才切换，否则回弹
        longSwipesMs: 300,
        on: {
          slideChange: function() {
            if (this.realIndex === 0) {
              this.setTranslate(20)
            }
          },
          init: function() {
            if (this.realIndex === 0) {
              this.setTranslate(20)
            }
          }
        }
      }
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  mounted() {
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      this.gameReport()
    }
  },
  activated() {
    const isFirstIn = sessionStorage.getItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
    if (!isFirstIn) {
      sessionStorage.setItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
      this.gameReport()
    }
    this.getFollowers()
  },
  deactivated() {
    sessionStorage.removeItem(`HORIZONTAL_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  },
  watch: {
    curBigCrad: {
      immediate: true,
      handler: function() {
        this.$nextTick(() => {
          this.getFollowers()
        })
      }
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
      const _rankSoftList = {
        fillType: -1,
        name: '',
        id: '',
        data: []
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankSoftList.fillType = _data.fillType
        _rankSoftList.name = _data.name
        _rankSoftList.id = _data.id
      }

      // fillType: 1:纯游戏 2：运营位
      if (_rankSoftList.fillType === 1) {
        _rankSoftList.data = _data.rankingListSofts.map((item, index) => {
          // 固定宽度设置，适配 Swiper 的 auto 模式
          const baseWidth = 280
          if (index === this.curBigCrad) {
            item.width = baseWidth * 2 + 10
          } else {
            item.width = baseWidth
          }

          return item
        }).slice(0, 9)
      }

      return _rankSoftList
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
          plateName: this.rankSoftList.name || '',
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      }
    },
    softId() {
      return this.rankSoftList.data[this.curBigCrad].softId
    }
  },

  methods: {

    curBigCradIn(index) {
      clearTimeout(this.timer)

      this.timer = setTimeout(() => {
        this.curBigCrad = index
      }, 150)
    },
    toList(rankID, rankName) {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeHomeCdkMoreClick', 'click', {
        detail: JSON.stringify({
          local: 1,
          plateName: rankName,
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$router.push({
        name: 'GameCenterList',
        query: {
          source_pp: 'PAD2',
          source_p: 'PAD2',
          rankID,
          rankName,
          secondLocal: this.secondLocal
        }})
    },
    toDetail(item) {
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_p: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankSoftList.name,
          plateName: this.rankSoftList.name
        }
      })
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
          skuName: item.softName || '',
          softID: item.softId || '',
          gameVersion: item.productInfo.gamePkgType || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : ''
        })
      })

      this.$fhPay({
        channel: `${this.firstLocal}_${this.secondLocal}_${this.thirdLocal || 0}_2`,
        type: 0,
        skuId: item.skuId,
        price: item.productInfo.currentPrice,
        plateName: this.rankSoftList.name,
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
    async getFollowers() {
      this.isFollower = false
      if (!this.userInfo) {
        return
      }

      this.isFollower = await getFollowers({
        softId: this.softId
      })
    },
    toFollowers() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.toFollowersReport()

      toFollowers(this.softId, this.isFollower).then(res => {
        this.isFollower = res.data
        if (this.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.softId) {
              o.softDesc.followerCount++
            }

            return o
          })
        } else {
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.softId && o.softDesc.followerCount > 0) {
              o.softDesc.followerCount--
            }

            return o
          })

          this.confirmReport(2)
        }
      }).catch((err) => {
        if (err && typeof err.type === 'number') {
          this.confirmReport(1)
        }
        // nothing
      })
    },
    toFollowersReport() {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.softId).softName || ''
      }

      let _stateGame = 1
      let _statePage = 1

      if (this.rankSoftList.data.find(item => item.softId === this.softId).softPurpose === 2) {
        const _downloadInfo = this.rankSoftList.data.find(item => item.softId === this.softId).downloadInfo || null
        if (_downloadInfo) {
          if ([1, 2].includes(_downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
            _stateGame = 2
          } else if (_downloadInfo.bizType === 4) {
            _stateGame = 3
          }

          if ([1, 2].includes(_downloadInfo.bizType)) {
            if (_downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
              _statePage = 2
            } else if (_downloadInfo.userReservationStatus === 1) {
              _statePage = 3
            }
          } else if (_downloadInfo.bizType === 4) {
            if (_downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
              _statePage = 4
            } else {
              if (_downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                _statePage = 5
              } else if ([1].includes(_downloadInfo.userTestApplyStatus)) {
                _statePage = 6
              } else if ([2].includes(_downloadInfo.userTestApplyStatus)) {
                _statePage = 1
              }
            }
          }
        }
      } else {
        _stateGame = 4
        _statePage = 7
      }

      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', {
        details: JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
          secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
          thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
          type: 2,
          plateName: this.moduleData.rankingLists[0].name,
          skuName: _skuName,
          softID: this.softId,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.isFollower ? 2 : 1
        })
      })
    },
    confirmReport(confirmType) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.softId).softName || ''
      }

      let _clickType = confirmType
      const CANCEL_APPOINTMENTS_AND_FOLLOWERS = localStorage.getItem('CANCEL_APPOINTMENTS_AND_FOLLOWERS')
      if (confirmType === 2 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 3
      } else if (confirmType === 1 && CANCEL_APPOINTMENTS_AND_FOLLOWERS) {
        _clickType = 4
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_unfollowConcernGamePopupClick', 'click', {
        detail: JSON.stringify({
          skuName: _skuName,
          softID: this.softID,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    gameReport() {
      let _rankingListSofts = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 1) {
        _moduleName = this.moduleData.rankingLists[0].name

        if (this.moduleData.rankingLists[0].rankingListSofts.length) {
          _rankingListSofts = this.moduleData.rankingLists[0].rankingListSofts.map(o => {
            let _bizType = 1
            if ([1, 2].includes(o.downloadInfo.bizType)) { // 0-普通(默认)、1-有包预约、2-无包预约、4-测试
              _bizType = 2
            } else if (o.downloadInfo.bizType === 4) {
              _bizType = 3
            }

            let buttonType = 1// 1. 立即安装 2. 立即预约 3. 已预约 4. 敬请期待 5. 申请测试 6. 已申请测试),
            if ([1, 2].includes(o.downloadInfo.bizType)) {
              if (o.downloadInfo.userReservationStatus === 0) { // 0-未预约1-已预约
                buttonType = 2
              } else if (o.downloadInfo.userReservationStatus === 1) {
                buttonType = 3
              }
            } else if (o.downloadInfo.bizType === 4) {
              if (o.downloadInfo.testActivityStatus === 0) { // 0-未开启1-已开启
                buttonType = 4
              } else {
                if (o.downloadInfo.userTestApplyStatus === 0) { // 0-未申请1-已申请2-申请通过
                  buttonType = 5
                } else if ([1].includes(o.downloadInfo.userTestApplyStatus)) {
                  buttonType = 6
                } else if ([2].includes(o.downloadInfo.userTestApplyStatus)) {
                  buttonType = 1
                }
              }
            }

            const _name_cdk = `${o.softName}_${o.softId}`
            const _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}`
            const _softPurpose = o.softPurpose

            return {
              name_cdk: _name_cdk,
              name_download: _name_download,
              softPurpose: _softPurpose
            }
          })
        }
      }

      const _cdk = _rankingListSofts.slice(0, 5).filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
      const _download = _rankingListSofts.slice(0, 5).filter(o => o.softPurpose === 2).map(o => o.name_download).join(',')

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
    }
  }
}

</script>

<style scoped lang="scss">
.HorizontalList {
  margin: 0 auto;
  box-sizing: content-box;
  padding: 24px 0px 0 0px;
  max-width: 1760px;
  .title-wrap {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 17px 20px 30px 20px;
    .title-bac {
      position: absolute;
      top: 0px;
      left: 0px;
    }
    .more {
      font-weight: 400;
      font-size: 14px;
      opacity: 0.6;
      z-index: 9;
      cursor: pointer;
      margin-top: 10px;
      &:hover {
        color: #386EFE;
        opacity: 1;
      }
    }
  }
   .scroll-wrap {
    .swiper-container {
      width: 100%;
      overflow: visible;
      .swiper-wrapper {
        display: flex;
        .swiper-slide {
          flex-shrink: 0;
          width: 362px;
          position: relative;
          transition: all .3s;
           section.bigCard {
            position: relative;
            display: block;
            > b {
              display: block;
                        width: 390px;
            height: 292px;
              max-height: 464px;
              background-repeat: no-repeat;
              background-size: cover;
              background-position: center;
              cursor: pointer;
              position: relative;
              &::after {
                position: absolute;
                left: 0;
                top: 0;
                content: '';
                width: 100%;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0) 38%, rgb(0 0 0 / 93%) 85%);
              }
              &::before {
                position: absolute;
                left: 50%;
                top: 0;
                content: '';
                width: 196px;
                height: 14px;
                z-index: 1;
                background: url('@/images/gamecenter/big-log.png') no-repeat;
                background-size: 100% 100%;
                transform: translateX(-50%);
              }
              > img {
                width: 70px;
                height: 70px;
                object-fit: cover;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
              }
              > sub.cover-top {
                position: absolute;
                left: 0;
                top: 0;
                content: '';
                width: 100%;
                height: 100%;
                position: absolute;
                left: 0;
                top: 0;
                background: linear-gradient(180deg, rgba(0, 0, 0, 0.60) 0%, rgba(0, 0, 0, 0.12) 21.23%);
              }
              > sub.horn-right {
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
              > sub.horn-left {
                position: absolute;
                left: 0;
                bottom: 0;
                width: 15px;
                height: 15px;
                background: url('@/images/gamecenter/horn-left.png') no-repeat;
                background-size: 100% 100%;
                background-position: center center;
                z-index: 2;
              }
              > sub.bor-top {
                position: absolute;
                left: 0;
                top: 0;
                width: 99%;
                z-index: 1;
                border: 0.5px solid;
                border-image-source: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1));
                border-image-slice: 1;
              }
              > sub.bor-right {
                position: absolute;
                right: 0;
                top: 10;
                height: 100%;
                border: 0.5px solid;
                border-image-source: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2));
                border-image-slice: 1;
                z-index: 1;
              }
              > sub.bor-bottom {
                position: absolute;
                right: 1px;
                bottom: 0;
                width: 100%;
                border: 0.5px solid;
                border-image-source: linear-gradient(to left, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border-image-slice: 1;
                z-index: 1;
              }
              > sub.bor-left {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                z-index: 1;
                border: 0.5px solid;
                border-image-source: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, .1));
                border-image-slice: 1;
              }
              > sub.bor-dot0 {
                position: absolute;
                right: -1px;
                top: 18px;
                width: 1px;
                height: 2px;
                background: rgb(32 31 31);
                z-index: 10;
              }
              > sub.bor-dot1 {
                position: absolute;
                left: 13px;
                bottom: 0;
                width: 2px;
                height: 1px;
                background: rgb(32 31 31);
                z-index: 10;
              }
              > sub.bor-dot2 {
                position: absolute;
                left: 0;
                bottom: 14px;
                width: 1px;
                height: 1px;
                background: rgb(32 31 31);
                z-index: 10;
              }
              > div.hover_content {
                width: calc(100% - 32px);
                height: auto;
                z-index: 2;
                opacity: 1;
                position: absolute;
                left: 20px;
                right: 20px;
                bottom: 17px;
                > div.tagType {
                  display: flex;
                  align-items: center;
                  > span {
                    width: auto;
                    height: 24px;
                    display: inline-block;
                    margin-right: 8px;
                    position: relative;
                    vertical-align: middle;
                    position: relative;
                    > img {
                      width: 100%;
                      height: 100%;
                    }
                  }
                  > p {
                    color: #000;
                    font-size: 12px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: 12px;
                    background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.04%);
                    opacity: 0.7;
                    margin-right: 8px;
                    padding: 6px;
                    > i:nth-child(1){
                      font-weight: 700;
                      margin-right: 5px;
                    }
                    > i:nth-child(2){
                      font-weight: 400;
                    }
                  }
                }
                > ol {
                  display: flex;
                  li {
                    margin-top: 16px;
                    text-shadow: 0px 140.506px 112.405px rgba(255, 255, 255, 0.00), 0px 31.384px 25.107px rgba(255, 255, 255, 0.00), 0px 9.344px 7.475px rgba(255, 255, 255, 0.00);
                    font-size: 12px;
                    font-style: normal;
                    font-weight: 400;
                    line-height: 13px;
                    text-transform: capitalize;
                    background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-right: 7px;
                    padding: 5px 9px;
                    border: 1px solid rgba(234, 247, 255, .6);
                  }
                }
                > p {
                  margin-top: 12px;
                  font-size: 12px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 22px;
                  opacity: 0.8;
                  background: linear-gradient(90deg, #EAF7FF 0%, #8C9499 100%);
                  background-clip: text;
                  -webkit-background-clip: text;
                  -webkit-text-fill-color: transparent;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  display: -webkit-box;
                  -webkit-line-clamp: 1;
                  -webkit-box-orient: vertical;
                }
              }
              > div.concern {
                position: absolute;
                right: 1px;
                top: 1px;
                width: max-content;
                min-width: 119px;
                height: 34px;
                display: flex;
                align-items: center;
                justify-content: end;
                padding-right: 15px;
                box-sizing: border-box;
                z-index: 2;
                cursor: pointer;
                max-width: 130px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                > img{
                  width: 20px;
                  height: 20px;
                  margin-right: 2px;
                  z-index: 1;
                }
                > p {
                  color: #EAF7FF;
                  font-size: 12px;
                  font-style: normal;
                  font-weight: 700;
                  z-index: 1;
                }
                &::after {
                  position: absolute;
                  left: 0;
                  top: 0;
                  content: '';
                  width: 100%;
                  height: 100%;
                  background: url('@/images/gamecenter/game-center-mask.png') no-repeat;
                  background-size: cover;
                  background-position: top center;
                  z-index: 0;
                }
              }
            }
            > div.bottom_big {
              width: 100%;
              margin-top: 13px;
              position: relative;
              > div.left {
                width: calc(100% - 120px);
                > h1 {
                  width: calc(100% - 24px);
                  font-size: 16px;
                  font-weight: 700;
                  color: #EAF7FF;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                > p.cdk {
                  margin-top: 5px;
                  display: flex;
                  align-items: center;
                  overflow: hidden;
                  > span.discount {
                    background-color: #F24A44;
                    font-size: 14px;
                    color: #EAF7FF;
                    font-weight: bold;
                    line-height: 1;
                    box-sizing: content-box;
                    padding: 4px 6px;
                    margin-right: 8px;
                    white-space: nowrap;
                  }
                  > span.currentPrice {
                    font-size: 14px;
                    color: #EAF7FF;
                    font-weight: bold;
                    margin-right: 6px;
                    padding-bottom: 1px;
                  }
                  > span.originalPrice {
                    font-size: 12px;
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
                > p.download {
                  margin-top: 8px;
                  color: rgba(234, 247, 255, 0.6);
                  font-size: 12px;
                  font-style: normal;
                  font-weight: 400;
                  line-height: 12px;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  i {
                    color: rgba(234, 247, 255, 0.4);
                    padding: 0 4px;
                    box-sizing: border-box;
                  }
                }
              }
              > div.right {
                width: 130px;
                position: absolute;
                right: 0;
                top: 0;
                > div.buyButton, :deep(.buyButton) {
                  width: 130px;
                  height: 38px;
                  line-height: 38px;
                  font-size: 12px;
                  &.common-abnomal-btn {
                    background-size: contain;
                  }
                  i.text {
                    display: block;
                    width: 114px;
                    line-height: 38px;
                   }
                 }
                > div.downloadButton {
                  width: 130px;
                  height: 38px;
                  :deep(span) {
                    width: 130px;
                    height: 38px;
                    line-height: 37px;
                    background-size: contain;
                    > i.text {
                      font-size: 12px;
                    }
                  }

                  :deep(.text) {
                    width: 114px;
                    font-size: 12px;
                  }
                  :deep(.abnormal-shape-btn), :deep(.common-abnomal-btn) {
                    width: 130px;
                    height: 38px;
                    line-height: 36px;
                    svg {
                      width: 121px;
                      height: 32px;
                      top: 3px;
                      left: 0px;
                    }
                    .text {
                      line-height: 39px;
                    }
                    span {
                      line-height: 39px;
                    }
                  }
                }
              }
            }
          }
          > section.smallCard{
            width: 100%;
            height: 100%;
            position: relative;
            > b {
              display: block;
              width: 100%;
              height: 26.887vw;
              max-height: 464px;
              background-repeat: no-repeat;
              background-size: cover;
              background-position: center;
              position: relative;
              cursor: pointer;
              > img {
                width: 50px;
                height: 50px;
                object-fit: cover;
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
              }
              > sub.horn-right {
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
              > sub.horn-left {
                position: absolute;
                left: -1px;
                bottom: 0;
                width: 15px;
                height: 15px;
                background: url('@/images/gamecenter/horn-left.png') no-repeat;
                background-size: 100% 100%;
                background-position: center center;
                z-index: 2;
              }
              > sub.bor-top {
                position: absolute;
                left: 0;
                top: 0;
                width: 99%;
                z-index: 1;
                border: 0.5px solid;
                border-image-source: linear-gradient(to right, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1));
                border-image-slice: 1;
              }
              > sub.bor-right {
                position: absolute;
                right: 0;
                top: 0;
                height: 100%;
                border: 0.5px solid;
                border-image-source: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, .2));
                border-image-slice: 1;
                z-index: 1;
              }
              > sub.bor-bottom {
                position: absolute;
                right: 1px;
                bottom: 0;
                width: 100%;
                border: 0.5px solid;
                border-image-source: linear-gradient(to left, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
                border-image-slice: 1;
                z-index: 1;
              }
              > sub.bor-left {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                z-index: 1;
                border: 0.5px solid;
                border-image-source: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, .1));
                border-image-slice: 1;
              }
              > sub.bor-dot0 {
                position: absolute;
                right: -1px;
                top: 18px;
                width: 1px;
                height: 2px;
                background: rgb(32 31 31);
                z-index: 10;
              }
              > sub.bor-dot2 {
                position: absolute;
                left: 0;
                bottom: 13px;
                width: 1px;
                height: 1px;
                background: rgba(0, 0, 0, .5);
                z-index: 10;
              }
            }
            > div.bottom_small {
              width: 100%;
              margin-top: 13px;
              > h1 {
                width: 100%;
                font-size: 15px;
                font-weight: 700;
                color: #EAF7FF;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              > p.cdk {
                margin-top: 5px;
                display: flex;
                align-items: center;
                overflow: hidden;
                position: relative;
                > span.discount {
                  background-color: #F24A44;
                  font-size: 14px;
                  color: #EAF7FF;
                  font-weight: bold;
                  line-height: 1;
                  box-sizing: content-box;
                  padding: 4px 6px;
                  margin-right: 8px;
                }
                > span.currentPrice {
                  font-size: 14px;
                  color: #EAF7FF;
                  font-weight: bold;
                  margin-right: 6px;
                  padding-bottom: 1px;
                }
                > span.originalPrice {
                  font-size: 12px;
                  color: rgba(234, 247, 255, 0.6);
                  text-decoration: line-through;
                  margin-right: 8px;
                }
                > span.platform {
                  width: 14px;
                  height: 14px;
                  font-size: 14px;
                  color: rgba(234, 247, 255, 0.4);
                }
              }
              > p.download {
                margin-top: 8px;
                color: rgba(234, 247, 255, 0.6);
                font-size: 12px;
                font-style: normal;
                font-weight: 400;
                line-height: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }
          }
          // &.isHover {
          //   > section.bigCard {
          //     display: block;
          //     > b {
          //       &::before {
          //         animation: fadeInLogo .3s forwards;
          //       }
          //       > div.hover_content {
          //         animation: moveUp .15s forwards ease-out .2s;
          //       }
          //     }
          //   }
          // }
        }
      }
    }
  }
  .scroll-wrap {
    overflow-x: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
// @media screen and (max-width: 800px) {
//   div.HorizontalList {
//     padding: 6vw 0px 0 30px;
//     // > ul > li:nth-child(4) {
//     //   display: none;
//     // }
//     > ul > li > section.bigCard > b , > ul > li > section.smallCard > b {
//       height: 36.5vw;
//     }
//   }
// }
// @media screen and (min-width: 1110px) {
//   div.HorizontalList > ul > li > section.bigCard > b::after{
//     background: linear-gradient(180deg, rgba(0, 0, 0, 0) 52%, rgb(0 0 0 / 93%) 85%);
//   }
// }
// @media screen and (min-width: 1061px) {
//   // div.HorizontalList > ul > li:nth-child(1) > section::after {
//   //   display: none;
//   // }
//   // div.HorizontalList > ul > li:nth-child(4) > section::after {
//   //   display: none;
//   // }
// }
// @media screen and (min-width: 1495px) {
//   // div.HorizontalList > ul > li:nth-child(5) {
//   //   display: block;
//   // }
// }

// @keyframes moveUp {
//   0% {
//     transform: translateY(20%);
//     opacity: 0;
//   }
//   50% {
//     opacity: 0.2;
//   }
//   100% {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }
// @keyframes fadeInLogo {
//   from {
//     opacity: 0;
//    }
//   to {
//     opacity: 1;
//    }
// }

// .PadDevice {

//   @media screen and (max-width: 800px) {
//       div.HorizontalList h3.title-wrap {
//         padding: 17px 0 2.5vw 0;
//     }
//   }
// }
</style>
