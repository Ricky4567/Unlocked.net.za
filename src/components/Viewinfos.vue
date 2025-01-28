<template>
  <div style="overflow-x:hidden">
    <!-- Alerts for success / error messages -->
    <v-row justify="center">
      <v-alert
        v-model="showSuccessAlert"
        type="success"
        style="position: absolute; z-index: 99; margin-top: 20px;"
        dismissible
        width="500px"
        transition="scale-transition"
      >
        {{ successMessage }}
      </v-alert>
      <v-alert
        v-model="showErrorAlert"
        type="error"
        style="position: absolute; z-index: 99; margin-top: 20px;"
        dismissible
        width="500px"
        transition="scale-transition"
      >
        {{ errorMessage }}
      </v-alert>
    </v-row>

    <!-- Banner / Background -->
    <v-row
      class="movie-banner"
      :style="{ backgroundImage: 'url(' + movieBackdropUrl + ')' }"
      justify="center"
      align="center"
      no-gutters
    >
      <v-col cols="12">
        <!-- Overlay (gradient) -->
        <div class="overlay">
          <!-- Row for poster on left, info on right -->
          <v-row justify="center" align="center" style="margin-left:-10%;" no-gutters>
            <!-- Poster Column -->
            <v-col
              cols="12"
              md="3"
              class="d-flex align-center justify-center poster-col"
            >
            <v-img
  :src="moviePosterUrl"
  alt="Movie Poster"
  height="450"
  width="auto"
  class="rounded-contain"
  contain
></v-img>

            </v-col>

            <!-- Info Column -->
            <v-col
              cols="12"
              md="4"
              class="info-col"
              style="position: relative; z-index: 1; padding: 1rem; text-align: center;"
            >
              <!-- If we have a FanArt logo, show it; otherwise, show text title -->
              <div v-if="movieLogo" class="logo-wrapper mb-4" style="margin: 0 auto;">
                <v-img
                  :src="movieLogo"
                  alt="Media Logo"
                  style="margin-left:-10%;"
                  height="200px"
                  width="auto"
                  contain
                ></v-img>
              </div>
              <div
                v-else
                class="movie-title animate-title"
                style="text-align: center; word-wrap: break-word;"
              >
                {{ movieTitle }}
              </div>

              <!-- Rating + Reviews -->
              <div class="mb-2" style="text-align: center;">
                {{ movieRating }}
                <span class="reviews-count">{{ reviewsCount }} Reviews</span>
              </div>

              <!-- Genres row -->
              <div v-if="movieGenres.length" class="mb-2" style="text-align: center;">
                <span
                  v-for="(genre, index) in movieGenres"
                  :key="index"
                  class="genre-pill"
                >
                  {{ genre }}
                  <span v-if="index < movieGenres.length - 1">|</span>
                </span>
              </div>

              <!-- Description container -->
              <div class="description-container" style="margin: 1em auto; max-width: 500px;">
                <p class="movie-description animate-description" style="text-align: center; word-wrap: break-word;">
                  {{ movieDescription }}
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="mt-3" style="display: flex; justify-content: center; flex-wrap: wrap;">
                <v-btn rounded width="10px"  height="46px" color="#23ffe5" @click="playContent">
         <v-icon>mdi-play</v-icon>
                </v-btn>
                <v-btn
                  height="46px"
                  class="mx-3"
                  outlined
                  rounded
                  dark
                  @click="fetchTrailer"
                >
                <v-icon>mdi-movie-play</v-icon>
                </v-btn>
                <v-btn
                  v-if="isAuthenticated"
            rounded outlined
                  height="46px"
                  dark
                  @click="addToWatchlist"
                >
  Add To Watchlist
                </v-btn>
                <!-- Download button (movies only) -->
                <v-btn
                  v-if="!isTvShow"
                  class="mx-3"
                  height="46px"
                  outlined
                  dark
                  rounded
                  @click="fetchMagnetLink"
                >
                  <v-icon>mdi-download</v-icon>
                 
                </v-btn>

                <!-- Otherwise, for TV shows, let them download a season -->
                <v-btn
                  v-if="isTvShow"
                  class="mx-3"
                  height="46px"
                  outlined
                  rounded
                  dark
                  @click="openDownloadDialog"
                >
                  <v-icon>mdi-download</v-icon>
               
                </v-btn>

                <!-- Watchlist button (only if authenticated) -->
   
              </div>
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>

    <!-- For TV shows: Tabbed interface for Seasons & Cast -->
    <v-tabs
      v-if="isTvShow"
      v-model="selectedTab"
      background-color="black"
      dark
      centered
    >
      <v-tab>Seasons</v-tab>
      <v-tab>Cast</v-tab>
    </v-tabs>

    <v-tabs-items style="background-color: black" v-model="selectedTab" v-if="isTvShow">
      <v-tab-item>
        <!-- Season Selector -->
        <v-row v-if="isTvShow" justify="center" class="my-7">
          <v-col cols="3"></v-col>
          <v-col class="episode-dropdown">
            <v-select
              outlined
              dark
              class="mx-2"
              v-model="selectedSeason"
              :items="seasons"
              label="Season"
              @change="fetchEpisodes"
              dense
            ></v-select>
          </v-col>
          <v-col cols="3"></v-col>
        </v-row>

        <!-- Scrollable container (2 episodes side by side) -->
        <v-row v-if="isTvShow" justify="center" class="my-7">
          <v-col cols="12" sm="10">
            <div style="max-height: 600px; overflow-y: auto; background-color: black;">
              <v-list
                dark
                style="background-color: black; overflow-y: hidden; overflow-x: hidden;"
              >
                <v-row>
                  <v-col
                    cols="12"
                    sm="6"
                    v-for="episode in episodes"
                    :key="episode.id"
                  >
                    <v-list-item
                      @click="selectEpisode(episode); playContent()"
                      class="episode-item"
                    >
                      <!-- Bigger circle image -->
                      <v-list-item-avatar size="120">
                        <v-img
                          :src="`https://image.tmdb.org/t/p/w300${episode.still_path}`"
                        ></v-img>
                        <div class="play-button-overlay">
                          <v-icon>mdi-play-circle</v-icon>
                        </div>
                      </v-list-item-avatar>

                      <v-list-item-content>
                        <v-list-item-title
                          style="font-size: 1.2rem; font-weight: bold;"
                        >
                          {{ episode.episode_number }}. {{ episode.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle style="font-size: 0.95rem;">
                          {{ episode.overview }}
                        </v-list-item-subtitle>
                      </v-list-item-content>

                      <v-list-item-action>
                        <span style="font-size: 0.95rem; font-weight: 600;">
                          {{ episode.runtime }}m
                        </span>
                      </v-list-item-action>
                    </v-list-item>
                  </v-col>
                </v-row>
              </v-list>
            </div>
          </v-col>
        </v-row>
      </v-tab-item>

      <v-tab-item>
        <Cast />
      </v-tab-item>
    </v-tabs-items>

    <!-- If it's a movie, just show the cast -->
    <div v-if="!isTvShow">
      <Cast />
    </div>

    <!-- "More Like This" section -->
    <LikeThis />

    <!-- Play Content Dialog -->
    <v-dialog style="overflow:hidden;" v-model="showVideoDialog" width="800">
      <v-card style="overflow:hidden;" color="black" class="dialog-content">
        <v-row justify="end" class="pa-3">
          <v-btn text style="position: absolute" dark @click="closeVideoDialog">
            <v-icon style="font-size: 30px">mdi-close</v-icon>
          </v-btn>
        </v-row>
        <div v-if="embedUrl" class="scroll-container" style="overflow-y: hidden; overflow-x: hidden;">
          <iframe
            ref="videoIframe"
            :src="embedUrl"
            width="100%"
            height="450"
            frameborder="0"
            sandbox="allow-scripts allow-same-origin"
            allow="autoplay; encrypted-media"
            allowfullscreen
          ></iframe>
        </div>
        <v-row v-if="isTvShow">
          <v-col>
            <v-btn color="#23ffe5" width="100%" @click="playNextEpisode"
              >Next Episode</v-btn
            >
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <!-- Trailer Dialog -->
    <v-dialog v-model="showDialog" style="overflow-x: hidden;" width="800">
      <v-card color="black">
        <v-row justify="end" class="pa-3">
          <v-btn
            color="black"
            style="position: absolute"
            dark
            @click="showDialog = false"
          >
            <v-icon style="font-size: 30px">mdi-close</v-icon>
          </v-btn>
        </v-row>
        <iframe
          v-if="trailerKey"
          width="100%"
          height="450"
          :src="'https://www.youtube.com/embed/' + trailerKey"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
        ></iframe>
      </v-card>
    </v-dialog>

    <!-- Download Season Dialog (for TV shows) -->
    <v-dialog v-model="showDownloadDialog" width="400" height="800px">
      <v-card class="pa-12" style="overflow-x:hidden;overflow-y: hidden;" color="black">
        <v-card-title style="color:white">Select Season to Download</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedSeasonToDownload"
            :items="seasons"
            filled
            dark
            label="Season"
            outlined
            dense
          ></v-select>
        </v-card-text>
        <v-row justify="center">
          <v-btn color="#23ffe5" @click="downloadSeason(selectedSeasonToDownload)"
            >Download</v-btn
          >
        </v-row>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";
import axios from "axios";

// Child components
import Details from "../components/Details.vue";
import Cast from "../components/Cast.vue";
import LikeThis from "../components/LikeThis.vue";

const db = getFirestore(firebaseApp);

export default {
  data() {
    return {
      // Basic media info
      movieTitle: "",
      movieRating: "",
      movieBackdropUrl: "",
      moviePosterUrl: "",
      movieRuntime: "",
      movieDescription: "",
      reviewsCount: "",
      movieGenres: [],  // <-- Added array for genres

      // TV show info
      isTvShow: false,
      seasons: [],
      selectedSeason: 1,
      selectedEpisode: 1,
      episodes: [],
      initialFetchDone: false,

      // Player / trailer states
      showDialog: false,
      trailerKey: null,
      showVideoDialog: false,
      embedUrl: "",
      isDubbed: false,
      isMuted: false,

      // UI alerts
      showSuccessAlert: false,
      successMessage: "",
      showErrorAlert: false,
      errorMessage: "",

      // Additional states
      selectedTab: 0,
      magnetLink: "",
      showDownloadDialog: false,
      selectedSeasonToDownload: null,
      torrents: [],
      torrentsLoaded: false,

      // For switching players
      selectedPlayer: { name: "Default", url: "vidsrc.cc/v3" },
      availablePlayers: [
        { name: "Player 1", url: "vidsrc.cc/v3" },
        { name: "Player 2", url: "embed.su" },
        { name: "Player 3", url: "vidsrc.dev" },
        { name: "Player 4", url: "vidsrc.pm" },
        { name: "Player 5", url: "vidsrc.vip" },
        { name: "Player 6", url: "vidsrc.xyz" },
      ],
      isMovie: false,

      // FanArt config and storage for logo
      fanartMovieBaseUrl: "https://webservice.fanart.tv/v3/movies",
      fanartTvBaseUrl: "https://webservice.fanart.tv/v3/tv",
      fanartApiKey: "77f845990d4d0b6bfe8472508b664c3b", // <-- Replace with your real FanArt key
      movieLogo: null,
    };
  },
  components: {
    Details,
    Cast,
    LikeThis,
  },
  mounted() {
    window.addEventListener("message", this.handlePlayerEvent);

    const imdbId = localStorage.getItem("imdbId");
    const authId = localStorage.getItem("authId");

    if (imdbId) {
      // Main fetch for details
      this.fetchMovieDetails(imdbId);

      // For TV shows, also fetch seasons/episodes
      this.fetchSeasonsAndEpisodes(imdbId).then(() => {
        if (this.episodes.length === 0 && !this.initialFetchDone) {
          this.initialFetchDone = true;
          this.fetchEpisodes();
        }
      });

      // Check if it’s a TV show
      this.checkIfTvShow(imdbId);

      // If user is logged in, fetch their "continue watching" data
      if (authId) {
        this.fetchContinueWatching(authId, imdbId);
      }
    } else {
      console.error("No IMDb ID found in localStorage");
    }

    // This logic checks localStorage "log" for reloading (TV only)
    this.checkIfTvShow(imdbId).then(() => {
      if (this.isTvShow === true) {
        const checkValue = localStorage.getItem("log");
        if (checkValue === "1") {
          localStorage.setItem("log", "2");
          window.location.reload();
        }
      }
    });

    // Restore selected player from localStorage if any
    const storedPlayer = localStorage.getItem("selectedPlayer");
    if (storedPlayer) {
      this.selectedPlayer = JSON.parse(storedPlayer);
    }
  },
  beforeDestroy() {
    window.removeEventListener("message", this.handlePlayerEvent);
  },
  computed: {
    episodeOptions() {
      return this.episodes.map((episode) => episode.episode_number);
    },
    isAuthenticated() {
      return localStorage.getItem("authId") !== null;
    },
  },
  methods: {
    // ===================================
    //        CHECK IF TV OR MOVIE
    // ===================================
    async checkIfTvShow(imdbId) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        const isTvShow = response.data.tv_results.length > 0;
        this.isTvShow = isTvShow;
      } catch (error) {
        console.error("Failed to check if IMDb ID is for a TV show:", error);
      }
    },

    // ===================================
    //     FETCH DETAILS & FANART LOGO
    // ===================================
    async fetchMovieDetails(imdbId) {
      try {
        // 1) /find to see if it's TV or movie data
        const findResponse = await axios.get(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );

        let media = null;
        let isTv = false;

        if (
          findResponse.data.tv_results &&
          findResponse.data.tv_results.length > 0
        ) {
          media = findResponse.data.tv_results[0];
          isTv = true;
        } else if (
          findResponse.data.movie_results &&
          findResponse.data.movie_results.length > 0
        ) {
          media = findResponse.data.movie_results[0];
        }

        if (!media) {
          console.error("No media found for this IMDb ID");
          return;
        }

        // 2) If it's TV, fetch the tvdb_id from /tv/{id}?append_to_response=external_ids
        let tvdbId = null;
        if (isTv) {
          const tvDetailsResponse = await axios.get(
            `https://api.themoviedb.org/3/tv/${media.id}?api_key=a6a07bdb1ae12672ae2d301063d83c40&append_to_response=external_ids`
          );
          tvdbId = tvDetailsResponse.data.external_ids.tvdb_id;

          // Extract genres for TV
          if (tvDetailsResponse.data.genres) {
            this.movieGenres = tvDetailsResponse.data.genres.map((g) => g.name);
          }
        } else {
          // If it's a movie, fetch details with /movie/{id}
          const movieDetailsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${media.id}?api_key=a6a07bdb1ae12672ae2d301063d83c40`
          );
          // Extract genres for Movie
          if (movieDetailsResponse.data.genres) {
            this.movieGenres = movieDetailsResponse.data.genres.map((g) => g.name);
          }
        }

        // 3) Fetch the logo from FanArt
        const logoUrl = await this.fetchMediaLogo(isTv, imdbId, tvdbId);
        this.movieLogo = logoUrl;
        this.isTvShow = isTv;

        // 4) Basic data
        this.movieTitle = media.title || media.name;
        this.movieRating = media.vote_average;
        this.movieBackdropUrl = media.backdrop_path
          ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
          : "";
        this.moviePosterUrl = media.poster_path
          ? `https://image.tmdb.org/t/p/original${media.poster_path}`
          : "";
        this.movieDescription = media.overview;
        this.reviewsCount = media.vote_count || "";

        // If it's a movie, fetch runtime separately (from that same movieDetailsResponse above)
        if (!isTv) {
          const movieDetailsResponse = await axios.get(
            `https://api.themoviedb.org/3/movie/${media.id}?api_key=a6a07bdb1ae12672ae2d301063d83c40`
          );
          this.movieRuntime = movieDetailsResponse.data.runtime
            ? `${movieDetailsResponse.data.runtime} min`
            : "";
        }
        this.scrollToTop();
      } catch (error) {
        console.error("Failed to fetch media details:", error);
      }
    },

    // ===================================
    //     FETCH LOGO FROM FANART
    // ===================================
    async fetchMediaLogo(isTv, imdbId, tvdbId) {
      try {
        if (isTv) {
          // For TV, we must use /v3/tv/{tvdb_id}
          if (!tvdbId) return null;
          const response = await axios.get(
            `${this.fanartTvBaseUrl}/${tvdbId}?api_key=${this.fanartApiKey}`
          );
          // TV logos typically under "hdtvlogo"
          const logos = response.data.hdtvlogo || [];
          return logos.length > 0 ? logos[0].url : null;
        } else {
          // For movies, use /v3/movies/{imdbId}
          const response = await axios.get(
            `${this.fanartMovieBaseUrl}/${imdbId}?api_key=${this.fanartApiKey}`
          );
          // Movie logos typically under "hdmovielogo"
          const logos = response.data.hdmovielogo || [];
          return logos.length > 0 ? logos[0].url : null;
        }
      } catch (error) {
        console.error("Failed to fetch media logo:", error);
        return null;
      }
    },

    // ===================================
    //        HANDLE EPISODES / TV
    // ===================================
    async fetchSeasonsAndEpisodes(imdbId) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        const tvShow = response.data.tv_results[0];
        if (tvShow) {
          const tvShowId = tvShow.id;
          const seasonsResponse = await axios.get(
            `https://api.themoviedb.org/3/tv/${tvShowId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US`
          );
          const tvShowData = {
            tvShow,
            seasons: seasonsResponse.data.seasons,
          };
          localStorage.setItem("tvShowData", JSON.stringify(tvShowData));
          this.seasons = tvShowData.seasons.map(
            (season) => season.season_number
          );
          this.scrollToTop();
        } else {
          console.error("TV show details not found");
        }
      } catch (error) {
        console.error("Failed to fetch TV show details:", error);
      }
    },
    async fetchEpisodes() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      const tvShowData = JSON.parse(localStorage.getItem("tvShowData"));
      if (!tvShowData) {
        console.error("TV show data not found in localStorage");
        return;
      }

      const selectedSeasonData = tvShowData.seasons.find(
        (season) => season.season_number === this.selectedSeason
      );
      if (!selectedSeasonData) {
        console.error("Season data not found");
        return;
      }

      const seasonNumber = selectedSeasonData.season_number;
      const response = await axios.get(
        `https://api.themoviedb.org/3/tv/${tvShowData.tvShow.id}/season/${seasonNumber}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US`
      );
      this.episodes = response.data.episodes;

      if (this.initialFetchDone && this.episodes.length === 0) {
        this.initialFetchDone = true;
        this.fetchEpisodes();
      }
      this.scrollToTop();
    },

    // ===================================
    //       PLAYBACK & EMBED LOGIC
    // ===================================
    handlePlayerEvent(event) {
      // Only listen for messages from vidsrc
      if (event.origin !== "https://vidsrc.cc") return;
      if (event.data && event.data.type === "PLAYER_EVENT") {
        const { event: eventType, season, episode } = event.data.data;
        if (eventType === "complete") {
          console.log(`Episode ${episode} of Season ${season} has ended.`);
          this.advanceToNextEpisode();
        }
      }
    },
    advanceToNextEpisode() {
      if (this.isTvShow) {
        this.selectedEpisode += 1;
        this.updateEmbedUrl();
      } else {
        console.warn("Not a TV show. No next episode to advance to.");
      }
    },
    scrollToTop() {
      window.scrollTo(0, 0);
    },
    toggleDubbed() {
      this.isDubbed = !this.isDubbed;
      this.updateEmbedUrl();
    },
    toggleMute() {
      this.isMuted = !this.isMuted;
      const iframe = this.$refs.videoIframe;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "toggleMute", mute: this.isMuted },
          "*"
        );
      }
      this.updateEmbedUrl();
    },
    closeVideoDialog() {
      this.showVideoDialog = false;
      this.embedUrl = "";
    },
    updateEmbedUrl() {
      const imdbId = localStorage.getItem("imdbId") || "";
      if (this.isMovie) {
        this.embedUrl = `https://vidsrc.cc/v2/embed/movie/${imdbId}`;
      } else {
        this.embedUrl = `https://vidsrc.cc/v2/embed/tv/${imdbId}/${this.selectedSeason}/${this.selectedEpisode}`;
      }
    },
    selectEpisode(episode) {
      this.selectedEpisode = episode.episode_number;
      this.updateEmbedUrl();
      this.showVideoDialog = true;
    },
    playNextEpisode() {
      const currentIndex = this.episodes.findIndex(
        (ep) => ep.episode_number === this.selectedEpisode
      );
      if (currentIndex >= 0 && currentIndex < this.episodes.length - 1) {
        // Stop the previous video
        this.embedUrl = "";
        // Move to next
        this.selectedEpisode = this.episodes[currentIndex + 1].episode_number;
        this.$nextTick(() => {
          this.updateEmbedUrl();
        });
      } else {
        console.warn("No more episodes available.");
      }
    },

    // ===================================
    //      WATCH HISTORY & WATCHLIST
    // ===================================
    async fetchContinueWatching(authId, imdbId) {
      try {
        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(
          continueWatchingRef,
          where("authId", "==", authId),
          where("imdbId", "==", imdbId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          querySnapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            this.selectedSeason = data.season || 1;
            this.selectedEpisode = data.episode || 1;
            this.updateEmbedUrl();
          });
        }
      } catch (error) {
        console.error("Failed to fetch continue watching data:", error);
      }
    },
    async isAlreadyWatched(authId, imdbId) {
      try {
        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(
          continueWatchingRef,
          where("authId", "==", authId),
          where("imdbId", "==", imdbId),
          where("season", "==", this.selectedSeason),
          where("episode", "==", this.selectedEpisode)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
      } catch (error) {
        console.error("Error checking watch history:", error);
        return false;
      }
    },
    async addToContinueWatching(authId, imdbId) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        const media =
          response.data.movie_results[0] || response.data.tv_results[0];

        if (!media) {
          console.error("Media details not found");
          return;
        }

        const mediaData = {
          authId: authId,
          imdbId: imdbId,
          title: media.title || media.name,
          rating: media.vote_average,
          imageUrl: `https://image.tmdb.org/t/p/original${media.poster_path}`,
          runtime: media.runtime
            ? `${media.runtime} min`
            : `Seasons: ${media.number_of_seasons}`,
          description: media.overview,
          lastWatched: new Date(),
          lastEdited: new Date(),
          season: this.selectedSeason,
          episode: this.selectedEpisode,
        };

        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(
          continueWatchingRef,
          where("authId", "==", authId),
          where("imdbId", "==", imdbId)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(collection(db, "continue_watching"), mediaData);
          console.log("Added to continue watching");
        } else {
          // If doc exists, update it
          querySnapshot.forEach(async (docSnapshot) => {
            const docRef = doc(db, "continue_watching", docSnapshot.id);
            await updateDoc(docRef, {
              season: this.selectedSeason,
              episode: this.selectedEpisode,
              lastWatched: new Date(),
              lastEdited: new Date(),
            });
            console.log("Updated continue watching with new season/episode");
          });
        }
      } catch (error) {
        console.error("Error adding to continue watching:", error);
      }
    },
    async updateSeasonEpisodeInContinueWatching() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }
      const authId = localStorage.getItem("authId");
      if (!authId) {
        console.warn("No authId found. Skipping update to continue watching.");
        return;
      }

      try {
        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(
          continueWatchingRef,
          where("authId", "==", authId),
          where("imdbId", "==", imdbId)
        );

        if (!q.empty) {
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach(async (docSnapshot) => {
            const docRef = doc(db, "continue_watching", docSnapshot.id);
            await updateDoc(docRef, {
              season: this.selectedSeason,
              episode: this.selectedEpisode,
              lastWatched: new Date(),
              lastEdited: new Date(),
            });
            console.log("Updated continue watching with new season/episode");
          });
        }
      } catch (error) {
        console.error("Error updating continue watching:", error);
      }
    },
    async addToWatchlist() {
      const authId = localStorage.getItem("authId");
      const imdbId = localStorage.getItem("imdbId");
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      const movieData = {
        authId: authId,
        imdbId: imdbId,
        title: this.movieTitle,
        rating: this.movieRating,
        imageUrl: this.moviePosterUrl,
        runtime: this.movieRuntime,
        description: this.movieDescription,
      };

      try {
        await addDoc(collection(db, "watchlist"), movieData);
        this.successMessage = "Movie added to watchlist successfully!";
        this.showSuccessAlert = true;
        setTimeout(() => {
          this.showSuccessAlert = false;
        }, 3000);
        this.scrollToTop();
      } catch (error) {
        console.error("Error adding movie to watchlist:", error);
      }
    },

    // ===================================
    //       PLAY CONTENT BUTTON
    // ===================================
    async playContent() {
      const tmdbId = localStorage.getItem("imdbId");
      const authId = localStorage.getItem("authId");
      if (!tmdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }
      if (!authId) {
        console.warn("No auth ID found. Skipping 'add to continue watching'.");
        this.checkIfMovie(tmdbId);
        return;
      }

      // Check if already in watch history
      const alreadyWatched = await this.isAlreadyWatched(authId, tmdbId);
      if (alreadyWatched) {
        console.warn("Episode/season already in watch history.");
        this.checkIfMovie(tmdbId);
        return;
      }

      await this.addToContinueWatching(authId, tmdbId);
      this.checkIfMovie(tmdbId);
    },

    // Determine if it's a movie
    async checkIfMovie(tmdbId) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/find/${tmdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        this.isMovie = response.data.movie_results.length > 0;
        this.updateEmbedUrl();
        this.showVideoDialog = true;
      } catch (error) {
        console.error("Failed to check if IMDb ID is for a movie:", error);
      }
    },

    // ===================================
    //        TRAILER FETCHING
    // ===================================
    async fetchTrailer() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      try {
        const findResponse = await axios.get(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        let mediaType = null;
        let mediaId = null;

        if (findResponse.data.movie_results[0]) {
          mediaType = "movie";
          mediaId = findResponse.data.movie_results[0].id;
        } else if (findResponse.data.tv_results[0]) {
          mediaType = "tv";
          mediaId = findResponse.data.tv_results[0].id;
        }

        if (!mediaId) {
          console.error("Media ID not found");
          return;
        }

        const videosResponse = await axios.get(
          `https://api.themoviedb.org/3/${mediaType}/${mediaId}/videos?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US`
        );
        const trailer = videosResponse.data.results.find(
          (video) => video.type === "Trailer"
        );
        if (trailer) {
          this.trailerKey = trailer.key;
          this.showDialog = true;
        } else {
          this.errorMessage = "No trailers found for the media.";
          this.showErrorAlert = true;
        }
      } catch (error) {
        console.error("Failed to fetch trailer:", error);
      }
    },

    // ===================================
    //        TORRENT / MAGNET
    // ===================================
    async fetchMagnetLink() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      try {
        const response = await axios.get(
          `https://yts.mx/api/v2/list_movies.json?query_term=${imdbId}`
        );
        if (
          response.data &&
          response.data.data.movies &&
          response.data.data.movies.length > 0
        ) {
          const movieData = response.data.data.movies[0];
          const torrentInfo = movieData.torrents[0];
          this.constructMagnetLink(torrentInfo.hash, movieData.title);
        } else {
          this.errorMessage = "No torrents found for the movie.";
          this.showErrorAlert = true;
        }
      } catch (error) {
        console.error("Error fetching magnet link:", error);
      }
    },
    constructMagnetLink(torrentHash, movieTitle) {
      const encodedMovieTitle = encodeURIComponent(movieTitle);
      const trackers = [
        "udp://open.demonii.com:1337/announce",
        "udp://tracker.openbittorrent.com:80",
        "udp://tracker.coppersurfer.tk:6969",
        "udp://glotorrents.pw:6969/announce",
        "udp://tracker.opentrackr.org:1337/announce",
        "udp://torrent.gresille.org:80/announce",
        "udp://torrent.gresille.org:80/announce",
        "udp://p4p.arenabg.com:1337",
        "udp://tracker.leechers-paradise.org:6969",
      ];

      let magnetLink = `magnet:?xt=urn:btih:${torrentHash}&dn=${encodedMovieTitle}`;
      trackers.forEach((tracker) => {
        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
      });

      this.magnetLink = magnetLink;
      window.open(magnetLink, "_blank");
    },

    // ===================================
    //   DOWNLOAD TV SEASON (EZTV EXAMPLE)
    // ===================================
    openDownloadDialog() {
      this.showDownloadDialog = true;
    },
    async downloadSeason(season) {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) {
        console.error("IMDb ID not available");
        return;
      }
      const imdbIdWithoutTT = imdbId.replace("tt", "");
      let seasonMagnetLinks = [];

      try {
        const response = await axios.get(
          `https://eztvx.to/api/get-torrents?imdb_id=${imdbIdWithoutTT}`
        );
        if (response.data && response.data.torrents) {
          const filteredTorrents = response.data.torrents
            .filter((torrent) => {
              const seasonRegex = new RegExp(`S${String(season).padStart(2, "0")}`);
              return seasonRegex.test(torrent.filename);
            })
            .map((torrent) => ({
              filename: torrent.filename,
              magnetLink: torrent.magnet_url,
            }));

          seasonMagnetLinks = filteredTorrents.map(
            (torrent) => torrent.magnetLink
          );
        }

        if (seasonMagnetLinks.length > 0) {
          seasonMagnetLinks.forEach((link) => {
            window.open(link, "_blank");
          });
        } else {
          this.errorMessage = `No torrents found for Season ${season}.`;
          this.showErrorAlert = true;
        }
      } catch (error) {
        console.error("Error fetching torrents:", error);
      }
    },
  },
  watch: {
    showDialog(newVal) {
      if (newVal) {
        // Close other dialogs
        this.showVideoDialog = false;
        this.showDownloadDialog = false;
      }
    },
    showVideoDialog(value) {
      if (value) {
        // Close trailer / download dialogs
        this.showDialog = false;
        this.showDownloadDialog = false;
        // If TV show and not fetched seasons yet
        if (!this.seasons.length) {
          const imdbId = localStorage.getItem("imdbId");
          if (imdbId) {
            this.fetchSeasonsAndEpisodes(imdbId);
          }
        }
      } else {
        // Reset embed URL
        this.embedUrl = "";
      }
    },
    showDownloadDialog(newVal) {
      if (newVal) {
        // Close trailer / player dialogs
        this.showDialog = false;
        this.showVideoDialog = false;
      }
    },
    selectedSeason() {
      this.updateEmbedUrl();
      this.fetchEpisodes();
    },
    selectedEpisode() {
      this.updateEmbedUrl();
    },
    selectedPlayer(newPlayer) {
      localStorage.setItem("selectedPlayer", JSON.stringify(newPlayer));
      this.updateEmbedUrl();
    },
    embedUrl() {
      // Called whenever embedUrl changes (if you need further logic).
    },
  },
};
</script>

<style scoped>
/* 
  Updated banner styles to place the poster on the left, info on the right,
  while still keeping the background backdrop and gradient overlay.
*/

.movie-banner {
  position: relative;
  width: 100%;
  height: 106vh;
  background-size: cover;
  background-position: center;
  color: white;
}

/* OVERLAY (gradient) */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.5) 30%,
    rgba(0, 0, 0, 1) 90%,
    rgba(0, 0, 0, 1) 100%
  );
  display: flex; /* so our <v-row> can fill inside */
}

/* Poster column centered */
.poster-col {
  text-align: center;
}

/* Info column for title, rating, description, etc. */
.info-col {
  display: flex;
  flex-direction: column;
  justify-content: center; /* or flex-start, etc. */
  text-align: left;
}

/* Title */
.movie-title {
  font-size: 3em;
  font-weight: 700;
  color: white;
  margin-bottom: 0.2em;
  animation: fadeIn 1s ease-out forwards;
}

/* Rating count, etc. */
.reviews-count {
  margin-left: 10px;
}

/* Description container */
.description-container {
  text-align: center;
  word-wrap: break-word;
}

/* Animate in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-title {
  animation: fadeInUp 1s ease-in-out;
}
.animate-description {
  animation: fadeInUp 1.5s ease-in-out;
}

/* Genre pills (simple example) */
.genre-pill {
  display: inline-block;
  padding: 0.3em 0.6em;
  margin: 0.2em;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

/* Buttons */
.v-btn {
  transition: background-color 0.3s;
  font-size: 1rem;
  height: 46px;
}
.v-btn:hover {
  background-color: rgba(35, 255, 229, 0.8);
}

/* Episode items / list styling */
.episode-item {
  cursor: pointer;
  min-height: 180px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.episode-item:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
.play-button-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 2em;
  display: none;
}
.episode-item:hover .play-button-overlay {
  display: block;
}

/* Scroll containers (hide scrollbars) */
.scroll-container {
  overflow-y: auto;
  max-height: 650px;
}
.scroll-container::-webkit-scrollbar {
  display: none;
}
.scroll-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Optional styling for vertical scrollbars in other areas */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: #23ffe5;
  border-radius: 10px;
}
::-webkit-scrollbar-track {
  background-color: #2c2c2c;
  border-radius: 10px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .movie-banner {
    height: auto; /* Let it auto-size for small screens */
  }
  .movie-title {
    font-size: 1.5rem;
  }
  .movie-description {
    font-size: 0.875rem;
  }
  .v-btn {
    font-size: 0.75rem;
    height: 26px;
  }
}
</style>
