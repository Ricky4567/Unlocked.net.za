<template>
  <div>
    <!-- Only mount the mobile view if isMobile is true -->
    <Viewinfo v-if="isMobile" />
    <!-- Only mount the desktop view if isMobile is false -->
    <Viewinfos v-if="!isMobile" />
  </div>
</template>

<script>
import Viewinfo from '@/components/ViewMobile.vue'
import Viewinfos from '@/components/Viewinfos.vue'

export default {
  name: 'App',
  components: {
    Viewinfo,
    Viewinfos
  },
  data() {
    return {
      isMobile: false
    }
  },
  mounted() {
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile);
  },
  methods: {
    checkIfMobile() {
      this.isMobile = window.innerWidth <= 600;
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkIfMobile);
  }
}
</script>

<style scoped>
.image {
  margin-top: 70px;
  height: 210px;
}

@media only screen and (max-width: 600px) {
  .image {
    height: 140px;
  }
}
</style>
