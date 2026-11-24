import { MetadataType } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { emitEventStep } from "@medusajs/medusa/core-flows";

type ConfirmNewsletterInput = {
  customer_id: string;
};

type ConfirmNewsletterResult = {
  id: string;
  changed: boolean;
};

type ConfirmNewsletterCompensation = {
  id: string;
  previous: MetadataType;
};

const confirmNewsletterSubscription = createStep(
  "confirm-newsletter-subscription",
  async (input: ConfirmNewsletterInput, { container }) => {
    const customerModuleService = container.resolve(Modules.CUSTOMER);

    const customer = await customerModuleService.retrieveCustomer(
      input.customer_id,
    );
    const previous = (customer.metadata ?? {}) as MetadataType;

    if (previous.newsletter) {
      return new StepResponse<
        ConfirmNewsletterResult,
        ConfirmNewsletterCompensation
      >({
        id: customer.id,
        changed: false,
      });
    }

    const next: MetadataType = { ...previous, newsletter: true };
    delete next.newsletter_pending;

    await customerModuleService.updateCustomers(customer.id, {
      metadata: next,
    });

    return new StepResponse<
      ConfirmNewsletterResult,
      ConfirmNewsletterCompensation
    >({ id: customer.id, changed: true }, { id: customer.id, previous });
  },
  async (compensation, { container }) => {
    if (!compensation?.id) {
      return;
    }

    const customerModuleService = container.resolve(Modules.CUSTOMER);

    await customerModuleService.updateCustomers(compensation.id, {
      metadata: compensation.previous,
    });
  },
);

const confirmNewsletterWorkflow = createWorkflow(
  "confirm-newsletter",
  function (input: ConfirmNewsletterInput) {
    const result = confirmNewsletterSubscription(input);

    when({ result }, ({ result }) => result.changed === true).then(() => {
      emitEventStep({
        eventName: "newsletter.confirmed",
        data: { id: result.id },
      });
    });

    return new WorkflowResponse(result.id);
  },
);

export default confirmNewsletterWorkflow;
