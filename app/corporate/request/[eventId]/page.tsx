import { CorporateRequestComposer } from "@/modules/corporate/CorporateRequestComposer";

export default async function CorporateRequestComposerPage({
  params
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  return <CorporateRequestComposer eventId={eventId} />;
}
