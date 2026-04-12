import { getActiveRoutes } from '../db';

/**
 * Message Processor Service
 * Procesa mensajes de usuarios y extrae intención y ubicación
 */

export interface ProcessedMessage {
  queryType: 'traffic' | 'weather' | 'route' | 'incident' | 'help' | 'unknown';
  requestedTopic: 'traffic' | 'weather' | 'incident' | 'all';
  location?: string;
  origin?: string;      // Para consultas de ruta "de X a Y"
  destination?: string; // Para consultas de ruta "de X a Y"
  coordinates?: { latitude: number; longitude: number };
  routeId?: number;
  originalText: string;
  confidence: number;
  conditionKeywords?: string[]; // ej. "derrumbe", "paro"
  isGeneralQuery?: boolean;     // ej. solo "Bogotá"
  isYesNoQuery?: boolean;       // ej. "¿hay derrumbe?"
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

const CONDITION_KEYWORDS = [
  'derrumbe',
  'deslizamiento',
  'bloqueo',
  'paro',
  'manifestación',
  'manifiesto',
  'manifestacion',
  'volcamiento',
  'volcado',
  'choque',
  'colisión',
  'colision',
  'vía cerrada',
  'via cerrada',
  'cerrada',
  'trancón',
  'trancon',
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
  let requestedTopic: 'traffic' | 'weather' | 'incident' | 'all' = 'all';

  if (queryType === 'traffic') requestedTopic = 'traffic';
  if (queryType === 'weather') requestedTopic = 'weather';
  if (queryType === 'incident') requestedTopic = 'incident';

  // Detectar palabras clave de condiciones específicas
  const conditionKeywords = detectConditionKeywords(lowerText);
  if (conditionKeywords.length > 0 && queryType === 'unknown') {
    // Si hay palabras de incidente pero no se detectó tipo, marcar como incidente
    // Pero solo si no es algo general o ayuda
  }

  // Detectar si es una pregunta de Sí/No
  const isYesNoQuery = isYesNoQuestion(lowerText);

  // Intentar detectar patrón "de X a Y" / "desde X hasta Y"
  const routePattern = extractOriginDestination(lowerText);

  // Extraer ubicación o ruta
  let location: string | undefined;
  let origin: string | undefined;
  let destination: string | undefined;
  let coordinates: { latitude: number; longitude: number } | undefined;
  let routeId: number | undefined;

  if (routePattern) {
    origin = routePattern.origin;
    destination = routePattern.destination;
  } else if (queryType === 'route') {
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
  }

  // Detectar si es una consulta general (solo una ubicación sin intención clara)
  // Ej: el usuario escribe "Bogotá" o "En Bogotá"
  const isGeneralQuery =
    (queryType === 'unknown' || queryType === 'traffic') &&
    location &&
    lowerText.length < location.length + 10 &&
    conditionKeywords.length === 0 &&
    !routePattern;

  return {
    queryType,
    requestedTopic,
    location,
    origin,
    destination,
    coordinates,
    routeId,
    originalText: text,
    confidence: calculateConfidence(queryType, location ?? origin),
    conditionKeywords: conditionKeywords.length > 0 ? conditionKeywords : undefined,
    isGeneralQuery: isGeneralQuery || false,
    isYesNoQuery,
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

  // Verificar palabras clave de ayuda
  if (HELP_KEYWORDS.some((kw) => text === kw || text.includes(`${kw} `) || text.endsWith(kw))) {
    return 'help';
  }

  if (INCIDENT_KEYWORDS.some((kw) => text.includes(kw)) || CONDITION_KEYWORDS.some((kw) => text.includes(kw))) {
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
 * Detecta palabras clave de condiciones específicas
 */
function detectConditionKeywords(text: string): string[] {
  return CONDITION_KEYWORDS.filter((kw) => text.includes(kw));
}

/**
 * Detecta si el mensaje parece una pregunta de Sí/No
 */
function isYesNoQuestion(text: string): boolean {
  const indicators = ['hay', 'existe', 'está', 'esta', 'se reporta', 'saben si', 'sabe si', 'confirmar'];
  const isQuestion = text.includes('?') || text.startsWith('¿');
  const hasIndicator = indicators.some((ind) => text.includes(ind));

  return (isQuestion && hasIndicator) || (hasIndicator && text.split(' ').length < 6);
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
 * Extrae origen y destino de mensajes tipo "de X a Y" o "desde X hasta Y"
 */
function extractOriginDestination(
  text: string
): { origin: string; destination: string } | null {
  // Patrones: "de X a Y", "desde X hasta Y", "desde X a Y", "de X hasta Y"
  const patterns = [
    /(?:desde|de)\s+(.+?)\s+(?:hasta|a)\s+(.+?)(?:\?|$|\.)/i,
    /(?:saliendo de|partiendo de)\s+(.+?)\s+(?:hacia|hasta|a)\s+(.+?)(?:\?|$|\.)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[2]) {
      const origin = match[1].trim();
      const destination = match[2].trim();
      // Filtrar si alguno es muy corto o es una stopword
      if (origin.length > 2 && destination.length > 2) {
        return { origin, destination };
      }
    }
  }

  return null;
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
  return `🤖 <b>VíasBot - Ayuda</b>

Puedo ayudarte con:

🚗 <b>Tráfico en una zona</b>
   Ej: "tráfico en la Calle 5"
   Ej: "vías en el centro"

🗺️ <b>Ruta de A → B (con tiempo real)</b>
   Ej: "de la Calle 5 a la Carrera 7"
   Ej: "desde el centro hasta el aeropuerto"
   Ej: "tráfico de la Av. Principal a la Calle 80"

🌤️ <b>Clima</b>
   Ej: "clima en el norte"
   Ej: "lluvia en la autopista"

⚠️ <b>Incidentes</b>
   Ej: "accidente en la Calle 10"
   Ej: "incidentes en la autopista"

💡 <b>Tips</b>:
   • Para saber cuánto tardas de un lugar a otro, escribe <b>"de [origen] a [destino]"</b>
   • Sé específico con calles, barrios o zonas

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
