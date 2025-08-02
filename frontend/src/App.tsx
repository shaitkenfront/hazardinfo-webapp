import { useState, useCallback } from 'react';
import './App.css';
import {
  LocationInputComponent,
  DisasterInfoDisplayComponent,
  MapComponent,
  ProgressIndicator,
  type DisasterInfoData
} from './components';
import { apiClient, useApiClient } from './services';
import { Coordinates } from './types';

/**
 * アプリケーションの状態管理用の型定義
 */
interface AppState {
  currentLocation: Coordinates | null;
  disasterInfo: DisasterInfoData | null;
  showMap: boolean;
}

/**
 * 進捗状態管理用の型定義
 */
interface ProgressState {
  isVisible: boolean;
  current: number;
  total: number;
  currentTask: string;
}

/**
 * メインアプリケーションコンポーネント
 */
function App() {
  // アプリケーション状態
  const [appState, setAppState] = useState<AppState>({
    currentLocation: null,
    disasterInfo: null,
    showMap: false,
  });

  // 進捗状態
  const [progressState, setProgressState] = useState<ProgressState>({
    isVisible: false,
    current: 0,
    total: 0,
    currentTask: ''
  });

  // APIクライアントフック
  const {
    resolveLocation,
    locationLoadingState,
    disasterInfoLoadingState,
    clearLocationError,
    clearDisasterInfoError,
    isLoading,
    hasError,
  } = useApiClient(apiClient);

  /**
   * 位置情報が解決された時の処理（進捗表示対応）
   */
  const handleLocationResolved = useCallback(async (coordinates: Coordinates) => {
    // 位置情報を状態に保存
    setAppState(prev => ({
      ...prev,
      currentLocation: coordinates,
      disasterInfo: null, // 新しい位置なので防災情報をリセット
    }));

    // 進捗表示を開始
    setProgressState({
      isVisible: true,
      current: 0,
      total: 6,
      currentTask: ''
    });

    try {
      // 順次取得でハザード情報を取得
      const hazardInfo = await apiClient.getHazardInfoProgressive(
        coordinates.latitude,
        coordinates.longitude,
        (current, total, currentType) => {
          setProgressState({
            isVisible: true,
            current,
            total,
            currentTask: currentType
          });
        }
      );

      // 進捗表示を非表示
      setProgressState(prev => ({ ...prev, isVisible: false }));

      // 結果を状態に保存
      const disasterInfo: DisasterInfoData = {
        coordinates: { ...coordinates },
        hazardInfo,
        shelters: [], // 後で実装
        disasterHistory: [], // 後で実装
        weatherAlerts: [], // 後で実装
        lastUpdated: new Date().toISOString(),
      };

      setAppState(prev => ({
        ...prev,
        disasterInfo,
      }));
    } catch (error) {
      // エラー時も進捗表示を非表示
      setProgressState(prev => ({ ...prev, isVisible: false }));
      console.error('ハザード情報の取得に失敗しました:', error);
    }
  }, []);

  /**
   * 位置情報入力コンポーネントからの位置解決要求処理
   */
  const handleLocationInputSubmit = useCallback(async (
    type: 'address' | 'coordinates' | 'geolocation',
    params: {
      address?: string;
      latitude?: number;
      longitude?: number;
    }
  ) => {
    const coordinates = await resolveLocation(type, params);
    
    if (coordinates) {
      await handleLocationResolved(coordinates);
    }
  }, [resolveLocation, handleLocationResolved]);

  /**
   * 地図表示の切り替え
   */
  const toggleMapView = useCallback(() => {
    setAppState(prev => ({
      ...prev,
      showMap: !prev.showMap,
    }));
  }, []);

  /**
   * エラーをクリアする
   */
  const handleClearErrors = useCallback(() => {
    clearLocationError();
    clearDisasterInfoError();
  }, [clearLocationError, clearDisasterInfoError]);

  /**
   * アプリケーションをリセットする
   */
  const handleReset = useCallback(() => {
    setAppState({
      currentLocation: null,
      disasterInfo: null,
      showMap: false,
    });
    handleClearErrors();
  }, [handleClearErrors]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>ハザード情報一括表示アプリ</h1>
        <p>住所、緯度経度、現在地から防災情報を取得します</p>
      </header>

      <main className="App-main">
        {/* 位置情報入力セクション */}
        <section className="location-input-section">
          <LocationInputComponent
            onLocationSubmit={handleLocationInputSubmit}
            isLoading={locationLoadingState.isLoading}
            error={locationLoadingState.error || undefined}
            onClearError={clearLocationError}
          />
        </section>

        {/* エラー表示セクション */}
        {hasError && (
          <section className="error-section">
            <div className="error-container">
              <h3>エラーが発生しました</h3>
              {locationLoadingState.error && (
                <p className="error-message">位置情報: {locationLoadingState.error}</p>
              )}
              {disasterInfoLoadingState.error && (
                <p className="error-message">防災情報: {disasterInfoLoadingState.error}</p>
              )}
              <button 
                className="error-clear-button"
                onClick={handleClearErrors}
              >
                エラーをクリア
              </button>
            </div>
          </section>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <section className="loading-section">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>
                {locationLoadingState.isLoading && '位置情報を取得中...'}
                {disasterInfoLoadingState.isLoading && '防災情報を取得中...'}
              </p>
            </div>
          </section>
        )}

        {/* 現在の位置情報表示 */}
        {appState.currentLocation && (
          <section className="current-location-section">
            <div className="current-location-container">
              <h3>現在の位置</h3>
              <div className="location-details">
                <p>
                  <strong>緯度:</strong> {appState.currentLocation.latitude.toFixed(6)}
                </p>
                <p>
                  <strong>経度:</strong> {appState.currentLocation.longitude.toFixed(6)}
                </p>
                {appState.currentLocation.address && (
                  <p>
                    <strong>住所:</strong> {appState.currentLocation.address}
                  </p>
                )}
                <p>
                  <strong>取得方法:</strong> {
                    appState.currentLocation.source === 'address' ? '住所' :
                    appState.currentLocation.source === 'coordinates' ? '緯度経度' :
                    appState.currentLocation.source === 'geolocation' ? '現在地' : '不明'
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 防災情報表示セクション */}
        {appState.disasterInfo && (
          <section className="disaster-info-section">
            <div className="disaster-info-header">
              <h3>防災情報</h3>
              <div className="disaster-info-controls">
                <button 
                  className="map-toggle-button"
                  onClick={toggleMapView}
                >
                  {appState.showMap ? '地図を非表示' : '地図を表示'}
                </button>
                <button 
                  className="reset-button"
                  onClick={handleReset}
                >
                  リセット
                </button>
              </div>
            </div>

            {/* 地図表示 */}
            {appState.showMap && appState.currentLocation && (
              <div className="map-container">
                <MapComponent
                  center={appState.currentLocation}
                  hazardInfo={appState.disasterInfo.hazardInfo}
                  shelters={appState.disasterInfo.shelters}
                />
              </div>
            )}

            {/* 防災情報詳細表示 */}
            <div className="disaster-info-details">
              <DisasterInfoDisplayComponent
                data={appState.disasterInfo}
                loading={disasterInfoLoadingState.isLoading}
                error={disasterInfoLoadingState.error || undefined}
                onRetry={clearDisasterInfoError}
              />
            </div>
          </section>
        )}

        {/* 使用方法セクション */}
        {!appState.currentLocation && !isLoading && !hasError && (
          <section className="usage-section">
            <div className="usage-container">
              <h3>使用方法</h3>
              <div className="usage-steps">
                <div className="usage-step">
                  <h4>1. 位置情報を入力</h4>
                  <p>住所、緯度経度、または現在地から位置を指定してください。</p>
                </div>
                <div className="usage-step">
                  <h4>2. 防災情報を確認</h4>
                  <p>指定した位置のハザード情報、避難所、災害履歴などを確認できます。</p>
                </div>
                <div className="usage-step">
                  <h4>3. 地図で詳細確認</h4>
                  <p>地図表示ボタンで位置と防災情報を地図上で確認できます。</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="App-footer">
        <p>
          &copy; 2025 ハザード情報一括表示アプリ - 
          データ提供: 国土交通省、地理院
        </p>
      </footer>

      {/* 進捗表示オーバーレイ */}
      <ProgressIndicator
        current={progressState.current}
        total={progressState.total}
        currentTask={progressState.currentTask}
        isVisible={progressState.isVisible}
      />
    </div>
  );
}

export default App;