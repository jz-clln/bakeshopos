// File: app/src/components/settings/GuardrailActivity.tsx
//
// Shows recent times Keki's order-promise guardrail fired, so an
// owner can actually see this happened instead of it only existing in
// Edge Function logs. Sits next to UsageMeter in the "AI usage"
// section of SettingsScreen — same card, same visual language.

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
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

export function GuardrailActivity({ events }: GuardrailActivityProps) {
  if (events.length === 0) {
    return (
      <p className="text-[13px] text-olive">
        No issues caught recently
      </p>
    );
  }

  return (
    <div className="divide-y divide-platinum/60">
      {events.map((event) => {
        const isEscalated = event.outcome === 'escalated';
        return (
          <Link
            key={event.id}
            to={`/messages/${event.conversationId}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 -mx-1 px-1 rounded-[10px] transition-colors duration-150 active:bg-platinum/30"
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isEscalated ? 'bg-red-50' : 'bg-amber-50'
              }`}
            >
              {isEscalated ? (
                <AlertTriangle size={14} className="text-red-500" />
              ) : (
                <CheckCircle2 size={14} className="text-amber-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-accent-dark truncate">
                {isEscalated
                  ? `Needed your help with ${event.customerName}`
                  : `Caught and fixed itself with ${event.customerName}`}
              </p>
              <p className="text-[12px] text-olive">
                {isEscalated
                  ? 'Almost sent an unresolved order promise, handed off to you'
                  : 'Almost stalled on an order promise, then retried and resolved it'}
              </p>
            </div>
            <p className="text-[11px] text-olive/70 shrink-0 tabular-nums">{timeAgo(event.createdAt)}</p>
          </Link>
        );
      })}
    </div>
  );
}