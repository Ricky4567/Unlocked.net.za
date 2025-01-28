import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ViewInfo from '../views/ViewInfo.vue'
import Search from '../views/Search.vue'
import List from '../views/List.vue'
import CastMovies from '../views/CastMovies.vue'
import Tv from '../views/Tv.vue'
import Ana from '../views/Ana.vue'
import Netflix from '../views/Netflix.vue'
import Disney from '@/views/Disney.vue'
import Hulu from '@/views/hulu.vue'
import Prime from '@/views/prime.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/viewInfo',
    name: 'ViewInfo',
    component: ViewInfo
  },
  {
    path: '/amazon-prime',
    name: 'Prime',
    component: Prime
  },
  {
    path: '/search',
    name: 'Search',
    component: Search
  },
  {
    path: '/list',
    name: 'List',
    component: List
  },
  {
    path: '/hulu',
    name: 'Hulu',
    component: Hulu
  },
  {
    path: '/castMovies',
    name: 'CastMovies',
    component: CastMovies
  },
  {
    path: '/tv',
    name: 'Tv',
    component: Tv
  },
  {
    path: '/netflix',
    name: 'Netflix',
    component: Netflix
  },
  {
    path: '/disney',
    name: 'Disney',
    component: Disney,
   },
  {
    path: '/ana',
    name: 'Ana',
    component: Ana
  },
  {
    path: '/about',
    name: 'about',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
