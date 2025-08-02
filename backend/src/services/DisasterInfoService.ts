import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Coordinates, HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../types';

/**
 * ハザードマップAPI設定
 */
interface HazardMapApiConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
}

/**
 * 実際のハザードマップAPIレスポンス
 */
interface HazardMapApiResponse {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  source: string;
  input_type: string;
  hazard_info: {
    jshis_prob_50: {
      max_prob: number;
      center_prob: number;
    };
    jshis_prob_60: {
      max_prob: number;
      center_prob: number;
    };
    inundation_depth: {
      max_info: string;
      center_info: string;
    };
    tsunami_inundation: {
      max_info: string;
      center_info: string;
    };
    hightide_inundation: {
      max_info: string;
      center_info: string;
    };
    large_fill_land: {
      max_info: string;
      center_info: string;
    };
    landslide_hazard: {
      debris_flow: {
        max_info: string;
        center_info: string;
      };
      steep_slope: {
        max_info: string;
        center_info: string;
      };
      landslide: {
        max_info: string;
        center_info: string;
      };
    };
  };
  status: string;
}

/**
 * 外部API呼び出しエラー
 */
export class ExternalAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly apiName?: string
  ) {
    super(message);
    this.name = 'ExternalAPIError';
  }
}

/**
 * 防災情報サービスのインターフェース
 */
export interface IDisasterInfoService {
  getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]>;
  getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]>;
  getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]>;
  getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]>;
}

/**
 * 防災情報取得サービス
 */
export class DisasterInfoService implements IDisasterInfoService {
  private httpClient: AxiosInstance;
  private hazardMapApiConfig: HazardMapApiConfig;

  constructor() {
    // ハザードマップAPIの設定を環境変数から読み込み
    this.hazardMapApiConfig = {
      baseUrl: process.env.HAZARD_MAP_API_URL || 'http://localhost:3001/api/hazard',
      timeout: parseInt(process.env.HAZARD_MAP_API_TIMEOUT || '120000'), // 2分に延長
      headers: process.env.HAZARD_MAP_API_KEY ? {
        'Authorization': `Bearer ${process.env.HAZARD_MAP_API_KEY}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    };

    this.httpClient = axios.create({
      timeout: this.hazardMapApiConfig.timeout,
      headers: {
        'User-Agent': 'DisasterInfoApp/1.0',
        'Accept': 'application/json',
      },
    });

    // レスポンスインターセプターでエラーハンドリング
    this.httpClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response) {
          // サーバーからエラーレスポンスが返された場合
          throw new ExternalAPIError(
            `API request failed: ${error.response.status} ${error.response.statusText}`,
            error.response.status,
            error.config?.baseURL || 'unknown'
          );
        } else if (error.request) {
          // リクエストが送信されたが、レスポンスが受信されなかった場合
          throw new ExternalAPIError(
            'No response received from API',
            undefined,
            error.config?.baseURL || 'unknown'
          );
        } else {
          // リクエスト設定中にエラーが発生した場合
          throw new ExternalAPIError(
            `Request setup error: ${error.message}`,
            undefined,
            'unknown'
          );
        }
      }
    );
  }

  /**
   * ハザードマップ情報を取得
   */
  async getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]> {
    try {
      // 外部ハザードマップAPIから情報を取得
      const apiResponse = await this.callHazardMapApi(coordinates);
      
      // APIレスポンスをHazardInfo型に変換
      const hazardInfos = await this.parseHazardMapApiResponse(apiResponse);
      
      return hazardInfos;
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        // タイムアウトや接続エラーの場合、より分かりやすいメッセージに変換
        if (error.message.includes('timeout') || error.message.includes('No response')) {
          throw new ExternalAPIError(
            'ハザードマップAPIの応答に時間がかかりすぎています。しばらく時間をおいてから再度お試しください。',
            error.statusCode,
            error.apiName
          );
        } else if (error.statusCode === 504) {
          throw new ExternalAPIError(
            'ハザードマップAPIサーバーが過負荷状態です。しばらく時間をおいてから再度お試しください。',
            error.statusCode,
            error.apiName
          );
        }
        throw error;
      }
      throw new ExternalAPIError(
        `ハザードマップ情報の取得に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        undefined,
        'hazard-map-api'
      );
    }
  }

  /**
   * ハザードマップAPIを呼び出し（リトライ機能付き）
   */
  private async callHazardMapApi(coordinates: Coordinates): Promise<HazardMapApiResponse> {
    const maxRetries = 3;
    const retryDelay = 2000; // 2秒

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.hazardMapApiConfig.baseUrl}?lat=${coordinates.latitude}&lon=${coordinates.longitude}&datum=wgs84`;
        
        console.log(`ハザードマップAPI呼び出し (試行 ${attempt}/${maxRetries}): ${url}`);
        
        // 設定済みのhttpClientを使用してタイムアウトを確実に適用
        const response = await this.httpClient.get<HazardMapApiResponse>(url, {
          headers: this.hazardMapApiConfig.headers
        });
        
        console.log(`ハザードマップAPI呼び出し成功 (試行 ${attempt})`);
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        
        if (axios.isAxiosError(error)) {
          if (error.response) {
            const statusCode = error.response.status;
            const shouldRetry = statusCode >= 500 || statusCode === 408 || statusCode === 429;
            
            if (!isLastAttempt && shouldRetry) {
              console.log(`ハザードマップAPI エラー (${statusCode}) - ${retryDelay}ms後にリトライ (試行 ${attempt}/${maxRetries})`);
              await this.delay(retryDelay);
              continue;
            }
            
            throw new ExternalAPIError(
              `Hazard Map API error: ${error.response.status} ${error.response.statusText}`,
              error.response.status,
              'hazard-map-api'
            );
          } else if (error.request) {
            if (!isLastAttempt) {
              console.log(`ハザードマップAPI タイムアウト/接続エラー - ${retryDelay}ms後にリトライ (試行 ${attempt}/${maxRetries})`);
              await this.delay(retryDelay);
              continue;
            }
            
            throw new ExternalAPIError(
              'No response from Hazard Map API (timeout or connection error)',
              undefined,
              'hazard-map-api'
            );
          }
        }
        
        if (!isLastAttempt) {
          console.log(`ハザードマップAPI 未知のエラー - ${retryDelay}ms後にリトライ (試行 ${attempt}/${maxRetries})`);
          await this.delay(retryDelay);
          continue;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new ExternalAPIError(
          `Hazard Map API request failed: ${errorMessage}`,
          undefined,
          'hazard-map-api'
        );
      }
    }
    
    // このコードには到達しないはずですが、TypeScriptの型チェック用
    throw new ExternalAPIError(
      'Unexpected error: maximum retries exceeded',
      undefined,
      'hazard-map-api'
    );
  }

  /**
   * 指定されたミリ秒だけ待機
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ハザードマップAPIレスポンスをパース
   */
  private async parseHazardMapApiResponse(apiResponse: HazardMapApiResponse): Promise<HazardInfo[]> {
    try {
      if (apiResponse.status !== 'success') {
        throw new Error(`API response status is not success: ${apiResponse.status}`);
      }


      const hazardInfos: HazardInfo[] = [];
      const hazardInfo = apiResponse.hazard_info;
      const currentDate = new Date();
      
      // 地震リスク (J-SHIS 50年確率)
      const earthquakeInfo = this.parseEarthquakeRisk(hazardInfo.jshis_prob_50);
      if (earthquakeInfo) {
        hazardInfos.push({
          ...earthquakeInfo,
          source: '地震調査研究推進本部 (J-SHIS)',
          lastUpdated: currentDate,
          detailUrl: 'https://www.j-shis.bosai.go.jp/'
        });
      }
      
      // 洪水リスク (浸水深)
      const floodInfo = this.parseFloodRisk(hazardInfo.inundation_depth);
      if (floodInfo) {
        hazardInfos.push({
          ...floodInfo,
          source: '国土交通省ハザードマップポータルサイト',
          lastUpdated: currentDate,
          detailUrl: 'https://disaportal.gsi.go.jp/'
        });
      }
      
      // 津波リスク
      const tsunamiInfo = this.parseTsunamiRisk(hazardInfo.tsunami_inundation);
      if (tsunamiInfo) {
        hazardInfos.push({
          ...tsunamiInfo,
          source: '気象庁',
          lastUpdated: currentDate,
          detailUrl: 'https://www.jma.go.jp/jma/kishou/know/tsunami/'
        });
      }
      
      // 大規模盛土造成地リスク
      const largeFillInfo = this.parseLargeScaleFillRisk(hazardInfo.large_fill_land);
      if (largeFillInfo) {
        hazardInfos.push({
          ...largeFillInfo,
          source: '国土交通省国土政策局国土情報課',
          lastUpdated: new Date('2023-03-31'),
          detailUrl: 'https://www.mlit.go.jp/toshi/toshi_tobou_fr_000004.html'
        });
      }
      
      // 高潮浸水リスク
      const highTideInfo = this.parseHighTideRisk(hazardInfo.hightide_inundation);
      if (highTideInfo) {
        hazardInfos.push({
          ...highTideInfo,
          source: '国土交通省港湾局',
          lastUpdated: currentDate,
          detailUrl: 'https://www.mlit.go.jp/kowan/'
        });
      }
      
      // 土砂災害リスク
      const landslideInfos = this.parseLandslideRisks(hazardInfo.landslide_hazard);
      for (const landslideInfo of landslideInfos) {
        hazardInfos.push({
          ...landslideInfo,
          source: '国土交通省砂防部',
          lastUpdated: currentDate,
          detailUrl: 'https://www.mlit.go.jp/river/sabo/'
        });
      }
      
      return hazardInfos;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new ExternalAPIError(
        `Failed to parse Hazard Map API response: ${errorMessage}`,
        undefined,
        'hazard-map-api-parser'
      );
    }
  }

  /**
   * 地震リスクをパース
   */
  private parseEarthquakeRisk(jshisData: { max_prob: number; center_prob: number }): Pick<HazardInfo, 'type' | 'riskLevel' | 'description'> | null {
    const prob = Math.max(jshisData.max_prob, jshisData.center_prob);
    
    if (prob >= 0.8) {
      return {
        type: 'earthquake',
        riskLevel: 'very_high',
        description: `非常に高い地震リスクがあります。J-SHIS 50年確率: ${(prob * 100).toFixed(1)}%`
      };
    } else if (prob >= 0.6) {
      return {
        type: 'earthquake',
        riskLevel: 'high',
        description: `高い地震リスクがあります。J-SHIS 50年確率: ${(prob * 100).toFixed(1)}%`
      };
    } else if (prob >= 0.3) {
      return {
        type: 'earthquake',
        riskLevel: 'medium',
        description: `中程度の地震リスクがあります。J-SHIS 50年確率: ${(prob * 100).toFixed(1)}%`
      };
    }
    
    return null; // 低リスクの場合は返さない
  }

  /**
   * 洪水リスクをパース
   */
  private parseFloodRisk(inundationData: { max_info: string; center_info: string }): Pick<HazardInfo, 'type' | 'riskLevel' | 'description'> | null {
    const info = inundationData.max_info || inundationData.center_info;
    
    if (info.includes('5m以上') || info.includes('10m以上') || info.includes('20m以上')) {
      return {
        type: 'flood',
        riskLevel: 'very_high',
        description: `非常に高い洪水リスクがあります。想定浸水深: ${info}`
      };
    } else if (info.includes('3m以上') || info.includes('5m未満')) {
      return {
        type: 'flood',
        riskLevel: 'high',
        description: `高い洪水リスクがあります。想定浸水深: ${info}`
      };
    } else if (info.includes('1m以上') || info.includes('3m未満') || info.includes('0.5m以上')) {
      return {
        type: 'flood',
        riskLevel: 'medium',
        description: `中程度の洪水リスクがあります。想定浸水深: ${info}`
      };
    }
    
    return null; // 「浸水想定なし」や低リスクの場合
  }

  /**
   * 津波リスクをパース
   */
  private parseTsunamiRisk(tsunamiData: { max_info: string; center_info: string }): Pick<HazardInfo, 'type' | 'riskLevel' | 'description'> | null {
    const info = tsunamiData.max_info || tsunamiData.center_info;
    
    if (info === '浸水想定なし' || info === '情報なし') {
      return null; // 津波リスクなし
    }
    
    if (info.includes('5m以上') || info.includes('10m以上') || info.includes('20m以上')) {
      return {
        type: 'tsunami',
        riskLevel: 'very_high',
        description: `非常に高い津波リスクがあります。想定浸水深: ${info}`
      };
    } else if (info.includes('3m以上') || info.includes('5m未満')) {
      return {
        type: 'tsunami',
        riskLevel: 'high',
        description: `高い津波リスクがあります。想定浸水深: ${info}`
      };
    } else if (info.includes('1m以上') || info.includes('3m未満') || info.includes('0.5m以上')) {
      return {
        type: 'tsunami',
        riskLevel: 'medium',
        description: `中程度の津波リスクがあります。想定浸水深: ${info}`
      };
    }
    
    return null;
  }

  /**
   * 大規模盛土造成地リスクをパース
   */
  private parseLargeScaleFillRisk(fillData: { max_info: string; center_info: string }): Pick<HazardInfo, 'type' | 'riskLevel' | 'description'> | null {
    const info = fillData.max_info || fillData.center_info;
    
    
    if (info === '情報なし' || info === '該当なし' || info === '' || !info) {
      return null;
    }
    
    if (info.includes('警戒') || info.includes('危険')) {
      return {
        type: 'large_scale_fill',
        riskLevel: 'high',
        description: `大規模盛土造成地に指定されています。${info}`
      };
    } else if (info.includes('注意')) {
      return {
        type: 'large_scale_fill',
        riskLevel: 'medium',
        description: `大規模盛土造成地の可能性があります。${info}`
      };
    } else if (info === 'あり' || info.includes('あり')) {
      return {
        type: 'large_scale_fill',
        riskLevel: 'medium',
        description: '大規模盛土造成地に該当します。'
      };
    }
    
    // その他の値は medium として扱う
    return {
      type: 'large_scale_fill',
      riskLevel: 'medium',
      description: `大規模盛土造成地の情報があります。${info}`
    };
  }

  /**
   * 高潮浸水リスクをパース
   */
  private parseHighTideRisk(highTideData: { max_info: string; center_info: string }): Pick<HazardInfo, 'type' | 'riskLevel' | 'description'> | null {
    const info = highTideData.max_info || highTideData.center_info;
    
    if (info === '浸水想定なし' || info === '情報なし' || info === '' || !info) {
      return null; // 高潮浸水リスクなし
    }
    
    if (info.includes('5m以上') || info.includes('10m以上') || info.includes('20m以上')) {
      return {
        type: 'high_tide',
        riskLevel: 'very_high',
        description: `非常に高い高潮浸水リスクがあります。想定浸水深: ${info}`
      };
    } else if (info.includes('3m以上') || info.includes('5m未満')) {
      return {
        type: 'high_tide',
        riskLevel: 'high',
        description: `高い高潮浸水リスクがあります。想定浸水深: ${info}`
      };
    } else if (info.includes('1m以上') || info.includes('3m未満') || info.includes('0.5m以上')) {
      return {
        type: 'high_tide',
        riskLevel: 'medium',
        description: `中程度の高潮浸水リスクがあります。想定浸水深: ${info}`
      };
    }
    
    return null;
  }

  /**
   * 土砂災害リスクをパース
   */
  private parseLandslideRisks(landslideData: {
    debris_flow: { max_info: string; center_info: string };
    steep_slope: { max_info: string; center_info: string };
    landslide: { max_info: string; center_info: string };
  }): Array<Pick<HazardInfo, 'type' | 'riskLevel' | 'description'>> {
    const risks: Array<Pick<HazardInfo, 'type' | 'riskLevel' | 'description'>> = [];
    
    // 土石流、急傾斜地、地すべりのいずれかにリスクがある場合は土砂災害として統合
    const hasDebrisFlow = !landslideData.debris_flow.max_info.includes('該当なし');
    const hasSteepSlope = !landslideData.steep_slope.max_info.includes('該当なし');
    const hasLandslide = !landslideData.landslide.max_info.includes('該当なし');
    
    if (hasDebrisFlow || hasSteepSlope || hasLandslide) {
      const riskTypes = [];
      if (hasDebrisFlow) riskTypes.push('土石流');
      if (hasSteepSlope) riskTypes.push('急傾斜地崩壊');
      if (hasLandslide) riskTypes.push('地すべり');
      
      // 警戒区域や特別警戒区域の情報があるかチェック
      const allInfos = [
        landslideData.debris_flow.max_info,
        landslideData.steep_slope.max_info,
        landslideData.landslide.max_info
      ].join(' ');
      
      let riskLevel: 'medium' | 'high' | 'very_high' = 'medium';
      if (allInfos.includes('特別警戒区域')) {
        riskLevel = 'very_high';
      } else if (allInfos.includes('警戒区域')) {
        riskLevel = 'high';
      }
      
      risks.push({
        type: 'landslide',
        riskLevel,
        description: `土砂災害のリスクがあります。対象: ${riskTypes.join('、')}`
      });
    }
    
    return risks;
  }






  /**
   * 避難所情報を取得
   */
  async getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]> {
    try {
      // 実際の実装では自治体のオープンデータAPIや国土交通省のAPIを呼び出す
      // ここでは座標周辺の避難所をシミュレートして生成
      const shelters = await this.generateNearbyEvacuationShelters(coordinates);
      
      // 距離順にソート
      return shelters.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch evacuation shelters: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'shelter-api'
      );
    }
  }

  /**
   * 災害履歴情報を取得
   */
  async getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]> {
    try {
      // 実際の実装では気象庁や自治体のデータベースAPIを呼び出す
      // ここでは座標に基づいて過去の災害履歴をシミュレートして生成
      const rawDisasterEvents = await this.generateHistoricalDisasterEvents(coordinates);
      
      // データ整理とフィルタリングを実行
      const filteredEvents = this.filterAndOrganizeDisasterHistory(rawDisasterEvents);
      
      return filteredEvents;
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch disaster history: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'disaster-history-api'
      );
    }
  }

  /**
   * 気象警報情報を取得
   */
  async getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]> {
    // 基本実装 - 後続のタスクで詳細実装
    try {
      // TODO: 実際の外部API呼び出しを実装
      return [];
    } catch (error) {
      if (error instanceof ExternalAPIError) {
        throw error;
      }
      throw new ExternalAPIError(
        `Failed to fetch weather alerts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'weather-api'
      );
    }
  }

  /**
   * HTTPクライアントを取得（テスト用）
   */
  getHttpClient(): AxiosInstance {
    return this.httpClient;
  }


  // 避難所関連のメソッド

  /**
   * 指定座標周辺の避難所情報を生成
   */
  private async generateNearbyEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]> {
    const { latitude, longitude } = coordinates;
    const shelters: Shelter[] = [];

    // 実際の実装では自治体のオープンデータAPIを呼び出すが、
    // ここでは座標周辺の避難所をシミュレートして生成
    const shelterTemplates = [
      { name: '市民体育館', facilities: ['体育館', '駐車場', '医療室'] },
      { name: '小学校', facilities: ['体育館', '教室', '校庭'] },
      { name: '中学校', facilities: ['体育館', '教室', '校庭', 'プール'] },
      { name: '公民館', facilities: ['ホール', '会議室', '駐車場'] },
      { name: '地区センター', facilities: ['多目的室', '駐車場'] },
      { name: '高等学校', facilities: ['体育館', '教室', '校庭', '食堂'] },
      { name: 'コミュニティセンター', facilities: ['ホール', '会議室'] },
      { name: '総合病院', facilities: ['医療設備', '駐車場', 'ヘリポート'] }
    ];

    // 座標に基づいて決定論的に避難所数を決定
    const coordSeed = Math.abs(latitude * longitude * 1000) % 1000;
    const shelterCount = Math.floor(coordSeed % 6) + 5; // 5-10個

    for (let i = 0; i < shelterCount; i++) {
      // 座標に基づいて決定論的にテンプレートを選択
      const templateIndex = Math.floor(Math.abs((latitude + i) * (longitude + i) * 100)) % shelterTemplates.length;
      const template = shelterTemplates[templateIndex];
      
      // 座標に基づいて決定論的にオフセットを計算
      const latSeed = Math.abs(Math.sin((latitude + i) * 100));
      const lngSeed = Math.abs(Math.cos((longitude + i) * 100));
      
      const offsetLat = (latSeed - 0.5) * 0.09; // 約5km
      const offsetLng = (lngSeed - 0.5) * 0.09;
      
      const shelterLat = latitude + offsetLat;
      const shelterLng = longitude + offsetLng;
      
      const shelterCoordinates: Coordinates = {
        latitude: shelterLat,
        longitude: shelterLng,
        source: 'coordinates'
      };

      // 距離を計算
      const distance = this.calculateDistance(coordinates, shelterCoordinates);

      // 住所を生成（実際の実装では逆ジオコーディングAPIを使用）
      const address = this.generateAddress(shelterLat, shelterLng, i);

      // 座標に基づいて決定論的に名前のサフィックスを決定
      const nameSuffix = i > 0 ? ` ${Math.floor(Math.abs(latitude * longitude * (i + 1) * 100)) % 20 + 1}` : '';

      const shelter: Shelter = {
        name: `${template.name}${nameSuffix}`,
        address,
        coordinates: shelterCoordinates,
        capacity: this.generateCapacity(template.name, latitude, longitude, i),
        facilities: [...template.facilities],
        distance: Math.round(distance * 100) / 100 // 小数点第2位まで
      };

      shelters.push(shelter);
    }

    return shelters;
  }

  /**
   * 2点間の距離を計算（ハーバーサイン公式）
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // 地球の半径（km）
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLng = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * 度をラジアンに変換
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 避難所の収容人数を生成
   */
  private generateCapacity(facilityType: string, latitude: number, longitude: number, index: number): number {
    const capacityMap: { [key: string]: [number, number] } = {
      '市民体育館': [800, 1200],
      '小学校': [300, 600],
      '中学校': [400, 800],
      '公民館': [150, 300],
      '地区センター': [100, 200],
      '高等学校': [500, 1000],
      'コミュニティセンター': [80, 150],
      '総合病院': [200, 400]
    };

    const [min, max] = capacityMap[facilityType] || [100, 300];
    
    // 座標に基づいて決定論的に収容人数を決定
    const capacitySeed = Math.abs(Math.sin((latitude + index) * (longitude + index) * 50));
    return Math.floor(capacitySeed * (max - min + 1)) + min;
  }

  /**
   * 住所を生成（実際の実装では逆ジオコーディングAPIを使用）
   */
  private generateAddress(lat: number, lng: number, index: number): string {
    // 簡易的な住所生成（実際の実装では逆ジオコーディングAPIを使用）
    const prefectures = ['東京都', '神奈川県', '千葉県', '埼玉県', '大阪府', '愛知県', '福岡県'];
    const cities = ['中央区', '港区', '新宿区', '渋谷区', '世田谷区', '練馬区', '足立区'];
    const towns = ['本町', '中町', '東町', '西町', '南町', '北町', '緑町'];
    
    const prefIndex = Math.floor(Math.abs(lat * lng * 100)) % prefectures.length;
    const cityIndex = Math.floor(Math.abs(lat * 100)) % cities.length;
    const townIndex = Math.floor(Math.abs(lng * 100)) % towns.length;
    const chome = Math.floor(Math.abs(lat * lng * 1000)) % 5 + 1;
    const banchi = Math.floor(Math.abs(lat * lng * 10000)) % 20 + 1;
    
    return `${prefectures[prefIndex]}${cities[cityIndex]}${towns[townIndex]}${chome}-${banchi}`;
  }

  // 災害履歴関連のメソッド

  /**
   * 過去の災害イベント情報を生成
   */
  private async generateHistoricalDisasterEvents(coordinates: Coordinates): Promise<DisasterEvent[]> {
    const { latitude, longitude } = coordinates;
    const events: DisasterEvent[] = [];

    // 実際の実装では気象庁や自治体のデータベースAPIを呼び出す
    // ここでは座標に基づいて過去の災害履歴をシミュレートして生成

    // 災害タイプのテンプレート
    const disasterTypes = [
      { type: '台風', severities: ['軽微', '中程度', '甚大'], sources: ['気象庁', '自治体'] },
      { type: '豪雨', severities: ['注意', '警戒', '危険'], sources: ['気象庁', '河川事務所'] },
      { type: '地震', severities: ['震度3', '震度4', '震度5弱', '震度5強', '震度6弱'], sources: ['気象庁', '地震調査委員会'] },
      { type: '洪水', severities: ['小規模', '中規模', '大規模'], sources: ['国土交通省', '自治体'] },
      { type: '土砂災害', severities: ['小規模', '中規模', '大規模'], sources: ['国土交通省砂防部', '自治体'] },
      { type: '津波', severities: ['津波注意報', '津波警報', '大津波警報'], sources: ['気象庁'] },
      { type: '竜巻', severities: ['F0', 'F1', 'F2'], sources: ['気象庁'] },
      { type: '雪害', severities: ['大雪注意報', '大雪警報', '暴風雪警報'], sources: ['気象庁'] }
    ];

    // 座標に基づいて決定論的にイベント数を決定（過去20年分）
    const coordSeed = Math.abs(latitude * longitude * 10000) % 10000;
    const eventCount = Math.floor(coordSeed % 30) + 10; // 10-39個のイベント

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 20;

    for (let i = 0; i < eventCount; i++) {
      // 座標とインデックスに基づいて決定論的に災害タイプを選択
      const typeIndex = Math.floor(Math.abs((latitude + i) * (longitude + i) * 1000)) % disasterTypes.length;
      const disasterType = disasterTypes[typeIndex];

      // 年を決定論的に選択
      const yearSeed = Math.abs(Math.sin((latitude + i) * (longitude + i) * 200));
      const year = startYear + Math.floor(yearSeed * 20);

      // 月と日を決定論的に選択
      const monthSeed = Math.abs(Math.cos((latitude + i) * (longitude + i) * 300));
      const month = Math.floor(monthSeed * 12) + 1;
      const daySeed = Math.abs(Math.sin((latitude + i) * (longitude + i) * 400));
      const day = Math.floor(daySeed * 28) + 1; // 28日以内で安全

      // 重要度を決定論的に選択
      const severityIndex = Math.floor(Math.abs((latitude + i) * (longitude + i) * 500)) % disasterType.severities.length;
      const severity = disasterType.severities[severityIndex];

      // 情報源を決定論的に選択
      const sourceIndex = Math.floor(Math.abs((latitude + i) * (longitude + i) * 600)) % disasterType.sources.length;
      const source = disasterType.sources[sourceIndex];

      // 説明文を生成
      const description = this.generateDisasterEventDescription(disasterType.type, severity, year, month, day);

      const event: DisasterEvent = {
        type: disasterType.type,
        date: new Date(year, month - 1, day),
        description,
        severity,
        source
      };

      events.push(event);
    }

    return events;
  }

  /**
   * 災害履歴のデータ整理とフィルタリング
   */
  private filterAndOrganizeDisasterHistory(events: DisasterEvent[]): DisasterEvent[] {
    // 1. 重複する災害イベントを除去（同じ日付・同じタイプ）
    const uniqueEvents = this.removeDuplicateEvents(events);

    // 2. 重要度の高い災害を優先してフィルタリング
    const filteredEvents = this.filterByImportance(uniqueEvents);

    // 3. 最終的に日付順にソート（新しい順）
    const finalSortedEvents = filteredEvents.sort((a, b) => b.date.getTime() - a.date.getTime());

    // 4. 最大50件に制限
    return finalSortedEvents.slice(0, 50);
  }

  /**
   * 重複する災害イベントを除去
   */
  private removeDuplicateEvents(events: DisasterEvent[]): DisasterEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.type}-${event.date.toDateString()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 重要度に基づいてイベントをフィルタリング
   */
  private filterByImportance(events: DisasterEvent[]): DisasterEvent[] {
    // 重要度の定義
    const importanceMap: { [key: string]: number } = {
      // 地震
      '震度6弱': 10,
      '震度5強': 9,
      '震度5弱': 8,
      '震度4': 6,
      '震度3': 4,
      
      // 津波
      '大津波警報': 10,
      '津波警報': 8,
      '津波注意報': 6,
      
      // 台風・豪雨
      '甚大': 9,
      '危険': 8,
      '中程度': 6,
      '警戒': 5,
      '軽微': 3,
      '注意': 3,
      
      // 洪水・土砂災害
      '大規模': 8,
      '中規模': 6,
      '小規模': 4,
      
      // 竜巻
      'F2': 8,
      'F1': 6,
      'F0': 4,
      
      // 雪害
      '暴風雪警報': 7,
      '大雪警報': 6,
      '大雪注意報': 4
    };

    // 重要度でソート
    const sortedByImportance = events.sort((a, b) => {
      const importanceA = importanceMap[a.severity] || 1;
      const importanceB = importanceMap[b.severity] || 1;
      
      if (importanceA !== importanceB) {
        return importanceB - importanceA; // 重要度の高い順
      }
      
      // 重要度が同じ場合は日付の新しい順
      return b.date.getTime() - a.date.getTime();
    });

    // 重要度3以上のイベントのみを返す
    return sortedByImportance.filter(event => {
      const importance = importanceMap[event.severity] || 1;
      return importance >= 3;
    });
  }

  /**
   * 災害イベントの説明文を生成
   */
  private generateDisasterEventDescription(type: string, severity: string, year: number, month: number, day: number): string {
    const dateStr = `${year}年${month}月${day}日`;
    
    switch (type) {
      case '台風':
        return `${dateStr}に台風による被害が発生しました。被害規模: ${severity}`;
      case '豪雨':
        return `${dateStr}に豪雨による被害が発生しました。警戒レベル: ${severity}`;
      case '地震':
        return `${dateStr}に地震が発生しました。最大震度: ${severity}`;
      case '洪水':
        return `${dateStr}に洪水が発生しました。被害規模: ${severity}`;
      case '土砂災害':
        return `${dateStr}に土砂災害が発生しました。被害規模: ${severity}`;
      case '津波':
        return `${dateStr}に津波が発生しました。警報レベル: ${severity}`;
      case '竜巻':
        return `${dateStr}に竜巻が発生しました。強度: ${severity}`;
      case '雪害':
        return `${dateStr}に雪害が発生しました。警報レベル: ${severity}`;
      default:
        return `${dateStr}に${type}による被害が発生しました。規模: ${severity}`;
    }
  }
}