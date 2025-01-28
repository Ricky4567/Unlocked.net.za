const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: [
    'vuetify'
  ],
  pwa: {
    name: "Unlocked",
    short_name: "Unlocked",
    start_url: "./",
    display: "fullscreen",
    themeColor: "#23ffe5",
    msTileColor: "#23ffe5",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black-translucent",

  }
});
