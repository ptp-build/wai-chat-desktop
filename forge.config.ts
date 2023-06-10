module.exports = {
  packagerConfig: {
    icon: 'src/icons/favicon',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ptp-build',
          name: 'wai-chat-bot-electron-chatgpt',
          draft: true,
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/assets/index.html',
              js: './src/js/renderer.ts',
              name: 'main_window',
              preload: {
                js: './src/js/preload.ts',
              },
            },
          ],
        },
      },
    },
  ],
};
