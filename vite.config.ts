import * as fs from 'node:fs/promises'
import * as fsSync from 'node:fs'
import * as path from 'node:path'
import { sveltekit } from '@sveltejs/kit/vite'
import { build, defineConfig, type Plugin, type UserConfig, type ResolvedConfig } from 'vite'

// these files will be processed independently
const EXTENSION_SCRIPTS = [
  'src/scripts/worker.ts',
  'src/scripts/inject.ts',
]

type ExtensionManifestPluginOptions = {
  manifest?: string
}
function extensionManifestPlugin(options?: ExtensionManifestPluginOptions): Plugin {
  const opts = {
    manifest: 'src/manifest.json',
    ...options
  }
  let config: ResolvedConfig
  return {
    name: 'extension-manifest',
    enforce: 'post',
    configResolved: (c) => {
      config = c
    },
    closeBundle: async () => {
      // we want to run _after_ SvelteKit's adapter runs successfully
      // SvelteKit writes to .svelte-kit on `writeBundle`, and the adapter runs on `closeBundle`
      // we enforce this plugin on `post` to run after SvelteKit
      // https://github.com/sveltejs/kit/blob/master/packages/kit/src/exports/vite/index.js#L471
      if (config.build.ssr || config.mode !== 'production') {
        // checking `config.mode` is production may not be the best approach, but we do not want to execute this build in `test` mode (from Vitest)
        return
      }

      const outDir = path.join(config.root, 'build')
      const manifestFilePath = path.join(config.root, opts.manifest)
      // read and parse manifest file
      // TODO: add more checks for manifest file existence and validity
      const manifest = JSON.parse(await fs.readFile(manifestFilePath, 'utf-8'))
      // remove the $schema if it exists, chrome does not like it
      if (manifest['$schema']) {
        delete manifest['$schema']
      }
      // write the manifest to the build directory
      await fs.writeFile(
        path.join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf-8'
      )
    }
  }
}

function extensionScriptPlugin(pathname: string): Plugin {
  let config: ResolvedConfig
  const shortName: string = pathname.replace(/^.*\/([^\/]+)\.\w{2,3}$/, '$1')

  return {
    name: 'extension-script',
    enforce: 'post',
    configResolved(c) {
      config = c
    },
    closeBundle: async () => {
      if (config.build.ssr || config.mode !== 'production') return

      const outDir = path.join(config.root, 'build')
      const script: UserConfig = {
        root: config.root,
        define: {
          ...(config.define || {})
        },
        resolve: {
          alias: [...config.resolve.alias]
        },
        build: {
          outDir,
          emptyOutDir: false, // we don't want to overwrite SvelteKit's output
          ssr: true,
          rollupOptions: {
            input: {
              [`scripts/${shortName}`]: path.join(config.root, pathname)
            },
            external: [],
          }
        }
      }

      try {
        await build(script)
      } catch (error) {
        throw new Error(`There was an error building the worker: ${error.message}`)
      }
    }
  }
}

export default defineConfig({
  plugins: [
    sveltekit(),
    extensionManifestPlugin(),
    ...EXTENSION_SCRIPTS.map(file => extensionScriptPlugin(file))
  ]
})
