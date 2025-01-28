<template>
  <div class="scroll-container">
    <v-row v-if="isAuthenticated" justify="center" align="center">
      <v-col cols="12" md="7"></v-col>
      <v-col cols="12" md="4">
        <!-- Empty column for any additional content -->
      </v-col>
     
    </v-row>

    <div v-if="isAuthenticated">
      <div v-if="isWatchlistEmpty" class="empty-state">
        <img src="../assets/logo1.png" alt="Empty Wishlist" class="empty-image" />
        <p style="margin-top:-30px;" class="white--text">Your watchlist is empty!</p>
        <p class="white--text"> Go to a show or movie and add it to your list.</p>
      </div>
      <div v-else>
        <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
        <v-row justify="center" align="center">
          <v-avatar size="100" class="mr-3">
            <v-img :src="userProfile.profilePicture || defaultAvatar" />
          </v-avatar>
          <span class="white--text">{{ userProfile.username }}</span>
          <v-btn icon @click="openProfilePicker">
            <v-icon color="#23ffe5">mdi-pencil</v-icon>
          </v-btn>
        </v-row>
        <v-row justify="center">
          <h2 class="white--text my-5 mr-12">MY LIST</h2>
        </v-row>
        <v-row class="scroll-row my-2" ref="scrollRow" no-gutters>
          <v-col
            v-for="(movie, index) in paginatedWatchlist"
            :key="movie.imdbId"
            cols="6" sm="4" md="2"
            class="pa-2"
          >
            <v-hover v-slot:default="{ hover }">
              <v-card
                height="100%"
                @click="viewMovieInfo(movie.imdbId)"
                class="fade-in-left overlay-container mx-2 pa-2"
                :class="{ 'hover-scale': hover }"
                style="background-color:transparent; cursor: pointer;"
              >
                <v-skeleton-loader v-if="isLoading" type="image" style="height:100%"></v-skeleton-loader>
                <v-img
                  v-else
                  :src="getImageUrl(movie.imageUrl)"
                  height="100%"
                  class="overlay-image"
                  cover
                >
                  <v-card
                    v-if="hover"
                    class="add-to-watchlist-icon"
                    @click.stop="removeFromWatchlist(movie.imdbId)"
                  >
                    <v-icon light>mdi-minus</v-icon>
                  </v-card>
                  <div v-if="hover" class="overlay-gradient"></div>
                  <div class="overlay-content-bottom">
                    <div class="overlay-text-bottom">
                      <div class="text-h7 mx-2">
                        {{ movie.title }}
                        <div class="title-underline"></div>
                      </div>
                      <div class="text-details mx-2">{{ truncatedText(movie.description) }}</div>
                    </div>
                  </div>
                </v-img>
              </v-card>
            </v-hover>
          </v-col>
        </v-row>
        <v-icon large @click="scrollRight" class="scroll-arrow right-arrow">mdi-chevron-right</v-icon>
      </div>
    </div>

    <v-row justify="center" align="center" v-if="!isAuthenticated">
      <v-col cols="12" md="6" lg="4">
        <v-card class="elevation-12 login-card">
          <v-row justify="center">
            <img src="../assets/logo1.png" alt="Logo" class="mb-8" style="max-width: 200px;" />
          </v-row>
          <v-card-title class="title-container">
            <span class="headline">{{ isSignup ? 'Signup' : 'Login' }}</span>
            <v-spacer></v-spacer>
            <span class="signup" @click="toggleForm">{{ isSignup ? 'Login' : 'Signup' }}</span>
          </v-card-title>
          <v-card-text class="login-card-text">
            <v-form @submit.prevent="isSignup ? signup() : login()">
              <!-- Inputs for login/signup -->
              <v-text-field
                v-if="isSignup"
                v-model="username"
                label="Username"
                prepend-inner-icon="mdi-account"
                type="text"
                dark
                outlined
                hide-details
                class="login-input my-4"
                required
              ></v-text-field>
              <v-text-field
                v-model="email"
                label="Email Address"
                prepend-inner-icon="mdi-email"
                type="email"
                dark
                outlined
                hide-details
                class="login-input my-4"
                required
              ></v-text-field>
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Password"
                prepend-inner-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="togglePasswordVisibility"
                dark
                outlined
                hide-details
                class="login-input"
                required
              ></v-text-field>
              <v-text-field
                v-if="isSignup"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                label="Confirm Password"
                prepend-inner-icon="mdi-lock"
                :append-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append="toggleConfirmPasswordVisibility"
                dark
                outlined
                hide-details
                class="login-input my-4"
                required
              ></v-text-field>
              <v-checkbox
                v-if="!isSignup"
                v-model="rememberMe"
                dark
                label="Remember Me"
                class="remember-me"
              ></v-checkbox>
              <v-btn type="submit" color="#23ffe5" block>{{ isSignup ? 'SIGNUP' : 'LOGIN' }}</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="profilePickerDialog" max-width="600px">
      <v-card style="background: rgba(0, 0, 0, 0.3); backdrop-filter: blur(10px);">
        <v-card-text>
          <v-container>
            <v-row>
              <v-row>
                <v-col v-for="icon in profilePictures" :key="icon.path" cols="4" md="3">
                  <v-avatar size="90" class="pointer" @click="updateProfilePicture(icon.path)">
                    <v-img :src="icon.path" />
                  </v-avatar>
                </v-col>
              </v-row>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import axios from 'axios';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, setDoc, doc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";
import { debounce } from 'lodash';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export default {
  name: 'MyList',
  data() {
    return {
      isSignup: false,
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
      selectedProfilePicture: '',
      userProfile: {},
      profilePictures: [
        { path: 'https://i.pinimg.com/236x/e7/92/b1/e792b149ac7956b1cec92f1c5f8e428a.jpg' },
        { path: 'https://i.pinimg.com/236x/f8/87/2d/f8872dacef2cfc49244d9b2e7f036834.jpg' },
        { path: 'https://i.pinimg.com/236x/0c/84/fd/0c84fd50890bc6d1cabdd20015752198.jpg' },
        { path: 'https://i.pinimg.com/236x/73/1b/3e/731b3ed2f4f2ee33f1cdb5cf9754029d.jpg' },
        { path: 'https://i.pinimg.com/236x/6c/7c/4c/6c7c4ce87bde963267a60c38bd45cb89.jpg' },
        { path: 'https://i.pinimg.com/236x/11/3b/0d/113b0d871ca78c2833e8e22da64b66c4.jpg' },
        { path: 'https://i.pinimg.com/236x/5c/b5/b2/5cb5b2699e73cade1b97d577678392c1.jpg' },
        { path: 'https://i.pinimg.com/236x/f5/48/8c/f5488cc868f7fae5b3d5c5f25cf97ca3.jpg' },
        { path: 'https://i.pinimg.com/236x/8f/83/c4/8f83c49f67cdf8d7e612bd296beeb4d3.jpg' },
        { path: 'https://i.pinimg.com/236x/07/6c/d5/076cd5cf4fea350b01c5d43db9070faf.jpg' },
        { path: 'https://i.pinimg.com/236x/b7/f8/98/b7f898958ec7034e03975129c74aef21.jpg' },
        { path: 'https://i.pinimg.com/236x/19/ac/32/19ac32740303594e08fc67e9dbce6fa2.jpg' },
        { path: 'https://i.pinimg.com/474x/67/80/67/6780671534127a59bb2dc1203c62c186.jpg' },
        { path: 'https://i.pinimg.com/236x/59/07/1f/59071ff1d1c93cde5cde7d83b40551df.jpg' },
        { path: 'https://i.pinimg.com/236x/3a/1b/27/3a1b271e0a7cc6190f582d6b1d435e80.jpg' },
        { path: 'https://i.pinimg.com/236x/e9/0a/cb/e90acba9c9b6de1f20c6bf4c00630450.jpg' },
        { path: 'https://i.pinimg.com/236x/c0/76/2f/c0762ffa1ee99e2a220e4038030e98c4.jpg' },
        { path: 'https://i.pinimg.com/236x/d2/2d/97/d22d97508470451e1a6d196a5cddb510.jpg' },
        { path: 'https://i.pinimg.com/236x/73/82/7f/73827f3e3bf66f798716f6e4dce8ffa6.jpg' },
        { path: 'https://i.pinimg.com/236x/d8/d5/d1/d8d5d1f2ed67a61262abc6dab253ecf6.jpg' },
        {path:'https://c4.wallpaperflare.com/wallpaper/8/230/576/flynn-tangled-wallpaper-preview.jpg'},
        {path:'https://c4.wallpaperflare.com/wallpaper/365/692/48/disney-moana-4k-8k-wallpaper-preview.jpg'},
        {path:'https://images8.alphacoders.com/130/thumb-1920-1307233.png'},
        {path:'https://c4.wallpaperflare.com/wallpaper/293/879/668/monsters-university-disney-pixar-cartoon-movie-wallpaper-preview.jpg'}
      ],
      profileSearchQuery: '',
      rememberMe: false,
      isAuthenticated: false,
      watchlist: [],
      isLoading: false,
      showPassword: false,
      showConfirmPassword: false,
      profilePickerDialog: false,
      currentPage: 1,
      itemsPerPage: 10,
      defaultAvatar: 'https://i.pinimg.com/564x/83/bc/8b/83bc8b88cf6bc4b4e04d153a418cde62.jpg' // Add your default avatar URL here
    };
  },
  computed: {
    isWatchlistEmpty() {
      return this.watchlist.length === 0;
    },
    paginatedWatchlist() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = this.currentPage * this.itemsPerPage;
      return this.watchlist.slice(start, end);
    }
  },
  created() {
    onAuthStateChanged(auth, async (user) => {
      this.isAuthenticated = !!user;
      if (user) {
        localStorage.setItem('authId', user.uid);
        await this.fetchUserProfile();
        await this.fetchWatchlist();
      }
    });
  },
  methods: {
    toggleForm() {
      this.isSignup = !this.isSignup;
    },
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    openProfilePicker() {
      this.profilePickerDialog = true;
    },
    selectProfilePicture(icon) {
      this.selectedProfilePicture = icon;
      this.profilePickerDialog = false;
    },
    async signup() {
      if (this.password !== this.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;
        
        const profileUrl = this.selectedProfilePicture || this.defaultAvatar;

        await setDoc(doc(db, "users", user.uid), {
          username: this.username,
          email: this.email,
          profilePicture: profileUrl,
          createdAt: new Date(),
        });

        localStorage.setItem('authId', user.uid);
        localStorage.setItem('log', '1'); // Set log value on signup
        this.isAuthenticated = true;
        await this.fetchUserProfile();
        await this.fetchWatchlist();
      } catch (error) {
        alert(error.message);
      }
    },
    async login() {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        const user = userCredential.user;

        localStorage.setItem('authId', user.uid);
        localStorage.setItem('log', '1'); // Set log value on login
        this.isAuthenticated = true;
        await this.fetchUserProfile();
        await this.fetchWatchlist();
      } catch (error) {
        alert(error.message);
      }
    },
    async logout() {
      try {
        await signOut(auth);
        localStorage.clear();
        this.isAuthenticated = false;
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    },
    async fetchUserProfile() {
      const authId = localStorage.getItem('authId');
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      const docRef = doc(db, "users", authId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.userProfile = docSnap.data();
      } else {
        this.userProfile = {
          username: '',
          email: '',
          profilePicture: this.defaultAvatar,
        };
        await setDoc(docRef, this.userProfile);
      }
    },
    async updateProfilePicture(path) {
      const authId = localStorage.getItem('authId');
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      const docRef = doc(db, "users", authId);
      await updateDoc(docRef, {
        profilePicture: path
      });

      this.userProfile.profilePicture = path;
      this.profilePickerDialog = false;
    },
    async fetchWatchlist() {
      const authId = localStorage.getItem('authId');
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      this.isLoading = true;
      const q = query(collection(db, "watchlist"), where("authId", "==", authId));
      const querySnapshot = await getDocs(q);

      this.watchlist = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      this.isLoading = false;
    },
    async removeFromWatchlist(imdbId) {
      const authId = localStorage.getItem('authId');
      const q = query(collection(db, "watchlist"), where("authId", "==", authId), where("imdbId", "==", imdbId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      await this.fetchWatchlist();
    },
    viewMovieInfo(imdbId) {
      localStorage.setItem('imdbId', imdbId);
      this.$router.push('/viewinfo');
    },
    getImageUrl(path) {
      return path ? path : 'default_image.jpg';
    },
    truncatedText(text, maxLength = 50) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    scrollLeft: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: -300, behavior: 'smooth' });
    }, 100),
    scrollRight: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: 300, behavior: 'smooth' });
    }, 100),
    startShopping() {
      // Redirect to a shopping or browsing page
      this.$router.push('/shop');
    }
  }
};
</script>
<style scoped>
.pa-10 {
  padding: 10px;
}
.scroll-container {
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
  position: relative;
}
.scroll-controls {
  display: flex;
  align-items: center;
}

.scroll-row::-webkit-scrollbar { 
  display: none;  /* Safari and Chrome */
}
.d-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.overlay-container {
  position: relative;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  height: 100%;
  overflow: hidden;
}
.overlay-container.hover-scale {
  transform: scale(1.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}
.overlay-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease-in-out;
}
.overlay-container.hover-scale .overlay-image {
  transform: scale(1.1);
}
.overlay-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 60%);
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
}
.overlay-container:hover .overlay-gradient,
.overlay-container:hover .overlay-content-bottom {
  opacity: 1;
}
.overlay-content-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 15px;
  box-sizing: border-box;
  border-radius: 0 0 10px 10px;
  opacity: 0;
  transition: opacity 0.4s ease-in-out;
}
.overlay-text-bottom {
  color: white;
}
.text-h7 {
  font-size: 18px;
  font-weight: bold;
  position: relative;
}
.title-underline {
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 60%;
  height: 4px;
  background-color: #23ffe5;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease-in-out;
}
.overlay-container:hover .title-underline {
  transform: scaleX(1);
}
.text-details {
  font-size: 14px;
  margin: 10px 0;
}
.add-to-watchlist-icon {
  position: absolute;
  top: 0px; /* Align to the top of the card */
  right: 0px; /* Align to the right edge of the card */
  width: 40px;
  height: 40px;
  background-color: #23ffe5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  z-index: 10; /* Ensure it stays on top */
}
.add-to-watchlist-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}
.scroll-arrow {
  cursor: pointer;
  color: white;
  margin: 0 10px;
  z-index: 1;
  visibility: hidden;
}
.scroll-controls:hover .scroll-arrow {
  visibility: visible;
}
.fade-in-left {
  animation: fade-in-left 1.5s cubic-bezier(.39,.575,.565,1.000) both;
}
@keyframes fade-in-left {
  0% {
    transform: translateX(-50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
.login-container {
  background-image: url('../assets/Background.jpg');
  background-size: cover;
  background-position: center;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 40px 30px;
  border-radius: 10px;
  margin-top: 250px;
  max-width: 500px;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
}

.headline {
  font-size: 24px;
  font-weight: 600;
  color: white;
}

.signup {
  font-size: 18px;
  color: #888;
  cursor: pointer;
}

.subtitle {
  color: #bbb;
  margin-bottom: 20px;
  display: block;
}

.login-input .v-input__control {
  background: #333;
  border-radius: 5px;
  color: white;
}

.login-input .v-label {
  color: #bbb !important;
}

.login-input .v-input__slot {
  color: white;
}

.login-input .v-select__selection {
  display: flex;
  align-items: center;
}
.login-input .v-select__selection img {
  border-radius: 50%;
  margin-right: 10px;
}

.remember-me {
  color: #bbb;
}

.login-btn {
  background-color: #6200ee;
  color: white;
  font-weight: bold;
  margin-top: 20px;
  border-radius: 5px;
  height: 50px;
  font-size: 16px;
}

.forgot-password {
  color: #6200ee;
  text-transform: none;
  margin-top: 10px;
  font-size: 14px;
}

.movie-card {
  background-size: cover;
  background-position: center;
  height: 300px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  max-width: 230px;
}

.movie-title {
  font-size: 20px;
  font-weight: bold;
}

.movie-rating,
.movie-runtime {
  font-size: 16px;
}

.movie-description {
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height:80vh;
  text-align: center;
}

.empty-image {
  max-width: 200px;
  margin-bottom: 20px;
}

/* Add this to hide the arrows on mobile */
@media (max-width: 600px) {
  .scroll-arrow {
    display: none;
  }
}
.pointer {
  cursor: pointer;
}

</style>

