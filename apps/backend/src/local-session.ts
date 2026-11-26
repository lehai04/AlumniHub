import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type Account = {
  id: string;
  role: "admin" | "alumni" | "applicant" | "reviewer";
};
export type LocalPasswords = {
  admin: string;
  alumni: string;
  reviewer?: string;
};
export type StaffPasswords = Pick<LocalPasswords, "admin" | "reviewer">;
const maxAge = 8 * 60 * 60;
const digest = (value: string) => createHash("sha256").update(value).digest();

export function createSessions(cookieName: string, secure: boolean) {
  const attributes = `Path=/; HttpOnly; SameSite=Strict${secure ? "; Secure" : ""}`;
  const sessions = new Map<string, { account: Account; expires: number }>();
  const tokenPattern = new RegExp(
    `(?:^|;\\s*)${cookieName}=([a-f0-9]{64})(?:;|$)`,
  );
  const tokenFrom = (cookie: string | undefined) =>
    cookie?.match(tokenPattern)?.[1];

  function end(cookie: string | undefined) {
    const token = tokenFrom(cookie);
    if (token) sessions.delete(token);
  }

  function issue(account: Account, cookie: string | undefined) {
    end(cookie);
    for (const [token, session] of sessions) {
      if (session.expires <= Date.now()) sessions.delete(token);
    }
    const oldest = sessions.keys().next().value;
    if (sessions.size >= 4096 && oldest) sessions.delete(oldest);
    const token = randomBytes(32).toString("hex");
    sessions.set(token, { account, expires: Date.now() + maxAge * 1000 });
    return {
      account,
      cookie: `${cookieName}=${token}; ${attributes}; Max-Age=${maxAge}`,
    };
  }

  return {
    issue,
    revokeAccount(id: string) {
      for (const [token, session] of sessions)
        if (session.account.id === id) sessions.delete(token);
    },
    read(cookie: string | undefined) {
      const token = tokenFrom(cookie);
      if (!token) return null;
      const session = sessions.get(token);
      if (session && session.expires > Date.now()) return session.account;
      sessions.delete(token);
      return null;
    },
    clear(cookie: string | undefined) {
      end(cookie);
      return `${cookieName}=; ${attributes}; Max-Age=0`;
    },
  };
}

export function matchesPassword(
  password: unknown,
  expected: string | undefined,
) {
  return (
    typeof password === "string" &&
    password.length <= 128 &&
    expected !== undefined &&
    timingSafeEqual(digest(password), digest(expected))
  );
}
