<template>
  <div class="followed-games">
    <div class="top-header">
      <div class="back-btn" tabindex="0" role="button" aria-label="返回，我关注的游戏" @click="handleBack" @keydown.enter.prevent.stop="handleBack" @keydown.space.prevent.stop="handleBack">
        <span class="sp sp1"></span>
        <span class="sp sp2">我关注的游戏</span>
      </div>
    </div>
    <div class="scroll-box">
      <div class="games-list">
        <div class="game-outer" v-for="(item, index) in list" :key="index">
          <div
            class="game-item"
            tabindex="0"
            role="button"
            :aria-label="item.softName + '，点击查看详情'"
            @click="toDetail(item, index)"
            @keydown.enter.prevent.stop="toDetail(item, index)"
            @keydown.space.prevent.stop="toDetail(item, index)">
            <div :style="{ backgroundImage: `url(${item.showInfo.logoFile})` }" class="game-img"></div>
            <div class="game-info">
              <div class="info-left">
                <div class="game-name">{{ item.softName }}</div>
                <div
                  class="game-tags"
                  v-if="
                    item.showInfo &&
                      item.showInfo.rankingLabelInfos &&
                      item.showInfo.rankingLabelInfos.length > 0
                  ">
                  <template>
                    <span
                      class="sp sp1"
                      v-for="(label, labelIndex) of item.showInfo.rankingLabelInfos.slice(0, 2)"
                      :key="labelIndex + '1'">{{ label.labelName }}TOP{{ label.num }}</span>
                  </template>
                  <template
                    v-if="
                      item.showInfo &&
                        item.showInfo.softLabels &&
                        item.showInfo.softLabels.length > 0 &&
                        !(
                          item.showInfo.rankingLabelInfos &&
                          item.showInfo.rankingLabelInfos.length >= 2
                        )
                    ">
                    <span
                      class="sp"
                      v-for="(label, labelIndex) of item.showInfo.softLabels.slice(
                        0,
                        2 -
                          (item.showInfo.rankingLabelInfos
                            ? item.showInfo.rankingLabelInfos.length
                            : 0),
                      )"
                      :key="labelIndex">
                      {{ label }}
                    </span>
                  </template>
                </div>
              </div>
              <div class="info-center" tabindex="0" role="button" :aria-label="item.followUpStatus ? '取消关注' : '关注'" @click.stop="changeFollowUpStatus(item)" @keydown.enter.prevent.stop="changeFollowUpStatus(item)" @keydown.space.prevent.stop="changeFollowUpStatus(item)">
                <div v-if="item.followUpStatus">'关注'</div>
                <div v-else class="follow-icon"></div>
              </div>
              <!-- <div class="info-right"> -->
              <GameDownloadButton
                class="downloadinfo-rightButton"
                theme="rect"
                :download-info="item.downloadInfo"
                :soft-desc="item.softDesc"
                :soft-id="item.softId"
                :soft-purpose="item.softPurpose"
                :product-info="item.productInfo"
                :user-purchased-status="item.productInfo.userPurchasedStatus"
                :version="item.softDesc.version"
                :soft-name="item.softName"
                :logo-file="item.showInfo.logoFile"
                :fast-install="item.showInfo.isFastInstall"
                :drinfo="drinfo(item, index, true)"
                :sku-id="item.skuId" />
              <!-- </div> -->
            </div>
          </div>

          <div
            class="game-activity"
            v-if="item.relateNotices && item.relateNotices.length > 0"
            v-exposure:multiple="{
              events: [
                {
                  handler: () => handleGameExposure(item, item.relateNotices[0]),
                  options: { threshold: 0.5 },
                  delay: 1000,
                },
              ],
            }">
            <div class="activity-inner" tabindex="0" role="button" :aria-label="item.relateNotices[0].longTitle" @click="clickActivity(item.relateNotices[0], item)" @keydown.enter.prevent.stop="clickActivity(item.relateNotices[0], item)" @keydown.space.prevent.stop="clickActivity(item.relateNotices[0], item)">
              <span class="sp sp1"></span>
              <span class="sp sp2">{{ item.relateNotices[0].longTitle }}</span>
              <span class="sp sp3"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GameDownloadButton from '@/components/GameDownloadButton'
import { concernList, unFollowers } from '@/api/gameCenter'
import { unReserveReviewslikes } from '@/api/gameEvaluation'
import { getLegacyLenovoId } from '@/compat/legacyGlobals'
export default {
  name: 'FollowedGames',
  components: { GameDownloadButton },
  data() {
    return {
      current: 1,
      size: 10,
      list: [],
      hasMore: true,
      loading: false
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    },
    lid() {
      return getLegacyLenovoId()
    }
  },
  mounted() {
    this.$emit('headerStatus', false)
    this.$store.dispatch('pageLoaded', false)
    this.fetchList()

    const scrollBox = this.$el.querySelector('.scroll-box')
    if (scrollBox) {
      scrollBox.addEventListener('scroll', this.handleScroll)
    }
    this.$dataReport('LZ_myGames', 'LZ_followedGamesPageShow', 'pv')
  },
  beforeUnmount() {
    const scrollBox = this.$el.querySelector('.scroll-box')
    if (scrollBox) {
      scrollBox.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    handleGameExposure(item, active) {
      this.$dataReport('LZ_myGames', 'LZ_followedGamesListActivityShow', 'pv', {
        detail: JSON.stringify({
          skuName: item.softName,
          softID: item.softId,
          activityId: active.jumpUrl,
          activityName: active.longTitle,
          lid: this.lid
        })
      })
    },
    toDetail(item) {
      this.$router.push({
        name: 'GameCenterDetail',
        params: { id: item.softId }
      })
      this.$dataReport('LZ_myGames', 'LZ_followedGamesListCardClick', 'click', {
        detail: JSON.stringify({
          skuName: item.softName,
          softID: item.softId,
          lid: this.lid
        })
      })
    },
    async changeFollowUpStatus(item) {
      const callBatch = [unFollowers({ softId: item.softId })]
      if ([1, 2].includes(item.downloadInfo.bizType)) {
        callBatch.push(unReserveReviewslikes({ softId: item.softId, softName: item.softName }))
      }
      Promise.all(callBatch)
        .then(() => {
          const index = this.list.findIndex((listItem) => listItem.softId === item.softId)
          this.list.splice(index, 1)
        })
        .catch(() => {
          this.$message({
            message: '取消关注失败，请重试！',
            type: 'error',
            duration: 1500,
            customClass: 'lg-message--error'
          })
        })

      const stateInfo = this.$store.state.gameDownloadState.stateMap[item.softId] || {}
      const drinfo = {
        source_p: this.$route.query.source_p || '',
        source: 'PAD11',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 2,
        plateName: '我关注的游戏',
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      }
      const obj = {
        detail: JSON.stringify({
          ...drinfo,
          stateGame: 2,
          statePage: stateInfo.userReservationStatus === 1 ? 3 : 2,
          clicktype: item.followUpStatus ? 2 : 1
        })
      }
      this.$dataReport('LZ_myGames', 'LZ_cdkAndLoadCancelClick', 'click', obj)
    },
    clickActivity(data, item) {
      if (!data.jumpUrl) return
      if (+data.jumpType === 1) {
        this.$router.push({
          path: `/gameCenter/online/index`,
          query: {
            firstLocal: 8,
            secondLocal: 17,
            isLabel: 'Yes',
            id: data.jumpUrl
          }
        })
      }
      this.$dataReport('LZ_myGames', 'LZ_followedGamesListActivityClick', 'click', {
        detail: JSON.stringify({
          skuName: item.softName,
          softID: item.softId,
          activityId: data.jumpUrl,
          activityName: data.longTitle,
          lid: this.lid
        })
      })
    },
    drinfo(item, index, status) {
      return JSON.stringify({
        source_p: this.$route.query.source_p || '',
        source: 'PAD11',
        firstLocal: this.$isPadDevice ? 'PAD' : this.firstLocal,
        secondLocal: this.$isPadDevice ? 'PAD' : this.secondLocal,
        thirdLocal: this.$isPadDevice ? 'PAD' : this.thirdLocal,
        type: 2,
        plateName: '我关注的游戏',
        skuName: item.softName || '',
        softID: item.softId || '',
        lenovoid: this.userInfo ? this.userInfo.UserID : ''
      })
    },
    fetchList() {
      if (this.loading || !this.hasMore) return

      this.loading = true
      const params = {
        lowerId: '',
        current: this.current,
        size: this.size
      }
      concernList(params)
        .then((res) => {
          if (res && res.records) {
            if (this.current === 1) {
              this.list = res.records
            } else {
              this.list = [...this.list, ...res.records]
            }

            this.hasMore = res.records.length === this.size
            this.current++
          } else {
            this.hasMore = false
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    handleBack() {
      window.LegionZoneMobile.nativeCall('LegionZone', 'goBack')
    },
    handleScroll() {
      const scrollBox = this.$el.querySelector('.scroll-box')
      if (!scrollBox) return

      const { scrollTop, scrollHeight, clientHeight } = scrollBox

      if (scrollTop + clientHeight >= scrollHeight - 10 && this.hasMore && !this.loading) {
        this.fetchList()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.followed-games {
  $theme-color: #eaf7ff;
  $triangle-side: 20px;
  font-family: Microsoft YaHei;
  color: $theme-color;
  height: 100%;
  background-color: #000;

  .top-header {
    padding: 0 30px;
    display: flex;
    align-items: center;
    height: 74px;

    .back-btn {
      display: flex;
      align-items: center;
      gap: 12px;

      .sp {
        &.sp1 {
          width: 24px;
          height: 24px;
          background-image: url('~@/images/gamecenter/myFollowedGames/arrow-left.svg');
          background-size: 100% 100%;
        }

        &.sp2 {
          font-weight: 700;
          font-style: Bold;
          font-size: 22px;
          line-height: 29px;
        }
      }
    }
  }

  .scroll-box {
    height: calc(100% - 74px);
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .games-list {
    display: flex;
    flex-flow: column;
    gap: 20px;
    padding: 20px 30px;

    .game-item {
      background: rgba($color: #000000, $alpha: 0.2);
      height: 96px;
      position: relative;
      box-sizing: border-box;

      .game-img {
        position: absolute;
        top: -1px;
        left: -1px;
        width: 96px;
        height: 96px;
        background-size: cover;
        border-radius: 8px;
      }

      .game-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        padding: 0 24px 0 116px;
        background: linear-gradient(77deg, rgba(30, 34, 39, 0.2) 4.98%, rgba(112, 118, 150, 0.2) 100.17%);

        .info-left {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
          .game-name {
            font-weight: 700;
            font-size: 16px;
            line-height: 21px;
            background: linear-gradient(177.77deg, #929292 1.88%, #eaf7ff 98.12%);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            max-width: 180px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-right: 10px;
          }

          .game-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 9px;

            .sp {
              border: 0.5px solid rgba($color: #fff, $alpha: 0.3);
              box-sizing: border-box;
              border-radius: 0.5px;
              font-weight: 400;
              font-size: 11px;
              height: 22px;
              line-height: 22px;
              padding: 0 9px;
              position: relative;

              &.sp1 {
                color: #fe9903;
                padding-left: 20px;

                &::before {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: 2px;
                  transform: translateY(-50%);
                  width: 16px;
                  height: 16px;
                  background-image: url('~@/images/gamecenter/myFollowedGames/top.svg');
                  background-size: 100% 100%;
                }
              }

              &.sp2 {
                padding-left: 20px;

                &::before {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: 2px;
                  transform: translateY(-50%);
                  width: 16px;
                  height: 16px;
                  background-image: url('~@/images/gamecenter/myFollowedGames/noBundling.svg');
                  background-size: 100% 100%;
                }
              }
            }
          }
        }

        .info-center {
          flex: 0 0 auto;
          padding-right: 100px;
          .follow-icon {
            width: 18px;
            height: 18px;
            background-image: url('~@/images/mobile/icon/follow-active.png');
            background-size: 100% 100%;
          }
        }

        .info-right {
          flex: 0 0 auto;
          border: 1px solid;
          background: linear-gradient(to bottom, #999, #fff);
          border-image: linear-gradient(245deg, #fff, #999) 1;
          color: #020202;
          font-weight: 700;
          font-size: 14px;
          line-height: 14px;
          letter-spacing: 2px;
          vertical-align: middle;
          height: 34px;
          line-height: 34px;
          box-sizing: border-box;
          padding: 0 12px;
        }
      }
    }

    .game-activity {
      padding: 20px 0;
      border-bottom: 1px solid rgba($color: #fff, $alpha: 0.2);
      box-sizing: border-box;
      margin-bottom: 10px;

      .activity-inner {
        height: 39px;
        line-height: 39px;
        background: linear-gradient(90deg, #2e3341 0%, #7683a7 100%);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px 0 20px;
        gap: 6px;

        .sp {
          &.sp1 {
            width: 16px;
            height: 16px;
            background-image: url('~@/images/gamecenter/myFollowedGames/activity.svg');
            background-size: 100% 100%;
            flex: 0 0 auto;
          }

          &.sp2 {
            font-weight: 400;
            font-size: 15px;
            line-height: 26px;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            flex: 1;
          }

          &.sp3 {
            width: 16px;
            height: 16px;
            background-image: url('~@/images/gamecenter/myFollowedGames/arrow-right.svg');
            background-size: 100% 100%;
            flex: 0 0 auto;
          }
        }
      }
    }
  }
}

@media screen and (max-width: 798px) {
  .followed-games .games-list .game-item {
    height: 12vw;
  }

  .followed-games .games-list .game-item .game-img {
    width: 12vw;
    height: 12vw;
  }

  .followed-games .games-list .game-item .game-info {
    padding: 0 3vw 0 14.5vw;
  }

  .followed-games .games-list .game-item .game-info .info-center {
    padding-right: 12vw;
  }
}

.PhoneDevice {
  .downloadinfo-rightButton {
    width: 72px;
    height: 28px;
  }
    .followed-games .games-list .game-item .game-info .info-center {
    padding-right: 30px;
  }
  .followed-games .top-header .back-btn .sp.sp2 {
    font-size: 20px;
    line-height: 22px;
    height: 24px;
  }

  .followed-games .games-list {
    padding: 20px;

    .game-item {
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: flex-start;

      .game-img {
        width: 72px;
        height: 72px;
        position: relative;
        border-radius: 16px;

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

      .game-info {
        flex: 1;
        background: transparent;
        padding: 0 0 0 16px;

        .info-center {}
      }
    }
  }
}

.followed-games .back-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.followed-games .game-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

.followed-games .info-center:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

.followed-games .activity-inner:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: -2px;
}

@media (forced-colors: active) {
  .followed-games .back-btn:focus-visible,
  .followed-games .game-item:focus-visible,
  .followed-games .info-center:focus-visible,
  .followed-games .activity-inner:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
