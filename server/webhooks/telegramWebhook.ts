import { Router, Request, Response } from 'express';
import {
  TelegramUpdate,
  sendMessage,
  sendChatAction,
  extractMessageText,
  extractUserInfo,
  extractChatInfo,
} from '../services/telegramService';
import {
  processMessage,
  generateHelpMessage,
  generateUnknownMessage,
  isValidQuery,
} from '../services/messageProcessor';
import {
  getTrafficFlow,
  getTrafficIncidents,
  getWeatherData,
  formatTrafficResponse,
} from '../services/trafficWeatherService';
import {
  geocodeAddress,
} from '../services/geocodingService';
import {
  upsertTelegramUser,
  getTelegramUserByTelegramId,
  createQuery,
  createQueryResponse,
  logError,
} from '../db';
import { ENV } from '../_core/env';

const router = Router();

/**
 * Webhook para recibir actualizaciones de Telegram
 * POST: Recepción de mensajes y eventos
 */

router.post('/telegram', async (req: Request, res: Response) => {
  try {
    // Responder rápidamente a Telegram
    res.status(200).json({ ok: true });

    // Procesar actualización en background
    const update: TelegramUpdate = req.body;
    handleTelegramUpdate(update);
  } catch (error) {
    console.error('[Telegram Webhook] Error processing update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Procesa una actualización de Telegram
 */
async function handleTelegramUpdate(update: TelegramUpdate) {
  try {
    const message = update.message;

    if (!message) {
      return;
    }

    // Solo procesar mensajes de texto
    const text = extractMessageText(message);
    if (!text) {
      return;
    }

    // Procesar mensaje
    await handleIncomingMessage(message, text);
  } catch (error) {
    console.error('[Telegram] Error handling update:', error);
    await logError({
      errorType: 'telegram_update_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined,
      context: JSON.stringify({ update }),
      severity: 'error',
    });
  }
}

/**
 * Maneja un mensaje entrante de Telegram
 */
async function handleIncomingMessage(message: any, text: string) {
  const startTime = Date.now();

  try {
    const { chat, from, message_id } = message;
    const userInfo = extractUserInfo(message);
    const chatInfo = extractChatInfo(message);

    // Mostrar indicador de escritura
    await sendChatAction(chatInfo.chatId, 'typing', ENV.telegramBotToken);

    // Guardar/actualizar usuario (mock-safe)
    await upsertTelegramUser({
      telegramId: userInfo.telegramId,
      username: userInfo.username,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
    });

    // Obtener usuario de la BD, o usar un objeto sintético si la BD no está disponible
    const dbUser = await getTelegramUserByTelegramId(userInfo.telegramId);
    const user = dbUser ?? { id: 0, telegramId: userInfo.telegramId, firstName: userInfo.firstName };

    // Procesar mensaje
    const processed = await processMessage(text);

    // Crear registro de consulta
    const queryRecord = await createQuery({
      waContactId: user.id,
      queryText: text,
      queryType: processed.queryType,
      location: processed.location,
      latitude: processed.coordinates?.latitude?.toString(),
      longitude: processed.coordinates?.longitude?.toString(),
      responseTime: 0,
      success: 1,
    });

    // Generar respuesta
    let responseText = '';
    let trafficData = null;
    let weatherData = null;
    let incidentData = null;

    if (processed.queryType === 'help') {
      responseText = generateHelpMessage();
    } else if (!isValidQuery(processed)) {
      responseText = generateUnknownMessage();
    } else {
      // Obtener datos de APIs
      let coordinates = processed.coordinates;

      // Si no hay ubicación ni coordenadas, pedir al usuario que especifique
      if (!coordinates && !processed.location) {
        const queryTypeLabels: Record<string, string> = {
          traffic: 'tráfico',
          weather: 'clima',
          route: 'ruta',
          incident: 'incidente',
        };
        const label = queryTypeLabels[processed.queryType] || 'información';
        responseText = `📍 ¿En qué lugar quieres consultar el ${label}?\n\nIndica la dirección, barrio o zona.\nEjemplo: "tráfico en la Calle 5" o "clima en el centro"`;
      }

      // Si no hay coordenadas pero hay ubicación, geocodificar
      if (!coordinates && processed.location) {
        const geocoded = await geocodeAddress(
          processed.location,
          ENV.tomtomApiKey
        );

        if (geocoded) {
          coordinates = {
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
          };
        } else {
          responseText =
            '❌ No pude encontrar la ubicación. Por favor, sé más específico.\n\nEscribe /ayuda para más información.';
        }
      }

      // Si tenemos coordenadas, obtener datos
      if (coordinates) {
        // Obtener tráfico
        const traffic = await getTrafficFlow(coordinates, ENV.tomtomApiKey);

        // Obtener clima
        const weather = await getWeatherData(coordinates, ENV.openweatherApiKey);

        // Obtener incidentes
        const incidents = await getTrafficIncidents(
          {
            minLat: coordinates.latitude - 0.05,
            minLng: coordinates.longitude - 0.05,
            maxLat: coordinates.latitude + 0.05,
            maxLng: coordinates.longitude + 0.05,
          },
          ENV.tomtomApiKey
        );

        if (traffic) {
          responseText = formatTrafficResponse(traffic, weather, incidents);
          trafficData = JSON.stringify(traffic);
          weatherData = weather ? JSON.stringify(weather) : null;
          incidentData = incidents.length > 0 ? JSON.stringify(incidents) : null;
        } else {
          responseText =
            '❌ No pude obtener información de tráfico en este momento. Intenta más tarde.';
        }
      }
    }

    // Enviar respuesta
    const result = await sendMessage(
      chatInfo.chatId,
      responseText,
      ENV.telegramBotToken,
      { parse_mode: 'HTML' }
    );

    // Guardar respuesta
    if (result.ok && result.result) {
      await createQueryResponse({
        queryId: (queryRecord as any).insertId,
        waContactId: user.id,
        responseText,
        trafficData,
        weatherData,
        incidentData,
        messageId: result.result.message_id?.toString(),
        deliveryStatus: 'sent',
      });
    }

    // Actualizar tiempo de respuesta
    const responseTime = Date.now() - startTime;
    console.log(
      `[Telegram] Processed message from ${userInfo.firstName} in ${responseTime}ms`
    );
  } catch (error) {
    console.error('[Telegram] Error handling incoming message:', error);
    await logError({
      errorType: 'telegram_message_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined,
      context: JSON.stringify({ message, text }),
      severity: 'error',
    });

    // Intentar enviar mensaje de error al usuario
    try {
      const chatInfo = extractChatInfo(message);
      await sendMessage(
        chatInfo.chatId,
        '⚠️ Ocurrió un error procesando tu solicitud. Intenta nuevamente.',
        ENV.telegramBotToken
      );
    } catch (sendError) {
      console.error('[Telegram] Failed to send error message:', sendError);
    }
  }
}

export default router;
