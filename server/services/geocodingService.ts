import { logApiCall } from '../db';

/**
 * Geocoding Service
 * Convierte direcciones a coordenadas usando TomTom Geocoding API
 */

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  type: 'street' | 'intersection' | 'city' | 'unknown';
  confidence: number;
}

/**
 * Geocodifica una dirección a coordenadas
 */
export async function geocodeAddress(
  address: string,
  tomtomApiKey: string,
  countryCode: string = 'CO' // Colombia por defecto
): Promise<GeocodeResult | null> {
  const startTime = Date.now();

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://api.tomtom.com/search/2/geocode/${encodedAddress}.json?key=${tomtomApiKey}&countrySet=${countryCode}&limit=1`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'tomtom',
        endpoint: 'geocode',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
        requestData: JSON.stringify({ address }),
      });
      return null;
    }

    const data = await response.json();

    // Log successful call
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'geocode',
      statusCode: 200,
      responseTime,
      success: 1,
      requestData: JSON.stringify({ address }),
      responseData: JSON.stringify(data.results?.[0] || {}),
    });

    if (!data.results || data.results.length === 0) {
      return null;
    }

    const result = data.results[0];
    const position = result.position;

    return {
      address: result.address.freeformAddress,
      latitude: position.lat,
      longitude: position.lon,
      type: determineAddressType(result.type),
      confidence: calculateGeocodeConfidence(result),
    };
  } catch (error) {
    console.error('[Geocoding] Exception geocoding address:', error);
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'geocode',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestData: JSON.stringify({ address }),
    });
    return null;
  }
}

/**
 * Geocodificación inversa: convierte coordenadas a dirección
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  tomtomApiKey: string
): Promise<string | null> {
  const startTime = Date.now();

  try {
    const url = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${tomtomApiKey}&limit=1`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'tomtom',
        endpoint: 'reverseGeocode',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
        requestData: JSON.stringify({ latitude, longitude }),
      });
      return null;
    }

    const data = await response.json();

    // Log successful call
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'reverseGeocode',
      statusCode: 200,
      responseTime,
      success: 1,
      requestData: JSON.stringify({ latitude, longitude }),
    });

    if (!data.addresses || data.addresses.length === 0) {
      return null;
    }

    return data.addresses[0].address.freeformAddress;
  } catch (error) {
    console.error('[Geocoding] Exception reverse geocoding:', error);
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'reverseGeocode',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestData: JSON.stringify({ latitude, longitude }),
    });
    return null;
  }
}

/**
 * Busca direcciones con autocompletado
 */
export async function autocompleteAddress(
  query: string,
  tomtomApiKey: string,
  countryCode: string = 'CO'
): Promise<GeocodeResult[]> {
  const startTime = Date.now();

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.tomtom.com/search/2/search/${encodedQuery}.json?key=${tomtomApiKey}&countrySet=${countryCode}&limit=5`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'tomtom',
        endpoint: 'search',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
        requestData: JSON.stringify({ query }),
      });
      return [];
    }

    const data = await response.json();

    // Log successful call
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'search',
      statusCode: 200,
      responseTime,
      success: 1,
      requestData: JSON.stringify({ query }),
    });

    if (!data.results) {
      return [];
    }

    return data.results.map((result: any) => ({
      address: result.address.freeformAddress,
      latitude: result.position.lat,
      longitude: result.position.lon,
      type: determineAddressType(result.type),
      confidence: calculateGeocodeConfidence(result),
    }));
  } catch (error) {
    console.error('[Geocoding] Exception autocompleting address:', error);
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'search',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestData: JSON.stringify({ query }),
    });
    return [];
  }
}

/**
 * Calcula la distancia entre dos puntos (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determina el tipo de dirección
 */
function determineAddressType(
  tomtomType: string
): 'street' | 'intersection' | 'city' | 'unknown' {
  const type = tomtomType.toLowerCase();

  if (type.includes('street') || type.includes('address')) {
    return 'street';
  }
  if (type.includes('intersection')) {
    return 'intersection';
  }
  if (type.includes('city') || type.includes('municipality')) {
    return 'city';
  }

  return 'unknown';
}

/**
 * Calcula la confianza del resultado de geocodificación
 */
function calculateGeocodeConfidence(result: any): number {
  let confidence = 100;

  // Reducir confianza si es un resultado aproximado
  if (result.type === 'Point Address' || result.type === 'Address Range') {
    confidence = 95;
  } else if (result.type === 'Street') {
    confidence = 80;
  } else if (result.type === 'Intersection') {
    confidence = 85;
  } else if (result.type === 'City') {
    confidence = 70;
  }

  return confidence;
}
