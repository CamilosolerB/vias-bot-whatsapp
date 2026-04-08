export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Telegram Bot API
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  // TomTom API
  tomtomApiKey: process.env.TOMTOM_API_KEY ?? "",
  // OpenWeatherMap API
  openweatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
  // Google Sheets
  googleSheetsApiKey: process.env.GOOGLE_SHEETS_API_KEY ?? "",
  googleSheetsSheetId: process.env.GOOGLE_SHEETS_SHEET_ID ?? "",
};
