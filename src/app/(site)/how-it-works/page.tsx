import { HowItWorksContent } from "./HowItWorksContent";

/**
 * Explains what the homepage no longer explains: audience, the four steps,
 * trust and the 20 % portfolio model.
 *
 * Performance contract (same as the rest of the public site): no request-time
 * database access, no access context – the page prerenders statically.
 */
export default function HowItWorksPage() {
  return <HowItWorksContent />;
}
