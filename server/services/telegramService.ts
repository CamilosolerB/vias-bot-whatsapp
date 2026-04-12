/**
 * Telegram Bot Service
 * Maneja la comunicación con Telegram Bot API
 */

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: {
    id: number;
    type: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  text?: string;
  entities?: Array<{ type: string; offset: number; length: number }>;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramMessage['from'];
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

/**
 * Envía un mensaje de texto a través de Telegram
 */
export async function sendMessage(
  chatId: number | string,
  text: string,
  botToken: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: any;
  }
): Promise<{ ok: boolean; result?: any }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error sending message:', data);
      return { ok: false };
    }

    return { ok: true, result: data.result };
  } catch (error) {
    console.error('[Telegram] Exception sending message:', error);
    return { ok: false };
  }
}

/**
 * Envía una acción de escritura (typing indicator)
 */
export async function sendChatAction(
  chatId: number | string,
  action: 'typing' | 'upload_photo' | 'record_video' | 'upload_video',
  botToken: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendChatAction`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action,
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('[Telegram] Exception sending chat action:', error);
    return false;
  }
}

/**
 * Obtiene información del bot
 */
export async function getMe(botToken: string): Promise<any | null> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error getting bot info:', data);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('[Telegram] Exception getting bot info:', error);
    return null;
  }
}

/**
 * Configura el webhook de Telegram
 */
export async function setWebhook(
  webhookUrl: string,
  botToken: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'edited_message'],
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error setting webhook:', data);
      return false;
    }

    console.log('[Telegram] Webhook set successfully');
    return true;
  } catch (error) {
    console.error('[Telegram] Exception setting webhook:', error);
    return false;
  }
}

/**
 * Elimina el webhook de Telegram
 */
export async function deleteWebhook(botToken: string): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error deleting webhook:', data);
      return false;
    }

    console.log('[Telegram] Webhook deleted successfully');
    return true;
  } catch (error) {
    console.error('[Telegram] Exception deleting webhook:', error);
    return false;
  }
}

/**
 * Obtiene información del webhook
 */
export async function getWebhookInfo(botToken: string): Promise<any | null> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error getting webhook info:', data);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('[Telegram] Exception getting webhook info:', error);
    return null;
  }
}

/**
 * Envía un mensaje con botones inline
 */
export async function sendMessageWithButtons(
  chatId: number | string,
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>,
  botToken: string
): Promise<{ ok: boolean; result?: any }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: buttons,
        },
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error sending message with buttons:', data);
      return { ok: false };
    }

    return { ok: true, result: data.result };
  } catch (error) {
    console.error('[Telegram] Exception sending message with buttons:', error);
    return { ok: false };
  }
}

/**
 * Edita un mensaje existente
 */
export async function editMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  botToken: string
): Promise<{ ok: boolean; result?: any }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/editMessageText`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[Telegram] Error editing message:', data);
      return { ok: false };
    }

    return { ok: true, result: data.result };
  } catch (error) {
    console.error('[Telegram] Exception editing message:', error);
    return { ok: false };
  }
}

/**
 * Responde a una consulta de callback
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
  botToken: string,
  showAlert: boolean = false
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });

    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error('[Telegram] Exception answering callback query:', error);
    return false;
  }
}

/**
 * Extrae texto de un mensaje de Telegram
 */
export function extractMessageText(message: TelegramMessage): string | null {
  return message.text || null;
}

/**
 * Extrae información del usuario de un mensaje de Telegram
 */
export function extractUserInfo(message: TelegramMessage) {
  return {
    telegramId: message.from.id.toString(),
    username: message.from.username,
    firstName: message.from.first_name,
    lastName: message.from.last_name,
  };
}

/**
 * Extrae información del chat de un mensaje de Telegram
 */
export function extractChatInfo(message: TelegramMessage) {
  return {
    chatId: message.chat.id,
    chatType: message.chat.type,
  };
}
