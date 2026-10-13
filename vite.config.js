import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createEnvDefines } from './config/loadEnv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function tildeAliasPlugin() {
  return {
    name: 'tilde-at-alias',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(vue|scss|sass|css)($|\?)/.test(id)) return null
      if (!code.includes('~@/')) return null
      return {
        code: code.replace(/~@\//g, '@/'),
        map: null
      }
    }
  }
}

function resolvePublicPath(mode, env) {
  if (mode === 'prod') {
    return 'https://smartdl.lenovo.com.cn/frontend/legion-zone/legion-zone-pad/prod/'
  }
  if (mode === 'pre-prod' || mode === 'test') {
    return `https://smartdl.lenovo.com.cn/frontend/legion-zone/legion-zone-online-mobile/${mode}/`
  }
  return env.VITE_PUBLIC_PATH || '/'
}

export default defineConfig(({ mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), '')
  const appEnv = createEnvDefines(mode)
  const publicPath = mode === 'preview' ? '/tiantian-lingfuli/' : resolvePublicPath(mode, viteEnv)

  return {
    base: publicPath,
    plugins: [
      tildeAliasPlugin(),
      vue()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        vue: path.resolve(__dirname, 'node_modules/vue/dist/vue.runtime.esm-bundler.js'),
        'element-ui': path.resolve(__dirname, 'src/compat/element-ui.js')
      },
      extensions: ['.mjs', '.vue', '.js', '.json']
    },
    define: {
      'process.env': appEnv,
      ...(mode === 'preview' ? { 'import.meta.env.DEV': 'true', 'import.meta.env.PROD': 'false' } : {}),
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api', 'import']
        }
      }
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/cloud-legionzone-game-activity-start': {
          target: 'https://cloud-rest.mbgtest.lenovomm.com',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      cssCodeSplit: true
    }
  }
})
