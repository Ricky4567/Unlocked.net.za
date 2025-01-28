<template>
  <v-container>
    <!-- Navigation Tabs -->
    <v-row justify="end" align="end">
      <v-col class="nav-tab">OVERVIEW</v-col> 
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Left Pane -->
      <v-col cols="12" md="4">
        <v-img :src="movieImageUrl" alt="movie poster" height="500px" class="movie-poster" contain></v-img>
      </v-col>

      <!-- Right Pane -->
      <v-col cols="12" md="8">
        <h1 class="movie-title">{{ movieTitle }}</h1>
        <h2 class="headline">Storyline</h2>
        <p class="movie-storyline">{{ movieStoryline }}</p>

        <div class="metadata">
          <div><strong>Released:</strong> {{ movieReleased }}</div>
          <div><strong>Director:</strong> {{ movieDirector }}</div>
          <div><strong>Revenue:</strong> {{ movieRevenue }}</div>
          <div><strong>Status:</strong> {{ movieStatus }}</div>
          <div><strong>Production:</strong> {{ movieProduction }}</div>
          <div><strong>Runtime:</strong> {{ movieRuntime }}</div>
          <div><strong>Budget:</strong> {{ movieBudget }}</div>
          <div><strong>Genre:</strong> {{ movieGenre }}</div>
          <div><strong>Language:</strong> {{ movieLanguage }}</div>
          <div><strong>Content-Type:</strong> {{ contentType }}</div>
          <div><strong>Date:</strong> {{ responseDate }}</div>
          <div><strong>Server:</strong> {{ server }}</div>
        </div>

        <div class="social-icons">
          <!-- Icons for social media go here -->
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      movieTitle: '',
      movieImageUrl: '',
      movieStoryline: '',
      movieReleased: '',
      movieDirector: '',
      movieRevenue: '',
      movieStatus: '',
      movieProduction: '',
      movieRuntime: '',
      movieBudget: '',
      movieGenre: '',
      movieLanguage: '',
      contentType: '',
      responseDate: '',
      server: ''
    };
  },
  mounted() {
    this.fetchMovieDetails();
  },
  methods: {
    async fetchMovieDetails() {
      const imdbId = localStorage.getItem('imdbId');
      if (!imdbId) {
        console.error('No IMDb ID found in localStorage');
        return;
      }

      try {
        const response = await axios.get(`https://api.themoviedb.org/3/find/${imdbId}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US&external_source=imdb_id`);
        console.log('Full response:', response);
        const data = response.data;
        let details;

        // Update metadata headers
        this.contentType = response.headers['content-type'];
        this.responseDate = response.headers['date'];
        this.server = response.headers['server'];

        if (data.movie_results.length > 0) {
          details = data.movie_results[0];
          await this.fetchAdditionalDetails(details.id, 'movie');
        } else if (data.tv_results.length > 0) {
          details = data.tv_results[0];
          await this.fetchAdditionalDetails(details.id, 'tv');
        } else {
          console.error('Details not found for the given IMDb ID');
        }
      } catch (error) {
        console.error('Failed to fetch details:', error);
      }
    },

    async fetchAdditionalDetails(id, type) {
      const endpoint = type === 'movie' ? `movie/${id}` : `tv/${id}`;
      try {
        const response = await axios.get(`https://api.themoviedb.org/3/${endpoint}?api_key=a6a07bdb1ae12672ae2d301063d83c40&language=en-US`);
        console.log('Additional details response:', response);
        const details = response.data;
        this.updateDetails(details, type);
      } catch (error) {
        console.error('Failed to fetch additional details:', error);
      }
    },

    updateDetails(details, type) {
      this.movieTitle = details.title || details.name;
      this.movieImageUrl = `https://image.tmdb.org/t/p/original${details.poster_path}`;
      this.movieStoryline = details.overview;
      this.movieReleased = details.release_date || details.first_air_date;
      this.movieDirector = 'Director Name'; // You need a method or another API call to fetch this for TV series
      this.movieRevenue = details.revenue ? `$${details.revenue.toLocaleString()}` : 'N/A';
      this.movieStatus = details.status;
      this.movieProduction = details.production_companies.map(company => company.name).join(', ');
      this.movieRuntime = details.runtime ? `${details.runtime} min` : `${details.episode_run_time.join(', ')} min`;
      this.movieBudget = details.budget ? `$${details.budget.toLocaleString()}` : 'N/A';
      this.movieGenre = details.genres.map(genre => genre.name).join(', ');
      this.movieLanguage = details.original_language.toUpperCase();
    }
  }
};
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.container {
  background-color: black;
  color: white;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.nav-tab {
  animation: fadeIn 1s ease-in-out;
}

.movie-title {
  font-size: 30px;
  margin-bottom: 10px;
  animation: slideInRight 1s ease-in-out;
}

.headline {
  font-size: 22px;
  margin-bottom: 5px;
  animation: fadeIn 1.5s ease-in-out;
}

.movie-storyline {
  animation: fadeIn 2s ease-in-out;
}

.metadata div {
  margin-bottom: 5px;
  animation: fadeIn 2.5s ease-in-out;
}

.movie-poster {
  animation: slideInLeft 1s ease-in-out;
}

.social-icons {
  margin-top: 20px;
  animation: fadeIn 3s ease-in-out;
}
</style>
