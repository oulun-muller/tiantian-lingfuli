const relModules = import.meta.glob(
  [
    '../images/**/*.{png,jpg,jpeg,gif,svg,webp,ico}',
    '../fonts/**/*.{ttf,otf,woff,woff2}',
    '../assets/**/*'
  ],
  { eager: true, import: 'default', query: '?url' }
)

function normalize(p) {
  let s = String(p || '')
  if (s.startsWith('@/')) s = s.slice(2)
  if (s.startsWith('/')) s = s.slice(1)
  s = s.split(String.fromCharCode(92)).join('/')
  return s
}

export default function resolveAsset(input) {
  const p = normalize(input)
  const keys = Object.keys(relModules)
  for (let i=0;i<keys.length;i++) {
    const nk = keys[i].split(String.fromCharCode(92)).join('/')
    if (nk.endsWith('/' + p) || nk.endsWith(p)) return relModules[keys[i]]
  }
  const file = p.split('/').pop()
  for (let i=0;i<keys.length;i++) {
    const nk = keys[i].split(String.fromCharCode(92)).join('/')
    if (nk.endsWith('/' + file)) return relModules[keys[i]]
  }
  console.warn('[resolveAsset] missing', p)
  return ''
}
