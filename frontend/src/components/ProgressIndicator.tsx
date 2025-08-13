import React from 'react';
import './ProgressIndicator.css';

/**
 * 進捗表示コンポーネントのProps
 */
export interface ProgressIndicatorProps {
  current: number;
  total: number;
  currentTask?: string;
  isVisible: boolean;
}

/**
 * ハザード情報取得時の進捗表示コンポーネント
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  current,
  total,
  currentTask,
  isVisible
}) => {
  if (!isVisible) {
    return null;
  }

  const percentage = Math.round((current / total) * 100);
  
  // ハザードタイプの日本語表示
  const getHazardTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      earthquake: '地震情報',
      flood: '洪水情報',
      tsunami: '津波情報',
      high_tide: '高潮情報',
      large_fill_land: '大規模盛土情報',
      landslide: '土砂災害情報',
      flood_keizoku: '浸水継続時間情報',
      naisui: '内水氾濫情報',
      kaokutoukai_hanran: '家屋倒壊等氾濫想定区域（氾濫流）情報',
      kaokutoukai_kagan: '家屋倒壊等氾濫想定区域（河岸侵食）情報',
      avalanche: '雪崩情報',
    };
    return labels[type] || type;
  };

  return (
    <div className="progress-indicator">
      <div className="progress-content">
        <h3>防災情報を取得中...</h3>
        
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="progress-text">{current}/{total}</span>
        </div>
        
        {currentTask && (
          <p className="current-task">
            取得中: {getHazardTypeLabel(currentTask)}
          </p>
        )}
        
        <div className="loading-spinner" />
      </div>
    </div>
  );
};