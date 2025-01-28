<template>
  <div class="pa-10">
    <h3 class="white--text my-3" style="margin-left:100px;">Movies and Shows</h3>
    <v-row>
      <v-col
        v-for="item in results"
        :key="item.id"
        cols="12" sm="6" md="3" lg="2"
        v-if="results.length > 0"
      >
        <v-hover v-slot:default="{ hover }">
          <v-card
            @click="redirectToViewInfo(item)"
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
                    {{ item.title }}
                    <div class="title-underline"></div>
                  </div>
                  <div class="text-details mx-2">{{ item.release_date | formatDate }}</div>
                  <div class="text-caption mx-2">{{ truncatedText(item.overview, 100) }}</div>
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
import { VImg, VCard, VSkeletonLoader } from 'vuetify/lib';
import { firebaseApp } from "../firebaseConfig";

const db = getFirestore(firebaseApp);

export default {
  components: {
    VImg,
    VCard,
    VSkeletonLoader
  },
  data() {
    return {
      results: [],
      isLoading: false,
      isUserLoggedIn: !!localStorage.getItem("authId"),
    };
  },
  mounted() {
    this.fetchActorCredits();
  },
  methods: {
    async fetchActorCredits() {
      const actorName = localStorage.getItem('actorName');
      if (!actorName) {
        console.error("No actor name found in localStorage");
        return;
      }

      const apiKey = 'a6a07bdb1ae12672ae2d301063d83c40'; // Hardcoded API key

      try {
        const actorResponse = await axios.get(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(actorName)}`);
        const actor = actorResponse.data.results[0];

        if (!actor) {
          console.error("Actor not found");
          return;
        }

        const [movieCreditsResponse, tvCreditsResponse] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/person/${actor.id}/movie_credits?api_key=${apiKey}`),
          axios.get(`https://api.themoviedb.org/3/person/${actor.id}/tv_credits?api_key=${apiKey}`)
        ]);

        const movieCredits = movieCreditsResponse.data.cast;
        const tvCredits = tvCreditsResponse.data.cast;

        this.results = [
          ...movieCredits.map(item => ({ ...item, type: 'movie' })),
          ...tvCredits.map(item => ({ ...item, type: 'tv' }))
        ].map(item => ({
          ...item,
          title: item.title || item.name,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          release_date: item.release_date || item.first_air_date,
          rating: item.vote_average / 2
        }));

      } catch (error) {
        console.error("Error fetching actor credits:", error);
      } finally {
        this.isLoading = false;
      }
    },
    getImageUrl(path) {
      return path ? `https://image.tmdb.org/t/p/w500${path}` : 'default_image.jpg';
    },
    async redirectToViewInfo(item) {
      this.isLoading = true;
      const apiKey = 'a6a07bdb1ae12672ae2d301063d83c40';
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
    async addToWatchlist(item) {
      const authId = localStorage.getItem("authId");

      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      try {
        const detailsUrl = `https://api.themoviedb.org/3/${item.type}/${item.id}?api_key=a6a07bdb1ae12672ae2d301063d83c40`;
        const response = await axios.get(detailsUrl);
        const imdbId = item.type === 'movie' ? response.data.imdb_id : response.data.external_ids.imdb_id;

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
            rating: item.vote_average !== undefined ? item.vote_average : '',
            imageUrl: this.getImageUrl(item.poster_path),
            release_date: item.release_date,
            description: item.overview,
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
        }
      } catch (error) {
        console.error("Error adding item to watchlist:", error);
      }
    },
    truncatedText(text, maxLength = 100) {
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
  }
};
</script>

  <style scoped>
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
  .fade-in-left {
    animation: fade-in-left 1.5s cubic-bezier(.39,.575,.565,1.000) both;
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
  