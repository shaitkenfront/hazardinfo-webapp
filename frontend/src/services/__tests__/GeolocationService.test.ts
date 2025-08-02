import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeolocationService, GeolocationError, GeolocationErrorType } from '../GeolocationService';

// Geolocation APIのモック
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

// Permissions APIのモック
const mockPermissions = {
  query: vi.fn()
};

// Navigatorのモック
// @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
  value: {
    geolocation: mockGeolocation,
    permissions: mockPermissions
  },
  writable: true
});

describe('GeolocationService', () => {
  let geolocationService: GeolocationService;

  beforeEach(() => {
    geolocationService = new GeolocationService();
    vi.clearAllMocks();
  });

  describe('getCurrentLocation', () => {
    it('should return coordinates when geolocation is successful', async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6895,
          longitude: 139.6917
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const result = await geolocationService.getCurrentLocation();

      expect(result).toEqual({
        latitude: 35.6895,
        longitude: 139.6917,
        source: 'geolocation'
      });
    });

    it('should use custom options when provided', async () => {
      const mockPosition = {
        coords: {
          latitude: 35.6895,
          longitude: 139.6917
        }
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success: any) => {
        success(mockPosition);
      });

      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      };

      await geolocationService.getCurrentLocation(customOptions);

      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        customOptions
      );
    });

    it('should throw GeolocationError when permission is denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied the request for Geolocation.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_success: any, error: any) => {
        error(mockError);
      });

      await expect(geolocationService.getCurrentLocation()).rejects.toThrow(GeolocationError);
      
      try {
        await geolocationService.getCurrentLocation();
      } catch (error: any) {
        expect(error.type).toBe(GeolocationErrorType.PERMISSION_DENIED);
        expect(error.code).toBe(1);
      }
    });

    it('should throw GeolocationError when position is unavailable', async () => {
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Network location provider at \'https://www.googleapis.com/\' : No response received.'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_success: any, error: any) => {
        error(mockError);
      });

      await expect(geolocationService.getCurrentLocation()).rejects.toThrow(GeolocationError);
      
      try {
        await geolocationService.getCurrentLocation();
      } catch (error: any) {
        expect(error.type).toBe(GeolocationErrorType.POSITION_UNAVAILABLE);
        expect(error.code).toBe(2);
      }
    });

    it('should throw GeolocationError when timeout occurs', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout expired'
      };

      mockGeolocation.getCurrentPosition.mockImplementation((_success: any, error: any) => {
        error(mockError);
      });

      await expect(geolocationService.getCurrentLocation()).rejects.toThrow(GeolocationError);
      
      try {
        await geolocationService.getCurrentLocation();
      } catch (error: any) {
        expect(error.type).toBe(GeolocationErrorType.TIMEOUT);
        expect(error.code).toBe(3);
      }
    });

    it('should throw GeolocationError when geolocation is not supported', async () => {
      // Geolocation APIを無効にする
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {},
        writable: true
      });

      const service = new GeolocationService();
      
      await expect(service.getCurrentLocation()).rejects.toThrow(GeolocationError);
      
      try {
        await service.getCurrentLocation();
      } catch (error: any) {
        expect(error.type).toBe(GeolocationErrorType.NOT_SUPPORTED);
      }

      // テスト後にnavigatorを復元
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {
          geolocation: mockGeolocation,
          permissions: mockPermissions
        },
        writable: true
      });
    });
  });

  describe('watchPosition', () => {
    it('should start watching position and call callback', () => {
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockWatchId = 123;

      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

      const watchId = geolocationService.watchPosition(mockCallback, mockErrorCallback);

      expect(watchId).toBe(mockWatchId);
      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        })
      );
    });

    it('should call callback with coordinates when position is updated', () => {
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockPosition = {
        coords: {
          latitude: 35.6895,
          longitude: 139.6917
        }
      };

      mockGeolocation.watchPosition.mockImplementation((success: any) => {
        success(mockPosition);
        return 123;
      });

      geolocationService.watchPosition(mockCallback, mockErrorCallback);

      expect(mockCallback).toHaveBeenCalledWith({
        latitude: 35.6895,
        longitude: 139.6917,
        source: 'geolocation'
      });
    });

    it('should call error callback when geolocation error occurs', () => {
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();
      const mockError = {
        code: 1,
        message: 'Permission denied'
      };

      mockGeolocation.watchPosition.mockImplementation((_success: any, error: any) => {
        error(mockError);
        return 123;
      });

      geolocationService.watchPosition(mockCallback, mockErrorCallback);

      expect(mockErrorCallback).toHaveBeenCalledWith(expect.any(GeolocationError));
    });

    it('should return null and call error callback when geolocation is not supported', () => {
      // Geolocation APIを無効にする
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {},
        writable: true
      });

      const service = new GeolocationService();
      const mockCallback = vi.fn();
      const mockErrorCallback = vi.fn();

      const watchId = service.watchPosition(mockCallback, mockErrorCallback);

      expect(watchId).toBeNull();
      expect(mockErrorCallback).toHaveBeenCalledWith(expect.any(GeolocationError));

      // テスト後にnavigatorを復元
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {
          geolocation: mockGeolocation,
          permissions: mockPermissions
        },
        writable: true
      });
    });
  });

  describe('clearWatch', () => {
    it('should clear watch when geolocation is supported', () => {
      const watchId = 123;
      
      geolocationService.clearWatch(watchId);

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    });

    it('should not throw error when geolocation is not supported', () => {
      // Geolocation APIを無効にする
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {},
        writable: true
      });

      const service = new GeolocationService();
      
      expect(() => service.clearWatch(123)).not.toThrow();

      // テスト後にnavigatorを復元
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {
          geolocation: mockGeolocation,
          permissions: mockPermissions
        },
        writable: true
      });
    });
  });

  describe('checkPermission', () => {
    it('should return permission state when permissions API is available', async () => {
      const mockPermissionStatus = { state: 'granted' };
      mockPermissions.query.mockResolvedValue(mockPermissionStatus);

      const result = await geolocationService.checkPermission();

      expect(result).toBe('granted');
      expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    it('should return prompt when permissions API is not available', async () => {
      // Permissions APIを無効にする
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {
          geolocation: mockGeolocation
        },
        writable: true
      });

      const service = new GeolocationService();
      const result = await service.checkPermission();

      expect(result).toBe('prompt');

      // テスト後にnavigatorを復元
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {
          geolocation: mockGeolocation,
          permissions: mockPermissions
        },
        writable: true
      });
    });

    it('should return prompt when permissions query fails', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Permission query failed'));

      const result = await geolocationService.checkPermission();

      expect(result).toBe('prompt');
    });
  });

  describe('isGeolocationSupported', () => {
    it('should return true when geolocation is supported', () => {
      const result = geolocationService.isGeolocationSupported();
      expect(result).toBe(true);
    });

    it('should return false when geolocation is not supported', () => {
      // Geolocation APIを無効にする
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {},
        writable: true
      });

      const service = new GeolocationService();
      const result = service.isGeolocationSupported();
      
      expect(result).toBe(false);

      // テスト後にnavigatorを復元
      // @ts-ignore - global definition for test environment
Object.defineProperty(global as any, 'navigator', {
        value: {
          geolocation: mockGeolocation,
          permissions: mockPermissions
        },
        writable: true
      });
    });
  });
});