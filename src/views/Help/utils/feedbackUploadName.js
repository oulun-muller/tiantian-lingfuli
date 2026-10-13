export function buildFeedbackUploadName(file) {
  const name = (file && file.name) || ''
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'image'
  const ext = (dot > 0 ? name.slice(dot + 1) : '').replace(/[^A-Za-z0-9]/g, '').toLowerCase() || 'jpg'
  const uid = String(file && file.uid).replace(/[^A-Za-z0-9_-]/g, '')
  return `${base}${uid}.${ext}`
}
