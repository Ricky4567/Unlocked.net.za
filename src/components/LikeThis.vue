<template>
  <div class="scroll-container">
    <h3 class="white--text my-3" style="margin-left:100px;">More Like This</h3>
    <div class="scroll-controls">
      <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
      <v-row class="scroll-row" ref="scrollRow" no-gutters>
        <v-col
          v-for="item in recommendations"
          :key="item.id"
          cols="6" sm="6" md="3" lg="2"
        >
          <v-hover v-slot:default="{ hover }">
            <v-card
              @click="handleCardClick(item)"
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
                :src="getImageUrl(item.poster_path)"
                height="100%"
                class="overlay-image"
                cover
              >
                <v-card
                  v-if="isUserLoggedIn && hover"
                  class="add-to-watchlist-icon my-8 mx-6"
                  @click.stop="addToWatchlist(item)"
                >
                  <v-icon light>mdi-plus</v-icon>
                </v-card>
                <div v-if="hover" class="overlay-gradient"></div>
                <div class="overlay-content-bottom">
                  <div class="overlay-text-bottom">
                    <div class="text-h6 mx-2">
                      {{ item.title || item.name || 'Unknown Title' }}
                      <div class="title-underline "></div>
                    </div>

                    <div class="text-caption mx-2 my-2">{{ truncatedText(item.overview, 120) }}</div>
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
import axios from 'axios';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";
import { VImg, VCard, VSkeletonLoader } from 'vuetify/lib';
import { debounce } from 'lodash';

const db = getFirestore(firebaseApp);
const API_KEY = process.env.VUE_APP_TMDB_API_KEY || 'a6a07bdb1ae12672ae2d301063d83c40';

export default {
  components: {
    VImg,
    VCard,
    VSkeletonLoader
  },
  data() {
    return {
      recommendations: [],
      isLoading: false,
      isUserLoggedIn: !!localStorage.getItem("authId"), // Check if user is logged in
    };
  },
  mounted() {
    this.fetchRecommendations();
  },
  methods: {
    async fetchRecommendations() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }
      try {
        let response = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`);
        const tmdbId = response.data.movie_results[0]?.id || response.data.tv_results[0]?.id;
        const isTVShow = response.data.tv_results.length > 0;

        if (isTVShow) {
          response = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/recommendations?api_key=${API_KEY}&language=en-US`);
        } else {
          response = await axios.get(`https://api.themoviedb.org/3/movie/${tmdbId}/recommendations?api_key=${API_KEY}&language=en-US`);
        }
        
        this.recommendations = response.data.results.filter(item => item.poster_path !== null);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
      }
    },
    async handleCardClick(item) {
      this.isLoading = true;
      try {
        let detailsUrl;
        let response;

        if (item.media_type === 'tv') {
          detailsUrl = `https://api.themoviedb.org/3/tv/${item.id}/external_ids?api_key=${API_KEY}`;
        } else {
          detailsUrl = `https://api.themoviedb.org/3/movie/${item.id}?api_key=${API_KEY}&language=en-US`;
        }

        response = await axios.get(detailsUrl);

        const imdbId = response.data.imdb_id;
        if (imdbId) {
          localStorage.setItem("imdbId", imdbId);
          location.reload();
        } else {
          console.error("IMDb ID not found for the selected item.");
        }
      } catch (error) {
        console.error("Failed to fetch IMDb ID:", error);
      } finally {
        this.isLoading = false;
      }
    },
    async addToWatchlist(item) {
      const authId = localStorage.getItem("authId");

      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      try {
        let detailsUrl;
        let response;

        // Check if the item is a TV show or a movie
        if (item.media_type === 'tv') {
          detailsUrl = `https://api.themoviedb.org/3/tv/${item.id}/external_ids?api_key=${API_KEY}`;
          response = await axios.get(detailsUrl);
          const imdbId = response.data.imdb_id;
          const tvShowTitle = item.name || 'Unknown Title';

          if (!imdbId) {
            console.error("IMDb ID not found for the TV show.");
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
              title: tvShowTitle,
              rating: item.vote_average !== undefined ? item.vote_average : '',
              imageUrl: this.getImageUrl(item.poster_path),
              release_date: item.first_air_date || 'Unknown Release Date',
              description: item.overview || 'No description available',
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

            console.log("TV show added to watchlist successfully!");
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
            console.log("TV show is already in the watchlist.");
          }

        } else {
          // Handle movie case
          detailsUrl = `https://api.themoviedb.org/3/movie/${item.id}?api_key=${API_KEY}&language=en-US`;
          response = await axios.get(detailsUrl);
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
              title: item.title || 'Unknown Title',
              rating: item.vote_average !== undefined ? item.vote_average : '',
              imageUrl: this.getImageUrl(item.poster_path),
              release_date: item.release_date || 'Unknown Release Date',
              description: item.overview || 'No description available',
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
        }

      } catch (error) {
        console.error("Error adding item to watchlist:", error);
      }
    },
    getImageUrl(path) {
      return path ? `https://image.tmdb.org/t/p/w500${path}` : 'default_image.jpg';
    },
    truncatedText(text, maxLength = 100) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    scrollLeft: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: -300, behavior: 'smooth' });
    }, 50),
    scrollRight: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: 300, behavior: 'smooth' });
    }, 50)
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
  top: 0px;
  right: 0px;
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
  z-index: 10;
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
