import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Mock implementations for web
const mockDevice = {
  isDevice: false,
};

const mockImagePicker = {
  requestMediaLibraryPermissionsAsync: async () => ({ status: 'denied' }),
  launchCameraAsync: async () => ({ canceled: true }),
  launchImageLibraryAsync: async () => ({ canceled: true }),
  MediaTypeOptions: { Images: 'Images' },
};

const mockLocation = {
  requestForegroundPermissionsAsync: async () => ({ status: 'denied' }),
  getCurrentPositionAsync: async () => {
    throw new Error('Location not available on web');
  },
};

const mockNotifications = {
  setNotificationHandler: () => {},
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  getExpoPushTokenAsync: async () => {
    throw new Error('Push notifications not available on web');
  },
  scheduleNotificationAsync: async () => {
    console.log('Notification would be shown on native device');
  },
};

const mockHaptics = {
  impactAsync: async () => {
    console.log('Haptic feedback would occur on native device');
  },
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
};

const mockCamera = {
  requestCameraPermissionsAsync: async () => ({ status: 'denied' }),
};

const mockStatusBar = {};

// Dynamic imports for native platforms
let Device: any;
let ImagePicker: any;
let Location: any;
let Notifications: any;
let Haptics: any;
let Camera: any;
let StatusBar: any;

if (Platform.OS === 'web') {
  Device = mockDevice;
  ImagePicker = mockImagePicker;
  Location = mockLocation;
  Notifications = mockNotifications;
  Haptics = mockHaptics;
  Camera = mockCamera;
  StatusBar = mockStatusBar;
} else {
  // These will only be imported on native platforms
  Device = require('expo-device');
  ImagePicker = require('expo-image-picker');
  Location = require('expo-location');
  Notifications = require('expo-notifications');
  Haptics = require('expo-haptics');
  Camera = require('expo-camera');
  StatusBar = require('expo-status-bar');
}

// Configure notifications only on native platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export const useExpoFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    location: false,
    notifications: false,
    mediaLibrary: false
  });

  useEffect(() => {
    setIsNative(Platform.OS !== 'web' && Device.isDevice);
    
    if (Platform.OS !== 'web' && Device.isDevice) {
      initializeExpoFeatures();
    }
  }, []);

  const initializeExpoFeatures = async () => {
    try {
      // Request permissions
      await requestPermissions();
      
      // Initialize push notifications only on native
      if (Platform.OS !== 'web') {
        await initializePushNotifications();
      }
    } catch (error) {
      console.error('Error initializing Expo features:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      
      // Request media library permission
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      // Request location permission
      const locationPermission = await Location.requestForegroundPermissionsAsync();
      
      // Request notification permission
      const notificationPermission = await Notifications.requestPermissionsAsync();

      setPermissions({
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted',
        location: locationPermission.status === 'granted',
        notifications: notificationPermission.status === 'granted'
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const initializePushNotifications = async () => {
    if (!permissions.notifications || Platform.OS === 'web') return;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id' // You'll get this from Expo
      });
      
      console.log('Expo push token:', token.data);
      // Send token to your backend for push notifications
      
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const takePicture = async () => {
    if (Platform.OS === 'web') {
      console.log('Camera not available on web');
      return null;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }
      return null;
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      console.log('Image picker not available on web');
      return [];
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 6
      });

      if (!result.canceled) {
        return result.assets.map(asset => asset.uri);
      }
      return [];
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      console.log('Location not available on web');
      throw new Error('Location not available on web');
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  const showLocalNotification = async (title: string, body: string) => {
    if (Platform.OS === 'web') {
      console.log(`Notification would show: ${title} - ${body}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (Platform.OS === 'web') {
      console.log(`Haptic feedback would occur: ${style}`);
      return;
    }

    try {
      switch (style) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error with haptic feedback:', error);
    }
  };

  return {
    isNative,
    permissions,
    takePicture,
    pickImage,
    getCurrentLocation,
    showLocalNotification,
    hapticFeedback,
    requestPermissions
  };
};