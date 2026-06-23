import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// cva() defines every visual variant a Button can have, up front, as
// data — instead of writing separate CSS classes like ".btn-solid" and
// ".btn-outline" by hand (like we did in the plain-CSS version), we
// describe the variants here and Tailwind classes get picked at render
// time based on which variant prop was passed in.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold font-body transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        solid: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/25",
        outline: "border border-brand text-brand bg-transparent hover:bg-brand hover:text-white",
        ghost: "bg-transparent text-ink/80 hover:text-brand hover:bg-brand/5",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // asChild lets a Button hand its styling to a child element (e.g. a
  // Next.js <Link>) instead of always rendering a real <button>.
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
