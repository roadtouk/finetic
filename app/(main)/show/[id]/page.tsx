import { ShowPageServer } from "@/components/show-page-server";

export default async function Show({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ShowPageServer showId={id} />;
}
