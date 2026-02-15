import { OrgDetailClient } from "./org-detail-client";

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrgDetailClient orgId={id} />;
}
