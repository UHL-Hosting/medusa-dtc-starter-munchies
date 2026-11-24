import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { createNewsletterToken } from "../lib/email/newsletter-token";
import { sendEmail } from "../lib/email/send";
import NewsletterConfirm from "../lib/email/templates/newsletter-confirm";
import Welcome from "../lib/email/templates/welcome";

function backendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://localhost:9000").replace(/\/+$/, "");
}

export default async function newsletterEmailHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const customerModuleService = container.resolve(Modules.CUSTOMER);
    const customer = await customerModuleService.retrieveCustomer(
      event.data.id,
    );

    if (!customer.email) {
      return;
    }

    if (event.name === "newsletter.signup") {
      if (customer.metadata?.newsletter) {
        return;
      }

      const token = createNewsletterToken(customer.id, customer.email);
      const confirmUrl = `${backendUrl()}/store/newsletter/confirm?token=${encodeURIComponent(token)}`;

      await sendEmail({
        to: customer.email,
        subject: "Confirm your Munchies newsletter subscription",
        react: <NewsletterConfirm confirmUrl={confirmUrl} />,
      });

      return;
    }

    // newsletter.confirmed
    if (!customer.metadata?.newsletter) {
      return;
    }

    const productService = container.resolve(Modules.PRODUCT);
    const products = await productService.listProducts({}, { take: 2 });

    await sendEmail({
      to: customer.email,
      subject: "Welcome to our newsletter!",
      react: <Welcome products={products} />,
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["newsletter.signup", "newsletter.confirmed"],
};
