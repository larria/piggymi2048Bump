import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/piggymi2048Bump/' : '/',
  server: { host: '0.0.0.0', port: 5188 },
  preview: { host: '0.0.0.0', port: 4188 },
  plugins: [VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.js',
    registerType: 'prompt',
    injectRegister: false,
    manifest: {
      id: './',
      name: '咪猪头的2048碰碰大挑战',
      short_name: '咪猪头碰碰2048',
      description: '和咪猪头一起碰出惊喜！十二关物理合并挑战，安装后也能离线玩。',
      lang: 'zh-CN',
      start_url: './',
      scope: './',
      display: 'standalone',
      display_override: ['standalone', 'minimal-ui'],
      theme_color: '#f7f8f2',
      background_color: '#f7f8f2',
      categories: ['games', 'entertainment'],
      icons: [
        { src: 'icons/pig-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icons/pig-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icons/pig-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    injectManifest: {
      globPatterns: ['**/*.{js,css,html,svg,png,mp3,webmanifest}'],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
    },
  })],
}));
