<template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style>
<style lang="scss">
.collapse-layout, .Layout {
  @media screen and (min-width: 1370px) {
    div.ThreeLeaderBoard > div:nth-child(4) {
      display: block;
    }
  }

  @media screen and (min-width: 1680px) {
    div.ThreeLeaderBoard > div:nth-child(5) {
      display: block;
    }
  }
}
.expand-layout {
  @media screen and (min-width: 1470px) {
    div.ThreeLeaderBoard > div:nth-child(4) {
      display: block;
    }
  }

  @media screen and (min-width: 1780px) {
    div.ThreeLeaderBoard > div:nth-child(5) {
      display: block;
    }
  }
}

</style>
