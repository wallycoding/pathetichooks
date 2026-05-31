import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Badge } from "./Badge.vue";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[2px] aria-invalid:border-destructive transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--acc)]/50 bg-[color:var(--acc)]/15 text-[color:var(--acc-strong)]",
        secondary: "border-border bg-secondary/60 text-secondary-foreground",
        destructive:
          "border-rose-500/50 bg-rose-500/15 text-rose-300",
        outline: "border-border text-foreground bg-transparent",
        success: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
        warning: "border-amber-500/50 bg-amber-500/15 text-amber-300",
        info: "border-sky-500/50 bg-sky-500/15 text-sky-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
