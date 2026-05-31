import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "shadcn-nuxt",
    "@pinia/nuxt",
  ],

  css: ["~/assets/css/tailwind.css"],
  vite: {
    plugins: [tailwindcss()],
  },

  // Public Firebase Web config (safe to expose). Used client-side for the
  // anonymous-auth + Firestore realtime listener that powers the live feed.
  runtimeConfig: {
    public: {
      firebase: {
        apiKey: "AIzaSyAiJWlXc-UPHy7pyXe4u-ZYWP-LGEsgVsQ",
        authDomain: "pathetichooks.firebaseapp.com",
        projectId: "pathetichooks",
        storageBucket: "pathetichooks.firebasestorage.app",
        messagingSenderId: "204853100433",
        appId: "1:204853100433:web:a7338003e1a6e6b183a430",
      },
    },
  },

  fonts: {
    families: [
      { name: "Inter", provider: "google", weights: [400, 500, 600, 700] },
      { name: "JetBrains Mono", provider: "google", weights: [400, 500, 600] },
    ],
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./app/components/ui"
     */
    componentDir: './app/components/ui'
  },

  nitro: {
    preset: "firebase",
    firebase: {
      gen: 2,
      nodeVersion: "22",
      httpsOptions: {
        region: "us-central1",
        // gen2 instances serve many concurrent requests, so a small instance
        // cap still multiplexes the live SSE streams (each capped at ~50s).
        maxInstances: 5,
        memory: "512MiB",
      },
    },
    // Baseline security headers on every response the function serves. These are
    // safe for SSR/SPA hydration (no script/style CSP that would break inline
    // hydration); the owner-controlled /hook responses set their own stricter
    // sandbox CSP in the route handler.
    routeRules: {
      "/**": {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "X-DNS-Prefetch-Control": "off",
          "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
        },
      },
    },
  },

});