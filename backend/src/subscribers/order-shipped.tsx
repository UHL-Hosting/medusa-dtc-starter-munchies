import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { sendEmail } from "../lib/email/send";
import ShippingConfirmation from "../lib/email/templates/shipping-confirmation";

export default async function orderShippedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderService = container.resolve(Modules.ORDER);

    const order = await orderService.retrieveOrder(event.data.id, {
      select: ["email"],
    });

    if (!order?.email) {
      return;
    }

    await sendEmail({
      to: order.email,
      subject: "Your order is shipped!",
      react: <ShippingConfirmation />,
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["order.fulfillment_created"],
};
