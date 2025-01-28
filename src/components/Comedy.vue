<template>
  <div v-if="movie" class="random-comedy-container">
    <!-- LEFT SIDE: Show backdrop by default -->
    <div
      class="media-container pa-4"
      @mouseover="showTrailer = true"
      @mouseleave="showTrailer = false"
    >
      <!-- On hover, show the autoplaying trailer -->
      <div v-if="showTrailer && trailerUrl" class="video-iframe-wrapper">
        <iframe
          :src="trailerUrl"
          frameborder="0"
          allowfullscreen
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>

      <!-- If not hovering or no trailer found, show the backdrop image -->
      <div v-else class="fallback-image pa-10">
        <v-img
          :src="getBackdropUrl(movie.backdrop_path)"
          alt="Backdrop"
          cover
        />
      </div>
    </div>

    <!-- RIGHT SIDE: Content + smaller logo aligned top-right -->
    <div class="info-container">
      <div class="content-and-logo">
        <!-- All textual info on the left side -->
        <div class="text-content pa-7">
          <div v-if="movie.logo" class="logo-container" style="margin-top:-20px">
            <v-img
              :src="movie.logo"
              alt="Movie Logo"
              height="200px"
              contain
            />
          </div>
          <!-- Title if no logo (fallback) -->
          <div v-if="!movie.logo" class="movie-title">{{ movie.title }}</div>

          <!-- Movie rating / year / duration / certification -->
          <div class="movie-subinfo">
            <span class="rating">
              <v-icon color="#23ffe5" small>mdi-star</v-icon>
              {{ movie.vote_average.toFixed(1) }} (IMDb)
            </span>
            <span class="separator">·</span>
            <span>{{ movie.year }}</span>
            <span class="separator">·</span>
            <span>{{ formattedRuntime }}</span>
            <span class="separator">·</span>
            <span class="certification">{{ movie.certification }}</span>
          </div>

          <!-- Overview -->
          <p class="overview">{{ movie.overview }}</p>

          <!-- Buttons -->
          <div class="button-group">
            <v-btn large color="#23ffe5" @click="handleWatchNow">
              Watch Now
            </v-btn>
            <v-btn large outlined color="white" class="mx-3" @click="handleDetails">
              Details
            </v-btn>
          </div>
        </div>

        <!-- (Optional) smaller logo on the right could go here if needed -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { VImg, VIcon, VBtn } from "vuetify/lib";

const TMDB_API_KEY = "a6a07bdb1ae12672ae2d301063d83c40";
const FANART_API_KEY = "77f845990d4d0b6bfe8472508b664c3b";

export default {
  name: "RandomComedyMovie",
  components: {
    VImg,
    VIcon,
    VBtn
  },
  data() {
    return {
      showTrailer: false,
      movie: null,
      trailerUrl: null
    };
  },
  computed: {
    formattedRuntime() {
      if (!this.movie || !this.movie.runtime) return "";
      const hours = Math.floor(this.movie.runtime / 60);
      const minutes = this.movie.runtime % 60;
      return `${hours}h ${minutes}m`;
    }
  },
  methods: {
    async fetchRandomComedy() {
      try {
        // 1) Random page of "Comedy" (genre=35)
        const randomPage = Math.floor(Math.random() * 50) + 1;

        // 2) Discover URL with filters
        const discoverUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35&language=en-US&page=${randomPage}&sort_by=popularity.desc&vote_average.gte=7&include_adult=false`;

        const discoverRes = await axios.get(discoverUrl);
        const results = discoverRes.data.results || [];
        if (!results.length) return;

        // 3) Pick one random movie from the filtered results
        const randomIndex = Math.floor(Math.random() * results.length);
        const randomMovieBasic = results[randomIndex];

        // 4) Fetch full details (including trailers and US certification)
        const detailsUrl = `https://api.themoviedb.org/3/movie/${randomMovieBasic.id}?api_key=${TMDB_API_KEY}&append_to_response=videos,release_dates`;
        const detailsRes = await axios.get(detailsUrl);
        const data = detailsRes.data;

        // 5) Find a YouTube trailer
        const trailer = data.videos.results.find(
          (v) => v.site === "YouTube" && v.type === "Trailer"
        );
        const officialTrailerKey = trailer ? trailer.key : null;

        // 6) US rating/certification
        const usRelease = data.release_dates?.results?.find(
          (rel) => rel.iso_3166_1 === "US"
        );
        let certification = "NR";
        if (usRelease && usRelease.release_dates.length > 0) {
          certification = usRelease.release_dates[0].certification || "NR";
        }

        // 7) Build movie object
        this.movie = {
          id: data.id,
          title: data.title,
          backdrop_path: data.backdrop_path,
          overview: data.overview,
          vote_average: data.vote_average || 0,
          runtime: data.runtime,
          year: (data.release_date || "").slice(0, 4),
          certification,
          imdbId: data.imdb_id,
          logo: null
        };

        // 8) Autoplay trailer (only on hover)
        if (officialTrailerKey) {
          this.trailerUrl = `https://www.youtube.com/embed/${officialTrailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&rel=0`;
        } else {
          this.trailerUrl = null;
        }

        // 9) Try to fetch a fanart.tv logo
        if (this.movie.imdbId) {
          const logoUrl = await this.fetchMovieLogo(this.movie.imdbId);
          if (logoUrl) {
            this.movie.logo = logoUrl;
          }
        }
      } catch (err) {
        console.error("Error fetching random comedy:", err);
      }
    },

    async fetchMovieLogo(imdbId) {
      try {
        const fanartUrl = `https://webservice.fanart.tv/v3/movies/${imdbId}?api_key=${FANART_API_KEY}`;
        const response = await axios.get(fanartUrl);
        const logos = response.data.hdmovielogo || [];
        return logos.length > 0 ? logos[0].url : null;
      } catch (error) {
        console.warn("Failed to fetch movie logo from fanart:", error);
        return null;
      }
    },

    getBackdropUrl(path) {
      if (!path) {
        return "https://via.placeholder.com/1280x720?text=No+Image";
      }
      return `https://image.tmdb.org/t/p/original${path}`;
    },

    handleWatchNow() {
      if (!this.movie.imdbId) {
        console.error("No IMDb ID found for this movie.");
        return;
      }
      localStorage.setItem("imdbId", this.movie.imdbId);
      this.$router.push("/viewInfo");
    },

    handleDetails() {
      alert("You clicked 'Detail' – integrate your route or modal logic here!");
    }
  },
  mounted() {
    // Fetch a random comedy on mount
    this.fetchRandomComedy();
  }
};
</script>

<style scoped>
/* -----------------------
   GENERAL LAYOUT
------------------------ */
.random-comedy-container {
  /* Use flex + wrap to prevent overlap on smaller screens or high zoom */
  display: flex;
  flex-wrap: wrap;
  background-color: #000;
  color: #fff;
  min-height: 60vh;
  padding: 1rem;
  box-sizing: border-box;
}

/* Each column tries to be ~500px but can flex bigger or smaller,
   then wraps if needed. */
.media-container,
.info-container {
  flex: 1 1 500px;  /* grow/shrink with an ideal width of ~500px */
  min-width: 300px; /* if <300px, it wraps to a new row */
  box-sizing: border-box;
  margin-bottom: 1rem; /* spacing for when they wrap */
}

/* -----------------------
   LEFT SIDE (VIDEO or IMAGE)
------------------------ */
.media-container {
  position: relative;
  background: black;
  overflow: hidden;
}

/* 16:9 ratio for the iframe container */
.video-iframe-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
}
.video-iframe-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.fallback-image {
  width: 100%;
  height: 100%;
}

/* -----------------------
   RIGHT SIDE (INFO)
------------------------ */
.info-container {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.content-and-logo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; /* top-aligned content */
}

.text-content {
  flex: 1;
  margin-right: 1rem;
}

/* If no logo, we show the big text title */
.movie-title {
  font-size: 2em;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #fff;
}

/* Logo container */
.logo-container {
  max-width: 400px;
  max-height: 400px;
  display: flex;
  align-items: center;
}

/* Make sure the <v-img> inside also respects these sizes */
.logo-container ::v-deep .v-img__img {
  object-fit: contain;
  height: 80px;
  width: auto;
}

/* Sub-info row (rating, year, runtime, etc.) */
.movie-subinfo {
  margin: 0.5rem 0 1rem;
  display: flex;
  align-items: center;
  font-size: 1.1em;
  color: #bbb;
}
.separator {
  margin: 0 0.5em;
}
.certification {
  background-color: #23ffe5;
  color: #000;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-weight: bold;
}

/* Overview text */
.overview {
  font-size: 1.1em;
  color: #ddd;
  line-height: 1.4;
  margin-bottom: 2rem;
  max-width: 90%;
}

/* Buttons */
.button-group {
  display: flex;
  align-items: center;
}
</style>
