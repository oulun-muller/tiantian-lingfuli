function selectPattern(value) {
  if (value < 0.4) return 'AAB'
  if (value < 0.65) return 'ABA'
  if (value < 0.9) return 'BAA'
  return 'ABC'
}

function getUniqueRealPrizes(awardList) {
  const seen = new Set()
  return awardList.filter(prize => {
    if (!prize || prize.type === 1 || prize.id === undefined || prize.id === null || seen.has(prize.id)) return false
    seen.add(prize.id)
    return true
  })
}

function samplePrizes(prizes, random) {
  const shuffled = prizes.slice()
  for (let index = shuffled.length - 1; index > 0; index--) {
    const targetIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]]
  }
  return shuffled.slice(0, 3)
}

function buildReels(pattern, [prizeA, prizeB, prizeC]) {
  switch (pattern) {
    case 'AAB': return [prizeA, prizeA, prizeB]
    case 'ABA': return [prizeA, prizeB, prizeA]
    case 'BAA': return [prizeB, prizeA, prizeA]
    case 'ABC': return [prizeA, prizeB, prizeC]
    default: throw new Error('Unknown slot machine stop pattern')
  }
}

export function resolveSlotMachineResult({ resultPrize, awardList, random = Math.random }) {
  if (!resultPrize || resultPrize.id === undefined || resultPrize.id === null) throw new Error('Invalid lottery result')
  if (!Array.isArray(awardList)) throw new Error('Invalid prize pool')

  if (resultPrize.type !== 1) return { pattern: 'WIN', reels: [resultPrize, resultPrize, resultPrize] }

  const realPrizes = getUniqueRealPrizes(awardList)
  if (realPrizes.length < 3) throw new Error('At least three real prizes are required')

  const pattern = selectPattern(random())
  return { pattern, reels: buildReels(pattern, samplePrizes(realPrizes, random)) }
}
