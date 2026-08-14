import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  size = "md",
  href = "/",
}: LogoProps) {
  const iconSizes = {
    sm: "h-6 w-6 text-xs rounded-md",
    md: "h-7 w-7 text-sm rounded-lg",
    lg: "h-9 w-9 text-base rounded-xl",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const content = (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 font-mono font-semibold tracking-tight",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center border border-emerald-500/30 bg-zinc-950 font-mono font-black text-emerald-500 shadow-sm shadow-emerald-500/10 transition-colors group-hover:border-emerald-500/60 dark:bg-zinc-900",
          iconSizes[size],
          iconClassName
        )}
      >
        <span>&gt;_</span>
      </div>
      {showText && (
        <span
          className={cn(
            "text-foreground transition-colors group-hover:text-primary",
            textSizes[size],
            textClassName
          )}
        >
          console.hired()
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
