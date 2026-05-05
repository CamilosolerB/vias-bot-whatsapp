import { logApiCall } from '../db';
import { ProcessedMessage } from './messageProcessor';

/**
 * Traffic & Weather Service
 * Integra TomTom Traffic API y OpenWeatherMap API
 */

interface TrafficFlowData {
  speed: number;
  speedLimit?: number;
  congestion: 'free' | 'moderate' | 'heavy' | 'blocked';
  travelTime: number; // en segundos (del segmento, puede ser 0)
  confidence: number; // 0-100
}

interface TrafficIncident {
  id: string;
  type: 'accident' | 'congestion' | 'construction' | 'roadwork' | 'incident';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  location: string;
  delay: number; // en segundos
}

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  visibility: number;
  precipitation: number;
  alerts?: string[];
}

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface RouteInfo {
  origin: string;
  destination: string;
  durationMinutes: number;       // tiempo sin tráfico
  durationTrafficMinutes: number; // tiempo con tráfico actual
  distanceKm: number;
  delayMinutes: number;          // demora extra por tráfico
}

/**
 * Obtiene datos de tráfico de TomTom Traffic API
 */
export async function getTrafficFlow(
  coordinates: LocationCoordinates,
  tomtomApiKey: string
): Promise<TrafficFlowData | null> {
  const startTime = Date.now();

  try {
    const { latitude, longitude } = coordinates;
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${tomtomApiKey}&point=${latitude},${longitude}`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'tomtom',
        endpoint: 'flowSegmentData',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
      });
      return null;
    }

    const data = await response.json();

    // Log successful call
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'flowSegmentData',
      statusCode: 200,
      responseTime,
      success: 1,
      requestData: JSON.stringify({ coordinates }),
    });

    // Mapear respuesta de TomTom
    const flowData = data.flowSegmentData;
    if (!flowData) return null;

    const speed = flowData.currentSpeed;
    const speedLimit = flowData.freeFlowSpeed;
    const confidence = flowData.confidence || 100;

    // Determinar congestión basada en velocidad
    let congestion: 'free' | 'moderate' | 'heavy' | 'blocked' = 'free';
    if (speedLimit) {
      const speedRatio = speed / speedLimit;
      if (speedRatio < 0.3) congestion = 'blocked';
      else if (speedRatio < 0.5) congestion = 'heavy';
      else if (speedRatio < 0.8) congestion = 'moderate';
    }

    return {
      speed,
      speedLimit,
      congestion,
      travelTime: flowData.travelTime || 0,
      confidence,
    };
  } catch (error) {
    console.error('[TomTom] Exception getting traffic flow:', error);
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'flowSegmentData',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Calcula el tiempo de viaje entre dos coordenadas usando TomTom Routing API
 */
export async function getRouteTime(
  origin: LocationCoordinates,
  destination: LocationCoordinates,
  originLabel: string,
  destinationLabel: string,
  tomtomApiKey: string
): Promise<RouteInfo | null> {
  const startTime = Date.now();

  try {
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/` +
      `${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}` +
      `/json?key=${tomtomApiKey}&traffic=true&travelMode=car&routeType=fastest`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'tomtom',
        endpoint: 'calculateRoute',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
      });
      return null;
    }

    const data = await response.json();

    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'calculateRoute',
      statusCode: 200,
      responseTime,
      success: 1,
    });

    const route = data.routes?.[0];
    if (!route) return null;

    const summary = route.summary;
    const durationSec = summary.travelTimeInSeconds || 0;
    const durationTrafficSec = summary.trafficDelayInSeconds != null
      ? durationSec + summary.trafficDelayInSeconds
      : durationSec;
    const distanceM = summary.lengthInMeters || 0;
    const delaySec = summary.trafficDelayInSeconds || 0;

    return {
      origin: originLabel,
      destination: destinationLabel,
      durationMinutes: Math.round(durationSec / 60),
      durationTrafficMinutes: Math.round(durationTrafficSec / 60),
      distanceKm: Math.round(distanceM / 100) / 10,
      delayMinutes: Math.round(delaySec / 60),
    };
  } catch (error) {
    console.error('[TomTom] Exception calculating route:', error);
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'calculateRoute',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Genera una URL de mapa estático con el trazado de la ruta usando Google Static Maps API
 */
export async function getRouteMapUrl(
  origin: LocationCoordinates,
  destination: LocationCoordinates,
  tomtomApiKey: string,
  googleMapsApiKey: string
): Promise<string | null> {
  try {
    // 1. Obtener la geometría de la ruta de TomTom
    const routingUrl = `https://api.tomtom.com/routing/1/calculateRoute/${origin.latitude},${origin.longitude}:${destination.latitude},${destination.longitude}/json?key=${tomtomApiKey}&routeRepresentation=polyline&maxAlternatives=0`;
    
    console.log('[TomTom] Fetching route for map generation...');
    const response = await fetch(routingUrl);
    if (!response.ok) {
      console.error('[TomTom] Failed to fetch route for map:', response.status);
      return null;
    }
    
    const data = await response.json();
    const route = data.routes?.[0];
    
    if (!route) {
      console.error('[TomTom] No route in response');
      return null;
    }
    
    // TomTom devuelve los puntos en legs[0].points como array de {latitude, longitude}
    const points = route.legs?.[0]?.points;
    
    if (!points || points.length === 0) {
      console.error('[TomTom] No points in route response');
      return null;
    }
    
    console.log('[TomTom] Route has', points.length, 'points');
    
    // 2. Convertir puntos de TomTom a polyline encoded de Google
    // Google Static Maps API acepta polyline encoded con precisión 5
    const googlePolyline = encodePolyline(points);
    
    // 3. Calcular bounding box usando TODOS los puntos de la ruta (no solo origen/destino)
    let minLat = points[0].latitude;
    let maxLat = points[0].latitude;
    let minLng = points[0].longitude;
    let maxLng = points[0].longitude;
    
    for (const point of points) {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    }
    
    // Añadir margen de 15% al bounding box
    const latMargin = (maxLat - minLat) * 0.15 || 0.005;
    const lngMargin = (maxLng - minLng) * 0.15 || 0.005;
    
    // Centro del bounding box
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calcular zoom dinámico basado en la distancia del bounding box
    const latRange = maxLat - minLat + latMargin * 2;
    const lngRange = maxLng - minLng + lngMargin * 2;
    
    // Zoom basado en el rango máximo (fórmula aproximada para Google Maps)
    const maxRange = Math.max(latRange, lngRange);
    let zoom = 13;
    if (maxRange > 10) zoom = 4;
    else if (maxRange > 5) zoom = 5;
    else if (maxRange > 2) zoom = 6;
    else if (maxRange > 1) zoom = 7;
    else if (maxRange > 0.5) zoom = 8;
    else if (maxRange > 0.2) zoom = 9;
    else if (maxRange > 0.1) zoom = 10;
    else if (maxRange > 0.05) zoom = 11;
    else if (maxRange > 0.02) zoom = 12;
    else if (maxRange > 0.01) zoom = 13;
    else zoom = 14;
    
    console.log('[Maps] Dynamic zoom:', zoom, 'Center:', centerLat, centerLng, 'Range:', maxRange.toFixed(4));
    console.log('[Maps] Polyline length:', googlePolyline.length, 'First 100 chars:', googlePolyline.substring(0, 100));
    
    // 4. Construir URL de Google Static Maps API con center y zoom dinámicos
    // IMPORTANTE: El polyline debe estar URL-encoded
    const encodedPolyline = encodeURIComponent(googlePolyline);
    
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?size=600x400&format=png&scale=2` +
      `&center=${centerLat},${centerLng}` +
      `&zoom=${zoom}` +
      `&style=feature:all|element:all|saturation:-20|lightness:10` +
      `&path=weight:5|color:0x0070FF|enc:${encodedPolyline}` +
      `&markers=color:green|label:A|${origin.latitude},${origin.longitude}` +
      `&markers=color:red|label:B|${destination.latitude},${destination.longitude}` +
      `&key=${googleMapsApiKey}`;
      
    console.log('[Google Maps] Generated static map URL (truncated):', mapUrl.substring(0, 150) + '...');
    return mapUrl;
  } catch (error) {
    console.error('[Maps] Error generating route map URL:', error);
    return null;
  }
}

/**
 * Convierte un array de puntos {latitude, longitude} a polyline encoded (formato Google con precisión 5)
 */
function encodePolyline(points: Array<{latitude: number, longitude: number}>): string {
  let prevLat = 0;
  let prevLng = 0;
  let encoded = '';
  
  for (const point of points) {
    const lat = Math.round(point.latitude * 1e5);
    const lng = Math.round(point.longitude * 1e5);
    
    const dLat = lat - prevLat;
    const dLng = lng - prevLng;
    
    prevLat = lat;
    prevLng = lng;
    
    encoded += encodeSignedNumber(dLat);
    encoded += encodeSignedNumber(dLng);
  }
  
  return encoded;
}

/**
 * Codifica un número signed para polyline encoding
 */
function encodeSignedNumber(num: number): string {
  // Left shift y XOR para números negativos
  const sgnNum = num < 0 ? ~num << 1 : num << 1;
  return encodeUnsignedNumber(sgnNum);
}

/**
 * Codifica un número unsigned para polyline encoding
 */
function encodeUnsignedNumber(num: number): string {
  let encoded = '';
  
  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  
  encoded += String.fromCharCode(num + 63);
  return encoded;
}

/**
 * Obtiene incidentes de tráfico de TomTom
 */
export async function getTrafficIncidents(
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  tomtomApiKey: string
): Promise<TrafficIncident[]> {
  const startTime = Date.now();

  try {
    const { minLat, minLng, maxLat, maxLng } = bbox;
    const url = `https://api.tomtom.com/traffic/services/5/incidents/json?key=${tomtomApiKey}&bbox=${minLng},${minLat},${maxLng},${maxLat}&categoryFilter=all`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'tomtom',
        endpoint: 'incidents',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
      });
      return [];
    }

    const data = await response.json();

    // Log successful call
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'incidents',
      statusCode: 200,
      responseTime,
      success: 1,
    });

    // Mapear incidentes
    const incidents: TrafficIncident[] = (data.incidents || []).map((incident: any) => ({
      id: incident.id,
      type: mapIncidentType(incident.iconCategory),
      severity: mapIncidentSeverity(incident.magnitudeOfDelay),
      description: incident.description,
      location: incident.location?.description || 'Unknown location',
      delay: incident.magnitudeOfDelay || 0,
    }));

    return incidents;
  } catch (error) {
    console.error('[TomTom] Exception getting incidents:', error);
    await logApiCall({
      apiName: 'tomtom',
      endpoint: 'incidents',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Obtiene datos de clima de OpenWeatherMap
 */
export async function getWeatherData(
  coordinates: LocationCoordinates,
  openweatherApiKey: string
): Promise<WeatherData | null> {
  const startTime = Date.now();

  try {
    const { latitude, longitude } = coordinates;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openweatherApiKey}&units=metric&lang=es`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'openweather',
        endpoint: 'weather',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
      });
      return null;
    }

    const data = await response.json();

    // Log successful call
    await logApiCall({
      apiName: 'openweather',
      endpoint: 'weather',
      statusCode: 200,
      responseTime,
      success: 1,
    });

    return {
      temperature: data.main.temp,
      condition: data.weather[0].description,
      windSpeed: data.wind.speed,
      visibility: data.visibility / 1000, // convertir a km
      precipitation: data.rain?.['1h'] || 0,
      alerts: data.alerts?.map((alert: any) => alert.description) || [],
    };
  } catch (error) {
    console.error('[OpenWeather] Exception getting weather:', error);
    await logApiCall({
      apiName: 'openweather',
      endpoint: 'weather',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Obtiene alertas de clima para una ruta específica
 */
export async function getRoadRiskAlerts(
  coordinates: LocationCoordinates,
  openweatherApiKey: string
): Promise<string[]> {
  const startTime = Date.now();

  try {
    const { latitude, longitude } = coordinates;
    const url = `https://api.openweathermap.org/data/3.0/stations?lat=${latitude}&lon=${longitude}&appid=${openweatherApiKey}`;

    const response = await fetch(url);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      await logApiCall({
        apiName: 'openweather',
        endpoint: 'roadRisk',
        statusCode: response.status,
        responseTime,
        success: 0,
        errorMessage: `HTTP ${response.status}`,
      });
      return [];
    }

    // Log successful call
    await logApiCall({
      apiName: 'openweather',
      endpoint: 'roadRisk',
      statusCode: 200,
      responseTime,
      success: 1,
    });

    return [];
  } catch (error) {
    console.error('[OpenWeather] Exception getting road risk alerts:', error);
    await logApiCall({
      apiName: 'openweather',
      endpoint: 'roadRisk',
      statusCode: 500,
      responseTime: Date.now() - startTime,
      success: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Mapea categoría de incidente de TomTom a tipo
 */
function mapIncidentType(
  category: string
): 'accident' | 'congestion' | 'construction' | 'roadwork' | 'incident' {
  const categoryLower = category.toLowerCase();

  if (categoryLower.includes('accident')) return 'accident';
  if (categoryLower.includes('congestion')) return 'congestion';
  if (categoryLower.includes('construction')) return 'construction';
  if (categoryLower.includes('roadwork')) return 'roadwork';

  return 'incident';
}

/**
 * Mapea magnitud de retraso a severidad
 */
function mapIncidentSeverity(
  delay: number
): 'minor' | 'moderate' | 'major' | 'critical' {
  if (delay < 60) return 'minor';
  if (delay < 300) return 'moderate';
  if (delay < 900) return 'major';
  return 'critical';
}

/**
 * Formatea datos de tráfico para respuesta
 */
export function formatTrafficResponse(
  traffic: TrafficFlowData,
  weather: WeatherData | null,
  incidents: TrafficIncident[],
  processed: ProcessedMessage,
  routeInfo?: RouteInfo | null
): string {
  const congestionEmoji = {
    free: '🟢',
    moderate: '🟡',
    heavy: '🔴',
    blocked: '⛔',
  };
  const congestionLabel = {
    free: 'Fluido',
    moderate: 'Moderado',
    heavy: 'Congestionado',
    blocked: 'Bloqueado',
  };

  const isWeatherOnly = processed.requestedTopic === 'weather';
  const isIncidentOnly = processed.requestedTopic === 'incident';
  const isTrafficOnly = processed.requestedTopic === 'traffic';
  const isGeneral = processed.requestedTopic === 'all';

  let response = '';

  // 1. Manejo de Preguntas Sí/No específicas (Retroalimentación solicitada)
  if (processed.isYesNoQuery && processed.conditionKeywords) {
    const foundIncidents = incidents.filter(inc => 
      processed.conditionKeywords?.some(kw => 
        inc.description.toLowerCase().includes(kw) || inc.location.toLowerCase().includes(kw)
      )
    );

    if (foundIncidents.length > 0) {
      const inc = foundIncidents[0];
      response += `🚨 <b>¡Hola! Sí, se reporta un incidente de ese tipo:</b>\n`;
      response += `⚠️ ${inc.description}\n`;
      response += `📍 Lugar: ${inc.location}\n`;
      if (inc.delay > 0) response += `⏱️ Retraso estimado: ${Math.round(inc.delay / 60)} min\n`;
      response += `\n<i>Te recomiendo tener precaución al transitar por allí.</i>\n\n`;
    } else {
      response += `✅ <b>¡Hola! No se reportan ese tipo de inconvenientes en este momento.</b>\n`;
      response += `✨ El estado es correcto y estás listo para manejar con tranquilidad. ¡Buen viaje!\n\n`;
      // Si el usuario preguntó específicamente algo, no saturamos con todo lo demás a menos que sea necesario
    }
  } else if (!isGeneral) {
    // Tono cercano para consultas directas
    const cityText = processed.location ? ` en ${processed.location}` : '';
    if (isWeatherOnly) response += `🌤️ ¡Hola! Aquí tienes el reporte del clima${cityText} que me pediste:\n\n`;
    else if (isTrafficOnly) response += `🚗 ¡Claro! Así está el tráfico${cityText} en este momento:\n\n`;
    else response += `⚠️ ¡Hola! Aquí están los incidentes reportados${cityText}:\n\n`;
  } else {
    response += '🚗 <b>Estado de Tráfico y Clima</b>\n\n';
  }

  // 2. Ruta A a B
  if (routeInfo && !isWeatherOnly) {
    response += `📍 <b>${routeInfo.origin}</b> → <b>${routeInfo.destination}</b>\n`;
    response += `📍 Distancia: ${routeInfo.distanceKm} km\n`;
    response += `⏱️ Tiempo sin tráfico: ${routeInfo.durationMinutes} min\n`;
    response += `🚗 Tiempo con tráfico actual: <b>${routeInfo.durationTrafficMinutes} min</b>\n`;
    if (routeInfo.delayMinutes > 0) {
      response += `⌛ Demora extra: +${routeInfo.delayMinutes} min por tráfico\n`;
    }
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeInfo.origin)}&destination=${encodeURIComponent(routeInfo.destination)}&travelmode=driving`;
    response += `\n🗺️ <a href="${mapsUrl}">Ver ruta en Google Maps</a>\n`;
    response += '\n';
  }

  // 3. Tráfico (solo si no es WeatherOnly)
  if (!isWeatherOnly && (isTrafficOnly || isGeneral || (processed.isYesNoQuery && incidents.length === 0))) {
    response += `${congestionEmoji[traffic.congestion]} Flujo: <b>${congestionLabel[traffic.congestion]}</b>\n`;
    response += `🏎️ Velocidad actual: ${traffic.speed} km/h`;
    if (traffic.speedLimit) {
      response += ` (límite: ${traffic.speedLimit} km/h)`;
    }
    response += '\n';

    if (!routeInfo && traffic.speed > 0) {
      const minsPer1km = Math.round(60 / traffic.speed * 10) / 10;
      response += `⏳ Tiempo estimado por km: ~${minsPer1km} min/km\n`;
    }
    response += `📊 Precisión: ${traffic.confidence}%\n\n`;
  }

  // 4. Clima (solo si es Weather o General)
  if (weather && (isWeatherOnly || isGeneral)) {
    response += `🌤️ <b>Condiciones Climáticas</b>\n`;
    response += `Temperatura: ${Math.round(weather.temperature)}°C\n`;
    response += `Condición: ${weather.condition}\n`;
    response += `Viento: ${weather.windSpeed} m/s | Visibilidad: ${weather.visibility.toFixed(1)} km\n`;

    if (weather.precipitation > 0) {
      response += `🌧️ Lluvia: ${weather.precipitation} mm\n`;
    }

    if (weather.alerts && weather.alerts.length > 0) {
      response += `⚠️ Alertas: ${weather.alerts.join(', ')}\n`;
    }
    response += '\n';
  }

  // 5. Incidentes (solo si no es WeatherOnly o TrafficOnly)
  if (!isWeatherOnly && !isTrafficOnly && (isIncidentOnly || isGeneral || (processed.isYesNoQuery && incidents.length > 0))) {
    if (incidents.length > 0) {
      // Si ya mostramos el buscado arriba en isYesNoQuery, no repetirlo igual?
      // Por simplicidad, mostramos los top 3
      response += `⚠️ <b>Incidentes en la zona</b>\n`;
      incidents.slice(0, 3).forEach((incident) => {
        const incidentEmoji = {
          accident: '🚨',
          congestion: '🚧',
          construction: '🏗️',
          roadwork: '🛠️',
          incident: '⚠️',
        };

        response += `${incidentEmoji[incident.type]} ${incident.description}\n`;
        response += `   📍 ${incident.location}\n`;
        if (incident.delay > 0) {
          response += `   ⏱️ Retraso: ${Math.round(incident.delay / 60)} min\n`;
        }
      });

      if (incidents.length > 3) {
        response += `\n... y ${incidents.length - 3} incidentes más\n`;
      }
    } else if (isIncidentOnly) {
      response += `✅ ¡Buenas noticias! No se reportan incidentes en la zona.\n`;
    }
  }

  return response;
}
