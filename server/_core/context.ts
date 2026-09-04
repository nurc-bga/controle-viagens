import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserById } from "../db";
import { getUserIdFromPasswordSession } from "../passwordAuth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const passwordUserId = getUserIdFromPasswordSession(opts.req);
  if (passwordUserId) {
    const passwordUser = await getUserById(passwordUserId);
    user = passwordUser?.passwordHash && passwordUser.active !== 0 ? passwordUser : null;
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  if (user?.active === 0) user = null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
