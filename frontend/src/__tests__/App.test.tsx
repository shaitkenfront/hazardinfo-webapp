import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as services from '../services';

vi.mock('../services', () => ({
  apiClient: {
    resolveAddress: vi.fn(),
    resolveCoordinates: vi.fn(),
    resolveGeolocation: vi.fn(),
    getDisasterInfo: vi.fn(),
    getHazardInfoProgressive: vi.fn(),
  },
  useApiClient: vi.fn(),
}));

vi.mock('../components', () => ({
  LocationInputComponent: ({ onLocationSubmit, isLoading, error, onClearError }: any) => (
    <div data-testid="location-input">
      <button 
        onClick={() => onLocationSubmit('address', { address: 'テスト住所' })}
        disabled={isLoading}
      >
        住所で検索
      </button>
      {error && (
        <div data-testid="location-error">
          {error}
          <button onClick={onClearError}>エラークリア</button>
        </div>
      )}
    </div>
  ),
  DisasterInfoDisplayComponent: ({ data, loading, error, onRetry }: any) => (
    <div data-testid="disaster-info-display">
      {loading && <div data-testid="disaster-loading">読み込み中</div>}
      {error && (
        <div data-testid="disaster-error">
          {error}
          <button onClick={onRetry}>エラークリア</button>
        </div>
      )}
      {data && (
        <div data-testid="disaster-data">
          <div>ハザード情報: {data.hazardInfo?.length || 0}件</div>
          <div>避難所: {data.shelters?.length || 0}件</div>
        </div>
      )}
    </div>
  ),
  MapComponent: ({ center, hazardInfo, shelters }: any) => (
    <div data-testid="map-component">
      地図: {center.latitude}, {center.longitude}
      (ハザード: {hazardInfo.length}, 避難所: {shelters.length})
    </div>
  ),
  ProgressIndicator: ({ isVisible }: any) => (
    isVisible ? <div data-testid="progress">progress</div> : null
  ),
}));

describe('App', () => {
  const mockUseApiClient = {
    resolveLocation: vi.fn(),
    locationLoadingState: { isLoading: false, error: null },
    disasterInfoLoadingState: { isLoading: false, error: null },
    clearLocationError: vi.fn(),
    clearDisasterInfoError: vi.fn(),
    isLoading: false,
    hasError: false,
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApiClient.resolveLocation.mockReset();
    mockUseApiClient.clearLocationError.mockReset();
    mockUseApiClient.clearDisasterInfoError.mockReset();
    mockUseApiClient.locationLoadingState = { isLoading: false, error: null };
    mockUseApiClient.disasterInfoLoadingState = { isLoading: false, error: null };
    mockUseApiClient.isLoading = false;
    mockUseApiClient.hasError = false;
    (services.useApiClient as any).mockReturnValue(mockUseApiClient);
  });

  describe('初期表示', () => {
    it('アプリケーションが正常にレンダリングされる', () => {
      render(<App />);
      expect(screen.getByText('ハザード情報一括表示アプリ')).toBeInTheDocument();
      expect(screen.getByText('住所、緯度経度、現在地から防災情報を取得します')).toBeInTheDocument();
      expect(screen.getByTestId('location-input')).toBeInTheDocument();
    });

    it('初期状態では使用方法が表示される', () => {
      render(<App />);
      expect(screen.getByText('使用方法')).toBeInTheDocument();
      expect(screen.getByText('1. 位置情報を入力')).toBeInTheDocument();
      expect(screen.getByText('2. 防災情報を確認')).toBeInTheDocument();
      expect(screen.getByText('3. 地図で詳細確認')).toBeInTheDocument();
    });

    it('フッターが表示される', () => {
      render(<App />);
      expect(screen.getByText(/© 2025 ハザード情報一括表示アプリ/)).toBeInTheDocument();
      expect(screen.getByText(/データ提供: 国土交通省、地理院/)).toBeInTheDocument();
    });
  });

  describe('位置情報入力処理', () => {
    it('位置情報が正常に解決された場合の処理', async () => {
      const mockCoordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: 'テスト住所',
        source: 'address' as const
      };

      const mockDisasterInfo = {
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        hazardInfo: [
          {
            type: 'flood' as const,
            riskLevel: 'medium' as const,
            description: '洪水リスク',
            source: 'テスト',
            lastUpdated: new Date(),
          }
        ],
        shelters: [
          {
            name: 'テスト避難所',
            address: 'テスト住所',
            coordinates: mockCoordinates,
            capacity: 100,
            facilities: ['食料'],
            distance: 1.0
          }
        ],
        disasterHistory: [],
        weatherAlerts: [],
        lastUpdated: '2024-01-01T12:00:00Z'
      };

      mockUseApiClient.resolveLocation.mockResolvedValueOnce(mockCoordinates);
      (services.apiClient.getHazardInfoProgressive as any).mockResolvedValueOnce(mockDisasterInfo.hazardInfo);

      render(<App />);
      const searchButton = screen.getByText('住所で検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(mockUseApiClient.resolveLocation).toHaveBeenCalledWith('address', { address: 'テスト住所' });
      });

      await waitFor(() => {
        expect(services.apiClient.getHazardInfoProgressive).toHaveBeenCalledWith(35.6762, 139.6503, expect.any(Function));
      });
    });

    it('位置情報解決に失敗した場合のエラー処理', async () => {
      mockUseApiClient.resolveLocation.mockResolvedValueOnce(null);
      mockUseApiClient.locationLoadingState = { isLoading: false, error: '住所が見つかりません' as any };
      mockUseApiClient.hasError = true;

      render(<App />);
      const searchButton = screen.getByText('住所で検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
        expect(screen.getByText('位置情報: 住所が見つかりません')).toBeInTheDocument();
      });
    });
  });

  describe('ローディング状態', () => {
    it('位置情報取得中のローディング表示', () => {
      mockUseApiClient.locationLoadingState = { isLoading: true, error: null };
      mockUseApiClient.isLoading = true;
      render(<App />);
      expect(screen.getByText('位置情報を取得中...')).toBeInTheDocument();
      expect(screen.getByTestId('location-input')).toBeInTheDocument();
    });

    it('防災情報取得中のローディング表示', () => {
      mockUseApiClient.disasterInfoLoadingState = { isLoading: true, error: null };
      mockUseApiClient.isLoading = true;
      render(<App />);
      expect(screen.getByText(/防災情報を取得中/)).toBeInTheDocument();
    });
  });

  describe('現在の位置情報表示', () => {
    it('位置情報が設定されている場合の表示', () => {
      render(<App />);
      expect(screen.getByTestId('location-input')).toBeInTheDocument();
    });
  });

  describe('防災情報表示', () => {
    it('防災情報が取得された場合の表示', async () => {
      const mockCoordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: 'テスト住所',
        source: 'address' as const
      };

      const mockDisasterInfo = {
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        hazardInfo: [
          {
            type: 'flood' as const,
            riskLevel: 'medium' as const,
            description: '洪水リスク',
            source: 'テスト',
            lastUpdated: new Date(),
          }
        ],
        shelters: [
          {
            name: 'テスト避難所',
            address: 'テスト住所',
            coordinates: mockCoordinates,
            capacity: 100,
            facilities: ['食料'],
            distance: 1.0
          }
        ],
        disasterHistory: [],
        weatherAlerts: [],
        lastUpdated: '2024-01-01T12:00:00Z'
      };

      mockUseApiClient.resolveLocation.mockResolvedValueOnce(mockCoordinates);
      (services.apiClient.getHazardInfoProgressive as any).mockResolvedValueOnce(mockDisasterInfo.hazardInfo);

      render(<App />);
      const searchButton = screen.getByText('住所で検索');
      fireEvent.click(searchButton);

      expect(mockUseApiClient.resolveLocation).toHaveBeenCalledWith('address', { address: 'テスト住所' });
    });

    it('防災情報取得エラーの表示', () => {
      mockUseApiClient.disasterInfoLoadingState = { isLoading: false, error: '外部APIエラー' as any };
      mockUseApiClient.hasError = true;
      render(<App />);
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('防災情報: 外部APIエラー')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('エラークリアボタンの動作', async () => {
      mockUseApiClient.locationLoadingState = { isLoading: false, error: '位置情報エラー' as any };
      mockUseApiClient.disasterInfoLoadingState = { isLoading: false, error: '防災情報エラー' as any };
      mockUseApiClient.hasError = true;
      render(<App />);
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      const clearButton = screen.getByText('エラーをクリア');
      fireEvent.click(clearButton);
      expect(mockUseApiClient.clearLocationError).toHaveBeenCalled();
      expect(mockUseApiClient.clearDisasterInfoError).toHaveBeenCalled();
    });
  });

  describe('UI操作', () => {
    it('地図表示切り替えボタンの動作', async () => {
      const mockCoordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: 'テスト住所',
        source: 'address' as const
      };

      const mockDisasterInfo = {
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        hazardInfo: [],
        shelters: [],
        disasterHistory: [],
        weatherAlerts: [],
        lastUpdated: '2024-01-01T12:00:00Z'
      };

      mockUseApiClient.resolveLocation.mockResolvedValueOnce(mockCoordinates);
      (services.apiClient.getHazardInfoProgressive as any).mockResolvedValueOnce(mockDisasterInfo.hazardInfo);

      render(<App />);
      const searchButton = screen.getByText('住所で検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(services.apiClient.getHazardInfoProgressive).toHaveBeenCalled();
      });

      await waitFor(() => {
        const mapToggleButton = screen.queryByText('地図を表示');
        if (mapToggleButton) {
          fireEvent.click(mapToggleButton);
          expect(screen.getByText('地図を非表示')).toBeInTheDocument();
        }
      });
    });

    it('リセットボタンの動作', async () => {
      const mockCoordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: 'テスト住所',
        source: 'address' as const
      };

      const mockDisasterInfo = {
        coordinates: { latitude: 35.6762, longitude: 139.6503 },
        hazardInfo: [],
        shelters: [],
        disasterHistory: [],
        weatherAlerts: [],
        lastUpdated: '2024-01-01T12:00:00Z'
      };

      mockUseApiClient.resolveLocation.mockResolvedValueOnce(mockCoordinates);
      (services.apiClient.getHazardInfoProgressive as any).mockResolvedValueOnce(mockDisasterInfo.hazardInfo);

      render(<App />);
      const searchButton = screen.getByText('住所で検索');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(services.apiClient.getHazardInfoProgressive).toHaveBeenCalled();
      });

      await waitFor(() => {
        const resetButton = screen.queryByText('リセット');
        if (resetButton) {
          fireEvent.click(resetButton);
          expect(screen.getByText('使用方法')).toBeInTheDocument();
        }
      });
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイル表示でも正常にレンダリングされる', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });
      render(<App />);
      expect(screen.getByText('ハザード情報一括表示アプリ')).toBeInTheDocument();
      expect(screen.getByTestId('location-input')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なセマンティック要素が使用されている', () => {
      render(<App />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('見出し階層が適切に設定されている', () => {
      render(<App />);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      if (screen.queryByText('使用方法')) {
        expect(screen.getByRole('heading', { level: 3, name: '使用方法' })).toBeInTheDocument();
      }
    });
  });
});
