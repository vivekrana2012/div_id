# Divid Mobile

React Native (Expo) app for iOS and Android.

## Setup

```bash
cd mobile
npm install
```

## Run

```bash
# Start Expo dev server
npx expo start

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

## Configuration

Set the API URL in `app.json` → `expo.extra.apiUrl`:
- Development: `http://localhost:8080/api` (iOS simulator) or `http://10.0.2.2:8080/api` (Android emulator)
- Production: `https://your-domain.com/api`

## Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```
