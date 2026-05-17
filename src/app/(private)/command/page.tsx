/**
 * /command — blank new-conversation entry point.
 * Each conversation gets its own URL via /command/[id]/page.tsx.
 */
import CommandShell from "./CommandShell";

export const metadata = { title: "Virgil — Command" };

export default function CommandPage() {
  return <CommandShell />;
}
