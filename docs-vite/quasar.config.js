/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js
import Vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-md'
import markdownConfig from './build/markdown.js'
import Components from 'unplugin-vue-components/vite'
import { configure } from 'quasar/wrappers';

export default configure(function (ctx) {
  return {
    // https://quasar.dev/quasar-cli/supporting-ts
    supportTS: false,

    // TODO remove?
    // eslint: {
    //   // fix: true,
    //   // include: [],
    //   // exclude: [],
    //   // rawOptions: {},
    //   warnings: true,
    //   errors: true
    // },

    // https://v2.quasar.dev/quasar-cli-vite/prefetch-feature
    // preFetch: true,

    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: [
      'register.js'
    ],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#css
    css: [
      'app.sass'
    ],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: [
      // 'ionicons-v4',
      // 'mdi-v6',
      'fontawesome-v5',
      // 'eva-icons',
      // 'themify',
      // 'line-awesome',
      // 'roboto-font-latin-ext', // this or either 'roboto-font', NEVER both!

      'roboto-font', // optional, you are not bound to it
      'material-icons', // optional, you are not bound to it
    ],

    // Full list of options: https://quasar.dev/quasar-cli/quasar-conf-js#build
    build: {
      vueRouterMode: 'history', // available values: 'hash', 'history'

      // TODO remove?
      // target: {
      //   browser: [ 'es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1' ],
      //   node: 'node16'
      // },

      // vueRouterBase,
      // vueDevtools,
      // vueOptionsAPI: false,
      transpile: true,

      // Add dependencies for transpiling with Babel (Array of string/regex)
      // (from node_modules, which are by default not transpiled).
      // Applies only if "transpile" is set to true.
      transpileDependencies: [
        /quasar-ui-json-api-viewer[\\/]src/,
        /quasar-ui-example-viewer[\\/]src/
      ],

      // rebuildCache: true, // rebuilds Vite/linter/etc cache on startup

      // publicPath: '/',
      // analyze: true,
      // env: {},
      // rawDefine: {}
      // ignorePublicFolder: true,
      // minify: false,
      // polyfillModulePreload: true,
      // distDir

      extendViteConf (viteConf) {
        // console.log(`viteConf before`, JSON.stringify(viteConf.plugins, null, 2))
        viteConf.plugins.filter(plugin => plugin.name === 'vite:vue').forEach(plugin => {
          // console.log(`plugin vite:vue`, JSON.stringify(plugin, null, 2))
          plugin.options = () => ({
            include: [/\.vue$/, /\.md$/],
          })
          // console.log(`plugin typeof vite:vue after`, JSON.stringify(typeof plugin, null, 2))
          // console.log(`plugin.options vite:vue after`, JSON.stringify(plugin.options, null, 2))
        })

        // viteConf.splice(1, 1, {
        //   name: 'vite:vue',
        //   options: () => ({
        //     include: [/\.vue$/, /\.md$/],
        //   })
        // })
        viteConf.plugins.splice(1, 1, Vue({
          include: [/\.vue$/, /\.md$/], // <--
        }))

        viteConf.plugins.push(Markdown({
          markdownItOptions: {
            ...markdownConfig.config
            // html: true,
            // linkify: true,
            // typographer: true,
          },
          markdownItSetup(md) {
            markdownConfig.usePlugins(md)
            // add anchor links to your H[x] tags
            // md.use(import('markdown-it-anchor'))
            // add code syntax highlighting with Prism
            // md.use(import('markdown-it-prism'))
            // markdownConfig.wrapRender(md)
          },
        }))
        viteConf.plugins.push(Components({
          // https://github.com/unplugin/unplugin-vue-components#configuration
          // extensions: ['vue'],
          // extensions: ['vue', 'md'],
          // dirs: ['src/components/page-parts'],
          // deep: true,
          // resolvers: [
          //   // example of importing Vant
          //   (componentName) => {
          //     console.log(`componentName`, componentName)
          //     return { name: componentName.slice(3), from: 'vant' }
          //   },
          // ],
          importPathTransform: v => {
            // console.log('importPathTransform', v)
            return v
          },
        }))
        console.log(`viteConf after`, JSON.stringify(viteConf.plugins, null, 2))
      },
      // viteVuePluginOptions: {},


      vitePlugins: [
        // [ 'package-name', { ..options.. } ]
        // ['@vitejs/plugin-vue', {
        //   include: [/\.vue$/, /\.md$/],
        // }],
        ['vite-plugin-md'],
        // Vue({
        //   include: [/\.vue$/, /\.md$/], // <--
        // }),
        // Markdown(),
      ]

      // TODO is this required with Vite?
      // Options below are automatically set depending on the env, set them if you want to override
      // extractCSS: false,

    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#devServer
    devServer: {
      open: !true, // opens browser window automatically
      https: false,
      port: 8090,
      // next line for testing watchOptions issue
      // watchOptions: {
      //   ignored: [
      //     /node_modules([\\]+|\/)+(?!my-package-name)/
      //   ]
      // }
    },

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#framework
    framework: {
      config: {
        dark: 'auto',
        loadingBar: {
          color: 'red',
          position: 'top'
        }
      },

      // iconSet: 'material-icons', // Quasar icon set
      // lang: 'en-US', // Quasar language pack

      // For special cases outside of where the auto-import strategy can have an impact
      // (like functional components as one of the examples),
      // you can manually specify Quasar components/directives to be available everywhere:
      //
      // components: [],
      // directives: [],

      // Quasar plugins
      plugins: [
        'Dark',
        'Dialog',
        'LoadingBar',
        'LocalStorage',
        'Meta',
        'Notify',
        'Platform',
        'Screen'
      ]
    },

    // animations: 'all', // --- includes all animations
    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-js#property-sourcefiles
    // sourceFiles: {
    //   rootComponent: 'src/App.vue',
    //   router: 'src/router/index',
    //   store: 'src/store/index',
    //   registerServiceWorker: 'src-pwa/register-service-worker',
    //   serviceWorker: 'src-pwa/custom-service-worker',
    //   pwaManifestFile: 'src-pwa/manifest.json',
    //   electronMain: 'src-electron/electron-main',
    //   electronPreload: 'src-electron/electron-preload'
    // },

    // https://v2.quasar.dev/quasar-cli-vite/developing-ssr/configuring-ssr
    ssr: {
      // ssrPwaHtmlFilename: 'offline.html', // do NOT use index.html as name!
                                          // will mess up SSR

      // extendSSRWebserverConf (esbuildConf) {},
      // extendPackageJson (json) {},

      pwa: false,

      // manualStoreHydration: true,
      // manualPostHydrationTrigger: true,

      prodPort: 3000, // The default port that the production server should use
                      // (gets superseded if process.env.PORT is specified at runtime)

      middlewares: [
        ctx.prod ? 'compression' : '',
        'render' // keep this as last one
      ]
    },

    // https://v2.quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa
    pwa: {
      workboxMode: 'generateSW', // or 'injectManifest'
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
      // useFilenameHashes: true,
      // extendGenerateSWOptions (cfg) {}
      // extendInjectManifestOptions (cfg) {},
      // extendManifestJson (json) {}
      // extendPWACustomSWConf (esbuildConf) {}
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-cordova-apps/configuring-cordova
    cordova: {
      // noIosLegacyBuildFlag: true, // uncomment only if you know what you are doing
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-capacitor-apps/configuring-capacitor
    capacitor: {
      hideSplashscreen: true
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      // extendElectronMainConf (esbuildConf)
      // extendElectronPreloadConf (esbuildConf)

      // specify the debugging port to use for the Electron app when running in development mode
      inspectPort: 5858,

      bundler: 'packager', // 'packager' or 'builder'

      packager: {
        // https://github.com/electron-userland/electron-packager/blob/master/docs/api.md#options

        // OS X / Mac App Store
        // appBundleId: '',
        // appCategoryType: '',
        // osxSign: '',
        // protocol: 'myapp://path',

        // Windows only
        // win32metadata: { ... }
      },

      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration: true,

      builder: {
        // https://www.electron.build/configuration/configuration

        appId: 'dev1'
      }
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-browser-extensions/configuring-bex
    bex: {
      contentScripts: [
        'my-content-script'
      ],

      // extendBexScriptsConf (esbuildConf) {}
      // extendBexManifestJson (json) {}
    }
  }
})
