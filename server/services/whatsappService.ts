import crypto from 'crypto';

/**
 * WhatsApp Cloud API Service
 * Maneja la comunicación con WhatsApp Business Platform
 */

const WHATSAPP_API_VERSION = 'v20.0';
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

interface WhatsappWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          [key: string]: any;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id?: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

interface SendMessageParams {
  phone_number_id: string;
  to: string;
  message_type: 'text' | 'template' | 'interactive';
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    parameters?: { body: Array<{ type: string; text: string }> };
  };
  interactive?: any;
}

/**
 * Verifica la firma del webhook para garantizar que proviene de Meta
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  return `sha256=${hash}` === signature;
}

/**
 * Extrae información de un webhook de WhatsApp
 */
export function parseWebhookPayload(payload: WhatsappWebhookPayload) {
  const messages: any[] = [];
  const statuses: any[] = [];

  payload.entry.forEach((entry) => {
    entry.changes.forEach((change) => {
      if (change.field === 'messages' && change.value.messages) {
        messages.push(
          ...change.value.messages.map((msg) => ({
            ...msg,
            phone_number_id: change.value.metadata.phone_number_id,
            display_phone_number: change.value.metadata.display_phone_number,
            contact_name: change.value.contacts?.[0]?.profile?.name,
          }))
        );
      }

      if (change.field === 'messages' && change.value.statuses) {
        statuses.push(
          ...change.value.statuses.map((status) => ({
            ...status,
            phone_number_id: change.value.metadata.phone_number_id,
          }))
        );
      }
    });
  });

  return { messages, statuses };
}

/**
 * Envía un mensaje de texto a través de WhatsApp
 */
export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
  accessToken: string
): Promise<{ message_id: string } | null> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[WhatsApp] Error sending message:', error);
      return null;
    }

    const data = await response.json();
    return { message_id: data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp] Exception sending message:', error);
    return null;
  }
}

/**
 * Envía un mensaje de plantilla a través de WhatsApp
 */
export async function sendTemplateMessage(
  phoneNumberId: string,
  to: string,
  templateName: string,
  templateParams: string[],
  accessToken: string
): Promise<{ message_id: string } | null> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'es_MX' },
            parameters: {
              body: templateParams.map((param) => ({
                type: 'text',
                text: param,
              })),
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[WhatsApp] Error sending template:', error);
      return null;
    }

    const data = await response.json();
    return { message_id: data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp] Exception sending template:', error);
    return null;
  }
}

/**
 * Envía un mensaje interactivo (con botones)
 */
export async function sendInteractiveMessage(
  phoneNumberId: string,
  to: string,
  headerText: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  accessToken: string
): Promise<{ message_id: string } | null> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'interactive',
          interactive: {
            type: 'button',
            header: {
              type: 'text',
              text: headerText,
            },
            body: {
              text: bodyText,
            },
            action: {
              buttons: buttons.map((btn) => ({
                type: 'reply',
                reply: {
                  id: btn.id,
                  title: btn.title,
                },
              })),
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[WhatsApp] Error sending interactive message:', error);
      return null;
    }

    const data = await response.json();
    return { message_id: data.messages[0].id };
  } catch (error) {
    console.error('[WhatsApp] Exception sending interactive message:', error);
    return null;
  }
}

/**
 * Marca un mensaje como leído
 */
export async function markMessageAsRead(
  phoneNumberId: string,
  messageId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[WhatsApp] Exception marking message as read:', error);
    return false;
  }
}

/**
 * Obtiene el perfil de un contacto
 */
export async function getContactProfile(
  phoneNumberId: string,
  waId: string,
  accessToken: string
): Promise<{ name?: string; [key: string]: any } | null> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/contacts?contacts=${waId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.contacts?.[0] || null;
  } catch (error) {
    console.error('[WhatsApp] Exception getting contact profile:', error);
    return null;
  }
}
