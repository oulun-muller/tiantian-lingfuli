<template>
  <div class="GameDetailPhone">
    <header :class="{ topMask: scrollTop > 50 }">
      <button @click.stop="back">
        <i class="back-arrow" aria-hidden="true"></i>
      </button>
    </header>
    <div class="main" v-if="detail" ref="scrollDom" @scroll="scrollHandle">
      <MediaStage
        v-if="currentMedia"
        :key="detail.softId + 1"
        :detail="detail"
        :drinfo="drinfo"
        :ranking-item="rankingItem"
        :is-follower="isFollower"
        :click-game-library="clickGameLibrary"
        :scroll-to-comment="scrollToComment"
        :to-followers="toFollowers" />
      <div style="position: relative;">
        <div class="wrap-first-back"></div>
        <div class="detail-wrap">
          <div
            v-if="canWriteReview && userReviewInfo && userReviewInfo.userGameDuration"
            class="recommend-wrap">

            <div class="info">
              <div style="display: flex; align-items: center;">
                <span class="icon"></span>
                <span class="recommend-title">您已玩{{ calcTime(userReviewInfo.userGameDuration) }}</span>
              </div>
              <div class="sub">你会向其他玩家推荐这款游戏吗？</div>
            </div>
            <img src="@/images/mobile/detail/userGameDurationBtn.png" class="action-img" @click="clickRecommend(1)" />
            <!-- <span class="action-wrap">
              <i class="recommend" @click="clickRecommend(1)">
                <img src="@/images/icon/recommend.svg" class="recommend-icon" />
                推荐</i>
              <i class="not-recommend" @click="clickRecommend(0)">
                <img src="@/images/icon/no-recommend.svg" class="recommend-icon" />
                不推荐</i>
            </span> -->
          </div>
          <div class="clcik-scroll">
            <div class="lick-scroll-item-active">详情</div>
            <div v-if="detail.softDesc.reviewsCount" class="click-scroll-item" @click="scrollToComment">评测·{{
              detail.softDesc.reviewsCount }}</div>
          </div>
          <section>
            <div class="wrap-left">
              <div class="left-outer-layer">
                <ActivityNotice
                  :key="detail.softId + 2"
                  :detail="detail"
                  :state-game="stateGame"
                  :state-page="statePage"
                  :game-class="gameClass" />
              </div>
              <div v-if="detail.softPurpose === 2 && detail.softDesc.whatsNew" class="left-outer-layer">
                <div class="h1-class">更新日志</div>
                <div class="uplate-container">
                  <div class="update-desc" :class="{ 'update-desc-expand': whatsNewExpandStatus === 2 }">
                    <div ref="whatsNew">
                      <RichTextViewer :rt="detail.softDesc.whatsNew" />
                    </div>
                  </div>
                  <span v-if="whatsNewExpandStatus === 1" class="expand" @click="whatsNewExpandStatus = 2">更多</span>
                </div>
              </div>
              <div v-if="detail.softDesc.detailInfo" class="left-outer-layer" :style="{ marginTop: '32px' }">
                <div class="h1-class" style="margin-bottom: 8px">游戏简介</div>
                <div class="container">
                  <div :class="{ desc: true, expand: detailInfoExpandStatus === 2 }">
                    <div ref="detailInfo">
                      <RichTextViewer :rt="detail.softDesc.detailInfo" />
                    </div>
                  </div>
                  <span v-if="detailInfoExpandStatus === 1" class="expand" @click="detailInfoExpandStatus = 2">更多</span>
                </div>
              </div>
              <AIEvaluation
                :style="{
                  marginTop: '32px'
                }"
                v-if="detail.softDesc.aiReviews && detail.firstClassId === '2002'"
                :key="detail.softId + 5"
                :ai-content="detail.softDesc.aiReviews"
                :soft-name="detail.softName"
                :state-game="stateGame"
                :state-page="statePage"
                :game-class="gameClass" />
              <template>
                <VideoList
                  class="left-outer-layer"
                  ref="goodvideos"
                  :key="detail.softId + 3"
                  :detail="detail"
                  :state-game="stateGame"
                  :state-page="statePage"
                  :game-class="gameClass" />
              </template>
              <MediaRating v-if="detail.showInfo.mediaScores.length" :list="detail.showInfo.mediaScores" />
              <VerticalGameListPad
                style="margin-top: 32px;"
                :key="detail.softId + 6"
                :detail="detail"
                :to-top="toTop"
                :state-game="stateGame"
                :state-page="statePage"
                :game-class="gameClass" />
              <LegionEvaluation
                class="left-outer-layer"
                v-if="detail && userReviewInfo && userReviewInfo.enableReviews"
                :key="detail.softId + 4"
                ref="legionEvaluation"
                :can-write-review="canWriteReview"
                :detail="detail"
                :user-review-info="userReviewInfo"
                :my-evaluation-data="userReviewInfo && userReviewInfo.userSoftReviews"
                :state-game="stateGame"
                :state-page="statePage"
                :game-class="gameClass"
                @addMyEvaluation="refreshPage"
                @showPhoneDialog="showEvaDialog = true"
                @deleteMyEvaluation="refreshPage" />
            </div>
          </section>
        </div>
      </div>
    </div>
    <div v-if="detail" :class="{ show: true }" class="sticky">
      <template v-if="[2, 3].includes(detail.softPurpose)">
        <GameDownloadButton
          class="download-button"
          :key="detail.softId + 7"
          theme="rect"
          :download-info="detail.downloadInfo"
          :soft-desc="detail.softDesc"
          :soft-id="detail.softId"
          :soft-purpose="detail.softPurpose"
          :product-info="detail.productInfo"
          :user-purchased-status="detail.productInfo.userPurchasedStatus"
          :version="detail.softDesc.version"
          :soft-name="detail.softName"
          :logo-file="detail.showInfo.logoFile"
          :fast-install="detail.showInfo.isFastInstall"
          :drinfo="drinfo"
          :text="getDownloadText(detail)"
          :is-click="true"
          :sku-id="detail.skuId"
          ref="GameDownloadButton" />
      </template>
      <div class="pad-follow-wrapper" v-if="![1, 2].includes(detail.downloadInfo.bizType)" @click.stop="toFollowers">
        <template v-if="isFollower">已关注</template>
        <template v-else>
          <img src="@/images/gamecenter/concern-active-new.png" alt="" />
          <div class="follow-text">关注</div>
        </template>
      </div>
    </div>
    <EvaluatioinDialog
      v-if=" detail && userReviewInfo"
      :key="detail.softId + 8"
      :soft-name="detail.softName"
      :recommend-type="recommendType"
      :show="showEvaDialog"
      :user-review-info="userReviewInfo"
      :state-game="stateGame"
      :state-page="statePage"
      :game-class="gameClass"
      @closeDialog="showEvaDialog = false"
      @addMyEvaluation="refreshPage" />
  </div>
</template>

<script src="./index.js"></script>

<style scoped lang="scss">
.GameDetailPhone {

  header {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    width: 100%;
    height: 56px;
    pointer-events: none;

    >button {
      position: absolute;
      left: 40px;
      top: 24px;
      background-color: transparent;
      border: none;
      width: auto;
      max-width: 360px;
      height: 24px;
      font-size: 16px;
      color: rgba(234, 247, 255, 0.6);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: pointer;
      pointer-events: all;

      .back-arrow {
        display: block;
        width: 16px;
        height: 16px;
        background: url('~@/images/Index/arrow-left.png') no-repeat center / contain;
      }
    }
  }

  .topMask {
    background-color: #000;
  }

  .main {
    position: absolute;
    left: 0px;
    top: 0;
    right: 0px;
    bottom: 8px;
    z-index: 7;
    overflow-x: hidden;
    overflow-y: overlay;
    scroll-behavior: smooth;
    box-sizing: border-box;
    padding-bottom: 100px;

    scrollbar-width: none;
    /* Firefox */
    -ms-overflow-style: none;
    /* IE/Edge */
    &::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    width: 100%;
    margin: 0 auto;

    // >header {
    //   width: 100%;
    //   height: 47.26vw;
    //   max-height: 680px;
    //   display: flex;

    //   >div {
    //     width: 100%;
    //     overflow: hidden;
    //     position: relative;

    //     >section {
    //       position: absolute;
    //       left: 0;
    //       top: 0;
    //       width: 100%;
    //       height: 100%;
    //       transform-origin: 50% 0%;
    //     }
    //   }
    // }

    .clcik-scroll {
      height: 26px;
      width: 100%;
      display: flex;
      gap: 40px;
      margin-bottom: 24px;
      align-items: center;

      .lick-scroll-item-active,
      .click-scroll-item {
        color: #EAF7FF;
        opacity: 0.5;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;

        &:hover {
          opacity: 1;
        }
      }

      .lick-scroll-item-active {
        font-size: 20px;
        opacity: 1;
      }
    }

    .wrap-first-back {
      aspect-ratio: 110 / 81;
      position: absolute;
      pointer-events: none;
      top: 0;
      width: 100%;
      background: transparent url('https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/21/ec874138-9e00-4c00-bf5a-36ca1b496c0b.png') no-repeat center center / contain;
    }

    .detail-wrap {
      width: 100%;
      padding: 0 20px;
      box-sizing: border-box;

      .uplate-container {
        position: relative;
        margin: 16px 0px 0px 0px;
        padding: 24px;
        border: 1px solid;
        border-image: linear-gradient(to right,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0.15) 100%) 1;
        background: rgba(255, 255, 255, 0.05);

        .update-desc {
          margin: 0 20px 0 0;
          max-height: 156px;
          overflow: hidden;
        }

        .update-desc-expand {
          overflow: visible;
          max-height: 100000px;
        }

        .expand {
          display: block;
          color: #386EFE;
          height: 14px;
          width: 28px;
          margin-left: auto;
          position: relative;
          max-height: none;
        }
      }

      .recommend-wrap {
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        padding: 16px;
        margin-bottom: 32px;
        //  background: linear-gradient(90deg, #1E110F 0%, #15182E 100.39%);
        background: rgba(234, 247, 255, 0.10);
        border-radius: 8px;

        // &::before {
        //   position: absolute;
        //   top: 0;
        //   left: 0;
        //   content: '';
        //   display: inline-block;
        //   width: 100%;
        //   height: 1px;
        //   transform: scaleY(0.5);
        // }

        // &::after {
        //   position: absolute;
        //   bottom: -1px;
        //   left: 0;
        //   content: '';
        //   display: inline-block;
        //   width: 100%;
        //   height: 1px;
        //   transform: scaleY(0.5);
        // }
        .action-img {
          width: 96px;
          height: 40px;
        }

        .info {
          flex: 1;

          .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            background: transparent url('~@/images/icon/comment.svg') no-repeat center center / cover;
            margin-right: 4px;
          }

          .recommend-title {
            display: block;
            font-size: 16px;
            font-weight: 800;
            background: linear-gradient(177deg, #929292 2.19%, #EAF7FF 83.87%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .sub {
            display: inline-block;
            color: rgba(234, 247, 255, 0.60);
            font-size: 12px;
            font-weight: 400;
            line-height: 12px;
            margin-top: 6px;
          }
        }

      }

      .wrap-left {
        width: 100%;
        overflow: hidden;

        .h1-class {
          margin-right: 20px;
          font-weight: bold;
          font-size: 16px;
          height: 24px;
          line-height: 24px;
          color: #EAF7FF;

          &.orange {
            color: #FD9E09;
          }
        }

        .container {
          position: relative;

          div.desc {
            margin: 0 20px 0 0;
            max-height: 315px;
            overflow: hidden;

            &.expand {
              max-height: none;
            }
          }

          span.expand {
            text-align: right;
            width: 100%;
            height: 40px;
            line-height: 88px;
            position: absolute;
            right: 0px;
            bottom: 0;
            padding-right: 20px;
            margin-left: 40px;
            font-size: 14px;
            font-weight: 400;
            color: #386EFE;
            //  background: linear-gradient(0, rgba(0, 0, 0, 1) 10%, rgba(0, 0, 0, 0) 100%);

            &:hover {
              cursor: pointer;
              color: rgb(83, 144, 254);
            }
          }
        }

      }
    }
  }

  .sticky {
    border-top: 0.5px solid rgba(255, 255, 255, 0.2);
    position: absolute;
    left: 0;
    bottom: 0;
    z-index: 9;
    width: 100%;
    height: 74px;
    box-sizing: border-box;
    padding: 22px 20px 4px 20px;
    display: flex;
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    background: #0F1015;

    .pad-follow-wrapper {
      width: 100px;
      height: 48px;
      // background: url('~@/images/gamecenter/follower-mask.png') no-repeat;
      border-radius: 8px;
      border: 1.496px solid rgba(234, 247, 255, 0.40);
      margin-left: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      img {
        width: 27px;
        height: 27px;
        object-fit: cover;
      }

      .follow-text {
        font-size: 15px;
        font-weight: 700;
        margin-left: 4px;
      }
    }

    &:before {
      content: "";
      position: absolute;
      left: 0;
      top: -35px;
      right: 0;
      width: 100%;
      height: 37px;
      z-index: 1;
      pointer-events: none;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.9) 85.4%);
    }

    &.show {
      opacity: 1;
      pointer-events: auto;
    }

    .download-button {
      flex: 1;
      height: 48px;
      border-radius: 8px;
      overflow: hidden;
      :deep(.grey-rect-btn) {
        height: 48px;
      }
    }

    :deep(div.DownloadButtonPad.rect > div::before) {
      border-radius: 8px;
    }

    :deep(div.DownloadButtonPad>div>span) {
      font-size: 15px;
      font-weight: 700;
    }

    :deep(div.DownloadButtonPad>div>div) {
      border: none;
    }

    // :deep(div.GameDownloadButton) {
    //   width: 153px;
    //   height: 40px;

    //   .common-abnormal-rect-btn {
    //     width: 153px;
    //     height: 40px;
    //     line-height: 40px;
    //     font-size: 13px;

    //     i {
    //       width: 145px;
    //       letter-spacing: 2px;
    //     }
    //   }

    //   .abnormal-rect-btn {
    //     transform: scale(0.76);
    //     transform-origin: top left;
    //   }
    // }

    // button {
    //   background: none;
    //   border: none;
    //   width: 153px;
    //   height: 40px;
    //   border: none;
    //   background: url('~@/images/gamecenter/special-normal.png') no-repeat;
    //   background-size: cover;
    //   background-position: center center;
    //   color: #000;
    //   text-align: center;
    //   font-size: 12px;
    //   font-style: normal;
    //   font-weight: 700;
    //   letter-spacing: 2px;
    //   cursor: pointer;

    //   &:hover {
    //     background: url('~@/images/gamecenter/special-hover.png') no-repeat;
    //     background-size: cover;
    //     background-position: center center;
    //     color: rgba(255, 255, 255, 1);
    //   }

    //   &:active {
    //     color: rgba(255, 255, 255, 0.6);
    //     background: url('~@/images/gamecenter/special-click.png') no-repeat;
    //     background-size: cover;
    //     background-position: center center;
    //   }
    // }
  }

}
</style>
