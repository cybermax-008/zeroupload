import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zeroupload.app',
  appName: 'ZeroUpload',
  webDir: 'dist',
  
  server: {
    // Enable SharedArrayBuffer in WebView for wasm-vips
    androidScheme: 'https',
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
      backgroundColor: '#0a0a0b',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0b',
    },
  },

  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    scheme: 'ZeroUpload',
    // Enable SharedArrayBuffer (required for wasm-vips)
    // Add to Info.plist: set COOP/COEP headers via WKWebView config
  },

  // Android-specific configuration  
  android: {
    // minSdkVersion 24+ is needed for SharedArrayBuffer
    // WebView headers are set programmatically — see android/README.md
  },
};

export default config;
