import { db } from "@repo/database";
import { getServerSession } from "@repo/auth";
import type { Session } from "next-auth";

export async function createContext() {
  const session = await getServerSession();

  return {
    db,
    session,
  };
}

export type Context = {
  db: typeof db;
  session: Session | null;
};
