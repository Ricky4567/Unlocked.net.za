<template>
  <div class="bg-gray-500">
    <v-app-bar elevation="0" v-show="!isMobile" color="#1b1919" height="170px">
      <v-img src="../assets/logo1.png" alt="Logo" contain class="image mx-auto mb-4"></v-img>
    </v-app-bar>

    <!-- Logo in the center -->
    <v-row justify="center" align="center" style="margin-top:6%;margin-left:4%" class="logo-container">
      <v-btn
        width="150px"
 
        :class="{ active: activeStream === 'channels' }"
        color="#23ffe5"
        @click="setStream('channels')"
        class="toggle-btn"
      >
        Channels
      </v-btn>
      <v-btn
        width="150px"
        dark
        :class="{ active: activeStream === 'sports' }"
        color="transparent"
        @click="setStream('sports')"
        class="toggle-btn"
      >
        Live Sport
      </v-btn>
    </v-row>

    <!-- Iframe container -->
    <div class="iframe-container my-10">
      <div class="iframe-cropper my-12">
        <iframe :src="iframeSrc" allowfullscreen></iframe>
      </div>
    </div>

    <!-- Dialog for Ad Blocker Instructions -->
    <!-- ... your dialog code remains unchanged ... -->
  </div>
</template>
<script>
export default {
  data() {
    return {
      activeStream: "channels", // Tracks the current active stream
      iframeSrc: "https://rivestream.live/iptv", // Default iframe URL
      adBlockerDialog: false,
    };
  },
  methods: {
    setStream(stream) {
      this.activeStream = stream;
      this.iframeSrc =
        stream === "channels"
          ? "https://rivestream.live/iptv"
          : "https://rivestream.live/livesports";
    },
    checkAdBlocker() {
      if (!localStorage.getItem("adBlockerDialogShown")) {
        const adUrl = "https://example.com/ad.js";
        const testAd = document.createElement("img");
        testAd.src = adUrl;
        testAd.style.display = "none";
        testAd.onerror = () => {
          this.adBlockerDialog = true;
          testAd.remove(); // Cleanup after detection
        };
        testAd.onload = () => testAd.remove(); // Cleanup if no ad blocker
        document.body.appendChild(testAd);
      }
      localStorage.setItem("adBlockerDialogShown", "true");
    },
    onAdBlockerDialogClose() {
      this.adBlockerDialog = false;
    },
  },
  mounted() {
    this.checkAdBlocker();
  },
};
</script>
<style scoped>
.bg-gray-500 {
  background-color: #1b1919; /* Tailwind CSS gray-500 */
  width: 100%;
  height: 100vh;
}

.logo-container {
  position: fixed;
  top: 7%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.toggle-btn {
  margin: 0 10px;
  font-weight: bold;
  border: 2px solid #23ffe5;
  border-radius: 8px;
  transition: background-color 0.3s, color 0.3s;
}

.toggle-btn.active {
  background-color: #23ffe5;
  color: white;
}

.iframe-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
}

.iframe-cropper {
  position: absolute;
  top: 12%; /* Adjust as needed */
  left: 13%; /* Adjust as needed */
  width: 85%; /* Width of the cropped area */
  height: 90%; /* Height of the cropped area */
  overflow: hidden; /* Crop overflowing content */
}

.iframe-cropper iframe {
  position: absolute;
  top: -70px; /* Offset to align content within the cropped area */
  left: -64px; /* Offset to align content within the cropped area */
  width: 100%; /* Ensure the iframe covers the cropped area */
  height: 120%; /* Ensure the iframe covers the cropped area */
  border: none;
}

.image {
  margin-top: 70px;
  height: 210px;
}

.ad-dialog {
  overflow-x: hidden;
  overflow-y: auto;
}

.ad-card {
  border-radius: 20px;
  background-color: black;
  text-align: center;
  overflow-x: hidden;
  overflow-y: auto;
}

.text-left {
  text-align: left;
}

@media (max-width: 768px) {
  .iframe-container {
    left: 0;
    width: 100%;
  }
  .iframe-cropper {
    top: 12%; /* Adjust as needed */
    left: 13%; /* Adjust as needed */
    width: 85%; /* Width of the cropped area */
    height: 90%; /* Height of the cropped area */
    overflow: hidden; /* Crop overflowing content */
  }
  .iframe-cropper iframe {
    top: -55px; /* Offset to align content within the cropped area */
    left: -10px; /* Offset to align content within the cropped area */
    width: 100%; /* Ensure the iframe covers the cropped area */
    height: 120%; /* Ensure the iframe covers the cropped area */
    border: none;
  }
}
</style>
