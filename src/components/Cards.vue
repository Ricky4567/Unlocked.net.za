<template>
  <div class="pa-10">
    <v-row>
      <v-col
        v-for="(item, index) in items"
        :key="index"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          class="glass-card"
          :style="{ '--background': `url(${item.background})` }"
          @click="redirectToPath(item.path)"
        >
          <v-img
            :src="item.logo"
            class="logo"
            contain
            height="120px"
            alt="Logo"
          ></v-img>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'GlassCard',
  data() {
    return {
      items: [
        {
          logo: 'https://th.bing.com/th/id/R.015bb7b76fab1611efa1572f900dfc91?rik=tbXML%2fVqf5vUFw&pid=ImgRaw&r=0',
          background: 'https://img.goodfon.com/wallpaper/nbig/1/61/fon-netflix-logo-raduga-tsvet-fon-background-skachat-oboi-sk.webp',
          path: '/netflix'
        },
        {
          logo: 'https://logonoid.com/images/disney-logo.png',
          background: 'https://wallpapers.com/images/featured/disney-has6vy47k75d0bzs.jpg',
          path: '/disney'
        },
        {
          logo: 'https://download.logo.wine/logo/Hulu/Hulu-Logo.wine.png',
          background: 'https://1000logos.net/wp-content/uploads/2020/12/Hulu-Font.jpg',
          path: '/hulu'
        },
        {
          logo: 'https://www.logo.wine/a/logo/Amazon_Prime/Amazon_Prime-Logo.wine.svg',
          background: 'https://store-images.s-microsoft.com/image/apps.24594.13510798887500496.393115ce-aadd-41b0-a06b-6de8b907aa10.b4898b91-921e-43ef-aedc-8a0e423c95d5?mode=scale&q=90&h=720&w=1280',
          path: '/amazon-prime'
        },
      ]
    };
  },
  methods: {
    redirectToPath(path) {
      this.$router.push(path);
    }
  }
};
</script>

<style scoped>
.glass-card {
  border-radius: 20px;
  padding: 20px;
  width: 100%;
  height: 230px;
  backdrop-filter: blur(10px);
  background: linear-gradient(to right, rgba(0, 0, 1, 0.9), rgba(0, 0, 0, 0.1));
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, background 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.logo {
  max-height: 100%;
  max-width: 100%;
  transition: transform 0.3s ease;
}

.glass-card:hover {
  background: linear-gradient(to right, rgba(0, 0, 1, 0.9), rgba(0, 0, 0, 0.1)), var(--background) no-repeat center center;
  background-size: cover;
  animation: moveBackground 10s infinite linear;
}

.glass-card:hover .logo {
  transform: scale(1.2);
}

@keyframes moveBackground {
  0% { background-position: center; }
  50% { background-position: right; }
  100% { background-position: center; }
}
</style>
