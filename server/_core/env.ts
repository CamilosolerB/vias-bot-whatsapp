export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
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
