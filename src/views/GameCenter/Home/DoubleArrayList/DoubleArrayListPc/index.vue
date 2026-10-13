<template><div
  :class="['DoubleArrayList', 'PcDevice1']"
  v-if="rankSoftList.data.length">
  <h3 class="title-wrap">
    <span class="title-bac gc-text-stroke-around">{{ moduleEname }}</span>
    <span class="gc-title-text">{{ rankSoftList.name }}</span>
    <span
      class="more"
      tabindex="0"
      role="button"
      aria-label="查看更多游戏"
      @click="toList(rankSoftList.id,rankSoftList.name)"
      @keydown.enter.prevent.stop="toList(rankSoftList.id,rankSoftList.name)"
      @keydown.space.prevent.stop="toList(rankSoftList.id,rankSoftList.name)"
      v-if="rankSoftList.showMore">更多</span>
  </h3>
  <ul
    ref="stage"
    role="listbox"
    :aria-label="rankSoftList.name"
    @keydown="onGridKeydown"
    v-exposure="{
      handler: ()=>onExposure(),
      delay: 1000,
      options: { threshold: 0.5 },
      once: true
    }"
  >
    <li
      v-for="(item, index) of rankSoftList.data"
      :key="item.softId + index"
      :ref="'gameDouble'+item.softId"
      :tabindex="index === focusedIndex ? 0 : -1"
      role="option"
      :aria-selected="index === focusedIndex"
      :aria-label="item.softName + '，点击查看详情'"
      @focus="handleCardFocus(item, index)"
      @click="toDetail(item)"
      @keydown.enter.prevent.stop="toDetail(item)"
      @keydown.space.prevent.stop="toDetail(item)"
      @mouseenter=" handleCurrentVideo(item)"
      @mouseleave="(currentVideo = -1)">
      <!-- {{item.isAiGame}} -->
      <b
        :style="{ backgroundImage: `url('${ handleCurImg(item) }')` }">
        <sub class="bor-top"></sub>
        <sub class="bor-right"></sub>
        <sub class="bor-bottom"></sub>
        <sub class="bor-left"></sub>
        <img
          v-if="currentVideo !== item.softId && !item.showInfo.himg && item.showInfo.logoFile"
          :src="item.showInfo.logoFile"
          alt="">
        <div class="hover_content">
          <div
            class="concern"
            :tabindex="(currentVideo === item.softId || focusedIndex === index) ? 0 : -1"
            role="button"
            :aria-label="isFollower ? '取消关注' : '关注'"
            @click.stop="toFollowers(item)"
            @keydown.enter.prevent.stop="toFollowers(item)"
            @keydown.space.prevent.stop="toFollowers(item)"
            v-if="![1,2].includes(item.downloadInfo.bizType)" >
            <img v-if="isFollower" src="../image/concern-active.png" aria-hidden="true" alt="">
            <img v-else src="../image/concern-normal.png" aria-hidden="true" alt="">
            <p aria-hidden="true">{{ item.softDesc.followerCount }}</p>
          </div>
          <ol>
            <span v-if="item.downloadInfo.tagUrls.length">
              <img
                :src="item.downloadInfo.tagUrls[0]"
                aria-hidden="true"
                alt="">
            </span>
            <template v-if="item.showInfo.softLabels && item.showInfo.softLabels.length && item.downloadInfo.tagUrls.length">
              <li
                v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0,2)"
                :key="tagIndex">{{ tagItem }}</li>
            </template>
            <template v-if="item.showInfo.softLabels && item.showInfo.softLabels.length && !item.downloadInfo.tagUrls.length">
              <li
                v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0,3)"
                :key="tagIndex">{{ tagItem }}</li>
            </template>
          </ol>
        </div>
        <video
          v-if="
            currentVideo === item.softId &&
              item.softDesc &&
              item.softDesc.mediaList[0] &&
              item.softDesc.mediaList[0].type === 'video'"
          :src="item.softDesc.mediaList[0].url"
          :poster="item.showInfo.himg || defaultImg"
          muted
          autoplay
          loop>
        </video>
      </b>
      <div class="bottom">
        <div class="bottom-title">
          <div class="title">{{ item.softName }}</div>
          <template v-if="item.downloadInfo.tagUrls.length">
            <img
              class="tag-img"
              :src="item.downloadInfo.tagUrls[0]"
              aria-hidden="true"
              alt="">
          </template>
        </div>
        <div class="bottom-content">
          <template v-if="item.relateActivitys.length || (item.showInfo.rankingLabelInfos.length)">
            <TagRank v-if="item.showInfo.rankingLabelInfos.length" style="margin-right: 8px;" :rank-list="item.showInfo.rankingLabelInfos" :show-shadow="false"/>
            <template v-if="item.relateActivitys.length">
              <TagActivity
                :class="{ 'tag-has-rank': item.showInfo.rankingLabelInfos.length }"
                :title="item.relateActivitys[0].title"
                :plate-name="rankSoftList.name"
                :show-shadow="false"
                :game-item="item"/>
            </template>
          </template>
          <template v-else-if="item.softDesc.introduction">
            <span class="desc">{{ item.softDesc.introduction }}</span>
          </template>
          <template v-else-if="item.showInfo.softLabels.length">
            <TagNormal
              style="margin-right: 4px;"
              v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0, 4)"
              :key="tagIndex"
              :title="tagItem"/>
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
          <div>
            <div v-if="item.softPurpose === 3 && !item.productInfo.userPurchasedStatus" class="buy-information">
              <div class="discount-class">{{ item.productInfo.discount || 0 }}</div>
              <div class="current-price-class">¥{{ item.productInfo.currentPrice || 0 }}</div>
              <div class="orgin-price-class">¥{{ item.productInfo.originalPrice || 0 }}</div>
            </div>
            <template class="people-num">
              <div class="people-num" v-if="item.downloadInfo.bizType === 0 && item.showInfo.playersNum">{{ gamePeopleFilter( item.showInfo.playersNum ) }}人玩过</div>
              <div class="people-num" v-else-if="[1, 2].includes(item.downloadInfo.bizType) && item.downloadInfo.reservationCount">{{ gamePeopleFilter( item.downloadInfo.reservationCount ) }}人已预约</div>
            </template>
          </div>
        </div>
      </div></li>
  </ul>
</div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import GameDownloadButton from '@/components/GameDownloadButton'
import TagNormal from '@/components/TagNormal'
import TagActivity from '@/components/TagNormal/TagActivity'
import TagRank from '@/components/TagNormal/TagRank'
import { getGameMsgDataReport } from '@/utils/dataReport'

import {
  getFollowers,
  toFollowers
} from '@/api/gameCenter'
export default {
  name: 'DoubleArrayList',
  components: {
    GameDownloadButton,
    TagNormal,
    TagActivity,
    TagRank
  },
  data() {
    return {
      defaultImg: resolveAsset('images/gamecenter/hdefault.png'),
      thirdLocal: '',
      currentVideo: -1,
      currentVideo2: -1,
      isFollower: false,
      aiGameList: [],
      focusedIndex: 0
    }
  },
  props: {
    moduleData: {
      type: Object,
      default: null
    }
  },
  async mounted() {
    const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || {}
    const mouduleId = _data.id
    const aiGame = await this.$store.dispatch('aiGameRecommend/requestModuleData', { moduleId: mouduleId })
    this.aiGameList = [...aiGame]
  },
  // mounted() {
  //   const isFirstIn = sessionStorage.getItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  //   if (!isFirstIn) {
  //     sessionStorage.setItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
  //     // this.gameReport()
  //   }
  // },
  // activated() {
  //   const isFirstIn = sessionStorage.getItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  //   if (!isFirstIn) {
  //     sessionStorage.setItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`, 1)
  //     // this.gameReport()
  //   }
  // },
  // deactivated() {
  //   sessionStorage.removeItem(`DOUBLE_ARRAY_LIST_IS_FIRST_IN_${this.rankSoftList.id}`)
  // },
  watch: {
    currentVideo: {
      handler: function(value) {
        this.$nextTick(async() => {
          if (value !== -1) {
            this.isFollower = false

            if (!this.userInfo) {
              return
            }

            this.isFollower = await getFollowers({
              softId: value
            })
          }
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
    fillingStrategyKey() {
      return this.$store.state.aiGameRecommend.moduleGameConfigs?.fillingStrategyKey || 'no'
    },
    rankSoftList() {
      const aiGame = this.aiGameList
      const _rankSoftList = {
        fillType: -1,
        name: '',
        id: '',
        data: [],
        showMore: false
      }

      const _data = this.moduleData.rankingLists && this.moduleData.rankingLists[0] || null

      if (_data) {
        _rankSoftList.fillType = _data.fillType
        _rankSoftList.name = _data.name
        _rankSoftList.id = _data.id
      }

      // fillType: 1:纯游戏 2：运营位
      if (_rankSoftList.fillType === 1) {
        let combinedList = [..._data.rankingListSofts]
        if (aiGame?.length) {
          combinedList = [...aiGame, ...combinedList]
          if (aiGame.length > 0) {
            const uniqueMap = new Map()
            combinedList = combinedList.filter(item => {
              if (!uniqueMap.has(item.softId)) {
                uniqueMap.set(item.softId, true)
                return true
              }
              return false
            })
          }
        }
        _rankSoftList.data = [...combinedList.slice(0, 8)]

        _rankSoftList.showMore = _data.rankingListSofts.length > 6
      }

      return { ..._rankSoftList }
    },
    drinfo() {
      return (item) => {
        return JSON.stringify({
          source_p: this.$route.query.source_p || '',
          source: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.rankSoftList.name,
          skuName: item.softName || '',
          softID: item.softId || '',
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          aiStrategy: item?.isAiGame ? this.fillingStrategyKey : 'no'
        })
      }
    }
  },
  methods: {
    // 网格键盘事件
    onGridKeydown(e) {
      const COLS = 3
      const total = this.rankSoftList.data.length
      if (total === 0) return
      let next = this.focusedIndex
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next = (this.focusedIndex + 1) % total
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        next = (this.focusedIndex - 1 + total) % total
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        next = Math.min(this.focusedIndex + COLS, total - 1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        next = Math.max(this.focusedIndex - COLS, 0)
      } else {
        return
      }
      this.focusedIndex = next
      this.$nextTick(() => {
        const el = this.$refs['gameDouble' + this.rankSoftList.data[next].softId]
        const target = Array.isArray(el) ? el[0] : el
        if (target) target.focus()
      })
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
      this.currentVideo = -1
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId },
        query: {
          source_p: 'PAD2',
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          reportPlateName: this.rankSoftList.name,
          plateName: this.rankSoftList.name,
          aiStrategy: item?.isAiGame ? this.fillingStrategyKey : 'no'
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
    toFollowers(item) {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.toFollowersReport(item)

      toFollowers(this.currentVideo, this.isFollower).then(res => {
        this.isFollower = res.data
        if (this.isFollower) {
          this.$message({
            message: '关注成功！',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.currentVideo2) {
              o.softDesc.followerCount++
            }

            return o
          })
        } else {
          this.rankSoftList.data = this.rankSoftList.data.map(o => {
            if (o.softId === this.currentVideo2 && o.softDesc.followerCount > 0) {
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
    toFollowersReport(htmlItem) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.currentVideo2).softName || ''
      }

      let _stateGame = 1
      let _statePage = 1
      if (this.rankSoftList.data.find(item => item.softId === this.currentVideo2).softPurpose === 2) {
        const _downloadInfo = this.rankSoftList.data.find(item => item.softId === this.currentVideo2).downloadInfo || null
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
          firstLocal: this.firstLocal,
          secondLocal: this.secondLocal,
          thirdLocal: this.thirdLocal,
          type: 2,
          plateName: this.moduleData.rankingLists[0].name,
          skuName: _skuName,
          softID: this.currentVideo2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          stateGame: _stateGame,
          statePage: _statePage,
          clicktype: this.isFollower ? 2 : 1,
          aiStrategy: htmlItem?.isAiGame ? this.fillingStrategyKey : 'no'
        })
      })
    },
    confirmReport(confirmType) {
      let _skuName = ''
      if (this.rankSoftList.data && this.rankSoftList.data.length) {
        _skuName = this.rankSoftList.data.find(item => item.softId === this.currentVideo2).softName || ''
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
          softID: this.currentVideo2,
          lenovoid: this.userInfo ? this.userInfo.UserID : '',
          unfollow: 1
        }),
        clickType: _clickType
      })
    },
    handleCurrentVideo(item) {
      this.currentVideo = item.softId

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.currentVideo2 = item.softId
      }, 200)
    },
    handleCardFocus(item, index) {
      this.focusedIndex = index
      this.currentVideo = item.softId
      this.currentVideo2 = item.softId
    },
    onExposure() {
      this.gameReport()
    },
    gameReport() {
      let _rankingListSofts = []
      let _moduleName = ''
      if (this.moduleData.rankingLists && this.moduleData.rankingLists[0] && this.moduleData.rankingLists[0].fillType === 1) {
        _moduleName = this.moduleData.rankingLists[0].name

        // ai推荐游戏和模块游戏合并

        if (this.moduleData.rankingLists[0].rankingListSofts.length) {
          _rankingListSofts = this.rankSoftList.data.map(o => {
            const report = getGameMsgDataReport(o)
            const _bizType = report.stateGame
            const buttonType = report.statePage

            const fillingStrategyKey = o.isAiGame ? this.fillingStrategyKey : 'no'

            const _name_cdk = `${o.softName}_${o.softId}`
            const _name_download = `${o.softName}_${o.softId}_${_bizType}_${buttonType}_${fillingStrategyKey}`
            const _softPurpose = o.softPurpose

            return {
              name_cdk: _name_cdk,
              name_download: _name_download,
              softPurpose: _softPurpose
            }
          }).slice(0, 8)
        }
      }

      const _cdk = _rankingListSofts.filter(o => o.softPurpose === 1).map(o => o.name_cdk).join(',')
      const _download = _rankingListSofts.map(o => o.name_download).join(',')

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
            firstLocal: this.firstLocal,
            secondLocal: this.secondLocal,
            thirdLocal: this.thirdLocal,
            plateName: _moduleName,
            nameAndIDVersion: _download,
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            aiStrategy: _rankingListSofts.length ? _rankingListSofts[0].fillingStrategyKey : 'no'
          })
        })
      }
    },
    handleCurImg(item) {
      if (this.currentVideo === item.softId &&
        item.softDesc &&
        item.softDesc.mediaList[0] &&
        item.softDesc.mediaList[0].type === 'video'
      ) {
        return item.softDesc.mediaList[0].url
      }

      if (this.currentVideo === item.softId &&
        item.softDesc &&
        item.softDesc.mediaList[0] &&
        item.softDesc.mediaList[0].type === 'image'
      ) {
        return item.softDesc.mediaList[0].url
      }

      if (item.showInfo.himg) {
        return item.showInfo.himg
      }

      return this.defaultImg
    }
  }
}

</script>

<style lang="scss" src="./index.scss" scoped>

</style>
