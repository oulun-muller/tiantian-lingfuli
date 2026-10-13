<template>
  <div
    v-if="list.length"
    class="VideoList"
    v-exposure="{
      handler: () => onExposure(),
      delay: 1000,
      options: { threshold: 1 },
      once: true
    }"
  >
    <h1 class="video-header-title">精彩视频</h1>
    <div
      v-if="isAASmallerThanBB"
      class="left-arrow"
      tabindex="0"
      role="button"
      aria-label="向左滚动"
      @click.stop="scrollList('left')"
      @keydown.enter.prevent.stop="scrollList('left')"
      @keydown.space.prevent.stop="scrollList('left')"></div>
    <div
      v-if="isAASmallerThanBB"
      class="right-arrow"
      tabindex="0"
      role="button"
      aria-label="向右滚动"
      @click.stop="scrollList('right')"
      @keydown.enter.prevent.stop="scrollList('right')"
      @keydown.space.prevent.stop="scrollList('right')"></div>
    <div class="videoList-container" ref="container" >
      <div class="video-list" ref="list">
        <template v-for="(item, index) in list" :key="index">
          <div
            class="video-item"

            tabindex="0"
            role="button"
            :aria-label="item.name + '，点击查看视频'"
            @mouseenter="curBigCradIn(true,index)"
            @click.stop="toDetail(item)"
            @mouseleave="curBigCradIn(false,index)"
            @keydown.enter.prevent.stop="toDetail(item)"
            @keydown.space.prevent.stop="toDetail(item)">
            <video
              class="img-class"
              :src="item.videoUrl"
              muted
              loop
              :poster="item.coverUrl"
              :ref="'videoPlayer' + index"></video>
            <div class="text-item">{{ item.name }}</div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script>
import { getPostIdList, getPostDetail } from '@/api/cdkMall'
export default {
  name: 'VideoList',
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
      activeIndex: -1,
      userInfo: {},
      resizeObserver: null,
      isAASmallerThanBB: true
    }
  },
  computed: {
  },
  async mounted() {
    this.userInfo = this.$store.state.user.userInfo
    await this.fetchAllPostDetails()
    this.$nextTick(() => {
      this.initResizeObserver()
    })
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    scrollList(type) {
      if (type === 'left') {
        this.$refs.container.scrollBy({
          left: -200,
          behavior: 'smooth'
        })
      }
      if (type === 'right') {
        this.$refs.container.scrollBy({
          left: 200,
          behavior: 'smooth'
        })
      }
    },
    initResizeObserver() {
      const aaElement = this.$refs.container
      const bbElement = this.$refs.list
      if (!aaElement || !bbElement) {
        return
      }

      this.resizeObserver = new ResizeObserver(() => {
        this.checkElementSizes()
      })

      this.resizeObserver.observe(aaElement)
    },
    checkElementSizes() {
      const aaElement = this.$refs.container
      const bbElement = this.$refs.list

      if (!aaElement || !bbElement) return

      const aaWidth = aaElement.offsetWidth
      const bbWidth = bbElement.offsetWidth
      this.isAASmallerThanBB = aaWidth <= bbWidth
      return this.isAASmallerThanBB
    },
    onExposure() {
      let moduleCon = this.list.map(item => item.name) || []
      moduleCon = moduleCon.join(',')
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailWonderfulVideoShow',
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
    toDetail(item) {
      this.$dataReport(
        'LZ_gamingCenter',
        'LZ_storeDetailWonderfulVideoClick',
        'click',
        {
          detail: JSON.stringify({
            skuName: this.detail.softName || '',
            softID: this.detail.softId || '',
            lenovoid: this.userInfo ? this.userInfo.UserID : '',
            stateGame: this._stateGame,
            statePage: this._statePage,
            gameClass: this._gameClass,
            moduleName: item.name
          })
        }
      )
      this.$router.push({
        path: `/forum/micro/detail/${item.id}`,
        query: {
          ...this.$route.query,
          forumSource: 2
        }
      })
    },
    curBigCradIn(type, index) {
      const video = this.$refs['videoPlayer' + index][0]
      if (video) {
        if (type) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      }
      this.activeIndex = index
    },
    async  fetchAllPostDetails() {
      try {
        const res1 = await getPostIdList({ softId: this.detail.softId })

        if (!Array.isArray(res1) || res1.length === 0) {
          return []
        }
        const detailPromises = res1.map(async(item) => {
          try {
            const detail = await getPostDetail(item.id)

            let videoUrl = ''
            const listItem = detail?.attachList?.find(item => item.attachType === 2) || null
            if (listItem) {
              videoUrl = listItem.url
            }

            return {
              ...detail,
              id: item.id,
              name: item.name,
              coverUrl: detail.article.cover,
              videoUrl

            }
          } catch (error) {
            return null // 标记为失败
          }
        })

        const allDetails = await Promise.all(detailPromises)
        const successfulDetails = allDetails.filter(detail => detail !== null && detail.videoUrl)
        this.list = successfulDetails

        return successfulDetails
      } catch (error) {
        console.error('获取帖子数据过程中出错:', error)
        throw error
      }
    }

  }
}
</script>

<style lang="scss" scoped>
.VideoList {
  width: 100%;
  position: relative;
  color: #EAF7FF;

  &:hover {
    .left-arrow,
  .right-arrow {
    display: block;
  }
  }

  .videoList-container {
      width: 100%;
    overflow-x: auto;
    position: relative;
    z-index: 1;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    scroll-behavior: smooth;
    &::-webkit-scrollbar {
      display: none;
    }

  }
  .video-header-title {
    height: 21px;
    margin: 40px 0px 16px;
  }

  .left-arrow,
  .right-arrow {
    position: absolute;
    height: 36px;
    width: 36px;
    transform: translate(0%, -50%);
    background-repeat: no-repeat;
    background-size: cover;
    cursor: pointer;
    z-index: 2;
    display: none;
  }

  .left-arrow {
    top: 83px;
    left: 8px;
    background-image: url("../image/list-arrow-left.png");
  }

  .right-arrow {
    top: 83px;
    right: 8px;
    background-image: url("../image/list-arrow-right.png");
  }

  .video-list {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: 16px;
    align-items: center;
    height: 150px;

    .video-item {
      width: 163px;
      height: 100%;
      flex-shrink: 0;

      .img-class {
        width: 100%;
        height: 92px;
        object-fit: cover;
        vertical-align: bottom
      }

      .text-item {
        margin-top: 10px;
        font-size: 14px;
        letter-spacing: 1px;
      }

    }
  }

}

.PhoneDevice {
  .video-header-title {
    margin: 32px 0px 16px;
    font-size: 16px;
    height: 24px;
  }
  .VideoList {
     .video-list {
      .video-item {
        width: 200px;
        .img-class {
          height: 113px;
          object-fit: cover;
          vertical-align: bottom
        }
        .text-item {
          font-size: 15px;
        }
      }
    }
  }
}

.VideoList .video-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.VideoList .left-arrow:focus-visible,
.VideoList .right-arrow:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .VideoList .video-item:focus-visible,
  .VideoList .left-arrow:focus-visible,
  .VideoList .right-arrow:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
