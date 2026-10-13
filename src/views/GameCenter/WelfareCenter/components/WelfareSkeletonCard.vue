<template>
  <div class="welfare-skeleton" role="status" aria-label="福利加载中"></div>
</template>

<script>
export default {
  name: 'WelfareSkeletonCard'
}
</script>

<style lang="scss" scoped>
.welfare-skeleton {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-width: 120px;
  max-width: 200px;
  aspect-ratio: 200 / 290;
  border-radius: 4px;
  background: #191919;
  box-sizing: border-box;
}
.welfare-skeleton--overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  max-width: none;
  min-width: 0;
  z-index: 20;
}
.welfare-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: #191919;
}
.welfare-skeleton::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 498px;
  height: 286px;
  pointer-events: none;
  z-index: 3;
  background: linear-gradient(150deg, transparent 42%, rgba(255, 255, 255, 0.08) 50%, transparent 58%);
  transform: translate(-50%, -50%) rotate(-30deg);
  animation: welfare-skeleton-sweep 2.4s linear infinite;
}
@keyframes welfare-skeleton-sweep {
  0% { transform: translate(-75%, -75%) rotate(-30deg); }
  85%, 100% { transform: translate(-25%, -25%) rotate(-30deg); }
}
@media (prefers-reduced-motion: reduce) {
  .welfare-skeleton::before { animation: none; }
}
</style>
