// import React from 'react'; // unused in test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocationInputComponent, LocationInputComponentProps } from '../LocationInputComponent';
import { GeolocationService } from '../../services/GeolocationService';

// GeolocationServiceのモック
vi.mock('../../services/GeolocationService');

describe('LocationInputComponent', () => {
  const mockOnLocationSubmit = vi.fn();
  const mockGeolocationService = vi.mocked(GeolocationService);

  const defaultProps: LocationInputComponentProps = {
    onLocationSubmit: mockOnLocationSubmit,
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGeolocationService.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期レンダリング', () => {
    it('コンポーネントが正しくレンダリングされる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      expect(screen.getByText('位置情報の入力')).toBeInTheDocument();
      expect(screen.getByLabelText('住所・緯度経度で検索')).toBeChecked();
      expect(screen.getByLabelText('現在地を取得')).not.toBeChecked();
    });

    it('デフォルトで住所・緯度経度入力フォームが表示される', () => {
      render(<LocationInputComponent {...defaultProps} />);
      expect(screen.getByLabelText('住所または緯度,経度')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例: 東京都千代田区丸の内1-1-1 または 35.681236,139.767125')).toBeInTheDocument();
    });

    it('送信ボタンが表示される', () => {
      render(<LocationInputComponent {...defaultProps} />);
      expect(screen.getByRole('button', { name: '防災情報を検索' })).toBeInTheDocument();
    });
  });

  describe('入力方式の切り替え', () => {
    it('現在地取得に切り替えできる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('現在地を取得'));
      expect(screen.getByLabelText('現在地を取得')).toBeChecked();
      expect(screen.getByText('現在地を取得して防災情報を表示します。位置情報の使用を許可してください。')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '現在地を取得' })).toBeInTheDocument();
    });
  });

  describe('入力のバリデーション', () => {
    it('空入力でエラーメッセージが表示される', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      const input = screen.getByLabelText('住所または緯度,経度');
      fireEvent.change(input, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('住所または緯度,経度を入力してください')).toBeInTheDocument();
      });
    });

    it('短すぎる住所でエラーメッセージが表示される', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      const input = screen.getByLabelText('住所または緯度,経度');
      fireEvent.change(input, { target: { value: 'ab' } });
      await waitFor(() => {
        expect(screen.getByText('住所は3文字以上で入力してください')).toBeInTheDocument();
      });
    });

    it('正しい座標フォーマットなら住所長さチェックはしない', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      const input = screen.getByLabelText('住所または緯度,経度');
      fireEvent.change(input, { target: { value: '35.0,139.0' } });
      await waitFor(() => {
        expect(screen.queryByText('住所は3文字以上で入力してください')).not.toBeInTheDocument();
      });
    });
  });

  describe('フォーム送信', () => {
    it('住所として送信される', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      const input = screen.getByLabelText('住所または緯度,経度');
      const submitButton = screen.getByRole('button', { name: '防災情報を検索' });
      fireEvent.change(input, { target: { value: '東京都千代田区丸の内1-1-1' } });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);
      expect(mockOnLocationSubmit).toHaveBeenCalledWith('address', { address: '東京都千代田区丸の内1-1-1' });
    });

    it('座標として送信される', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      const input = screen.getByLabelText('住所または緯度,経度');
      const submitButton = screen.getByRole('button', { name: '防災情報を検索' });
      fireEvent.change(input, { target: { value: '35.681236,139.767125' } });
      await waitFor(() => expect(submitButton).not.toBeDisabled());
      fireEvent.click(submitButton);
      expect(mockOnLocationSubmit).toHaveBeenCalledWith('coordinates', { latitude: 35.681236, longitude: 139.767125 });
    });
  });

  describe('現在地取得', () => {
    it('現在地取得ボタンが表示される', () => {
      render(<LocationInputComponent {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('現在地を取得'));
      expect(screen.getByRole('button', { name: '現在地を取得' })).toBeInTheDocument();
      expect(screen.getByText('現在地を取得して防災情報を表示します。位置情報の使用を許可してください。')).toBeInTheDocument();
    });
  });

  describe('プロパティによる制御', () => {
    it('isLoadingプロパティでローディング状態が表示される', () => {
      render(<LocationInputComponent {...defaultProps} isLoading={true} />);
      expect(screen.getByRole('button', { name: '検索中...' })).toBeDisabled();
    });
  });

  describe('リアルタイムバリデーション', () => {
    it('入力方式変更時にバリデーションエラーがクリアされる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      const input = screen.getByLabelText('住所または緯度,経度');
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.click(screen.getByLabelText('現在地を取得'));
      expect(screen.queryByText('住所は3文字以上で入力してください')).not.toBeInTheDocument();
    });
  });
});
