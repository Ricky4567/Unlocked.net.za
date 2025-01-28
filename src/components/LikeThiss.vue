<template>
  <div class="scroll-container">

    <v-row class="mt-3">
      <div class="white--text my-3 mx-8" style="font-size:17px">MORE LIKE THIS</div>
    </v-row>

    <div class="scroll-controls">
      <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
      <v-row class="scroll-row" ref="scrollRow" no-gutters>
        <v-col
          v-for="item in recommendations"
          :key="item.id"
          cols="6" sm="6" md="2"
        >
          <v-hover v-slot:default="{ hover }">
            <v-card
              @click="handleCardClick(item)"
              class="d-flex flex-column overlay-container pa-4"
              :class="{ 'hover-scale': hover }"
              style="background-color:transparent; cursor: pointer;"
            >
              <v-skeleton-loader
                v-if="isLoading"
                type="image"
                :key="item.id"
                style="height:100%"
              ></v-skeleton-loader>
              <v-img
                v-else
                :src="getImageUrl(item.poster_path)"
                height="100%"
                class="white--text align-end"
                contain
              >
                <template v-if="hover">
                  <div class="overlay-content">
                    <v-icon large color="white">mdi-play-circle-outline</v-icon>
                    <div class="text-h5 mt-2">{{ item.title || item.name || 'Unknown Title' }}</div>
                    <div class="text-caption">{{ truncatedText(item.overview) }}</div>
                  </div>
                </template>
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
import { VImg, VCard, VSkeletonLoader } from 'vuetify/lib';
import { debounce } from 'lodash';

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
      isLoading: false
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
.pa-10 {
  padding: 10px;
}
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
.d-flex {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.overlay-container {
  position: relative;
  transition: transform 0.3s ease-in-out;
}
.overlay-container.hover-scale {
  transform: scale(1.07);
}
.overlay-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}
.text-h5 {
  color: white;
  margin-top: 8px;
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.text-caption {
  color: white;
  margin-top: 8px;
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
</style>
