<template>
  <div class="reply-item-wrap">
    <h4 class="reply-info">
      <img class="avator" :src="replyDetail.userIcon|| 'https://i.app.lefile.cn/head/picdefault1477559405444/sdefault1477559405444.png'" />
      <span class="answer-nickname">{{ replyDetail.userName || '玩家er' }}</span>
      回复
      <span class="main-nickname">{{ replyDetail.replyTo }}</span>
      {{ replyDetail.createTime }}
    </h4>
    <p ref="replyDom" :class="['reply-content', showMore ? '':'more']">{{ replyDetail.content }}</p>
    <span v-if="overHeight" class="content-more" tabindex="0" role="button" :aria-label="showMore ? '收起' : '展开'" @click="showMore=!showMore" @keydown.enter.prevent.stop="showMore=!showMore" @keydown.space.prevent.stop="showMore=!showMore">{{ showMore ? '收起' : '展开' }}</span>
    <p class="action-wrap">
      <i v-if="(replyDetail.lenovoId && user.avatar) && replyDetail.lenovoId === Number(user.avatar.lenovoId)" class="delete icon" tabindex="0" role="button" aria-label="删除" @click="clickDelete" @keydown.enter.prevent.stop="clickDelete" @keydown.space.prevent.stop="clickDelete">删除</i>
      <i :class="[liked? 'zan-solid':'zan', 'icon']" tabindex="0" role="button" :aria-pressed="liked ? 'true' : 'false'" :aria-label="liked ? '取消赞，当前赞数' + Math.max(likeCount, 0) : '赞，当前赞数' + Math.max(likeCount, 0)" @click="clickLike" @keydown.enter.prevent.stop="clickLike" @keydown.space.prevent.stop="clickLike">{{ Math.max(likeCount, 0) || '赞' }}</i>
      <i class="reply icon" tabindex="0" role="button" aria-label="回复" @click="clickReply" @keydown.enter.prevent.stop="clickReply" @keydown.space.prevent.stop="clickReply">回复</i>
    </p>
    <WriteContent
      v-if="curWriteContentId === replyDetail.id"
      class-name="reply-position"
      :reply-to-name="replyDetail.userName"
      :soft-name="softName"
      :_state-game="_stateGame"
      :_state-page="_statePage"
      :_game-class="_gameClass"
      @cancel="$emit('updateCurId', 0)"
      @confirm="val => addContent(val)"/>
  </div>
</template>
<script>
import WriteContent from './WriteContent.vue'
import { deleteGameViews, gameReviewslikes, deleteGameReviewslikes } from '@/api/gameEvaluation'

export default {
  props: {
    replyDetail: {
      type: Object,
      default: null
    },
    replyIndex: {
      type: Number,
      default: 0
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
  data() {
    return {
      showMore: false, // 是否展开
      overHeight: false, // 内容是否超过2行 是否需要展示 展开/收起
      liked: false, // 是否点赞
      likeCount: 0,
      softId: this.$route.params.id // 软件id
    }
  },
  computed: {
    user() {
      return this.$store.state.user
    },
    userInfo() {
      return this.$store.state.user.userInfo
    }
  },
  components: {
    WriteContent
  },
  methods: {
    clickReply() {
      if (!this.userInfo) {
        this.$login()
        return
      }
      this.$emit('updateCurId', this.replyDetail.id)

      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: 7,
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
    },
    deleteReplyAPI() {
      this.$dataReport('LZ_gamingCenter', 'LZ_storeDetailUserReviewsClick', 'click', {
        clickType: 12,
        nameAndId: `${this.softName}_${this.softId}_${this._stateGame}_${this._statePage}_${this._gameClass}`
      })
      deleteGameViews({
        reviewsId: this.replyDetail.id,
        softId: this.$route.params.id
      }).then(res => {
        this.$emit('deleteReply', this.replyIndex)
      })
    },
    clickDelete() {
      this.$lzconfirm({
        type: 'warning',
        message: '确定删除吗？',
        confirmButtonText: '确认'
      }).then(() => {
        this.deleteReplyAPI()
      }).catch(() => {

      })
    },
    addContent(val) {
      this.$emit('updateCurId', 0)
      this.$emit('addReply', this.replyIndex, val)
    },
    showCurrentLike() {
      this.liked = !this.liked
      this.likeCount = this.liked ? this.likeCount + 1 : Math.max(this.likeCount - 1, 0)
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
        reviewsId: this.replyDetail.id,
        softId: this.$route.params.id,
        userName: this.user?.avatar?.nickName
      })
        .then(() => {
          this.showCurrentLike()
        }).catch((err) => {
          this.showToast(err)
        })
    },
    likeReviews() {
      gameReviewslikes({
        reviewsId: this.replyDetail.id,
        softId: this.$route.params.id,
        userName: this.user?.avatar?.nickName
      })
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
      // 如果当前态是点赞，则取消点赞
      let likeType
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
    }
  },
  mounted() {
    const replyDom = this.$refs.replyDom
    this.overHeight = replyDom.scrollHeight > replyDom.clientHeight
    // 初始化点赞状态 此2个值需要前端维护短期状态，接口刷新后忽略
    this.liked = this.replyDetail.userLikes
    this.likeCount = this.replyDetail.likeCount
  }
}
</script>
<style lang="scss" scoped>
.reply-content.more {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient: vertical;
}
.content-more {
  cursor: pointer;
  display: inline-block;
  font-size: 12px;
  margin-left: 20px;
  margin-top: 8px;
  color: rgba(234, 247, 255, 0.60);
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
.reply-item-wrap {
  margin-top: 20px;
  &:first-child{
    margin-top: 35px;
  }
}
.reply-info {
  font-size: 12px;
  font-weight: 400;
  color: rgba(234, 247, 255, 0.6);
  line-height: 20px;
  .avator {
    width: 20px;
    height: 20px;
    border-radius: 20px;
    margin-right: 8px;
  }
  .answer-nickname, .main-nickname {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 1);
  }
  .main-nickname {
    margin-right: 10px;
  }
}
.reply-content {
  margin-top: 6px;
  margin-left: 21px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(234, 247, 255, 1);
  line-height: 24px;
  word-break: break-all;
  white-space: pre-wrap;
}
.action-wrap {
  text-align: right;
}

.content-more:focus-visible,
.action-wrap .icon:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (forced-colors: active) {
  .content-more:focus-visible,
  .action-wrap .icon:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
