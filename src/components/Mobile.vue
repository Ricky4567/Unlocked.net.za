<template>
  <v-carousel hide-delimiters show-arrows-on-hover cycle class="carousel-wrapper" height="64vh">
    <v-carousel-item
      v-for="(movie, index) in movies"
      :key="index"
      class="carousel-item"
      @click="goToMovieDetails(movie.imdb_id)"
    >
      <div class="movie-banner">
        <img :src="`https://image.tmdb.org/t/p/original${movie.poster_path}`" class="poster" />
        <div class="gradient-overlay"></div>
        <div class="movie-details">

          <div style="font-size:35px;" class="rating">{{ movie.vote_average }}</div>
          <v-rating dark outlined color="#23ffe5" :value="movie.vote_average / 2" readonly dense></v-rating>
          <div class="genres">{{ movie.genres.join(' | ') }}</div>
        </div>
      </div>
    </v-carousel-item>
  </v-carousel>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      movies: [],
      apiKey: 'a6a07bdb1ae12672ae2d301063d83c40',
      baseUrl: 'https://api.themoviedb.org/3'
    };
  },
  methods: {
    async fetchMovies() {
      try {
        const response = await axios.get(`${this.baseUrl}/movie/now_playing?api_key=${this.apiKey}&language=en-US`);
        const genreMap = await this.fetchGenres();

        const moviesWithDetails = await Promise.all(
          response.data.results.map(async (movie) => {
            const movieDetails = await this.fetchMovieDetails(movie.id);
            return {
              ...movie,
              genres: movie.genre_ids.map((id) => genreMap[id]).filter(Boolean),
              imdb_id: movieDetails.imdb_id
            };
          })
        );

        this.movies = moviesWithDetails;
      } catch (error) {
        console.error('Failed to fetch movies:', error);
      }
    },
    async fetchGenres() {
      const response = await axios.get(`${this.baseUrl}/genre/movie/list?api_key=${this.apiKey}&language=en-US`);
      const genres = response.data.genres;
      return genres.reduce((map, genre) => {
        map[genre.id] = genre.name;
        return map;
      }, {});
    },
    async fetchMovieDetails(movieId) {
      const response = await axios.get(`${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}`);
      return response.data;
    },
    goToMovieDetails(imdbId) {
      localStorage.setItem('imdbId', imdbId);
      this.$router.push({ path: '/viewinfo', query: { id: imdbId } });
    }
  },
  mounted() {
    this.fetchMovies();
  }
};
</script>

<style scoped>
.carousel-wrapper {
  width: 100%;
  height: 900px; /* Adjusted height */
}

.carousel-item {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.movie-banner {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  text-align: center;
  width: 100%;
  height: 100%;
}

.poster {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gradient-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(to top, rgba(0, 0, 0, 1), transparent);
}

.movie-details {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
  padding: 0 10px;
}

.movie-details .title {
  font-size: 28px;
  margin: 0;
}

.movie-details .rating {
  font-size: 20px;
  margin-top: 10px;
}

.movie-details .genres {
  font-size: 16px;
  margin-top: 5px;
}

@media (max-width: 600px) {
  .movie-details .title {
    font-size: 24px;
  }

  .movie-details .rating {
    font-size: 18px;
  }

  .movie-details .genres {
    font-size: 14px;
  }
}
</style>
