<template>
  <div
    class="ActivityNotice"
    v-if="activeList.length"
    v-exposure="{
      handler: () => onExposure(),
      delay: 1000,
      options: { threshold: 0.5 },
      once: true
    }">
    <template v-for="(item, index) in activeList" :key="index">
      <div
        v-if="item.bannerImgUrl && index === 0"
        class="item-banner"
       
        tabindex="0"
        role="button"
        :aria-label="(item.type === 1 ? '活动' : '公告') + '，' + (item.longTitle || '点击查看详情')"
        @click="clickJumpUrl(item)"
        @keydown.enter.prevent.stop="clickJumpUrl(item)"
        @keydown.space.prevent.stop="clickJumpUrl(item)">
        <img class="banner-class" :src="item.bannerImgUrl" :alt="item.longTitle || (item.type === 1 ? '活动' : '公告')" />
        <div
          v-if="item.type === 1"
          class="active-icon"
          aria-hidden="true"></div>
        <div
          v-else
          class="notice-icon"
          aria-hidden="true"></div>
      </div>
      <div
        v-else
        class="item-title"
        :key="index + ''"
        tabindex="0"
        role="button"
        :aria-label="(item.type === 1 ? '活动' : '公告') + '：' + item.longTitle"
        @click="clickJumpUrl(item)"
        @keydown.enter.prevent.stop="clickJumpUrl(item)"
        @keydown.space.prevent.stop="clickJumpUrl(item)">
        <img
          v-if="item.type === 1"
          class="title-icon"
          src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/19/5942ddc1-d796-4e23-bc15-56c16ccd1668.png"
          aria-hidden="true" />
        <img
          v-else
          class="title-icon"
          src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/19/9d9ccd7d-7e2b-4d22-897e-e986c020bac6.png"
          aria-hidden="true" />
        <div class="active-title">{{ item.longTitle }}</div>
        <div class="arrow-left" aria-hidden="true"></div>
      </div>
    </template>

  </div>
</template>

<script>
import { getActivityOrNoticeList } from '@/api/cdkMall'
export default {
  name: 'ActivityNotice',
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
    }
  },
  data() {
    return {
      list: [],
      userInfo: {}
    }
  },
  computed: {
    activeList() {
      const aListObj = this.list.find(item => item.bannerImgUrl) || null
      const tList = this.list.filter(item => item.longTitle && aListObj !== item)

      if (aListObj) {
        return [aListObj, ...tList].slice(0, 3)
      }
      return tList.slice(0, 3)
    }
  },
  mounted() {
    this.userInfo = this.$store.state.user.userInfo

    this.getActivityOrNoticeList()
  },
  methods: {
    onExposure() {
      let moduleCon = this.activeList.map(item => {
        const typeTitle = item.type === 1 ? '活动' : '公告'

        if (item.longTitle) {
          return `${typeTitle}_${item.longTitle}`
        }
        if (item.bannerImgUrl) {
          return `${typeTitle}_${item.bannerImgUrl}`
        }
        return ''
      }) || []
      moduleCon = moduleCon.join(',')

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailEventsAnnounceShow',
        'pv',
        {
          detail: JSON.stringify(
            {
              skuName: this.detail.softName || '',
              softID: this.detail.softId || '',
              lenovoid: this.userInfo ? this.userInfo.UserID : '',
              stateGame: this._stateGame,
              statePage: this._statePage,
              gameClass: this._gameClass,
              moduleCon
            }
          )
        }
      )
    },
    clickJumpUrl(item) {
      const { jumpType, type, jumpUrl = '' } = item

      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailEventsAnnounceClick',
        'click',
        {
          detail: JSON.stringify(
            {
              skuName: this.detail.softName || '',
              softID: this.detail.softId || '',
              lenovoid: this.userInfo ? this.userInfo.UserID : '',
              stateGame: this._stateGame,
              statePage: this._statePage,
              gameClass: this._gameClass,
              moduleType: type === 1 ? '活动' : '公告',
              moduleName: item.longTitle || item.bannerImgUrl
            }
          )
        }
      )
      if (Number(jumpType) === 2) {
        this.$router.push({
          path: `/forum/micro/detail/${jumpUrl}`,
          query: {
            ...this.$route.query
          }
        })
      } else if (Number(jumpType) === 1) {
        this.$router.push({
          path: `/gameCenter/online/index`,
          query: {
            ...this.$route.query,
            source_pp: 'PAD1',
            source_p: 'PAD1',
            id: jumpUrl
          }
        })
      }
    },
    async getActivityOrNoticeList() {
      const res = await getActivityOrNoticeList({ softId: this.detail.softId })
      if (res) {
        this.list = res
      }
    }
  },
  beforeUnmount() {
  }
}
</script>

<style lang="scss" scoped>
.ActivityNotice {
  max-width: 100%;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.20);
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 40px;

  .item-title:last-child {
    margin-bottom: 16px;
  }

  .arrow-left {
    display: inline-block;
    height: 16px;
    width: 16px;
    background-image: url('~@/images/icon/left-arrow.svg');
    background-repeat: no-repeat;
    background-size: cover;
    margin-left: auto;
  }

  .item-banner {
    width: 100%;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 70 / 18;

    .active-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 57px;
      height: 20px;
      background-image: url("https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/13/a3092045-b076-424c-8246-8e63a8cb9695.png");
      background-repeat: no-repeat;
      background-size: cover;
    }

    .notice-icon {
      position: absolute;
      top: 0;
      left: 0;
      width: 57px;
      height: 20px;
      background-image: url("https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/19/5d176c6d-84da-472a-bbe3-0f2a00655ca6.png");
      background-repeat: no-repeat;
      background-size: cover;
    }
  }

  .item-title {
    width: 100%;
    margin-top: 16px;
    padding: 0 16px;
    height: 26px;
    display: flex;
    align-items: center;
    cursor: pointer;

    .title-icon {
      height: 16px;
      width: 49px;
      margin-right: 6px;
    }

    .active-title {
      width: 100%;
      color: #EAF7FF;
      line-height: 26px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .banner-class {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;

  }

}

.PhoneDevice {
  .ActivityNotice {
    border: none;
    background-color: transparent;

    .item-title {
      margin-top: 12px;
      padding-left: 0px;
      padding-right: 4px;
    }

    .item-title:last-child {
      margin-bottom: 12px;
    }
  }
}

.ActivityNotice .item-banner:focus-visible,
.ActivityNotice .item-title:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

@media (forced-colors: active) {
  .ActivityNotice .item-banner:focus-visible,
  .ActivityNotice .item-title:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
