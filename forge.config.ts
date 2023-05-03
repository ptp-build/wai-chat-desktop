import { ResolvedForgeConfig } from '@electron-forge/shared-types/src';
const myCustomPlugin = {
  name: '@electron-forge/publisher-github',
  init: (dir: string, forgeConfig: ResolvedForgeConfig) => {
    // Plugin initialization logic here
  },
  config: {
    repository: {
      owner: 'ptp-build',
      name: 'wai-chat-bot-electron-chatgpt',
      draft: true,
    },
  },
};

module.exports = {
  packagerConfig: {},
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
  plugins: [
    myCustomPlugin,
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.ts',
              name: 'main_window',
              preload: {
                js: './src/preload.ts',
              },
            },
          ],
        },
      },
    },
  ],
};
