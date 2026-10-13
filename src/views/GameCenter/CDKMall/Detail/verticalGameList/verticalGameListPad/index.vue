<template>
  <div
    class="VerticalGameList"
    v-if="list.length"
    v-exposure="{
      handler: () => onExposure(),
      delay: 1000,
      options: { threshold: 0.5 },
      once: true
    }">
    <h1 class="title">相关游戏</h1>
    <div class="list-container">
      <div v-for="(item, index) in list" :key="index" class="list-item" @click.stop="goGameDetail(item)">
        <div class="img-game">
          <img :src="item.showInfo.logoFile" >
        </div>
        <div class="text-item">
          <div class="text-title">{{ item.softName }}</div>
          <div v-if="item.showType === 'activity'" class="acvite-class" @click.stop="goActivity(item)">
            <img src="../../../../ReserveZone//HorizontalList/star-icon.png" class="icon1" />
            <div class="yellow-text">{{ item.nextTitle }}</div>
            <img src="../../../../ReserveZone//HorizontalList/next-icon.png" class="icon1" />
          </div>
          <div v-else class="text-desc">
            <template v-if="item.showInfo.playersNum">{{ item.showInfo.playersNum }}人在玩</template>
            <template v-else-if="item.showType === 'reservationGame'">{{ item.num }}人预约</template>
            <template v-else>{{ item.num }}</template>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import { getRecommendGameList } from '@/api/cdkMall'
export default {
  name: 'VerticalGameList',
  props: {
    detail: {
      type: Object,
      default: null
    },
    _stateGame: {
      type: Number,
      default: null
    },
    _statePage: {
      type: Number,
      default: null
    },
    _gameClass: {
      type: Number,
      default: null
    },
    toTop: {
      type: Function,
      default() {
        return () => {}
      }
    }
  },
  data() {
    return {
      list: [
      ],
      defaultImg: resolveAsset('images/gamecenter/searchDefault.png'),
      userInfo: {}
    }
  },
  mounted() {
    this.userInfo = this.$store.state.user.userInfo
    this.getGameList()
  },
  methods: {
    onExposure() {
      let moduleCon = this.list.map(item => `${item.softName}_${item.softId}`) || []
      moduleCon = moduleCon.join(',')
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailRelatedGamesShow',
        'pv',
        {
          detail: JSON.stringify({
            skuName: this.detail.softName || '',
            softID: this.detail.softId || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            stateGame: this._stateGame,
            statePage: this._statePage,
            gameClass: this._gameClass,
            moduleCon
          })
        }
      )
    },
    goActivity(item) {
      const RItem = item?.relateActivitys[0] || []
      const id = RItem.jumpUrl
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailRelatedGamesClick',
        'click',
        {
          detail: JSON.stringify({
            skuName: this.detail.softName || '',
            softID: this.detail.softId || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            stateGame: this._stateGame,
            statePage: this._statePage,
            gameClass: this._gameClass,
            clickType: '活动标签',
            name: `${item.softName}_${item.softId}_${item.nextTitle}`
          })
        }
      )
      this.$router.push({
        path: `/gameCenter/online/index`,
        query: {
          ...this.$route.query,
          id,
          source_p: 'PAD1'
        }
      })
    },
    goGameDetail(item) {
      const id = item.softId

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailRelatedGamesClick',
        'click',
        {
          detail: JSON.stringify({
            skuName: this.detail.softName || '',
            softID: this.detail.softId || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            stateGame: this._stateGame,
            statePage: this._statePage,
            gameClass: this._gameClass,
            clickType: '游戏',
            name: `${item.softName}_${item.softId}_${item.nextTitle}`
          })
        }
      )
      this.toTop()

      this.$router.push({
        path: `/gamecenter/detail/${id}`,
        query: {
          ...this.$route.query,
          source_p: 'PAD1',
          reportPlateName: '相关游戏',
          secondLocal: 18
        }
      })
    },
    getImgUrl(item) {
      if (item?.showInfo?.himg) {
        return item.showInfo.himg
      } else if (item?.softDesc?.captureFileList[0]) {
        return item?.softDesc?.captureFileList[0]
      } else {
        return this.defaultImg
      }
    },
    async getGameList() {
      const res = await getRecommendGameList({ softId: this.detail.softId }) || []

      const gameList = res.map(item => {
        const newItem = {
          showType: null,
          nextTitle: '',
          relateActivitys: [],
          ...item
        }

        newItem.name = item.softName

        if (item?.relateActivitys?.length) {
          newItem.showType = 'activity'
          newItem.relateActivitys = item.relateActivitys
          newItem.nextTitle = item?.relateActivitys[0]?.title
        } else if (item.downloadInfo) {
          if ([1, 2].includes(item.downloadInfo.bizType)) {
            newItem.showType = 'reservationGame'
            newItem.num = item.downloadInfo.reservationCount
          } else {
            newItem.showType = 'normalGame'
            newItem.num = item.downloadInfo.downloadCount || ''
          }
        }

        newItem.bannerImgUrl = this.getImgUrl(item)

        return newItem
      })

      this.list = gameList
      console.log(222222222222, gameList)
    }

  },
  beforeUnmount() {
  }
}
</script>

<style lang="scss" scoped>

.VerticalGameList {
    position: relative;
    padding: 24px 0 6vw;
    margin-left: 30px;// 3.75vw;
    background: none;
    &::-webkit-scrollbar {
      display: none;
    }

    h1 {
      color: #EAF7FF;
      font-family: "Microsoft YaHei";
      font-size: 16px;
      margin-bottom: 20px;
    }
    .list-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow-x: scroll;
        display: flex;
        align-items: center;

        .list-item {
          width: 260px;
          height: 11vw;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          color: #EAF7FF;
          .text-item  {
            width: 56%;
              .text-title {
                font-size: 15px;
                font-weight: 700;
              }
          .text-desc {
            font-size: 12px;
            opacity: 0.6;
            margin-top: 8px;

          }

      }
      .icon1 {
        width: 12px;
        height: 12px;
      }
      .yellow-text {
        color: #FFE2B6;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .acvite-class {
        display: flex;
        align-items: center;
        letter-spacing: 1px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-top: 6px;
        cursor: pointer;

      }

      .img-game {
        width: 11vw;
        height: 11vw;
        border-radius: 12px;
        margin-right: 16px;
        position: relative;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }

        &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 12px;
        padding: 0.5px;
        background: linear-gradient(to bottom, rgb(255, 255, 255), rgba(255, 255, 255, 0.2));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        }

      }
    }
    //     .list-item {
    //       display: flex;
    //       width: 300px;
    //       height: 165px;
    //       flex-shrink: 0;
    //       .img-game {
    //         width: 88px;
    //         height: 88px;
    //         border-radius: 16px;
    //         margin-right: 16px;
    //       }
    //       .text-title {
    //         color: #EAF7FF;
    //         font-family: "Microsoft YaHei";
    //         font-size: 16px;
    //       }
    // }
  }
}

.PhoneDevice {
  .VerticalGameList {
    padding:0;
    margin-left: 0;// 3.75vw;
    .list-container {
      &::-webkit-scrollbar {
        display: none;
      }
    }
    .list-container .list-item {
      height: 60px;
       .img-game {
      width: 60px;
      height: 60px;
    }
    }
  }
}
</style>
