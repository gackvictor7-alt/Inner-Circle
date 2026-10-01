import { LocalizedEmptyState } from "@/components/app/localized";

/**
 * 404 inside the member platform: rendered within the app shell (navigation
 * stays usable) with the shared, already translated "page not found" copy.
 */
export default function AppNotFound() {
  return (
    <LocalizedEmptyState
      icon="compass"
      titleKey="common.pageNotFoundTitle"
      textKey="common.pageNotFoundText"
      action={{ labelKey: "app.nav.appHome", href: "/app" }}
    />
  );
}
