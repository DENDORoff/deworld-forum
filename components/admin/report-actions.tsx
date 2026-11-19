"use client";

import { useActionState } from "react";
import { Check, Loader2, ShieldQuestion, X } from "lucide-react";

import { resolveReportAction, type ReportFormState } from "@/lib/actions/reports";
import { cn } from "@/lib/utils";

const initialState: ReportFormState = { status: "idle" };

function ReportActions({ reportId }: { reportId: string }) {
  const [state, formAction, isPending] = useActionState(resolveReportAction, initialState);

  const setStatus = (status: string) => {
    const form = document.getElementById(`report-form-${reportId}`) as HTMLFormElement | null;
    const field = form?.querySelector<HTMLInputElement>('input[name="status"]');
    if (field && form) {
      field.value = status;
      form.requestSubmit();
    }
  };

  return (
    <form action={formAction} id={`report-form-${reportId}`} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" defaultValue="RESOLVED" />
      <button
        type="button"
        disabled={isPending}
        onClick={() => setStatus("IN_REVIEW")}
        title="Принять в работу"
        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100 disabled:opacity-50"
      >
        <ShieldQuestion size={13} aria-hidden />
        В работу
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setStatus("RESOLVED")}
        title="Решить жалобу"
        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:opacity-50"
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} aria-hidden />}
        Решить
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setStatus("REJECTED")}
        title="Отклонить жалобу"
        className="focus-ring inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-100 disabled:opacity-50"
      >
        <X size={13} aria-hidden />
        Отклонить
      </button>
      {state.status === "error" && state.message && (
        <span role="alert" className="text-xs text-red-600">{state.message}</span>
      )}
    </form>
  );
}

export function ReportActionButtons({ reportId }: { reportId: string }) {
  return <ReportActions reportId={reportId} />;
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-red-50 text-red-700 ring-red-200",
  IN_REVIEW: "bg-sky-50 text-sky-800 ring-sky-200",
  RESOLVED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-stone-100 text-stone-500 ring-stone-200",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Открыта",
  IN_REVIEW: "В работе",
  RESOLVED: "Решена",
  REJECTED: "Отклонена",
};

export function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
        STATUS_STYLES[status] ?? STATUS_STYLES.OPEN,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
