import { requireUser } from "@/lib/access/server";
import { PostCreateForm } from "@/components/app/PostCreateForm";
import { LocalizedPageHeader, LocalizedEmptyState } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function CreatePostPage() {
  const access = await requireUser("/app/create/post");

  if (!access.entitlements.postCreate) {
    return (
      <LocalizedEmptyState
        icon="users"
        titleKey="app.access.lockedTitle"
        textKey="app.access.lockedText"
        action={{
          labelKey: "app.billing.upgradeCta",
          href: "/app/billing",
        }}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <LocalizedPageHeader
        titleKey="app.posts.createTitle"
        leadKey="app.posts.createLead"
      />

      <PostCreateForm />
    </div>
  );
}