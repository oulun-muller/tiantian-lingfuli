<template>
  <div class="ai-content" ref="aiContent">
    <!-- <div v-if="showTopShadow" class="top-shadow"></div> -->
    <div v-if="showBottomShadow" class="bottom-shadow"></div>
    <h3 class="title">
      <div class="flex-alien-center">
        <div class="icon"/>
        <span class="ai-title">AI测评</span>
      </div>
      <span class="ai-change" tabindex="0" role="button" aria-label="换一换AI测评" @click="changeAIContent" @keydown.enter.prevent.stop="changeAIContent" @keydown.space.prevent.stop="changeAIContent">换一换</span>
    </h3>
    <p class="fenge"></p>
    <p ref="scrollContent" @scroll="scrollContent" class="content" v-html="contentHtml">
    </p>
    <div class="ai-border"></div>
    <!-- <div ref="startSvga" class="ai-start-svga"></div>
    <div ref="loadSvga" class="ai-loading-svga"></div> -->
  </div>
</template>
<script>
import resolveAsset from '@/compat/resolveAsset'

import MarkdownIt from 'markdown-it'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { generateNewParams } from '@/utils/generateParams.js'
import SVGA from 'svgaplayerweb'

export default {
  props: {
    aiContent: {
      type: String,
      default: ''
    },
    softName: {
      type: String,
      default: ''
    },
    _stateGame: {
      type: Number,
      default: null
    },
    _statePage: {
      type: Number,
      default: null
    },
    _gameClass: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      markDownText: '', // 流式返回的内容
      markdownRender: new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true
      }),
      AIEvaluationList: [],
      startPlayer: null, // 开始动画
      loadPlayer: null, // 加载中动画
      aiLoading: false,
      showText: '', // 显示打印效果的内容
      textIndex: 0, // 内容每个字的下标
      clockPrint: null,
      ctrl: null,
      softId: this.$route.params.id,
      showTopShadow: false,
      showBottomShadow: true
    }
  },
  computed: {
    renderMdText() {
      return (text) => {
        return this.markdownRender.render(text)
      }
    },
    contentHtml() {
      return this.renderMdText(this.showText) + '<div class="bottom-node" ref="bottomNode"></div>'
    }
  },
  methods: {
    scrollContent() {
      if (this.$refs.scrollContent.scrollTop > 0) {
        this.showTopShadow = true
      } else {
        this.showTopShadow = false
      }
      if (this.$refs.scrollContent.scrollHeight > this.$refs.scrollContent.clientHeight) {
        this.showBottomShadow = true
      } else {
        this.showBottomShadow = false
      }
      if (this.$refs.scrollContent.scrollTop + this.$refs.scrollContent.clientHeight >= this.$refs.scrollContent.scrollHeight - 18) {
        this.showBottomShadow = false
      }
    },
    async fetchEventSourceFn(url, data) {
      const _this = this
      url = process.env.GATEWAY + '/cloud-legionzone-game-activity-start/api/v1/soft/ai/reviews'
      data = await generateNewParams({
        softId: this.softId
      })

      this.ctrl = new AbortController()

      const headers = {
        'Content-Type': 'application/json'
      }
      if (this.$store.state.user.userInfo && this.$store.state.user.userInfo.Token) {
        headers['token'] = this.$store.state.user.userInfo.Token
      }
      if (this.$store.state.user.userInfo && this.$store.state.user.userInfo.Realm) {
        headers['realm'] = this.$store.state.user.userInfo.Realm
      }
      if (window.LZ_SERVER_ENV_QA) {
        headers['n-d-version'] = 'qa'
      }
      const source = fetchEventSource(url, {
        method: 'POST',
        headers: headers,
        openWhenHidden: true,
        body: JSON.stringify(data),
        signal: _this.ctrl.signal,
        onopen: async(response) => {
          if (response.ok && response.headers.get('content-type') === 'text/event-stream') {
            // 连接成功
            _this.printContent()
            return
          } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            _this.clearAllClock()
            return
          } else {
            _this.clearAllClock()
            return
          }
        },
        onmessage: (msg) => {
          const data = JSON.parse(msg.data)
          // eslint-disable-next-line eqeqeq
          if (data.code != 10000) {
            _this.loadPlayer?.stopAnimation(true)
            _this.loadPlayer?.clear()
            _this.clearAllClock()
            source.close()
            return
          } else {
            let result = JSON.parse(msg.data)
            result = result.data
            const isEnd = result.isEnd
            const text = result.result
            _this.markDownText += text
            // 结束了
            if (isEnd === 'true') {
              _this.aiLoading = false
              _this.outputDone()
              _this.ctrl.abort()
            }
          }
        },
        onclose() {
          _this.clearAllClock()
        },
        onerror() {
          _this.clearAllClock()
        }
      })
    },
    changeAIContent() {
      // 如果正在生成，提示不能点击
      if (this.aiLoading) {
        this.$message({
          message: '正在生成，请稍后...',
          type: 'warning',
          duration: 2500,
          customClass: 'lg-message--warning'
        })
        return
      }
      this.aiLoading = true
      this.markDownText = ''
      this.showText = ''
      this.textIndex = 0
      this.fetchEventSourceFn()
      // this.startAnimate()

      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailAIGameReviewSwapOutClick', 'click', {
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    printContent() {
      if (this.clockPrint) { clearTimeout(this.clockPrint) }
      // 如果加载完成 且 内容全部打印完，则清空定时器 清除加载动画
      if ((!this.aiLoading && this.textIndex >= this.markDownText.length) || this.textIndex > 1000) {
        clearTimeout(this.clockPrint)
        this.loadPlayer?.stopAnimation(true)
        this.loadPlayer?.clear()
        return
      }
      this.clockPrint = setTimeout(() => {
        if (this.textIndex < this.markDownText.length) {
          this.textIndex = this.textIndex + 1
          this.showText = this.markDownText.slice(0, this.textIndex)
          if (this.$refs.scrollContent.clientHeight >= 450) {
            this.scrollToBottom()
          }
        }
        this.printContent()
      }, 40)
    },
    scrollToBottom() {
      this.$nextTick(() => {
        document.querySelector('.bottom-node') && document.querySelector('.bottom-node').scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      })
    },
    startAnimate() {
      // 播放 开始动画
      this.startPlayer = new SVGA.Player('.ai-start-svga')
      const parser = new SVGA.Parser('.ai-start-svga')
      parser.load(resolveAsset('images/gamecenter/detail/ai-loading-start.svga'), videoItem => {
        this.startPlayer.setVideoItem(videoItem)
        this.startPlayer.startAnimation()
        this.$nextTick(() => {
          const { clientWidth, clientHeight } = this.$refs.aiContent
          const scaleXNum = ((clientWidth * 2) / 536).toFixed(2)
          const translateXNum = ((scaleXNum * 536 - 536) / 4).toFixed(2)
          this.$refs.startSvga.querySelector('canvas').style.scale = `${scaleXNum} ${(clientHeight * 2) / 1120}`
          this.$refs.startSvga.querySelector('canvas').style.translate = `${scaleXNum > 1.2 ? translateXNum - 8 : translateXNum}px  0`
        })
        setTimeout(() => {
          this.startPlayer.stopAnimation(true)
          this.startPlayer.clear()
          this.startLoadAnimate()
        }, 1000)
      })
    },
    startLoadAnimate() {
      // 播放 加载中动画
      this.loadPlayer = new SVGA.Player('.ai-loading-svga')
      const parser = new SVGA.Parser('.ai-loading-svga')
      parser.load(resolveAsset('images/gamecenter/detail/ai-loading.svga'), videoItem => {
        this.loadPlayer?.setVideoItem(videoItem)
        this.loadPlayer?.startAnimation()
        this.$nextTick(() => {
          const { clientWidth, clientHeight } = this.$refs.aiContent
          const scaleXNum = ((clientWidth * 2) / 536).toFixed(2)
          const translateXNum = ((scaleXNum * 536 - 536) / 4).toFixed(2)
          this.$refs.loadSvga.querySelector('canvas').style.scale = `${scaleXNum} ${(clientHeight * 2) / 1120}`
          this.$refs.loadSvga.querySelector('canvas').style.translate = `${scaleXNum > 1.2 ? translateXNum - 8 : translateXNum}px  0`
        })
      })
    },
    outputDone() {
      // 输出结束之后，将内容保存到本地，大于20个时，去掉第一个，再加到数组中
      const existSoftIdIndex = this.AIEvaluationList.findIndex(item => item.softId === this.softId)
      if (existSoftIdIndex !== -1) {
        this.AIEvaluationList[existSoftIdIndex].aiContent = this.markDownText
      } else {
        if (this.AIEvaluationList.length >= 20) {
          this.AIEvaluationList.shift()
        }
        this.AIEvaluationList.push({
          softId: this.softId,
          aiContent: this.markDownText
        })
      }
      window.sessionStorage.setItem('LZ_AI_EVALUATION_LIST', JSON.stringify(this.AIEvaluationList))
    },
    clearAllClock() {
      clearTimeout(this.clockPrint)
      this.startPlayer?.stopAnimation(true)
      this.startPlayer?.clear()
      this.loadPlayer?.stopAnimation(true)
      this.loadPlayer?.clear()
      this.ctrl?.abort()
    }
  },
  mounted() {
    // 优先从缓存中取，如果没有，取数据传进来的默认值
    this.AIEvaluationList = JSON.parse(window.sessionStorage.getItem('LZ_AI_EVALUATION_LIST') || '[]')
    const existSoftIdIndex = this.AIEvaluationList.findIndex(item => item.softId === this.softId)
    if (existSoftIdIndex !== -1) {
      this.showText = this.AIEvaluationList[existSoftIdIndex].aiContent
    } else {
      this.showText = this.aiContent
    }

    this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailAIGameReviewShow', 'pv', {
      nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
    })
  },
  beforeUnmount() {
    this.clearAllClock()
  }
}
</script>
<style lang="scss" scoped>
.ai-start-svga, .ai-loading-svga {
  z-index: 3;
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
}
.ai-content {
  position: relative;
   background-color: rgba(255,255,255,0.04);
  width: 100%;
  height: 560px;
  overflow: hidden;
  .top-shadow {
    z-index: 1;
    position: absolute;
    top: 61.6px;
    left: 2px;
    width: calc(100% - 4px);
    height: 72px;
    background: linear-gradient(0, rgba(255, 255, 255, 0.00) 0%,   rgba(0, 0, 0, 1) 100%);
  }

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 22px 24px 18px 24px;
    .icon {
      display: inline-block;
      height: 24px;
      width: 24px;
      background: transparent url('@/images/gamecenter/detail/star.png') no-repeat center center / cover;
    }
    .ai-title {
      font-size: 16px;
      font-weight: 700;
      background: linear-gradient(90deg, #3A4AC4 2.16%, #895A99 77.06%, #A4671F 96.73%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .ai-change {
      cursor: pointer;
      font-size: 12px;
      font-weight: 400;
      color: #EAF7FF;
      &::before {
        content: "";
        display: inline-block;
        width: 14px;
        height: 14px;
        margin-right: 4px;
        vertical-align: -2px;
        background: transparent url('~@/images/icon/circularRe.svg') no-repeat center center / cover;
      }
    }
  }
  .fenge {
    height: 1px;
    width: calc(100% - 46px);
    margin: 0 22px 0 24px;
    background: rgba(255, 255, 255, 0.20);
    transform: scaleY(.8);
  }
  .content {
    position: relative;
    overflow-y: scroll;
    max-height: calc(100% - 83px);
    padding: 8px 18px 18px 24px;
    margin-right: 8px;
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      border: 1px solid transparent;
      background-clip: padding-box;
      &:hover {
        background-clip: border-box;
      }
    }

    
      :deep(h3) {
        font-size: 14px;
      }
      :deep(h1) { margin: 10px 0; }
      :deep(h2) { margin: 10px 0; }
      :deep(h3) { margin: 10px 0; }
      :deep(h4) { margin: 10px 0; }
      :deep(li) {
        list-style: disc;
        margin-left: 15px;
        line-height: 26px;
        font-size: 12px;
        font-weight: 400;
      }
      :deep(p) {
        line-height: 26px;
        font-size: 12px;
        font-weight: 400;
      }
    
  }
  .ai-border {
    z-index: 2;
    pointer-events: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
                  border: 1px solid;
                border-image: linear-gradient(
                to right,
                rgba(255, 255, 255, 0.1) 0%,
                rgba(255, 255, 255, 0.15) 100%
              ) 1;
  // background: transparent url('https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/07774afb-cfb0-4274-bdef-0820dc3935e2.png') no-repeat center center / 100% 100%;
  //    background-image: linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.3));
  }
  .flex-alien-center {
    display: flex;
    align-items: center;
  }
}

.isPadDevice {
@media screen and (max-width: 800px) {
  .ai-content .ai-border {
    left: 30px;// 3.75vw;
    width: calc(100% - 60px);
  }
  .ai-content {
    background-color: transparent;
  }
}
}

.ai-content .ai-change:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .ai-content .ai-change:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
