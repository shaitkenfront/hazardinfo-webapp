// import React from 'react'; // unused in test
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DisasterInfoDisplayComponent, DisasterInfoData } from '../DisasterInfoDisplayComponent';
import { HazardInfo } from '../../types';

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

const mockData: DisasterInfoData = {
  coordinates: { latitude: 35.6762, longitude: 139.6503 },
  hazardInfo: mockHazardInfo,
  shelters: [],
  disasterHistory: [],
  weatherAlerts: [],
  lastUpdated: '2024-01-20T12:00:00Z',
  location: {
    address: '東京都千代田区丸の内1-1-1',
    coordinates: { latitude: 35.681236, longitude: 139.767125 }
  }
};

describe('DisasterInfoDisplayComponent (実装準拠)', () => {
  it('基本表示: 見出しと位置情報、ハザードセクションが表示される', () => {
    render(<DisasterInfoDisplayComponent data={mockData} />);
    expect(screen.getByText('防災情報')).toBeInTheDocument();
    expect(screen.getByText('東京都千代田区丸の内1-1-1')).toBeInTheDocument();
    expect(screen.getByText('ハザードマップ情報')).toBeInTheDocument();
  });

  it('ハザードがリスク順に表示され、展開で詳細が見える', async () => {
    render(<DisasterInfoDisplayComponent data={mockData} />);
    const hazardTitles = screen.getAllByRole('heading', { level: 4 });
    expect(hazardTitles[0]).toHaveTextContent('洪水');
    expect(hazardTitles[1]).toHaveTextContent('地震');

    const floodHeader = screen.getByText('洪水').closest('.hazard-header')!;
    fireEvent.click(floodHeader);
    await waitFor(() => {
      expect(screen.getByText('洪水の危険性が高い地域です')).toBeInTheDocument();
      expect(screen.getByText('国土交通省')).toBeInTheDocument();
      expect(screen.getByText('詳細情報を見る')).toBeInTheDocument();
    });
  });

  it('ハザードが空ならメッセージ表示', () => {
    render(<DisasterInfoDisplayComponent data={{ ...mockData, hazardInfo: [] }} />);
    expect(screen.getByText('ハザード情報はありません')).toBeInTheDocument();
  });

  it('ローディング表示', () => {
    render(<DisasterInfoDisplayComponent data={null} loading />);
    expect(screen.getByText('防災情報を取得中...')).toBeInTheDocument();
  });

  it('エラー表示と再試行ボタン', () => {
    const onRetry = () => {};
    render(<DisasterInfoDisplayComponent data={null} error={'エラー'} onRetry={onRetry} />);
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('データなしメッセージ', () => {
    render(<DisasterInfoDisplayComponent data={null} />);
    expect(screen.getByText('防災情報を表示するには、位置情報を入力してください。')).toBeInTheDocument();
  });
});
