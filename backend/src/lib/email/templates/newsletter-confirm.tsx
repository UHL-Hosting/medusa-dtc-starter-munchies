import { Heading, Section } from "@react-email/components";
import { CtaButton } from "./components/button";
import EmailBody from "./components/email-body";
import Layout from "./components/layout";
import { title } from "./components/style";

export default function NewsletterConfirm({
  confirmUrl,
}: {
  confirmUrl: string;
}) {
  return (
    <Layout preview="Confirm your Munchies newsletter subscription">
      <Section className="w-full max-w-[565px] mb-16 px-5" align="left">
        <Heading className="mb-3 mt-16" style={title}>
          Confirm your subscription
        </Heading>
        <EmailBody
          paragraphs={[
            "You (or someone using this email address) asked to join the Munchies newsletter.",
            "Click the button below within 48 hours to confirm your subscription. If this wasn't you, you can ignore this email - nothing will be subscribed.",
          ]}
        />
        <CtaButton href={confirmUrl} label="Confirm subscription" />
      </Section>
    </Layout>
  );
}
