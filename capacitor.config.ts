import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.attendx.app',
    appName: 'AttendX',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        SplashScreen: {
            launchAutoHide: true,
            backgroundColor: '#0f0f12',
            showSpinner: false,
        },
    },
};

export default config;
