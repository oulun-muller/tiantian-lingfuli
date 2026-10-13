<template>
  <div class="lz-help">
    <div class="page form-page">
      <HelpNavBar title="我要反馈" manual-back @back="leaveForm">
        <template #right>
          <button
            type="button"
            class="submit"
            :class="{ 'submit--ready': canSubmit }"
            :disabled="!canSubmit || submitting"
            @click="submit">
            提交
          </button>
        </template>
      </HelpNavBar>

      <main class="page__body--scroll">
        <div class="page__body form">
          <section class="block">
            <p class="label">反馈类型 <span class="req">*</span></p>
            <div class="types">
              <button
                v-for="type in types"
                :key="type.code"
                type="button"
                class="type"
                :class="{ 'type--active': selectedType === type.code }"
                @click="selectedType = type.code">
                <span>{{ type.name }}</span>
                <img
                  v-if="selectedType === type.code"
                  class="type__check"
                  :src="iconCheck"
                  width="20"
                  height="20"
                  alt="">
              </button>
            </div>
          </section>

          <section class="block">
            <p class="label">问题描述 <span class="req">*</span></p>
            <div class="surface-card desc">
              <div class="desc__text">
                <div class="desc__field-wrap">
                  <div
                    ref="descFieldRef"
                    class="desc__field"
                    @scroll="updateFieldScrollbar">
                    <textarea
                      ref="descTextareaRef"
                      v-model="description"
                      :maxlength="DESC_MAX_LENGTH"
                      rows="1"
                      placeholder="期待你的建议，帮助我们做的更好～"
                      @input="onDescInput"
                      @beforeinput="onDescBeforeInput($event, description)" />
                  </div>
                  <div
                    v-show="fieldScrollbar.visible"
                    class="desc__scrollbar"
                    aria-hidden="true">
                    <div
                      class="desc__scrollbar-thumb"
                      :style="{ height: fieldScrollbar.thumbH + 'px', transform: 'translateY(' + fieldScrollbar.thumbTop + 'px)' }" />
                  </div>
                </div>
                <p class="desc__count">{{ description.length }}/{{ DESC_MAX_LENGTH }}</p>
              </div>
              <div class="divider tight" />
              <div class="desc__photos">
                <HelpPhotoThumb
                  v-for="(img, index) in localImages"
                  :key="img.id"
                  :src="img.url"
                  :size="88"
                  :status="img.status"
                  deletable
                  @remove="removeImage(index)"
                  @retry="retryImage(index)" />
                <el-upload
                  ref="imageUpload"
                  v-if="localImages.length < 3"
                  :show-file-list="false"
                  :file-list="uploadList"
                  :auto-upload="false"
                  :on-change="onFileChange"
                  :accept="'image/*'"
                  :multiple="imageAllowMultiple"
                  list-type="picture"
                  action=""
                  class="uploader">
                  <span class="uploader__icon-wrap">
                    <img class="uploader__icon" :src="iconAddPicture" width="24" height="24" alt="">
                  </span>
                  <span class="uploader__text">
                    <span>附加照片</span>
                    <span>{{ localImages.length }}/3</span>
                  </span>
                </el-upload>
              </div>
            </div>
          </section>

          <section class="block">
            <div class="contact-head">
              <p class="label plain">联系方式</p>
              <p
                class="contact-hint"
                :class="{ 'contact-hint--error': phoneError || qqError }">
                {{ contactHint }}
              </p>
            </div>
            <div class="surface-card contact">
              <label class="field">
                <span>QQ号码</span>
                <input
                  v-model="qq"
                  type="text"
                  inputmode="numeric"
                  placeholder="点击输入QQ号码"
                  @blur="qqTouched = true">
              </label>
              <div class="divider" />
              <label class="field">
                <span>手机号码</span>
                <input
                  v-model="phone"
                  type="tel"
                  inputmode="numeric"
                  placeholder="点击输入手机号码"
                  @blur="phoneTouched = true">
              </label>
            </div>
          </section>

          <div
            v-if="qqGroup"
            class="qq-tip">
            <img class="qq-tip__icon" :src="iconBell" width="16" height="16" alt="">
            <button type="button" class="qq-tip__text" @click="openQQGroup">{{ qqGroup.text }}</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import Axios from 'axios'
import HelpNavBar from '../components/HelpNavBar.vue'
import HelpPhotoThumb from '../components/HelpPhotoThumb.vue'
import { createMaxLengthToast } from '../utils/maxLengthToast'
import { leaveToHelpCenter } from '../utils/helpTab'
import { toast, toastSuccess, toastError } from '../utils/toast'
import { rsaEncrypt, rsaEncryptLong, rsaDecryptLong } from '../utils/rsaEncrypt'
import { getDeviceNo } from '../utils/feedbackIdentity'
import { buildFeedbackUploadName } from '../utils/feedbackUploadName'
import { getQuesTypes, submitFeedback } from '@/api/feedback'
import { getConfigByKey } from '@/api'
import { generateFeedbackSignParams } from '@/utils/signRequest'
import { client } from '@/utils/aliyunOSConfig'
import { getSupportThirdApp } from '@/nativeApiPad/common'
import iconCheck from '../images/icon-check.svg'
import iconAddPicture from '../images/icon-add-picture.svg'
import iconBell from '../images/icon-bell.svg'

const DESC_FIELD_MIN = 48
const DESC_FIELD_MAX = 228
const DESC_MAX_LENGTH = 500
const PHONE_REGEX = /^1[3-9]\d{9}$/
const QQ_REGEX = /^[1-9]\d{4,10}$/
const MAX_IMAGES = 3
const MAX_IMAGE_BYTES = 50 * 1024 * 1024
const MAX_TOTAL_IMAGE_BYTES = 120 * 1024 * 1024

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
  name: 'FeedbackForm',
  components: { HelpNavBar, HelpPhotoThumb },
  data() {
    return {
      DESC_MAX_LENGTH,
      types: [],
      selectedType: '',
      description: '',
      qq: '',
      phone: '',
      phoneTouched: false,
      qqTouched: false,
      qqGroup: null,
      submitting: false,
      iconCheck,
      iconAddPicture,
      iconBell,
      uploadList: [],
      localImages: [],
      fieldScrollbar: {
        visible: false,
        thumbH: 36,
        thumbTop: 4
      }
    }
  },
  computed: {
    canSubmit() {
      return Boolean(this.selectedType) && (this.description.trim().length > 0 || this.localImages.length > 0)
    },
    phoneError() {
      if (!this.phoneTouched || !this.phone.trim()) return ''
      return PHONE_REGEX.test(this.phone.trim()) ? '' : '请输入正确手机号码'
    },
    qqError() {
      if (!this.qqTouched || !this.qq.trim()) return ''
      return QQ_REGEX.test(this.qq.trim()) ? '' : '请输入正确QQ号码'
    },
    contactHint() {
      return this.phoneError || this.qqError || '请提供联系方式，以便我们能与您取得联系'
    },
    imageRemainCount() {
      return Math.max(0, MAX_IMAGES - this.localImages.length)
    },
    imageAllowMultiple() {
      return this.imageRemainCount > 1
    }
  },
  watch: {
    description() {
      this.$nextTick(this.resizeField)
    }
  },
  created() {
    this._autoGrowOpts = {
      minHeight: DESC_FIELD_MIN,
      maxHeight: DESC_FIELD_MAX
    }
    this._autoGrowRefs = { fieldRefName: 'descFieldRef', textareaRefName: 'descTextareaRef' }
    this._maxLengthToast = createMaxLengthToast(DESC_MAX_LENGTH)
    this.fetchTypes()
    this.fetchQQGroup()
    this.$dataReport('LZ_feedback', 'LZ_fbPageShow', 'pv', { showType: '2' })
  },
  mounted() {
    this.$nextTick(this.resizeField)
  },
  beforeUnmount() {
    this.clearImages()
  },
  methods: {
    // --- autoGrowField 内联 ---
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

    // --- OSS STS 上传 ---
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
      console.error('[FeedbackForm] image upload failed', {
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

    // --- el-upload on-change 回调 ---
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
      this.localImages.forEach(img => {
        if (img.url && img.url.indexOf('blob:') === 0) URL.revokeObjectURL(img.url)
      })
      this.localImages = []
      this.uploadList = []
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

    // --- 页面业务 ---
    fetchTypes() {
      getQuesTypes().then(res => {
        if (res && res.code === 10000 && res.data) {
          this.types = res.data.slice().sort((a, b) => Number(a.code) - Number(b.code))
        }
      }).catch(() => {})
    },
    fetchQQGroup() {
      getConfigByKey('QQ_CONFIG').then(configValue => {
        const config = JSON.parse(configValue)
        const url = new URL(config.url)
        if (!config.text || !['http:', 'https:'].includes(url.protocol)) {
          throw new Error('invalid QQ_CONFIG')
        }
        this.qqGroup = {
          text: config.text,
          url: url.href
        }
      }).catch(error => {
        console.error('[FeedbackForm] failed to load QQ group config', error)
      })
    },
    async openQQGroup() {
      const url = this.qqGroup && this.qqGroup.url
      if (!url) return

      if (this.$isPadDevice && window.LegionZoneMobile) {
        try {
          const support = await getSupportThirdApp('qq')
          if (support === 'true') {
            window.open(url, '_blank')
            return
          }
        } catch (error) {
          console.warn('[FeedbackForm] failed to open QQ client', error)
        }
      }
      toast('未检测到QQ')
    },
    onDescInput(event) {
      this.resizeField()
      this._maxLengthToast.onInput(event)
    },
    onDescBeforeInput(event, currentValue) {
      this._maxLengthToast.onBeforeInput(event, currentValue)
    },
    leaveForm() {
      leaveToHelpCenter(this.$route, this.$router)
    },
    async buildSubmitBody() {
      const system = this.$store.state.system || {}
      const mtm = system.MTMInfo || {}
      const userInfo = (this.$store.state.user || {}).userInfo
      const deviceNo = await getDeviceNo()
      const body = {
        quesType: Number(this.selectedType),
        note: this.description.trim(),
        deviceNo: rsaEncrypt(deviceNo || '-'),
        deviceType: mtm.MTCode || mtm.ReadableMachineName || '-',
        mac: rsaEncrypt(system.mac || '-'),
        sn: rsaEncrypt(mtm.MachineName || '-'),
        osVersion: mtm.OS || '-',
        appVersion: system.version || '-',
        appChannel: system.Channel || 'default',
        appSource: '-',
        lenovoid: rsaEncrypt(userInfo && userInfo.UserID ? userInfo.UserID : '-'),
        qq: this.qq.trim() ? rsaEncrypt(this.qq.trim()) : undefined,
        phone: this.phone.trim() ? rsaEncrypt(this.phone.trim()) : undefined,
        otherParams: JSON.stringify({ mtm: mtm.MTM || '' })
      }
      const keys = this.getUploadedKeys()
      keys.slice(0, 3).forEach((key, index) => {
        body['attach' + (index + 1) + 'Path'] = rsaEncryptLong(key)
      })
      return body
    },
    async submit() {
      if (!this.canSubmit || this.submitting) return
      if (!this.description.trim()) {
        toast('请输入文字描述')
        return
      }
      if (!this.assertReadyToSubmit()) return

      if (this.qq.trim()) {
        this.qqTouched = true
        if (!QQ_REGEX.test(this.qq.trim())) {
          toast('请输入正确QQ号码')
          return
        }
      }
      if (this.phone.trim()) {
        this.phoneTouched = true
        if (!PHONE_REGEX.test(this.phone.trim())) {
          toast('请输入正确手机号码')
          return
        }
      }

      this.submitting = true
      const body = await this.buildSubmitBody()
      const lid = (this.$store.state.user || {}).userInfo ? this.$store.state.user.userInfo.UserID : ''
      const reportSub = (status, error) => {
        this.$dataReport('LZ_feedback', 'LZ_fbSubClick', 'click', {
          lid,
          info: JSON.stringify({
            fbType: (this.types.find(t => t.code === this.selectedType) || {}).name || '',
            questionDes: this.description.trim(),
            status,
            error
          })
        })
      }
      submitFeedback(body).then(res => {
        this.submitting = false
        if (res && res.code === 10000) {
          toastSuccess('提交成功')
          reportSub('succ', '')
          this.clearImages()
          this.leaveForm()
        } else {
          toastError('提交失败，请重试')
          reportSub('fail', (res && res.message) || 'submit failed')
        }
      }).catch(err => {
        this.submitting = false
        toastError('提交失败，请重试')
        reportSub('fail', (err && err.message) || 'submit error')
      })
    }
  }
}
</script>

<style lang="scss" src="./index.scss"></style>