<template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style>
<style lang="scss">
.collapse-layout, .Layout {
  @media screen and (min-width: 1290px) {
    div.LimitDiscount > section > div:nth-child(6),
    div.LimitDiscount > section > div:nth-child(7) {
      display: block;
    }
  }

  @media screen and (min-width: 1520px) {
    div.LimitDiscount > section > div:nth-child(8),
    div.LimitDiscount > section > div:nth-child(9) {
      display: block;
    }
  }

  @media screen and (min-width: 1750px) {
    div.LimitDiscount > section > div:nth-child(10),
    div.LimitDiscount > section > div:nth-child(11) {
      display: block;
    }
  }
}
.expand-layout {
  @media screen and (min-width: 1390px) {
    div.LimitDiscount > section > div:nth-child(6),
    div.LimitDiscount > section > div:nth-child(7) {
      display: block;
    }
  }

  @media screen and (min-width: 1620px) {
    div.LimitDiscount > section > div:nth-child(8),
    div.LimitDiscount > section > div:nth-child(9) {
      display: block;
    }
  }

  @media screen and (min-width: 1850px) {
    div.LimitDiscount > section > div:nth-child(10),
    div.LimitDiscount > section > div:nth-child(11) {
      display: block;
    }
  }
}

</style>
