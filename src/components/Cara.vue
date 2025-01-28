<template>
  <div>
    <!-- Category Toggle (Centered) -->


    <!-- Carousel -->
    <v-carousel hide-delimiters show-arrows-on-hover cycle height="660px" class="cara">
      <div class="d-flex justify-center pa-3">
      <v-chip-group
        row
        v-model="selectedCategory"
        column
        class="my-4"
        style="position: absolute;z-index:999"
       color="#23ffe5"
        @change="categoryChanged"
      >
        <v-chip value="movies" class="ma-1">Movies</v-chip>
        <v-chip value="tvShows" class="ma-1">TV Shows</v-chip>
      </v-chip-group>
    </div>
      <v-carousel-item
        v-for="(item, index) in media"
        :key="index"
        :src="`https://image.tmdb.org/t/p/original${item.backdrop_path}`"
        class="carousel-item"
        @mouseover="showTrailer(index)"
        @mouseleave="hideTrailer(index)"
      >
      <div
        style="z-index:8;position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.9) 90%, rgba(0,0,0,1) 100%);"
      ></div>
        <!-- Banner Content -->
        <div class="banner-content">
          <v-container fluid>
            <v-row>
              <v-col cols="12" sm="8" md="6">
                <!-- Logo or Title -->
                <transition name="fade" appear>
                  <div v-if="item.logo" class="movie-logo">
                    <v-img
                      height="200px"
                      style="margin-left:-20%;"
                      contain
                      :src="item.logo"
                      alt="Logo"
                    />
                  </div>
                  <div v-else class="movie-title">
                    {{ item.title || item.name }}
                  </div>
                </transition>

                <!-- Info (Rating, Year, Runtime, Certification) -->
                <transition name="slide-fade" appear>
                  <div class="movie-info">
                    <span class="rating">
                      <v-icon color="#23ffe5">mdi-star</v-icon>
                      {{ item.vote_average }}
                    </span>
                    <span class="year">
                      |
                      {{ (item.release_date || item.first_air_date || '').split('-')[0] }}
                    </span>
                    <span class="duration">| {{ formatRuntime(item.runtime) }}</span>
                    <span class="rating-badge">{{ item.certification }}</span>
                  </div>
                </transition>

                <!-- Overview -->
                <transition name="slide-fade" appear>
                  <p class="description">{{ item.overview }}</p>
                </transition>

                <!-- Buttons -->
                <v-btn
                  height="46px"
                  width="130px"
                  color="#23ffe5"
                  @click="viewInfo(item.imdb_id)"
                >
                  Play
                </v-btn>

                <v-btn
                  height="46px"
                  width="130px"
                  class="mx-3"
                  outlined
                  dark
                  @click="viewInfo(item.imdb_id)"
                >
                  More Info
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- Trailer Iframe -->
        <div v-if="item.showTrailer" class="trailer">
          <iframe
            :src="`${item.trailer_url}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&fs=0&iv_load_policy=3&disablekb=1&playsinline=1`"
            frameborder="0"
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 177.77777778vh;
              height: 56.25vw;
              min-width: 100%;
              min-height: 100%;
              transform: translate(-50%, -50%);
            "
            allow="autoplay; fullscreen"
            allowfullscreen
          ></iframe>
        </div>
      </v-carousel-item>
    </v-carousel>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      media: [], // Will hold either Movies or TV Shows data
      selectedCategory: 'movies', // Default to 'movies'
      apiKey: 'a6a07bdb1ae12672ae2d301063d83c40',
      fanartApiKey: '77f845990d4d0b6bfe8472508b664c3b',
      baseUrl: 'https://api.themoviedb.org/3',
      fanartMovieUrl: 'https://webservice.fanart.tv/v3/movies', // For movie logos
      fanartTvUrl: 'https://webservice.fanart.tv/v3/tv', // For TV logos
    };
  },
  methods: {
    // ------------------------------------------------------
    // DECIDE WHICH FETCH METHOD TO CALL
    // ------------------------------------------------------
    async fetchData() {
      if (this.selectedCategory === 'movies') {
        await this.fetchMovies();
      } else {
        await this.fetchTVShows();
      }
    },

    // ------------------------------------------------------
    // FETCH MOVIES
    // ------------------------------------------------------
    async fetchMovies() {
      try {
        const response = await axios.get(
          `${this.baseUrl}/movie/now_playing?api_key=${this.apiKey}&language=en-US`
        );
        const genreMap = await this.fetchGenres('movie');

        const moviesWithDetails = await Promise.all(
          response.data.results.map(async (movie) => {
            const details = await this.fetchMovieDetails(movie.id);
            // Pull movie logo from fanart's movie endpoint
            const logo = await this.fetchMovieLogo(details.imdb_id);

            return {
              ...movie,
              genres: movie.genre_ids.map((id) => genreMap[id]).filter(Boolean),
              imdb_id: details.imdb_id,
              trailer_url: details.trailer_url,
              runtime: details.runtime,
              vote_average: details.vote_average,
              certification: details.certification,
              logo,
              showTrailer: false,
            };
          })
        );

        this.media = moviesWithDetails;
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
    },

    // ------------------------------------------------------
    // FETCH TV SHOWS
    // ------------------------------------------------------
// ------------------------------------------------------
// FETCH TV SHOWS
// ------------------------------------------------------
async fetchTVShows() {
  try {
    // Switch from "tv/popular" to "tv/top_rated" to get high-rated series
    const response = await axios.get(
      `${this.baseUrl}/tv/top_rated?api_key=${this.apiKey}&language=en-US`
    );
    const genreMap = await this.fetchGenres('tv');

    const tvWithDetails = await Promise.all(
      response.data.results.map(async (tv) => {
        const details = await this.fetchTVShowDetails(tv.id);

        // For TV shows, we need the TVDB ID from external_ids to fetch logos via fanart.tv
        let logo = null;
        if (details.external_ids && details.external_ids.tvdb_id) {
          logo = await this.fetchTVShowLogo(details.external_ids.tvdb_id);
        }

        return {
          ...tv,
          genres: tv.genre_ids.map((id) => genreMap[id]).filter(Boolean),
          imdb_id: details.external_ids.imdb_id,
          trailer_url: details.trailer_url,
          runtime: details.runtime,
          vote_average: details.vote_average,
          certification: details.certification,
          logo,
          showTrailer: false,
        };
      })
    );

    this.media = tvWithDetails;
  } catch (error) {
    console.error('Failed to fetch TV shows:', error);
  }
}
,

    // ------------------------------------------------------
    // FETCH GENRES (MOVIE OR TV)
    // ------------------------------------------------------
    async fetchGenres(type) {
      // type can be 'movie' or 'tv'
      const response = await axios.get(
        `${this.baseUrl}/genre/${type}/list?api_key=${this.apiKey}&language=en-US`
      );
      const genres = response.data.genres;
      return genres.reduce((map, genre) => {
        map[genre.id] = genre.name;
        return map;
      }, {});
    },

    // ------------------------------------------------------
    // FETCH MOVIE DETAILS
    // ------------------------------------------------------
    async fetchMovieDetails(movieId) {
      const response = await axios.get(
        `${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=en-US&append_to_response=release_dates,videos`
      );
      const data = response.data;

      const certification = this.getCertification(data.release_dates);
      const trailerObj = data.videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );

      return {
        ...data,
        trailer_url: trailerObj
          ? `https://www.youtube.com/embed/${trailerObj.key}`
          : null,
        certification,
      };
    },

    // ------------------------------------------------------
    // FETCH TV SHOW DETAILS
    // ------------------------------------------------------
    async fetchTVShowDetails(tvId) {
      const response = await axios.get(
        `${this.baseUrl}/tv/${tvId}?api_key=${this.apiKey}&language=en-US&append_to_response=content_ratings,videos,external_ids`
      );
      const data = response.data;

      // Certification from content ratings
      const certification = this.getTVCertification(
        data.content_ratings.results
      );

      // Some TV shows have an array of episode_run_time
      const runtime = data.episode_run_time && data.episode_run_time.length
        ? data.episode_run_time[0]
        : 0;

      const trailerObj = data.videos.results.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );

      return {
        ...data,
        trailer_url: trailerObj
          ? `https://www.youtube.com/embed/${trailerObj.key}`
          : null,
        certification,
        runtime,
      };
    },

    // ------------------------------------------------------
    // FETCH MOVIE LOGO (fanart.tv/movies)
    // ------------------------------------------------------
    async fetchMovieLogo(imdbId) {
      if (!imdbId) return null;
      try {
        const response = await axios.get(
          `${this.fanartMovieUrl}/${imdbId}?api_key=${this.fanartApiKey}`
        );
        const logos = response.data.hdmovielogo || [];
        return logos.length > 0 ? logos[0].url : null;
      } catch (error) {
        console.error('Failed to fetch movie logo:', error);
        return null;
      }
    },

    // ------------------------------------------------------
    // FETCH TV SHOW LOGO (fanart.tv/tv)
    // ------------------------------------------------------
    async fetchTVShowLogo(tvdbId) {
      if (!tvdbId) return null;
      try {
        const response = await axios.get(
          `${this.fanartTvUrl}/${tvdbId}?api_key=${this.fanartApiKey}`
        );
        // Fanart returns "hdtvlogo" array for TV shows
        const logos = response.data.hdtvlogo || [];
        return logos.length > 0 ? logos[0].url : null;
      } catch (error) {
        console.error('Failed to fetch TV show logo:', error);
        return null;
      }
    },

    // ------------------------------------------------------
    // MOVIE CERTIFICATION (FROM release_dates)
    // ------------------------------------------------------
    getCertification(releaseDates) {
      const usRelease = releaseDates.results.find(
        (rel) => rel.iso_3166_1 === 'US'
      );
      if (usRelease && usRelease.release_dates.length > 0) {
        return usRelease.release_dates[0].certification || 'NR';
      }
      return 'NR'; // Not Rated
    },

    // ------------------------------------------------------
    // TV CERTIFICATION (FROM content_ratings)
    // ------------------------------------------------------
    getTVCertification(contentRatings) {
      const usRating = contentRatings.find((c) => c.iso_3166_1 === 'US');
      return usRating ? usRating.rating : 'NR';
    },

    // ------------------------------------------------------
    // FORMAT RUNTIME (HOURS & MINUTES)
    // ------------------------------------------------------
    formatRuntime(runtime) {
      if (!runtime) return 'N/A';
      const hours = Math.floor(runtime / 60);
      const minutes = runtime % 60;
      return hours
        ? `${hours} hr ${minutes} mins`
        : `${minutes} mins`;
    },

    // ------------------------------------------------------
    // VIEW INFO BUTTON: SAVE & ROUTE
    // ------------------------------------------------------
    viewInfo(imdbId) {
      if (!imdbId) return;
      localStorage.setItem('imdbId', imdbId);
      this.$router.push({ path: '/viewInfo', query: { id: imdbId } });
    },

    // ------------------------------------------------------
    // SHOW / HIDE TRAILER ON HOVER
    // ------------------------------------------------------
    showTrailer(index) {
      this.$set(this.media[index], 'showTrailer', true);
    },
    hideTrailer(index) {
      this.$set(this.media[index], 'showTrailer', false);
    },

    // ------------------------------------------------------
    // TOGGLE CATEGORY
    // ------------------------------------------------------
    categoryChanged() {
      // Remember choice
      localStorage.setItem('selectedCategory', this.selectedCategory);
      // Fetch data
      this.fetchData();
    },
  },

  // ------------------------------------------------------
  // LIFECYCLE
  // ------------------------------------------------------
  mounted() {
    // Restore previous selection if available
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
      this.selectedCategory = savedCategory;
    }
    // Fetch the relevant data
    this.fetchData();
  },
};
</script>

<style scoped>
.carousel-item {
  position: relative;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
}

.banner-content {
  position: absolute;
  bottom: 20%;
  left: 10%;
  max-width: 80%;
  z-index: 9;
}

.movie-title {
  font-size: 3em;
  font-weight: 700;
  color: white;
  margin-bottom: 0.2em;
  animation: fadeIn 1s ease-out forwards;
}

.movie-info {
  font-size: 1.2em;
  color: white;
  margin-bottom: 0.5em;
  display: flex;
  align-items: center;
  animation: slideFadeIn 1.2s ease-out forwards;
}

.rating,
.year,
.duration,
.rating-badge {
  margin-right: 1em;
}

.rating-badge {
  background-color: #23ffe5;
  padding: 0.2em 0.5em;
  border-radius: 4px;
  font-size: 0.9em;
  color: white;
}

.description {
  font-size: 1.1em;
  color: white;
  margin-bottom: 1.5em;
  animation: slideFadeIn 1.5s ease-out forwards;
}

.trailer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.trailer iframe {
  pointer-events: none; /* so user cannot click the iframe */
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Styles */
@media (max-width: 600px) {
  .movie-title {
    font-size: 1.8em;
  }

  .movie-info {
    font-size: 0.9em;
  }

  .description {
    font-size: 0.9em;
  }

  .banner-content {
    bottom: 10%;
    left: 5%;
    max-width: 90%;
  }
}
</style>
