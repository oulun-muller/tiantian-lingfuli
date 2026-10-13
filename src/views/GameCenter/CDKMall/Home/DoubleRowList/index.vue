<template src="./index.html"></template>

<script src="./index.js"></script>

<style lang="scss" src="./index.scss" scoped></style>
<style lang="scss">
.collapse-layout, .Layout {
  @media screen and (min-width: 1290px) {
    div.DoubleRowList > section > div:nth-child(9),
    div.DoubleRowList > section > div:nth-child(10) {
      display: block;
    }
  }

  @media screen and (min-width: 1520px) {
    div.DoubleRowList > section > div:nth-child(11),
    div.DoubleRowList > section > div:nth-child(12) {
      display: block;
    }
  }

  @media screen and (min-width: 1750px) {
    div.DoubleRowList > section > div:nth-child(13),
    div.DoubleRowList > section > div:nth-child(14) {
      display: block;
    }
  }
}
.expand-layout {
  @media screen and (min-width: 1390px) {
    div.DoubleRowList > section > div:nth-child(9),
    div.DoubleRowList > section > div:nth-child(10) {
      display: block;
    }
  }

  @media screen and (min-width: 1620px) {
    div.DoubleRowList > section > div:nth-child(11),
    div.DoubleRowList > section > div:nth-child(12) {
      display: block;
    }
  }

  @media screen and (min-width: 1850px) {
    div.DoubleRowList > section > div:nth-child(13),
    div.DoubleRowList > section > div:nth-child(14) {
      display: block;
    }
  }
}

</style>
