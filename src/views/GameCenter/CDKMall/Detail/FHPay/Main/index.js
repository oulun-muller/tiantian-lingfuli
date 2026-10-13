import Base64 from '@/utils/base64'

const PRESALE_BASE_URL = process.env.ENVIRONMENT === 'prod'
  ? 'https://cloud-rest.lenovomm.com/front-store/presale/2225'
  : 'https://pc-store-front.mbgtest.lenovomm.com/presale/2225'

export default {
  name: 'Main',
  data() {
    return {
      firstId: '',
      secondId: '',
      taskId: '',
      onClose: null
    }
  },
  computed: {
    userInfo() {
      return this.$store?.state?.user?.userInfo || null
    },
    channelInfo() {
      return this.$store?.state?.channelInfo || null
    },
    presaleUrl() {
      // 取支付所需的登录态：商店渠道的 token/realm 在 channelInfo.channelUserInfo，普通登录在 userInfo。
      // 两者都为空时（未登录），token/realm 传空，支付页自行处理。
      const channelUser = this.channelInfo?.channelUserInfo || {}
      const loginUser = this.userInfo || {}
      const account =
        (loginUser.Token && loginUser) ||
        (channelUser.Token && channelUser) ||
        loginUser
      const token = account.Token ? Base64.encode(account.Token) : ''
      const realm = account.Realm ? Base64.encode(account.Realm) : ''
      const params = new URLSearchParams({
        chan: 'legionzone',
        token,
        realm,
        from: 'legionzone'
      })
      if (this.taskId) params.set('taskId', String(this.taskId))

      return `${PRESALE_BASE_URL}_${this.firstId}_${this.secondId}?${params.toString()}`
    }
  },
  methods: {
    close() {
      if (typeof this.onClose === 'function') {
        this.onClose()
      }
      this.$destroy()
    }
  }
}