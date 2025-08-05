import React, { useState, useCallback, useEffect } from 'react';
import { GeolocationService } from '../services/GeolocationService';
import './LocationInputComponent.css';

export type InputType = 'addressOrCoordinates' | 'geolocation';

export interface ValidationError {
  field: string;
  message: string;
}

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

interface FormState {
  inputType: InputType;
  addressOrCoordinates: string;
}

export const LocationInputComponent: React.FC<LocationInputComponentProps> = ({
  onLocationSubmit,
  isLoading = false
}) => {
  const [formState, setFormState] = useState<FormState>({
    inputType: 'addressOrCoordinates',
    addressOrCoordinates: ''
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const geolocationService = new GeolocationService();

  const validateAddressOrCoordinates = useCallback((input: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const value = input.trim();
    if (!value) {
      errors.push({ field: 'addressOrCoordinates', message: '住所または緯度,経度を入力してください' });
    } else {
      const coordMatch = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (!coordMatch && value.length < 3) {
        errors.push({ field: 'addressOrCoordinates', message: '住所は3文字以上で入力してください' });
      }
    }
    return errors;
  }, []);

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

  const performValidation = useCallback(() => {
    let errors: ValidationError[] = [];
    switch (formState.inputType) {
      case 'addressOrCoordinates':
        errors = validateAddressOrCoordinates(formState.addressOrCoordinates);
        break;
      case 'geolocation':
        break;
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }, [formState, validateAddressOrCoordinates, validateCoordinates]);

  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleInputTypeChange = useCallback((inputType: InputType) => {
    updateFormState({ inputType });
    setValidationErrors([]);
  }, [updateFormState]);

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
      console.error('Geolocation error:', error);
    } finally {
      setIsGettingLocation(false);
    }
  }, [geolocationService, onLocationSubmit]);

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
        case 'addressOrCoordinates': {
          const value = formState.addressOrCoordinates.trim();
          const coordMatch = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
          if (coordMatch) {
            await onLocationSubmit('coordinates', {
              latitude: parseFloat(coordMatch[1]),
              longitude: parseFloat(coordMatch[2])
            });
          } else {
            await onLocationSubmit('address', { address: value });
          }
          break;
        }
        default:
          throw new Error('無効な入力方式です');
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  }, [formState, performValidation, handleGetCurrentLocation, onLocationSubmit]);

  useEffect(() => {
    if (formState.inputType !== 'geolocation') {
      const timeoutId = setTimeout(() => {
        performValidation();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [formState, performValidation]);

  const getFieldError = useCallback((field: string): string | undefined => {
    return validationErrors.find(error => error.field === field)?.message;
  }, [validationErrors]);

  const isFormDisabled = isLoading || isGettingLocation;
  const canSubmit = formState.inputType === 'geolocation' || validationErrors.length === 0;

  return (
    <div className="location-input-component">
      <h2>位置情報の入力</h2>
      <div className="input-type-selector">
        <label>
          <input
            type="radio"
            name="inputType"
            value="addressOrCoordinates"
            checked={formState.inputType === 'addressOrCoordinates'}
            onChange={() => handleInputTypeChange('addressOrCoordinates')}
            disabled={isFormDisabled}
          />
          住所・緯度経度で検索
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
        {formState.inputType === 'addressOrCoordinates' && (
          <div className="form-group">
            <label htmlFor="addressOrCoordinates">住所または緯度,経度</label>
            <input
              id="addressOrCoordinates"
              type="text"
              value={formState.addressOrCoordinates}
              onChange={(e) => updateFormState({ addressOrCoordinates: e.target.value })}
              placeholder="例: 東京都千代田区丸の内1-1-1 または 35.681236,139.767125"
              disabled={isFormDisabled}
              className={getFieldError('addressOrCoordinates') ? 'error' : ''}
            />
            {getFieldError('addressOrCoordinates') && (
              <span className="error-message">{getFieldError('addressOrCoordinates')}</span>
            )}
          </div>
        )}

        {formState.inputType === 'geolocation' && (
          <div className="form-group">
            <p>現在地を取得して防災情報を表示します。位置情報の使用を許可してください。</p>
          </div>
        )}

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
