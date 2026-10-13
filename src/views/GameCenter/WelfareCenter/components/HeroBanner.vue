<template>
  <div class="hero-banner" :class="{ 'is-landscape': landscape }">
    <span class="hero-banner__background" aria-hidden="true" />
    <span class="hero-banner__content" aria-hidden="true">
      <img class="hero-banner__title" :src="bannerTitle" alt="" />
      <img class="hero-banner__main" :src="bannerMain" alt="" />
    </span>
  </div>
</template>

<script>
import bannerMain from '../image/banner-main.png'
import bannerTitle from '../image/banner-title.png'

export default {
  name: 'HeroBanner',
  props: {
    landscape: { type: Boolean, default: false }
  },
  data() {
    return {
      bannerMain,
      bannerTitle
    }
  }
}
</script>

<style lang="scss" scoped>
.hero-banner {
  --banner-scale: 1px;
  --banner-height: 240px;
  --banner-content-width: 600px;

  position: relative;
  display: block;
  width: 100%;
  height: var(--banner-height);
  overflow: hidden;
  background: #121212;
  isolation: isolate;
  -webkit-tap-highlight-color: transparent;
}

.hero-banner__background,
.hero-banner__content {
  position: absolute;
  inset: 0;
}

.hero-banner__background {
  z-index: 0;
  background: url('../image/banner-background.png') center / cover no-repeat;
}

.hero-banner__content {
  z-index: 1;
  left: 50%;
  right: auto;
  width: 100%;
  max-width: var(--banner-content-width);
  transform: translateX(-50%);
}

.hero-banner__title,
.hero-banner__main {
  position: absolute;
  display: block;
  max-width: none;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.hero-banner__title {
  z-index: 2;
  left: calc(17.5 * var(--banner-scale));
  top: calc(82 * var(--banner-scale));
  width: calc(186 * var(--banner-scale));
  height: calc(76 * var(--banner-scale));
}

.hero-banner__main {
  z-index: 1;
  right: calc(-38.5 * var(--banner-scale));
  top: calc(26 * var(--banner-scale));
  width: calc(445 * var(--banner-scale));
  height: calc(188 * var(--banner-scale));
}

@media (min-width: 641px) {
  .hero-banner {
    --banner-scale: 1.5px;
    --banner-height: 270px;
    --banner-content-width: 840px;
  }

  .hero-banner__title {
    left: 32.5px;
    top: 78px;
  }

  .hero-banner__main {
    right: 5.25px;
    top: -6.5px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-banner {
    scroll-behavior: auto;
  }
}
</style>
