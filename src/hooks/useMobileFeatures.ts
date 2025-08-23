import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';

export const useMobileFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    location: false,
    notifications: false
  });

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    
    if (Capacitor.isNativePlatform()) {
      initializeMobileFeatures();
    }
  }, []);

  const initializeMobileFeatures = async () => {
    try {
      // Set status bar style
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0F5132' });

      // Request permissions
      await requestPermissions();
      
      // Initialize push notifications
      await initializePushNotifications();
    } catch (error) {
      console.error('Error initializing mobile features:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request camera permission
      const cameraPermission = await Camera.requestPermissions();
      
      // Request location permission
      const locationPermission = await Geolocation.requestPermissions();
      
      // Request notification permission
      const notificationPermission = await PushNotifications.requestPermissions();

      setPermissions({
        camera: cameraPermission.camera === 'granted',
        location: locationPermission.location === 'granted',
        notifications: notificationPermission.receive === 'granted'
      });
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const initializePushNotifications = async () => {
    if (!permissions.notifications) return;

    try {
      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        // Send token to your backend
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
        // Handle received notification
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        // Handle notification tap
      });
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt, // Allows user to choose camera or gallery
      });

      return image.dataUrl;
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  };

  const showLocalNotification = async (title: string, body: string) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    try {
      const impactStyle = style === 'light' ? ImpactStyle.Light : 
                         style === 'heavy' ? ImpactStyle.Heavy : ImpactStyle.Medium;
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      console.error('Error with haptic feedback:', error);
    }
  };

  return {
    isNative,
    permissions,
    takePicture,
    getCurrentLocation,
    showLocalNotification,
    hapticFeedback,
    requestPermissions
  };
};