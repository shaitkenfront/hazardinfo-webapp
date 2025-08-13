import React, { useState, useCallback } from 'react';
import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';
import './DisasterInfoDisplayComponent.css';

/**
 * 防災情報の統合データ型
 */
export interface DisasterInfoData {
  coordinates: Coordinates;
  hazardInfo: HazardInfo[];
  shelters: Shelter[];
  disasterHistory: DisasterEvent[];
  weatherAlerts: WeatherAlert[];
  lastUpdated: string;
  location?: {
    address?: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * DisasterInfoDisplayComponentのProps
 */
export interface DisasterInfoDisplayComponentProps {
  data: DisasterInfoData | null;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

/**
 * リスクレベルの表示設定
 */
const RISK_LEVEL_CONFIG = {
  very_high: { label: '非常に高い', color: '#d32f2f', bgColor: '#ffebee' },
  high: { label: '高い', color: '#f57c00', bgColor: '#fff3e0' },
  medium: { label: '中程度', color: '#fbc02d', bgColor: '#fffde7' },
  low: { label: '低い', color: '#388e3c', bgColor: '#e8f5e8' }
};

/**
 * 災害タイプの日本語表示
 */
const HAZARD_TYPE_LABELS: Record<string, string> = {
  flood: '洪水',
  earthquake: '地震',
  landslide: '土砂災害',
  tsunami: '津波',
  large_fill_land: '大規模盛土造成地',
  high_tide: '高潮',
  flood_keizoku: '浸水継続時間',
  naisui: '内水氾濫',
  kaokutoukai_hanran: '家屋倒壊等氾濫想定区域（氾濫流）',
  kaokutoukai_kagan: '家屋倒壊等氾濫想定区域（河岸侵食）',
  avalanche: '雪崩',
};

/**
 * 警報レベルの表示設定
 */
// const ALERT_LEVEL_CONFIG = {
//   emergency: { label: '緊急警報', color: '#d32f2f', bgColor: '#ffebee' },
//   warning: { label: '警報', color: '#f57c00', bgColor: '#fff3e0' },
//   advisory: { label: '注意報', color: '#fbc02d', bgColor: '#fffde7' }
// };

/**
 * 防災情報表示コンポーネント
 */
export const DisasterInfoDisplayComponent: React.FC<DisasterInfoDisplayComponentProps> = ({
  data,
  loading = false,
  error,
  onRetry
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  /**
   * セクションの展開/折りたたみ
   */
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  /**
   * 日付のフォーマット
   */
  const formatDate = useCallback((date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }, []);

  /**
   * 距離のフォーマット - 将来機能として一時的に無効化
   */
  // const formatDistance = useCallback((distance: number): string => {
  //   if (distance < 1000) {
  //     return `${Math.round(distance)}m`;
  //   }
  //   return `${(distance / 1000).toFixed(1)}km`;
  // }, []);

  /**
   * ハザード情報のレンダリング
   */
  const renderHazardInfo = useCallback(() => {
    if (!data?.hazardInfo.length) {
      return (
        <div className="no-data">
          <p>ハザード情報はありません</p>
        </div>
      );
    }

    // リスクレベル順にソート
    const sortedHazards = [...data.hazardInfo].sort((a, b) => {
      const riskOrder = { very_high: 4, high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });

    return (
      <div className="hazard-list">
        {sortedHazards.map((hazard, index) => {
          const config = RISK_LEVEL_CONFIG[hazard.riskLevel];
          const sectionId = `hazard-${index}`;
          const isExpanded = expandedSections.has(sectionId);

          return (
            <div key={index} className="hazard-item">
              <div 
                className="hazard-header"
                onClick={() => toggleSection(sectionId)}
                style={{ backgroundColor: config.bgColor }}
              >
                <div className="hazard-title">
                  <h4>{HAZARD_TYPE_LABELS[hazard.type] || hazard.type}</h4>
                  <span 
                    className="risk-level"
                    style={{ color: config.color, backgroundColor: 'white' }}
                  >
                    {config.label}
                  </span>
                </div>
                <button className="expand-button">
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
              
              {isExpanded && (
                <div className="hazard-details">
                  <p className="description">{hazard.description}</p>
                  <div className="metadata">
                    <p><strong>情報源:</strong> {hazard.source}</p>
                    <p><strong>更新日時:</strong> {formatDate(hazard.lastUpdated)}</p>
                    {hazard.detailUrl && (
                      <p>
                        <a 
                          href={hazard.detailUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="detail-link"
                        >
                          詳細情報を見る
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [data?.hazardInfo, expandedSections, toggleSection, formatDate]);

  /**
   * 避難所情報のレンダリング - 将来機能として一時的に無効化
   */
  // const renderShelters = useCallback(() => {
  //   if (!data?.shelters.length) {
  //     return (
  //       <div className="no-data">
  //         <p>近隣の避難所情報はありません</p>
  //       </div>
  //     );
  //   }

  //   // 距離順にソート
  //   const sortedShelters = [...data.shelters].sort((a, b) => a.distance - b.distance);

  //   return (
  //     <div className="shelter-list">
  //       {sortedShelters.map((shelter, index) => {
  //         const sectionId = `shelter-${index}`;
  //         const isExpanded = expandedSections.has(sectionId);

  //         return (
  //           <div key={index} className="shelter-item">
  //             <div 
  //               className="shelter-header"
  //               onClick={() => toggleSection(sectionId)}
  //             >
  //               <div className="shelter-title">
  //                 <h4>{shelter.name}</h4>
  //                 <span className="distance">{formatDistance(shelter.distance)}</span>
  //               </div>
  //               <button className="expand-button">
  //                 {isExpanded ? '▼' : '▶'}
  //               </button>
  //             </div>
              
  //             {isExpanded && (
  //               <div className="shelter-details">
  //                 <p><strong>住所:</strong> {shelter.address}</p>
  //                 <p><strong>収容人数:</strong> {shelter.capacity.toLocaleString()}人</p>
  //                 {shelter.facilities.length > 0 && (
  //                   <div className="facilities">
  //                     <strong>設備:</strong>
  //                     <ul>
  //                       {shelter.facilities.map((facility, idx) => (
  //                         <li key={idx}>{facility}</li>
  //                       ))}
  //                     </ul>
  //                   </div>
  //                 )}
  //               </div>
  //             )}
  //           </div>
  //         );
  //       })}
  //     </div>
  //   );
  // }, [data?.shelters, expandedSections, toggleSection, formatDistance]);

  /**
   * 災害履歴のレンダリング - 将来機能として一時的に無効化
   */
  // const renderDisasterHistory = useCallback(() => {
  //   if (!data?.disasterHistory.length) {
  //     return (
  //       <div className="no-data">
  //         <p>過去の災害履歴はありません</p>
  //       </div>
  //     );
  //   }

  //   // 日付順にソート（新しい順）
  //   const sortedHistory = [...data.disasterHistory].sort((a, b) => {
  //     const dateA = new Date(a.date);
  //     const dateB = new Date(b.date);
  //     return dateB.getTime() - dateA.getTime();
  //   });

  //   return (
  //     <div className="history-list">
  //       {sortedHistory.map((event, index) => {
  //         const sectionId = `history-${index}`;
  //         const isExpanded = expandedSections.has(sectionId);

  //         return (
  //           <div key={index} className="history-item">
  //             <div 
  //               className="history-header"
  //               onClick={() => toggleSection(sectionId)}
  //             >
  //               <div className="history-title">
  //                 <h4>{event.type}</h4>
  //                 <span className="date">{formatDate(event.date)}</span>
  //               </div>
  //               <button className="expand-button">
  //                 {isExpanded ? '▼' : '▶'}
  //               </button>
  //             </div>
              
  //             {isExpanded && (
  //               <div className="history-details">
  //                 <p className="description">{event.description}</p>
  //                 <div className="metadata">
  //                   <p><strong>深刻度:</strong> {event.severity}</p>
  //                   <p><strong>情報源:</strong> {event.source}</p>
  //                 </div>
  //               </div>
  //             )}
  //           </div>
  //         );
  //       })}
  //     </div>
  //   );
  // }, [data?.disasterHistory, expandedSections, toggleSection, formatDate]);

  /**
   * 気象警報のレンダリング
   */
  // const renderWeatherAlerts = useCallback(() => {
  //   if (!data?.weatherAlerts.length) {
  //     return (
  //       <div className="no-data">
  //         <p>現在発令中の気象警報はありません</p>
  //       </div>
  //     );
  //   }

  //   // レベル順にソート
  //   const sortedAlerts = [...data.weatherAlerts].sort((a, b) => {
  //     const levelOrder = { emergency: 3, warning: 2, advisory: 1 };
  //     return levelOrder[b.level] - levelOrder[a.level];
  //   });

  //   return (
  //     <div className="alert-list">
  //       {sortedAlerts.map((alert, index) => {
  //         const config = ALERT_LEVEL_CONFIG[alert.level];
  //         const sectionId = `alert-${index}`;
  //         const isExpanded = expandedSections.has(sectionId);

  //         return (
  //           <div key={index} className="alert-item">
  //             <div 
  //               className="alert-header"
  //               onClick={() => toggleSection(sectionId)}
  //               style={{ backgroundColor: config.bgColor }}
  //             >
  //               <div className="alert-title">
  //                 <h4>{alert.type}</h4>
  //                 <span 
  //                   className="alert-level"
  //                   style={{ color: config.color, backgroundColor: 'white' }}
  //                 >
  //                   {config.label}
  //                 </span>
  //               </div>
  //               <button className="expand-button">
  //                 {isExpanded ? '▼' : '▶'}
  //               </button>
  //             </div>
              
  //             {isExpanded && (
  //               <div className="alert-details">
  //                 <p className="description">{alert.description}</p>
  //                 <div className="metadata">
  //                   <p><strong>対象地域:</strong> {alert.area}</p>
  //                   <p><strong>発令日時:</strong> {formatDate(alert.issuedAt)}</p>
  //                   {alert.validUntil && (
  //                     <p><strong>有効期限:</strong> {formatDate(alert.validUntil)}</p>
  //                   )}
  //                 </div>
  //               </div>
  //             )}
  //           </div>
  //         );
  //       })}
  //     </div>
  //   );
  // }, [data?.weatherAlerts, expandedSections, toggleSection, formatDate]);

  // ローディング状態
  if (loading) {
    return (
      <div className="disaster-info-display loading">
        <div className="loading-spinner"></div>
        <p>防災情報を取得中...</p>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="disaster-info-display error">
        <div className="error-content">
          <h3>エラーが発生しました</h3>
          <p>{error}</p>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              再試行
            </button>
          )}
        </div>
      </div>
    );
  }

  // データなし状態
  if (!data) {
    return (
      <div className="disaster-info-display no-data">
        <p>防災情報を表示するには、位置情報を入力してください。</p>
      </div>
    );
  }

  return (
    <div className="disaster-info-display">
      {/* 位置情報表示 */}
      {data.location && (
        <div className="location-info">
          <h2>防災情報</h2>
          {data.location.address && (
            <p className="location-address">{data.location.address}</p>
          )}
          <p className="location-coordinates">
            緯度: {data.location.coordinates.latitude.toFixed(6)}, 
            経度: {data.location.coordinates.longitude.toFixed(6)}
          </p>
        </div>
      )}

      {/* 気象警報 - 将来機能として一時的に非表示 */}
      {/* <section className="info-section">
        <h3 className="section-title">気象警報・注意報</h3>
        {renderWeatherAlerts()}
      </section> */}

      {/* ハザード情報 */}
      <section className="info-section">
        <h3 className="section-title">ハザードマップ情報</h3>
        {renderHazardInfo()}
      </section>

      {/* 避難所情報 - 将来機能として一時的に非表示 */}
      {/* <section className="info-section">
        <h3 className="section-title">近隣の避難所</h3>
        {renderShelters()}
      </section> */}

      {/* 災害履歴 - 将来機能として一時的に非表示 */}
      {/* <section className="info-section">
        <h3 className="section-title">過去の災害履歴</h3>
        {renderDisasterHistory()}
      </section> */}
    </div>
  );
};