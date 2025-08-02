const { DisasterInfoService } = require('./dist/services/DisasterInfoService');

async function testHazardInfo() {
  const service = new DisasterInfoService();
  
  const testCoordinates1 = {
    latitude: 35.6762,
    longitude: 139.6503,
    address: '東京都渋谷区',
    source: 'address'
  };

  const testCoordinates2 = {
    latitude: 34.6937,
    longitude: 135.5023,
    address: '大阪府大阪市',
    source: 'address'
  };

  try {
    console.log('Testing hazard map info retrieval for Tokyo...');
    const hazardInfo1 = await service.getHazardMapInfo(testCoordinates1);
    
    console.log(`Found ${hazardInfo1.length} hazard(s) for Tokyo:`);
    hazardInfo1.forEach((hazard, index) => {
      console.log(`\n${index + 1}. ${hazard.type.toUpperCase()}`);
      console.log(`   Risk Level: ${hazard.riskLevel}`);
      console.log(`   Description: ${hazard.description}`);
      console.log(`   Source: ${hazard.source}`);
      console.log(`   Last Updated: ${hazard.lastUpdated.toISOString().split('T')[0]}`);
      if (hazard.detailUrl) {
        console.log(`   Detail URL: ${hazard.detailUrl}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('Testing hazard map info retrieval for Osaka...');
    const hazardInfo2 = await service.getHazardMapInfo(testCoordinates2);
    
    console.log(`Found ${hazardInfo2.length} hazard(s) for Osaka:`);
    hazardInfo2.forEach((hazard, index) => {
      console.log(`\n${index + 1}. ${hazard.type.toUpperCase()}`);
      console.log(`   Risk Level: ${hazard.riskLevel}`);
      console.log(`   Description: ${hazard.description}`);
      console.log(`   Source: ${hazard.source}`);
      console.log(`   Last Updated: ${hazard.lastUpdated.toISOString().split('T')[0]}`);
      if (hazard.detailUrl) {
        console.log(`   Detail URL: ${hazard.detailUrl}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testHazardInfo();