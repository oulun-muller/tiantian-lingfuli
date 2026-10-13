
export function gamePeopleFilter(value) {
  const num = Number(value)

  // 处理非数字的情况
  if (isNaN(num)) {
    return value // 非数字原样返回
  }

  // 大于等于1万时格式化
  if (num >= 10000) {
    // 保留一位小数（可根据需求调整）
    return (num / 10000).toFixed(1) + '万'
  }

  // 小于1万时直接返回原数字
  return num
}
