import { describe, it, expect } from 'vitest';
import { getMe, getWebhookInfo } from './telegramService';
import { ENV } from '../_core/env';

describe('API Credentials Validation', () => {
  describe('Telegram Bot Token', () => {
    it('should validate Telegram bot token by calling getMe', async () => {
      if (!ENV.telegramBotToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
      }

      const botInfo = await getMe(ENV.telegramBotToken);

      expect(botInfo).not.toBeNull();
      expect(botInfo).toHaveProperty('id');
      expect(botInfo).toHaveProperty('first_name');
      expect(botInfo).toHaveProperty('username');
      expect(botInfo.is_bot).toBe(true);
    });

    it('should get webhook info to verify bot connectivity', async () => {
      if (!ENV.telegramBotToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
      }

      const webhookInfo = await getWebhookInfo(ENV.telegramBotToken);

      // Webhook info should be available even if not configured
      expect(webhookInfo).not.toBeNull();
      expect(webhookInfo).toHaveProperty('url');
      expect(webhookInfo).toHaveProperty('has_custom_certificate');
    });
  });

  describe('TomTom API Key', () => {
    it('should validate TomTom API key with a simple geocoding request', async () => {
      if (!ENV.tomtomApiKey) {
        throw new Error('TOMTOM_API_KEY is not configured');
      }

      const url = `https://api.tomtom.com/search/2/geocode/Bogota.json?key=${ENV.tomtomApiKey}&limit=1`;

      const response = await fetch(url);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.ok).toBe(true);
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.results.length).toBeGreaterThan(0);
    });
  });

  describe('OpenWeatherMap API Key', () => {
    it('should validate OpenWeatherMap API key with a weather request', async () => {
      if (!ENV.openweatherApiKey) {
        throw new Error('OPENWEATHER_API_KEY is not configured');
      }

      // Bogotá coordinates
      const latitude = 4.7110;
      const longitude = -74.0721;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${ENV.openweatherApiKey}&units=metric`;

      const response = await fetch(url);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.cod).toBe(200);
      expect(data).toHaveProperty('main');
      expect(data.main).toHaveProperty('temp');
      expect(data).toHaveProperty('weather');
      expect(Array.isArray(data.weather)).toBe(true);
    });
  });
});
