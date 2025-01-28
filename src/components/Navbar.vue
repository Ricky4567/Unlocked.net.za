<template>
  <div>
    <!-- Combined Sidebar and Drawer -->
    <div class="sidebar" :class="{ open: isSidebarOpen }">
      <!-- Toggle button with dynamic icon -->
      <div class="toggle" @click="toggleSidebar">
        <v-icon
          style="font-size:30px"
          dark
        >
          {{ isSidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right' }}
        </v-icon>
      </div>

      <div class="logo">
        <img src="../assets/logo.png" alt="logo" />
        <h3 v-if="isSidebarOpen">Unlocked</h3>
      </div>

      <nav class="nav-content">
        <div class="nav-title mx-4" v-if="isSidebarOpen">Pages</div>
        <ul class="nav-list">
          <li
            v-for="(item, index) in items"
            :key="index"
            class="nav-item"
            :class="{ active: $route.path === item.to }"
            @click="setActive(index)"
          >
            <router-link :to="item.to" class="nav-link">
              <span class="icon">
                <lord-icon
                  :src="item.icon"
                  :colors="getIconColors($route.path === item.to)"
                  trigger="hover"
                  style="width:40px;height:40px"
                ></lord-icon>
              </span>
              <span class="title" v-if="isSidebarOpen">{{ item.title }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- Profile Image and Logout Button at the bottom -->
      <div class="profile-section my-12" v-if="isAuthenticated">
        <v-avatar size="56" class="mx-5">
          <v-img :src="userProfile.profilePicture || defaultAvatar" />
        </v-avatar>
        <div v-if="isSidebarOpen" class="profile-details">
          <v-btn dark icon @click="logout">
            Logout
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export default {
  data() {
    return {
      isSidebarOpen: false,
      isAuthenticated: false,
      userProfile: {}, // User profile details from Firestore
      defaultAvatar: 'https://i.pinimg.com/564x/83/bc/8b/83bc8b88cf6bc4b4e04d153a418cde62.jpg', // Default avatar
      items: [
        { title: 'Home', icon: 'https://cdn.lordicon.com/cnpvyndp.json', to: '/' },
        { title: 'TV', icon: 'https://cdn.lordicon.com/aklfruoc.json', to: '/tv' },
        { title: 'My List', icon: 'https://cdn.lordicon.com/prjooket.json', to: '/list' },
        { title: 'Search', icon: 'https://cdn.lordicon.com/kkvxgpti.json', to: '/search' }
      ]
    };
  },
  created() {
    // Monitor authentication state changes
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.isAuthenticated = true;
        localStorage.setItem('authId', user.uid);
        await this.fetchUserProfile();
      } else {
        this.isAuthenticated = false;
        localStorage.removeItem('authId');
      }
    });
  },
  methods: {
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    getIconColors(isActive) {
      return isActive ? 'primary:#0cdfe5' : 'primary:#ffffff';
    },
    async fetchUserProfile() {
      const authId = localStorage.getItem('authId');
      if (!authId) return;

      try {
        const userDoc = doc(db, "users", authId);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          this.userProfile = userSnapshot.data();
        } else {
          console.error("No user profile found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    },
    setActive(index) {
      // You can handle any specific actions here
      // or leave it empty if you just rely on <router-link>.
    },
    async logout() {
      try {
        await signOut(auth);
        localStorage.clear();
        this.isAuthenticated = false;
        this.userProfile = {};
        console.log('User logged out');
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  list-style: none;
  box-sizing: border-box;
}

.sidebar {
  width: 130px;
  height: 100%;
  backdrop-filter: blur(6px);
  background: rgba(10, 10, 10, 0.65);
  border-radius: 0px 30px 30px 0px;
  box-shadow: 0 8px 32px rgb(2, 4, 24);
  border-right: 2px solid rgba(255, 255, 255, 0.09);
  transition: width 0.3s ease-in-out;
  position: fixed;
  top: 0;
  z-index: 999;
}

.sidebar.open {
  width: 240px;
}

.sidebar .logo {
  width: 100%;
  height: 240px;
  padding: 40px 0;
  display: grid;
  align-items: center;
  justify-items: center;
}

.sidebar .logo img {
  width: 56px;
  transition: 0.4s;
}

.sidebar.open .logo img {
  width: 96px;
}

.sidebar .logo h3 {
  color: #fff;
  font-size: 36px;
  margin-top: 12px;
  font-variant: small-caps;
  pointer-events: none;
  scale: 0;
  opacity: 0;
}

.sidebar.open .logo h3 {
  scale: 1;
  opacity: 1;
  transition: 0.4s;
  transition-delay: 0.2s;
}

.sidebar .nav-title {
  color: #dadada;
  margin: 40px 0 18px;
  pointer-events: none;
  opacity: 0;
}

.sidebar.open .nav-title {
  opacity: 1;
  transition: 0.4s;
  transition-delay: 0.2s;
}

.nav-list {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 90%;
  padding: 0 30px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 15px;
  transition: background-color 0.3s;
}

.nav-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: white;
  width: 100%;
}

.icon {
  margin-right: 10px;
  color: white;
  font-size: 35px;
}

.title {
  font-size: 14px;
  font-weight: 300;
  color: white;
}

.active-icon {
  color: #0cdfe5 !important;
}

.active-title {
  color: #0cdfe5 !important;
}

.sidebar hr {
  width: 100%;
  height: 2px;
  border-radius: 3px;
  margin: 40px 0 50px;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
}

.sidebar.open hr {
  opacity: 1;
  transition: 0.4s;
}

/* Toggle button styling */
.sidebar .toggle {
  cursor: pointer;
  position: absolute;
  color: #000; /* Icon color */
  top: 180px;
  right: -25px;
  font-size: 28px;
  text-align: center;
  background: #0cdfe5; /* Button background */
  border-radius: 50%;
  border: 2px solid #ffffff;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease-in-out;
}

.sidebar.open .toggle {
  transform: translateY(45px);
}

/* Profile section at the bottom */
.profile-section {
  display: flex;
  align-items: center;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.profile-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 10px;
}

.profile-username {
  color: white;
  font-size: 16px;
}

.profile-section v-btn {
  margin-top: 10px;
}
</style>
