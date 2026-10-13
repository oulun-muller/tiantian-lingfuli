<template>
  <section v-if="rankingLists.length" class="game-list-container2">
    <!-- 列表2 -->
    <div v-for="(rankItem, rankIndex) in rankingLists" :key="rankIndex">
      <div class="game-title">
        {{ moduleName }}
      </div>
      <div class="game-list">
        <div
          class="game-list-item"
          v-for="(miniGameItem, miniGameIndex) in rankItem.miniGames"
          :key="miniGameIndex"
          tabindex="0"
          role="button"
          :aria-label="miniGameItem.softName + '，点击打开'"
          @mouseover="showVideo(miniGameIndex, miniGameItem)"
          @mouseleave="hideVideo"
          @click="clickMiniGame(miniGameItem, rankItem, miniGameIndex)"
          @keydown.enter.prevent.stop="clickMiniGame(miniGameItem, rankItem, miniGameIndex)"
          @keydown.space.prevent.stop="clickMiniGame(miniGameItem, rankItem, miniGameIndex)"
          v-exposure:multiple="{
            events: [
              {
                handler: () => onExposure(miniGameItem, 1, rankItem, miniGameIndex),
                options: { threshold: 0.5 },
                delay: 1000
              },
              {
                handler: () => onExposure(miniGameItem, 0, rankItem, miniGameIndex)
              }
            ]
          }">
          <video
            v-if="videoFlagIndex === miniGameIndex"
            ref="videoRef"
            class="video-class"
            :src="miniGameItem.softDesc.videoUrl"
            autoplay
            loop
            muted></video>
          <img
            v-else
            class="background-img"
            :src="miniGameItem.showInfo.himg || miniGameItem.softDesc.videoCoverImg"
            referrerPolicy="no-referrer" />
          <div class="game-info-container" v-if="miniGameIndex < 1">
            <div class="game-item-info">
              <div class="icon-wrapper">
                <img class="icon" :src="miniGameItem.showInfo.logoFile" />
                <img class="game-type-badge" :src="miniGameItem.gameType === 2 ? resolveAsset('images/gamecenter/miniGame/foot-mini.svg') : resolveAsset('images/gamecenter/miniGame/foot-apk.svg')" />
              </div>
              <div class="container-info">
                <div class="game-item-info-title">
                  {{ miniGameItem.softName }}
                </div>
                <div v-if="miniGameIndex < 1" class="game-item-info-description">
                  {{ miniGameItem.softDesc.detailInfo }}
                </div>
              </div>
            </div>
            <div class="game-item-info-first">
              <div class="game-item-tag">
                <TagNormal
                  :title="item"
                  v-for="(item, index) in miniGameItem.showInfo.softLabels.slice(0, 4)"
                  :key="index" />
              </div>
              <div class="game-item-btn common-round-btn">
                打开
              </div>
            </div>
          </div>
          <div class="game-info-container" v-else>
            <div class="game-item-info">
              <div class="icon-wrapper">
                <img class="icon" :src="miniGameItem.showInfo.logoFile" />
                <img class="game-type-badge" :src="miniGameItem.gameType === 2 ? resolveAsset('images/gamecenter/miniGame/foot-mini.svg') : resolveAsset('images/gamecenter/miniGame/foot-apk.svg')" />
              </div>
              <div class="container-info">
                <div class="game-item-info-title">
                  {{ miniGameItem.softName }}
                </div>
              </div>
              <div class="game-item-btn common-round-btn">
                打开
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

/**
 * @description: 微信小游戏游戏列表 1拖4版
 * @author: xiao'you
 * @date: 2020-07-01
 */
import { reportMinigameOpen, reportMinigameExpose } from '@/utils/dataReport'
import { openMiniGameAndPin, parentExposeMiniGame } from '@/utils/miniGame'

import TagNormal from '@/components/TagNormal'
export default {
  name: '',
  components: {
    TagNormal
  },
  props: {
    moduleName: {
      type: String,
      default: ''
    },
    rankingLists: {
      type: Array,
      default: () => {
        return []
      }
    },
    firstLocal: {
      type: String,
      default: ''
    },
    miniGameDeviceInfo: {
      type: Object,
      default: () => {
        return {}
      }
    },
    moduleSort: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      videoFlagIndex: -1
    }
  },
  computed: {},
  watch: {},
  created() { },
  mounted() { },
  methods: {
    showVideo(index, item) {
      if (item?.softDesc?.videoUrl) {
        this.videoFlagIndex = index
      } else {
        this.videoFlagIndex = -1
      }
    },
    onExposure(item, exposureType, rankItem, childIndex) {
      parentExposeMiniGame(item, childIndex, exposureType, this.ruleCodeMapping)
      reportMinigameExpose(item, childIndex, exposureType, {
        moduleName: this.moduleName,
        firstLocal: this.firstLocal,
        secondLocal: 14
      })
    },
    hideVideo() {
      if (this.$refs.videoRef && this.$refs.videoRef[0]) {
        this.$refs.videoRef[0].pause()
        this.$refs.videoRef[0].currentTime = 0
        this.$refs.videoRef[0].src = null
      }
      this.videoFlagIndex = -1
    },
    async clickMiniGame(item, rankItem, index) {
      const userInfo = this.$store.state.user?.userInfo || null

      reportMinigameOpen({
        firstLocal: this.firstLocal,
        secondLocal: 14,
        plateName: this.moduleName,
        skuName: item.softName,
        softID: item.softId,
        softType: item?.softDesc?.isAd ? '广告' : '非广告', // 广告和非广告
        type: 2,
        lenovoid: userInfo ? userInfo?.UserID : '',
        position: index + 1,
        source_id: item.softDesc?.runConfigInfo?.resourcePos,
        alg_rid: item.softDesc?.runConfigInfo?.rid
      })
      openMiniGameAndPin(item, index)
    }
  }
}
</script>

<style scoped lang="scss">
// }
.game-item-btn {
  min-width: 48px;
  margin-left: auto;
}

.video-class,
.background-img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  overflow: hidden;
}

.game-list-container2 {
  .game-info-container {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 0 12px 14px;
    z-index: 1;
    width: 100%;

    .game-item-tag {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .game-item-info {
    width: 100%;
    height: auto;
    display: flex;
  }

  .game-item-info-first {
        width: 100%;
    height: auto;
    display: flex;
    align-items: flex-end;
    margin-top: 4px;

  }

  .container-info {
    margin-left: 10px;
  }

  .icon {
    height: 24px;
    width: 24px;
  }

  .icon-wrapper {
    position: relative;
    display: inline-block;
    flex-shrink: 0;

    .game-type-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
    }
  }

  .game-item-info-title {
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    // 文字超出宽度时，...截断
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .game-item-info-description {
    color: #eaf7ff;
    font-size: 12px;
    font-size: 14px;
    line-height: 14px;
    font-weight: 400;
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 300px;
  }

  .game-list {
    width: 100%;
    height: auto;
    display: grid;
    grid-template-columns: 2.075fr 1fr 1fr; // 3 列：左中右各占 1fr
    grid-template-rows: repeat(2, 1fr); // 2 行：上下等高
    gap: 20px;

    .game-list-item {
      position: relative;
      // height: 100%;
      // width: 100%;
      border-radius: 10px;
      aspect-ratio: 53/29;
      overflow: hidden;
      cursor: pointer;

      &:first-child {
        grid-row: span 2; // 跨 2 行

        .icon {
          height: 50px;
          width: 50px;
        }

        .game-type-badge {
          width: 16px;
          height: 16px;
        }

        aspect-ratio: 55/31;

        .game-item-info-title {
          font-size: 18px;
          margin-bottom: 10px;
        }

        .container-info {
          margin-left: 12px;
        }

        .game-item-btn {
          width: 74px;
          height: 28px;
        }

        // .game-item-info  {

        //   padding: 0 20px 16px 12px;
        // }

      }

      &::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        //backdrop-filter: blur(20px);
        background: linear-gradient(0deg, rgba(65, 72, 86, 0.5) 0%, rgba(65, 72, 86, 0) 55.34%),
          linear-gradient(0deg, #000 8%, rgba(0, 0, 0, 0) 26.02%), rgba(255, 255, 255, 0.01);
      }
    }
  }
}

.top-icon0 {
  width: 27px;
  height: 27px;
  display: inline-block;
  background-image: url('@/images/gamecenter/miniGame/icon1.svg');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
}

.top-icon1 {
  width: 27px;
  height: 27px;
  background-image: url('@/images/gamecenter/miniGame/icon2.svg');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
}

.top-icon2 {
  width: 27px;
  height: 27px;
  background-image: url('@/images/gamecenter/miniGame/icon3.svg');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
}

.game-title {
  color: #eaf7ff;
  font-size: 18px;
  font-weight: 700;
  line-height: 20px;
  margin-bottom: 24px;
}

.game-list-container2 .game-list-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 10px;
}

@media (forced-colors: active) {
  .game-list-container2 .game-list-item:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
