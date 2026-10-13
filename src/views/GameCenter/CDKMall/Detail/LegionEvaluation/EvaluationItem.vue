<template>
  <li :class="customizeClass" id="Evaluate" v-if="$isPhoneDevice">
    <!-- <span v-if="customizeClass==='my-evaluation'" class="tag">我发布的评测</span> -->
    <img
      v-if="customizeClass === 'my-evaluation'"
      src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/8daca8b5-26cf-4362-9262-99aaedd8ee20.png"
      class="tag" />
    <span class="selected" v-if="customizeClass !== 'my-evaluation' && evaluationDetail.selected">
      <img
        src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/0a3c8091-a211-46cd-91bb-932d848c95ec.png"
        alt="">
    </span>
    <div class="avator-wrap-phone">
      <span class="avator">
        <img
          :src="evaluationDetail.userIcon || 'https://i.app.lefile.cn/head/picdefault1477559405444/sdefault1477559405444.png'"
          onerror="this.src='https://i.app.lefile.cn/head/picdefault1477559405444/sdefault1477559405444.png';this.onerror=null;" />
      </span>
      <div class="content-message-phone">
        <div class="name">{{ evaluationDetail.userName || '玩家' }}</div>
        <div class="machine">
          <template v-if="evaluationDetail.result === 1">
            <div class="recommend"></div>
            <div class="text">推荐</div>
          </template>
          <template v-else>
            <div class="not-recommend"></div>
            <div class="text">不推荐</div>
          </template>
          <div class="line-gap">|</div>
          <span class="time">已玩{{ calcTime(evaluationDetail.userGameDurationTotal) }}</span>
          <div class="line-gap">|</div>
          <span class="time">{{ evaluationDetail.model }}</span>
          <!-- <span class="time-right">{{ evaluationDetail.createTime }}</span> -->
        </div>
      </div>

    </div>
    <div class="content-wrap">
      <div>
      </div>
      <p ref="evaContentDom" :class="['text', showMore ? '' : 'more']" style="margin-top: 12px;">{{ evaluationContent }}
      </p>
      <span
        v-if="overHeight"
        class="content-more"
        tabindex="0"
        role="button"
        :aria-label="showMore ? '收起' : '展开'"
        @click="showMore = !showMore"
        @keydown.enter.prevent.stop="showMore = !showMore"
        @keydown.space.prevent.stop="showMore = !showMore"
      >{{ showMore ? '收起' : '展开' }}</span>
      <p class="action-wrap">
        <template v-if="totalReplyCount > 0">
          <span
            v-if="!showReplyList"
            class="more"
            tabindex="0"
            role="button"
            :aria-label="'查看全部' + totalReplyCount + '条回复'"
            @click="clickShowAll"
            @keydown.enter.prevent.stop="clickShowAll"
            @keydown.space.prevent.stop="clickShowAll"
          >查看全部{{ totalReplyCount }}条回复<i class="arrow" aria-hidden="true"></i></span>
          <span
            v-else
            class="more"
            tabindex="0"
            role="button"
            :aria-label="'收起全部' + totalReplyCount + '条回复'"
            @click="clickHideAll"
            @keydown.enter.prevent.stop="clickHideAll"
            @keydown.space.prevent.stop="clickHideAll"
          >收起全部{{ totalReplyCount }}条回复</span>
        </template>
        <template v-else>
          <span></span>
        </template>
        <span class="icon-wrap">
          <i
            v-if="isSameLenovoId"
            class="delete icon"
            tabindex="0"
            role="button"
            aria-label="删除评测"
            @click="$emit('deleteEvaluation', evaluationDetail)"
            @keydown.enter.prevent.stop="$emit('deleteEvaluation', evaluationDetail)"
            @keydown.space.prevent.stop="$emit('deleteEvaluation', evaluationDetail)"
          >删除</i>
          <i
            :class="[
              'icon',
              liked ? 'zan-solid' : 'zan',
              isSameLenovoId ? 'pointer-none' : ''
            ]"
            :tabindex="isSameLenovoId ? -1 : 0"
            role="button"
            :aria-label="'点赞，共' + Math.max(likeCount, 0) + '次'"
            :aria-pressed="liked ? 'true' : 'false'"
            :aria-disabled="isSameLenovoId ? 'true' : 'false'"
            @click="!isSameLenovoId && clickLike()"
            @keydown.enter.prevent.stop="!isSameLenovoId && clickLike()"
            @keydown.space.prevent.stop="!isSameLenovoId && clickLike()">{{ Math.max(likeCount, 0) || '赞' }}</i>
          <i
            class="reply icon"
            tabindex="0"
            role="button"
            aria-label="回复评测"
            @click="clickReplyEva"
            @keydown.enter.prevent.stop="clickReplyEva"
            @keydown.space.prevent.stop="clickReplyEva"
          >回复</i>
        </span>
      </p>
      <WriteContent
        v-if="(curWriteContentId === evaluationDetail.id && customizeClass !== 'my-evaluation')
          || (curWriteContentId === 999999 && customizeClass === 'my-evaluation')"
        :reply-to-name="evaluationDetail.userName"
        :soft-name="softName"
        :_state-game="_stateGame"
        :_state-page="_statePage"
        :_game-class="_gameClass"
        @cancel="$emit('updateCurId', 0)"
        @confirm="addEvaReply" />
      <template v-if="showReplyList && replyData">
        <ReplyItem
          v-for="(item, index) in replyData.records"
          :key="'reply' + item.id"
          :reply-detail="item"
          :reply-index="index"
          :cur-write-content-id="curWriteContentId"
          :soft-name="softName"
          :_state-game="_stateGame"
          :_state-page="_statePage"
          :_game-class="_gameClass"
          @addReply="addReply"
          @updateCurId="val => $emit('updateCurId', val)"
          @deleteReply="deleteReply" />
        <el-pagination
          v-if="replyData.total > 10"
          class="small-pagination-wrap"
          small
          layout="prev, pager, next"
          :current-page="replyQuery.current"
          :total="replyData.total"
          @current-change="handleCurrentChange">
        </el-pagination>
      </template>
    </div>
  </li>
  <li :class="customizeClass" id="Evaluate" v-else>
    <!-- <span v-if="customizeClass==='my-evaluation'" class="tag">我发布的评测</span> -->
    <img
      v-if="customizeClass === 'my-evaluation'"
      src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/8daca8b5-26cf-4362-9262-99aaedd8ee20.png"
      class="tag" />
    <span class="selected" v-if="customizeClass !== 'my-evaluation' && evaluationDetail.selected">
      <img
        src="https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/0a3c8091-a211-46cd-91bb-932d848c95ec.png"
        alt="">
    </span>
    <div class="avator-wrap">
      <span class="avator">
        <img
          :src="evaluationDetail.userIcon || 'https://i.app.lefile.cn/head/picdefault1477559405444/sdefault1477559405444.png'"
          onerror="this.src='https://i.app.lefile.cn/head/picdefault1477559405444/sdefault1477559405444.png';this.onerror=null;" />
      </span>
    </div>
    <div class="content-wrap">
      <div>
        <div class="name">{{ evaluationDetail.userName || '玩家' }}</div>
        <div class="machine">
          <template v-if="evaluationDetail.result === 1">
            <div class="recommend"></div>
            <div class="text">推荐</div>
          </template>
          <template v-else>
            <div class="not-recommend"></div>
            <div class="text">不推荐</div>
          </template>
          <div class="line-gap">|</div>
          <span class="time">已玩{{ calcTime(evaluationDetail.userGameDurationTotal) }}</span>
          <div class="line-gap">|</div>
          <span class="time">{{ evaluationDetail.model }}</span>
          <span class="time-right">{{ evaluationDetail.createTime }}</span>
        </div>
      </div>
      <p ref="evaContentDom" :class="['text', showMore ? '' : 'more']" style="margin-top: 12px;">{{ evaluationContent }}
      </p>
      <span
        v-if="overHeight"
        class="content-more"
        tabindex="0"
        role="button"
        :aria-label="showMore ? '收起' : '展开'"
        @click="showMore = !showMore"
        @keydown.enter.prevent.stop="showMore = !showMore"
        @keydown.space.prevent.stop="showMore = !showMore"
      >{{ showMore ? '收起' : '展开' }}</span>
      <p class="action-wrap">
        <template v-if="totalReplyCount > 0">
          <span
            v-if="!showReplyList"
            class="more"
            tabindex="0"
            role="button"
            :aria-label="'查看全部' + totalReplyCount + '条回复'"
            @click="clickShowAll"
            @keydown.enter.prevent.stop="clickShowAll"
            @keydown.space.prevent.stop="clickShowAll"
          >查看全部{{ totalReplyCount }}条回复<i class="arrow" aria-hidden="true"></i></span>
          <span
            v-else
            class="more"
            tabindex="0"
            role="button"
            :aria-label="'收起全部' + totalReplyCount + '条回复'"
            @click="clickHideAll"
            @keydown.enter.prevent.stop="clickHideAll"
            @keydown.space.prevent.stop="clickHideAll"
          >收起全部{{ totalReplyCount }}条回复</span>
        </template>
        <template v-else>
          <span></span>
        </template>
        <span class="icon-wrap">
          <i
            v-if="isSameLenovoId"
            class="delete icon"
            tabindex="0"
            role="button"
            aria-label="删除评测"
            @click="$emit('deleteEvaluation', evaluationDetail)"
            @keydown.enter.prevent.stop="$emit('deleteEvaluation', evaluationDetail)"
            @keydown.space.prevent.stop="$emit('deleteEvaluation', evaluationDetail)"
          >删除</i>
          <i
            :class="[
              'icon',
              liked ? 'zan-solid' : 'zan',
              isSameLenovoId ? 'pointer-none' : ''
            ]"
            :tabindex="isSameLenovoId ? -1 : 0"
            role="button"
            :aria-label="'点赞，共' + Math.max(likeCount, 0) + '次'"
            :aria-pressed="liked ? 'true' : 'false'"
            :aria-disabled="isSameLenovoId ? 'true' : 'false'"
            @click="!isSameLenovoId && clickLike()"
            @keydown.enter.prevent.stop="!isSameLenovoId && clickLike()"
            @keydown.space.prevent.stop="!isSameLenovoId && clickLike()">{{ Math.max(likeCount, 0) || '赞' }}</i>
          <i
            class="reply icon"
            tabindex="0"
            role="button"
            aria-label="回复评测"
            @click="clickReplyEva"
            @keydown.enter.prevent.stop="clickReplyEva"
            @keydown.space.prevent.stop="clickReplyEva"
          >回复</i>
        </span>
      </p>
      <WriteContent
        v-if="(curWriteContentId === evaluationDetail.id && customizeClass !== 'my-evaluation')
          || (curWriteContentId === 999999 && customizeClass === 'my-evaluation')"
        :reply-to-name="evaluationDetail.userName"
        :soft-name="softName"
        :_state-game="_stateGame"
        :_state-page="_statePage"
        :_game-class="_gameClass"
        @cancel="$emit('updateCurId', 0)"
        @confirm="addEvaReply" />
      <template v-if="showReplyList && replyData">
        <ReplyItem
          v-for="(item, index) in replyData.records"
          :key="'reply' + item.id"
          :reply-detail="item"
          :reply-index="index"
          :cur-write-content-id="curWriteContentId"
          :soft-name="softName"
          :_state-game="_stateGame"
          :_state-page="_statePage"
          :_game-class="_gameClass"
          @addReply="addReply"
          @updateCurId="val => $emit('updateCurId', val)"
          @deleteReply="deleteReply" />
        <el-pagination
          v-if="replyData.total > 10"
          class="small-pagination-wrap"
          small
          layout="prev, pager, next"
          :current-page="replyQuery.current"
          :total="replyData.total"
          @current-change="handleCurrentChange">
        </el-pagination>
      </template>
    </div>
  </li>
</template>
<script>
import ReplyItem from './ReplyItem'
import WriteContent from './WriteContent.vue'
import { searchGameViews, gameReviewslikes, deleteGameReviewslikes, addGameViews } from '@/api/gameEvaluation'

export default {
  props: {
    customizeClass: {
      type: String,
      default: 'eva-wrap'
    },
    evaluationDetail: {
      type: Object,
      default: null
    },
    curWriteContentId: {
      type: Number,
      default: 0
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
  components: {
    ReplyItem,
    WriteContent
  },
  data() {
    return {
      totalReplyCount: 0, // 回复总数
      overHeight: false, // 内容是否超过4行 需要显示展开/收起
      replyData: null, // 回复列表
      showReplyList: false,
      liked: false, // 是否点赞
      likeCount: 0,
      showMore: false, // 是否展示全部内容
      replyQuery: {
        current: 1,
        size: 10,
        softId: this.$route.params.id,
        parentId: this.evaluationDetail.id
      },
      softId: this.$route.params.id,
      writeContentClick: false
    }
  },
  computed: {
    evaluationContent() {
      if (this.evaluationDetail.content) return this.evaluationDetail.content
      // 如果没有内容，则显示默认内容
      if (this.customizeClass === 'my-evaluation') {
        return '暂未填写评测内容...'
      } else {
        if (this.evaluationDetail.result === 1) {
          return `推荐了此游戏`
        } else {
          return `不推荐此游戏`
        }
      }
    },
    user() {
      return this.$store.state.user
    },
    userInfo() {
      return this.$store.state.user.userInfo
    },
    calcTime() {
      return (time) => {
        const showTime = time / 60
        const hourTime = showTime >= 10 ? `${Math.round(showTime)}小时` : (showTime >= 1 ? `${showTime.toFixed(2)}小时` : `${time % 60}分钟`)
        return hourTime
      }
    },
    isSameLenovoId() {
      return this.evaluationDetail?.lenovoId === Number(this.user?.avatar?.lenovoId)
    }
  },
  methods: {
    handleCurrentChange(val) {
      this.replyQuery.current = val
      this.initReplyList()

      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: 10,
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    deleteReply(index) {
      // 页面上前端删掉此回复
      this.replyData.records.splice(index, 1)
    },
    clickHideAll() {
      this.$emit('updateCurId', 0)
      this.showReplyList = false
    },
    clickReplyEva() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      // 打开输入框+展开评论列表
      this.$emit('updateCurId', this.customizeClass === 'my-evaluation' ? 999999 : this.evaluationDetail.id)
      this.clickShowAll()

      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: 7,
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    clickShowAll() {
      this.showReplyList = true
      this.replyQuery.current = 1
      this.initReplyList()
    },
    showCurrentLike() {
      // 前端展示点赞效果
      this.liked = !this.liked
      this.likeCount = this.liked ? this.likeCount + 1 : this.likeCount - 1
    },
    showToast(err) {
      this.$message({
        message: err,
        type: 'error',
        duration: 2500,
        customClass: 'lg-message--error'
      })
    },
    cancelLikeReviews() {
      deleteGameReviewslikes({
        reviewsId: this.evaluationDetail.id,
        softId: this.$route.params.id,
        userName: this.user?.avatar?.nickName
      }, this.evaluationDetail.id)
        .then(() => {
          this.showCurrentLike()
        }).catch((err) => {
          this.showToast(err)
        })
    },
    likeReviews() {
      gameReviewslikes({
        reviewsId: this.evaluationDetail.id,
        softId: this.$route.params.id,
        userName: this.user?.avatar?.nickName
      }, this.evaluationDetail.id)
        .then(() => {
          this.showCurrentLike()
        }).catch((err) => {
          this.showToast(err)
        })
    },
    async clickLike() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      let likeType
      // 如果当前态是点赞，则取消点赞
      if (this.liked) {
        likeType = 11
        this.cancelLikeReviews()
      } else {
        likeType = 6
        this.likeReviews()
      }
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: likeType,
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    getTime() {
      const now = new Date()
      const month = now.getMonth() + 1 // 月份从 0 开始，所以要加 1
      const day = now.getDate()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const seconds = now.getSeconds()
      return `${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    getNewReply(val, replyObj) {
      // 返回一个新的回复对象
      const { avatar, nickName, lenovoId } = this.user.avatar
      return {
        id: Date.now(),
        userIcon: avatar,
        userName: nickName,
        content: val,
        likeCount: 0,
        createTime: this.getTime(),
        replyTo: replyObj.userName,
        liked: 0,
        lenovoId: Number(lenovoId)
      }
    },
    addEvaReply(val) {
      if (this.writeContentClick) {
        return
      }
      this.writeContentClick = true
      // 添加评测的回复
      const replyObj = this.evaluationDetail
      const { avatar, nickName } = this.user.avatar

      addGameViews({
        softId: this.$route.params.id,
        softName: this.softName,
        content: val,
        replyTo: replyObj.userName,
        replyToLenovoId: replyObj.lenovoId,
        parentId: replyObj.id || 0,
        userName: nickName,
        userIcon: avatar
      }).then(res => {
        this.totalReplyCount++
        this.$emit('updateCurId', 0)
        const newObj = this.getNewReply(val, replyObj)
        newObj.id = res.data.id
        this.replyData.records.unshift(newObj)
      }).finally(() => {
        this.writeContentClick = false
      })
    },
    addReply(index, val) {
      // 添加评论的回复，注意和评测的回复区分开
      const replyObj = this.replyData.records[index]
      const { avatar, nickName } = this.user.avatar
      addGameViews({
        softId: this.$route.params.id,
        softName: this.softName,
        content: val,
        replyTo: replyObj.userName,
        replyToLenovoId: replyObj.lenovoId,
        parentId: this.evaluationDetail.id,
        userName: nickName,
        userIcon: avatar
      }).then(res => {
        this.totalReplyCount++
        const newObj = this.getNewReply(val, replyObj)
        newObj.id = res.data.id
        this.replyData.records.splice(index + 1, 0, newObj)
      })
    },
    initReplyList() {
      searchGameViews(JSON.parse(JSON.stringify(this.replyQuery))).then(res => {
        this.replyData = res.data
      })
    }
  },
  mounted() {
    const evaContentDom = this.$refs.evaContentDom
    this.overHeight = evaContentDom.scrollHeight > evaContentDom.clientHeight
    // 初始化点赞状态 此3个值需要前端维护短期状态，接口刷新后忽略
    this.liked = this.evaluationDetail.userLikes
    this.likeCount = this.evaluationDetail.likeCount
    this.totalReplyCount = this.evaluationDetail.replyCount

    this.$nextTick(() => {
      let clock = false
      if (this.$route.query.needScroll && clock === false) {
        if (document.getElementById('Evaluate')) {
          document.getElementById('Evaluate').scrollIntoView({ behavior: 'smooth', block: 'end' })
          clock = true
        }
      }
    })
  }
}
</script>
<style lang="scss" scoped>
.small-pagination-wrap {
  padding: 0;

  

    :deep(.btn-next,
    .btn-prev,
    .el-pager li) {
      background: transparent;
    }

    :deep(.el-pager li) {
      cursor: pointer;
      font-size: 12px;
      color: rgba(234, 247, 255, 0.6);
    }

    :deep(.el-pager li.active) {
      color: rgba(234, 247, 255, 1);
      font-weight: 400;
    }

    :deep(.el-pager li:hover) {
      color: rgba(234, 247, 255, 0.4);
    }

    :deep(.el-icon-arrow-right::before,
    .el-icon-arrow-left::before) {
      content: '';
      display: inline-block;
      width: 5.6px;
      height: 8px;
      background: transparent url('~@/views/GameCenter/CDKMall/Detail/image/back-icon.svg') no-repeat center center / contain;
    }

    :deep(.el-icon-arrow-left::before) {
      transform: rotateZ(180deg);
    }

    :deep(button[disabled='disabled']) {
      opacity: 0.6;
    }
  
}

.my-evaluation {
  border: 1px solid rgba(255, 255, 255, 0.20);
  background: radial-gradient(33.52% 77.59% at 9.79% 2.59%, rgba(74, 95, 152, 0.20) 0%, rgba(23, 10, 0, 0.00) 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.10) 100%);

  .tag {
    position: absolute;
    top: 0;
    right: 0px;
    width: 107px;
    height: 20px;
    object-fit: cover;
  }

  .avator {
    width: 96px;
    height: 96px;
    background: transparent url('https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/1fa5c994-d81f-400c-8008-4e57d8e0cd7c.png') repeat center;
  }

}

.eva-wrap {
  margin-top: 20px;
  //  background: linear-gradient(0deg, #212226 0%, #111215 100%);
  background-color: rgba(255, 255, 255, 0.04);
  position: relative;

  .selected {
    display: inline-block;
    width: 107px;
    height: 20px;
    position: absolute;
    right: 0px;
    top: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

}

.my-evaluation,
.eva-wrap {
  display: flex;
  position: relative;
  border: 1px solid #222427;
  padding: 20px 32px 24px 24px;
  overflow-x: hidden;

  .avator-wrap {
    display: flex;
    flex-direction: column;
    margin-right: 15px;
    align-items: center;
    flex: none;

    .avator {
      position: relative;
      display: inline-block;
      padding: 6px;
      width: 64px;
      height: 64px;
      object-fit: cover;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
    }

  }

  .content-wrap {
    position: relative;
    flex: 1;
    margin-top: 12px;

    .name {
      height: 24px;
      display: block;
      color: #EAF7FF;
      font-size: 14px;
      font-style: normal;
      font-weight: 700;
    }

    .machine {
      width: 100%;
      height: 14px;
      line-height: 14px;
      font-size: 12px;
      margin-top: 4px;
      display: inline-flex;
      align-items: center;

      .time-right {
        margin-left: auto;
        opacity: 0.6;
        color: rgba(234, 247, 255, 0.60);
      }

      .line-gap {
        height: auto;
        width: 10px;
        margin: 0 8px;
        color: rgba(234, 247, 255, 0.60);
      }

      .time {
        font-weight: 400;
        color: rgba(234, 247, 255, 0.60);
        display: inline-block;
        opacity: 0.6;
      }

      .text {
        display: inline-block;
        font-size: 12px;
        height: 14px;
        font-weight: 400;
        color: #EAF7FF;
      }

      .recommend,
      .not-recommend {
        display: inline-block;
        height: 14px;
        width: 14px;
        margin-right: 4px;
      }

      .recommend {
        background: transparent url('~@/images/icon/recommend-blue.svg') no-repeat center center / cover;
      }

      .not-recommend {
        background: transparent url('~@/images/icon/no-recommend.svg') no-repeat center center / cover;
      }
    }

    .fenge-line {
      width: 100%;
      height: 1px;
      background-color: #414449;
      transform: scaleY(0.4);
      margin-top: 23px;
      margin-bottom: 20px;
    }

    .action-wrap {
      width: 100%;
      display: flex;
      justify-content: space-between;
      line-height: 12px;
      margin-top: 12px;
      color: rgba(234, 247, 255, 0.60);

      .more {
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;

        i.arrow {
          margin-left: 3px;
          display: inline-block;
          width: 4px;
          height: 8px;
          background: transparent url('https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/15/63c8f469-8564-47fa-b0a1-b90ce72d1fa7.png') no-repeat center center / cover;
        }
      }

      .icon {
        cursor: pointer;
        font-size: 12px;
        font-weight: 400;
        color: rgba(234, 247, 255, 0.60);

        &::before {
          content: '';
          display: inline-block;
          width: 14px;
          height: 14px;
          margin-left: 18px;
          margin-right: 4px;
          vertical-align: -2px;
        }

        &.pointer-none {
          pointer-events: none;
        }
      }

      .delete::before {
        background: transparent url('~@/images/gamecenter/detail/delete-icon.png') no-repeat center center / cover;
      }

      .zan::before {
        background: transparent url('~@/images/gamecenter/detail/zan-icon.png') no-repeat center center / cover;
      }

      .zan-solid::before {
        background: transparent url('~@/images/gamecenter/detail/zan-solid-icon.png') no-repeat center center / contain;
      }

      .reply::before {
        background: transparent url('~@/images/gamecenter/detail/comment-icon.png') no-repeat center center / cover;
      }
    }
  }
}

.load-more {
  margin-top: 16px;
  margin-left: 20px;

  .show-more,
  .close {
    cursor: pointer;
    color: #386EFE;
    font-size: 12px;
    font-weight: 400;
  }

  .show-more::after {
    margin-left: 6px;
    margin-right: 20px;
    content: '';
    display: inline-block;
    width: 4px;
    height: 8px;
    background: transparent url('~@/images/gamecenter/detail/blue-arrow.png') no-repeat center center / cover;
    transform: rotateZ(90deg);
  }

  .close::after {
    margin-left: 6px;
    content: '';
    display: inline-block;
    width: 4px;
    height: 8px;
    background: transparent url('~@/images/gamecenter/detail/blue-arrow.png') no-repeat center center / cover;
    transform: rotateZ(-90deg);
  }
}

.content-more {
  cursor: pointer;
  display: inline-block;
  font-size: 12px;
  margin-top: 8px;
  margin-bottom: 12px;
  color: rgba(234, 247, 255, 0.60);
}

.text.more {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.PhoneDevice {
.my-evaluation {
  margin-top: 20px;
}

  .my-evaluation,
  .eva-wrap {
    padding: 16px;
    display: block;

    .content-wrap {
      .action-wrap {
        width: 100%;
        display: flex;
        justify-content: space-between;
        line-height: 12px;
        margin-top: 12px;
        color: rgba(234, 247, 255, 0.60);

        .icon {
          font-size: 14px;
        }

        .more {
          cursor: pointer;
          font-size: 14px;
          font-weight: 400;

          i.arrow {
            margin-left: 3px;
            display: inline-block;
            width: 4px;
            height: 8px;
            background: transparent url('https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/15/63c8f469-8564-47fa-b0a1-b90ce72d1fa7.png') no-repeat center center / cover;
          }
        }

        .icon {
          cursor: pointer;
          font-size: 14px;
          font-weight: 400;
          color: rgba(234, 247, 255, 0.60);

          &::before {
            content: '';
            display: inline-block;
            width: 14px;
            height: 14px;
            margin-left: 18px;
            margin-right: 4px;
            vertical-align: -2px;
          }

          &.pointer-none {
            pointer-events: none;
          }
        }

        .delete::before {
          background: transparent url('~@/images/gamecenter/detail/delete-icon.png') no-repeat center center / cover;
        }

        .zan::before {
          background: transparent url('~@/images/gamecenter/detail/zan-icon.png') no-repeat center center / cover;
        }

        .zan-solid::before {
          background: transparent url('~@/images/gamecenter/detail/zan-solid-icon.png') no-repeat center center / contain;
        }

        .reply::before {
          background: transparent url('~@/images/gamecenter/detail/comment-icon.png') no-repeat center center / cover;
        }
      }
    }
  }

  .avator-wrap-phone {
    display: flex;
    align-items: center;

    .avator {
      height: 64px;
      width: 64px;
      background: transparent url('https://pr1-gmcashcdn.lenovo.com.cn/legionzone/2025/08/12/1fa5c994-d81f-400c-8008-4e57d8e0cd7c.png') repeat center;

      img {
        height: 100%;
        width: 100%;
        border-radius: 50%;
      }
    }

    .content-message-phone {
      position: relative;
      flex: 1;
      margin-left: 12px;

      .name {
        display: block;
        color: #EAF7FF;
        font-size: 15px;
        font-style: normal;
        font-weight: 700;
      }

      .machine {
        width: 100%;
        line-height: 14px;
        font-size: 12px;
        margin-top: 6px;
        display: inline-flex;
        align-items: center;

        .time-right {
          margin-left: auto;
          opacity: 0.6;
          color: rgba(234, 247, 255, 0.60);
        }

        .line-gap {
          height: auto;
          width: 10px;
          margin: 0 8px;
          color: rgba(234, 247, 255, 0.60);
        }

        .time {
          font-weight: 400;
          color: rgba(234, 247, 255, 0.60);
          display: inline-block;
          opacity: 0.6;
        }

        .text {
          display: inline-block;
          font-size: 12px;
          height: 14px;
          font-weight: 400;
          color: #EAF7FF;
        }

        .recommend,
        .not-recommend {
          display: inline-block;
          height: 14px;
          width: 14px;
          margin-right: 4px;
        }

        .recommend {
          background: transparent url('~@/images/icon/recommend-blue.svg') no-repeat center center / cover;
        }

        .not-recommend {
          background: transparent url('~@/images/icon/no-recommend.svg') no-repeat center center / cover;
        }
      }

      .fenge-line {
        width: 100%;
        height: 1px;
        background-color: #414449;
        transform: scaleY(0.4);
        margin-top: 23px;
        margin-bottom: 20px;
      }

    }
  }

}

.content-more:focus-visible,
.action-wrap .more:focus-visible,
.action-wrap .delete:focus-visible,
.action-wrap .zan:focus-visible,
.action-wrap .reply:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .content-more:focus-visible,
  .action-wrap .more:focus-visible,
  .action-wrap .delete:focus-visible,
  .action-wrap .zan:focus-visible,
  .action-wrap .reply:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
