import { CheckoutClient } from "@/components/public/checkout-client";
import { PublicShell } from "@/components/public/public-shell";

export default function CheckoutPage() {
  return (
    <PublicShell>
      <CheckoutClient />
    </PublicShell>
  );
}
