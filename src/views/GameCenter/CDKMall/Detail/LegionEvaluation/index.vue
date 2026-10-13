<template>
  <section class="LZ-wrap">
    <h4 class="title-wrap" ref="LZTitle">
      <span class="title">{{ BRAND_TEXT_CHINESE }}玩家评测
      </span>
      <span v-if="!myEvaluationData" class="write-btn" tabindex="0" role="button" aria-label="写评测" @click="clickWriteEval" @keydown.enter.prevent.stop="clickWriteEval" @keydown.space.prevent.stop="clickWriteEval"><i class="icon" aria-hidden="true"></i>写评测</span>
    </h4>
    <div v-if="$isPhoneDevice" class="description-wrap">
      <div class="description">共{{ detail.softDesc.reviewsCount || 0 }}条评测，推荐{{ detail.softDesc.positiveReviewTotal || 0
      }}条，不推荐{{ detail.softDesc.negativeReviewTotal || 0 }}条</div>
    </div>
    <div class="content-wrap">
      <div class="triangle-bottom"></div>
      <div class="num-wrap">
        <div class="rectangle-top"></div>
        <div class="triangle-bottom"></div>
        <div class="num-item">
          <div class="back-critical-img"></div>
          <div class="text">总推荐率</div>
          <template v-if="detail.softDesc.positiveReviewRate">
            <div class="num">{{ detail.softDesc.positiveReviewRate }}</div>
            <span class="symbol-100">%</span>
            <img
              src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/13/dce7b645-dd6e-41e0-a161-653aeba3c2fb.png"
              class="symbol-img" />
          </template>
          <template v-else>
            <div class="text-class" style="margin-top: 24px;">暂无</div>
          </template>
        </div>
        <div class="line" />
        <div class="num-item">
          <div class="back-critical-img"></div>
          <div class="text">近期推荐率</div>
          <template v-if="detail.softDesc.recentPositiveReviewRate">
            <div class="num">{{ detail.softDesc.recentPositiveReviewRate }}</div>
            <span class="symbol-100">%</span>
            <img
              src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/13/dce7b645-dd6e-41e0-a161-653aeba3c2fb.png"
              class="symbol-img" />
          </template>
          <template v-else>
            <div class="text-class" style="margin-top: 24px;">暂无</div>
          </template>
        </div>
        <div class="line" v-if="!$isPhoneDevice" />
        <div class="recommand-evaluate" v-if="!$isPhoneDevice">
          <div>共{{ detail.softDesc.reviewsCount || 0 }}条评测</div>
          <div>推荐{{ detail.softDesc.positiveReviewTotal || 0 }}条</div>
          <div>不推荐{{ detail.softDesc.negativeReviewTotal || 0 }}条</div>
        </div>
      </div>
    </div>

    <EvaluationItem
      v-if="myEvaluationData"
      customize-class="my-evaluation"
      :soft-name="detail.softName"
      :evaluation-detail="myEvaluationData"
      :cur-write-content-id="curWriteContentId"
      :_state-game="_stateGame"
      :_state-page="_statePage"
      :_game-class="_gameClass"
      @updateCurId="(val) => (curWriteContentId = val)"
      @deleteEvaluation="deleteEvaluation(myEvaluationData)" />

    <h4 class="eva-title-wrap" v-if="!emptyEvaluation">
      <el-select
        popper-class="lgSelectDropdown"
        class="lgSelect"
        v-model="filterEvaluation"
        @change="changeSortValue(sortValue)">
        <el-option label="全部" :value="999"></el-option>
        <el-option label="推荐" :value="1"></el-option>
        <el-option label="不推荐" :value="0"></el-option>
      </el-select>
      <el-select
        popper-class="lgSelectDropdown"
        class="lgSelect"
        v-model="sortValue"
        @change="changeSortValue(sortValue)">
        <el-option label="最热" value="likeCount"></el-option>
        <el-option label="最新" value="createTime"></el-option>
      </el-select>
    </h4>
    <template v-if="evaluationData">
      <div v-if="!evaluationData.records.length" class="no-content">
        <span class="empty-icon"></span>
        <p class="text">暂无评测</p>
      </div>
      <template v-else>
        <ul class="eva-list">
          <EvaluationItem
            v-for="item in evaluationData.records"
            :key="item.id"
            :soft-name="detail.softName"
            :evaluation-detail="item"
            :cur-write-content-id="curWriteContentId"
            :_state-game="_stateGame"
            :_state-page="_statePage"
            :_game-class="_gameClass"
            @updateCurId="(val) => (curWriteContentId = val)"
            @deleteEvaluation="deleteEvaluation(item)" />
        </ul>
      </template>
    </template>
    <EvaluatioinDialog
      :soft-name="detail.softName"
      :show="showEvaDialog"
      :user-review-info="userReviewInfo"
      :state-game="_stateGame"
      :state-page="_statePage"
      :game-class="_gameClass"
      @closeDialog="showEvaDialog = false"
      @addMyEvaluation="$emit('addMyEvaluation')" />
  </section>
</template>
<script>
import EvaluationItem from './EvaluationItem.vue'
import EvaluatioinDialog from '../EvaluatioinDialog.vue'

import { searchGameViews, deleteGameViews } from '@/api/gameEvaluation'

import { getCurrentBrandConfig } from '@/assets/text'

export default {
  components: {
    EvaluationItem,
    EvaluatioinDialog
  },
  props: {
    canWriteReview: {
      type: Boolean,
      default: false
    },
    myEvaluationData: {
      type: Object,
      default: null
    },
    detail: {
      type: Object,
      default: null
    },
    userReviewInfo: {
      type: Object,
      default: null
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
      nomore: false,
      fetching: false,
      showMoreEvaList: false, // 默认展示3个，点击展开更多+翻页按钮
      evaluationData: null, // 评测列表数据
      filterEvaluation: 999, // 筛选项，999全部 1推荐 0不推荐
      sortValue: 'likeCount', // 排序项，createTime最新，likeCount最热
      curWriteContentId: 0, // 维护当前展开的输入框id，页面中只能有一个输入框，且我的评测需要区分开 999999
      showEvaDialog: false,
      startTime: null,
      emptyEvaluation: false,
      query: {
        softId: this.$route.params.id,
        current: 1,
        size: 10,
        parentId: 0,
        orderClumn: 'likeCount'
      },
      BRAND_TEXT_CHINESE: getCurrentBrandConfig('BRAND_TEXT_CHINESE')
    }
  },
  computed: {
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  methods: {
    getMoreEvaluation() {
      this.init(false)
    },
    handleCurrentChange(val) {
      this.query.current = val
      this.init()

      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: 9,
        nameAndId: `${this.detail.softName}_${this.detail.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    deleteEvalAPI(detail) {
      deleteGameViews({
        reviewsId: detail.id,
        softId: this.$route.params.id
      }).then((res) => {
        const index = this.evaluationData.records.findIndex(
          (item) => item.id === detail.id
        )
        this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
          clickType: 12,
          nameAndId: `${this.detail.softName}_${this.detail.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
        })
        this.evaluationData.records.splice(index, 1)
        this.$emit('deleteMyEvaluation')
      })
    },
    deleteEvaluation(detail) {
      this.$lzconfirm({
        type: 'warning',
        message: '确定删除此测评吗？',
        confirmButtonText: '确认'
      }).then(() => {
        this.deleteEvalAPI(detail)
      })
    },
    clickWriteEval() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailWriteReviewEnterClick', 'click', {
        nameAndId: `${this.detail.softName}_${this.detail.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
      if (this.canWriteReview) {
        if (this.$isPhoneDevice) {
          this.$emit('showPhoneDialog')
        } else {
          this.showEvaDialog = true
        }
      } else {
        this.$lzconfirm({
          type: 'warning',
          message: '无法发布评测',
          subMessage: this.userReviewInfo?.userSoftReviews ? '您已发布过评测。' : '请将游戏添加至“我的游戏”并记录时长后发布评测。',
          confirmButtonText: '确认',
          showCancelButton: false
        })
      }
    },
    changeSortValue(val) {
      this.query.orderClumn = val
      this.nomore = false
      this.init(true)

      const clickType = val === 'likeCount' ? 4 : 5 // 4.最热 5.最新
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType,
        nameAndId: `${this.detail.softName}_${this.detail.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    changeFilterEvaluation(val) {
      this.filterEvaluation = val
      this.nomore = false
      this.init(true)

      const clickType = (val === 999) ? 1 : (val === 1 ? 2 : 3) // 1.全部评测结果 2.推荐 3.不推荐
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType,
        nameAndId: `${this.detail.softName}_${this.detail.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    refreshPage() {
      this.init(true, '', true)
    },
    init(refresh, scrollToEval = '', firstSearch = false) {
      if (this.nomore || this.fetching) return
      this.fetching = true
      if (this.filterEvaluation === 999) {
        delete this.query.result
      } else {
        this.query.result = this.filterEvaluation
      }
      if (refresh) {
        this.query.current = 1
        this.query.size = 10
        delete this.query.startTime
      } else {
        this.query.startTime = this.startTime
      }
      searchGameViews(JSON.parse(JSON.stringify(this.query))).then((res) => {
        this.query.current = res.data.current + 1
        this.nomore = res.data.records.length < res.data.size
        if (refresh) {
          this.evaluationData = res.data
        } else {
          this.evaluationData.records = this.evaluationData.records.concat(res.data.records)
        }
        this.startTime = res.data.startTime
        this.$nextTick(() => {
          if (scrollToEval) {
            this.$parent.$refs.scrollDom.scrollTop =
              this.$refs.LZTitle.getBoundingClientRect().top - 158
          }
        })
        if (firstSearch) {
          if (this.evaluationData.records.length === 0) {
            this.emptyEvaluation = true
          } else {
            this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsShow', 'pv', {
              nameAndId: `${this.detail.softName}_${this.detail.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
            })
          }
        }
      }).finally(() => {
        this.fetching = false
      })
    }
  },
  mounted() {
    const scrollToEval = this.$route.query.scrollTo || ''
    this.init(true, scrollToEval, true)
  }
}
</script>
<style lang="scss" scoped>
.nomore {
  text-align: center;
  color: rgb(234 247 255 / 60%);
  margin-top: 20px;
}

.more-eva {
  cursor: pointer;
  width: max-content;
  margin: 27px auto;
  color: rgba(234, 247, 255, 0.4);
  font-size: 14px;
  font-weight: 400;
}

.LZ-wrap {
  padding: 40px 20px 20px 0;

  .title-wrap {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .title {
      color: rgba(234, 247, 255, 1);
      font-size: 16px;
      font-weight: 700;
    }

    .write-btn {
      cursor: pointer;
      font-size: 15px;
      font-weight: 500;
      color: rgba(56, 110, 254, 1);

      .icon {
        display: inline-block;
        margin-right: 3px;
        vertical-align: -2px;
        width: 16px;
        height: 16px;
        background: transparent url("~@/images/gamecenter/detail/write-evaluation.png") no-repeat center center / cover;
      }
    }

  }

  .eva-list {
    margin-top: -4px;
  }

  .no-content {
    margin-top: 20px;
    text-align: center;
    padding: 43.7px 0;
    border: 1px solid;
    border-image: linear-gradient(180deg,
        rgba(58, 61, 64, 0.2) 0%,
        rgba(116, 121, 126, 0.2) 6.63%,
        rgba(80, 87, 94, 0.2) 100%) 1;
    background: linear-gradient(0deg,
        rgba(33, 34, 38, 0.5) 0%,
        rgba(17, 18, 21, 0.5) 100%);

    .empty-icon {
      display: inline-block;
      width: 38px;
      height: 38px;
      background: transparent url("~@/images/gamecenter/detail/empty-icon.png") no-repeat center center / cover;
    }

    .text {
      color: #EAF7FF;
      opacity: 0.1;
      font-size: 12px;
      line-height: 14px;
      margin-top: 10px;
    }
  }

  .content-wrap {
    position: relative;

    .triangle-bottom {
      position: absolute;
      right: 0px;
      bottom: 0px;
      width: 20px;
      height: 20px;
      background: linear-gradient(to bottom right,
          /* 斜线方向：从左下到右上 */
          transparent 0%,
          /* 起点透明 */
          transparent calc(50% - 0.5px),
          /* 接近斜线时透明 */
          rgba(255, 255, 255, 0.6) calc(50% + 0.5px),
          /* 斜线起点（1px宽度） */
          rgba(255, 255, 255, 0.6) calc(50% + 0.5px),
          /* 斜线终点（1px宽度） */
          transparent calc(50% + 0.5px)
          /* 斜线后透明 */
        ),
        linear-gradient(to bottom right,
          transparent calc(50% + 7px),
          #fff calc(50% + 7px)),
        linear-gradient(to bottom right,
          transparent 50%,
          #000 50%),
    }
  }

  .num-wrap {
    overflow: hidden;
    margin-top: 17px;
    display: flex;
    width: 100%;
    justify-content: space-evenly;
    text-align: center;
    padding: 24px 0px 20px;
    height: 120px;
    margin-bottom: 48px;
    border: 1px solid;
    border: 1px solid;
    border-image: linear-gradient(to right,
        rgba(255, 255, 255, 0.1) 0%,
        rgba(255, 255, 255, 0.15) 100%) 1;
    background: rgba(255, 255, 255, 0.05);

    .rectangle-top {
      position: absolute;
      top: -1px;
      left: -1px;
      width: 74px;
      height: 13px;
      background: transparent url("https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/19/cf112a70-4d03-4b43-b808-9325979ecc0b.png") no-repeat center center / cover;
    }

    .num-item {
      position: relative;
      height: 74px;

      .text-class {
        font-family: "Microsoft YaHei";
        color: #EAF7FF;
        font-weight: 700;
      }

      .back-critical-img {
        position: absolute;
        bottom: -20px;
        left: 0px;
        height: 117px;
        width: 224px;
        transform: translate(-37px, 0%);
        background: transparent url("./back-critical.png") no-repeat center center / cover;
        opacity: 0.8;
      }

      .symbol-img {
        position: absolute;
        bottom: 10px;
        left: 0;
        width: 100%;
        object-fit: cover;
      }
    }

    .recommand-evaluate {
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: rgba(234, 247, 255, 0.80);
      font-size: 12px;
    }

    .line {
      width: 1px;
      height: 72px;
      background: #EAF7FF;
      opacity: 0.1;

    }

    .text {
      //flex: 1;
      color: rgba(234, 247, 255, 0.8);
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      height: 18px;
      width: 130px;
      margin-bottom: 8px;
      margin-top: 4px;
    }

    .fenge {
      display: inline-block;
      width: 1px;
      height: 35px;
      transform: scaleX(0.5);
      background-color: rgba(255, 255, 255, 0.2);
    }

    .symbol-100 {
      display: inline-block;
      transform: skewX(-12deg);
      font-size: 17px;
      font-weight: 800;
      background: linear-gradient(178deg, #929292 1.87%, #eaf7ff 97.88%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .num {
      font-family: Orbitron;
      display: inline-block;
      transform: skewX(-12deg);
      margin-left: 4px;
      font-size: 36px;
      font-weight: 800;
      background: linear-gradient(178deg, #929292 1.87%, #eaf7ff 97.88%);
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: "Orbitron";
      vertical-align: -2px;
    }

  }

  .eva-title-wrap {
    margin-top: 48px;
    display: inline-flex;
    gap: 16px;
    align-items: center;
  }
}


:deep(.el-radio__label) {
  font-weight: 400;
  vertical-align: -1px;
  padding-left: 9px;
}

:deep(.el-radio__inner) {
  background: #fff;
  width: 14px;
  height: 14px;
}

:deep(.lgSelect:hover .el-select__wrapper),
:deep(.lgSelect:hover .el-input__inner) {
  border-color: rgba(234, 247, 255, 0.2);
}

:deep(.lgSelect .el-select__wrapper) {
  min-height: 36px;
  width: 120px;
  padding: 7px 7px 7px 12px;
  user-select: none;
  font-size: 14px;
  font-weight: 400;
  color: rgba(234, 247, 255, 0.6) !important;
  background: transparent;
  border-color: rgba(234, 247, 255, 0.2);
  box-shadow: none;
}

:deep(.lgSelect .el-select__wrapper.is-focused),
:deep(.lgSelect .el-select__wrapper:focus-within),
:deep(.lgSelect .el-input.is-focus .el-input__inner),
:deep(.lgSelect .el-input__inner:focus) {
  border-color: rgba(234, 247, 255, 0.2);
  box-shadow: none;
}

:deep(.lgSelect .el-input__inner) {
  height: 36px;
  line-height: 36px;
  width: 120px;
  padding: 7px 7px 7px 12px;
  user-select: none;
  font-size: 14px;
  font-weight: 400;
  color: rgba(234, 247, 255, 0.6) !important;
}

:deep(.lgSelect .el-select__caret),
:deep(.lgSelect .el-input__icon) {
  width: 28px !important;
  height: 32px !important;
  line-height: 32px;
  color: rgba(234, 247, 255, 0.6);
}


.pagination-wrap {
  transform: scale(0.8);
  margin: 30px auto;
  text-align: center;



    :deep(.el-pagination) {
    .btn-prev,
    .btn-next {
      border-radius: 0;
      background: linear-gradient(180deg, #0a0a0a 0%, #232323 100%);
      border: 1px solid;
      border-image: linear-gradient(180deg, #121212 0%, #2d2d2d 100%) 1;
      box-shadow: 0 2px rgb(23 23 23);
    }

    .el-icon-more {
      background: 0 none;
    }

    .el-pager li {
      background: 0 none;
    }

    .el-pager li:not(.disabled):hover {
      color: #fff;
    }

    .el-pager li.number {
      font-size: 15px;
      font-weight: 400;
      color: rgba(255, 255, 255, 1);
      background: transparent;
      border-radius: 0;
      border: 1px solid;
      border-image: linear-gradient(180deg, #121212 0%, #2d2d2d 100%) 1;
      box-shadow: 0 2px rgb(23 23 23);
    }

    .el-pager li:not(.disabled).active {
      cursor: pointer;
      background: linear-gradient(180deg, #0a0a0a 0%, #232323 100%);
    }

    .el-pager li:not(.disabled):hover {
      color: rgba(255, 255, 255, 0.6);
    }

    .el-icon-arrow-right::before,
    .el-icon-arrow-left::before {
      content: "";
      display: inline-block;
      width: 6px;
      height: 8px;
      background: transparent url("~@/images/gamecenter/detail/pagi-arrow.png") no-repeat center center / contain;
    }

    .el-icon-arrow-left::before {
      transform: rotateZ(180deg);
    }

    button[disabled="disabled"] {
      opacity: 0.6;
    }
  }

}

@media screen and (min-width: 1500px) {
  .LZ-wrap .num-wrap .text.red {
    margin-left: -5.5vw;
  }
}

.PadDevice {
  .LZ-wrap {
    padding-right: 0px;
  }

  @media screen and (max-width: 800px) {
    .LZ-wrap .num-wrap .num {
      font-size: 28px;
    }

    .LZ-wrap .num-wrap .num-item .symbol-img {
      bottom: 15px;
    }

    .LZ-wrap .num-wrap {
      margin-bottom: 4vw;
    }

    .LZ-wrap .eva-title-wrap {
      margin-top: 4vw;
    }
  }
}

.PhoneDevice {
  .title-wrap {
    margin-bottom: 8px;
  }
  .eva-title-wrap {
    margin-top: 32px;
  }
  .description-wrap {
    //margin-top: 16px;
    color: rgba(234, 247, 255, 0.60);
    font-size: 14px;
  }
  .LZ-wrap {
    padding: 0;
    margin-top: 32px;
    .title-wrap {
      .write-btn {
        font-weight: 700;
      }
    }
    .num-wrap {
      margin-bottom: 0px;
    }
  }
}

.LZ-wrap .write-btn:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .LZ-wrap .write-btn:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
