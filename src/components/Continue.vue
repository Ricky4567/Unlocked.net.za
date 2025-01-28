<template>
  <div class="scroll-container" v-if="isAuthIdPresent">
    <v-row>
      <h3 class="white--text my-3" style="margin-left:100px;">CONTINUE WATCHING</h3>
    </v-row>
    <div class="scroll-controls">
      <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
      <v-row class="scroll-row" ref="scrollRow" no-gutters>
        <v-col
          v-for="media in continueWatching"
          :key="media.id"
          cols="12" sm="6" md="3" lg="2"
        >
          <v-hover v-slot:default="{ hover }">
            <v-card
              @click="redirectToViewInfo(media)"
              class="fade-in-left overlay-container mx-2"
              :class="{ 'hover-scale': hover }"
              style="background-color:transparent; cursor: pointer;"
            >
              <v-skeleton-loader
                v-if="isLoading"
                type="image"
                style="height:100%"
              ></v-skeleton-loader>
              <v-img
                v-else
                :src="getImageUrl(media.imageUrl)"
                height="100%"
                class="overlay-image"
                cover
              >
     
                <div v-if="hover" class="overlay-gradient"></div>
                <div class="overlay-content-bottom">
                  <div class="overlay-text-bottom">
                    <div class="text-h6 mx-2">
                      {{ media.title }}
                      <div class="title-underline"></div>
                    </div>
                    <div class="text-details mx-2">{{ media.release_date | formatDate }}</div>
                    <div class="text-caption mx-2">{{ truncatedText(media.description, 120) }}</div>
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
</template>

<script>
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";
import { VImg, VCard, VSkeletonLoader } from 'vuetify/lib';
import { debounce } from 'lodash';

const db = getFirestore(firebaseApp);

export default {
  components: {
    VImg,
    VCard,
    VSkeletonLoader
  },
  data() {
    return {
      continueWatching: [],
      isLoading: false,
      isAuthIdPresent: false,
      isUserLoggedIn: !!localStorage.getItem("authId"),
    };
  },
  created() {
    const authId = localStorage.getItem("authId");
    this.isAuthIdPresent = !!authId;
    if (this.isAuthIdPresent) {
      this.fetchContinueWatching();
    }
  },
  methods: {
    async fetchContinueWatching() {
      const authId = localStorage.getItem("authId");
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      this.isLoading = true;
      try {
        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(continueWatchingRef, where("authId", "==", authId), orderBy("lastEdited", "desc"));
        const querySnapshot = await getDocs(q);

        const continueWatchingData = [];
        querySnapshot.forEach((docSnapshot) => {
          continueWatchingData.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });

        this.continueWatching = continueWatchingData;
      } catch (error) {
        console.error("Error fetching continue watching data:", error);
      } finally {
        this.isLoading = false;
      }
    },
    getImageUrl(path) {
      return path ? path : 'default_image.jpg';
    },
    async redirectToViewInfo(media) {
      this.isLoading = true;
      try {
        localStorage.setItem('imdbId', media.imdbId);
        this.$router.push(`/viewInfo`);
      } catch (error) {
        console.error("Error redirecting to view info:", error);
      } finally {
        this.isLoading = false;
      }
    },
    truncatedText(text, maxLength = 120) {
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
    async addToWatchlist(media) {
      const authId = localStorage.getItem("authId");

      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      try {
        const detailsUrl = `https://api.themoviedb.org/3/movie/${media.id}?api_key=${API_KEY}`;
        const response = await axios.get(detailsUrl);
        const imdbId = response.data.imdb_id;

        if (!imdbId) {
          console.error("IMDb ID not found for the movie.");
          return;
        }

        const watchlistRef = collection(db, "watchlist");
        const q = query(
          watchlistRef,
          where("authId", "==", authId),
          where("imdbId", "==", imdbId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(watchlistRef, {
            authId: authId,
            imdbId: imdbId,
            title: media.title,
            rating: media.vote_average || '',
            imageUrl: this.getImageUrl(media.imageUrl),
            release_date: media.release_date,
            description: media.description,
            addedAt: new Date()
          });
          this.$toast.success("Added to watchlist successfully", {
            position: "bottom-right",
            timeout: 5000,
            closeOnClick: true,
            pauseOnFocusLoss: true,
            pauseOnHover: true,
            draggable: true,
            draggablePercent: 0.6,
            showCloseButtonOnHover: false,
            hideProgressBar: true,
            closeButton: "button",
            icon: true,
            rtl: false
          });

          console.log("Movie added to watchlist successfully!");
        } else {
          this.$toast.warning("Already added to watchlist", {
            position: "bottom-right",
            timeout: 5000,
            closeOnClick: true,
            pauseOnFocusLoss: true,
            pauseOnHover: true,
            draggable: true,
            draggablePercent: 0.6,
            showCloseButtonOnHover: false,
            hideProgressBar: true,
            closeButton: "button",
            icon: true,
            rtl: false
          });
          console.log("Movie is already in the watchlist.");
        }
      } catch (error) {
        console.error("Error adding movie to watchlist:", error);
      }
    }
  }
};
</script>

<style scoped>
.scroll-container {
  max-width: 100%;
  overflow-x: hidden;
  position: relative;
}
.scroll-controls {
  display: flex;
  align-items: center;
}
.scroll-row {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scroll-behavior: smooth;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scroll-row::-webkit-scrollbar {
  display: none;
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
.overlay-container:hover .overlay-gradient,
.overlay-container:hover .overlay-content-bottom {
  opacity: 1;
}
.overlay-container:hover .title-underline {
  transform: scaleX(1);
}
.overlay-text-bottom {
  color: white;
}
.text-h6 {
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
.text-details {
  font-size: 14px;
  margin: 10px 0;
}
.text-caption {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 10px;
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
  display: none;
}
@media (min-width: 600px) {
  .scroll-arrow {
    display: block;
  }
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
</style>
