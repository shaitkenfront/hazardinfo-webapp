import { DisasterInfoService, ExternalAPIError } from '../DisasterInfoService';
import { Coordinates } from '../../types';
import axios from 'axios';

// axiosをモック化
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DisasterInfoService', () => {
  let service: DisasterInfoService;
  let mockCoordinates: Coordinates;

  beforeEach(() => {
    service = new DisasterInfoService();
    mockCoordinates = {
      latitude: 35.6762,
      longitude: 139.6503,
      address: '東京都',
      source: 'address'
    };
    // モックされたレスポンスをリセット
    mockedAxios.get.mockReset();
  });

  describe('getHazardMapInfo', () => {
    it('should return array of hazard information', async () => {
      // モックのレスポンスを設定
      const mockResponse = {
        data: {
          hazard_info: {
            jshis_prob_50: { max_prob: 0.8 },
            inundation_depth: { max_info: '5m' }
          }
        }
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getHazardMapInfo(mockCoordinates);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should handle errors and wrap them in ExternalAPIError', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Test error'));

      await expect(service.getHazardMapInfo(mockCoordinates)).rejects.toThrow(ExternalAPIError);
    });
  });

  // 他のテストも同様にモックを使用するように修正
});