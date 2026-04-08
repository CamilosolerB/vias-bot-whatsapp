import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractMessageText,
  extractUserInfo,
  extractChatInfo,
} from './telegramService';
import type { TelegramMessage } from './telegramService';

describe('Telegram Service', () => {
  let mockMessage: TelegramMessage;

  beforeEach(() => {
    mockMessage = {
      message_id: 123,
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: 456,
        type: 'private',
        username: 'testuser',
      },
      from: {
        id: 789,
        is_bot: false,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
      },
      text: 'Hola, ¿cómo está el tráfico en la Calle 5?',
    };
  });

  describe('extractMessageText', () => {
    it('should extract text from a message', () => {
      const text = extractMessageText(mockMessage);
      expect(text).toBe('Hola, ¿cómo está el tráfico en la Calle 5?');
    });

    it('should return null when message has no text', () => {
      const messageWithoutText: TelegramMessage = {
        ...mockMessage,
        text: undefined,
      };
      const text = extractMessageText(messageWithoutText);
      expect(text).toBeNull();
    });
  });

  describe('extractUserInfo', () => {
    it('should extract user information correctly', () => {
      const userInfo = extractUserInfo(mockMessage);

      expect(userInfo).toEqual({
        telegramId: '789',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should handle missing optional fields', () => {
      const messageWithoutOptionalFields: TelegramMessage = {
        ...mockMessage,
        from: {
          ...mockMessage.from,
          last_name: undefined,
          username: undefined,
        },
      };

      const userInfo = extractUserInfo(messageWithoutOptionalFields);

      expect(userInfo.telegramId).toBe('789');
      expect(userInfo.firstName).toBe('John');
      expect(userInfo.lastName).toBeUndefined();
      expect(userInfo.username).toBeUndefined();
    });
  });

  describe('extractChatInfo', () => {
    it('should extract chat information correctly', () => {
      const chatInfo = extractChatInfo(mockMessage);

      expect(chatInfo).toEqual({
        chatId: 456,
        chatType: 'private',
      });
    });

    it('should handle different chat types', () => {
      const groupMessage: TelegramMessage = {
        ...mockMessage,
        chat: {
          ...mockMessage.chat,
          type: 'group',
        },
      };

      const chatInfo = extractChatInfo(groupMessage);

      expect(chatInfo.chatType).toBe('group');
      expect(chatInfo.chatId).toBe(456);
    });
  });
});
