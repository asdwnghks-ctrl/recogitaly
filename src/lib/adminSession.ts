import crypto from "crypto";

export const ADMIN_COOKIE = "recogitaly_admin";

export function createAdminToken() {
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!code) {
    throw new Error("ADMIN_ACCESS_CODE is not configured.");
  }

  return crypto.createHmac("sha256", code).update("recogitaly-admin").digest("hex");
}

export function isAdminToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(createAdminToken()));
  } catch {
    return false;
  }
}
