const MODEL = 'Pbase.dll'

// 写入配置信息
export function setRegConfig(params) {
  return window.LegionZone?.nativeCall(MODEL, 'SetRegConfig', params)
}

// 读出配置信息
export function getRegConfig(Name) {
  return window.LegionZone?.nativeCall(MODEL, 'GetRegConfig', { Name })
}

/**
 * 启动 NN 语音社区
 * @param {string} cmdline 启动命令行参数（nn:// 协议 URL）
 * @returns {Promise<{ret: number, msg?: string}>} 成功：{ret: 0}，失败：{ret: 1, msg: 'File not Exist'}
 */
export function launchNNBBS(cmdline) {
  return window.LegionZone?.nativeCall(MODEL, 'Launch_NNBBS', { cmdline })
}
