import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Telegram Users - Usuarios que han interactuado con el bot
 */
export const telegramUsers = mysqlTable("telegram_users", {
  id: int("id").autoincrement().primaryKey(),
  telegramId: varchar("telegram_id", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: int("message_count").default(0),
  isBlocked: int("is_blocked").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = typeof telegramUsers.$inferInsert;

/**
 * Frequent Routes - Rutas frecuentes configuradas
 */
export const frequentRoutes = mysqlTable("frequent_routes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startLocation: varchar("start_location", { length: 255 }).notNull(),
  endLocation: varchar("end_location", { length: 255 }).notNull(),
  startLat: varchar("start_lat", { length: 20 }).notNull(),
  startLng: varchar("start_lng", { length: 20 }).notNull(),
  endLat: varchar("end_lat", { length: 20 }).notNull(),
  endLng: varchar("end_lng", { length: 20 }).notNull(),
  isActive: int("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FrequentRoute = typeof frequentRoutes.$inferSelect;
export type InsertFrequentRoute = typeof frequentRoutes.$inferInsert;

/**
 * Queries - Historial de consultas de usuarios
 */
export const queries = mysqlTable("queries", {
  id: int("id").autoincrement().primaryKey(),
  waContactId: int("wa_contact_id").notNull(),
  queryText: text("query_text").notNull(),
  queryType: varchar("query_type", { length: 50 }).notNull(), // 'traffic', 'weather', 'route', etc
  location: varchar("location", { length: 255 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  responseTime: int("response_time"), // en milisegundos
  success: int("success").default(1),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Query = typeof queries.$inferSelect;
export type InsertQuery = typeof queries.$inferInsert;

/**
 * Query Responses - Respuestas enviadas a usuarios
 */
export const queryResponses = mysqlTable("query_responses", {
  id: int("id").autoincrement().primaryKey(),
  queryId: int("query_id").notNull(),
  waContactId: int("wa_contact_id").notNull(),
  responseText: text("response_text").notNull(),
  trafficData: text("traffic_data"), // JSON
  weatherData: text("weather_data"), // JSON
  incidentData: text("incident_data"), // JSON
  messageId: varchar("message_id", { length: 255 }),
  deliveryStatus: varchar("delivery_status", { length: 50 }).default("pending"), // pending, sent, delivered, read, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type QueryResponse = typeof queryResponses.$inferSelect;
export type InsertQueryResponse = typeof queryResponses.$inferInsert;

/**
 * API Logs - Logs de llamadas a APIs externas
 */
export const apiLogs = mysqlTable("api_logs", {
  id: int("id").autoincrement().primaryKey(),
  apiName: varchar("api_name", { length: 100 }).notNull(), // 'tomtom', 'openweather', 'google_sheets'
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  statusCode: int("status_code"),
  responseTime: int("response_time"), // en milisegundos
  success: int("success").default(1),
  errorMessage: text("error_message"),
  requestData: text("request_data"), // JSON
  responseData: text("response_data"), // JSON (truncado si es muy grande)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ApiLog = typeof apiLogs.$inferSelect;
export type InsertApiLog = typeof apiLogs.$inferInsert;

/**
 * Error Logs - Errores del sistema
 */
export const errorLogs = mysqlTable("error_logs", {
  id: int("id").autoincrement().primaryKey(),
  errorType: varchar("error_type", { length: 100 }).notNull(),
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  context: text("context"), // JSON con información adicional
  severity: varchar("severity", { length: 20 }).default("error"), // 'info', 'warning', 'error', 'critical'
  resolved: int("resolved").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

/**
 * Analytics Summary - Datos agregados de uso (actualizado diariamente)
 */
export const analyticsSummary = mysqlTable("analytics_summary", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  totalQueries: int("total_queries").default(0),
  totalUsers: int("total_users").default(0),
  avgResponseTime: int("avg_response_time").default(0), // en ms
  successRate: varchar("success_rate", { length: 10 }).default("100"), // porcentaje
  topQueryType: varchar("top_query_type", { length: 50 }),
  topLocation: varchar("top_location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AnalyticsSummary = typeof analyticsSummary.$inferSelect;
export type InsertAnalyticsSummary = typeof analyticsSummary.$inferInsert;