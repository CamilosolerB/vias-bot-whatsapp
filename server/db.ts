import { eq, desc, and, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  telegramUsers,
  InsertTelegramUser,
  frequentRoutes,
  queries,
  InsertQuery,
  queryResponses,
  InsertQueryResponse,
  apiLogs,
  InsertApiLog,
  errorLogs,
  InsertErrorLog,
  analyticsSummary,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER HELPERS
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// TELEGRAM USER HELPERS
// ============================================================================

export async function upsertTelegramUser(user: InsertTelegramUser) {
  console.log("[DB Mock] Skipping upsertTelegramUser insertion for now.");
  return [{ insertId: Date.now() }];
}

export async function getTelegramUserByTelegramId(telegramId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(telegramUsers)
    .where(eq(telegramUsers.telegramId, telegramId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export async function createQuery(query: InsertQuery) {
  console.log("[DB Mock] Skipping createQuery insertion for now.");
  return [{ insertId: Date.now() }];
}

export async function getRecentQueries(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(queries)
    .orderBy(desc(queries.createdAt))
    .limit(limit);
}

export async function getQueriesByContact(telegramUserId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(queries)
    .where(eq(queries.waContactId, telegramUserId))
    .orderBy(desc(queries.createdAt))
    .limit(limit);
}

// ============================================================================
// QUERY RESPONSE HELPERS
// ============================================================================

export async function createQueryResponse(response: InsertQueryResponse) {
  console.log("[DB Mock] Skipping createQueryResponse insertion for now.");
  return [{ insertId: Date.now() }];
}

export async function updateQueryResponseStatus(
  responseId: number,
  status: string,
  messageId?: string
) {
  console.log(`[DB Mock] Skipping updateQueryResponseStatus for ${responseId}`);
  return;
}

export async function getQueryResponseById(responseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(queryResponses)
    .where(eq(queryResponses.id, responseId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// API LOG HELPERS
// ============================================================================

export async function logApiCall(log: InsertApiLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log API call: database not available");
    return;
  }

  try {
    await db.insert(apiLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to log API call:", error);
  }
}

export async function getRecentApiLogs(apiName?: string, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = apiName ? [eq(apiLogs.apiName, apiName)] : [];

  return await db
    .select()
    .from(apiLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(apiLogs.createdAt))
    .limit(limit);
}

// ============================================================================
// ERROR LOG HELPERS
// ============================================================================

export async function logError(error: InsertErrorLog) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log error: database not available");
    return;
  }

  try {
    await db.insert(errorLogs).values(error);
  } catch (dbError) {
    console.error("[Database] Failed to log error:", dbError);
  }
}

export async function getRecentErrors(limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(errorLogs)
    .orderBy(desc(errorLogs.createdAt))
    .limit(limit);
}

export async function getUnresolvedErrors(limit: number = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(errorLogs)
    .where(eq(errorLogs.resolved, 0))
    .orderBy(desc(errorLogs.createdAt))
    .limit(limit);
}

// ============================================================================
// FREQUENT ROUTES HELPERS
// ============================================================================

export async function getActiveRoutes() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(frequentRoutes)
    .where(eq(frequentRoutes.isActive, 1))
    .orderBy(frequentRoutes.name);
}

export async function getRouteById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(frequentRoutes)
    .where(eq(frequentRoutes.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

export async function getAnalyticsSummaryForDate(date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(analyticsSummary)
    .where(eq(analyticsSummary.date, date))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getAnalyticsSummaryLastDays(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  return await db
    .select()
    .from(analyticsSummary)
    .where(gte(analyticsSummary.date, startDateStr))
    .orderBy(desc(analyticsSummary.date));
}

export async function getQueryStats(days: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // This is a simplified query - for production, use raw SQL for better performance
  const recentQueries = await db
    .select()
    .from(queries)
    .where(gte(queries.createdAt, startDate));

  const totalQueries = recentQueries.length;
  const successfulQueries = recentQueries.filter(q => q.success === 1).length;
  const avgResponseTime = recentQueries.length > 0
    ? Math.round(
        recentQueries.reduce((sum, q) => sum + (q.responseTime || 0), 0) / recentQueries.length
      )
    : 0;

  const successRate = totalQueries > 0
    ? Math.round((successfulQueries / totalQueries) * 100)
    : 100;

  return {
    totalQueries,
    successfulQueries,
    avgResponseTime,
    successRate,
  };
}
