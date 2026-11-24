import { CreateCustomerDTO, MetadataType } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

type SubscribeResult = {
  id: string;
  action: "created" | "pending" | "none";
};

type SubscribeCompensation = {
  action: "created" | "pending";
  id: string;
  previous?: MetadataType;
};

const subscribeCustomerToNewsletter = createStep(
  "subscribe-customer-to-newsletter",
  async (input: CreateCustomerDTO, { container }) => {
    const customerModuleService = container.resolve(Modules.CUSTOMER);

    const customer = await customerModuleService
      .listCustomers({ email: input.email }, { select: ["id", "metadata"] })
      .then((customers) => (customers.length > 0 ? customers[0] : null));

    if (!customer) {
      const created = await customerModuleService.createCustomers({
        ...input,
        metadata: {
          ...input.metadata,
          newsletter_pending: true,
        },
      });

      return new StepResponse<SubscribeResult, SubscribeCompensation>(
        { id: created.id, action: "created" },
        { action: "created", id: created.id },
      );
    }

    if (customer.metadata?.newsletter) {
      return new StepResponse<SubscribeResult, SubscribeCompensation>({
        id: customer.id,
        action: "none",
      });
    }

    const previous = (customer.metadata ?? {}) as MetadataType;

    await customerModuleService.updateCustomers(customer.id, {
      metadata: { ...previous, newsletter_pending: true },
    });

    return new StepResponse<SubscribeResult, SubscribeCompensation>(
      { id: customer.id, action: "pending" },
      { action: "pending", id: customer.id, previous },
    );
  },
  async (compensation, { container }) => {
    if (!compensation?.id) {
      return;
    }

    const customerModuleService = container.resolve(Modules.CUSTOMER);

    if (compensation.action === "created") {
      await customerModuleService.deleteCustomers(compensation.id);

      return;
    }

    if (compensation.action === "pending") {
      await customerModuleService.updateCustomers(compensation.id, {
        metadata: compensation.previous,
      });
    }
  },
);

export type WorkflowInput = CreateCustomerDTO;

const subscribeToNewsletterWorkflow = createWorkflow(
  "subscribe-to-newsletter",
  function (input: WorkflowInput) {
    const result = subscribeCustomerToNewsletter(input);

    when({ result }, ({ result }) => result.action !== "none").then(() => {
      emitEventStep({
        eventName: "newsletter.signup",
        data: { id: result.id },
      });
    });

    return new WorkflowResponse(result.id);
  },
);

export default subscribeToNewsletterWorkflow;
