import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Authentication is mocked for full access.
  const user: User = { 
    id: 1, 
    openId: "mock-admin",
    name: "Admin",
    email: "admin@bot.vias",
    role: "admin", 
    loginMethod: "mock",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date()
  };

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
