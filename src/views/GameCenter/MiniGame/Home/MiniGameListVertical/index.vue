<template>
  <section v-if="rankingLists.length" class="game-list-container1">
    <div
      v-for="(rankItem, rankIndex) in rankingLists"
      :key="rankIndex"
    >
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
          @mouseover="showVideo(miniGameIndex,miniGameItem)"
          @mouseleave="hideVideo"
          @click="clickMiniGame(miniGameItem,rankItem,miniGameIndex)"
          @keydown.enter.prevent.stop="clickMiniGame(miniGameItem,rankItem,miniGameIndex)"
          @keydown.space.prevent.stop="clickMiniGame(miniGameItem,rankItem,miniGameIndex)"
          v-exposure:multiple="{
            events: [
              {
                handler: () => onExposure(miniGameItem, 1,rankItem,miniGameIndex),
                options: { threshold: 0.5 },
                delay: 1000
              },
              {
                handler: () => onExposure(miniGameItem,0,rankItem,miniGameIndex)
              }
            ]
          }"
        >
          <video
            v-if="videoFlagIndex === miniGameIndex"
            ref="videoRef"
            class="video-class"
            :src="miniGameItem.softDesc.videoUrl"
            autoplay
            loop
            muted
          ></video>
          <img v-else class="background-img" :src="miniGameItem.showInfo.vimg || miniGameItem.softDesc.videoCoverImg" alt="" referrerPolicy="no-referrer"/>
          <div class="game-info-container">
            <div class="game-item-tag">
              <TagNormal :title="item" v-for="(item,index) in miniGameItem.showInfo.softLabels.slice(0,2)" :key="index"/>
            </div>
            <div class="game-item-info-description">{{ miniGameItem.softDesc.detailInfo }}</div>
            <div class="game-item-info">
              <div class="icon-wrapper">
                <img class="icon" :src="miniGameItem.showInfo.logoFile" />
                <img class="game-type-badge" :src="miniGameItem.gameType === 2 ? resolveAsset('images/gamecenter/miniGame/foot-mini.svg') : resolveAsset('images/gamecenter/miniGame/foot-apk.svg')" />
              </div>
              <div class="game-item-info-title" :style="{ margin: '0 8px'}">
                {{ miniGameItem.softName }}
              </div>
              <div class="game-item-btn common-round-btn">
                打开
              </div>
            </div>
            <!-- <div>{{ miniGameItem.softDesc.isAd ? '广告' : '非广告' }}</div> -->
          </div>
        </div>
        <div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

/**
 * @description: 微信小游戏三种游戏列表竖图坂
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
      default: null
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
      videoFlagIndex: -1,
      userInfo: this.$store.state.user.userInfo || {}
    }
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
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
        this.$refs.videoRef[0].src = ''
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

.game-list-container1 {

    .game-info-container {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: auto;
        padding: 0 12px 14px;
        z-index: 1;
        .game-item-tag {
          display: flex;
          align-items: center;
          gap:4px;
          margin-bottom: 8px;
        }
        .game-item-info-description {
          color: #999;
          font-size: 12px;
          line-height: 14px;
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
          margin-bottom: 8px;
        }
    }
    .game-item-info {
        width: 100%;
        height: auto;
        display: flex;
        align-items: center;
        z-index: 1;

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
            font-weight: 400;
            opacity: 0.7;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .icon {
            width: 24px;
              height: 24px;
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
    }

.game-list {
        width: 100%;
        height: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 10px;
      //  gap: 20px;

        .game-list-item {
            width: 100%;
            position: relative;
            // flex: 0 0 calc(20% - 10px);
            aspect-ratio: 104/185;
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            &:not(:first-child) {
              margin-left: 20px;
            }

            > img {
                width: 100%;
                height: 100%;
                object-fit: cover;
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
                    linear-gradient(0deg, #000 12%, rgba(0, 0, 0, 0) 26.02%), rgba(255, 255, 255, 0.01);
            }
        }
    }
}

.game-title {
    color: #eaf7ff;
    font-size: 18px;
    font-weight: 700;
    line-height: 20px;
    margin-bottom: 24px;
}

.game-list-container1 .game-list-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 10px;
}

@media (forced-colors: active) {
  .game-list-container1 .game-list-item:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
