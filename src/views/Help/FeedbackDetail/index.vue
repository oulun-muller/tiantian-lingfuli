<template>
  <div v-if="loaded" class="lz-help">
    <div class="page detail-page">
      <HelpNavBar :title="title" manual-back @back="leaveDetail" />

      <main ref="listRef" class="chat page__body--scroll" :style="chatStyle">
        <div class="chat__inner">
          <div v-if="!messages.length" class="help-empty">暂无对话记录</div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="msg"
              :class="msg.role === 'user' ? 'msg--user' : 'msg--ops'">
              <div class="msg__meta">
                <template v-if="msg.role === 'user'">
                  <span class="msg__time">{{ msg.time }}</span>
                  <span class="msg__name">{{ msg.name }}</span>
                </template>
                <template v-else>
                  <span class="msg__name">{{ msg.name }}</span>
                  <span class="msg__time">{{ msg.time }}</span>
                </template>
              </div>
              <div v-if="msg.images && msg.images.length" class="msg__images">
                <HelpPhotoThumb
                  v-for="(img, index) in msg.images"
                  :key="msg.id + '-' + index"
                  :src="img"
                  :size="80"
                  variant="message" />
              </div>
              <div v-if="msg.text" class="msg__bubble">
                <p>{{ msg.text }}</p>
              </div>
            </div>
          </template>
        </div>
      </main>

      <footer ref="composerRef" class="composer" :style="composerStyle">
        <div class="composer__fade" />
        <div
          class="composer__panel"
          :class="{ 'composer__panel--keyboard': keyboardInset > 0 }">
          <div class="composer__box">
            <div v-if="localImages.length" class="composer__photos">
              <HelpPhotoThumb
                v-for="(img, index) in localImages"
                :key="img.id"
                :src="img.url"
                :size="56"
                :status="img.status"
                deletable
                @remove="onRemoveImage(index)"
                @retry="onRetryImage(index)" />
            </div>

            <div class="composer__field-wrap">
              <div
                ref="fieldRef"
                class="composer__field"
                @scroll="updateFieldScrollbar">
                <textarea
                  ref="textareaRef"
                  v-model="draft"
                  rows="1"
                  :maxlength="DRAFT_MAX_LENGTH"
                  enterkeyhint="send"
                  placeholder="你可以在此，追加反馈..."
                  @input="onDraftInput"
                  @beforeinput="onDraftBeforeInput($event, draft)"
                  @keydown="onDraftKeydown"
                  @focus="onComposerFocus"
                  @blur="onComposerBlur" />
              </div>
              <div
                v-show="fieldScrollbar.visible"
                class="composer__scrollbar"
                aria-hidden="true">
                <div
                  class="composer__scrollbar-thumb"
                  :style="{ height: fieldScrollbar.thumbH + 'px', transform: 'translateY(' + fieldScrollbar.thumbTop + 'px)' }" />
              </div>
            </div>

            <div class="composer__toolbar">
              <el-upload
                ref="imageUpload"
                :show-file-list="false"
                :file-list="uploadList"
                :auto-upload="false"
                :on-change="onFileChange"
                :accept="'image/*'"
                :multiple="imageAllowMultiple"
                list-type="picture"
                action=""
                class="attach">
                <img class="attach__icon" :src="iconAddPicture" width="16" height="16" alt="">
                <span class="attach__text">附加照片 {{ localImages.length }}/3</span>
              </el-upload>
              <div class="composer__meta">
                <p class="composer__count">{{ draft.length }}/{{ DRAFT_MAX_LENGTH }}</p>
                <button
                  type="button"
                  class="send"
                  :disabled="!canSend || sending"
                  aria-label="发送"
                  @click="send">
                  <img
                    class="send__icon"
                    :src="canSend ? iconSendActive : iconSendInactive"
                    width="24"
                    height="24"
                    alt="">
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import Axios from 'axios'
import HelpNavBar from '../components/HelpNavBar.vue'
import HelpPhotoThumb from '../components/HelpPhotoThumb.vue'
import { createMaxLengthToast } from '../utils/maxLengthToast'
import { historyLocation, leaveToHistory, parseHelpTab } from '../utils/helpTab'
import { toast, toastError, toastSuccess } from '../utils/toast'
import { rsaEncryptLong, rsaDecryptLong } from '../utils/rsaEncrypt'
import { buildIdentityParams } from '../utils/feedbackIdentity'
import { buildFeedbackUploadName } from '../utils/feedbackUploadName'
import { getFeedbackDetail, appendFeedback } from '@/api/feedback'
import { feedbackAppId, generateFeedbackSignParams } from '@/utils/signRequest'
import { client } from '@/utils/aliyunOSConfig'
import iconAddPicture from '../images/icon-add-picture.svg'
import iconSendActive from '../images/icon-send-active.svg'
import iconSendInactive from '../images/icon-send-inactive.svg'

const FIELD_MIN = 72
const FIELD_MAX = 144
const FIELD_PAD_Y = 24
const DRAFT_MAX_LENGTH = 500
const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 50 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 120 * 1024 * 1024
const KEYBOARD_MIN_SHRINK = 48
const BLUR_SETTLE_INTERVAL_MS = 60
const BLUR_SETTLE_MAX_ATTEMPTS = 5

function getOssDate() {
  const time = new Date()
  const year = time.getFullYear()
  let month = time.getMonth() + 1
  let day = time.getDate()
  if (month >= 1 && month <= 9) month = '0' + month
  if (day >= 1 && day <= 9) day = '0' + day
  return `${year}${month}${day}`
}

export default {
  name: 'FeedbackDetail',
  components: { HelpNavBar, HelpPhotoThumb },
  data() {
    return {
      DRAFT_MAX_LENGTH,
      loaded: false,
      quesId: null,
      title: '',
      messages: [],
      draft: '',
      sending: false,
      composerHeight: 0,
      composerFocused: false,
      iconAddPicture,
      iconSendActive,
      iconSendInactive,
      uploadList: [],
      localImages: [],
      fieldScrollbar: {
        visible: false,
        thumbH: 36,
        thumbTop: 4
      },
      keyboardInset: 0
    }
  },
  computed: {
    canSend() {
      return !this.sending &&
        (this.draft.trim().length > 0 || this.localImages.length > 0)
    },
    composerStyle() {
      return {
        bottom: this.keyboardInset > 0
          ? this.keyboardInset + 'px'
          : 'env(keyboard-inset-bottom, 0px)'
      }
    },
    chatStyle() {
      return {
        paddingBottom: Math.max(0, this.composerHeight - 16) + 'px'
      }
    },
    imageRemainCount() {
      return Math.max(0, MAX_IMAGES - this.localImages.length)
    },
    imageAllowMultiple() {
      return this.imageRemainCount > 1
    }
  },
  watch: {
    loaded(val) {
      if (val) this.$nextTick(this.afterLoaded)
    },
    'messages.length'() {
      this.scrollBottom()
    },
    draft() {
      this.$nextTick(this.resizeComposer)
    },
    localImages() {
      this.$nextTick(() => {
        this.resizeComposer()
        this.measureComposer()
      })
    },
    keyboardInset() {
      this.$nextTick(this.measureComposer)
      if (this._settleTimer) clearTimeout(this._settleTimer)
      this._settleTimer = setTimeout(() => {
        this.scrollBottom()
      }, 120)
    }
  },
  created() {
    this.quesId = this.$route.params.id
    this._msgId = 0
    this._autoGrowOpts = {
      minHeight: FIELD_MIN,
      maxHeight: FIELD_MAX,
      extraPadding: () => (this.localImages.length > 0 ? 12 : FIELD_PAD_Y)
    }
    this._autoGrowRefs = { fieldRefName: 'fieldRef', textareaRefName: 'textareaRef' }
    this._maxLengthToast = createMaxLengthToast(DRAFT_MAX_LENGTH)
    this.fetchDetail()
  },
  mounted() {
    const self = this
    this._kiBaseline = 0
    this._kiRafId = 0
    this._kiVk = null
    this._kiHasFocus = false
    this._kiBlurTimers = []

    this._kiClearBlurTimers = function() {
      self._kiBlurTimers.forEach(id => clearTimeout(id))
      self._kiBlurTimers = []
    }

    this._kiReadBaselineCandidate = function() {
      const vv = window.visualViewport
      return Math.round(Math.max(window.innerHeight, vv ? vv.height : 0))
    }

    this._kiEnsureBaseline = function(force) {
      const candidate = self._kiReadBaselineCandidate()
      if (force || candidate > self._kiBaseline) self._kiBaseline = candidate
    }

    this._kiReadInset = function() {
      if (!self._kiHasFocus) return 0

      if (self._kiVk) {
        const h = Math.round((self._kiVk.boundingRect || {}).height || 0)
        if (h > KEYBOARD_MIN_SHRINK) return h
      }

      const vv = window.visualViewport
      if (!vv) return 0

      self._kiEnsureBaseline(false)

      const layoutH = Math.round(window.innerHeight)
      const visualH = Math.round(vv.height + vv.offsetTop)
      const layoutShrink = self._kiBaseline - layoutH
      const visualShrink = self._kiBaseline - visualH

      if (layoutShrink > KEYBOARD_MIN_SHRINK) return 0
      return visualShrink > KEYBOARD_MIN_SHRINK ? visualShrink : 0
    }

    this._kiUpdate = function() {
      self._kiRafId = 0
      const next = self._kiReadInset()
      if (next !== self.keyboardInset) self.keyboardInset = next
    }

    this._kiSchedule = function() {
      if (self._kiRafId) return
      self._kiRafId = requestAnimationFrame(self._kiUpdate)
    }

    this._kiWaitForStableHeight = function(cb, attempt) {
      const before = self._kiReadBaselineCandidate()
      const timer = window.setTimeout(() => {
        const after = self._kiReadBaselineCandidate()
        if (after === before || (attempt || 0) >= BLUR_SETTLE_MAX_ATTEMPTS) {
          cb()
          return
        }
        self._kiWaitForStableHeight(cb, (attempt || 0) + 1)
      }, BLUR_SETTLE_INTERVAL_MS)
      self._kiBlurTimers.push(timer)
    }

    this._kiOnFocusIn = function(event) {
      const target = event.target
      if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return
      self._kiClearBlurTimers()
      self._kiHasFocus = true
      self._kiSchedule()
    }

    this._kiOnFocusOut = function() {
      self._kiClearBlurTimers()
      self._kiWaitForStableHeight(() => {
        self._kiHasFocus = false
        self._kiEnsureBaseline(true)
        self._kiUpdate()
      })
    }

    if (navigator.virtualKeyboard) {
      this._kiVk = navigator.virtualKeyboard
      try {
        this._kiVk.overlaysContent = true
      } catch (e) {
        // 部分实现只读
      }
      this._kiVk.addEventListener('geometrychange', this._kiSchedule)
    }

    this._kiEnsureBaseline(true)
    this._kiUpdate()
    const vv = window.visualViewport
    if (vv) {
      vv.addEventListener('resize', this._kiSchedule)
      vv.addEventListener('scroll', this._kiSchedule)
    }
    window.addEventListener('resize', this._kiSchedule)
    window.addEventListener('orientationchange', this._kiSchedule)
    window.addEventListener('focusin', this._kiOnFocusIn)
    window.addEventListener('focusout', this._kiOnFocusOut)
  },
  beforeUnmount() {
    if (this._settleTimer) clearTimeout(this._settleTimer)
    if (this._composerObserver) {
      this._composerObserver.disconnect()
      this._composerObserver = null
    }
    if (this._kiVk) this._kiVk.removeEventListener('geometrychange', this._kiSchedule)
    const vv = window.visualViewport
    if (vv) {
      vv.removeEventListener('resize', this._kiSchedule)
      vv.removeEventListener('scroll', this._kiSchedule)
    }
    window.removeEventListener('resize', this._kiSchedule)
    window.removeEventListener('orientationchange', this._kiSchedule)
    window.removeEventListener('focusin', this._kiOnFocusIn)
    window.removeEventListener('focusout', this._kiOnFocusOut)
    if (this._kiClearBlurTimers) this._kiClearBlurTimers()
    if (this._kiRafId) cancelAnimationFrame(this._kiRafId)
    this.clearImages()
    this.clearMessageImages()
  },
  methods: {
    syncKeyboardInset() {
      if (this._kiUpdate) this._kiUpdate()
    },

    updateFieldScrollbar() {
      const field = this.$refs[this._autoGrowRefs.fieldRefName]
      const scrollbar = this.fieldScrollbar
      if (!field) {
        scrollbar.visible = false
        return
      }
      const { clientHeight, scrollHeight, scrollTop } = field
      const overflow = scrollHeight - clientHeight
      if (overflow <= 1) {
        scrollbar.visible = false
        return
      }
      const scrollThumbMin = this._autoGrowOpts.scrollThumbMin || 36
      const track = Math.max(8, clientHeight - 8)
      const thumbH = Math.max(scrollThumbMin, Math.round((clientHeight / scrollHeight) * track))
      const maxTop = track - thumbH
      const thumbTop = 4 + Math.round((scrollTop / overflow) * maxTop)
      scrollbar.visible = true
      scrollbar.thumbH = thumbH
      scrollbar.thumbTop = thumbTop
    },
    resizeField() {
      const field = this.$refs[this._autoGrowRefs.fieldRefName]
      const el = this.$refs[this._autoGrowRefs.textareaRefName]
      if (!field || !el) return
      const { minHeight, maxHeight, extraPadding } = this._autoGrowOpts
      el.style.height = '0px'
      const contentH = el.scrollHeight
      el.style.height = contentH + 'px'
      const pad = extraPadding ? extraPadding() : 0
      const nextField = Math.min(maxHeight, Math.max(minHeight, contentH + pad))
      field.style.height = nextField + 'px'
      this.$nextTick(this.updateFieldScrollbar)
    },

    async getOssToken() {
      const _data = await generateFeedbackSignParams()
      const formdata = new FormData()
      for (const key in _data) {
        formdata.append(key, _data[key])
      }
      return Axios({
        method: 'post',
        url: `${process.env.GATEWAY}/cloud-feedback/rest/aliyun/oss/sts/token`,
        data: formdata
      }).then(res => {
        const token = rsaDecryptLong(res.data.securityToken)
        if (!token) {
          throw new Error('decrypt securityToken failed')
        }
        res.data.securityToken = token
        return res.data
      })
    },
    async uploadFile(item) {
      let stage = 'sts-token'
      try {
        const stsInfor = await this.getOssToken()
        const date = getOssDate()
        const fileName = `/feedback/user/legionmobile/${date}/${item.file.name}`
        stage = 'oss-upload'
        const ossClient = client(stsInfor)
        const result = await ossClient.put(fileName, item.file.raw)
        if (result && result.res && result.res.statusCode === 200) {
          const target = this.localImages.find(img => img.id === item.id)
          if (target) {
            target.status = 'done'
            target.uploadName = result.name
          }
        } else {
          stage = 'oss-response'
          throw new Error('multipartUpload failed')
        }
      } catch (e) {
        this.logUploadError(stage, item, e)
        const target = this.localImages.find(img => img.id === item.id)
        if (target) target.status = 'error'
      }
    },
    logUploadError(stage, item, error) {
      const response = error && (error.response || error.res)
      console.error('[FeedbackDetail] image upload failed', {
        stage,
        fileName: item.file && item.file.name,
        fileSize: item.size,
        errorName: error && error.name,
        message: error && error.message,
        code: error && error.code,
        status: (error && error.status) || (response && response.status),
        requestId: error && error.requestId,
        response
      })
    },

    onFileChange(file) {
      const rawFile = file.raw
      if (!rawFile || rawFile.type.indexOf('image/') !== 0) {
        toast('请选择图片文件')
        this.discardUploadFile(file)
        return
      }
      if (rawFile.size > MAX_IMAGE_BYTES) {
        toast('请选择50M以内图片')
        this.discardUploadFile(file)
        return
      }
      if (this.imageRemainCount <= 0) {
        toast('最多支持3张图片')
        this.discardUploadFile(file)
        return
      }
      const runningTotal = this.localImages.reduce((sum, img) => sum + (img.size || 0), 0)
      if (runningTotal + rawFile.size > MAX_TOTAL_IMAGE_BYTES) {
        toast('图片总大小超出限制')
        this.discardUploadFile(file)
        return
      }
      file.name = this.buildUploadName(file)
      this.uploadList.push(file)
      const item = {
        id: file.uid,
        uid: file.uid,
        url: URL.createObjectURL(rawFile),
        status: 'uploading',
        file,
        size: rawFile.size,
        uploadName: ''
      }
      this.localImages.push(item)
      this.uploadFile(item)
      this.composerFocused = true
    },
    buildUploadName(file) {
      return buildFeedbackUploadName(file)
    },
    discardUploadFile(file) {
      const upload = this.$refs.imageUpload
      if (upload) upload.handleRemove(file)
    },
    removeImage(index) {
      const removed = this.localImages[index]
      this.localImages.splice(index, 1)
      if (removed) this.uploadList = this.uploadList.filter(file => file.uid !== removed.uid)
      if (removed && removed.url && removed.url.indexOf('blob:') === 0) {
        URL.revokeObjectURL(removed.url)
      }
    },
    retryImage(index) {
      const item = this.localImages[index]
      if (!item) return
      item.status = 'uploading'
      this.uploadFile(item)
    },
    clearImages() {
      this.revokeImageUrls(this.localImages)
      this.localImages = []
      this.uploadList = []
    },
    clearMessageImages() {
      this.messages.forEach(message => {
        this.revokeImageUrls(message.images)
      })
    },
    revokeImageUrls(images) {
      images.forEach(img => {
        const url = typeof img === 'string' ? img : img.url
        if (url && url.indexOf('blob:') === 0) URL.revokeObjectURL(url)
      })
    },
    getUploadedKeys() {
      return this.localImages
        .filter(img => img.status === 'done' && img.uploadName)
        .map(img => img.uploadName)
    },
    assertReadyToSubmit() {
      if (this.localImages.some(img => img.status === 'uploading')) {
        toast('图片上传中，请稍候')
        return false
      }
      if (this.localImages.some(img => img.status === 'error')) {
        toast('有图片上传失败，请删除或重试')
        return false
      }
      return true
    },

    currentLid() {
      return (this.$store.state.user || {}).userInfo ? this.$store.state.user.userInfo.UserID : ''
    },
    async fetchDetail() {
      const _data = Object.assign({
        appId: feedbackAppId,
        asc: true,
        quesId: Number(this.quesId)
      }, await buildIdentityParams())
      getFeedbackDetail(_data).then(res => {
        if (!res || res.code !== 10000) {
          this.$router.replace(historyLocation(parseHelpTab(this.$route.query.fromTab)))
          return
        }
        const infos = res.data || []
        this.messages = infos.map(item => {
          const role = item.infoType === 1 ? 'user' : 'ops'
          const images = []
          for (let i = 1; i <= 5; i++) {
            const path = item['attach' + i + 'Path']
            if (path) images.push(path)
          }
          return {
            id: 'msg-' + (++this._msgId),
            role,
            name: role === 'user' ? '我' : '联想客服',
            time: item.createTime || '',
            text: item.note || '',
            images
          }
        })
        const firstUser = this.messages.find(m => m.role === 'user')
        this.title = (firstUser && firstUser.text) || '反馈详情'
        this.loaded = true
        this.$dataReport('LZ_feedback', 'LZ_appendInfoEnterClick', 'click', {
          cardName: this.title
        })
      }).catch(() => {
        this.$router.replace(historyLocation(parseHelpTab(this.$route.query.fromTab)))
      })
    },
    afterLoaded() {
      this.$nextTick(() => {
        this.resizeField()
        this.measureComposer()
        this.scrollBottom()
        const composerEl = this.$refs.composerRef
        if (composerEl && typeof ResizeObserver !== 'undefined') {
          this._composerObserver = new ResizeObserver(() => {
            this.measureComposer()
          })
          this._composerObserver.observe(composerEl)
        }
      })
    },
    leaveDetail() {
      leaveToHistory(this.$route, this.$router)
    },
    measureComposer() {
      const el = this.$refs.composerRef
      this.composerHeight = el ? el.offsetHeight : 0
    },
    scrollBottom() {
      this.$nextTick(() => {
        const list = this.$refs.listRef
        if (list) list.scrollTop = list.scrollHeight
      })
    },
    resizeComposer() {
      this.resizeField()
      this.measureComposer()
    },
    onDraftInput(event) {
      this.resizeComposer()
      this._maxLengthToast.onInput(event)
    },
    onDraftBeforeInput(event, currentValue) {
      this._maxLengthToast.onBeforeInput(event, currentValue)
    },
    onDraftKeydown(event) {
      if (event.key !== 'Enter' || event.shiftKey) return
      if (event.isComposing || event.keyCode === 229) return
      event.preventDefault()
      this.send()
    },
    focusComposer() {
      const el = this.$refs.textareaRef
      if (!el) return
      const run = () => {
        el.focus({ preventScroll: true })
        this.syncKeyboardInset()
      }
      run()
      requestAnimationFrame(run)
    },
    onComposerFocus() {
      this.composerFocused = true
      this.syncKeyboardInset()
      this.$nextTick(() => {
        window.scrollTo(0, 0)
        this.syncKeyboardInset()
      })
    },
    onComposerBlur() {
      const textarea = this.$refs.textareaRef
      window.setTimeout(() => {
        if (document.activeElement !== textarea) {
          this.composerFocused = false
        }
      }, 0)
    },
    onRemoveImage(index) {
      const keepFocus = this.composerFocused || document.activeElement === this.$refs.textareaRef
      this.removeImage(index)
      if (keepFocus) this.focusComposer()
    },
    onRetryImage(index) {
      this.retryImage(index)
    },
    async send() {
      if (!this.quesId || !this.canSend || this.sending) return
      if (!this.draft.trim()) {
        toast('请输入文字描述')
        return
      }
      if (!this.assertReadyToSubmit()) return

      const text = this.draft.trim()
      const keys = this.getUploadedKeys()

      this.sending = true
      const body = Object.assign({
        appId: feedbackAppId,
        quesId: Number(this.quesId),
        note: text
      }, await buildIdentityParams())
      keys.slice(0, 3).forEach((key, index) => {
        body['attach' + (index + 1) + 'Path'] = rsaEncryptLong(key)
      })

      appendFeedback(body).then(res => {
        this.sending = false
        if (res && res.code === 10000) {
          const now = new Date()
          const pad = n => (n < 10 ? '0' + n : '' + n)
          const timeLabel = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() +
            '  ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())
          this.messages.push({
            id: 'msg-' + (++this._msgId),
            role: 'user',
            name: '我',
            time: timeLabel,
            text,
            images: this.localImages
              .filter(img => img.status === 'done')
              .map(img => img.url)
          })
          this.draft = ''
          this.localImages = []
          this.uploadList = []
          toastSuccess('发送成功')
          this.$nextTick(this.resizeComposer)
          this.$dataReport('LZ_feedback', 'LZ_appendInfoClick', 'click', {
            cardName: this.title,
            lid: this.currentLid()
          })
          this.$dataReport('LZ_feedback', 'LZ_appendInfoResult', 'report', {
            cardName: this.title,
            status: 'succ'
          })
        } else {
          toastError('发送失败，请重试')
          this.$dataReport('LZ_feedback', 'LZ_appendInfoResult', 'report', {
            cardName: this.title,
            status: 'fail'
          })
        }
      }).catch(() => {
        this.sending = false
        toastError('发送失败，请重试')
        this.$dataReport('LZ_feedback', 'LZ_appendInfoResult', 'report', {
          cardName: this.title,
          status: 'fail'
        })
      })
    }
  }
}
</script>

<style lang="scss" src="./index.scss"></style>
