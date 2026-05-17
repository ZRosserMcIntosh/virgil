/**
 * /command/[id] — loads a specific conversation by ID.
 * The shell handles auth, streaming, and URL sync.
 */
import CommandShell from "../CommandShell";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = { title: "Virgil — Command" };

export default async function ConversationPage({ params }: Props) {
  const { id } = await params;
  return <CommandShell initialConvId={id} />;
}
