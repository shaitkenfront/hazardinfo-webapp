const { DisasterInfoService } = require('./dist/services/DisasterInfoService.js');

async function testDisasterHistory() {
  const service = new DisasterInfoService();
  const coords = { latitude: 35.6762, longitude: 139.6503, source: 'coordinates' };

  try {
    const events = await service.getDisasterHistory(coords);
    console.log('災害履歴情報取得テスト:');
    console.log('取得件数:', events.length);
    console.log('最初の5件:');
    
    events.slice(0, 5).forEach((event, index) => {
      console.log(`${index + 1}. ${event.type} - ${event.severity} (${event.date.toLocaleDateString('ja-JP')})`);
      console.log(`   ${event.description}`);
      console.log(`   出典: ${event.source}`);
      console.log('');
    });

    // Test data organization and filtering
    console.log('データ整理・フィルタリングテスト:');
    console.log('- 日付順ソート確認:', events.length > 1 ? 
      events.every((event, i) => i === 0 || event.date <= events[i-1].date) : true);
    
    // Check for duplicates
    const duplicateCheck = new Set();
    let hasDuplicates = false;
    events.forEach(event => {
      const key = `${event.type}-${event.date.toDateString()}`;
      if (duplicateCheck.has(key)) {
        hasDuplicates = true;
      }
      duplicateCheck.add(key);
    });
    console.log('- 重複除去確認:', !hasDuplicates);
    
    // Check importance filtering
    const importanceMap = {
      '震度6弱': 10, '震度5強': 9, '震度5弱': 8, '震度4': 6, '震度3': 4,
      '大津波警報': 10, '津波警報': 8, '津波注意報': 6,
      '甚大': 9, '危険': 8, '中程度': 6, '警戒': 5, '軽微': 3, '注意': 3,
      '大規模': 8, '中規模': 6, '小規模': 4,
      'F2': 8, 'F1': 6, 'F0': 4,
      '暴風雪警報': 7, '大雪警報': 6, '大雪注意報': 4
    };
    
    const allImportant = events.every(event => {
      const importance = importanceMap[event.severity] || 1;
      return importance >= 3;
    });
    console.log('- 重要度フィルタリング確認:', allImportant);
    
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

testDisasterHistory();