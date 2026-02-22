import { Bell } from "lucide-react";

interface ReminderBadgeProps {
  count: number;
}

export function ReminderBadge({ count }: ReminderBadgeProps) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1">
      {count > 9 ? "9+" : count}
    </span>
  );
}
