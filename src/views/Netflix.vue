<template>
  <div class="pa-10">
    <!-- Search input -->
    <v-row>
      <v-col cols="11">
        <v-text-field
          v-model="searchQuery"
          :loading="isLoading"
          dark
          solo
          width="100%"
          height="70px"
          append-icon="mdi-magnify"
          @input="fetchMedia"
        >
          <template v-slot:label>
            <span style="font-size: 20px;">Type to search...</span>
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="1">
        <!-- Filter button -->
        <v-icon @click="showFilterDialog" class="mt-5 mb-12" color="#23ffe5" large>mdi-filter</v-icon>
      </v-col>
    </v-row>

    <!-- Filter dialog -->
    <v-dialog v-model="filterDialog" max-width="500px">
      <v-card class="custom-card" style="background-color:black;">
        <v-img src="../assets/logo1.png" alt="Logo" height="200px" contain class="image my-5"></v-img>
        <v-card-text>
          <v-row justify="center">
            <span style="margin-top:-65px" class="headline white--text">Filter</span>
          </v-row>
          <v-row justify="center">
            <v-select
              dark
              solo
              dense
              v-model="selectedGenres"
              :items="genres"
              label="Genres"
              multiple
              class="custom-select"
            ></v-select>
          </v-row>
          <v-row justify="center">
            <v-select
              dark
              solo
              dense
              v-model="selectedSort"
              :items="sortOptions"
              label="Sort By"
              class="custom-select"
            ></v-select>
          </v-row>
          <v-row justify="center">
            <v-select
              dark
              dense
              solo
              v-model="selectedYear"
              :items="yearOptions"
              label="Year"
              class="custom-select"
            ></v-select>
          </v-row>
          <v-row justify="center">
            <v-radio-group v-model="selectedType" row>
              <v-radio dark label="Movies" value="movie"></v-radio>
              <v-radio dark label="TV Shows" value="tv"></v-radio>
            </v-radio-group>
          </v-row>
          <v-row justify="center">
            <v-rating
              dark
              v-model="selectedRating"
              label="Minimum Rating"
              color="#23ffe5"
              class="custom-rating"
            ></v-rating>
          </v-row>
          <v-row justify="center" class="mt-5">
            <v-btn color="#23ffe5" width="150px" class="custom-button my-5" @click="applyFilters">Apply</v-btn>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Media items display -->
    <v-row>
      <v-col v-for="(item, index) in results" :key="getUniqueKey(item, index)" cols="6" sm="6" md="3" lg="2" v-if="item.poster_path">
        <v-hover v-slot:default="{ hover }">
          <v-card
            @click="redirectToViewInfo(item)"
            class="fade-in-left overlay-container mx-2"
            :class="{ 'hover-scale': hover }"
            style="background-color:transparent; cursor: pointer;"
          >
            <v-skeleton-loader v-if="isLoading" type="image" style="height:100%"></v-skeleton-loader>
            <v-img v-else :src="getImageUrl(item.poster_path)" height="100%" class="overlay-image" cover>
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
                    {{ item.title }}
                    <div class="title-underline"></div>
                  </div>
                  <div class="text-details mx-2">{{ item.release_date | formatDate }}</div>
                  <div class="text-caption mx-2">{{ truncatedText(item.overview, 120) }}</div>
                </div>
              </div>
            </v-img>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
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
import { VImg, VCard, VRating, VSkeletonLoader } from 'vuetify/lib';

const db = getFirestore(firebaseApp);
const API_KEY = process.env.VUE_APP_TMDB_API_KEY || 'a6a07bdb1ae12672ae2d301063d83c40';

export default {
  components: {
    VImg,
    VCard,
    VRating,
    VSkeletonLoader
  },
  data() {
    return {
      searchQuery: '',
      results: [],
      isLoading: false,
      filterDialog: false,
      selectedGenres: [],
      selectedType: null,
      selectedYear: null,
      selectedLanguage: null,
      selectedRating: 0,
      selectedSort: null,
      genres: [
        { text: 'Action', value: 28 },
        { text: 'Comedy', value: 35 },
        { text: 'Drama', value: 18 },
        { text: 'Horror', value: 27 },
        { text: 'Romance', value: 10749 },
        { text: 'Science Fiction', value: 878 },
        { text: 'Documentary', value: 99 },
        { text: 'Fantasy', value: 14 },
        { text: 'Mystery', value: 9648 },
        { text: 'Animation', value: 16 },
        { text: 'Adventure', value: 12 },
        { text: 'Thriller', value: 53 },
        { text: 'Crime', value: 80 },
        { text: 'Family', value: 10751 },
        { text: 'War', value: 10752 },
        { text: 'Romantic Comedy', value: 10749 }
      ],
      sortOptions: [
        { text: 'Popularity', value: 'popularity.desc' },
        { text: 'Release Date', value: 'release_date.desc' },
        { text: 'Rating', value: 'vote_average.desc' }
      ],
      yearOptions: this.generateYearOptions(1900, new Date().getFullYear()),
      isUserLoggedIn: !!localStorage.getItem("authId"), // Check if user is logged in
    };
  },
  mounted() {
    this.fetchDefaultMedia();
  },
  methods: {
    showFilterDialog() {
      this.filterDialog = true;
    },
    generateYearOptions(startYear, endYear) {
      const years = [];
      for (let year = endYear; year >= startYear; year--) {
        years.push({ text: year.toString(), value: year });
      }
      return years;
    },
    async fetchMedia(query = '') {
      this.isLoading = true;
      const apiKey = API_KEY;
      try {
        const fetchPage = async (page) => {
          let url;
          if (query) {
            // Determine search type based on selection, defaulting to 'tv'
            const searchType = this.selectedType === 'movie' ? 'movie' : 'tv';
            // Attempt to filter search results by Netflix provider
            url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${apiKey}&query=${encodeURIComponent(query)}&with_watch_providers=8&watch_region=US&page=${page}`;
          } else {
            const type = this.selectedType || 'movie';
            const yearParam = this.selectedYear
              ? `&${type === 'movie' ? 'primary_release_year' : 'first_air_date_year'}=${this.selectedYear}`
              : '';
            const languageParam = this.selectedLanguage ? `&with_original_language=${this.selectedLanguage}` : '';
            const ratingParam = this.selectedRating ? `&vote_average.gte=${this.selectedRating * 2}` : '';
            const sortParam = this.selectedSort ? `&sort_by=${this.selectedSort}` : '';
            // Append Netflix provider filter parameters
            const netflixFilter = `&with_watch_providers=8&watch_region=US`;
            url = `https://api.themoviedb.org/3/discover/${type}?api_key=${apiKey}&with_genres=${this.selectedGenres.join(',')}${yearParam}${languageParam}${ratingParam}${sortParam}${netflixFilter}&page=${page}`;
          }
          const response = await axios.get(url);
          return response.data.results;
        };

        const results = await Promise.all([
          fetchPage(1),
          fetchPage(2),
          fetchPage(3),
          fetchPage(4),
          fetchPage(5)
        ]);
        this.results = results.flat().map(item => ({
          ...item,
          type: item.media_type || this.selectedType,
          title: item.title || item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          rating: item.vote_average / 2
        }));
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchDefaultMedia() {
      this.isLoading = true;
      const apiKey = API_KEY;
      try {
        const fetchPage = async (page) => {
          // Use discover endpoint for TV shows and include Netflix filters
          const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&with_watch_providers=8&watch_region=US&page=${page}`;
          const response = await axios.get(url);
          return response.data.results;
        };

        const results = await Promise.all([
          fetchPage(1),
          fetchPage(2),
          fetchPage(3),
          fetchPage(4),
          fetchPage(5)
        ]);
        this.results = results.flat().map(item => ({
          ...item,
          type: 'tv', // Assuming default is TV shows for Netflix
          title: item.title || item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          rating: item.vote_average / 2
        }));
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        this.isLoading = false;
      }
    },
    applyFilters() {
      this.filterDialog = false;
      this.fetchMedia(this.searchQuery);
    },
    getImageUrl(path) {
      return path ? `https://image.tmdb.org/t/p/w500${path}` : 'default_image.jpg';
    },
    async redirectToViewInfo(item) {
      this.isLoading = true;
      const apiKey = API_KEY;
      try {
        const detailsUrl = `https://api.themoviedb.org/3/${item.type}/${item.id}?api_key=${apiKey}&append_to_response=external_ids`;
        const response = await axios.get(detailsUrl);
        let imdbId;
        if (item.type === 'movie') {
          imdbId = response.data.imdb_id;
        } else if (item.type === 'tv') {
          imdbId = response.data.external_ids ? response.data.external_ids.imdb_id : null;
        }
        if (imdbId) {
          localStorage.setItem('imdbId', imdbId);
          this.$router.push(`/viewInfo?id=${item.id}&type=${item.type}`);
        } else {
          console.error("IMDb ID not found for the item.");
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
      } finally {
        this.isLoading = false;
      }
    },
    truncatedText(text, maxLength = 120) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },
    async addToWatchlist(item) {
      const authId = localStorage.getItem("authId");

      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      try {
        let imdbId;
        if (item.type === 'movie') {
          const detailsUrl = `https://api.themoviedb.org/3/movie/${item.id}?api_key=${API_KEY}`;
          const response = await axios.get(detailsUrl);
          imdbId = response.data.imdb_id;
        } else if (item.type === 'tv') {
          const detailsUrl = `https://api.themoviedb.org/3/tv/${item.id}?api_key=${API_KEY}&append_to_response=external_ids`;
          const response = await axios.get(detailsUrl);
          imdbId = response.data.external_ids.imdb_id;
        }

        if (!imdbId) {
          console.error("IMDb ID not found for the item.");
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
            title: item.title,
            rating: item.vote_average || '',
            imageUrl: this.getImageUrl(item.poster_path),
            release_date: item.release_date,
            description: item.overview,
            type: item.type,
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

          console.log("Item added to watchlist successfully!");
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
          console.log("Item is already in the watchlist.");
        }
      } catch (error) {
        console.error("Error adding item to watchlist:", error);
      }
    },
    getUniqueKey(item, index) {
      return `${item.id}-${item.media_type || this.selectedType}-${index}`;
    }
  }
};
</script>

<style scoped>
/* Ensure the styles match exactly as previously provided */
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
