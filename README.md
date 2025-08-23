Mallumatrimony

## Expo Mobile App Development

This project now supports Expo for easier mobile app development and deployment.

### Expo Development Setup

1. **Start Expo development server**:
   ```bash
   npm run expo:start
   ```

2. **Run on device/simulator**:
   ```bash
   # Android
   npm run expo:android
   
   # iOS (macOS only)
   npm run expo:ios
   ```

3. **Build for production**:
   ```bash
   # Install EAS CLI globally
   npm install -g @expo/eas-cli
   
   # Login to Expo
   eas login
   
   # Configure your project
   eas build:configure
   
   # Build for Android
   npm run expo:build:android
   
   # Build for iOS
   npm run expo:build:ios
   ```

4. **Submit to app stores**:
   ```bash
   # Submit to Google Play Store
   npm run expo:submit:android
   
   # Submit to Apple App Store
   npm run expo:submit:ios
   ```

### Expo Features

- **Easy Deployment**: Build and deploy with simple commands
- **Over-the-Air Updates**: Update your app without app store approval
- **Push Notifications**: Built-in push notification service
- **App Store Submission**: Automated submission to app stores
- **Device Testing**: Test on real devices with Expo Go app

### Getting Started with Expo

1. **Install Expo CLI**:
   ```bash
   npm install -g @expo/eas-cli expo-cli
   ```

2. **Create Expo account**: Sign up at https://expo.dev

3. **Login to Expo**:
   ```bash
   eas login
   ```

4. **Configure your project**:
   ```bash
   eas build:configure
   ```

5. **Start development**:
   ```bash
   npm run expo:start
   ```

### Testing Your Mobile App

1. **Install Expo Go** on your phone from:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan QR code** from the Expo development server

3. **Test on device** in real-time with hot reloading

## Mobile App Development

This project includes mobile app capabilities using Capacitor. You can build native iOS and Android apps from the same codebase.

### Mobile Development Setup

1. **Initialize Capacitor** (one-time setup):
   ```bash
   npm run mobile:init
   ```

2. **Add mobile platforms**:
   ```bash
   # For Android
   npm run mobile:add:android
   
   # For iOS (macOS only)
   npm run mobile:add:ios
   ```

3. **Build and sync**:
   ```bash
   npm run mobile:build
   ```

4. **Run on device/simulator**:
   ```bash
   # Android
   npm run mobile:run:android
   
   # iOS (macOS only)
   npm run mobile:run:ios
   ```

5. **Open in native IDEs**:
   ```bash
   # Android Studio
   npm run mobile:open:android
   
   # Xcode (macOS only)
   npm run mobile:open:ios
   ```

### Mobile Features

- **Native Camera Integration**: Take photos directly from the app
- **Push Notifications**: Real-time match and message notifications
- **Haptic Feedback**: Enhanced user experience with vibrations
- **Geolocation**: Location-based matching (with permission)
- **Offline Support**: Basic functionality works offline
- **Native Navigation**: Platform-specific navigation patterns

### Mobile-Specific Components

- `MobileSwipeCard`: Touch-optimized swipe interface
- `MobilePhotoUpload`: Camera integration for profile photos
- `MobileNavigation`: Bottom tab navigation
- `MobileHeader`: Mobile-optimized header component
- `MobileProfileCard`: Touch-friendly profile cards

### Prerequisites for Mobile Development

**For Android:**
- Android Studio
- Android SDK
- Java Development Kit (JDK) 11 or higher

**For iOS:**
- macOS
- Xcode 12 or higher
- iOS Simulator or physical iOS device

### Mobile App Configuration

The mobile app configuration is in `capacitor.config.ts`. Key settings include:

- **App ID**: `com.mallumatrimony.app`
- **App Name**: `Mallu Matrimony`
- **Splash Screen**: Custom Kerala-themed splash screen
- **Status Bar**: Branded colors
- **Push Notifications**: Configured for match and message alerts

### Testing on Mobile

1. **Web Testing**: The app is responsive and works on mobile browsers
2. **Device Testing**: Use `npm run mobile:run:android` or `npm run mobile:run:ios`
3. **Browser DevTools**: Use mobile device simulation in Chrome DevTools

### Mobile-Specific Features

- **Touch Gestures**: Swipe to like/pass profiles
- **Camera Access**: Take photos for profile directly from camera
- **Push Notifications**: Get notified of new matches and messages
- **Haptic Feedback**: Vibration feedback for actions
- **Native Navigation**: Bottom tab bar for easy thumb navigation
- **Offline Mode**: Basic functionality available without internet
