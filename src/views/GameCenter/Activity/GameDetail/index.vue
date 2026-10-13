<template>
  <section class="GameDetail" v-if="list.length>=3">
    <h1 class="title"><span>{{ detailTitle }}</span></h1>
    <div class="container">
      <span class="arrow-left" tabindex="0" role="button" aria-label="上一张" @click="handleClick('left')" @keydown.enter.prevent.stop="handleClick('left')" @keydown.space.prevent.stop="handleClick('left')"/>
      <div class="item left">
        <video
          v-if="list[leftIndex].videoUrl"
          :src="list[leftIndex].videoUrl"
          :poster="list[leftIndex].imgUrl"
          muted
          class="video"
        />
        <div v-else class="image" :style="{ backgroundImage: `url(${list[leftIndex].imgUrl})` }"/>
      </div>
      <div class="item center">
        <template v-if="list[centerIndex].videoUrl">
          <video
            ref="videoCenter"
            :src="list[centerIndex].videoUrl"
            :poster="list[centerIndex].imgUrl"
            muted
            loop
            class="video"
            @click="openVideoPreview"
          />
          <span v-if="!playing" class="play-icon" tabindex="0" role="button" aria-label="打开视频预览" @click="openVideoPreview" @keydown.enter.prevent.stop="openVideoPreview" @keydown.space.prevent.stop="openVideoPreview"/>
        </template>
        <div v-else class="image" :style="{ backgroundImage: `url(${list[centerIndex].imgUrl})` }" @click="openImagePreview"/>
      </div>
      <div class="item right">
        <video
          v-if="list[rightIndex].videoUrl"
          :src="list[rightIndex].videoUrl"
          :poster="list[rightIndex].imgUrl"
          muted
          class="video"
        />
        <div v-else class="image" :style="{ backgroundImage: `url(${list[rightIndex].imgUrl})` }"/>
      </div>
      <span class="arrow-right" tabindex="0" role="button" aria-label="下一张" @click="handleClick('right')" @keydown.enter.prevent.stop="handleClick('right')" @keydown.space.prevent.stop="handleClick('right')"/>
    </div>
    <ul class="process-line">
      <li v-for="(item, index) in list" :key="index" :class="['line-item', centerIndex===index?'current':'']" tabindex="0" role="button" :aria-label="'第' + (index+1) + '张'" @click="clickProcess(index)" @keydown.enter.prevent.stop="clickProcess(index)" @keydown.space.prevent.stop="clickProcess(index)"/>
    </ul>
    <ImagePreviewDialog :visible="previewVisible" :src="previewSrc" :type="previewType" @close="previewVisible = false" />
  </section>
</template>
<script>
import ImagePreviewDialog from '../ImagePreviewDialog.vue'
export default {
  components: { ImagePreviewDialog },
  props: {
    baseInfo: {
      default: null,
      type: Object
    }
  },
  data() {
    return {
      curIndex: 0,
      playing: false,
      previewVisible: false,
      previewSrc: '',
      previewType: 'image'
    }
  },
  computed: {
    detailTitle() {
      return this.baseInfo && String(this.baseInfo.bannerTemplateType) === '3'
        ? '游戏预览'
        : '游戏详情'
    },
    list() {
      return this.baseInfo?.gamePreviewInfos || []
    },
    leftIndex() {
      return this.curIndex - 1 < 0 ? this.list.length - 1 : this.curIndex - 1
    },
    rightIndex() {
      return this.curIndex + 1 >= this.list.length ? 0 : this.curIndex + 1
    },
    centerIndex() {
      return this.curIndex >= this.list.length ? 0 : this.curIndex
    }
  },
  methods: {
    openImagePreview() {
      this.previewSrc = this.list[this.centerIndex].imgUrl
      this.previewType = 'image'
      this.previewVisible = true
    },
    openVideoPreview() {
      this.previewSrc = this.list[this.centerIndex].videoUrl
      this.previewType = 'video'
      this.previewVisible = true
    },
    clickProcess(index) {
      this.clearVideoCenter()
      this.curIndex = index
    },
    clickPlay() {
      if (this.playing) {
        this.$refs.videoCenter?.pause()
      } else {
        this.$refs.videoCenter?.play()
      }
      this.playing = !this.playing
    },
    handleClick(direction) {
      this.clearVideoCenter()
      if (direction === 'left') {
        this.curIndex--
      } else {
        this.curIndex++
      }
      this.curIndex = this.curIndex < 0 ? this.list.length - 1 : (this.curIndex >= this.list.length ? 0 : this.curIndex)
    },
    clearVideoCenter() {
      this.playing = false
      if (this.$refs.videoCenter) {
        this.$refs.videoCenter.pause()
        this.$refs.videoCenter.currentTime = 0
        this.$refs.videoCenter.src = null
      }
    }
  },
  beforeUnmount() {
    // 清理视频资源
    this.clearVideoCenter()
  }
}
</script>
<style lang="scss" scoped>
.GameDetail {
  width: 87vw;
  max-width: 1000px;
  margin: 0 auto;
  h1.title {
    margin-top: 63px;
    position: relative;
    text-align: center;
    span {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 2px;
      background-image: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    &::before {
      content: '';
      position: absolute;
      top: -19px;
      background: transparent url('~@/images/Index/game-detail.png') no-repeat center center/ contain;
      width: 192px;
      height: 21px;
      left: 50%;
      transform: translate(-47%, 0);
    }
  }
  .container {
    position: relative;
    display: flex;
    justify-content: space-around;
    padding: 48px 0;
    .arrow-left {
      cursor: pointer;
      position: absolute;
      top: 50%;
      left: -20px;
      width: 25px;
      height: 33px;
      transform: translate(-50%, -50%);
      background: transparent url('~@/images/Index/arrow-left.png') no-repeat center center/ contain;
    }
    .arrow-right {
      cursor: pointer;
      position: absolute;
      top: 50%;
      right: -20px;
      width: 25px;
      height: 33px;
      transform: rotate(180deg) translate(-50%, -50%);
      transform-origin: top;
      background: transparent url('~@/images/Index/arrow-left.png') no-repeat center center/ contain;
    }
    .item {
      width: 46vw;
      max-width: 490px;
      // height: 28.75vw;
      aspect-ratio: 16/9;
      flex-basis: auto;
      flex-grow: 0;
      .image, video {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .image {
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        background-color: #000;
      }
    }
    .center {
      z-index: 2;
      position: absolute;
      left: 50%;
      transform: translate(-50%) scale(1.26);
      .play-icon {
        cursor: pointer;
        position: absolute;
        top: 50%;
        left: 50%;
        width: 42px;
        height: 42px;
        transform: translate(-50%, -50%);
        background: transparent url('~@/images/Index/play-icon.png') no-repeat center center/ contain;
      }
    }
    .left, .right {
      z-index: 1;
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
      }
    }
  }
  .process-line {
    display: flex;
    justify-content: center;
    gap: 10px;
    .line-item {
      cursor: pointer;
      width: 30px;
      height: 6px;
      border: 1px solid;
      border-image: linear-gradient(245deg, #fff, #999) 1;
      &.current {
        border: 0 none;
        background: linear-gradient(180deg, #929292 0%, #EAF7FF 100%);
      }
    }
  }
}

</style>

<style scoped>
.GameDetail .container .arrow-left:focus-visible,
.GameDetail .container .arrow-right:focus-visible,
.GameDetail .container .center .play-icon:focus-visible,
.GameDetail .process-line .line-item:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .GameDetail .container .arrow-left:focus-visible,
  .GameDetail .container .arrow-right:focus-visible,
  .GameDetail .container .center .play-icon:focus-visible,
  .GameDetail .process-line .line-item:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
