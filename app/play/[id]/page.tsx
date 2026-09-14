import { PlayClient } from "@/components/PlayClient";

export default async function PlayPage({ params }: PageProps<"/play/[id]">) {
  const { id } = await params;
  return <PlayClient id={id} />;
}
