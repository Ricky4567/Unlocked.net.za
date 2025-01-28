<template>
    <div class="scroll-container">
        <v-row class="mt-3">
        <div class="white--text my-3 mx-8" style="font-size:17px">ACTION MOVIES</div>
      </v-row>
      <div class="scroll-controls">
        <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
        <v-row class="scroll-row" ref="scrollRow" no-gutters>
          <v-col
            v-for="movie in actionMovies"
            :key="movie.id"
            cols="6" sm="6" md="2"
          >
            <v-hover v-slot:default="{ hover }">
              <v-card
                @click="redirectToViewInfo(movie)"
                class="d-flex flex-column overlay-container pa-4"
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
                  class="white--text align-end"
                  contain
                >
                  <template v-if="hover">
                    <div class="overlay-content">
                      <v-icon large color="white">mdi-play-circle-outline</v-icon>
                      <div class="text-h5 mt-2">{{ movie.title }}</div>
                      <div class="text-subtitle-1">{{ movie.release_date | formatDate }}</div>
                      <div class="text-caption">{{ truncatedText(movie.overview) }}</div>
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
  import { debounce } from 'lodash';  // Optional: to handle scroll event efficiently
  
  const API_KEY = process.env.VUE_APP_TMDB_API_KEY || 'a6a07bdb1ae12672ae2d301063d83c40';  // Use environment variable
  
  export default {
    components: {
      VImg,
      VCard,
      VSkeletonLoader
    },
    data() {
      return {
        actionMovies: [],
        isLoading: false
      };
    },
    created() {
      this.fetchActionMovies();
    },
    methods: {
      async fetchActionMovies() {
        this.isLoading = true;
        try {
          const page1 = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28&language=en-US&sort_by=popularity.desc&page=${Math.floor(Math.random() * 50) + 1}`);
          const page2 = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28&language=en-US&sort_by=popularity.desc&page=${Math.floor(Math.random() * 50) + 1}`);
          
          this.actionMovies = [...page1.data.results, ...page2.data.results].slice(0, 20).map(movie => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            overview: movie.overview
          }));
        } catch (error) {
          console.error("Error fetching action movies:", error);
        } finally {
          this.isLoading = false;
        }
      },
      getImageUrl(path) {
        return path ? `https://image.tmdb.org/t/p/w500${path}` : 'default_image.jpg';
      },
      async redirectToViewInfo(movie) {
        this.isLoading = true;
        try {
          const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`;
          const response = await axios.get(detailsUrl);
          const imdbId = response.data.imdb_id;
          if (imdbId) {
            localStorage.setItem('imdbId', imdbId);
            // Redirect to the viewInfo page with the imdbId
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
      truncatedText(text, maxLength = 100) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
      },
      scrollLeft: debounce(function () {
        const scrollRow = this.$refs.scrollRow;
        scrollRow.scrollBy({ left: -300, behavior: 'smooth' });
      }, 100),
      scrollRight: debounce(function () {
        const scrollRow = this.$refs.scrollRow;
        scrollRow.scrollBy({ left: 300, behavior: 'smooth' });
      }, 100)
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
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
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
  .text-h5, .text-subtitle-1, .text-caption {
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
  