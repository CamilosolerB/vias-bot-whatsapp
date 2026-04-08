import { logApiCall } from '../db';

/**
 * Traffic & Weather Service
 * Integra TomTom Traffic API y OpenWeatherMap API
 */

interface TrafficFlowData {
  speed: number;
  speedLimit?: number;
  congestion: 'free' | 'moderate' | 'heavy' | 'blocked';
  travelTime: number; // en segundos
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
 * Formatea datos de tráfico para respuesta elegante
 */
export function formatTrafficResponse(
  traffic: TrafficFlowData,
  weather: WeatherData | null,
  incidents: TrafficIncident[]
): string {
  let response = '🚗 **Estado de Tráfico**\n\n';

  // Velocidad y congestión
  const congestionEmoji = {
    free: '🟢',
    moderate: '🟡',
    heavy: '🔴',
    blocked: '⛔',
  };

  response += `${congestionEmoji[traffic.congestion]} Velocidad: ${traffic.speed} km/h`;
  if (traffic.speedLimit) {
    response += ` (Límite: ${traffic.speedLimit} km/h)`;
  }
  response += '\n';

  // Tiempo de viaje
  const minutes = Math.round(traffic.travelTime / 60);
  response += `⏱️ Tiempo estimado: ${minutes} minutos\n`;

  // Confiabilidad
  response += `📊 Confiabilidad: ${traffic.confidence}%\n\n`;

  // Clima
  if (weather) {
    response += `🌤️ **Clima**\n`;
    response += `Temperatura: ${weather.temperature}°C\n`;
    response += `Condición: ${weather.condition}\n`;
    response += `Viento: ${weather.windSpeed} km/h\n`;
    response += `Visibilidad: ${weather.visibility.toFixed(1)} km\n`;

    if (weather.precipitation > 0) {
      response += `🌧️ Lluvia: ${weather.precipitation} mm\n`;
    }

    if (weather.alerts && weather.alerts.length > 0) {
      response += `⚠️ Alertas: ${weather.alerts.join(', ')}\n`;
    }
    response += '\n';
  }

  // Incidentes
  if (incidents.length > 0) {
    response += `⚠️ **Incidentes**\n`;
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
      response += `   ⏱️ Retraso: ${Math.round(incident.delay / 60)} min\n`;
    });

    if (incidents.length > 3) {
      response += `\n... y ${incidents.length - 3} incidentes más\n`;
    }
  }

  return response;
}
