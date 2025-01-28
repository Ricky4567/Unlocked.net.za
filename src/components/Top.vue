<template>
  <div class="scroll-container">
    <v-row>
      <h3 class="white--text my-3" style="margin-left:100px;">TOP 10 MOVIES</h3>
    </v-row>

    <div class="scroll-controls">
      <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow"
        >mdi-chevron-left</v-icon
      >
      <v-row
        class="scroll-row"
        ref="scrollRow"
        no-gutters
      >
        <!-- Use (movie, index) to display rank -->
        <v-col
          v-for="(movie, index) in topMovies"
          :key="movie.id"
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <!-- Container that holds the number + card -->
          <div class="ranking-container">
            <!-- Big rank number, anchored at bottom-left -->
            <div class="ranking-number">
              {{ index + 1 }}
            </div>
            <v-hover v-slot:default="{ hover }">
              <v-card
                @click="redirectToViewInfo(movie)"
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
                  :src="getImageUrl(movie.poster_path)"
                  height="100%"
                  class="overlay-image"
                  cover
                >
                  <v-card
                    v-if="isUserLoggedIn && hover"
                    class="add-to-watchlist-icon my-8 mx-6"
                    @click.stop="addToWatchlist(movie)"
                  >
                    <v-icon light>mdi-plus</v-icon>
                  </v-card>
                  <div v-if="hover" class="overlay-gradient"></div>
                  <div class="overlay-content-bottom">
                    <div class="overlay-text-bottom">
                      <div class="text-h6 mx-2">
                        {{ movie.title }}
                        <div class="title-underline"></div>
                      </div>
                      <div class="text-details mx-2">
                        {{ movie.release_date | formatDate }}
                      </div>
                      <div class="text-caption mx-2">
                        {{ truncatedText(movie.overview, 120) }}
                      </div>
                    </div>
                  </div>
                </v-img>
              </v-card>
            </v-hover>
          </div>
        </v-col>
      </v-row>
      <v-icon large @click="scrollRight" class="scroll-arrow right-arrow"
        >mdi-chevron-right</v-icon
      >
    </div>
  </div>
</template>

<script>
import axios from "axios";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";
import { VImg, VCard, VSkeletonLoader } from "vuetify/lib";
import { debounce } from "lodash";

const db = getFirestore(firebaseApp);
const API_KEY =
  process.env.VUE_APP_TMDB_API_KEY || "a6a07bdb1ae12672ae2d301063d83c40";

export default {
  components: {
    VImg,
    VCard,
    VSkeletonLoader,
  },
  data() {
    return {
      topMovies: [],
      isLoading: false,
      isUserLoggedIn: !!localStorage.getItem("authId"),
    };
  },
  created() {
    this.fetchTopMovies();
  },
  methods: {
    async fetchTopMovies() {
      this.isLoading = true;
      try {
        // Fetch with a small delay
        setTimeout(async () => {
          const response = await axios.get(
            `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&language=en-US&page=1`
          );
          this.topMovies = response.data.results.slice(0, 10).map((movie) => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            overview: movie.overview,
          }));
        }, 1000);
      } catch (error) {
        console.error("Error fetching top movies:", error);
      } finally {
        this.isLoading = false;
      }
    },
    getImageUrl(path) {
      return path
        ? `https://image.tmdb.org/t/p/w500${path}`
        : "default_image.jpg";
    },
    async redirectToViewInfo(movie) {
      this.isLoading = true;
      try {
        const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`;
        const response = await axios.get(detailsUrl);
        const imdbId = response.data.imdb_id;
        if (imdbId) {
          localStorage.setItem("imdbId", imdbId);
          this.$router.push(`/viewInfo`);
        } else {
          console.error("IMDb ID not found for the movie.");
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        this.isLoading = false;
      }
    },
    truncatedText(text, maxLength = 120) {
      return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    },
    scrollLeft: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: -300, behavior: "smooth" });
    }, 100),
    scrollRight: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: 300, behavior: "smooth" });
    }, 100),
    async addToWatchlist(movie) {
      const authId = localStorage.getItem("authId");
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }
      try {
        const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`;
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
            title: movie.title,
            rating: movie.vote_average || "",
            imageUrl: this.getImageUrl(movie.poster_path),
            release_date: movie.release_date,
            description: movie.overview,
            addedAt: new Date(),
          });
          this.$toast.success("Added to watchlist successfully", {
            position: "bottom-right",
            timeout: 5000,
          });
          console.log("Movie added to watchlist successfully!");
        } else {
          this.$toast.warning("Already added to watchlist", {
            position: "bottom-right",
            timeout: 5000,
          });
          console.log("Movie is already in the watchlist.");
        }
      } catch (error) {
        console.error("Error adding movie to watchlist:", error);
      }
    },
  },
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

/* Container that groups each big rank number + the card */
.ranking-container {
  position: relative; /* So the .ranking-number is anchored */
}

/* Big ranking number at the bottom-left of the card */.ranking-number {
  position: absolute;
  top: -15px;
  right: 15px;
  font-size: 6rem;     /* Adjust size as needed */
  font-weight: 900;
  color:#0cdfe5;      /* White fill color */
  z-index: 81;
  pointer-events: none;

  /* 
   * Thick turquoise outline with no blur:
   * All combinations of offsets at 1, 2, and 3 px 
   * around the text in 8 directions. 
   */
  text-shadow:
    /* 1-pixel offsets */
    1px   0   0 white,
    -1px  0   0 white,
    0   1px   0 white,
    0  -1px   0 white,
    1px  1px   0 white,
    1px -1px   0 white,
    -1px 1px   0 white,
    -1px -1px  0 white,

    /* 2-pixel offsets */
    2px   0   0 white,
    -2px  0   0 white,
    0   2px   0 white,
    0  -2px   0 white,
    2px  2px   0 white,
    2px -2px   0 white,
    -2px 2px   0 white,
    -2px -2px  0 white,

    /* 3-pixel offsets */
    3px   0   0 white,
    -3px  0   0 white,
    0   3px   0 white,
    0  -3px   0 white,
    3px  3px   0 white,
    3px -3px   0 white,
    -3px 3px   0 white,
    -3px -3px  0 white;
}


/* Card styling */
.overlay-container {
  position: relative;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
  border-radius: 10px;
  height: 100%;
  overflow: hidden;
  z-index: 2; /* Above the ranking number, to appear behind the poster */
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
  background-color: white;
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
  background-color: white;
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

/* Simple fade-in-left animation */
.fade-in-left {
  animation: fade-in-left 1.5s cubic-bezier(.39, .575, .565, 1.000) both;
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
