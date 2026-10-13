<template>
  <div class="awards-wrap left-outer-layer">
    <h4 class="awards-title">
      <span class="title">媒体评分</span>
    </h4>
    <div class="marks-wrap">
      <div v-for="(scoreItem, key) in list.slice(0, 10)" :key="key">
        <span
          class="score-wrap"
          :style="`background: transparent url(&quot;${scoreItem.backgroundImg || scoreDefaultBac}&quot;) no-repeat top center / contain;`">
          <i class="name" :style="`color: ${scoreItem.fontColor || 'rgba(234, 247, 255, 1)'}`">{{
            scoreItem.mediaName }}</i>
          <i class="score" :style="`color: ${scoreItem.fontColor || 'rgba(234, 247, 255, 1)'}`">{{
            scoreItem.score }}<template v-if="scoreItem.scoreType === '3'">%</template></i>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: '',
  components: {},
  props: {
    list: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() { },
  mounted() { },
  methods: {}
}
</script>

<style scoped lang="scss">
.awards-wrap {
  flex: 1;
  width: 100%;
  margin-top: 32px;

  .text-stroke-around {
    font-size: 16px;
    font-style: normal;
    font-weight: 700;
    opacity: 0.3;
    color: #000;
    -webkit-text-stroke: 2px rgba(0, 0, 0, 0);
    background: -webkit-linear-gradient(-90deg, rgba(234, 247, 255, 0.8) 9%, rgba(140, 148, 153, 0.15) 88%);
    background-clip: text;
    text-align: center;
  }

  .img-wrap {
    padding: 0 10px;
    text-align: center;
  }

  .content-wrap {
    margin-bottom: 24px;

    &.fenge-line::after {
      content: "";
      margin: 20px auto 0 auto;
      display: block;
      width: 193px;
      height: 1px;
      background-color: #EAF7FF;
      opacity: 0.2;
      transform: scaleY(0.3);
    }

    &.img-info {
      display: inline-block;
      margin: 0 9px 10px 9px;
      text-align: center;

      &.fenge-line::after {
        margin-left: 0;
      }

      .text {
        word-break: break-all;
      }
    }

    img {
      width: 84px;
      height: 46px;
      object-fit: cover;
    }

    &.text-info {
      display: inline-block;
      width: 100%;

      .text {
        word-break: break-all;
        background: linear-gradient(177deg, #929292 2.19%, #EAF7FF 83.87%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
        font-size: 12px;

        &::before {
          content: '';
          width: 3px;
          height: 3px;
          background-color: #FC9010;
          margin-right: 7px;
          border-radius: 3px;
          display: inline-block;
          vertical-align: 3px;
          opacity: 0.44;
        }
      }
    }
  }

  .awards-title {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 30px;
    line-height: 20px;

    .title {
      font-size: 20px;
      background: linear-gradient(177deg, #929292 2.19%, #EAF7FF 83.87%);
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

  }

  .marks-wrap {
    margin: 0 0 14px 0;
    display: flex;
    text-align: center;
    overflow-y: scroll;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .score-wrap {
      width: 268px;
      height: 68px;
      font-size: 16px;
      font-weight: 700;
      margin: 0 auto;
      padding-left: 60px;
      display: flex;
      align-items: center;
      padding-right: 21px;
      justify-content: space-between;
      margin-right: 12px;

      i {
        text-align: left;
      }

      .name {
        display: inline-block;
        width: 100px;
        text-overflow: ellipsis;
        overflow: hidden;
        font-size: 16px;
        font-weight: 700;
        white-space: nowrap;
      }

      .score {
        font-size: 25px;
        font-weight: 700;
        font-style: italic;
      }
    }
  }
}
</style>
