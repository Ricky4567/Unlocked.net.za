<template>
  <div class="scroll-container" v-if="isAuthIdPresent">
    <v-row class="mt-3">
        <div class="white--text my-3 mx-8" style="font-size:17px">CONTINUE WATCHING</div>
      </v-row>
    <div class="scroll-controls">
      <v-icon large @click="scrollLeft" class="scroll-arrow left-arrow">mdi-chevron-left</v-icon>
      <v-row class="scroll-row" ref="scrollRow" no-gutters>
        <v-col
          v-for="media in continueWatching"
          :key="media.id"
          cols="6" sm="6" md="3"
        >
          <v-hover v-slot:default="{ hover }">
            <v-card
              @click="redirectToViewInfo(media)"
              class="d-flex flex-column overlay-container pa-4"
              :class="{ 'hover-scale': hover }"
              height="100%"
              style="background-color:transparent; cursor: pointer;"
            >
              <v-skeleton-loader
                v-if="isLoading"
                type="image"
                style="height:100%"
              ></v-skeleton-loader>
              <v-img
                v-else
                :src="getImageUrl(media.imageUrl)"
                height="100%"
                class="white--text align-end"
              >
                <template v-if="hover">
                  <div class="overlay-content">
                    <v-icon large color="white">mdi-play-circle-outline</v-icon>
                    <div class="text-h5 mt-2">{{ media.title }}</div>
                    <div class="text-subtitle-1">{{ media.runtime }}</div>
                    <div class="text-caption">{{ truncatedText(media.description) }}</div>
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
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { firebaseApp } from "../firebaseConfig";
import { VImg, VCard, VSkeletonLoader } from 'vuetify/lib';
import { debounce } from 'lodash';

const db = getFirestore(firebaseApp);

export default {
  components: {
    VImg,
    VCard,
    VSkeletonLoader
  },
  data() {
    return {
      continueWatching: [],
      isLoading: false,
      isAuthIdPresent: false,
    };
  },
  created() {
    const authId = localStorage.getItem("authId");
    this.isAuthIdPresent = !!authId;
    if (this.isAuthIdPresent) {
      this.fetchContinueWatching();
    }
  },
  methods: {
    async fetchContinueWatching() {
      const authId = localStorage.getItem("authId");
      if (!authId) {
        console.error("No authId found in localStorage");
        return;
      }

      this.isLoading = true;
      try {
        const continueWatchingRef = collection(db, "continue_watching");
        const q = query(continueWatchingRef, where("authId", "==", authId), orderBy("lastEdited", "desc"));
        const querySnapshot = await getDocs(q);

        const continueWatchingData = [];
        querySnapshot.forEach((docSnapshot) => {
          continueWatchingData.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });

        this.continueWatching = continueWatchingData;
      } catch (error) {
        console.error("Error fetching continue watching data:", error);
      } finally {
        this.isLoading = false;
      }
    },
    getImageUrl(path) {
      return path ? path : 'default_image.jpg';
    },
    async redirectToViewInfo(media) {
      this.isLoading = true;
      try {
        localStorage.setItem('imdbId', media.imdbId);
        this.$router.push(`/viewInfo`);
      } catch (error) {
        console.error("Error redirecting to view info:", error);
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
  visibility: hidden;
}
.scroll-controls:hover .scroll-arrow {
  visibility: visible;
}

/* Hide arrows on mobile devices */
@media (max-width: 600px) {
  .scroll-arrow {
    display: none;
  }
}
</style>
