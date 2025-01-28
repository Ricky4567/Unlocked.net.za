<template>
  <div>
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
    </v-row>
    <div
      class="movie-banner"
      :style="{ backgroundImage: 'url(' + movieBackdropUrl + ')' }"
    >
      <v-col cols="12">
        <div class="overlay">
          <div class="movie-info mx-7">
            <div class="movie-title">{{ movieTitle }}</div>
            <div class="movie-rating">
              {{ movieRating }}
              <span class="reviews-count">{{ reviewsCount }} Reviews</span>
            </div>

            <p class="movie-description">{{ movieDescription }}</p>
            <v-btn height="46px" width="100%" color="#23ffe5" @click="playContent">Play</v-btn>
            <v-btn height="46px" width="100%" class="my-4" outlined dark @click="fetchTrailer">Trailer</v-btn>
            <v-btn v-if="isAuthenticated" height="46px" width="50%" dark @click="addToWatchlist">
              ADD TO LIST<v-icon class="mx-1 mb-1">mdi-plus</v-icon>
            </v-btn>
            <v-btn v-if="!isTvShow" height="46px" width="50%" outlined dark @click="fetchMagnetLink">
              <v-icon>mdi-download</v-icon> Download
            </v-btn>
            <v-btn v-if="isTvShow" height="46px " class="pa-3" width="48%" outlined dark @click="openDownloadDialog">
              <v-icon>mdi-download</v-icon> Download
            </v-btn>
          </div>
        </div>
      </v-col>
    </div>

    <v-row class="d-none d-md-block">
      <Details />
    </v-row>

    <!-- Play Content Dialog -->
    <v-dialog v-model="showVideoDialog" width="800">
      <v-card style="overflow-x: hidden;" color="black" class="dialog-content">
        <v-row justify="end" class="pa-3">
        <v-btn
          color="black"
          style="position: absolute"
          dark
          @click="showVideoDialog = false"
        >
          <v-icon style="font-size: 30px">mdi-close</v-icon>
        </v-btn>
</v-row>
        <div class="scroll-container">
          <iframe
            v-if="embedUrl"
            :src="embedUrl"
            width="100%"
            height="450"
            frameborder="0"
            sandbox="allow-scripts allow-same-origin"

            allow="autoplay; encrypted-media"
            allowfullscreen
          ></iframe>
          <!-- <div v-if="!isTvShow">
            <v-btn width="90%" class="mx-3 my-3" outlined dense dark @click="changePlayerMovie">Change Player</v-btn>
          </div> -->
          <!-- Episode List Section -->
          <div v-if="isTvShow" class="episode-list my-4" style="display: flex; gap: 10px;">
            <!-- <v-btn width="47%" outlined dense dark @click="changePlayer">Change Player</v-btn> -->
            <v-btn
              v-if="isTvShow"
              color="#23ffe5"
              width="100%"
              @click="playNextEpisode"
            >
              Next Episode
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <div v-if="isTvShow">
      <v-select
        filled
        outlined
        v-if="isTvShow"
        dark
        style="width:180px"
        class="mx-2"
        v-model="selectedSeason"
        :items="seasons"
        label="Season"
        @change="fetchEpisodes"
        dense
      ></v-select>
      <v-list dark style="background-color:black; overflow-y:auto; height:550px;">
        <v-list-item-group>
          <v-list-item
            v-for="episode in episodes"
            :key="episode.id"
            height="70px"
            @click="selectEpisode(episode), playContent()"
                        class="episode-item"
          >
            <v-list-item-avatar height="100px" width="100px">
              <v-img :src="`https://image.tmdb.org/t/p/w300${episode.still_path}`"></v-img>
              <div class="play-button-overlay">
                <v-icon>mdi-play-circle</v-icon>
              </div>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>{{ episode.episode_number }}. {{ episode.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ episode.overview }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-action>
              <span>{{ episode.runtime }}m</span>
            </v-list-item-action>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </div>

    <div>
      <LikeThis />
    </div>

    <v-dialog v-model="showDialog" width="800">
      <v-card color="black">
        <v-btn
          color="black"
          style="position: absolute"
          dark
          @click="showDialog = false"
        >
          <v-icon style="font-size: 30px">mdi-close</v-icon>
        </v-btn>

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

    <!-- Download Season Dialog -->
    <v-dialog v-model="showDownloadDialog" width="400" height="800px">
      <v-card class="pa-12" style="overflow-x:hidden;overflow-y: hidden;" color="black">
        <v-card-title style="color:white">Select Season to Download</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedSeasonToDownload"
            :items="seasons"
            filled dark
            label="Season"
            outlined dense
          ></v-select>
        </v-card-text>

        <v-row justify="center">
          <v-btn color="#23ffe5" @click="downloadSeason(selectedSeasonToDownload)">
            Download
          </v-btn>
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

import Details from "../components/Details.vue";
import Cast from "../components/Cast.vue";
import LikeThis from "../components/LikeThis.vue";

const db = getFirestore(firebaseApp);

export default {
  data() {
    return {
      movieTitle: "",
      movieRating: "",
      movieBackdropUrl: "",
      moviePosterUrl: "",
      initialFetchDone: false,
      isTvShow: false,
      movieRuntime: "",
      movieDescription: "",
      reviewsCount: "",
      seasons: [],
      selectedSeason: 1,
      selectedEpisode: 1,
      episodes: [],
      showDialog: false,
      trailerKey: null,
      showVideoDialog: false,
      embedUrl: "",
      showSuccessAlert: false,
      successMessage: "",
      showDownloadDialog: false,
      selectedSeasonToDownload: null,
    };
  },
  components: {
    Details,
    Cast,
    LikeThis,
  },
  mounted() {
    this.listenToPlayerEvents();

    const imdbId = localStorage.getItem("imdbId");
    const authId = localStorage.getItem("authId");
    if (imdbId) {
      this.fetchMovieDetails(imdbId);
      this.fetchSeasonsAndEpisodes(imdbId).then(() => {
        if (this.episodes.length === 0 && !this.initialFetchDone) {
          this.initialFetchDone = true;
          this.fetchEpisodes();
        }
      });
      this.checkIfTvShow(imdbId);
      if (authId) {
        this.fetchContinueWatching(authId, imdbId);
      }
    } else {
      console.error("No IMDb ID found in localStorage");
    }

    this.checkIfTvShow(imdbId).then(() => {
      if (this.isTvShow === true) {
        const checkValue = localStorage.getItem("log");
        if (checkValue === "1") {
          localStorage.setItem("log", "2");
          window.location.reload();
        }
      }
    });
  },
  computed: {
    episodeOptions() {
      return this.episodes.map(episode => episode.episode_number);
    },
    isAuthenticated() {
      return localStorage.getItem("authId") !== null;
    },
  },
  methods: {
    scrollToTop() {
      window.scrollTo(0, 0);
    },
    listenToPlayerEvents() {
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://vidsrc.cc') return;
      if (event.data && event.data.type === 'PLAYER_EVENT') {
        const { event: eventType, currentTime, duration } = event.data.data;
        console.log(`Player ${eventType} at ${currentTime}s of ${duration}s`);
        if (eventType === 'complete' && this.isTvShow) {
          this.playNextEpisode();
        }
      }
    });
  },
    async initializeAdBlocker() {
      try {
        const blocker = await WebExtensionBlocker.fromPrebuiltAdsAndTracking({
          path: 'https://easylist.to/easylist/easylist.txt'
        });
        blocker.enableBlockingInBrowser(window);
        this.applyAdBlocker(blocker);
      } catch (error) {
        console.error('Failed to initialize ad blocker:', error);
      }
    },
    applyAdBlocker(blocker) {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        const src = iframe.src;
        if (blocker.match(src)) {
          iframe.remove();
        }
      });
    },
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
    async fetchMovieDetails(imdbId) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        let media =
          response.data.movie_results[0] || response.data.tv_results[0];
        if (media) {
          this.movieTitle = media.title || media.name;
          this.movieRating = media.vote_average;
          this.movieBackdropUrl = `https://image.tmdb.org/t/p/original${media.backdrop_path}`;
          this.moviePosterUrl = `https://image.tmdb.org/t/p/original${media.poster_path}`;
          this.movieRuntime = media.runtime
            ? media.runtime + " min"
            : "Seasons: " + media.number_of_seasons;
          this.movieDescription = media.overview;
          this.reviewsCount = media.vote_count;
          this.scrollToTop();
        } else {
          console.error("Media details not found");
        }
      } catch (error) {
        console.error("Failed to fetch media details:", error);
      }
    },
    async fetchTrailer() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) return console.error("No IMDb ID found in localStorage");

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

        if (!mediaId) return console.error("Media ID not found");

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
          console.error("No trailers found for the media");
        }
      } catch (error) {
        console.error("Failed to fetch trailer:", error);
      }
    },
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
    playNextEpisode() {
  const currentIndex = this.episodes.findIndex(
    (ep) => ep.episode_number === this.selectedEpisode
  );
  if (currentIndex >= 0 && currentIndex < this.episodes.length - 1) {
    const nextEpisode = this.episodes[currentIndex + 1];
    this.selectedEpisode = nextEpisode.episode_number;
    this.updateEmbedUrl();
    this.showVideoDialog = true;
    this.updateSeasonEpisodeInContinueWatching();
  } else {
    console.warn("No more episodes available.");
  }
},

    async playContent() {
      const tmdbId = localStorage.getItem("imdbId");
      const authId = localStorage.getItem("authId");

      if (!tmdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      if (!authId) {
        console.warn(
          "No auth ID found in localStorage. Skipping 'add to continue watching'."
        );
        this.checkIfMovie(tmdbId);
        return;
      }

      const isAlreadyWatched = await this.isAlreadyWatched(authId, tmdbId);
      if (isAlreadyWatched) {
        console.warn("Episode and season already in watch history.");
        this.checkIfMovie(tmdbId);
        return;
      }

      await this.addToContinueWatching(authId, tmdbId);
      this.checkIfMovie(tmdbId);
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
          querySnapshot.forEach(async (docSnapshot) => {
            const docRef = doc(db, "continue_watching", docSnapshot.id);
            await updateDoc(docRef, {
              season: this.selectedSeason,
              episode: this.selectedEpisode,
              lastWatched: new Date(),
              lastEdited: new Date(),
            });
            console.log("Updated continue watching with new season and episode");
          });
        }
      } catch (error) {
        console.error("Error adding to continue watching:", error);
      }
    },
    async checkIfMovie(tmdbId) {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/find/${tmdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`
        );
        const isMovie = response.data.movie_results.length > 0;
        if (isMovie) {
          this.embedUrl = `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
          this.showVideoDialog = true;
        } else {
          this.playTvShowContent(tmdbId);
        }
      } catch (error) {
        console.error("Failed to check if IMDb ID is for a movie:", error);
      }
    },
    playTvShowContent(tmdbId) {
      const season = this.selectedSeason || 1;
      const episode = this.selectedEpisode || 1;

      this.selectedSeason = season;
      this.selectedEpisode = episode;

      localStorage.setItem("selectedSeason", season);
      localStorage.setItem("selectedEpisode", episode);

      this.embedUrl = `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`;
      this.showVideoDialog = true;
    },
    updateEmbedUrl() {
      const tmdbId = localStorage.getItem("imdbId");
      if (!tmdbId || !this.selectedSeason || !this.selectedEpisode) {
        console.error(
          "IMDb ID, selected season, or selected episode not available."
        );
        return;
      }

      localStorage.setItem("selectedSeason", this.selectedSeason);
      localStorage.setItem("selectedEpisode", this.selectedEpisode);

      this.embedUrl = `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${this.selectedSeason}/${this.selectedEpisode}`;
    },
    async updateSeasonEpisodeInContinueWatching() {
      const imdbId = localStorage.getItem("imdbId");

      if (!imdbId) {
        console.error("No IMDb ID found in localStorage");
        return;
      }

      const authId = localStorage.getItem("authId");

      if (!authId) {
        console.warn(
          "No authId found in localStorage. Skipping update to continue watching."
        );
        return;
      }

      try {
        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(
          continueWatchingRef,
          where("authId", "==", authId),
          where("imdbId", "==", imdbId)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach(async (docSnapshot) => {
            const docRef = doc(db, "continue_watching", docSnapshot.id);
            await updateDoc(docRef, {
              season: this.selectedSeason,
              episode: this.selectedEpisode,
              lastWatched: new Date(),
              lastEdited: new Date(),
            });
            console.log("Updated continue watching with new season and episode");
          });
        }
      } catch (error) {
        console.error("Error updating continue watching:", error);
      }
    },
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
    async fetchEpisodes() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) return console.error("No IMDb ID found in localStorage");

      const tvShowData = JSON.parse(localStorage.getItem("tvShowData"));
      if (!tvShowData) return console.error("TV show data not found in localStorage");

      const selectedSeasonData = tvShowData.seasons.find(season => season.season_number === this.selectedSeason);
      if (!selectedSeasonData) return console.error("Season data not found");

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
    selectEpisode(episode) {
      this.selectedEpisode = episode.episode_number;
      this.updateEmbedUrl();
      this.showVideoDialog = true;
      this.updateSeasonEpisodeInContinueWatching();
    },
    changePlayer() {
      const tmdbId = localStorage.getItem("imdbId");
      if (!tmdbId || !this.selectedSeason || !this.selectedEpisode) {
        console.error(
          "IMDb ID, selected season, or selected episode not available."
        );
        return;
      }

      localStorage.setItem("selectedSeason", this.selectedSeason);
      localStorage.setItem("selectedEpisode", this.selectedEpisode);

      const currentUrl = localStorage.getItem("currentUrl");
      let newUrl = '';
      if (currentUrl === 'vidsrc.cc/v2') {
        newUrl = 'vidsrc.me';
      } else {
        newUrl = 'vidsrc.cc/v2';
      }
      localStorage.setItem("currentUrl", newUrl);

      this.embedUrl = `https://${newUrl}/embed/tv/${tmdbId}/${this.selectedSeason}/${this.selectedEpisode}`;
      this.showVideoDialog = true;
    },
    changePlayerMovie() {
      const tmdbId = localStorage.getItem("imdbId");
      if (!tmdbId || !this.selectedSeason || !this.selectedEpisode) {
        console.error(
          "IMDb ID, selected season, or selected episode not available."
        );
        return;
      }

      localStorage.setItem("selectedSeason", this.selectedSeason);
      localStorage.setItem("selectedEpisode", this.selectedEpisode);

      const currentUrl = localStorage.getItem("currentUrl");
      let newUrl = '';
      if (currentUrl === 'vidsrc.cc/v2') {
        newUrl = 'vidsrc.me';
      } else {
        newUrl = 'vidsrc.cc/v2';
      }

      localStorage.setItem("currentUrl", newUrl);
      this.embedUrl = `https://${newUrl}/embed/movie/${tmdbId}`;

      this.showVideoDialog = true;
    },
    async fetchMagnetLink() {
      const imdbId = localStorage.getItem("imdbId");
      if (!imdbId) return console.error("No IMDb ID found in localStorage");

      try {
        const response = await axios.get(
          `https://yts.mx/api/v2/list_movies.json?query_term=${imdbId}`
        );
        if (response.data && response.data.data.movies && response.data.data.movies.length > 0) {
          const movieData = response.data.data.movies[0];
          const torrentInfo = movieData.torrents[0]; // Assuming you want the first torrent
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
        'udp://open.demonii.com:1337/announce',
        'udp://tracker.openbittorrent.com:80',
        'udp://tracker.coppersurfer.tk:6969',
        'udp://glotorrents.pw:6969/announce',
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://torrent.gresille.org:80/announce',
        'udp://torrent.gresille.org:80/announce',
        'udp://p4p.arenabg.com:1337',
        'udp://tracker.leechers-paradise.org:6969',
      ];

      let magnetLink = `magnet:?xt=urn:btih:${torrentHash}&dn=${encodedMovieTitle}`;
      trackers.forEach(tracker => {
        magnetLink += `&tr=${encodeURIComponent(tracker)}`;
      });

      this.magnetLink = magnetLink;
      window.open(magnetLink, "_blank"); // Open the magnet link in a new tab
    },
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
              const seasonRegex = new RegExp(`S${String(season).padStart(2, '0')}`);
              return seasonRegex.test(torrent.filename);
            })
            .map((torrent) => ({
              filename: torrent.filename,
              magnetLink: torrent.magnet_url,
            }));

          seasonMagnetLinks = filteredTorrents.map(torrent => torrent.magnetLink);
        }

        if (seasonMagnetLinks.length > 0) {
          seasonMagnetLinks.forEach(link => {
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
    showVideoDialog(value) {
      if (value && !this.seasons.length) {
        const imdbId = localStorage.getItem("imdbId");
        if (imdbId) {
          this.fetchSeasonsAndEpisodes(imdbId);
        }
      }
    },
    selectedSeason(newSeason) {

      this.updateEmbedUrl();
      this.fetchEpisodes();
    },
    selectedEpisode(newEpisode) {
      this.updateEmbedUrl();
    },
  },
};
</script>

<style scoped>
.dialog-content {
  overflow-y: auto;
  max-height: 80vh;
}

.scroll-container {
  overflow-y: auto;
  max-height: 650px;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.scroll-container::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scroll-container {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.movie-banner {
  width: 100%;
  height: 500px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  padding: 20px;
  color: white;
  position: relative;
}

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
  display: flex;
  align-items: center;
}

.movie-info {
  padding: 20px;
  z-index: 1; /* To ensure movie info is above the gradient */
}

.movie-title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.movie-rating {
  display: flex;
  align-items: center;
}

.reviews-count {
  margin-left: 10px;
}

.movie-runtime,
.movie-description {
  margin-top: 10px;
}

.v-btn {
  font-size: 1rem;
  height: 46px;
}

.episode-list {
  margin-top: 20px;
}

.episode-dropdown {
  margin-bottom: 20px;
}

.episode-item {
  display: flex;
  align-items: center;
  height: 130px;
  background-color: black;
  position: relative;
}

.episode-item:hover .play-button-overlay {
  opacity: 1;
}

.play-button-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 2.5rem;
}

.v-list-item-title {
  font-weight: bold;
}

.v-list-item-subtitle {
  color: rgba(255, 255, 255, 0.7);
}

/* Media query for mobile devices */
@media (max-width: 600px) {
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

/* Truncate movie description after 3 lines */
.movie-description {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>