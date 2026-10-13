<template>
  <div class="mini-game-three">
    <h2 class="section-title">
      {{ moduleName }}
    </h2>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && (!gameList || gameList.length === 0)" class="empty-container">
      <div class="empty-icon"></div>
      <span class="empty-text">暂无精选游戏</span>
    </div>

    <!-- 游戏列表 -->
    <div v-else class="game-grid">
      <div
        v-for="(game, index) in gameList"
        :key="game.softId"
        class="game-card"
        tabindex="0"
        role="button"
        :aria-label="game.softName + '，点击打开'"
        @mouseenter="handleMouseEnter(game, index)"
        @mouseover="showVideo(game.softId, game)"
        @mouseleave="hideVideo"
        @click="clickMiniGame(game, index)"
        @keydown.enter.prevent.stop="clickMiniGame(game, index)"
        @keydown.space.prevent.stop="clickMiniGame(game, index)"
        v-exposure:multiple="{
          events: [
            {
              handler: () => onExposure(game, 1, index),
              options: { threshold: 0.5 },
              delay: 1000
            },
            {
              handler: () => onExposure(game,0, index)
            }
          ]
        }"
      >
        <div class="game-image-container">
          <video
            v-if="game.softDesc.videoUrl && videoFlagId === game.softId"
            :ref="`video-${game.softId}`"
            :src="game.softDesc.videoUrl"
            autoplay
            loop
            muted
            class="video-class"
            playsinline
          ></video>
          <img
            v-else
            :src="game.showInfo.himg || game.softDesc.videoCoverImg"
            :alt="game.softName"
            class="game-image"
          >
          <div class="game-overlay" aria-hidden="true"></div>
          <div class="game-banner-text">{{ game.softDesc.introduction }}</div>
        </div>
        <div class="game-info">
          <div class="game-details">
            <div class="author-info">
              <div class="icon-wrapper">
                <img :src="game.showInfo.logoFile" :alt="game.softName" class="author-avatar">
                <img class="game-type-badge" :src="game.gameType === 2 ? resolveAsset('images/gamecenter/miniGame/foot-mini.svg') : resolveAsset('images/gamecenter/miniGame/foot-apk.svg')" />
              </div>
              <div class="game-content">
                <h3 class="game-name">{{ game.softName }}</h3>
                <div class="game-item-tag">
                  <TagNormal :title="item" v-for="(item,i) in (game.showInfo.softLabels || []).slice(0,2)" :key="i"/>
                </div>
              </div>
              <!-- 小游戏：打开按钮，沿用原有点击逻辑 -->
              <button v-if="Number(game.gameType) === 2" class="game-item-btn common-round-btn">打开</button>
              <!-- APK 游戏：安装状态驱动按钮 -->
              <ApkInstallButton
                v-else
                :game="game"
                :index="index"
                :first-local="firstLocal"
                :rule-code-mapping="ruleCodeMapping"
                :module-name="moduleName"
                :support-apk-flage="supportApkFlage"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

import { reportMinigameExpose, reportMinigameOpen } from '@/utils/dataReport'
import { openMiniGameAndPin, parentExposeMiniGame } from '@/utils/miniGame'
import TagNormal from '@/components/TagNormal'
import ApkInstallButton from '@/components/ApkInstallButton'

export default {
  name: 'MiniGameThree',
  components: {
    TagNormal,
    ApkInstallButton
  },
  props: {
    moduleName: {
      type: String,
      default: ''
    },
    rankingLists: {
      type: Array,
      default: () => []
    },
    firstLocal: {
      type: [String, Number],
      required: true
    },
    miniGameDeviceInfo: {
      type: Object,
      default: () => ({})
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
      loading: false,
      exposedGames: new Set(),
      videoFlagId: -1,
      videoTimer: null
    }
  },
  beforeUnmount() {
    // 组件销毁时清理视频资源和定时器
    this.cleanupVideo()
  },
  computed: {
    // 从rankingLists中提取miniGames数组
    gameList() {
      if (!this.rankingLists || this.rankingLists.length === 0 || !this.rankingLists[0].miniGames) {
        return []
      }
      return this.rankingLists[0].miniGames
    }
  },
  mounted() {
    this.reportExposure()
  },
  watch: {
    gameList: {
      handler() {
        this.reportExposure()
      },
      deep: true
    }
  },
  methods: {
    async clickMiniGame(item, index) {
      if (Number(item.gameType) !== 2) return
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
    },
    onExposure(item, exposureType, childIndex) {
      parentExposeMiniGame(item, childIndex, exposureType, this.ruleCodeMapping || '')
      reportMinigameExpose(item, childIndex, exposureType, {
        moduleName: this.moduleName,
        firstLocal: this.firstLocal,
        secondLocal: 14
      })
    },
    // 报告曝光
    reportExposure() {
      if (!this.gameList || this.gameList.length === 0) return

      this.gameList.forEach((game, index) => {
        if (!this.exposedGames.has(game.softId)) {
          reportMinigameExpose(game, index, 1, {
            moduleName: '精选小游戏',
            firstLocal: this.firstLocal,
            secondLocal: 1 // 精选
          })
          this.exposedGames.add(game.softId)
        }
      })
    },

    // 处理鼠标悬停
    handleMouseEnter(game, index) {
      // 这里可以添加鼠标悬停的视觉反馈
    },

    // 显示视频
    showVideo(softId, game) {
      this.videoFlagId = softId
      // 清除之前的定时器
      if (this.videoTimer) {
        clearTimeout(this.videoTimer)
      }
      // 延迟一小段时间再设置，避免快速移动鼠标时频繁切换
      this.videoTimer = setTimeout(() => {
        this.videoFlagId = softId
        const videoElement = this.$refs[`video-${softId}`]
        if (videoElement && videoElement[0]) {
          try {
            videoElement[0].play()
          } catch (error) {
            console.warn('视频播放失败:', error)
          }
        }
      }, 100)
    },

    // 隐藏视频
    hideVideo() {
      this.cleanupVideo()

      // 延迟一小段时间再隐藏，避免快速移动鼠标时频繁切换
      this.videoTimer = setTimeout(() => {
        this.videoFlagId = -1
      }, 100)
    },

    // 清理视频资源
    cleanupVideo() {
      if (this.videoTimer) {
        clearTimeout(this.videoTimer)
        this.videoTimer = null
      }

      // 释放当前播放的视频资源
      if (this.videoFlagId !== -1) {
        const videoElement = this.$refs[`video-${this.videoFlagId}`]
        if (videoElement && videoElement[0]) {
          try {
            videoElement[0].pause()
            videoElement[0].currentTime = 0
            videoElement[0].src = '' // 清空src释放资源
            videoElement[0].load() // 重新加载空资源以彻底释放
          } catch (error) {
            console.warn('清理视频资源时出错:', error)
          }
        }
      }
    },

    // 处理游戏点击
    handleGameClick(game, index) {
      // 上报点击事件
      reportMinigameOpen({
        firstLocal: this.firstLocal,
        secondLocal: 1,
        plateName: '精选小游戏',
        skuName: game.softName,
        softID: game.softId,
        softType: game.softDesc?.isAd ? '广告' : '非广告',
        type: 2,
        position: index + 1
      })

      // 打开游戏
      openMiniGameAndPin(game, this.miniGameDeviceInfo)
    }
  }
}
</script>

<style lang="scss" scoped>
.mini-game-three {
  margin-bottom: 40px;
  width: 100%;
  .game-item-tag {
    display: flex;
    align-items: center;
    gap:4px;
    margin-bottom: 8px;
  }
  .section-title {
    color: #eaf7ff;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .game-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1360px;
    margin: 0 auto;

    .game-card {
      cursor: pointer;
      background: linear-gradient(180deg, rgba(31, 38, 57, 0.6) 0%, rgba(22, 27, 43, 0.6) 100%);
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.3s ease;
      .game-image-container {
        position: relative;
        padding-top: 56.25%; /* 16:9 宽高比 */
        overflow: hidden;

        .game-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .video-class {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .game-image-container:hover .game-image,
        .game-image-container:hover .video-class {
          transform: scale(1.05);
        }

        .game-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 50%);
        }

        .game-banner-text {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px 16px;
          font-size: 12px;
          color: #fff;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%);
          z-index: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

      }

      .game-info {
        padding: 16px;
        background-color: #14161a;
      }

      .game-details {
        .author-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .author-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .icon-wrapper {
          position: relative;
          display: inline-block;
          flex-shrink: 0;
          margin-right: 12px;

          .author-avatar {
            margin-right: 0;
          }

          .game-type-badge {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 16px;
            height: 16px;
          }
        }

        .game-content {
          flex: 1;
          min-width: 0;
          margin-right: 12px;
        }

        .game-name {
          color: #eaf7ff;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      // 确保按钮在空间不足时不会被挤到下一行
      @media screen and (max-width: 768px) {
        .game-details {
          .author-info {
            flex-wrap: nowrap;
          }

          .open-btn {
            padding: 6px 16px;
            font-size: 13px;
          }
        }
      }
    }
  }

  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: rgba(234, 247, 255, 0.6);

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(234, 247, 255, 0.1);
      border-top-color: #386EFE;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    .empty-icon {
      width: 60px;
      height: 60px;
      // background-image: url('@/images/gamecenter/empty-icon.png');
      background-repeat: no-repeat;
      background-size: contain;
      background-position: center;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .loading-text,
    .empty-text {
      font-size: 14px;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media screen and (max-width: 1200px) {
  .featured-mini-game {
    .game-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
  }
}

@media screen and (max-width: 768px) {
  .featured-mini-game {
    .game-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .section-title {
      font-size: 16px;
      margin-bottom: 16px;
    }
  }
}

.mini-game-three .game-card:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
  border-radius: 12px;
}

@media (forced-colors: active) {
  .mini-game-three .game-card:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
