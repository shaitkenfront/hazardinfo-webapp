import React, { useState, useCallback, useEffect } from 'react';
import { GeolocationService } from '../services/GeolocationService';
import './LocationInputComponent.css';

/**
 * 入力方式の種類
 */
export type InputType = 'address' | 'coordinates' | 'geolocation';

/**
 * バリデーションエラーの種類
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * LocationInputComponentのProps
 */
export interface LocationInputComponentProps {
  onLocationSubmit: (
    type: 'address' | 'coordinates' | 'geolocation',
    params: {
      address?: string;
      latitude?: number;
      longitude?: number;
    }
  ) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  onClearError?: () => void;
}

/**
 * 入力フォームの状態
 */
interface FormState {
  inputType: InputType;
  address: string;
  latitude: string;
  longitude: string;
}

/**
 * 位置情報入力コンポーネント
 */
export const LocationInputComponent: React.FC<LocationInputComponentProps> = ({
  onLocationSubmit,
  isLoading = false
}) => {
  const [formState, setFormState] = useState<FormState>({
    inputType: 'address',
    address: '',
    latitude: '',
    longitude: ''
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const geolocationService = new GeolocationService();

  /**
   * 住所のバリデーション
   */
  const validateAddress = useCallback((address: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!address.trim()) {
      errors.push({ field: 'address', message: '住所を入力してください' });
    } else if (address.trim().length < 3) {
      errors.push({ field: 'address', message: '住所は3文字以上で入力してください' });
    }
    
    return errors;
  }, []);

  /**
   * 緯度経度のバリデーション
   */
  const validateCoordinates = useCallback((lat: string, lng: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    if (!lat.trim()) {
      errors.push({ field: 'latitude', message: '緯度を入力してください' });
    } else {
      const latNum = parseFloat(lat);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        errors.push({ field: 'latitude', message: '緯度は-90から90の間の数値で入力してください' });
      } else if (latNum < 24 || latNum > 46) {
        errors.push({ field: 'latitude', message: '日本国内の緯度（24-46度）を入力してください' });
      }
    }
    
    if (!lng.trim()) {
      errors.push({ field: 'longitude', message: '経度を入力してください' });
    } else {
      const lngNum = parseFloat(lng);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        errors.push({ field: 'longitude', message: '経度は-180から180の間の数値で入力してください' });
      } else if (lngNum < 129 || lngNum > 146) {
        errors.push({ field: 'longitude', message: '日本国内の経度（129-146度）を入力してください' });
      }
    }
    
    return errors;
  }, []);



  /**
   * リアルタイムバリデーション
   */
  const performValidation = useCallback(() => {
    let errors: ValidationError[] = [];
    
    switch (formState.inputType) {
      case 'address':
        errors = validateAddress(formState.address);
        break;
      case 'coordinates':
        errors = validateCoordinates(formState.latitude, formState.longitude);
        break;
      case 'geolocation':
        // 現在地取得の場合はバリデーション不要
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [formState, validateAddress, validateCoordinates]);

  /**
   * フォーム状態の更新
   */
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 入力方式の変更
   */
  const handleInputTypeChange = useCallback((inputType: InputType) => {
    updateFormState({ inputType });
    setValidationErrors([]);
  }, [updateFormState]);

  /**
   * 現在地取得
   */
  const handleGetCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    setValidationErrors([]);
    
    try {
      const coordinates = await geolocationService.getCurrentLocation();
      await onLocationSubmit('geolocation', {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
    } catch (error) {
      // エラー処理は親コンポーネントで行われる
      console.error('Geolocation error:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [geolocationService, onLocationSubmit]);

  /**
   * フォーム送信
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formState.inputType === 'geolocation') {
      await handleGetCurrentLocation();
      return;
    }
    
    if (!performValidation()) {
      return;
    }
    
    try {
      switch (formState.inputType) {
        case 'address':
          await onLocationSubmit('address', {
            address: formState.address.trim()
          });
          break;
        case 'coordinates':
          await onLocationSubmit('coordinates', {
            latitude: parseFloat(formState.latitude),
            longitude: parseFloat(formState.longitude)
          });
          break;
        default:
          throw new Error('無効な入力方式です');
      }
    } catch (error) {
      // エラー処理は親コンポーネントで行われる
      console.error('Form submission error:', error);
    }
  }, [formState, performValidation, handleGetCurrentLocation, onLocationSubmit]);

  /**
   * リアルタイムバリデーションの実行
   */
  useEffect(() => {
    if (formState.inputType !== 'geolocation') {
      const timeoutId = setTimeout(() => {
        performValidation();
      }, 300); // 300ms のデバウンス
      
      return () => clearTimeout(timeoutId);
    }
  }, [formState, performValidation]);

  /**
   * エラーメッセージの取得
   */
  const getFieldError = useCallback((field: string): string | undefined => {
    return validationErrors.find(error => error.field === field)?.message;
  }, [validationErrors]);

  const isFormDisabled = isLoading || isGettingLocation;
  const canSubmit = formState.inputType === 'geolocation' || validationErrors.length === 0;

  return (
    <div className="location-input-component">
      <h2>位置情報の入力</h2>
      
      {/* 入力方式選択 */}
      <div className="input-type-selector">
        <label>
          <input
            type="radio"
            name="inputType"
            value="address"
            checked={formState.inputType === 'address'}
            onChange={() => handleInputTypeChange('address')}
            disabled={isFormDisabled}
          />
          住所で検索
        </label>
        <label>
          <input
            type="radio"
            name="inputType"
            value="coordinates"
            checked={formState.inputType === 'coordinates'}
            onChange={() => handleInputTypeChange('coordinates')}
            disabled={isFormDisabled}
          />
          緯度経度で検索
        </label>

        <label>
          <input
            type="radio"
            name="inputType"
            value="geolocation"
            checked={formState.inputType === 'geolocation'}
            onChange={() => handleInputTypeChange('geolocation')}
            disabled={isFormDisabled}
          />
          現在地を取得
        </label>
      </div>

      <form onSubmit={handleSubmit} className="location-form">
        {/* 住所入力 */}
        {formState.inputType === 'address' && (
          <div className="form-group">
            <label htmlFor="address">住所</label>
            <input
              id="address"
              type="text"
              value={formState.address}
              onChange={(e) => updateFormState({ address: e.target.value })}
              placeholder="例: 東京都千代田区丸の内1-1-1"
              disabled={isFormDisabled}
              className={getFieldError('address') ? 'error' : ''}
            />
            {getFieldError('address') && (
              <span className="error-message">{getFieldError('address')}</span>
            )}
          </div>
        )}

        {/* 緯度経度入力 */}
        {formState.inputType === 'coordinates' && (
          <>
            <div className="form-group">
              <label htmlFor="latitude">緯度</label>
              <input
                id="latitude"
                type="number"
                step="any"
                value={formState.latitude}
                onChange={(e) => updateFormState({ latitude: e.target.value })}
                placeholder="例: 35.681236"
                disabled={isFormDisabled}
                className={getFieldError('latitude') ? 'error' : ''}
              />
              {getFieldError('latitude') && (
                <span className="error-message">{getFieldError('latitude')}</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="longitude">経度</label>
              <input
                id="longitude"
                type="number"
                step="any"
                value={formState.longitude}
                onChange={(e) => updateFormState({ longitude: e.target.value })}
                placeholder="例: 139.767125"
                disabled={isFormDisabled}
                className={getFieldError('longitude') ? 'error' : ''}
              />
              {getFieldError('longitude') && (
                <span className="error-message">{getFieldError('longitude')}</span>
              )}
            </div>
          </>
        )}



        {/* 現在地取得の説明 */}
        {formState.inputType === 'geolocation' && (
          <div className="form-group">
            <p>現在地を取得して防災情報を表示します。位置情報の使用を許可してください。</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isFormDisabled || !canSubmit}
          className="submit-button"
        >
          {isGettingLocation ? '現在地を取得中...' : 
           isLoading ? '検索中...' : 
           formState.inputType === 'geolocation' ? '現在地を取得' : '防災情報を検索'}
        </button>
      </form>
    </div>
  );
};