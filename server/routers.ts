import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getRecentQueries,
  getQueriesByContact,
  getRecentApiLogs,
  getRecentErrors,
  getUnresolvedErrors,
  getAnalyticsSummaryLastDays,
  getQueryStats,
  getActiveRoutes,
  getRouteById,
} from "./db";
import {
  getAuthorizedTelegramUsers,
  addAuthorizedTelegramUser,
  removeAuthorizedTelegramUser,
} from "./services/userAccess";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // DASHBOARD QUERIES
  // ============================================================================
  
  dashboard: router({
    /**
     * Obtiene estadísticas generales del dashboard
     */
    getStats: protectedProcedure
      .input(z.object({ days: z.number().default(1) }))
      .query(async ({ input }) => {
        try {
          const stats = await getQueryStats(input.days);
          return {
            success: true,
            data: stats,
          };
        } catch (error) {
          console.error('[Dashboard] Error getting stats:', error);
          return {
            success: false,
            error: 'Failed to get statistics',
          };
        }
      }),

    /**
     * Obtiene consultas recientes
     */
    getRecentQueries: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        try {
          const queries = await getRecentQueries(input.limit);
          return {
            success: true,
            data: queries,
          };
        } catch (error) {
          console.error('[Dashboard] Error getting recent queries:', error);
          return {
            success: false,
            error: 'Failed to get recent queries',
          };
        }
      }),

    /**
     * Obtiene logs de API recientes
     */
    getApiLogs: protectedProcedure
      .input(
        z.object({
          apiName: z.string().optional(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ input }) => {
        try {
          const logs = await getRecentApiLogs(input.apiName, input.limit);
          return {
            success: true,
            data: logs,
          };
        } catch (error) {
          console.error('[Dashboard] Error getting API logs:', error);
          return {
            success: false,
            error: 'Failed to get API logs',
          };
        }
      }),

    /**
     * Obtiene errores recientes
     */
    getErrors: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        try {
          const errors = await getRecentErrors(input.limit);
          return {
            success: true,
            data: errors,
          };
        } catch (error) {
          console.error('[Dashboard] Error getting errors:', error);
          return {
            success: false,
            error: 'Failed to get errors',
          };
        }
      }),

    /**
     * Obtiene errores no resueltos
     */
    getUnresolvedErrors: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        try {
          const errors = await getUnresolvedErrors(input.limit);
          return {
            success: true,
            data: errors,
          };
        } catch (error) {
          console.error('[Dashboard] Error getting unresolved errors:', error);
          return {
            success: false,
            error: 'Failed to get unresolved errors',
          };
        }
      }),

    /**
     * Obtiene analytics de los últimos días
     */
    getAnalytics: protectedProcedure
      .input(z.object({ days: z.number().default(30) }))
      .query(async ({ input }) => {
        try {
          const analytics = await getAnalyticsSummaryLastDays(input.days);
          return {
            success: true,
            data: analytics,
          };
        } catch (error) {
          console.error('[Dashboard] Error getting analytics:', error);
          return {
            success: false,
            error: 'Failed to get analytics',
          };
        }
      }),
  }),

  // ============================================================================
  // ROUTES MANAGEMENT
  // ============================================================================

  routes: router({
    /**
     * Obtiene todas las rutas activas
     */
    getActive: publicProcedure.query(async () => {
      try {
        const routes = await getActiveRoutes();
        return {
          success: true,
          data: routes,
        };
      } catch (error) {
        console.error('[Routes] Error getting active routes:', error);
        return {
          success: false,
          error: 'Failed to get routes',
        };
      }
    }),

    /**
     * Obtiene una ruta por ID
     */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        try {
          const route = await getRouteById(input.id);
          if (!route) {
            return {
              success: false,
              error: 'Route not found',
            };
          }
          return {
            success: true,
            data: route,
          };
        } catch (error) {
          console.error('[Routes] Error getting route:', error);
          return {
            success: false,
            error: 'Failed to get route',
          };
        }
      }),
  }),

  // ============================================================================
  // BOT STATUS
  // ============================================================================

  bot: router({
    /**
     * Obtiene el estado del bot
     */
    getStatus: publicProcedure.query(async () => {
      return {
        success: true,
        data: {
          status: 'online',
          version: '1.0.0',
          uptime: process.uptime(),
          timestamp: new Date(),
        },
      };
    }),

    /**
     * Obtiene información de configuración del bot
     */
    getConfig: protectedProcedure.query(async () => {
      return {
        success: true,
        data: {
          name: 'VíasBot WhatsApp',
          description: 'Bot para consultar estado de vías en tiempo real',
          features: [
            'Información de tráfico',
            'Datos de clima',
            'Reportes de incidentes',
            'Rutas frecuentes',
            'Analytics en tiempo real',
          ],
          supportedLanguages: ['es', 'en'],
          apiProviders: [
            'WhatsApp Cloud API',
            'TomTom Traffic API',
            'OpenWeatherMap API',
            'Google Sheets API',
          ],
        },
      };
    }),
  }),

  // ============================================================================
  // TELEGRAM USER ACCESS (FILE BASED)
  // ============================================================================

  authorizedUsers: router({
    /**
     * Obtiene todos los usuarios autorizados
     */
    list: protectedProcedure.query(async () => {
      try {
        const users = await getAuthorizedTelegramUsers();
        return {
          success: true,
          data: users,
        };
      } catch (error) {
        console.error('[AuthorizedUsers] Error listing users:', error);
        return {
          success: false,
          error: 'Failed to list authorized users',
        };
      }
    }),

    /**
     * Agrega un usuario a la lista de autorizados
     */
    add: protectedProcedure
      .input(z.object({ telegramId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await addAuthorizedTelegramUser(input.telegramId);
          return {
            success: true,
          };
        } catch (error) {
          console.error('[AuthorizedUsers] Error adding user:', error);
          return {
            success: false,
            error: 'Failed to add authorized user',
          };
        }
      }),

    /**
     * Elimina un usuario de la lista de autorizados
     */
    remove: protectedProcedure
      .input(z.object({ telegramId: z.string() }))
      .mutation(async ({ input }) => {
        try {
          await removeAuthorizedTelegramUser(input.telegramId);
          return {
            success: true,
          };
        } catch (error) {
          console.error('[AuthorizedUsers] Error removing user:', error);
          return {
            success: false,
            error: 'Failed to remove authorized user',
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
