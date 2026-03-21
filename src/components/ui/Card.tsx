import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  header?: {
    title: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
  };
}

export function Card({
  children,
  className,
  padding = true,
  hover = false,
  header,
}: CardProps) {
  return (
    <div
      className={cn(
        hover ? "dash-card-hover" : "dash-card",
        className
      )}
    >
      {header && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
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
