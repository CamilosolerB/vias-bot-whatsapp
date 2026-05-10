import { Router, Request, Response } from 'express';
import {
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
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
  generateDefinitionMessage,
  isValidQuery,
} from '../services/messageProcessor';
import {
  getTrafficFlow,
  getTrafficIncidents,
  getWeatherData,
  getRouteTime,
  getRouteMapUrl,
  formatTrafficResponse,
  getRoadRiskAlerts,
} from '../services/trafficWeatherService';
import {
  sendMessageWithButtons,
  answerCallbackQuery,
  sendPhoto,
} from '../services/telegramService';
import type { RouteInfo } from '../services/trafficWeatherService';
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
import { isTelegramUserAuthorized } from '../services/userAccess';
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
    
    if (update.callback_query) {
      handleCallbackQuery(update.callback_query);
    } else {
      handleTelegramUpdate(update);
    }
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

    // --- VERIFICACIÓN DE AUTORIZACIÓN ---
    const userInfo = extractUserInfo(message);
    const isAuthorized = await isTelegramUserAuthorized(userInfo.telegramId);
    
    if (!isAuthorized) {
      console.warn(`[Telegram] Unauthorized access attempt from ID: ${userInfo.telegramId} (${userInfo.username})`);
      const chatInfo = extractChatInfo(message);
      await sendMessage(
        chatInfo.chatId,
        `🚫 <b>Acceso Denegado</b>\n\nTu ID de usuario (<code>${userInfo.telegramId}</code>) no está autorizado para usar este bot. Por favor, solicita acceso al administrador.`,
        ENV.telegramBotToken,
        { parse_mode: 'HTML' }
      );
      return;
    }
    // --- FIN VERIFICACIÓN ---

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
async function handleIncomingMessage(message: TelegramMessage, text: string) {
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

    } else if (!isValidQuery(processed) && processed.queryType !== 'info') {
      responseText = generateUnknownMessage();

    } else if (processed.queryType === 'info') {
      responseText = generateDefinitionMessage(processed.infoTopic);

    } else if (processed.origin && processed.destination) {
      // ── MODO RUTA A → B ──────────────────────────────────────────────
      // Geocodificar origen y destino en paralelo
      const [geocodedOrigin, geocodedDest] = await Promise.all([
        geocodeAddress(processed.origin, ENV.tomtomApiKey),
        geocodeAddress(processed.destination, ENV.tomtomApiKey),
      ]);

      if (!geocodedOrigin) {
        responseText = `❌ No pude encontrar el origen: "${processed.origin}".\nSé más específico con la dirección.`;
      } else if (!geocodedDest) {
        responseText = `❌ No pude encontrar el destino: "${processed.destination}".\nSé más específico con la dirección.`;
      } else {
        // Obtener ruta + tráfico en paralelo
        const [routeInfo, traffic, weather, incidents] = await Promise.all([
          getRouteTime(
            { latitude: geocodedOrigin.latitude, longitude: geocodedOrigin.longitude },
            { latitude: geocodedDest.latitude,   longitude: geocodedDest.longitude   },
            geocodedOrigin.address,
            geocodedDest.address,
            ENV.tomtomApiKey
          ),
          getTrafficFlow(
            { latitude: geocodedOrigin.latitude, longitude: geocodedOrigin.longitude },
            ENV.tomtomApiKey
          ),
          getWeatherData(
            { latitude: geocodedOrigin.latitude, longitude: geocodedOrigin.longitude },
            ENV.openweatherApiKey
          ),
          getTrafficIncidents(
            {
              minLat: Math.min(geocodedOrigin.latitude, geocodedDest.latitude) - 0.05,
              minLng: Math.min(geocodedOrigin.longitude, geocodedDest.longitude) - 0.05,
              maxLat: Math.max(geocodedOrigin.latitude, geocodedDest.latitude) + 0.05,
              maxLng: Math.max(geocodedOrigin.longitude, geocodedDest.longitude) + 0.05,
            },
            ENV.tomtomApiKey
          ),
        ]);

        if (!routeInfo && !traffic) {
          responseText = '❌ No pude calcular la ruta en este momento. Intenta más tarde.';
        } else if (traffic) {
          responseText = formatTrafficResponse(traffic, weather, incidents, processed, routeInfo);
          trafficData = JSON.stringify(traffic);
          weatherData = weather ? JSON.stringify(weather) : null;
          incidentData = incidents.length > 0 ? JSON.stringify(incidents) : null;

          // Añadir botón de "Ver ruta" si es una consulta de ruta
          if (routeInfo) {
            const buttons = [
              [{ text: '🗺️ Ver miniatura de ruta', callback_data: `route:map:${processed.origin}|${processed.destination}` }]
            ];
            await sendMessageWithButtons(
              chatInfo.chatId,
              responseText,
              buttons,
              ENV.telegramBotToken
            );
            return;
          }
        } else if (routeInfo) {
          // Solo tenemos datos de ruta pero no de flujo
          responseText =
            `📍 <b>${routeInfo.origin}</b> → <b>${routeInfo.destination}</b>\n` +
            `📍 Distancia: ${routeInfo.distanceKm} km\n` +
            `⏱️ Tiempo estimado: <b>${routeInfo.durationTrafficMinutes} min</b>` +
            (routeInfo.delayMinutes > 0 ? ` (+${routeInfo.delayMinutes} min por tráfico)` : '') + '\n';
            
          const buttons = [
            [{ text: '🗺️ Ver miniatura de ruta', callback_data: `route:map:${processed.origin}|${processed.destination}` }]
          ];
          await sendMessageWithButtons(
            chatInfo.chatId,
            responseText,
            buttons,
            ENV.telegramBotToken
          );
          return;
        }
      }

    } else {
      // ── MODO ZONA ─────────────────────────────────────────────────────
      let coordinates = processed.coordinates;

      // Sin ubicación ni coordenadas → pedir al usuario
      if (!coordinates && !processed.location) {
        const queryTypeLabels: Record<string, string> = {
          traffic: 'tráfico',
          weather: 'clima',
          route: 'ruta',
          incident: 'incidente',
        };
        const label = queryTypeLabels[processed.queryType] || 'información';
        responseText =
          `📍 ¿En qué lugar quieres consultar el ${label}?\n\n` +
          `Indica la dirección, barrio o zona.\n` +
          `Ej: "tráfico en la Calle 5" o "de la Calle 5 a la Carrera 7"`;
      }

      // Geocodificar si hay ubicación pero no coordenadas
      if (!coordinates && processed.location) {
        const geocoded = await geocodeAddress(processed.location, ENV.tomtomApiKey);
        if (geocoded) {
          coordinates = { latitude: geocoded.latitude, longitude: geocoded.longitude };
        } else {
          responseText =
            '❌ No pude encontrar la ubicación. Por favor, sé más específico.\n\nEscribe /ayuda para más información.';
        }
      }

      // ── MODO MENÚ GENERAL ───────────────────────────────────────────
      if (processed.isGeneralQuery) {
        responseText = `🚗 ¡Hola! Veo que te interesa saber sobre <b>${processed.location}</b>.\n\n¿Qué información específica necesitas?`;
        const buttons = [
          [
            { text: '🛣️ Tráfico', callback_data: `topic:traffic:${processed.location}` },
            { text: '🌤️ Clima', callback_data: `topic:weather:${processed.location}` }
          ],
          [
            { text: '⚠️ Incidentes', callback_data: `topic:incident:${processed.location}` },
            { text: '🗺️ Todo el reporte', callback_data: `topic:all:${processed.location}` }
          ]
        ];

        await sendMessageWithButtons(
          chatInfo.chatId,
          responseText,
          buttons,
          ENV.telegramBotToken
        );
        return; // Salir, ya enviamos el menú
      }

      // Obtener datos si tenemos coordenadas
      if (coordinates) {
        const traffic = await getTrafficFlow(coordinates, ENV.tomtomApiKey);
        const weather = await getWeatherData(coordinates, ENV.openweatherApiKey);
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
          responseText = formatTrafficResponse(traffic, weather, incidents, processed);
          trafficData = JSON.stringify(traffic);
          weatherData = weather ? JSON.stringify(weather) : null;
          incidentData = incidents.length > 0 ? JSON.stringify(incidents) : null;
        } else {
          responseText = '❌ No pude obtener información de tráfico en este momento. Intenta más tarde.';
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

/**
 * Maneja una consulta de callback (clic en botón)
 */
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery) {
  const { id, data, message, from } = callbackQuery;
  if (!message || !data) return;

  try {
    const chatId = message.chat.id;
    const telegramId = from.id.toString();
    
    // Verificar autorización en callbacks también
    const isAuthorized = await isTelegramUserAuthorized(telegramId);
    if (!isAuthorized) {
      await answerCallbackQuery(id, 'Acceso denegado', ENV.telegramBotToken, true);
      return;
    }

    await answerCallbackQuery(id, 'Obteniendo información...', ENV.telegramBotToken);
    await sendChatAction(chatId, 'typing', ENV.telegramBotToken);

    // Manejar mapa de ruta
    if (data.startsWith('route:map:')) {
      const [_, __, routeParts] = data.split(':');
      const [originName, destName] = routeParts.split('|');

      console.log('[Telegram] Generating map for route:', originName, '->', destName);

      const [geocodedOrigin, geocodedDest] = await Promise.all([
        geocodeAddress(originName, ENV.tomtomApiKey),
        geocodeAddress(destName, ENV.tomtomApiKey),
      ]);

      if (!geocodedOrigin || !geocodedDest) {
        console.error('[Telegram] Failed to geocode route addresses');
        await sendMessage(chatId, '❌ No pude encontrar una o ambas ubicaciones.', ENV.telegramBotToken);
        return;
      }

      const routeMapData = await getRouteMapUrl(
        { latitude: geocodedOrigin.latitude, longitude: geocodedOrigin.longitude },
        { latitude: geocodedDest.latitude, longitude: geocodedDest.longitude },
        originName,
        destName,
        ENV.googleMapsApiKey
      );

      if (!routeMapData) {
        console.error('[Telegram] Failed to generate map URL for route:', originName, '->', destName);
        await sendMessage(chatId, '❌ No pude generar la miniatura del mapa. Esto puede deberse a un problema de configuración con Google Maps. Intenta de nuevo.', ENV.telegramBotToken);
        return;
      }

      console.log('[Telegram] Sending photo with route map');

      const buttons = [[
        { text: '🗺️ Abrir en Google Maps', url: routeMapData.googleMapsUrl }
      ]];

      const photoResult = await sendPhoto(chatId, routeMapData.mapUrl, ENV.telegramBotToken, {
        caption:
          `🗺️ <b>Trazado de ruta:</b> ${originName} → ${destName}\n\n` +
          `<a href="${routeMapData.googleMapsUrl}">📍 Abrir en Google Maps</a>`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });

      if (!photoResult.ok) {
        console.error('[Telegram] Failed to send photo');
        await sendMessage(chatId, '❌ Error al enviar la imagen del mapa.', ENV.telegramBotToken);
      }
      return;
    }

    // Formato data: topic:TEMA:UBICACION
    const [_, topic, location] = data.split(':');
    
    // Simular un mensaje procesado para el formateador
    const fakeText = `${topic} en ${location}`;
    const processed = await processMessage(fakeText);
    processed.requestedTopic = topic as any;

    const geocoded = await geocodeAddress(location, ENV.tomtomApiKey);
    if (!geocoded) {
      await sendMessage(chatId, `❌ No pude encontrar la ubicación: ${location}`, ENV.telegramBotToken);
      return;
    }

    const coordinates = { latitude: geocoded.latitude, longitude: geocoded.longitude };
    
    // Obtener datos según el tema (o todos para simplificar el flujo)
    const [traffic, weather, incidents] = await Promise.all([
      getTrafficFlow(coordinates, ENV.tomtomApiKey),
      getWeatherData(coordinates, ENV.openweatherApiKey),
      getTrafficIncidents(
        {
          minLat: coordinates.latitude - 0.05,
          minLng: coordinates.longitude - 0.05,
          maxLat: coordinates.latitude + 0.05,
          maxLng: coordinates.longitude + 0.05,
        },
        ENV.tomtomApiKey
      ),
    ]);

    if (traffic) {
      const responseText = formatTrafficResponse(traffic, weather, incidents, processed);
      await sendMessage(chatId, responseText, ENV.telegramBotToken, { parse_mode: 'HTML' });
    } else {
      await sendMessage(chatId, '❌ No pude obtener la información en este momento.', ENV.telegramBotToken);
    }
  } catch (error) {
    console.error('[Telegram] Error handling callback query:', error);
  }
}

export default router;
