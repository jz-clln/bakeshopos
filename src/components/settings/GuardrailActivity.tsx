// File: app/src/components/settings/GuardrailActivity.tsx

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { GuardrailEvent } from '../../api/aiSettings';

interface GuardrailActivityProps {
  events: GuardrailEvent[];
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function GuardrailActivity({
  events,
}: GuardrailActivityProps) {
  if (events.length === 0) {
    return (
      <div
        className="
          rounded-[16px]
          border border-black/[0.04]
          bg-[#FAF8F5]
          px-4 py-4
          flex items-center gap-3
        "
      >
        <div
          className="
            w-10 h-10
            rounded-[12px]
            bg-[#F4ECE0]
            text-[#2A2320]
            flex items-center justify-center
            shrink-0
          "
        >
          <ShieldCheck size={18} strokeWidth={1.9} />
        </div>

        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-accent-dark">
            Everything looks good
          </p>

          <p className="text-[12px] text-olive mt-0.5 leading-relaxed">
            No guardrail issues were caught recently.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        rounded-[18px]
        border border-black/[0.04]
        bg-[#FAF8F5]
        overflow-hidden
      "
    >
      {events.map((event, index) => {
        const isEscalated = event.outcome === 'escalated';

        const title = isEscalated
          ? `Needed your help with ${event.customerName}`
          : `Resolved an issue with ${event.customerName}`;

        const description = isEscalated
          ? 'Keki caught an unresolved order promise and handed the conversation to you.'
          : 'Keki caught an order-promise issue, retried, and resolved it automatically.';

        return (
          <div key={event.id}>
            <Link
              to={`/messages/${event.conversationId}`}
              className="
                group
                flex items-center gap-3.5
                px-4 py-4
                transition-colors duration-150
                hover:bg-black/[0.018]
                active:bg-black/[0.035]
              "
            >
              {/* Status icon */}
              <div
                className={`
                  w-10 h-10
                  rounded-[12px]
                  flex items-center justify-center
                  shrink-0
                  border
                  ${
                    isEscalated
                      ? 'bg-red-50 border-red-100 text-red-500'
                      : 'bg-amber-50 border-amber-100 text-amber-600'
                  }
                `}
              >
                {isEscalated ? (
                  <AlertTriangle
                    size={17}
                    strokeWidth={2}
                  />
                ) : (
                  <CheckCircle2
                    size={17}
                    strokeWidth={2}
                  />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[13px] font-semibold text-accent-dark truncate">
                    {title}
                  </p>

                  <span
                    className={`
                      shrink-0
                      rounded-full
                      px-2 py-0.5
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.08em]
                      ${
                        isEscalated
                          ? 'bg-red-50 text-red-600'
                          : 'bg-amber-50 text-amber-700'
                      }
                    `}
                  >
                    {isEscalated ? 'Escalated' : 'Resolved'}
                  </span>
                </div>

                <p className="text-[12px] text-olive leading-relaxed mt-1 line-clamp-2">
                  {description}
                </p>

                <p className="text-[11px] text-olive/60 mt-1.5 tabular-nums">
                  {timeAgo(event.createdAt)}
                </p>
              </div>

              {/* Navigation */}
              <div
                className="
                  w-8 h-8
                  rounded-full
                  border border-black/[0.04]
                  bg-white/70
                  flex items-center justify-center
                  shrink-0
                  text-olive/45
                  transition-all duration-150
                  group-hover:text-accent-dark
                  group-hover:bg-white
                "
              >
                <ChevronRight
                  size={15}
                  strokeWidth={1.9}
                />
              </div>
            </Link>

            {index < events.length - 1 && (
              <div className="mx-4 h-px bg-black/[0.05]" />
            )}
          </div>
        );
      })}
    </div>
  );
}