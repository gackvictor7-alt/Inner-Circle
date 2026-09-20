import { requireUser } from "@/lib/access/server";
import { createPostAction } from "@/app/actions/posts";
import { ActionForm, type FormField } from "@/components/app/forms";
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
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const fields: FormField[] = [
    { name: "body", kind: "textarea", labelKey: "app.posts.bodyLabel", placeholderKey: "app.posts.bodyPlaceholder", required: true, rows: 7, maxLength: 2000 },
    {
      name: "kind",
      kind: "select",
      labelKey: "app.common.type",
      options: [
        { value: "post", labelKey: "app.posts.typePost" },
        { value: "milestone", labelKey: "app.posts.typeMilestone" },
      ],
      defaultValue: "post",
    },
    {
      name: "visibility",
      kind: "select",
      labelKey: "app.posts.visibility",
      options: [
        { value: "members", labelKey: "app.posts.visibilityMembers" },
        { value: "connections", labelKey: "app.posts.visibilityConnections" },
        { value: "public", labelKey: "app.posts.visibilityPublic" },
      ],
      defaultValue: "members",
    },
    { name: "linkUrl", kind: "url", labelKey: "app.posts.linkLabel" },
    { name: "imageUrl", kind: "url", labelKey: "app.posts.imageLabel", helpKey: "app.posts.imageUploadNote" },
  ];

  return (
    <div className="space-y-6">
      <LocalizedPageHeader titleKey="app.posts.createTitle" leadKey="app.posts.createLead" />
      <ActionForm
        action={createPostAction}
        fields={fields}
        submitKey="app.posts.submit"
        successKey="app.posts.created"
      />
    </div>
  );
}
