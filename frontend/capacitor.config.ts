import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.harshal.askdocs',
  appName: 'AskDocs',
  webDir: 'out',
  server: {
    url: 'https://iard-92.vercel.app',
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0d0c17',
    },
  },
};

export default config;
