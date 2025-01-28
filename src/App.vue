<template>
  <v-app :class="{'app-container': !isMobileOrTablet}" style="background-color:black;">
    <Navbar v-show="!isMobileOrTablet"/>
    <v-main :class="{'main-content': !isMobileOrTablet, 'main-content-mobile': isMobileOrTablet}">
      <router-view/>
    </v-main>
    <v-bottom-navigation
      v-show="isMobileOrTablet"
      v-model="active"
      app
      height="70px"
      dark
      class="pa-2"
      grow
    >
      <div class="slider" :style="sliderStyle"></div>
      <v-btn
        v-for="item in navItems"
        :key="item.text"
        text
        hide-details
        :class="{'active-icon': activeIcon === item.text}"
        @click="navigateTo(item, $event)"
        exact
      >
        <v-icon>{{ item.icon }}</v-icon>
        <span>{{ item.text }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script>
import { getFirestore, setDoc, doc,getDoc } from "firebase/firestore";
import { firebaseApp } from "./firebaseConfig";
import Navbar from './components/Navbar.vue';
import 'video.js/dist/video-js.css';

const db = getFirestore(firebaseApp);

export default {
  name: 'App',
  components: {
    Navbar 
  },
  data: () => ({
    value: null,
    isMobileOrTablet: false,
    active: null,
    activeIcon: '',
    sliderStyle: {
      left: '50%',
      transform: 'translateX(-50%)',
      transition: 'left 0.5s ease-in-out'
    },
    navItems: [
      { icon: 'mdi-home-circle', text: 'Home', route: '/' },
      { icon: 'mdi-television-box', text: 'Channels', route: '/Tv' },
      { icon: 'mdi-format-list-checks', text: 'My List', route: '/list' },
      { icon: 'mdi-magnify', text: 'Search', route: '/search' },
    ],
    userId: null,
  }),
  created() {
    this.checkScreenSize();
    this.setActiveIconByRoute();
    window.addEventListener('resize', this.checkScreenSize);
    
    this.getUserId().then(() => {
      this.trackAction('page_load', { timestamp: new Date().toISOString(), route: this.$route.path });
    });
  },
  watch: {
    $route(to, from) {
      this.setActiveIconByRoute();
      this.trackAction('route_change', { from: from.path, to: to.path, timestamp: new Date().toISOString() });
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize);
  },
  methods: {
    checkScreenSize() {
      this.isMobileOrTablet = window.innerWidth <= 1024;
    },
    setActiveIcon(text, event) {
      this.activeIcon = text;
      const itemWidth = event.currentTarget.offsetWidth;
      const itemLeft = event.currentTarget.offsetLeft;
      const parentLeft = event.currentTarget.parentElement.offsetLeft;
      const sliderLeft = itemLeft - parentLeft + itemWidth / 2;

      this.sliderStyle = {
        left: `${sliderLeft}px`,
        transform: 'translateX(-50%)',
        transition: 'left 0.5s ease-in-out'
      };
    },
    navigateTo(item, event) {
      this.$router.push(item.route);
      this.setActiveIcon(item.text, event);
      this.trackAction('navigate', { route: item.route });
    },
    setActiveIconByRoute() {
      const currentRoute = this.$route.path;
      const activeItem = this.navItems.find(item => item.route === currentRoute);
      if (activeItem) {
        this.activeIcon = activeItem.text;
        this.$nextTick(() => {
          const btn = this.$el.querySelector('.v-btn.active-icon');
          if (btn) {
            const itemWidth = btn.offsetWidth;
            const itemLeft = btn.offsetLeft;
            const parentLeft = btn.parentElement.offsetLeft;
            const sliderLeft = itemLeft - parentLeft + itemWidth / 2;

            this.sliderStyle = {
              left: `${sliderLeft}px`,
              transform: 'translateX(-50%)',
              transition: 'left 0.5s ease-in-out'
            };
          }
        });
      }
    },
    async getUserId() {
      let uid = localStorage.getItem('user-uid');
      if (!uid) {
        uid = 'user-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('user-uid', uid);
      }
      this.userId = uid;

      try {
        const userDoc = doc(db, "data", this.userId);
        await setDoc(userDoc, { uid: this.userId }, { merge: true });
        console.log('UID saved to Firebase successfully!');
      } catch (error) {
        console.error('Error saving UID to Firebase:', error);
      }
    },
    async trackAction(route) {
    try {
      const userDoc = doc(db, "data", this.userId);
      const userSnapshot = await getDoc(userDoc);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        const userRoutes = data.routes || {};

        // Increment the route visit count
        if (userRoutes[route]) {
          userRoutes[route] += 1;
        } else {
          userRoutes[route] = 1;
        }

        await setDoc(userDoc, { routes: userRoutes }, { merge: true });
      } else {
        // First visit of this user
        const newRoutes = { [route]: 1 };
        await setDoc(userDoc, { uid: this.userId, routes: newRoutes }, { merge: true });
      }
    } catch (error) {
      console.error("Error tracking action:", error);
    }
  },
  },
};
</script>


<style scoped>
.app-container {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.main-content {
  flex-grow: 1;
  margin-left: 116px;
  overflow: auto;
}

.main-content-mobile {
  flex-grow: 1;
  margin-left: 0;
  overflow: auto;
}

body {
  background-color: #000;
}

.v-bottom-navigation {
  width: 50%;
  position: fixed;
  bottom: 0;
  left: 25%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, rgba(0, 0, 1, 0.9), rgba(0, 0, 0, 0.5));
  backdrop-filter: blur(10px);
  margin: 0;
  border-radius: 20px 20px 0 0;
  padding: 30px 0 15px;
  box-shadow: 0 8px 10px rgba(130, 43, 97, 0.19);
  list-style: none;
}

.v-btn {
  width: 75px;
  height: 45px;
  color: white;
  text-align: center;
  font-size: 20px;
  display: block;
  transition: 0.5s; 
  position: relative;
}

.v-btn.active-icon {
  color: #23ffe5;
}

.v-btn v-icon {
  width: 100%;
  position: absolute;
  top: 23%;
  left: 0;
  transition-delay: 0.3s;
  transition: 0.5s cubic-bezier(0.49, -0.35, 0.77, 1.44); 
  z-index: 9;
}

.v-btn span {
  display: block;
  font-size: 12px;
  width: 100%;
  position: absolute;
  bottom: -12px;
  transition-delay: 0.3s;
  transition: 0.5s cubic-bezier(0.49, -0.35, 0.77, 1.44);
  z-index: 9;
  opacity: 0;
}

.v-btn.active-icon v-icon {
  top: 50%;
  transform: translateY(-50%);
  transition-delay: 0.3s;
  transition: 0.5s cubic-bezier(0.49, -0.35, 0.77, 1.44); 
}

.v-btn.active-icon span {
  bottom: -40px;
  transition-delay: 0.5s;
  transition: 0.5s cubic-bezier(0.49, -0.35, 0.77, 1.44);
  opacity: 1;
}

.v-btn.active-icon {
  margin-bottom: 110px;
}

.slider {
  width: 50px;
  height: 50px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: -45px;
  background: linear-gradient(to right, rgba(0, 0, 1, 0.9), rgba(0, 0, 0, 0.5));
  backdrop-filter: blur(10px);
  border: 2px solid #23ffe5;
  box-shadow: 0 0 0 2px #23ffe5;
  transition: left 0.5s ease-in-out, transform 0.5s ease-in-out;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

@media (max-width: 1024px) {
  .v-bottom-navigation {
    width: 100%;
    left: 0;
  }
}
</style>
