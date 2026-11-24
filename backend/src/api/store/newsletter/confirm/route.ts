import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { verifyNewsletterToken } from "../../../../lib/email/newsletter-token";
import confirmNewsletterWorkflow from "../../../../workflows/confirm-newsletter";

const CONFIRM_PAGE = (token: string) => `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Confirm subscription</title></head>
  <body style="font-family:Arial,Helvetica,sans-serif;padding:3rem;text-align:center">
    <h1>Confirm your subscription</h1>
    <p>Click the button to confirm your Munchies newsletter subscription.</p>
    <form method="post" action="?token=${token}">
      <button type="submit" style="font-size:1rem;padding:0.75rem 2rem;cursor:pointer">Confirm</button>
    </form>
  </body>
</html>`;

const CONFIRMED_PAGE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Subscription confirmed</title></head>
  <body style="font-family:Arial,Helvetica,sans-serif;padding:3rem;text-align:center">
    <h1>Subscription confirmed</h1>
    <p>You're now subscribed to the Munchies newsletter. You can close this tab.</p>
  </body>
</html>`;

const INVALID_PAGE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Invalid confirmation link</title></head>
  <body style="font-family:Arial,Helvetica,sans-serif;padding:3rem;text-align:center">
    <h1>Invalid or expired link</h1>
    <p>This confirmation link is invalid or has expired. Please subscribe again.</p>
  </body>
</html>`;

function tokenFromRequest(req: MedusaRequest): string | null {
  const token = req.query.token;

  if (typeof token !== "string" || !token) {
    return null;
  }

  return token;
}

// GET only validates the token and renders a confirmation step. Email
// scanners and link prefetchers must not be able to confirm a subscription.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const token = tokenFromRequest(req);
  const payload = token ? verifyNewsletterToken(token) : null;

  if (!token || !payload) {
    res.status(400).type("html").send(INVALID_PAGE);
    return;
  }

  res.status(200).type("html").send(CONFIRM_PAGE(token));
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const token = tokenFromRequest(req);
  const payload = token ? verifyNewsletterToken(token) : null;

  if (!payload) {
    res.status(400).type("html").send(INVALID_PAGE);
    return;
  }

  const customerModuleService = req.scope.resolve(Modules.CUSTOMER);

  let customer;
  try {
    customer = await customerModuleService.retrieveCustomer(
      payload.customerId,
    );
  } catch {
    customer = null;
  }

  if (!customer || customer.email !== payload.email) {
    res.status(400).type("html").send(INVALID_PAGE);
    return;
  }

  await confirmNewsletterWorkflow(req.scope).run({
    input: { customer_id: customer.id },
  });

  res.status(200).type("html").send(CONFIRMED_PAGE);
}
