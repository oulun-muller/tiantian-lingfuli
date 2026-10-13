<template>
  <div class="mine-tab">
    <!-- 游戏列表 -->
    <div v-if="gameList.length" class="game-list">
      <article
        v-for="(item, index) in gameList"
        :key="item.pkg_name || index"
        class="game-card"
        v-exposure:multiple="{
          events: [
            {
              handler: () => onExposure(item, index,1),
              options: { threshold: 0.5 },
              delay: 1000
            },
            {
              handler: () => onExposure(item, index,0)
            }
          ]
        }"
      >
        <!-- 左侧：封面 + 信息 -->
        <div class="game-card__left">
          <div class="game-card__cover">
            <img :src="item.icon_url" :alt="item.app_name" />
          </div>
          <div class="game-card__info">
            <div class="game-card__info-inner">
              <h3 class="game-card__title">
                <span class="game-card__title-inner">{{ item.app_name }}</span>
              </h3>
              <div class="game-card__meta">
                <span class="game-card__date">{{ formatTime(item.last_modify_utc_ms) }}</span>
                <span class="game-card__downloads">{{ formatSize(item.pkg_size) }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 右侧：操作按钮 -->
        <div class="game-card__actions">
          <button class="action-btn action-btn--uninstall" @click="handleUninstall(item)">
            <span class="action-btn__label">卸载</span>
          </button>
          <button class="action-btn action-btn--gold" @click="handleOpen(item, index)">
            <span class="action-btn__label">{{ item.status === 'update_available' ? '更新' : '打开' }}</span>
          </button>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-state__content">
        <img
          class="empty-state__icon"
          src="@/images/gamecenter/nothing.png"
          alt=""
        />
        <p class="empty-state__text">PC玩手游，大屏更尽兴</p>
        <button class="empty-state__btn" @click="goDownload">
          <span class="empty-state__btn-text">去下载</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getInstalledMiniGameDetail, openMiniGameAndPinAndInstall, uninstallMiniGame, parentExposeMiniGame } from '@/utils/miniGame'
import { reportMinigameExpose, createTabPageReporter } from '@/utils/dataReport'

export default {
  name: 'MiniGameMine',
  props: {
    firstLocal: {
      type: [String, Number],
      default: ''
    }
  },
  data() {
    return {
      gameList: []
    }
  },
  methods: {
    // 字节数转可读大小（< 1 GB → MB，≥ 1 GB → GB，保留一位小数）
    formatTime(ms) {
      if (!ms) return ''
      const d = new Date(Number(ms))
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    },
    formatSize(bytes) {
      console.log('formatSize bytes', bytes)
      if (!bytes || isNaN(bytes)) return ''
      const n = Number(bytes)
      if (n >= 1024 * 1024 * 1024) {
        return (n / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
      }
      return (n / (1024 * 1024)).toFixed(1) + ' MB'
    },
    // 加载已安装游戏列表
    async loadInstalledGames() {
      try {
        const res = await getInstalledMiniGameDetail()
        console.log('loadInstalledGames res', res)
        const SOURCE_CHANNEL = '2305200007'
        const list = Array.isArray(res) ? res : Array.isArray(res?.list) ? res.list : []
        this.gameList = list.filter(item => item.source_channel === SOURCE_CHANNEL)
      } catch (err) {
        console.error('loadInstalledGames error', err)
        this.gameList = []
      } finally {
        this._reporter.reportLoaded()
      }
    },
    onExposure(item, childIndex, exposureType) {
      // 其他逻辑
      parentExposeMiniGame(item, childIndex, exposureType, '101', {
        sourceID: '60132'
      })
      reportMinigameExpose(item, childIndex, exposureType, {
        moduleName: this.moduleName,
        firstLocal: this.firstLocal,
        secondLocal: 14,
        sourceID: '60132'
      })
    },
    // 打开游戏
    handleOpen(item, index) {
      openMiniGameAndPinAndInstall(item, index, {
        appID: item.pkg_name
      })
    },
    // 卸载游戏
    handleUninstall(item) {
      uninstallMiniGame(item.pkg_name).then((res) => {
        if (res.ret === 0) {
          this.gameList = this.gameList.filter(g => g.pkg_name !== item.pkg_name)
          this.$store.commit('miniGameInstallState/SET_STATE', {
            pkgName: item.pkg_name,
            patch: { status: 'idle', progress: 0 }
          })
          this.$message({
            message: '卸载成功',
            type: 'success',
            duration: 2500,
            customClass: 'lg-message--success'
          })
        }
      }).catch(err => {
        console.error('uninstall error', err)
      })
    },
    // 跳转下载页（推荐 tab）
    goDownload() {
      this.$emit('switch-tab', 'recommended')
    }
  },
  created() {
    this._reporter = createTabPageReporter('我的', '/gameCenter/miniGame')
    this._reporter.reportStart()
    this.loadInstalledGames()
  },
  mounted() {
    requestAnimationFrame(() => this._reporter.reportFirstFrame())
  }
}
</script>

<style scoped lang="scss">
.mine-tab {
  padding-top: 20px;
  padding-bottom: 80px; // 底部留空，避免最后一条卡片贴边
}

// ---- 游戏列表：不限高，随内容自然撑开，由父容器 .mini-game-home-box 负责滚动 ----
.game-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ---- 游戏卡片 ----
.game-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  padding-right: 24px;
  flex-shrink: 0;
  background:
    linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%),
    linear-gradient(77deg, rgba(30, 34, 39, 0.2) 4.98%, rgba(112, 118, 150, 0.2) 100.17%);
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background:
      linear-gradient(19.73deg, rgba(30, 34, 39, 0.2) 4.98%, rgba(112, 118, 150, 0.2) 100.17%),
      linear-gradient(90deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.2) 100%),
      linear-gradient(19.73deg, rgba(30, 34, 39, 0.2) 4.98%, rgba(112, 118, 150, 0.2) 100.17%);
  }
}

// ---- 左侧：封面 + 信息 ----
.game-card__left {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-left: 24px;
}

.game-card__cover {
  position: relative;
  width: 54px;
  height: 54px;
  border: 1px solid #ffffff;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.game-card__info {
  display: flex;
  align-items: flex-start;
}

.game-card__info-inner {
  display: flex;
  align-items: center;
  font-size: 16px;
  word-break: break-word;
}

.game-card__title {
  // 外层：只负责裁剪
  width: 300px;
  height: 24px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .game-card__title-inner {
  font-size: 16px;
  font-weight: 700;
  max-width: 100%;
  line-height: 24px;
  background: linear-gradient(179.52deg, rgb(146, 146, 146) 1.88%, rgb(234, 247, 255) 98.12%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
}

.game-card__meta {
  display: flex;
  align-items: center;
  gap: 0;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  white-space: nowrap;
  flex-shrink: 0;
}

.game-card__downloads {
  width: 120px;
}

.game-card__date {
  margin-right: 140px;
  width: 120px;
}

.game-card__date,
.game-card__downloads {
  opacity: 0.7;
  background: linear-gradient(90deg, rgb(234, 247, 255) 0%, rgb(234, 247, 255) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.game-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 34px;
  border: none;
  cursor: pointer;

  &:active {
    transform: scale(0.97);
  }
}

.action-btn--uninstall {
  // 卸载按钮：深色半透明 + 浅色描边，模拟 ghost 风格
  // background: linear-gradient(
  //   180deg,
  //   rgba(50, 58, 68, 0.9) 0%,
  //   rgba(30, 36, 44, 0.9) 100%
  // );
  // border: 1px solid rgba(234, 247, 255, 0.25);
  // box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  background: url("~@/images/gamecenter/miniGame/button2.svg");
  background-size:  cover;
  background-position: center;

  .action-btn__label {
    font-family: "Microsoft YaHei", sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    color: rgba(234, 247, 255, 0.8);
  }

  &:hover {
    opacity: 0.8;
  }
}

.action-btn--gold {
  // 打开/更新按钮：银灰金属渐变（双 background-image 叠加）
  // background-image:
  //   /* 上层：左上高光 + 右下收边，模拟内边框立体感 */
  //   linear-gradient(
  //     135deg,
  //     rgba(255, 255, 255, 0.6) 0%,
  //     rgba(255, 255, 255, 0.05) 40%,
  //     rgba(255, 255, 255, 0.05) 60%,
  //     rgba(180, 190, 200, 0.4) 100%
  //   ),
  //   /* 下层：主体银灰渐变 */
  //   linear-gradient(
  //     160deg,
  //     #c8ced6 0%,
  //     #dde3e8 40%,
  //     #e8edf0 70%,
  //     #cfd6dc 100%
  //   );
  // border: 1px solid #8a9298;
  // box-shadow:
  //   inset 0 1px 0 rgba(255, 255, 255, 0.5),
  //   0 2px 4px rgba(0, 0, 0, 0.4);
  background: url("~@/images/gamecenter/miniGame/button1.svg");
  background-size: contain;
  background-position: center;

  .action-btn__label {
    font-family: "Microsoft YaHei", sans-serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #1a0e00;
    text-shadow: none;
  }

  &:hover {
    opacity: 0.8;
    // background-image:
    //   linear-gradient(
    //     135deg,
    //     rgba(255, 255, 255, 0.7) 0%,
    //     rgba(255, 255, 255, 0.08) 40%,
    //     rgba(255, 255, 255, 0.08) 60%,
    //     rgba(200, 210, 218, 0.5) 100%
    //   ),
    //   linear-gradient(
    //     160deg,
    //     #d4dae2 0%,
    //     #e8eef2 40%,
    //     #f2f6f8 70%,
    //     #dbe2e8 100%
    //   );
  }
}

// ---- 空状态 ----
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 520px;
}

.empty-state__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  margin-top: 160px;
}

.empty-state__icon {
  display: block;
  width: 139px;
  height: 140px;
}

.empty-state__text {
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
  color: rgba(234, 247, 255, 0.8);
  text-align: center;
  white-space: nowrap;
}

.empty-state__btn {
  width: 120px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  margin-top: 18px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  background-image: url("~@/components/LZConfirm/button_normal.png");

  &:hover {
    background-image: url("~@/components/LZConfirm/button_hover.png");
  }
  &:active {
    background-image: url("~@/components/LZConfirm/button_active.png");
  }
}

.empty-state__btn-text {
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: rgba(234, 247, 255, 1);
  letter-spacing: 2px;
  text-shadow: 0px 3px 1px rgba(234, 247, 255, 0.2);
  pointer-events: none;
}

</style>
