/**
 * VIRGIL — /feedback
 *
 * Review all thumbs-down responses so weak model outputs can be identified
 * and used to improve prompts, model routing, or context injection.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const userId = (session.user as any).id as string;

  const [downVotes, upVotes, totalMessages] = await Promise.all([
    (prisma as any).virgilMessage.findMany({
      where: {
        feedback: "DOWN",
        conversation: { userId },
      },
      include: {
        conversation: { select: { id: true, title: true, companion: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    (prisma as any).virgilMessage.count({
      where: { feedback: "UP", conversation: { userId } },
    }),
    (prisma as any).virgilMessage.count({
      where: { role: "assistant", conversation: { userId } },
    }),
  ]);

  const downCount  = downVotes.length;
  const thumbsRate = totalMessages > 0 ? Math.round(((upVotes) / totalMessages) * 100) : 0;

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <div className="v-label">Quality Review</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Response Feedback</h1>
        <p className="mt-2 text-sm text-bone-400">
          Thumbs-down responses where the model underperformed. Use these to improve prompts and routing.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total responses" value={totalMessages} color="default" />
        <Stat label="Thumbs up" value={upVotes} color="green" />
        <Stat label="Thumbs down" value={downCount} color="red" />
        <Stat label="Approval rate" value={`${thumbsRate}%`} color={thumbsRate >= 80 ? "green" : "amber"} />
      </div>

      {downCount === 0 ? (
        <div className="v-card v-card-pad text-center text-bone-400">
          No thumbs-down responses yet. Give feedback from the Command page.
        </div>
      ) : (
        <div className="v-card overflow-hidden">
          <div className="border-b border-ink-700 px-5 py-3">
            <div className="v-label">Thumbs-down responses ({downCount})</div>
          </div>
          <div className="divide-y divide-ink-700">
            {downVotes.map((msg: any) => (
              <div key={msg.id} className="px-5 py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-signal-red">Poor response</span>
                      <span className="text-bone-600 text-[10px]">·</span>
                      <span className="text-[10px] text-bone-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                      <span className="text-bone-600 text-[10px]">·</span>
                      <span className="text-[10px] text-bone-500">
                        {msg.conversation?.companion ?? "VIRGIL"}
                      </span>
                      {msg.meta?.usedModel && (
                        <>
                          <span className="text-bone-600 text-[10px]">·</span>
                          <span className="text-[10px] text-bone-500">{msg.meta.usedModel}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-bone-100 leading-relaxed whitespace-pre-wrap line-clamp-5">
                      {msg.content}
                    </p>
                    {msg.feedbackNote && (
                      <div className="mt-2 rounded bg-signal-red/10 border border-signal-red/20 px-3 py-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-signal-red mr-2">Note:</span>
                        <span className="text-xs text-bone-300">{msg.feedbackNote}</span>
                      </div>
                    )}
                    {msg.conversation?.title && (
                      <div className="mt-1 text-[10px] text-bone-500">
                        Conversation: &ldquo;{msg.conversation.title}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: "default" | "green" | "red" | "amber" }) {
  const cls = { default: "text-bone-50", green: "text-signal-green", red: "text-signal-red", amber: "text-signal-amber" }[color];
  return (
    <div className="v-card px-4 py-4">
      <div className={`font-serif text-3xl ${cls}`}>{value}</div>
      <div className="mt-1 text-xs text-bone-400">{label}</div>
    </div>
  );
}
