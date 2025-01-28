<template>
  <div>
    <v-app-bar v-show="!isMobile" color="black" height="95px">
      <v-img src="../assets/logo1.png" alt="Logo" contain class="image mx-auto mb-4"></v-img>
    </v-app-bar>
    <Cara v-show="!isMobile"/>
    <Cards style="margin-top:-100px" v-show="!isMobile"/>
    <Movie v-show="isMobile"/>
    <Continue v-show="!isMobile"/>
    <Continues v-show="isMobile"/>
    <Top  v-show="!isMobile"/>
    <MovieMobile v-show="isMobile"/>
    <Comedys v-show="isMobile"/>
    <Comedy  v-show="!isMobile"/>
    <Action v-show="!isMobile"/>
    <Actions  v-show="isMobile"/>
  </div>
</template>

<script>
import Comedy from '@/components/Comedy.vue'
import Cards from '@/components/Cards.vue'
import Comedys from '@/components/ComedyMobile.vue'
import Cara from '../components/Cara.vue'
import Top from '../components/Top.vue'
import Continue from '../components/Continue.vue'
import Continues from '../components/Continues.vue'
import Action from '../components/Action.vue'
import Actions from '../components/ActionMobile.vue'
import Movie from '../components/Mobile.vue'
import MovieMobile from '../components/MoviesMobile.vue'
export default {
  name: 'App',
  components: {
    Cara,
    Top,
    Comedy,
    Comedys,
    Cards,
    Movie,
    Continue,
    Continues,
    MovieMobile,
    Action,
    Actions
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
    height: 100px;
  }
}
</style>
