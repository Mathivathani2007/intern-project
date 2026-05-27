/**
 * Task 70: Implement geolocation services
 * Real-time geolocation utilities for tracking and location-based features
 */

export class GeolocationService {
  constructor() {
    this.watchId = null;
    this.currentLocation = null;
  }

  /**
   * Get current user location (one-time)
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          resolve(this.currentLocation);
        },
        (error) => reject(error)
      );
    });
  }

  /**
   * Watch location changes in real-time
   */
  watchLocation(onLocationChange, options = {}) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date().toISOString()
        };
        this.currentLocation = location;
        onLocationChange(location);
      },
      (error) => console.error('Geolocation error:', error),
      defaultOptions
    );

    return this.watchId;
  }

  /**
   * Stop watching location
   */
  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if location is within radius
   */
  static isWithinRadius(userLat, userLon, targetLat, targetLon, radiusKm) {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusKm;
  }
}

/**
 * Task 69: Build real-time tracking app utilities
 */
export class TrackingService {
  constructor(userId, database) {
    this.userId = userId;
    this.database = database;
    this.trackingData = [];
  }

  /**
   * Start tracking user location
   */
  async startTracking(updateInterval = 5000) {
    const { ref, set } = await import('firebase/database');
    const geolocation = new GeolocationService();

    geolocation.watchLocation(async (location) => {
      try {
        const trackingRef = ref(this.database, `tracking/${this.userId}/current`);
        await set(trackingRef, {
          ...location,
          updatedAt: new Date().toISOString()
        });

        // Store history
        this.trackingData.push(location);
      } catch (error) {
        console.error('Tracking error:', error);
      }
    });

    return geolocation;
  }

  /**
   * Get tracking history
   */
  async getTrackingHistory(userId) {
    try {
      const { ref, get } = await import('firebase/database');
      const snapshot = await get(ref(this.database, `tracking/${userId}`));
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error fetching tracking history:', error);
      return {};
    }
  }
}
