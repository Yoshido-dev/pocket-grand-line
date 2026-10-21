import { defineConfig } from 'vite';

// Node's process (the project does not depend on @types/node)
declare const process: { env: Record<string, string | undefined> };

// Link previews (X, Discord, iMessage) need an absolute image URL, so the share image is only
// advertised when the build knows where it will live: SITE_URL=https://example.com/game/ npm run build
const site = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/?$/, '/') : '';
const shareTags = site
  ? [
      `<meta property="og:url" content="${site}" />`,
      `<meta property="og:image" content="${site}og-image.jpg" />`,
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      `<meta name="twitter:image" content="${site}og-image.jpg" />`,
    ].join('\n    ')
  : '';

// Static, relative-path build so dist/ can be dropped on any static host (GitHub Pages, Netlify, itch.io).
export default defineConfig({
  base: './',
  plugins: [{ name: 'share-image', transformIndexHtml: (html) => html.replace('<!--share-image-->', shareTags) }],
  build: {
    target: 'es2022',
    modulePreload: { polyfill: false },
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 900,
    reportCompressedSize: true,
  },
  server: { host: true, port: 5173 },
});
