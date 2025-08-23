Mallumatrimony

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
