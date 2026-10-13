<template>
  <div class="DownloadManager">
    <h3 class="title"><span
                        class="back-icon"
                        tabindex="0"
                        role="button"
                        aria-label="返回"
                        @click="goBack"
                        @keydown.enter.prevent.stop="goBack"
                        @keydown.space.prevent.stop="goBack"></span>
      <span class="title-text">下载管理</span>
    </h3>
    <section v-if="taskList.length">
      <ol>
        <li
          v-for="task of taskList"
          :key="task.SoftID"
          tabindex="0"
          role="button"
          :aria-label="task.SoftName + '，点击查看详情'"
          @click.stop="gotoDetail(task)"
          @keydown.enter.prevent.stop="gotoDetail(task)"
          @keydown.space.prevent.stop="gotoDetail(task)">
          <div
            v-if="task.status === 4"
            class="wait">
            <div class="info">
              <div class="img-wrap">
                <div class="img-border-wrap">
                  <img
                    :src="task.LogoFile || defaultIcon"
                    :alt="task.SoftName"
                    aria-hidden="true">
                </div>
              </div>
              <div>
                <h3>{{ task.SoftName }}</h3>
                <p>等待中</p>
              </div>
              <i
                class="iconfont cancel"
                tabindex="0"
                role="button"
                :aria-label="'取消下载 ' + task.SoftName"
                @click.stop="cancel(task)"
                @keydown.enter.prevent.stop="cancel(task)"
                @keydown.space.prevent.stop="cancel(task)"></i>
            </div>
            <div class="progress"></div>
          </div>
          <div
            v-else-if="task.status === 1"
            class="dl">
            <div class="info">
              <div class="img-wrap">
                <div class="img-border-wrap">
                  <img
                    :src="task.LogoFile || defaultIcon"
                    :alt="task.SoftName"
                    aria-hidden="true">
                </div>
              </div>
              <div>
                <h3>{{ task.SoftName }}</h3>
                <div class="progress">
                  <i :style="{ width: `${task.progress}%` }" aria-hidden="true"></i>
                </div>
                <p class="dl-text">
                  <span>{{ getTaskSize(task) }}</span>
                  <span>{{ task.progress }}%</span>
                </p>
              </div>
              <i
                class="iconfont cancel"
                tabindex="0"
                role="button"
                :aria-label="'取消下载 ' + task.SoftName"
                @click.stop="cancel(task)"
                @keydown.enter.prevent.stop="cancel(task)"
                @keydown.space.prevent.stop="cancel(task)"></i>
              <span
                class="btn common-rect-btn"
                tabindex="0"
                role="button"
                :aria-label="'暂停下载 ' + task.SoftName"
                @click.stop="pause(task)"
                @keydown.enter.prevent.stop="pause(task)"
                @keydown.space.prevent.stop="pause(task)">暂停</span>
            </div>
          </div>
          <div
            v-else-if="task.status === 0"
            class="pause">
            <div class="info">
              <div class="img-wrap">
                <div class="img-border-wrap">
                  <img
                    :src="task.LogoFile || defaultIcon"
                    :alt="task.SoftName"
                    aria-hidden="true">
                </div>
              </div>
              <div>
                <h3>{{ task.SoftName }}</h3>
                <div class="progress">
                  <i :style="{ width: `${task.progress}%` }" aria-hidden="true"></i>
                </div>
                <p>已暂停</p>
              </div>
              <i
                class="iconfont cancel"
                tabindex="0"
                role="button"
                :aria-label="'取消下载 ' + task.SoftName"
                @click.stop="cancel(task)"
                @keydown.enter.prevent.stop="cancel(task)"
                @keydown.space.prevent.stop="cancel(task)"></i>
              <span
                class="btn common-rect-btn"
                tabindex="0"
                role="button"
                :aria-label="'继续下载 ' + task.SoftName"
                @click.stop="resume(task)"
                @keydown.enter.prevent.stop="resume(task)"
                @keydown.space.prevent.stop="resume(task)">继续</span>
            </div>
          </div>
          <div
            v-else-if="task.status === 6"
            class="i">
            <div class="info">
              <div class="img-wrap">
                <div class="img-border-wrap">
                  <img
                    :src="task.LogoFile || defaultIcon"
                    :alt="task.SoftName"
                    aria-hidden="true">
                </div>
              </div>
              <div>
                <h3>{{ task.SoftName }}</h3>
                <div class="progress">
                  <i :style="{ width: '100%' }" aria-hidden="true"></i>
                </div>
                <p>安装中</p>
              </div>
              <i class="iconfont loading" aria-hidden="true"></i>
            </div>
          </div>
          <div
            v-else-if="task.status === 9 || task.status === 10"
            class="err">
            <div class="info">
              <div class="img-wrap">
                <div class="img-border-wrap">
                  <img
                    :src="task.LogoFile || defaultIcon"
                    :alt="task.SoftName"
                    aria-hidden="true">
                </div>
              </div>
              <div>
                <h3>{{ task.SoftName }}</h3>
                <div class="progress">
                  <i :style="{ width: `${task.progress}%` }" aria-hidden="true"></i>
                </div>
                <p v-if="task.eCode === -42003">下载失败，请检查下载路径</p>
                <p v-else>下载失败，请重试</p>
              </div>
              <i
                class="iconfont cancel"
                tabindex="0"
                role="button"
                :aria-label="'取消下载 ' + task.SoftName"
                @click.stop="cancel(task)"
                @keydown.enter.prevent.stop="cancel(task)"
                @keydown.space.prevent.stop="cancel(task)"></i>
              <span
                class="btn common-rect-btn"
                tabindex="0"
                role="button"
                :aria-label="'重试下载 ' + task.SoftName"
                @click.stop="retry(task)"
                @keydown.enter.prevent.stop="retry(task)"
                @keydown.space.prevent.stop="retry(task)">重试</span>
            </div>
          </div>
        </li>
      </ol>
    </section>
    <section v-else class="nothing">
      <!-- <img src="./nothing.png" alt=""> -->
      <p v-if="taskList !== null">暂无下载任务！</p>
    </section>
  </div>
</template>

<script>
import resolveAsset from '@/compat/resolveAsset'

export default {
  name: 'DownloadManager',
  filters: {
    speedByteFilter(val = 0) {
      if (val <= 0) {
        return `0 MB/s`
      }

      const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
      for (let i = 0; i < units.length; i++) {
        if (val < 1000) {
          return Math.round(val * 100) / 100 + units[i]
        }
        val = val / 1000
      }

      return Math.round(val * 100) / 100 + 'TB/s'
    }
  },
  data() {
    return {
      defaultIcon: resolveAsset('images/gamecenter/searchDefault.png'),
      showInstallSize: false
    }
  },
  computed: {
    taskList() {
      const arr = this.$store.getters['softwareStatePad/taskList']
      return arr
      // return [{
      //   progress: 30,
      //   isInstalled: true,
      //   packageName: '111',
      //   versionCode: '1',
      //   SoftName: '炉石传说',
      //   LogoFile: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
      //   status: 1,
      //   softId: '111',
      //   imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      // },
      // {
      //   progress: 30,
      //   isInstalled: true,
      //   packageName: '111',
      //   versionCode: '1',
      //   SoftName: '炉石传说',
      //   LogoFile: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
      //   status: 6,
      //   softId: '111',
      //   imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      // },
      // {
      //   progress: 30,
      //   isInstalled: true,
      //   packageName: '111',
      //   versionCode: '1',
      //   SoftName: '炉石传说',
      //   LogoFile: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
      //   status: 4,
      //   softId: '111',
      //   imageUrl: 'https://img2.baidu.com/it/u=3448780693,1416852201&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
      // }]
    }
  },
  created() {
    this.$emit('headerStatus', false)
    this.$store.dispatch('pageLoaded', { status: false, alpha: 0 })
  },
  methods: {
    gotoDetail(task) {
      if (!task.hdSoftID) return
      this.$router.push({
        path: `/gamecenter/detail/${task.hdSoftID}`,
        query: {
          source_pp: 'PAD7',
          source_p: 'PAD7'
        }
      })
    },
    getTaskSize(task) {
      if (!task.apkSize) return ''
      return `${(task.apkSize * task.progress / 100 / 1024 / 1024).toFixed(1)}MB / ${(task.apkSize / 1024 / 1024).toFixed(1)}MB`
    },
    goBack() {
      window.LegionZoneMobile.nativeCall('LegionZone', 'goBack')
    },
    cancel(task) {
      this.$dataReport('dm', 'dmDeleteClick', 'click', {
        gameName: task.SoftName + '_' + task.hdSoftID
      })
      this.$dataReport('dm', 'dmDeletePopupShow', 'pv', {
        gameName: task.SoftName + '_' + task.hdSoftID
      })
      this.$lzconfirm({
        type: 'warning',
        message: '是否删除下载任务',
        confirmButtonText: '确定'
      }).then(() => {
        this.$store.dispatch('softwareStatePad/cancel', task.SoftID)

        this.$dataReport('dm', 'dmDeletePopupClick', 'click', {
          gameName: task.SoftName + '_' + task.hdSoftID,
          clickType: 1
        })
      }).catch((e) => {
        this.$dataReport('dm', 'dmDeletePopupClick', 'click', {
          gameName: task.SoftName + '_' + task.hdSoftID,
          clickType: 2
        })
      })
    },
    pause(task) {
      this.$store.dispatch('softwareStatePad/pause', task.SoftID)
      this.$dataReport('dm', 'dmTempClick', 'click', {
        gameName: task.SoftName + '_' + task.hdSoftID,
        type: 1 // 1暂停 2继续
      })
    },
    resume(task) {
      this.$store.dispatch('softwareStatePad/resume', task.SoftID)
      this.$dataReport('dm', 'dmTempClick', 'click', {
        gameName: task.SoftName + '_' + task.hdSoftID,
        type: 2 // 1暂停 2继续
      })
    },
    retry(task) {
      this.$store.dispatch('softwareStatePad/retry', task.SoftID)
    }
  },
  mounted() {
    setTimeout(() => {
      this.$dataReport('dm', 'dmPageShow', 'pv', {
        gameNumber: this.taskList.length,
        gameName: this.taskList.map(item => (item.SoftName + '_' + item.hdSoftID)).join(',')
      })
    }, 3000)
  }
}
</script>

<style scoped lang="scss">
div.DownloadManager {
  padding: 0 30px;
  height: 100vh;
  background-color: #000;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    width: 0;
  }

  .title {
    color: #EAF7FF;
    font-size: 20px;
    font-weight: 700;
    padding: 22.5px 0;
    display: flex;
    align-items: center;

    .title-text {
        height: 24px;
        line-height: 22px;
    }

    .back-icon {
      display: inline-block;
      width: 24px;
      height: 24px;
      margin-right: 12px;
      background-image: url('~@/images/gamecenter/myFollowedGames/arrow-left.svg');
      vertical-align: -5px;
    }
  }

  section {
    margin: 0 4px;
    flex: 1 1 auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    >ol {
      >li {
        margin: 0 auto;
        margin-top: 20px;
        padding-right: 24px;
        border-radius: 16px 0 0 16px;
        border: 1px solid rgba(234, 247, 255, 0.1);
        background: linear-gradient(0deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.20) 100%), linear-gradient(77deg, rgba(30, 34, 39, 0.20) 4.98%, rgba(112, 118, 150, 0.20) 100.17%);

        >div {
          >div.info {
            display: flex;
            align-items: center;

            .img-wrap {
              margin-right: 20px;
              padding: 1px;
              border-radius: 16px;
              background: linear-gradient(-180deg, rgb(255, 255, 255), rgb(153 153 153 / 47%));
              width: 81px;
              flex: none;

              .img-border-wrap {
                overflow: hidden;
                position: relative;
                border-radius: 16px;
              }
            }

            img {
              width: 78px;
              height: 78px;
              margin-right: 8px;
            }

            >div {
              width: 0;
              flex: 1 1 auto;

              >h3 {
                font-weight: normal;
                // height: 14px;
                // line-height: 14px;
                font-size: 14px;
                color: #EAF7FF;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }

              >p {
                margin-top: 8px;
                // height: 14px;
                // line-height: 14px;
                font-size: 12px;
                color: rgba(234, 247, 255, 0.4);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }

            >i.iconfont {
              width: 16px;
              height: 16px;
              line-height: 16px;
              text-align: center;
              font-size: 12px;
              color: rgba(234, 247, 255, 0.4);
              cursor: pointer;

              &:last-of-type {
                margin-right: -2px;
              }

              &:hover {
                color: rgba(234, 247, 255, 1);
              }
            }
          }

          div.progress {
            margin-top: 8px;
            height: 4px;
            // border-radius: 4px;
            background-color: rgba(115, 115, 115, 0.12);
            overflow: hidden;

            >i {
              display: block;
              width: 0%;
              height: 100%;
              background: linear-gradient(270deg, #EAF7FF 0%, #929292 100%);
            }
          }

          &.dl {
            >div.info {
              >div {
                >p {
                  color: rgba(234, 247, 255, 0.6);
                }
              }
            }
          }

          &.pause {
            >div.info {
              >div {
                >p {
                  color: rgba(234, 247, 255, 0.6);
                }
              }
            }

            >div.progress {
              >i {
                background: linear-gradient(90deg, rgba(115, 115, 115, 0.15) 0%, rgba(234, 247, 255, 0.15) 100%);
              }
            }
          }

          &.err {
            >div.info {
              >div {
                >p {
                  color: rgba(253, 158, 9, 0.8);
                }
              }
            }

            >div.progress {
              >i {
                background: linear-gradient(90deg, rgba(115, 115, 115, 0.15) 0%, rgba(234, 247, 255, 0.15) 100%);
              }
            }
          }

          &.i {
            >div.info {
              >i.loading {
                cursor: default;
                background: transparent url("@/images/notify-loading.png") no-repeat center center / 16px 16px;
                animation: turn_around 1s linear infinite;
                width: 100px;
                margin-left: 70px;
              }
            }
          }
        }
      }
    }

    &.nothing {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 140px);

      img {
        display: block;
        width: 60px;
        height: 60px;
      }

      >p {
        height: 18px;
        line-height: 18px;
        font-size: 18px;
        color: rgba(234, 247, 255, 0.6);
      }
    }
  }
}

i.cancel {
  margin-left: 40px;
  display: inline-block;
  width: 16px;
  height: 16px;
  background: transparent url("@/images/icon/cancel.png") no-repeat center center / 16px 16px;
}

span.btn {
  width: 90px;
  margin-left: 24px;
}

.downloadButton {
  margin: 50px;
}

.dl-text {
  display: flex;
  justify-content: space-between;
}

@keyframes turn_around {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.PhoneDevice {
  div.DownloadManager {
    padding: 0 20px;

    section {
      margin: 0;
    }
  }

  .btn {
    width: 60px;
    height: 28px;
    line-height: 26px;
    font-size: 12px;
  }

  div.DownloadManager section>ol>li {
    padding-right: 0px;
    border: none;
    background: transparent;
  }

  div.DownloadManager section>ol>li>div>div.info img {
    width: 74px;
    height: 74px;
  }

  div.DownloadManager section>ol>li>div>div.info .img-wrap {
    margin-right: 10px;
    width: 76px;
  }
  div.DownloadManager section > ol > li > div div.progress {
    margin-top: 20px;
  }
}

.DownloadManager .back-icon:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.DownloadManager ol > li:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

.DownloadManager .cancel:focus-visible,
.DownloadManager .btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .DownloadManager .back-icon:focus-visible,
  .DownloadManager ol > li:focus-visible,
  .DownloadManager .cancel:focus-visible,
  .DownloadManager .btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
