import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.seeded.sermonnotes',
  appName: 'Seeded',
  webDir: 'dist',
  server: {
    // Serve app over synthetic https so IndexedDB and service workers work
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#0F2F24',
  },
}

export default config
