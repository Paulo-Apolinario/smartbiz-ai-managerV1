import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-colors disabled:pointer-events-none disabled:opacity-50",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // 🔥 padrão premium
    "rounded-xl border shadow-sm",
  ].join(" "),
  {
    variants: {
      variant: {
        /**
         * ✅ DEFAULT = padrão do SaaS (igual ao Atualizar)
         * Use para: Atualizar, Novo produto, Novo cliente, Novo usuário, Orders, etc.
         */
        default: "border-border bg-background text-foreground hover:bg-muted",

        /**
         * ✅ PRIMARY = CTA (se quiser destacar ações do modal)
         * Use para: Salvar / Criar pedido (se quiser chamar atenção)
         */
        primary: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",

        outline: "border-border bg-background text-foreground hover:bg-muted",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30",
        ghost: "border-transparent bg-transparent hover:bg-muted",
        link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-6",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size }), className)}
        type={type ?? (asChild ? undefined : "button")}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }