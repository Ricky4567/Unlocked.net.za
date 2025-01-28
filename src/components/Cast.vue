<template>
  <div class="scroll-container">
    <div class="scroll-controls">
      <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
      <v-row class="scroll-row" ref="scrollRow" no-gutters>
        <v-col
          v-for="member in castList"
          :key="member.id"
          cols="12" sm="6" md="3" lg="2"
        >
          <v-hover v-slot:default="{ hover }">
            <v-card
              class="fade-in-left overlay-container mx-2"
              :class="{ 'hover-scale': hover }"
              style="background-color:transparent; cursor: pointer;"
              @click="goToCastMovies(member.name)"
            >
              <v-skeleton-loader
                v-if="isLoading"
                type="image"
                style="height:100%"
              ></v-skeleton-loader>
              <v-img
                v-else
                :src="member.photoUrl"
                height="100%"
                class="overlay-image"
                cover
              >
      
                <div v-if="hover" class="overlay-gradient"></div>
                <div class="overlay-content-bottom">
                  <div class="overlay-text-bottom">
                    <div class="text-h6 mx-2">
                      {{ member.name }}
                      <div class="title-underline"></div>
                    </div>
                    <div class="text-details mx-2">{{ member.character }}</div>
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
      castList: [],
      isLoading: false
    };
  },
  mounted() {
    this.fetchCastDetails();
  },
  methods: {
    async fetchCastDetails() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      try {
        const findResponse = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}?api_key=${API_KEY}&language=en-US&external_source=imdb_id`);
        
        const movie = findResponse.data.movie_results[0];
        const tvShow = findResponse.data.tv_results[0];

        let creditsResponse;
        if (movie) {
          creditsResponse = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}&language=en-US`);
        } else if (tvShow) {
          creditsResponse = await axios.get(`https://api.themoviedb.org/3/tv/${tvShow.id}/credits?api_key=${API_KEY}&language=en-US`);
        } else {
          console.error("Media ID not found");
          return;
        }

        this.castList = creditsResponse.data.cast.map(member => ({
          id: member.cast_id,
          name: member.name,
          character: member.character,
          photoUrl: `https://image.tmdb.org/t/p/w500${member.profile_path}`
        }));
      } catch (error) {
        console.error("Failed to fetch cast details:", error);
      }
    },
    scrollLeft: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: -300, behavior: 'smooth' });
    }, 50),
    scrollRight: debounce(function () {
      const scrollRow = this.$refs.scrollRow;
      scrollRow.scrollBy({ left: 300, behavior: 'smooth' });
    }, 50),
    goToCastMovies(actorName) {
      localStorage.setItem('actorName', actorName);
      this.$router.push('/castMovies');
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
