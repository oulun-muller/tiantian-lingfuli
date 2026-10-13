<template>
  <div
    :class="['DoubleArrayList', $isPadDevice ? 'PadDevice' : 'PcDevice']"
    v-if="rankSoftList.data.length">
    <h3 class="title-wrap">
      <span class="title-bac gc-text-stroke-around">{{ moduleEname }}</span>
      <span v-if="!$isPadDevice" class="gc-title-text"><i class="gc-title-quote-icon"></i>&nbsp;{{ rankSoftList.name }}&nbsp;<i class="gc-title-quote-icon"></i></span>
      <span v-else class="gc-title-text">{{ rankSoftList.name }}</span>
      <span
        class="more"
        @click="toList(rankSoftList.id,rankSoftList.name)"
        v-if="rankSoftList.showMore">更多</span>
    </h3>
    <ul ref="stage"
      v-exposure="{
      handler: ()=>onExposure(),
      delay: 1000,
      options: { threshold: 0.5 },
      once: true
      }"
      >
      <li
        v-for="item of rankSoftList.data"
        :key="item.softId"
        :ref="'gameDouble'+item.softId"
        @click="toDetail(item)"
        @mouseenter="!$isPadDevice && handleCurrentVideo(item)"
        @mouseleave="!$isPadDevice && (currentVideo = -1)">
        <b
          :style="{ backgroundImage: `url('${ handleCurImg(item) }')` }">
          <sub class="bor-top"></sub>
          <sub class="bor-right"></sub>
          <sub class="bor-bottom"></sub>
          <sub class="bor-left"></sub>
          <img
          v-if="currentVideo !== item.softId && !item.showInfo.himg && item.showInfo.logoFile"
          :src="item.showInfo.logoFile" alt="">
          <div class="hover_content">
            <div
              class="concern"
              @click.stop="toFollowers(item)"
              v-if="![1,2].includes(item.downloadInfo.bizType)" >
              <img v-if="isFollower" src="../image/concern-active.png" alt="">
              <img v-else src="../image/concern-normal.png" alt="">
              <p>{{ item.softDesc.followerCount }}</p>
            </div>
            <ol>
              <span v-if="item.downloadInfo.tagUrls.length">
                <img
                  :src="item.downloadInfo.tagUrls[0]"
                  alt="">
              </span>
              <template v-if="item.showInfo.softLabels && item.showInfo.softLabels.length && item.downloadInfo.tagUrls.length">
                <li
                v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0,2)"
                :key="tagIndex">{{ tagItem }}</li>
              </template>
              <template v-if="item.showInfo.softLabels && item.showInfo.softLabels.length && !item.downloadInfo.tagUrls.length">
                <li
                v-for="(tagItem, tagIndex) of item.showInfo.softLabels.slice(0,3)"
                :key="tagIndex">{{ tagItem }}</li>
              </template>
            </ol>
          </div>
          <video
            v-if="
              currentVideo === item.softId &&
              item.softDesc &&
              item.softDesc.mediaList[0] &&
              item.softDesc.mediaList[0].type === 'video'"
            :src="item.softDesc.mediaList[0].url"
            :poster="item.showInfo.himg || defaultImg"
            muted
            autoplay
            loop>
          </video>
        </b>
        <div class="bottom">
          <div class="left">
            <h1 :class="{'isCDK':item.softPurpose === 1}">{{ item.softName }}</h1>
            <p class="cdk" v-if="item.softPurpose === 1">
              <span v-if="item.productInfo.discount" class="discount">{{ item.productInfo.discount }}</span>
              <span class="currentPrice">¥{{ item.productInfo.currentPrice }}</span>
              <span v-if="item.productInfo.discount && item.productInfo.originalPrice" class="originalPrice">¥{{ item.productInfo.originalPrice }}</span>
              <span v-if="item.productInfo.exchangePlatformFont" class="iconfont platform" v-html="item.productInfo.exchangePlatformFont"></span>
            </p>
            <p class="download" v-else-if="item.showInfo.playersNum>=100">最近{{ item.showInfo.playersNum }}人玩过</p>
            <p class="download" v-else>{{ item.downloadInfo.downloadCount }}</p>
          </div>
          <div class="right">
            <div
              class="buyButton common-rect-btn"
              @click.stop="showPay(item)"
              v-if="item.softPurpose === 1">购买</div>
            <GameDownloadButton
              v-else
              class="downloadButton"
              :download-info="item.downloadInfo"
              :soft-desc="item.softDesc"
              theme="rect"
              :soft-id="item.softId"
              :soft-purpose="item.softPurpose"
              :product-info="item.productInfo"
              :userPurchasedStatus="item.productInfo.userPurchasedStatus"
              :version="item.softDesc.version"
              :soft-name="item.softName"
              :logo-file="item.showInfo.logoFile"
              :fast-install="item.showInfo.isFastInstall"
              :drinfo="drinfo(item)"
              :sku-id="item.skuId" />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style>

