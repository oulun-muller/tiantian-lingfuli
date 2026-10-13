<template>
  <div class="tag-item">
    {{ title }}
  </div>
</template>

<script>
export default {
  name: '',
  components: {},
  props: {
    title: {
      type: String,
      default: ''
    }
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {},
  methods: {}
}
</script>

<style scoped lang="scss">
.tag-item {
  display: inline-block;
  height: 22px;
  padding: 0px 4px;
  border-radius: 1px;
  border: 0.5px solid rgba(255, 255, 255, 0.30);
  background: rgba(0, 0, 0, 0.4);
  font-size: 10px;
  color: #EAF7FF;
  opacity: 0.7;
  width: fit-content;
  backdrop-filter: blur(100px);
  line-height: 22px;
    font-weight: normal;
}

</style>
