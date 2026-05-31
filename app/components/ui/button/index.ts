import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-sans font-medium disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "btn-primary",
        destructive: "btn-destructive",
        outline: "btn-outline",
        secondary: "btn-outline bg-secondary/60 hover:bg-secondary",
        ghost: "btn-ghost",
        link: "btn-ghost underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 text-[13px] has-[>svg]:px-3.5",
        sm: "h-8 px-3 text-[12px] has-[>svg]:px-2.5",
        lg: "h-10 px-5 text-[14px] has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
