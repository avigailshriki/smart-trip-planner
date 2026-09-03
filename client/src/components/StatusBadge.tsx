import type { TripStatus } from "../api/types";

const LABELS: Record<TripStatus, string> = {
  DRAFT: "טיוטה",
  GENERATING: "יוצר מסלול...",
  READY: "מוכן",
  FAILED: "נכשל",
};

const CLASSES: Record<TripStatus, string> = {
  DRAFT: "badge badge-draft",
  GENERATING: "badge badge-generating",
  READY: "badge badge-ready",
  FAILED: "badge badge-failed",
};

export function StatusBadge({ status }: { status: TripStatus }) {
  return <span className={CLASSES[status]}>{LABELS[status]}</span>;
}
