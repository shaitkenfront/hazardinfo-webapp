// import React from 'react'; // unused in test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocationInputComponent, LocationInputComponentProps } from '../LocationInputComponent';
import { GeolocationService } from '../../services/GeolocationService';

// GeolocationServiceのモック
vi.mock('../../services/GeolocationService');

describe('LocationInputComponent', () => {
  const mockOnLocationSubmit = vi.fn();
  // const mockOnError = vi.fn(); // unused
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
      expect(screen.getByLabelText('住所で検索')).toBeChecked();
      expect(screen.getByLabelText('緯度経度で検索')).not.toBeChecked();
      expect(screen.getByLabelText('SUUMO URLで検索')).not.toBeChecked();
      expect(screen.getByLabelText('現在地を取得')).not.toBeChecked();
    });

    it('デフォルトで住所入力フォームが表示される', () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      expect(screen.getByLabelText('住所')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例: 東京都千代田区丸の内1-1-1')).toBeInTheDocument();
    });

    it('送信ボタンが表示される', () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: '防災情報を検索' })).toBeInTheDocument();
    });
  });

  describe('入力方式の切り替え', () => {
    it('緯度経度入力に切り替えできる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('緯度経度で検索'));
      
      expect(screen.getByLabelText('緯度経度で検索')).toBeChecked();
      expect(screen.getByLabelText('緯度')).toBeInTheDocument();
      expect(screen.getByLabelText('経度')).toBeInTheDocument();
    });

    it('SUUMO URL入力に切り替えできる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('SUUMO URLで検索'));
      
      expect(screen.getByLabelText('SUUMO URLで検索')).toBeChecked();
      expect(screen.getByLabelText('SUUMO URL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('例: https://suumo.jp/...')).toBeInTheDocument();
    });

    it('現在地取得に切り替えできる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('現在地を取得'));
      
      expect(screen.getByLabelText('現在地を取得')).toBeChecked();
      expect(screen.getByText('現在地を取得して防災情報を表示します。位置情報の使用を許可してください。')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '現在地を取得' })).toBeInTheDocument();
    });
  });

  describe('住所入力のバリデーション', () => {
    it('空の住所でエラーメッセージが表示される', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      const addressInput = screen.getByLabelText('住所');
      fireEvent.change(addressInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('住所を入力してください')).toBeInTheDocument();
      });
    });

    it('短すぎる住所でエラーメッセージが表示される', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      const addressInput = screen.getByLabelText('住所');
      fireEvent.change(addressInput, { target: { value: 'ab' } });
      
      await waitFor(() => {
        expect(screen.getByText('住所は3文字以上で入力してください')).toBeInTheDocument();
      });
    });

    it('有効な住所でエラーメッセージが表示されない', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      const addressInput = screen.getByLabelText('住所');
      fireEvent.change(addressInput, { target: { value: '東京都千代田区' } });
      
      await waitFor(() => {
        expect(screen.queryByText('住所を入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('住所は3文字以上で入力してください')).not.toBeInTheDocument();
      });
    });
  });

  describe('緯度経度入力のバリデーション', () => {
    beforeEach(() => {
      render(<LocationInputComponent {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('緯度経度で検索'));
    });

    it('空の緯度でエラーメッセージが表示される', async () => {
      const latInput = screen.getByLabelText('緯度');
      fireEvent.change(latInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('緯度を入力してください')).toBeInTheDocument();
      });
    });

    it('無効な緯度でエラーメッセージが表示される', async () => {
      const latInput = screen.getByLabelText('緯度');
      fireEvent.change(latInput, { target: { value: '100' } });
      
      await waitFor(() => {
        expect(screen.getByText('緯度は-90から90の間の数値で入力してください')).toBeInTheDocument();
      });
    });

    it('日本国外の緯度でエラーメッセージが表示される', async () => {
      const latInput = screen.getByLabelText('緯度');
      fireEvent.change(latInput, { target: { value: '10' } });
      
      await waitFor(() => {
        expect(screen.getByText('日本国内の緯度（24-46度）を入力してください')).toBeInTheDocument();
      });
    });

    it('空の経度でエラーメッセージが表示される', async () => {
      const lngInput = screen.getByLabelText('経度');
      fireEvent.change(lngInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('経度を入力してください')).toBeInTheDocument();
      });
    });

    it('無効な経度でエラーメッセージが表示される', async () => {
      const lngInput = screen.getByLabelText('経度');
      fireEvent.change(lngInput, { target: { value: '200' } });
      
      await waitFor(() => {
        expect(screen.getByText('経度は-180から180の間の数値で入力してください')).toBeInTheDocument();
      });
    });

    it('日本国外の経度でエラーメッセージが表示される', async () => {
      const lngInput = screen.getByLabelText('経度');
      fireEvent.change(lngInput, { target: { value: '100' } });
      
      await waitFor(() => {
        expect(screen.getByText('日本国内の経度（129-146度）を入力してください')).toBeInTheDocument();
      });
    });

    it('有効な緯度経度でエラーメッセージが表示されない', async () => {
      const latInput = screen.getByLabelText('緯度');
      const lngInput = screen.getByLabelText('経度');
      
      fireEvent.change(latInput, { target: { value: '35.681236' } });
      fireEvent.change(lngInput, { target: { value: '139.767125' } });
      
      await waitFor(() => {
        expect(screen.queryByText('緯度を入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('緯度は-90から90の間の数値で入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('日本国内の緯度（24-46度）を入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('経度を入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('経度は-180から180の間の数値で入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('日本国内の経度（129-146度）を入力してください')).not.toBeInTheDocument();
      });
    });
  });

  describe('SUUMO URLのバリデーション', () => {
    beforeEach(() => {
      render(<LocationInputComponent {...defaultProps} />);
      fireEvent.click(screen.getByLabelText('SUUMO URLで検索'));
    });

    it('空のURLでエラーメッセージが表示される', async () => {
      const urlInput = screen.getByLabelText('SUUMO URL');
      fireEvent.change(urlInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('SUUMO URLを入力してください')).toBeInTheDocument();
      });
    });

    it('無効なURLでエラーメッセージが表示される', async () => {
      const urlInput = screen.getByLabelText('SUUMO URL');
      fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
      
      await waitFor(() => {
        expect(screen.getByText('有効なURLを入力してください')).toBeInTheDocument();
      });
    });

    it('SUUMO以外のURLでエラーメッセージが表示される', async () => {
      const urlInput = screen.getByLabelText('SUUMO URL');
      fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
      
      await waitFor(() => {
        expect(screen.getByText('有効なSUUMO URLを入力してください')).toBeInTheDocument();
      });
    });

    it('有効なSUUMO URLでエラーメッセージが表示されない', async () => {
      const urlInput = screen.getByLabelText('SUUMO URL');
      fireEvent.change(urlInput, { target: { value: 'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?ar=030&bs=040' } });
      
      await waitFor(() => {
        expect(screen.queryByText('SUUMO URLを入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('有効なURLを入力してください')).not.toBeInTheDocument();
        expect(screen.queryByText('有効なSUUMO URLを入力してください')).not.toBeInTheDocument();
      });
    });
  });

  describe('フォーム送信', () => {
    it('住所入力でフォーム送信が正しく動作する', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      const addressInput = screen.getByLabelText('住所');
      const submitButton = screen.getByRole('button', { name: '防災情報を検索' });
      
      fireEvent.change(addressInput, { target: { value: '東京都千代田区丸の内1-1-1' } });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      fireEvent.click(submitButton);
      
      expect(mockOnLocationSubmit).toHaveBeenCalledWith({
        latitude: 0,
        longitude: 0,
        address: '東京都千代田区丸の内1-1-1',
        source: 'address'
      });
    });

    it('緯度経度入力でフォーム送信が正しく動作する', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('緯度経度で検索'));
      
      const latInput = screen.getByLabelText('緯度');
      const lngInput = screen.getByLabelText('経度');
      const submitButton = screen.getByRole('button', { name: '防災情報を検索' });
      
      fireEvent.change(latInput, { target: { value: '35.681236' } });
      fireEvent.change(lngInput, { target: { value: '139.767125' } });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      fireEvent.click(submitButton);
      
      expect(mockOnLocationSubmit).toHaveBeenCalledWith({
        latitude: 35.681236,
        longitude: 139.767125,
        source: 'coordinates'
      });
    });

    it('SUUMO URL入力でフォーム送信が正しく動作する', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      fireEvent.click(screen.getByLabelText('SUUMO URLで検索'));
      
      const urlInput = screen.getByLabelText('SUUMO URL');
      const submitButton = screen.getByRole('button', { name: '防災情報を検索' });
      
      fireEvent.change(urlInput, { target: { value: 'https://suumo.jp/test' } });
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
      
      fireEvent.click(submitButton);
      
      expect(mockOnLocationSubmit).toHaveBeenCalledWith({
        latitude: 0,
        longitude: 0,
        address: 'https://suumo.jp/test',
        source: 'suumo'
      });
    });

    it('バリデーションエラーがある場合は送信されない', async () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      const addressInput = screen.getByLabelText('住所');
      const submitButton = screen.getByRole('button', { name: '防災情報を検索' });
      
      fireEvent.change(addressInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      
      fireEvent.click(submitButton);
      
      expect(mockOnLocationSubmit).not.toHaveBeenCalled();
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

    it.skip('disabledプロパティ（機能削除済み）', () => {
      // この機能は削除されました
    });
  });

  describe('リアルタイムバリデーション', () => {
    it('入力方式変更時にバリデーションエラーがクリアされる', () => {
      render(<LocationInputComponent {...defaultProps} />);
      
      // 住所入力でエラーを発生させる
      const addressInput = screen.getByLabelText('住所');
      fireEvent.change(addressInput, { target: { value: 'ab' } });
      
      // 入力方式を変更
      fireEvent.click(screen.getByLabelText('緯度経度で検索'));
      
      // エラーメッセージがクリアされることを確認
      expect(screen.queryByText('住所は3文字以上で入力してください')).not.toBeInTheDocument();
    });
  });
});