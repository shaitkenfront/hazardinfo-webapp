// import React from 'react'; // unused in test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DisasterInfoDisplayComponent, DisasterInfoData } from '../DisasterInfoDisplayComponent';
import { HazardInfo, Shelter, DisasterEvent, WeatherAlert } from '../../types';

// テスト用のモックデータ
const mockHazardInfo: HazardInfo[] = [
  {
    type: 'flood',
    riskLevel: 'high',
    description: '洪水の危険性が高い地域です',
    source: '国土交通省',
    lastUpdated: new Date('2024-01-15T10:00:00Z'),
    detailUrl: 'https://example.com/flood-detail'
  },
  {
    type: 'earthquake',
    riskLevel: 'medium',
    description: '地震の危険性が中程度の地域です',
    source: '気象庁',
    lastUpdated: new Date('2024-01-10T15:30:00Z')
  }
];

const mockShelters: Shelter[] = [
  {
    name: '市民体育館',
    address: '東京都千代田区丸の内1-1-1',
    coordinates: {
      latitude: 35.681236,
      longitude: 139.767125,
      source: 'address'
    },
    capacity: 500,
    facilities: ['トイレ', '給水設備', '医療室'],
    distance: 250
  },
  {
    name: '区民センター',
    address: '東京都千代田区丸の内2-2-2',
    coordinates: {
      latitude: 35.682236,
      longitude: 139.768125,
      source: 'address'
    },
    capacity: 300,
    facilities: ['トイレ', '給水設備'],
    distance: 1200
  }
];

const mockDisasterHistory: DisasterEvent[] = [
  {
    type: '台風19号',
    date: new Date('2019-10-12T12:00:00Z'),
    description: '記録的な大雨により河川が氾濫',
    severity: '甚大',
    source: '気象庁'
  },
  {
    type: '地震',
    date: new Date('2011-03-11T14:46:00Z'),
    description: 'マグニチュード9.0の大地震',
    severity: '甚大',
    source: '気象庁'
  }
];

const mockWeatherAlerts: WeatherAlert[] = [
  {
    type: '大雨警報',
    level: 'warning',
    description: '土砂災害や低い土地の浸水、河川の増水に警戒してください',
    issuedAt: new Date('2024-01-20T08:00:00Z'),
    validUntil: new Date('2024-01-20T18:00:00Z'),
    area: '東京都千代田区'
  },
  {
    type: '強風注意報',
    level: 'advisory',
    description: '強風に注意してください',
    issuedAt: new Date('2024-01-20T06:00:00Z'),
    area: '東京都'
  }
];

const mockDisasterInfoData: DisasterInfoData = {
  coordinates: {
    latitude: 35.6762,
    longitude: 139.6503,
    address: '東京都千代田区丸の内1-1-1',
    source: 'address' as const
  },
  hazardInfo: mockHazardInfo,
  shelters: mockShelters,
  disasterHistory: mockDisasterHistory,
  weatherAlerts: mockWeatherAlerts,
  lastUpdated: '2024-01-20T12:00:00Z',
  location: {
    address: '東京都千代田区丸の内1-1-1',
    coordinates: {
      latitude: 35.681236,
      longitude: 139.767125
    }
  }
};

describe('DisasterInfoDisplayComponent', () => {
  describe('基本的な表示', () => {
    it('データが提供された場合、すべてのセクションが表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      expect(screen.getByText('防災情報')).toBeInTheDocument();
      expect(screen.getByText('気象警報・注意報')).toBeInTheDocument();
      expect(screen.getByText('ハザードマップ情報')).toBeInTheDocument();
      expect(screen.getByText('近隣の避難所')).toBeInTheDocument();
      expect(screen.getByText('過去の災害履歴')).toBeInTheDocument();
    });

    it('位置情報が正しく表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      expect(screen.getByText('東京都千代田区丸の内1-1-1')).toBeInTheDocument();
      expect(screen.getByText(/緯度: 35\.681236, 経度: 139\.767125/)).toBeInTheDocument();
    });

    it('データがnullの場合、適切なメッセージが表示される', () => {
      render(<DisasterInfoDisplayComponent data={null} />);

      expect(screen.getByText('防災情報を表示するには、位置情報を入力してください。')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中は適切なメッセージとスピナーが表示される', () => {
      render(<DisasterInfoDisplayComponent data={null} loading={true} />);

      expect(screen.getByText('防災情報を取得中...')).toBeInTheDocument();
      expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラーメッセージが表示される', () => {
      const errorMessage = 'APIエラーが発生しました';
      render(<DisasterInfoDisplayComponent data={null} error={errorMessage} />);

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('再試行ボタンが表示され、クリックできる', () => {
      const onRetry = vi.fn();
      render(<DisasterInfoDisplayComponent data={null} error="エラー" onRetry={onRetry} />);

      const retryButton = screen.getByText('再試行');
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('ハザード情報', () => {
    it('ハザード情報がリスクレベル順に表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const hazardItems = screen.getAllByText(/洪水|地震/);
      // 高リスク（洪水）が先に表示される
      expect(hazardItems[0]).toHaveTextContent('洪水');
      expect(hazardItems[1]).toHaveTextContent('地震');
    });

    it('リスクレベルが正しく表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      expect(screen.getByText('高い')).toBeInTheDocument();
      expect(screen.getByText('中程度')).toBeInTheDocument();
    });

    it('ハザード情報の展開/折りたたみが機能する', async () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const floodHeader = screen.getByText('洪水').closest('.hazard-header');
      expect(floodHeader).toBeInTheDocument();

      // 初期状態では詳細は表示されていない
      expect(screen.queryByText('洪水の危険性が高い地域です')).not.toBeInTheDocument();

      // ヘッダーをクリックして展開
      fireEvent.click(floodHeader!);

      await waitFor(() => {
        expect(screen.getByText('洪水の危険性が高い地域です')).toBeInTheDocument();
        expect(screen.getByText('国土交通省')).toBeInTheDocument();
        expect(screen.getByText('詳細情報を見る')).toBeInTheDocument();
      });

      // 再度クリックして折りたたみ
      fireEvent.click(floodHeader!);

      await waitFor(() => {
        expect(screen.queryByText('洪水の危険性が高い地域です')).not.toBeInTheDocument();
      });
    });

    it('詳細URLがある場合、リンクが表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const floodHeader = screen.getByText('洪水').closest('.hazard-header');
      fireEvent.click(floodHeader!);

      const detailLink = screen.getByText('詳細情報を見る');
      expect(detailLink).toBeInTheDocument();
      expect(detailLink.closest('a')).toHaveAttribute('href', 'https://example.com/flood-detail');
      expect(detailLink.closest('a')).toHaveAttribute('target', '_blank');
    });

    it('ハザード情報がない場合、適切なメッセージが表示される', () => {
      const dataWithoutHazards = { ...mockDisasterInfoData, hazardInfo: [] };
      render(<DisasterInfoDisplayComponent data={dataWithoutHazards} />);

      expect(screen.getByText('ハザード情報はありません')).toBeInTheDocument();
    });
  });

  describe('避難所情報', () => {
    it('避難所が距離順に表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const shelterNames = screen.getAllByText(/市民体育館|区民センター/);
      // 近い順（市民体育館250m、区民センター1200m）
      expect(shelterNames[0]).toHaveTextContent('市民体育館');
      expect(shelterNames[1]).toHaveTextContent('区民センター');
    });

    it('距離が正しくフォーマットされて表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      expect(screen.getByText('250m')).toBeInTheDocument();
      expect(screen.getByText('1.2km')).toBeInTheDocument();
    });

    it('避難所の詳細情報が展開できる', async () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const shelterHeader = screen.getByText('市民体育館').closest('.shelter-header');
      fireEvent.click(shelterHeader!);

      await waitFor(() => {
        // 避難所の詳細セクション内の住所を確認
        const shelterDetails = document.querySelector('.shelter-details');
        expect(shelterDetails).toBeInTheDocument();
        expect(shelterDetails).toHaveTextContent('住所: 東京都千代田区丸の内1-1-1');
        expect(screen.getByText('500人')).toBeInTheDocument();
        expect(screen.getByText('トイレ')).toBeInTheDocument();
        expect(screen.getByText('給水設備')).toBeInTheDocument();
        expect(screen.getByText('医療室')).toBeInTheDocument();
      });
    });

    it('避難所がない場合、適切なメッセージが表示される', () => {
      const dataWithoutShelters = { ...mockDisasterInfoData, shelters: [] };
      render(<DisasterInfoDisplayComponent data={dataWithoutShelters} />);

      expect(screen.getByText('近隣の避難所情報はありません')).toBeInTheDocument();
    });
  });

  describe('災害履歴', () => {
    it('災害履歴が日付順（新しい順）に表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      // 災害履歴セクション内のh4要素を取得
      const historySection = screen.getByText('過去の災害履歴').closest('.info-section');
      const historyHeaders = historySection?.querySelectorAll('h4');
      
      // 新しい順（台風19号 2019年、地震 2011年）
      expect(historyHeaders?.[0]).toHaveTextContent('台風19号');
      expect(historyHeaders?.[1]).toHaveTextContent('地震');
    });

    it('災害履歴の詳細情報が展開できる', async () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const historyHeader = screen.getByText('台風19号').closest('.history-header');
      fireEvent.click(historyHeader!);

      await waitFor(() => {
        expect(screen.getByText('記録的な大雨により河川が氾濫')).toBeInTheDocument();
        expect(screen.getByText('甚大')).toBeInTheDocument();
      });
    });

    it('災害履歴がない場合、適切なメッセージが表示される', () => {
      const dataWithoutHistory = { ...mockDisasterInfoData, disasterHistory: [] };
      render(<DisasterInfoDisplayComponent data={dataWithoutHistory} />);

      expect(screen.getByText('過去の災害履歴はありません')).toBeInTheDocument();
    });
  });

  describe('気象警報', () => {
    it('気象警報がレベル順に表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const alertItems = screen.getAllByText(/大雨警報|強風注意報/);
      // 警報レベル順（警報 > 注意報）
      expect(alertItems[0]).toHaveTextContent('大雨警報');
      expect(alertItems[1]).toHaveTextContent('強風注意報');
    });

    it('警報レベルが正しく表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      expect(screen.getByText('警報')).toBeInTheDocument();
      expect(screen.getByText('注意報')).toBeInTheDocument();
    });

    it('気象警報の詳細情報が展開できる', async () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const alertHeader = screen.getByText('大雨警報').closest('.alert-header');
      fireEvent.click(alertHeader!);

      await waitFor(() => {
        expect(screen.getByText('土砂災害や低い土地の浸水、河川の増水に警戒してください')).toBeInTheDocument();
        expect(screen.getByText('東京都千代田区')).toBeInTheDocument();
      });
    });

    it('気象警報がない場合、適切なメッセージが表示される', () => {
      const dataWithoutAlerts = { ...mockDisasterInfoData, weatherAlerts: [] };
      render(<DisasterInfoDisplayComponent data={dataWithoutAlerts} />);

      expect(screen.getByText('現在発令中の気象警報はありません')).toBeInTheDocument();
    });
  });

  describe('日付フォーマット', () => {
    it('日付が正しい形式で表示される', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      // ハザード情報の更新日時を確認
      const floodHeader = screen.getByText('洪水').closest('.hazard-header');
      fireEvent.click(floodHeader!);

      // 日本語形式の日付が表示されることを確認
      expect(screen.getByText(/2024年1月15日/)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('展開ボタンにアクセシブルなテキストが含まれている', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const expandButtons = screen.getAllByText('▶');
      expect(expandButtons.length).toBeGreaterThan(0);
    });

    it('外部リンクが新しいタブで開く設定になっている', () => {
      render(<DisasterInfoDisplayComponent data={mockDisasterInfoData} />);

      const floodHeader = screen.getByText('洪水').closest('.hazard-header');
      fireEvent.click(floodHeader!);

      const detailLink = screen.getByText('詳細情報を見る').closest('a');
      expect(detailLink).toHaveAttribute('target', '_blank');
      expect(detailLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});