import { Router, Request, Response } from 'express';
import {
  parseWebhookPayload,
  sendTextMessage,
  sendInteractiveMessage,
  verifyWebhookSignature,
  markMessageAsRead,
} from '../services/whatsappService';
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
  formatTrafficResponse,
  getRoadRiskAlerts,
} from '../services/trafficWeatherService';
import { geocodeAddress } from '../services/geocodingService';
import {
  createQuery,
  createQueryResponse,
  logError,
} from '../db';
import { ENV } from '../_core/env';

const router = Router();

router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = ENV.whatsappVerifyToken;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp] Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

router.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;

    if (ENV.whatsappAppSecret && signature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        ENV.whatsappAppSecret
      );

      if (!isValid) {
        console.error('[WhatsApp] Invalid webhook signature');
        res.status(403).json({ error: 'Invalid signature' });
        return;
      }
    }

    // --- SUSPENSION DEL SERVICIO ---
    // Responde con 200 para evitar que Meta siga reintentando, pero no procesa el mensaje
    res.status(200).json({ ok: true });

    const payload = req.body;
    const { messages } = parseWebhookPayload(payload);

    if (!messages || messages.length === 0) {
      return;
    }

    for (const msg of messages) {
      const from = msg.from;
      const phoneNumberId = msg.phone_number_id;
      
      // Enviar mensaje de suspensión una sola vez o en cada mensaje
      await sendTextMessage(
        phoneNumberId,
        from,
        '⚠️ *Servicio Suspendido*\n\nEl servicio de WhatsApp se encuentra temporalmente fuera de servicio. Por favor, utiliza el bot de Telegram para tus consultas.',
        ENV.whatsappAccessToken
      );
      
      console.log(`[WhatsApp] Service suspended message sent to ${from}`);
    }
    return;
    // --- FIN SUSPENSION ---

    // El código original queda inaccesible mientras esté la suspensión arriba
    /*
    const payload = req.body;
    const { messages } = parseWebhookPayload(payload);

    if (!messages || messages.length === 0) {
      return;
    }

    for (const msg of messages) {
      // Manejar mensajes interactivos (respuesta a botones)
      if (msg.type === 'interactive' && msg.interactive?.type === 'button_reply') {
        await handleButtonResponse(msg);
      } else {
        await handleIncomingMessage(msg);
      }
    }
    */
  } catch (error) {
    console.error('[WhatsApp Webhook] Error processing update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function handleIncomingMessage(message: any) {
  const startTime = Date.now();

  try {
    const from = message.from;
    const text = message.text?.body;
    const messageId = message.id;

    if (!text) {
      return;
    }

    const phoneNumberId = message.phone_number_id;

    // Marcar mensaje como leído
    if (messageId) {
      await markMessageAsRead(phoneNumberId, messageId, ENV.whatsappAccessToken);
    }

    let responseText = '';
    let trafficData = null;
    let weatherData = null;
    let incidentData = null;

    const processed = await processMessage(text);

    // Crear registro de consulta
    const queryRecord = await createQuery({
      waContactId: 0, // WhatsApp users are not stored in DB yet
      queryText: text,
      queryType: processed.queryType,
      location: processed.location,
      latitude: processed.coordinates?.latitude?.toString(),
      longitude: processed.coordinates?.longitude?.toString(),
      responseTime: 0,
      success: 1,
    });

    if (processed.queryType === 'help') {
      responseText = generateHelpMessage();
    } else if (!isValidQuery(processed) && processed.queryType !== 'info') {
      responseText = generateUnknownMessage();
    } else if (processed.queryType === 'info') {
      responseText = generateDefinitionMessage(processed.infoTopic);
    } else if (processed.origin && processed.destination) {
      const [geocodedOrigin, geocodedDest] = await Promise.all([
        geocodeAddress(processed.origin, ENV.tomtomApiKey),
        geocodeAddress(processed.destination, ENV.tomtomApiKey),
      ]);

      if (!geocodedOrigin) {
        responseText = `No pude encontrar el origen: "${processed.origin}". Sé más específico con la dirección.`;
      } else if (!geocodedDest) {
        responseText = `No pude encontrar el destino: "${processed.destination}". Sé más específico con la dirección.`;
      } else {
        const [routeInfo, traffic, weather, incidents] = await Promise.all([
          getRouteTime(
            { latitude: geocodedOrigin.latitude, longitude: geocodedOrigin.longitude },
            { latitude: geocodedDest.latitude, longitude: geocodedDest.longitude },
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

        if (traffic) {
          responseText = formatTrafficResponse(traffic, weather, incidents, processed, routeInfo);
          trafficData = JSON.stringify(traffic);
          weatherData = weather ? JSON.stringify(weather) : null;
          incidentData = incidents.length > 0 ? JSON.stringify(incidents) : null;
        } else {
          responseText = 'No pude obtener información de tráfico en este momento. Intenta más tarde.';
        }
      }
    } else {
      let coordinates = processed.coordinates;

      if (!coordinates && !processed.location) {
        const queryTypeLabels: Record<string, string> = {
          traffic: 'tráfico',
          weather: 'clima',
          route: 'ruta',
          incident: 'incidente',
        };
        const label = queryTypeLabels[processed.queryType] || 'información';
        responseText = `¿En qué lugar quieres consultar el ${label}?\n\nIndica la dirección, barrio o zona.`;
      }

      if (!coordinates && processed.location) {
        const geocoded = await geocodeAddress(processed.location, ENV.tomtomApiKey);
        if (geocoded) {
          coordinates = { latitude: geocoded.latitude, longitude: geocoded.longitude };
        } else {
          responseText = 'No pude encontrar la ubicación. Por favor, sé más específico.';
        }
      }

      // Menú general con botones interactivos
      if (processed.isGeneralQuery && coordinates) {
        responseText = `¡Hola! Veo que te interesa saber sobre "${processed.location}".\n\n¿Qué información específica necesitas?`;
        
        const result = await sendInteractiveMessage(
          phoneNumberId,
          from,
          `Info sobre ${processed.location}`,
          `¿Qué deseas consultar en ${processed.location}?`,
          [
            { id: `traffic:${processed.location}`, title: '🛣️ Tráfico' },
            { id: `weather:${processed.location}`, title: '🌤️ Clima' },
            { id: `incident:${processed.location}`, title: '⚠️ Incidentes' },
            { id: `all:${processed.location}`, title: '🗺️ Todo el reporte' },
          ],
          ENV.whatsappAccessToken
        );

        if (result) {
          console.log(`[WhatsApp] Sent interactive message to ${from}:`, result.message_id);
        }
        return;
      }

      if (coordinates) {
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
          responseText = formatTrafficResponse(traffic, weather, incidents, processed);
          trafficData = JSON.stringify(traffic);
          weatherData = weather ? JSON.stringify(weather) : null;
          incidentData = incidents.length > 0 ? JSON.stringify(incidents) : null;
        } else {
          responseText = 'No pude obtener información de tráfico en este momento. Intenta más tarde.';
        }
      }
    }

    const result = await sendTextMessage(
      phoneNumberId,
      from,
      responseText,
      ENV.whatsappAccessToken
    );

    if (result) {
      // Guardar respuesta en BD
      await createQueryResponse({
        queryId: (queryRecord as any).insertId,
        waContactId: 0,
        responseText,
        trafficData,
        weatherData,
        incidentData,
        messageId: result.message_id,
        deliveryStatus: 'sent',
      });

      console.log(`[WhatsApp] Sent message to ${from}:`, result.message_id);
    }

    const responseTime = Date.now() - startTime;
    console.log(`[WhatsApp] Processed message from ${from} in ${responseTime}ms`);
  } catch (error) {
    console.error('[WhatsApp] Error handling incoming message:', error);
    await logError({
      errorType: 'whatsapp_message_error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined,
      context: JSON.stringify({ message }),
      severity: 'error',
    });

    try {
      const phoneNumberId = message.phone_number_id;
      const from = message.from;
      await sendTextMessage(
        phoneNumberId,
        from,
        'Ocurrió un error procesando tu solicitud. Intenta nuevamente.',
        ENV.whatsappAccessToken
      );
    } catch (sendError) {
      console.error('[WhatsApp] Failed to send error message:', sendError);
    }
  }
}

/**
 * Maneja respuestas de botones interactivos de WhatsApp
 */
async function handleButtonResponse(message: any) {
  try {
    const from = message.from;
    const phoneNumberId = message.phone_number_id;
    const buttonReply = message.interactive?.button_reply;

    if (!buttonReply?.id) {
      return;
    }

    const buttonId = buttonReply.id;
    const [topic, location] = buttonId.split(':');

    if (!location) {
      return;
    }

    // Simular un mensaje procesado
    const fakeText = `${topic} en ${location}`;
    const processed = await processMessage(fakeText);
    processed.requestedTopic = topic as any;

    const geocoded = await geocodeAddress(location, ENV.tomtomApiKey);
    if (!geocoded) {
      await sendTextMessage(
        phoneNumberId,
        from,
        `No pude encontrar la ubicación: ${location}`,
        ENV.whatsappAccessToken
      );
      return;
    }

    const coordinates = { latitude: geocoded.latitude, longitude: geocoded.longitude };

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
      await sendTextMessage(
        phoneNumberId,
        from,
        responseText,
        ENV.whatsappAccessToken
      );
    } else {
      await sendTextMessage(
        phoneNumberId,
        from,
        'No pude obtener la información en este momento.',
        ENV.whatsappAccessToken
      );
    }
  } catch (error) {
    console.error('[WhatsApp] Error handling button response:', error);
  }
}

export default router;