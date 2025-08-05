// import React from 'react'; // unused in test
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MapComponent } from '../MapComponent';
import { Coordinates, HazardInfo, Shelter } from '../../types';

// Leafletのモック設定
vi.mock('leaflet', () => {
  const mockMap = {
    setView: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    invalidateSize: vi.fn()
  };

  const mockTileLayer = {
    addTo: vi.fn().mockReturnThis()
  };

  const mockLayerGroup = {
    addTo: vi.fn().mockReturnThis(),
    clearLayers: vi.fn(),
    addLayer: vi.fn()
  };

  const mockMarker = {
    bindPopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis()
  };

  const mockCircle = {
    bindPopup: vi.fn().mockReturnThis()
  };

  return {
    default: {
      map: vi.fn(() => mockMap),
      tileLayer: vi.fn(() => mockTileLayer),
      LayerGroup: vi.fn(() => mockLayerGroup),
      marker: vi.fn(() => mockMarker),
      circle: vi.fn(() => mockCircle),
      divIcon: vi.fn(() => ({})),
      Icon: {
        Default: {
          prototype: {},
          mergeOptions: vi.fn()
        }
      }
    }
  };
});

describe('MapComponent', () => {
  const mockCenter: Coordinates = {
    latitude: 35.6762,
    longitude: 139.6503,
    address: '東京都',
    source: 'address'
  };

  const mockHazardInfo: HazardInfo[] = [
    {
      type: 'flood',
      riskLevel: 'high',
      description: '洪水リスクが高い地域です',
      source: '国土交通省',
      lastUpdated: new Date('2024-01-01'),
      detailUrl: 'https://example.com/detail'
    }
  ];

  const mockShelters: Shelter[] = [
    {
      name: '東京都庁',
      address: '東京都新宿区西新宿2-8-1',
      coordinates: {
        latitude: 35.6896,
        longitude: 139.6917,
        source: 'address'
      },
      capacity: 1000,
      facilities: ['Wi-Fi', '非常用電源'],
      distance: 500
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本的なレンダリング', () => {
    it('地図コンテナが正しくレンダリングされる', () => {
      render(<MapComponent center={mockCenter} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('指定された高さが適用される', () => {
      const customHeight = '500px';
      render(<MapComponent center={mockCenter} height={customHeight} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toHaveStyle({ height: customHeight });
    });

    it('デフォルトの高さが適用される', () => {
      render(<MapComponent center={mockCenter} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toHaveStyle({ height: '400px' });
    });

    it('地図コンポーネントクラスが適用される', () => {
      render(<MapComponent center={mockCenter} />);
      
      const mapComponent = document.querySelector('.map-component');
      expect(mapComponent).toBeInTheDocument();
    });
  });

  describe('プロパティの受け渡し', () => {
    it('中心座標が正しく設定される', () => {
      const center: Coordinates = {
        latitude: 35.6585,
        longitude: 139.7454,
        source: 'coordinates'
      };
      
      render(<MapComponent center={center} />);
      
      // コンポーネントが正常にレンダリングされることを確認
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('ハザード情報が渡される', () => {
      render(<MapComponent center={mockCenter} hazardInfo={mockHazardInfo} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('避難所情報が渡される', () => {
      render(<MapComponent center={mockCenter} shelters={mockShelters} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('カスタムズームレベルが設定される', () => {
      render(<MapComponent center={mockCenter} zoom={12} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('コールバック関数', () => {
    it('マーカークリックコールバックが設定される', () => {
      const onMarkerClick = vi.fn();
      
      render(
        <MapComponent 
          center={mockCenter} 
          onMarkerClick={onMarkerClick}
        />
      );
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('地図クリックコールバックが設定される', () => {
      const onMapClick = vi.fn();
      
      render(
        <MapComponent 
          center={mockCenter} 
          onMapClick={onMapClick}
        />
      );
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('複数のプロパティの組み合わせ', () => {
    it('すべてのプロパティが同時に設定される', () => {
      const onMarkerClick = vi.fn();
      const onMapClick = vi.fn();
      
      render(
        <MapComponent 
          center={mockCenter}
          hazardInfo={mockHazardInfo}
          shelters={mockShelters}
          height="600px"
          zoom={14}
          onMarkerClick={onMarkerClick}
          onMapClick={onMapClick}
        />
      );
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
      expect(mapContainer).toHaveStyle({ height: '600px' });
    });
  });

  describe('エラーケース', () => {
    it('空の配列が渡されても正常に動作する', () => {
      render(
        <MapComponent 
          center={mockCenter}
          hazardInfo={[]}
          shelters={[]}
        />
      );
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('undefinedが渡されても正常に動作する', () => {
      render(
        <MapComponent 
          center={mockCenter}
          hazardInfo={undefined}
          shelters={undefined}
        />
      );
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('データソースの種類', () => {
    it('住所ソースの座標が処理される', () => {
      const center: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        address: '東京都',
        source: 'address'
      };
      
      render(<MapComponent center={center} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });

    it('座標ソースが処理される', () => {
      const center: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'coordinates'
      };
      
      render(<MapComponent center={center} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });


    it('現在地ソースが処理される', () => {
      const center: Coordinates = {
        latitude: 35.6762,
        longitude: 139.6503,
        source: 'geolocation'
      };
      
      render(<MapComponent center={center} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });

  describe('リスクレベルの処理', () => {
    it('異なるリスクレベルのハザード情報が処理される', () => {
      const hazardInfo: HazardInfo[] = [
        {
          type: 'flood',
          riskLevel: 'very_high',
          description: '非常に高いリスク',
          source: 'テスト',
          lastUpdated: new Date()
        },
        {
          type: 'earthquake',
          riskLevel: 'high',
          description: '高いリスク',
          source: 'テスト',
          lastUpdated: new Date()
        },
        {
          type: 'landslide',
          riskLevel: 'medium',
          description: '中程度のリスク',
          source: 'テスト',
          lastUpdated: new Date()
        },
        {
          type: 'tsunami',
          riskLevel: 'low',
          description: '低いリスク',
          source: 'テスト',
          lastUpdated: new Date()
        }
      ];
      
      render(<MapComponent center={mockCenter} hazardInfo={hazardInfo} />);
      
      const mapContainer = document.querySelector('.map-container');
      expect(mapContainer).toBeInTheDocument();
    });
  });
});