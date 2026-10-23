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
  // Keep shader modules available to the build transform instead of the prebundled Three.js copy.
  resolve: { alias: [{ find: /^three$/, replacement: 'three/src/Three.js' }] },
  plugins: [
    { name: 'share-image', transformIndexHtml: (html) => html.replace('<!--share-image-->', shareTags) },
    {
      name: 'compact-shader-source',
      apply: 'build',
      enforce: 'pre',
      transform(code, id) {
        if (!/\/three\/src\/renderers\/shaders\/.+\.glsl\.js$/.test(id.replace(/\\/g, '/'))) return;
        const first = code.indexOf('`');
        const last = code.lastIndexOf('`');
        if (first < 0 || last <= first) return;
        // JS minifiers leave GLSL strings untouched. Keep directive line breaks and exact include/main
        // markers used by shader hooks, while removing ordinary comments and indentation.
        const shader = code.slice(first + 1, last)
          .replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, (comment) => /@license|@preserve|copyright|SPDX/i.test(comment) ? comment : ' ')
          .split('\n').map((line) => line.trim()).filter(Boolean).join('\n');
        return { code: code.slice(0, first + 1) + '\n' + shader + '\n' + code.slice(last), map: null };
      },
    },
  ],
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
