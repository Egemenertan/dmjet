/**
 * Polygon Utility Functions
 * Point-in-polygon algorithm ve teslimat alanı kontrolleri
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Ray casting algoritması kullanarak bir noktanın polygon içinde olup olmadığını kontrol eder
 * @param point Kontrol edilecek nokta
 * @param polygon Polygon köşe noktaları
 * @returns Nokta polygon içindeyse true
 */
export const isPointInPolygon = (point: Coordinate, polygon: Coordinate[]): boolean => {
  const x = point.longitude;
  const y = point.latitude;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
};

/**
 * Teslimat alanı polygon koordinatları
 * Koordinatlar verilen sırayla birleştirilerek kapalı bir teslimat alanı oluşturur
 */
export const DELIVERY_AREA_POLYGON: Coordinate[] = [
  { latitude: 35.296169, longitude: 33.881986 }, // 1. nokta
  { latitude: 35.242844, longitude: 33.846450 }, // 2. nokta
  { latitude: 35.203030, longitude: 33.851186 }, // 3. nokta
  { latitude: 35.132558, longitude: 33.896178 }, // 4. nokta
  { latitude: 35.140977, longitude: 33.917159 }, // 5. nokta
  { latitude: 35.291236, longitude: 33.932860 }, // 6. nokta (son nokta, başlangıca döner)
];

/**
 * Verilen koordinatın teslimat alanı içinde olup olmadığını kontrol eder
 * @param coordinate Kontrol edilecek koordinat
 * @returns Teslimat alanı içindeyse true
 */
export const isInDeliveryArea = (coordinate: Coordinate): boolean => {
  const result = isPointInPolygon(coordinate, DELIVERY_AREA_POLYGON);
  console.log('🔍 Teslimat alanı kontrolü:', {
    coordinate,
    result,
    polygon: DELIVERY_AREA_POLYGON
  });
  return result;
};

/**
 * Teslimat alanının merkez koordinatını hesaplar
 * @returns Teslimat alanının merkez noktası
 */
export const getDeliveryAreaCenter = (): Coordinate => {
  const latSum = DELIVERY_AREA_POLYGON.reduce((sum, coord) => sum + coord.latitude, 0);
  const lngSum = DELIVERY_AREA_POLYGON.reduce((sum, coord) => sum + coord.longitude, 0);
  
  return {
    latitude: latSum / DELIVERY_AREA_POLYGON.length,
    longitude: lngSum / DELIVERY_AREA_POLYGON.length,
  };
};

/**
 * Teslimat alanının sınırlarını hesaplar (bounding box)
 * @returns Min/max koordinatlar
 */
export const getDeliveryAreaBounds = () => {
  const latitudes = DELIVERY_AREA_POLYGON.map(coord => coord.latitude);
  const longitudes = DELIVERY_AREA_POLYGON.map(coord => coord.longitude);
  
  return {
    minLatitude: Math.min(...latitudes),
    maxLatitude: Math.max(...latitudes),
    minLongitude: Math.min(...longitudes),
    maxLongitude: Math.max(...longitudes),
  };
};

/**
 * Harita görünümü için teslimat alanına uygun region hesaplar
 * @param padding Ekstra padding (opsiyonel)
 * @returns MapView Region objesi
 */
export const getDeliveryAreaRegion = (padding: number = 0.01) => {
  const bounds = getDeliveryAreaBounds();
  const center = getDeliveryAreaCenter();
  
  const latitudeDelta = (bounds.maxLatitude - bounds.minLatitude) + padding;
  const longitudeDelta = (bounds.maxLongitude - bounds.minLongitude) + padding;
  
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta,
    longitudeDelta,
  };
};
