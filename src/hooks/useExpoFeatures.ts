import { useEffect, useState } from 'react';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import * as Camera from 'expo-camera';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useExpoFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    location: false,
    notifications: false,
    mediaLibrary: false
  });

  useEffect(() => {
    setIsNative(Device.isDevice);
    
    if (Device.isDevice) {
      initializeExpoFeatures();
    }
  }, []);

  const initializeExpoFeatures = async () => {
    try {
      // Request permissions
      await requestPermissions();
      
      // Initialize push notifications
      await initializePushNotifications();
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
    if (!permissions.notifications) return;

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