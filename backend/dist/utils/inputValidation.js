"use strict";
/**
 * 入力バリデーション用のクラスとユーティリティ関数
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuumoUrlValidator = exports.CoordinatesValidator = exports.AddressValidator = exports.InputValidationError = void 0;
exports.validateLocationInput = validateLocationInput;
class InputValidationError extends Error {
    constructor(message, inputType) {
        super(message);
        this.inputType = inputType;
        this.name = 'InputValidationError';
    }
}
exports.InputValidationError = InputValidationError;
/**
 * 住所バリデーションクラス
 */
class AddressValidator {
    /**
     * 住所の基本的な形式をバリデーション
     */
    static validate(address) {
        if (!address || typeof address !== 'string') {
            throw new InputValidationError('住所は文字列である必要があります', 'address');
        }
        const trimmedAddress = address.trim();
        if (trimmedAddress.length < this.MIN_LENGTH) {
            throw new InputValidationError(`住所は${this.MIN_LENGTH}文字以上である必要があります`, 'address');
        }
        if (trimmedAddress.length > this.MAX_LENGTH) {
            throw new InputValidationError(`住所は${this.MAX_LENGTH}文字以下である必要があります`, 'address');
        }
        // 日本の住所として妥当かチェック
        if (!this.isJapaneseAddress(trimmedAddress)) {
            throw new InputValidationError('日本国内の住所を入力してください', 'address');
        }
        return true;
    }
    /**
     * 日本の住所として妥当かチェック
     */
    static isJapaneseAddress(address) {
        // 都道府県名が含まれているかチェック
        const hasPrefecture = this.PREFECTURES.some(prefecture => address.includes(prefecture));
        if (hasPrefecture) {
            return true;
        }
        // 市区町村を示す文字が含まれているかチェック
        const cityIndicators = ['市', '区', '町', '村'];
        const hasCityIndicator = cityIndicators.some(indicator => address.includes(indicator));
        // 番地や丁目を示す文字が含まれているかチェック
        const addressIndicators = ['丁目', '番地', '番', '号', '-'];
        const hasAddressIndicator = addressIndicators.some(indicator => address.includes(indicator));
        return hasCityIndicator || hasAddressIndicator;
    }
    /**
     * 住所を正規化（トリム、全角数字を半角に変換など）
     */
    static normalize(address) {
        if (!address || typeof address !== 'string') {
            return '';
        }
        return address
            .trim()
            .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
            .replace(/－/g, '-') // 全角ハイフンを半角に変換
            .replace(/\s+/g, ' ');
    }
}
exports.AddressValidator = AddressValidator;
AddressValidator.MIN_LENGTH = 3;
AddressValidator.MAX_LENGTH = 200;
// 日本の都道府県リスト
AddressValidator.PREFECTURES = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];
/**
 * 緯度経度バリデーションクラス
 */
class CoordinatesValidator {
    /**
     * 緯度経度の文字列をバリデーション
     */
    static validate(lat, lng) {
        const latitude = this.validateLatitude(lat);
        const longitude = this.validateLongitude(lng);
        // 日本国内の範囲チェック
        if (!this.isWithinJapan(latitude, longitude)) {
            throw new InputValidationError('日本国内の座標を入力してください', 'coordinates');
        }
        return { latitude, longitude };
    }
    /**
     * 緯度のバリデーション
     */
    static validateLatitude(lat) {
        if (!lat || typeof lat !== 'string') {
            throw new InputValidationError('緯度は文字列である必要があります', 'latitude');
        }
        const trimmedLat = lat.trim();
        const latitude = parseFloat(trimmedLat);
        if (isNaN(latitude)) {
            throw new InputValidationError('緯度は数値である必要があります', 'latitude');
        }
        if (latitude < -90 || latitude > 90) {
            throw new InputValidationError('緯度は-90から90の範囲で入力してください', 'latitude');
        }
        return latitude;
    }
    /**
     * 経度のバリデーション
     */
    static validateLongitude(lng) {
        if (!lng || typeof lng !== 'string') {
            throw new InputValidationError('経度は文字列である必要があります', 'longitude');
        }
        const trimmedLng = lng.trim();
        const longitude = parseFloat(trimmedLng);
        if (isNaN(longitude)) {
            throw new InputValidationError('経度は数値である必要があります', 'longitude');
        }
        if (longitude < -180 || longitude > 180) {
            throw new InputValidationError('経度は-180から180の範囲で入力してください', 'longitude');
        }
        return longitude;
    }
    /**
     * 日本国内の座標かチェック
     */
    static isWithinJapan(latitude, longitude) {
        // 日本のおおよその範囲
        const JAPAN_BOUNDS = {
            north: 45.557,
            south: 24.045,
            east: 145.817,
            west: 122.934
        };
        return latitude >= JAPAN_BOUNDS.south &&
            latitude <= JAPAN_BOUNDS.north &&
            longitude >= JAPAN_BOUNDS.west &&
            longitude <= JAPAN_BOUNDS.east;
    }
    /**
     * 座標文字列を正規化
     */
    static normalize(coordinate) {
        if (!coordinate || typeof coordinate !== 'string') {
            return '';
        }
        return coordinate
            .trim()
            .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
            .replace(/[．]/g, '.');
    }
}
exports.CoordinatesValidator = CoordinatesValidator;
/**
 * SUUMO URLバリデーションクラス
 */
class SuumoUrlValidator {
    /**
     * SUUMO URLをバリデーション
     */
    static validate(url) {
        if (!url || typeof url !== 'string') {
            throw new InputValidationError('URLは文字列である必要があります', 'suumo_url');
        }
        const trimmedUrl = url.trim();
        // URL形式の基本チェック
        let parsedUrl;
        try {
            parsedUrl = new URL(trimmedUrl);
        }
        catch {
            throw new InputValidationError('有効なURL形式で入力してください', 'suumo_url');
        }
        // HTTPSプロトコルチェック
        if (parsedUrl.protocol !== 'https:') {
            throw new InputValidationError('HTTPS URLを入力してください', 'suumo_url');
        }
        // SUUMOドメインチェック
        if (!this.SUUMO_DOMAINS.includes(parsedUrl.hostname)) {
            throw new InputValidationError('SUUMO（suumo.jp）のURLを入力してください', 'suumo_url');
        }
        // パスパターンチェック
        if (!this.isValidSuumoPath(parsedUrl.pathname)) {
            throw new InputValidationError('対応しているSUUMO物件ページのURLを入力してください', 'suumo_url');
        }
        return true;
    }
    /**
     * SUUMOの有効なパスかチェック
     */
    static isValidSuumoPath(pathname) {
        return this.VALID_PATH_PATTERNS.some(pattern => pattern.test(pathname));
    }
    /**
     * SUUMO URLを正規化
     */
    static normalize(url) {
        if (!url || typeof url !== 'string') {
            return '';
        }
        let trimmedUrl = url.trim();
        // httpをhttpsに変換
        if (trimmedUrl.startsWith('http://')) {
            trimmedUrl = trimmedUrl.replace('http://', 'https://');
        }
        // プロトコルが省略されている場合は追加
        if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('http://')) {
            trimmedUrl = 'https://' + trimmedUrl;
        }
        try {
            const parsedUrl = new URL(trimmedUrl);
            // 不要なクエリパラメータを削除（必要に応じて）
            return parsedUrl.toString();
        }
        catch {
            return trimmedUrl;
        }
    }
    /**
     * SUUMO URLから物件IDを抽出
     */
    static extractPropertyId(url) {
        try {
            const parsedUrl = new URL(url);
            // クエリパラメータから物件IDを抽出
            const bc = parsedUrl.searchParams.get('bc');
            if (bc) {
                return bc;
            }
            // 賃貸物件詳細ページのパスから物件IDを抽出
            const detailMatch = parsedUrl.pathname.match(/\/chintai\/jnc_([A-Z0-9]+)\//);
            if (detailMatch) {
                return detailMatch[1];
            }
            return null;
        }
        catch {
            return null;
        }
    }
}
exports.SuumoUrlValidator = SuumoUrlValidator;
SuumoUrlValidator.SUUMO_DOMAINS = [
    'suumo.jp',
    'www.suumo.jp'
];
SuumoUrlValidator.VALID_PATH_PATTERNS = [
    /\/jj\/chintai\/ichiran\/FR301FC001/, // 賃貸物件一覧
    /\/jj\/bukken\/ichiran\/JJ012FC001/, // 新築マンション
    /\/jj\/bukken\/ichiran\/JJ010FC001/, // 新築一戸建て
    /\/ms\/chuko\/ichiran\/TA13/, // 中古マンション
    /\/ikkodate\/chuko\/ichiran\/TA13/, // 中古一戸建て
    /\/chintai\/jnc_/, // 賃貸物件詳細
    /\/ms\/shinchiku\/ichiran/, // 新築マンション一覧
    /\/ikkodate\/shinchiku\/ichiran/, // 新築一戸建て一覧
    /\/chintai\/[a-zA-Z0-9_]+/ // 賃貸物件（地域別）
];
/**
 * 位置情報解決APIのリクエストをバリデーション
 */
function validateLocationInput(request) {
    const errors = [];
    // typeフィールドの必須チェック
    if (!request.type) {
        errors.push('typeフィールドは必須です');
        return { isValid: false, errors };
    }
    // 有効なtypeかチェック
    const validTypes = ['address', 'coordinates', 'suumo', 'geolocation'];
    if (!validTypes.includes(request.type)) {
        errors.push('typeは address, coordinates, suumo, geolocation のいずれかである必要があります');
        return { isValid: false, errors };
    }
    // タイプ別のバリデーション
    try {
        switch (request.type) {
            case 'address':
                if (!request.address) {
                    errors.push('addressフィールドは必須です');
                }
                else {
                    AddressValidator.validate(request.address);
                }
                break;
            case 'coordinates':
                if (request.latitude === undefined || request.longitude === undefined) {
                    errors.push('latitudeとlongitudeフィールドは必須です');
                }
                else {
                    CoordinatesValidator.validate(String(request.latitude), String(request.longitude));
                }
                break;
            case 'suumo':
                if (!request.url) {
                    errors.push('urlフィールドは必須です');
                }
                else {
                    SuumoUrlValidator.validate(request.url);
                }
                break;
            case 'geolocation':
                if (request.latitude === undefined || request.longitude === undefined) {
                    errors.push('現在地取得にはlatitudeとlongitudeフィールドが必須です');
                }
                else {
                    // 数値型チェック
                    const lat = Number(request.latitude);
                    const lng = Number(request.longitude);
                    if (isNaN(lat) || isNaN(lng)) {
                        errors.push('緯度と経度は数値である必要があります');
                    }
                    else {
                        CoordinatesValidator.validate(String(lat), String(lng));
                    }
                }
                break;
        }
    }
    catch (error) {
        if (error instanceof InputValidationError) {
            errors.push(error.message);
        }
        else {
            errors.push('バリデーションエラーが発生しました');
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=inputValidation.js.map