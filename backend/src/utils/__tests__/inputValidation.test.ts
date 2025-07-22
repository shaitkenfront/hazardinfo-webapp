import {
  InputValidationError,
  AddressValidator,
  CoordinatesValidator,
  SuumoUrlValidator
} from '../inputValidation';

describe('Input Validation', () => {
  describe('AddressValidator', () => {
    describe('validate', () => {
      it('should validate valid Japanese addresses', () => {
        const validAddresses = [
          '東京都新宿区西新宿2-8-1',
          '大阪府大阪市北区梅田1-1-1',
          '神奈川県横浜市中区本町1-1',
          '愛知県名古屋市中村区名駅1-1-1'
        ];

        validAddresses.forEach(address => {
          expect(() => AddressValidator.validate(address)).not.toThrow();
        });
      });

      it('should throw error for empty or short addresses', () => {
        expect(() => AddressValidator.validate('')).toThrow(InputValidationError);
        expect(() => AddressValidator.validate('ab')).toThrow(InputValidationError);
        expect(() => AddressValidator.validate('   ')).toThrow(InputValidationError);
      });

      it('should throw error for too long addresses', () => {
        const longAddress = 'a'.repeat(201);
        expect(() => AddressValidator.validate(longAddress)).toThrow(InputValidationError);
      });

      it('should throw error for non-Japanese addresses', () => {
        const nonJapaneseAddresses = [
          '123 Main Street, New York',
          'London, UK',
          'Paris, France'
        ];

        nonJapaneseAddresses.forEach(address => {
          expect(() => AddressValidator.validate(address)).toThrow(InputValidationError);
        });
      });

      it('should throw error for non-string input', () => {
        expect(() => AddressValidator.validate(null as any)).toThrow(InputValidationError);
        expect(() => AddressValidator.validate(123 as any)).toThrow(InputValidationError);
        expect(() => AddressValidator.validate({} as any)).toThrow(InputValidationError);
      });
    });

    describe('normalize', () => {
      it('should normalize addresses correctly', () => {
        expect(AddressValidator.normalize('  東京都新宿区  ')).toBe('東京都新宿区');
        expect(AddressValidator.normalize('東京都新宿区１－１－１')).toBe('東京都新宿区1-1-1');
        expect(AddressValidator.normalize('東京都  新宿区  西新宿')).toBe('東京都 新宿区 西新宿');
      });

      it('should handle invalid input gracefully', () => {
        expect(AddressValidator.normalize(null as any)).toBe('');
        expect(AddressValidator.normalize(undefined as any)).toBe('');
        expect(AddressValidator.normalize('')).toBe('');
      });
    });
  });

  describe('CoordinatesValidator', () => {
    describe('validate', () => {
      it('should validate valid Japanese coordinates', () => {
        const validCoordinates = [
          { lat: '35.6762', lng: '139.6503' }, // Tokyo
          { lat: '34.6937', lng: '135.5023' }, // Osaka
          { lat: '35.4437', lng: '139.6380' }  // Yokohama
        ];

        validCoordinates.forEach(({ lat, lng }) => {
          const result = CoordinatesValidator.validate(lat, lng);
          expect(result.latitude).toBeCloseTo(parseFloat(lat));
          expect(result.longitude).toBeCloseTo(parseFloat(lng));
        });
      });

      it('should throw error for invalid latitude', () => {
        expect(() => CoordinatesValidator.validate('91', '139.6503')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('-91', '139.6503')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('invalid', '139.6503')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('', '139.6503')).toThrow(InputValidationError);
      });

      it('should throw error for invalid longitude', () => {
        expect(() => CoordinatesValidator.validate('35.6762', '181')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('35.6762', '-181')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('35.6762', 'invalid')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('35.6762', '')).toThrow(InputValidationError);
      });

      it('should throw error for coordinates outside Japan', () => {
        // New York coordinates
        expect(() => CoordinatesValidator.validate('40.7128', '-74.0060')).toThrow(InputValidationError);
        // London coordinates
        expect(() => CoordinatesValidator.validate('51.5074', '-0.1278')).toThrow(InputValidationError);
      });

      it('should throw error for non-string input', () => {
        expect(() => CoordinatesValidator.validate(null as any, '139.6503')).toThrow(InputValidationError);
        expect(() => CoordinatesValidator.validate('35.6762', null as any)).toThrow(InputValidationError);
      });
    });

    describe('normalize', () => {
      it('should normalize coordinate strings correctly', () => {
        expect(CoordinatesValidator.normalize('  35.6762  ')).toBe('35.6762');
        expect(CoordinatesValidator.normalize('３５．６７６２')).toBe('35.6762');
        expect(CoordinatesValidator.normalize('１３９．６５０３')).toBe('139.6503');
      });

      it('should handle invalid input gracefully', () => {
        expect(CoordinatesValidator.normalize(null as any)).toBe('');
        expect(CoordinatesValidator.normalize(undefined as any)).toBe('');
        expect(CoordinatesValidator.normalize('')).toBe('');
      });
    });
  });

  describe('SuumoUrlValidator', () => {
    describe('validate', () => {
      it('should validate valid SUUMO URLs', () => {
        const validUrls = [
          'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?ar=030&bs=040&ta=13&sc=13101&cb=0.0&ct=9999999&et=9999999&cn=9999999&mb=0&mt=9999999&shkr1=03&shkr2=03&shkr3=03&shkr4=03&fw2=',
          'https://www.suumo.jp/jj/bukken/ichiran/JJ012FC001/?ar=030&bs=040&ta=13',
          'https://suumo.jp/ms/chuko/ichiran/TA13/',
          'https://suumo.jp/ikkodate/chuko/ichiran/TA13/'
        ];

        validUrls.forEach(url => {
          expect(() => SuumoUrlValidator.validate(url)).not.toThrow();
        });
      });

      it('should throw error for non-SUUMO URLs', () => {
        const invalidUrls = [
          'https://google.com',
          'https://yahoo.co.jp',
          'https://homes.co.jp/chintai/',
          'https://athome.co.jp'
        ];

        invalidUrls.forEach(url => {
          expect(() => SuumoUrlValidator.validate(url)).toThrow(InputValidationError);
        });
      });

      it('should throw error for HTTP URLs', () => {
        expect(() => SuumoUrlValidator.validate('http://suumo.jp/jj/chintai/ichiran/FR301FC001/')).toThrow(InputValidationError);
      });

      it('should throw error for invalid URL format', () => {
        const invalidUrls = [
          'not-a-url',
          'suumo.jp',
          'https://',
          ''
        ];

        invalidUrls.forEach(url => {
          expect(() => SuumoUrlValidator.validate(url)).toThrow(InputValidationError);
        });
      });

      it('should throw error for unsupported SUUMO paths', () => {
        const unsupportedUrls = [
          'https://suumo.jp/',
          'https://suumo.jp/about/',
          'https://suumo.jp/unsupported/path/'
        ];

        unsupportedUrls.forEach(url => {
          expect(() => SuumoUrlValidator.validate(url)).toThrow(InputValidationError);
        });
      });

      it('should throw error for non-string input', () => {
        expect(() => SuumoUrlValidator.validate(null as any)).toThrow(InputValidationError);
        expect(() => SuumoUrlValidator.validate(123 as any)).toThrow(InputValidationError);
        expect(() => SuumoUrlValidator.validate({} as any)).toThrow(InputValidationError);
      });
    });

    describe('normalize', () => {
      it('should normalize URLs correctly', () => {
        expect(SuumoUrlValidator.normalize('  https://suumo.jp/test  ')).toBe('https://suumo.jp/test');
        expect(SuumoUrlValidator.normalize('http://suumo.jp/test')).toBe('https://suumo.jp/test');
        expect(SuumoUrlValidator.normalize('suumo.jp/test')).toBe('https://suumo.jp/test');
      });

      it('should handle invalid input gracefully', () => {
        expect(SuumoUrlValidator.normalize(null as any)).toBe('');
        expect(SuumoUrlValidator.normalize(undefined as any)).toBe('');
        expect(SuumoUrlValidator.normalize('')).toBe('');
      });
    });

    describe('extractPropertyId', () => {
      it('should extract property ID from query parameters', () => {
        const url = 'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?bc=100001234567';
        expect(SuumoUrlValidator.extractPropertyId(url)).toBe('100001234567');
      });

      it('should extract property ID from path', () => {
        const url = 'https://suumo.jp/chintai/jnc_ABC123DEF/';
        expect(SuumoUrlValidator.extractPropertyId(url)).toBe('ABC123DEF');
      });

      it('should return null for URLs without property ID', () => {
        const url = 'https://suumo.jp/jj/chintai/ichiran/FR301FC001/';
        expect(SuumoUrlValidator.extractPropertyId(url)).toBeNull();
      });

      it('should return null for invalid URLs', () => {
        expect(SuumoUrlValidator.extractPropertyId('invalid-url')).toBeNull();
      });
    });
  });
});