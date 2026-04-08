import { getActiveRoutes } from '../db';

/**
 * Message Processor Service
 * Procesa mensajes de usuarios y extrae intención y ubicación
 */

export interface ProcessedMessage {
  queryType: 'traffic' | 'weather' | 'route' | 'incident' | 'help' | 'unknown';
  location?: string;
  coordinates?: { latitude: number; longitude: number };
  routeId?: number;
  originalText: string;
  confidence: number;
}

/**
 * Palabras clave para detectar tipo de consulta
 */
const TRAFFIC_KEYWORDS = [
  'tráfico',
  'trafico',
  'congestión',
  'congestion',
  'atasco',
  'velocidad',
  'flujo',
  'vías',
  'vias',
  'carretera',
  'autopista',
  'calle',
];

const WEATHER_KEYWORDS = [
  'clima',
  'tiempo',
  'lluvia',
  'nieve',
  'temperatura',
  'viento',
  'condiciones',
  'tormenta',
  'nublado',
  'soleado',
];

const INCIDENT_KEYWORDS = [
  'accidente',
  'incidente',
  'choque',
  'colisión',
  'emergencia',
  'ambulancia',
  'policía',
  'policia',
  'bomberos',
];

const ROUTE_KEYWORDS = [
  'ruta',
  'camino',
  'recorrido',
  'trayecto',
  'hacia',
];

const HELP_KEYWORDS = [
  'ayuda',
  'help',
  'qué puedo',
  'que puedo',
  'funciona',
  'comandos',
  '/start',
  '/ayuda',
  '/help',
];

/**
 * Procesa un mensaje de usuario y extrae información
 */
export async function processMessage(text: string): Promise<ProcessedMessage> {
  const lowerText = text.toLowerCase().trim();

  // Detectar tipo de consulta
  const queryType = detectQueryType(lowerText);

  // Extraer ubicación o ruta
  let location: string | undefined;
  let coordinates: { latitude: number; longitude: number } | undefined;
  let routeId: number | undefined;

  if (queryType === 'route') {
    const routeMatch = await extractRoute(lowerText);
    if (routeMatch) {
      location = routeMatch.name;
      routeId = routeMatch.id;
      coordinates = {
        latitude: parseFloat(routeMatch.startLat),
        longitude: parseFloat(routeMatch.startLng),
      };
    }
  } else {
    // Intentar extraer ubicación del texto
    location = extractLocation(lowerText);

    // Si no hay ubicación explícita, usar ubicación por defecto o pedir al usuario
    if (!location && queryType !== 'help' && queryType !== 'unknown') {
      location = 'ubicación actual'; // Esto se manejará en el frontend
    }
  }

  return {
    queryType,
    location,
    coordinates,
    routeId,
    originalText: text,
    confidence: calculateConfidence(queryType, location),
  };
}

/**
 * Detecta el tipo de consulta basado en palabras clave
 */
function detectQueryType(
  text: string
): 'traffic' | 'weather' | 'route' | 'incident' | 'help' | 'unknown' {
  // Verificar comandos de Telegram primero (empiezan con /)
  if (text.startsWith('/start') || text.startsWith('/ayuda') || text.startsWith('/help')) {
    return 'help';
  }

  // Verificar palabras clave de ayuda (solo como palabras completas o frases exactas)
  if (HELP_KEYWORDS.some((kw) => text === kw || text.includes(`${kw} `) || text.endsWith(kw))) {
    return 'help';
  }

  if (INCIDENT_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'incident';
  }

  if (ROUTE_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'route';
  }

  if (WEATHER_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'weather';
  }

  if (TRAFFIC_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'traffic';
  }

  return 'unknown';
}

/**
 * Extrae una ruta frecuente del texto
 */
async function extractRoute(text: string): Promise<any | null> {
  try {
    const routes = await getActiveRoutes();

    // Buscar coincidencias con nombres de rutas
    for (const route of routes) {
      const routeName = route.name.toLowerCase();
      if (text.includes(routeName)) {
        return route;
      }

      // También buscar por ubicaciones
      if (
        text.includes(route.startLocation.toLowerCase()) ||
        text.includes(route.endLocation.toLowerCase())
      ) {
        return route;
      }
    }

    return null;
  } catch (error) {
    console.error('[MessageProcessor] Error extracting route:', error);
    return null;
  }
}

/**
 * Extrae una ubicación del texto
 * Busca patrones como "en [ubicación]", "de [ubicación]", etc.
 */
function extractLocation(text: string): string | undefined {
  // Patrones comunes para extraer ubicación
  const patterns = [
    /en\s+([a-záéíóúñ\s]+?)(?:\?|$|\.)/i,
    /de\s+([a-záéíóúñ\s]+?)(?:\?|$|\.)/i,
    /hacia\s+([a-záéíóúñ\s]+?)(?:\?|$|\.)/i,
    /a\s+([a-záéíóúñ\s]+?)(?:\?|$|\.)/i,
    /calle\s+([a-záéíóúñ0-9\s]+?)(?:\?|$|\.)/i,
    /avenida\s+([a-záéíóúñ0-9\s]+?)(?:\?|$|\.)/i,
    /carrera\s+([a-záéíóúñ0-9\s]+?)(?:\?|$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Si no hay patrón explícito, no asumir ubicación aleatoria
  return undefined;
}

/**
 * Calcula la confianza del procesamiento
 */
function calculateConfidence(
  queryType: string,
  location: string | undefined
): number {
  let confidence = 0;

  // Tipo de consulta detectado
  if (queryType !== 'unknown') {
    confidence += 50;
  }

  // Ubicación extraída
  if (location && location !== 'ubicación actual') {
    confidence += 50;
  } else if (location === 'ubicación actual') {
    confidence += 25; // Menor confianza si es ubicación por defecto
  }

  return Math.min(confidence, 100);
}

/**
 * Genera una respuesta de ayuda
 */
export function generateHelpMessage(): string {
  return `🤖 **VíasBot - Ayuda**

Puedo ayudarte con:

📍 **Tráfico**: Pregunta sobre el estado del tráfico
   Ej: "¿Cómo está el tráfico en la Calle 5?"
   Ej: "Tráfico en la Carrera 7"

🌤️ **Clima**: Consulta las condiciones climáticas
   Ej: "¿Qué clima hace en la Avenida Principal?"
   Ej: "Clima en el centro"

🛣️ **Rutas**: Información sobre rutas frecuentes
   Ej: "¿Cómo está la ruta al trabajo?"
   Ej: "Tráfico ruta centro-norte"

⚠️ **Incidentes**: Reporta o consulta accidentes
   Ej: "Hay un accidente en la Calle 10"
   Ej: "Incidentes en la autopista"

💡 **Consejos**:
   • Sé específico con la ubicación
   • Incluye nombre de calle o avenida
   • Pregunta de forma natural

¿Qué necesitas saber?`;
}

/**
 * Genera una respuesta para consultas no reconocidas
 */
export function generateUnknownMessage(): string {
  return `No entendí tu consulta. 😅

Puedo ayudarte con:
• Estado del tráfico
• Condiciones climáticas
• Información de rutas
• Reportar incidentes

Escribe "ayuda" para más información.`;
}

/**
 * Valida si una consulta es válida
 */
export function isValidQuery(processed: ProcessedMessage): boolean {
  // No es válida si es desconocida — se manejará con el LLM
  if (processed.queryType === 'unknown') {
    return false;
  }

  // Para help siempre es válida
  if (processed.queryType === 'help') {
    return true;
  }

  return true;
}
