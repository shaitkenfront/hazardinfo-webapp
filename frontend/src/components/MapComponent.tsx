import React, { useEffect, useRef, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';
import { Style, Fill, Stroke, Icon } from 'ol/style';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Overlay } from 'ol';
import { Coordinates, HazardInfo, Shelter } from '../types';
import 'ol/ol.css';
import './MapComponent.css';

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
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource>(new VectorSource());
  const overlayRef = useRef<Overlay | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  /**
   * 地図の初期化
   */
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      // ベクターレイヤーの作成
      const vectorLayer = new VectorLayer({
        source: vectorSourceRef.current,
      });

      // 地図の作成
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          vectorLayer,
        ],
        view: new View({
          center: fromLonLat([center.longitude, center.latitude]),
          zoom: zoom,
        }),
      });

      // ポップアップオーバーレイの作成
      if (popupRef.current) {
        const overlay = new Overlay({
          element: popupRef.current,
          autoPan: {
            animation: {
              duration: 250,
            },
          },
        });
        map.addOverlay(overlay);
        overlayRef.current = overlay;
      }

      // 地図クリックイベント
      if (onMapClick) {
        map.on('click', (event) => {
          const coordinate = event.coordinate;
          const [longitude, latitude] = toLonLat(coordinate);
          const coordinates: Coordinates = {
            latitude,
            longitude,
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
    if (!mapInstanceRef.current) return null;

    // 現在地マーカーのスタイル
    const locationStyle = new Style({
      image: new Icon({
        src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#2196f3" stroke="white" stroke-width="3"/>
          </svg>
        `),
        scale: 1,
      })
    });

    const feature = new Feature({
      geometry: new Point(fromLonLat([center.longitude, center.latitude])),
      type: 'location',
      data: center,
    });
    
    feature.setStyle(locationStyle);
    return feature;
  }, [center]);

  /**
   * 避難所マーカーの作成
   */
  const createShelterMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !shelters.length) return [];

    const shelterStyle = new Style({
      image: new Icon({
        src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r="13" fill="#4caf50" stroke="white" stroke-width="2"/>
            <text x="15" y="20" text-anchor="middle" fill="white" font-size="16">🏠</text>
          </svg>
        `),
        scale: 1,
      })
    });

    return shelters.map((shelter) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([shelter.coordinates.longitude, shelter.coordinates.latitude])),
        type: 'shelter',
        data: shelter,
      });
      
      feature.setStyle(shelterStyle);
      return feature;
    });
  }, [shelters]);

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

      const circleStyle = new Style({
        fill: new Fill({
          color: color + '33', // 透明度20%
        }),
        stroke: new Stroke({
          color: color,
          width: 2,
        }),
      });

      const feature = new Feature({
        geometry: new Circle(
          fromLonLat([center.longitude, center.latitude]),
          radiusMap[hazard.riskLevel]
        ),
        type: 'hazard',
        data: hazard,
      });
      
      feature.setStyle(circleStyle);
      return feature;
    });
  }, [hazardInfo, center]);

  /**
   * マーカーとオーバーレイの更新
   */
  const updateMarkersAndOverlays = useCallback(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    // 既存のフィーチャーをクリア
    vectorSourceRef.current.clear();

    // 中心位置マーカーを追加
    const locationMarker = createLocationMarker();
    if (locationMarker) {
      vectorSourceRef.current.addFeature(locationMarker);
    }

    // 避難所マーカーを追加
    const shelterMarkers = createShelterMarkers();
    shelterMarkers.forEach(marker => {
      vectorSourceRef.current.addFeature(marker);
    });

    // ハザード情報オーバーレイを追加
    const hazardOverlays = createHazardOverlays();
    hazardOverlays.forEach(overlay => {
      vectorSourceRef.current.addFeature(overlay);
    });

    // 地図の中心を更新
    mapInstanceRef.current.getView().setCenter(fromLonLat([center.longitude, center.latitude]));
    mapInstanceRef.current.getView().setZoom(zoom);
  }, [isMapReady, createLocationMarker, createShelterMarkers, createHazardOverlays, center, zoom]);

  /**
   * 地図のリサイズ処理
   */
  const handleResize = useCallback(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.updateSize();
      }, 100);
    }
  }, []);

  /**
   * ポップアップ表示処理
   */
  const showPopup = useCallback((coordinate: number[], content: string) => {
    if (!overlayRef.current || !popupRef.current) return;
    
    popupRef.current.innerHTML = content;
    overlayRef.current.setPosition(coordinate);
  }, []);

  /**
   * ポップアップを隠す
   */
  const hidePopup = useCallback(() => {
    if (overlayRef.current) {
      overlayRef.current.setPosition(undefined);
    }
  }, []);

  /**
   * フィーチャークリックハンドラー
   */
  const handleFeatureClick = useCallback((event: any) => {
    const feature = mapInstanceRef.current?.forEachFeatureAtPixel(event.pixel, (feature) => feature);
    
    if (feature) {
      const type = feature.get('type');
      const data = feature.get('data');
      const coordinate = event.coordinate;

      let popupContent = '';
      
      if (type === 'location') {
        popupContent = `
          <div class="marker-popup">
            <h4>指定位置</h4>
            ${data.address ? `<p><strong>住所:</strong> ${data.address}</p>` : ''}
            <p><strong>座標:</strong> ${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}</p>
            <p><strong>取得方法:</strong> ${getSourceLabel(data.source)}</p>
          </div>
        `;
      } else if (type === 'shelter') {
        popupContent = `
          <div class="marker-popup">
            <h4>${data.name}</h4>
            <p><strong>住所:</strong> ${data.address}</p>
            <p><strong>距離:</strong> ${formatDistance(data.distance)}</p>
            <p><strong>収容人数:</strong> ${data.capacity.toLocaleString()}人</p>
            ${data.facilities.length > 0 ? `
              <p><strong>設備:</strong></p>
              <ul>
                ${data.facilities.map((facility: string) => `<li>${facility}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
        `;
      } else if (type === 'hazard') {
        const color = RISK_LEVEL_COLORS[data.riskLevel as keyof typeof RISK_LEVEL_COLORS];
        popupContent = `
          <div class="marker-popup">
            <h4>${HAZARD_TYPE_LABELS[data.type as keyof typeof HAZARD_TYPE_LABELS] || data.type}</h4>
            <p><strong>リスクレベル:</strong> <span style="color: ${color};">${getRiskLevelLabel(data.riskLevel)}</span></p>
            <p><strong>説明:</strong> ${data.description}</p>
            <p><strong>情報源:</strong> ${data.source}</p>
            <p><strong>更新日時:</strong> ${formatDate(data.lastUpdated)}</p>
            ${data.detailUrl ? `<p><a href="${data.detailUrl}" target="_blank" rel="noopener noreferrer">詳細情報</a></p>` : ''}
          </div>
        `;
      }

      if (popupContent) {
        showPopup(coordinate, popupContent);
        
        if (onMarkerClick) {
          onMarkerClick(type === 'location' ? 'location' : 'shelter', data);
        }
      }
    } else {
      hidePopup();
    }
  }, [onMarkerClick, showPopup, hidePopup]);

  // 地図の初期化
  useEffect(() => {
    initializeMap();

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap, handleResize]);

  // マーカーとオーバーレイの更新
  useEffect(() => {
    updateMarkersAndOverlays();
  }, [updateMarkersAndOverlays]);

  // クリックイベントリスナーの追加
  useEffect(() => {
    if (mapInstanceRef.current && isMapReady) {
      mapInstanceRef.current.on('click', handleFeatureClick);
      
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.un('click', handleFeatureClick);
        }
      };
    }
  }, [isMapReady, handleFeatureClick]);

  /**
   * ヘルパー関数
   */
  const getSourceLabel = (source: string): string => {
    const labels = {
      address: '住所から取得',
      coordinates: '座標指定',
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
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '日付不明';
      }
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.warn('日付のフォーマットに失敗しました:', error);
      return '日付不明';
    }
  };

  return (
    <div className="map-component">
      <div 
        ref={mapRef} 
        className="map-container"
        style={{ height }}
      />
      <div 
        ref={popupRef}
        className="ol-popup"
        style={{
          position: 'absolute',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'none'
        }}
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