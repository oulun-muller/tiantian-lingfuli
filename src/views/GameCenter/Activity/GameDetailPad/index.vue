<template>
  <section class="GameDetailPad" v-if="list.length>=3 && !isPreviewEmpty">
    <h1 class="title"><span>{{ detailTitle }}</span></h1>
    <div class="container" >
      <swiper v-if="list.length" ref="swiper" class="swiper-detail-wrap" :options="swiperOption" @transitionEnd="onChange">
        <swiper-slide v-for="(item, k) in list" :key="k" class="swiper-slide">
          <template v-if="item.videoUrl">
            <video
              :src="item.videoUrl"
              :poster="item.imgUrl"
              muted
              loop
              class="video"
              @click="openMediaPreview(k)"
            />
            <span class="play-icon" @click="openMediaPreview(k)"/>
          </template>
          <div v-else class="image" :style="{ backgroundImage: `url(${item.imgUrl})` }" @click="openMediaPreview(k)"/>
        </swiper-slide>
      </swiper>
      <!-- <span class="arrow-left" @click="handleClick('left')"/> -->
      <!-- <div class="item left">
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
            @click="clickPlay"
          />
          <span v-if="!playing" class="play-icon" @click="clickPlay"/>
        </template>
        <div v-else class="image" :style="{ backgroundImage: `url(${list[centerIndex].imgUrl})` }"/>
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
      </div> -->
      <!-- <span class="arrow-right" @click="handleClick('right')"/> -->
    </div>
    <ul class="process-line">
      <li v-for="(item, index) in list" :key="index" :class="['line-item', curIndex===index?'current':'']" @click="clickProcess(index)"/>
    </ul>
    <ImagePreviewDialog :visible="previewVisible" :src="previewSrc" :type="previewType" @close="previewVisible = false" />
  </section>
</template>
<script>
import { swiper, swiperSlide } from '@/compat/swiper' // 注意小写
import 'swiper/swiper-bundle.css' // Swiper 4.x 样式路径
import ImagePreviewDialog from '../ImagePreviewDialog.vue'

export default {
  props: {
    baseInfo: {
      default: null,
      type: Object
    }
  },
  data() {
    const vm = this
    return {
      curIndex: 0,
      playing: false,
      previewVisible: false,
      previewSrc: '',
      previewType: 'image',
      swiperOption: {
        slidesPerView: 'auto',
        // slidesPerView: 3,
        spaceBetween: 0,
        centeredSlides: true,
        observer: true,
        observeParents: true,
        on: {
          slideChange: function() {
            // 这里的 this 是 Swiper 实例
            vm.curIndex = this.realIndex
          }
        }
      }
    }
  },
  components: {
    swiper,
    swiperSlide,
    ImagePreviewDialog
  },
  computed: {
    detailTitle() {
      return this.baseInfo && String(this.baseInfo.bannerTemplateType) === '3'
        ? '游戏预览'
        : '游戏详情'
    },
    swiper() {
      return this.$refs.swiper?.swiper || null
    },
    list() {
      return this.baseInfo?.gamePreviewInfos || []
    },
    isPreviewEmpty() {
      const first = this.list[0]
      return !first || (first.imgUrl === '' && first.videoUrl === '')
    }
    //,
    // leftIndex() {
    //   return this.curIndex - 1 < 0 ? this.list.length - 1 : this.curIndex - 1
    // },
    // rightIndex() {
    //   return this.curIndex + 1 >= this.list.length ? 0 : this.curIndex + 1
    // },
    // centerIndex() {
    //   return this.curIndex >= this.list.length ? 0 : this.curIndex
    // }
  },
  methods: {
    openMediaPreview(index) {
      const mediaList = this.list.map(item => ({
        type: item.videoUrl ? 'video' : 'image',
        url: item.videoUrl || item.imgUrl,
        poster: item.imgUrl
      }))
      this.$mediaPlay(mediaList, index, () => {})
    },
    onChange(swiper) {
      const instance = swiper || this.$refs.swiper?.swiper
      if (!instance) return
      this.curIndex = instance.realIndex
    },
    clickProcess(index) {
      if (this.$refs.swiper?.swiper?.slideTo) {
        this.$refs.swiper.swiper.slideTo(index)
      }
      this.curIndex = index
    }
  }
}
</script>
<style lang="scss" scoped>
:deep(.swiper) {
  width: 100%;
}

:deep(.swiper-wrapper) {
  align-items: center;
  // height: 36.25vw;
  // max-height: 290px;
  // width: 100%;
  // height: 450px;
  // position: relative;
  // border-radius: 12px;
  // overflow: hidden;
  // box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.swiper-slide {
  // transform-origin: center;
  width: 46vw; // 确保每个幻灯片都是100%宽度
  height: 25.87vw;
  max-height: 207px;
  position: relative;
  &.swiper-slide-active {
    transition: all 0.3s;
    transform: scale(1.3);
    z-index: 1;
  }
}
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
.GameDetailPad {
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
    display: block;
    padding: 15px 0;
    // height: 43vw;
    // max-height: 300px;
    &.is-phone {
      height: 45vw;
      max-height: 200px;
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
:deep(.play-icon) {
  cursor: pointer;
  position: absolute;
  top: 50%;
  left: 50%;
  width: 42px;
  height: 42px;
  transform: translate(-50%, -50%);
  background: transparent url('~@/images/Index/play-icon.png') no-repeat center center/ contain;
}
.PhoneDevice{
  .GameDetailPad{
    width: calc(100% - 40px);
    .title{
      width: 193px;
      height: 50px;
      background: url('./images/activity_detail.svg');
      background-size: 193px 50px;
      margin: 0 auto;
      margin-top: 40px;
      &::before{
        display: none;
      }
      span{
        background: linear-gradient(178deg, #929292 1.88%, #EAF7FF 98.12%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 88.826px 71.061px rgba(255, 255, 255, 0.00), 0 19.84px 15.872px rgba(255, 255, 255, 0.00), 0 5.907px 4.726px rgba(255, 255, 255, 0.00);
        font-family: "Microsoft YaHei";
        font-size: 18px;
        font-style: normal;
        font-weight: 700;
        line-height: 40px; /* 222.222% */
        letter-spacing: 2px;
        text-transform: capitalize;
        display: block;
        width: fit-content;
        height: 40px;
        position: relative;
        top: 23px;
        left: 50%;
        transform: translateX(-50%);

      }
    }
    .container{
      margin-top: 15px;
      padding-bottom: 25px;
      :deep(div.swiper-slide-prev){
        opacity: 0.5;
      }
      :deep(div.swiper-slide-next){
        opacity: 0.5;
      }
    }

    .process-line{
      .line-item{
        border: 1px solid rgba(255,255,255,0.5);
        width: 14px;
        height: 6px;
        box-sizing: border-box;
      }
      .current{
        border: none;
        background: linear-gradient(176deg, #929292 28.47%, #EAF7FF 98.63%);
      }
    }
  }
}

.swiper-detail-wrap {
  height: 40vw;
  max-height: 400px;
}
</style>
