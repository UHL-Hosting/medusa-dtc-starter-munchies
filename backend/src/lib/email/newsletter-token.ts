import crypto from "node:crypto";

// Double opt-in tokens are HMAC-signed and carry their own expiry, so no
// per-subscriber token state has to be stored.
const TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

type NewsletterTokenPayload = {
  c: string;
  e: string;
  x: number;
};

function signingKey(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET must be set to sign newsletter confirmation tokens",
    );
  }

  return secret;
}

function sign(payload: string): Buffer {
  return crypto.createHmac("sha256", signingKey()).update(payload).digest();
}

export function createNewsletterToken(
  customerId: string,
  email: string,
): string {
  const payload = Buffer.from(
    JSON.stringify({
      c: customerId,
      e: email,
      x: Date.now() + TOKEN_TTL_MS,
    } satisfies NewsletterTokenPayload),
  ).toString("base64url");

  return `${payload}.${sign(payload).toString("base64url")}`;
}

export function verifyNewsletterToken(
  token: string,
): { customerId: string; email: string } | null {
  const [payload, signature] = (token ?? "").split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const actual = Buffer.from(signature, "base64url");

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as NewsletterTokenPayload;

    if (
      typeof decoded.c !== "string" ||
      typeof decoded.e !== "string" ||
      typeof decoded.x !== "number" ||
      decoded.x < Date.now()
    ) {
      return null;
    }

    return { customerId: decoded.c, email: decoded.e };
  } catch {
    return null;
  }
}
