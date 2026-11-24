import type { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { sendEmail } from "../lib/email/send";
import OrderConfirmation from "../lib/email/templates/order-confirmation";

export default async function orderCreatedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const orderService = container.resolve(Modules.ORDER);

    const order = await orderService.retrieveOrder(event.data.id, {
      relations: [
        "items",
        "shipping_methods",
        "shipping_address",
        "billing_address",
        "summary",
      ],
      select: [
        "email",
        "total",
        "item_subtotal",
        "discount_total",
        "shipping_total",
        "currency_code",
      ],
    });

    if (!order?.email) {
      return;
    }

    await sendEmail({
      to: order.email,
      subject: "Thank you for your order",
      react: <OrderConfirmation order={order} />,
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
};
