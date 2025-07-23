import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Coordinates, HazardInfo, Shelter } from '../types';
import './MapComponent.css';

// Leafletのデフォルトアイコンの問題を修正
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * MapComponentのProps
 */
export interface MapComponentProps {
  /** 中心座標 */
  center: Coordinates;
  /** ハザード情報 */
  hazardInfo?: HazardInfo[];
  /** 避難所情報 */
  shelters?: Shelter[];
  /** 地図の高さ */
  height?: string;
  /** ズームレベル */
  zoom?: number;
  /** マーカークリック時のコールバック */
  onMarkerClick?: (type: 'location' | 'shelter', data: any) => void;
  /** 地図クリック時のコールバック */
  onMapClick?: (coordinates: Coordinates) => void;
}

/**
 * リスクレベルに応じた色設定
 */
const RISK_LEVEL_COLORS = {
  very_high: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c'
};

/**
 * 災害タイプの日本語表示
 */
const HAZARD_TYPE_LABELS = {
  flood: '洪水',
  earthquake: '地震',
  landslide: '土砂災害',
  tsunami: '津波',
  large_scale_fill: '大規模盛土造成地'
};

/**
 * 地図表示コンポーネント
 */
export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  hazardInfo = [],
  shelters = [],
  height = '400px',
  zoom = 15,
  onMarkerClick,
  onMapClick
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const [isMapReady, setIsMapReady] = useState(false);

  /**
   * 地図の初期化
   */
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapRef.current).setView(
        [center.latitude, center.longitude],
        zoom
      );

      // OpenStreetMapタイルレイヤーを追加
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // マーカーレイヤーグループを追加
      markersRef.current.addTo(map);

      // 地図クリックイベント
      if (onMapClick) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const coordinates: Coordinates = {
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            source: 'coordinates'
          };
          onMapClick(coordinates);
        });
      }

      mapInstanceRef.current = map;
      setIsMapReady(true);
    } catch (error) {
      console.error('地図の初期化に失敗しました:', error);
    }
  }, [center.latitude, center.longitude, zoom, onMapClick]);

  /**
   * 中心位置マーカーの作成
   */
  const createLocationMarker = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // カスタムアイコンを作成（現在地用）
    const locationIcon = L.divIcon({
      className: 'location-marker',
      html: '<div class="location-marker-inner"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([center.latitude, center.longitude], {
      icon: locationIcon
    });

    // ポップアップを追加
    const popupContent = `
      <div class="marker-popup">
        <h4>指定位置</h4>
        ${center.address ? `<p><strong>住所:</strong> ${center.address}</p>` : ''}
        <p><strong>座標:</strong> ${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}</p>
        <p><strong>取得方法:</strong> ${getSourceLabel(center.source)}</p>
      </div>
    `;

    marker.bindPopup(popupContent);

    if (onMarkerClick) {
      marker.on('click', () => {
        onMarkerClick('location', center);
      });
    }

    return marker;
  }, [center, onMarkerClick]);

  /**
   * 避難所マーカーの作成
   */
  const createShelterMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !shelters.length) return [];

    return shelters.map((shelter) => {
      // 避難所用のカスタムアイコン
      const shelterIcon = L.divIcon({
        className: 'shelter-marker',
        html: '<div class="shelter-marker-inner">🏠</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(
        [shelter.coordinates.latitude, shelter.coordinates.longitude],
        { icon: shelterIcon }
      );

      // ポップアップを追加
      const popupContent = `
        <div class="marker-popup">
          <h4>${shelter.name}</h4>
          <p><strong>住所:</strong> ${shelter.address}</p>
          <p><strong>距離:</strong> ${formatDistance(shelter.distance)}</p>
          <p><strong>収容人数:</strong> ${shelter.capacity.toLocaleString()}人</p>
          ${shelter.facilities.length > 0 ? `
            <p><strong>設備:</strong></p>
            <ul>
              ${shelter.facilities.map(facility => `<li>${facility}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick('shelter', shelter);
        });
      }

      return marker;
    });
  }, [shelters, onMarkerClick]);

  /**
   * ハザード情報の円形オーバーレイ作成
   */
  const createHazardOverlays = useCallback(() => {
    if (!mapInstanceRef.current || !hazardInfo.length) return [];

    return hazardInfo.map((hazard) => {
      const color = RISK_LEVEL_COLORS[hazard.riskLevel];
      
      // リスクレベルに応じて円のサイズを調整
      const radiusMap = {
        very_high: 1000,
        high: 800,
        medium: 600,
        low: 400
      };

      const circle = L.circle([center.latitude, center.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        radius: radiusMap[hazard.riskLevel],
        weight: 2
      });

      // ポップアップを追加
      const popupContent = `
        <div class="marker-popup">
          <h4>${HAZARD_TYPE_LABELS[hazard.type] || hazard.type}</h4>
          <p><strong>リスクレベル:</strong> <span style="color: ${color};">${getRiskLevelLabel(hazard.riskLevel)}</span></p>
          <p><strong>説明:</strong> ${hazard.description}</p>
          <p><strong>情報源:</strong> ${hazard.source}</p>
          <p><strong>更新日時:</strong> ${formatDate(hazard.lastUpdated)}</p>
          ${hazard.detailUrl ? `<p><a href="${hazard.detailUrl}" target="_blank" rel="noopener noreferrer">詳細情報</a></p>` : ''}
        </div>
      `;

      circle.bindPopup(popupContent);

      return circle;
    });
  }, [hazardInfo, center]);

  /**
   * マーカーとオーバーレイの更新
   */
  const updateMarkersAndOverlays = useCallback(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    // 既存のマーカーをクリア
    markersRef.current.clearLayers();

    // 中心位置マーカーを追加
    const locationMarker = createLocationMarker();
    if (locationMarker) {
      markersRef.current.addLayer(locationMarker);
    }

    // 避難所マーカーを追加
    const shelterMarkers = createShelterMarkers();
    shelterMarkers.forEach(marker => {
      markersRef.current.addLayer(marker);
    });

    // ハザード情報オーバーレイを追加
    const hazardOverlays = createHazardOverlays();
    hazardOverlays.forEach(overlay => {
      markersRef.current.addLayer(overlay);
    });

    // 地図の中心を更新
    mapInstanceRef.current.setView([center.latitude, center.longitude], zoom);
  }, [isMapReady, createLocationMarker, createShelterMarkers, createHazardOverlays, center, zoom]);

  /**
   * 地図のリサイズ処理
   */
  const handleResize = useCallback(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  // 地図の初期化
  useEffect(() => {
    initializeMap();

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap, handleResize]);

  // マーカーとオーバーレイの更新
  useEffect(() => {
    updateMarkersAndOverlays();
  }, [updateMarkersAndOverlays]);

  /**
   * ヘルパー関数
   */
  const getSourceLabel = (source: string): string => {
    const labels = {
      address: '住所から取得',
      coordinates: '座標指定',
      suumo: 'SUUMO URLから取得',
      geolocation: '現在地取得'
    };
    return labels[source as keyof typeof labels] || source;
  };

  const getRiskLevelLabel = (level: string): string => {
    const labels = {
      very_high: '非常に高い',
      high: '高い',
      medium: '中程度',
      low: '低い'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="map-component">
      <div 
        ref={mapRef} 
        className="map-container"
        style={{ height }}
      />
      {!isMapReady && (
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>地図を読み込み中...</p>
        </div>
      )}
    </div>
  );
};