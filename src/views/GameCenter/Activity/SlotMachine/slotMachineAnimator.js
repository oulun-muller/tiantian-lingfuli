const REEL_COUNT = 3
const DEFAULT_STOP_DELAYS = [600, 1200, 1800]
const DEFAULT_COMPLETE_DELAY = 400
const DEFAULT_SPIN_SPEED_CELLS = 8
const DEFAULT_DECEL_DURATION = 1200

function defaultScheduler() {
  return {
    requestAnimationFrame: callback => requestAnimationFrame(callback),
    cancelAnimationFrame: id => cancelAnimationFrame(id),
    setTimeout: (callback, delay) => setTimeout(callback, delay),
    clearTimeout: id => clearTimeout(id),
    now: () => performance.now()
  }
}

function modP(value, period) {
  return ((value % period) + period) % period
}

function hermiteH10(value) { return value * value * (value - 2) + value }
function hermiteH01(value) { return -2 * value * value * value + 3 * value * value }

export function createSlotMachineAnimator({
  getPrizes,
  getCellHeight,
  onReelTransform,
  onReelStop = () => {},
  onComplete,
  scheduler = defaultScheduler(),
  spinSpeedCells = DEFAULT_SPIN_SPEED_CELLS,
  stopDelays = DEFAULT_STOP_DELAYS,
  completeDelay = DEFAULT_COMPLETE_DELAY,
  decelDuration = DEFAULT_DECEL_DURATION
}) {
  let rawY = [0, 0, 0]
  let velocities = [0, 0, 0]
  let decel = [null, null, null]
  let prizes = []
  let cellHeight = 0
  let period = 0
  let rafId = null
  let lastTimestamp = null
  let stopTimers = []
  let completeTimer = null
  let running = false

  const refreshGeometry = () => {
    prizes = getPrizes() || []
    cellHeight = getCellHeight() || 0
    period = prizes.length * cellHeight
  }
  const applyTransform = index => onReelTransform(index, period > 0 ? -modP(-rawY[index], period) : 0)
  const beginDecel = (index, target) => {
    const targetIndex = Math.max(prizes.findIndex(prize => prize.id === target.id), 0)
    const targetY = -(targetIndex * cellHeight)
    const velocity = spinSpeedCells * cellHeight
    const tangent = velocity * (decelDuration / 1000)
    const base = modP(rawY[index] - targetY, period)
    const minimumDistance = tangent / 2
    const cycles = Math.max(0, Math.ceil((minimumDistance - base) / period))
    decel[index] = { startY: rawY[index], distance: base + cycles * period, tangent, startTime: scheduler.now() }
    velocities[index] = 0
  }
  const tick = timestamp => {
    if (!running) return
    if (lastTimestamp === null) lastTimestamp = timestamp
    const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05)
    lastTimestamp = timestamp
    let allStopped = true
    for (let index = 0; index < REEL_COUNT; index++) {
      const state = decel[index]
      if (state) {
        const progress = Math.min((timestamp - state.startTime) / decelDuration, 1)
        rawY[index] = state.startY - (hermiteH10(progress) * state.tangent + hermiteH01(progress) * state.distance)
        applyTransform(index)
        if (progress === 1) {
          decel[index] = null
          onReelStop(index)
        } else allStopped = false
      } else if (velocities[index] > 0) {
        rawY[index] -= velocities[index] * deltaSeconds
        applyTransform(index)
        allStopped = false
      }
    }
    if (allStopped) {
      rafId = null
      completeTimer = scheduler.setTimeout(() => {
        completeTimer = null
        running = false
        onComplete()
      }, completeDelay)
      return
    }
    rafId = scheduler.requestAnimationFrame(tick)
  }
  const clear = () => {
    if (rafId !== null) scheduler.cancelAnimationFrame(rafId)
    stopTimers.forEach(timer => scheduler.clearTimeout(timer))
    if (completeTimer !== null) scheduler.clearTimeout(completeTimer)
    rawY = [0, 0, 0]
    velocities = [0, 0, 0]
    decel = [null, null, null]
    rafId = null
    stopTimers = []
    completeTimer = null
    running = false
  }
  return {
    start() {
      clear()
      refreshGeometry()
      if (!prizes.length || cellHeight <= 0) return false
      running = true
      velocities = Array(REEL_COUNT).fill(spinSpeedCells * cellHeight)
      lastTimestamp = null
      rafId = scheduler.requestAnimationFrame(tick)
      return true
    },
    stopReels(targets) {
      if (!running || !Array.isArray(targets) || targets.length !== REEL_COUNT || targets.some(target => !target || target.id === undefined)) return false
      refreshGeometry()
      if (!prizes.length || cellHeight <= 0 || period <= 0) return false
      stopTimers.forEach(timer => scheduler.clearTimeout(timer))
      stopTimers = targets.map((target, index) => scheduler.setTimeout(() => beginDecel(index, target), stopDelays[index]))
      return true
    },
    clear
  }
}
