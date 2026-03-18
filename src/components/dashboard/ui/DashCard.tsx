import { cn } from "@/lib/utils";

interface DashCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  header?: {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
  };
}

export function DashCard({
  children,
  className,
  padding = true,
  header,
}: DashCardProps) {
  return (
    <div className={cn("dash-card", className)}>
      {header && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            {header.icon}
            {header.title}
          </h2>
          {header.action}
        </div>
      )}
      <div className={cn(padding && "p-6")}>{children}</div>
    </div>
  );
}
