<template>
  <div class="login-callback">
    <p>{{ text }}</p>
  </div>
</template>

<script>
import Cookies from 'js-cookie'

// 登录回调页面
// 联想通行证登录成功后，会跳转到本页面，携带 lenovoid.wust（token）和 lenovoid.ctx（原页面URL）
export default {
  name: 'LoginCallback',
  data() {
    return {
      text: '正在登录中....'
    }
  },
  created() {
    this.init()
    document.title = 'Legion Zone Online'
  },
  methods: {
    // 初始化登录回调
    init() {
      console.log('[登录回调] 页面加载，当前URL：', window.location.href)
      console.log('[登录回调] 完整hash：', window.location.hash)

      // 从 window.location.hash 里手动提取参数（因为联想ID回调时ctx里的#未编码，this.$route.query会截断）
      const hash = window.location.hash
      const getParam = (name) => {
        const key = name + '='
        const start = hash.indexOf(key)
        if (start === -1) return ''
        const valueStart = start + key.length
        const rest = hash.substring(valueStart)
        // 找到下一个 & 后面跟着字母的位置（下一个参数的开始）
        const nextParamMatch = rest.match(/&[a-zA-Z]/)
        if (nextParamMatch) {
          return rest.substring(0, nextParamMatch.index)
        }
        return rest
      }

      // 从hash中获取 token 和原页面地址
      const token = getParam('lenovoid.wust')
      const ctx = getParam('lenovoid.ctx')

      const maskToken = token ? (token.substring(0, 6) + '***' + token.substring(token.length - 4)) : ''
      console.log('[登录回调] 获取到token：', maskToken, '，长度：', token ? token.length : 0)
      console.log('[登录回调] 获取到ctx（原页面地址）：', ctx || '(空)')

      // 原页面地址（兼容两种格式：gateway接口返回base64，preLogin接口返回URL编码明文）
      let href = ''
      try {
        if (ctx) {
          const normalizedCtx = decodeURIComponent(ctx)
          // 判断是否为base64编码（只包含base64字符，且长度为4的倍数）
          const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(normalizedCtx) && normalizedCtx.length % 4 === 0
          if (isBase64) {
            href = window.atob(normalizedCtx)
            console.log('[登录回调] ctx为base64编码，解码后：', href)
          } else {
            // preLogin接口返回的是URL编码的明文，直接URL解码
            href = normalizedCtx
            console.log('[登录回调] ctx为URL编码明文，解码后：', href)
          }
        }
        console.log('[登录回调] 最终原页面地址：', href || '(空)')
      } catch (e) {
        console.error('[登录回调] 解码原页面地址失败：', e)
        href = ''
      }

      // 校验回调域名：仅允许跳回同源或白名单域名，防止开放重定向（token 随 URL 带回）。
      // smartdl.lenovo.com.cn 为各环境（test/pre-prod/prod）前端静态资源统一部署域（vite base / publicPath）
      const whiteList = ['.lenovo.com', '.lenovo.com.cn']
      let isValidDomain = false
      try {
        const hostname = new URL(href).hostname.toLowerCase()
        isValidDomain = hostname === window.location.hostname ||
          whiteList.some(domain => hostname.endsWith(domain) || hostname === domain.slice(1))
      } catch (e) {
        isValidDomain = false
      }
      console.log('[登录回调] 白名单域名：', whiteList.join(' / '), '，校验结果：', isValidDomain ? '通过' : '失败', '，href：', href)

      if (isValidDomain) {
        // 合法域名，保存 token 到 cookie
        if (token && token.length > 0) {
          // token 有效期 0.9 天（约21.6小时），和 legion-zone-official 保持一致
          // path设为'/'确保全站可读，否则默认只在当前路径（/logincallback）下有效
          Cookies.set('lenovoToken', token, { expires: 0.9, path: '/' })
          console.log('[登录回调] 已保存token到cookie（lenovoToken），有效期0.9天')
        } else {
          // 没有 token，清除旧 token
          Cookies.remove('lenovoToken')
          console.warn('[登录回调] 未获取到token，已清除旧cookie（lenovoToken）')
        }

        console.log('[登录回调] 跳回原页面：', href)
        // 跳回原页面
        window.location.replace(href)
      } else {
        // 非法域名，显示错误
        console.error('[登录回调] 非法域名，拒绝跳转，href：', href)
        this.text = '登录回调地址异常，请重新登录'
        Cookies.remove('lenovoToken')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.login-callback {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  text-align: center;
  transform: translateY(-50%);
  color: #fff;
  font-size: 16px;
  background-color: #040404;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  p {
    margin: 0;
  }
}
</style>