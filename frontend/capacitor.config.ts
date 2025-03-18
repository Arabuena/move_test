import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.levaapp.app',
  appName: 'Leva App',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    buildOptions: {
      minSdkVersion: 22,
      targetSdkVersion: 32,
      compileSdkVersion: 32,
      javaVersion: '11'
    }
  }
};

export default config; 