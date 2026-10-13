<template>
  <section v-if="rankingLists.length" class="game-list-container3">
    <div v-for="(rankItem, rankIndex) in rankingLists" :key="rankIndex" class="list-item">
      <div class="game-title">
        {{ rankItem.name }}
      </div>
      <div :class="`game-list game-list-background-${rankIndex}`">
        <div
          class="game-list-item"
          v-for="(miniGameItem, miniGameIndex) in rankItem.miniGames"
          :key="miniGameIndex"
          tabindex="0"
          role="button"
          :aria-label="miniGameItem.softName + '，点击打开'"
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
          }"
          @click="clickMiniGame(miniGameItem, rankItem, miniGameIndex)"
          @keydown.enter.prevent.stop="clickMiniGame(miniGameItem, rankItem, miniGameIndex)"
          @keydown.space.prevent.stop="clickMiniGame(miniGameItem, rankItem, miniGameIndex)">
          <div class="list-item-flex">
            <div :class="`top-icon${miniGameIndex}`" aria-hidden="true"></div>
            <div class="icon-wrapper">
              <img class="font-icon" :src="miniGameItem.showInfo.logoFile" :alt="miniGameItem.softName" />
              <img class="game-type-badge" :src="miniGameItem.gameType === 2 ? resolveAsset('images/gamecenter/miniGame/foot-mini.svg') : resolveAsset('images/gamecenter/miniGame/foot-apk.svg')" />
            </div>
            <div class="game-item-info">
              <div class="title">{{ miniGameItem.softName }}</div>
              <div class="description">{{ miniGameItem.softDesc.introduction }}</div>
            </div>
          </div>
          <!-- 悬浮态 -->
          <div class="game-list-item-hover">
            <div class="list-item-flex">
              <div class="icon-wrapper">
                <img class="font-icon" :src="miniGameItem.showInfo.logoFile" />
                <img class="game-type-badge" :src="miniGameItem.gameType === 2 ? resolveAsset('images/gamecenter/miniGame/foot-mini.svg') : resolveAsset('images/gamecenter/miniGame/foot-apk.svg')" />
              </div>
              <div class="game-item-info">
                <div class="title">{{ miniGameItem.softName }}</div>
                <div class="game-item-tag">
                  <TagNormal
                    :title="item"
                    v-for="(item, index) in miniGameItem.showInfo.softLabels.slice(0, 3)"
                    :key="index" />
                </div>
              </div>
              <!-- 小游戏：打开按钮，沿用原有点击逻辑 -->
              <div v-if="miniGameItem.gameType === 2" class="game-item-btn common-round-btn">打开</div>
              <!-- APK 游戏：安装状态驱动按钮 -->
              <ApkInstallButton
                v-else
                :game="miniGameItem"
                :index="miniGameIndex"
                :first-local="firstLocal"
                :rule-code-mapping="ruleCodeMapping"
                :module-name="moduleName"
                :support-apk-flage="supportApkFlage"
              />
            </div>
            <div class="description">{{ miniGameItem.softDesc.introduction }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

/**
 * @description: 微信小游戏三种游戏列表其中多榜单版
 * @author: xiao'you
 * @date: 2020-07-01
 */
import { reportMinigameOpen, reportMinigameExpose } from '@/utils/dataReport'
import { parentExposeMiniGame, openMiniGameAndPin } from '@/utils/miniGame'
import TagNormal from '@/components/TagNormal'
import ApkInstallButton from '@/components/ApkInstallButton'
export default {
  name: '',
  components: {
    TagNormal,
    ApkInstallButton
  },
  props: {
    moduleName: {
      type: String,
      default: ''
    },
    firstLocal: {
      type: String,
      default: ''
    },
    rankingLists: {
      type: Array,
      default: () => {
        return []
      }
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
    },
    ruleCodeMapping: {
      type: String,
      default: ''
    },
    supportApkFlage: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      videoFlagIndex: -1
    }
  },
  computed: {
  },
  watch: {},
  created() { },
  mounted() { },
  methods: {
    onExposure(item, exposureType, rankItem, childIndex) {
      parentExposeMiniGame(item, childIndex, exposureType, this.ruleCodeMapping || '')
      reportMinigameExpose(item, childIndex, exposureType, {
        moduleName: this.moduleName,
        firstLocal: this.firstLocal,
        secondLocal: 14
      })
    },
    async clickMiniGame(item, rankItem, index) {
      if (Number(item.gameType) !== 2) {
        return
      }
      const userInfo = this.$store.state.user?.userInfo || null

      reportMinigameOpen({
        firstLocal: this.firstLocal,
        secondLocal: 14,
        plateName: this.moduleName,
        skuName: item.softName,
        softID: item.softId,
        softType: item?.softDesc?.isAd ? '广告' : '非广告',
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

.game-list-container3 {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  margin-bottom: 40px;
  box-sizing: border-box;

  .list-item {
    flex: 1 0; // 3 列布局，减去 gap 影响
    min-width: 0;
  }

  .game-item-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
  }

  .game-list {
    padding: 12px 6px 14px;
    border-radius: 12px;

    .game-list-item {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 76px;
      padding: 12px 12px;
      cursor: pointer;
      position: relative;

      &:nth-child(2) {
        .game-list-item-hover {
          top: -8px;
        }
      }

      &:nth-child(3) {
        .game-list-item-hover {
          top:0;
          bottom: -12px;
        }
      }

      .game-list-item-hover {
        display: none;
        width: 110%;
        min-height: 76px;
        //  padding: 14px  18px 12px;
        padding: 11px 18px;
        position: absolute;
        z-index: 3;
        top: -12px;
        left: -5%;
        backdrop-filter: blur(20px);
        // background-color: rgba(255, 255, 255, 0.03);
        // background: rgba(61, 61, 61, 0.82);
        // box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.20);
        background: linear-gradient(0deg, rgba(217, 217, 217, 0.15) 0%, rgba(217, 217, 217, 0.15) 100%), rgba(77, 77, 77, 0.50);
        background-blend-mode: normal, color-dodge;
        box-shadow: 0 2px 20px 0 rgba(0, 0, 0, 0.20);
        border-radius: 8px;
        .title {
          font-size: 16px;
        }

        .description {
          margin-top: 8px;
          color: #FFF;
          font-size: 12px;
          font-weight: 400;
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .font-icon {
          height: 40px;
          width: 40px;
          margin: 0 8px 0px 0px;
        }

        .game-item-btn {
          height: 26px;
          width: 58px;
        }
        .list-item-flex {
          margin-right: 0px;
        }
      }

      .icon-wrapper {
        position: relative;
        display: inline-block;
        flex-shrink: 0;

        .game-type-badge {
          position: absolute;
          bottom: 0;
          right: 12px;
          width: 16px;
          height: 16px
        }
      }

      .font-icon {
        height: 54px;
        width: 54px;
        border-radius: 50%;
      }

      &:hover {

        // background-color: rgba(0, 0, 0, 0.4);
        // border-radius: 10px;
        //   padding: 30px;
        //   position: relative;
        .game-list-item-hover {
          display: block;
        }

      }

      .list-item-flex {
        flex: 1;
        min-width: 0;
        margin-right: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .font-icon {
        margin: 0 12px 0px 10px;
      }

      .game-item-info {
        flex: 1;
        min-width: 0;
        position: relative;
        display: inline-block;
        overflow: hidden;

        .title {
          color: #eaf7ff;
          font-size: 14px;
          font-weight: 700;
          line-height: 18px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .description {
          margin-top: 4px;
          color: #eaf7ff;
          font-size: 12px;
          font-weight: 400;
          line-height: 16x;
          opacity: 0.7;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }

  .game-list-background-0 {
    background: radial-gradient(118.27% 101.83% at 52.83% -1.83%,
        rgba(108, 193, 250, 0.2) 0%,
        rgba(0, 0, 0, 0) 100%),
      linear-gradient(0deg, #1c1c1e 0%, #1c1c1e 100%), linear-gradient(0deg, #14151a 0%, #14151a 100%),
      rgba(255, 255, 255, 0.5);
  }

  .game-list-background-1 {
    background: radial-gradient(118.27% 101.83% at 52.83% -1.83%,
        rgba(108, 111, 250, 0.2) 0%,
        rgba(0, 0, 0, 0) 100%),
      linear-gradient(0deg, #1c1c1e 0%, #1c1c1e 100%), linear-gradient(0deg, #14151a 0%, #14151a 100%),
      rgba(255, 255, 255, 0.5);
  }

  .game-list-background-2 {
    background: radial-gradient(118.27% 101.83% at 52.83% -1.83%,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(234, 247, 255, 0) 100%),
      linear-gradient(0deg, #1c1c1e 0%, #1c1c1e 100%), linear-gradient(0deg, #14151a 0%, #14151a 100%),
      rgba(255, 255, 255, 0.5);
  }
}

.game-list-container3 .game-list-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 10px;
}

@media (forced-colors: active) {
  .game-list-container3 .game-list-item:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
