// import adapter from '@sveltejs/adapter-static'
import adapter from 'sveltekit-adapter-chrome-extension'
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    // IMPORTANT: change the appDir. default is _app, which is not compatible with the browser extension
    // Cannot load extension with file or directory name _app. Filenames starting with "_" are reserved for use by the system."
    appDir: 'app',
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: null,
      precompress: false,
      manifest: 'manifest.json'
    }),
    csp: {
      mode: 'hash',
      directives: {
        'style-src': ['self'],
        'script-src': ['self'],
      },
    },
  }
}

export default config
