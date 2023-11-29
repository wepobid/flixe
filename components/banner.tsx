import { AlertTriangle, CheckCircleIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const bannerVariants = cva(
    "border text-center p-3 text-sm flex items-center w-[80%] m-auto rounded-xl mt-6",
    {
        variants: {
            variant: {
                warning:
                "border border-yellow-500/20 bg-yellow-50/50 p-2 leading-6 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-500/5 dark:text-yellow-200 rounded-[10px]",
                    // "bg-yellow-200/80 border-yellow-300 text-primary dark:text-secondary",
                'warning-dark': "border border-[#d8ae6c]/20 bg-[#d8ae6c]/50 p-2 leading-6 text-[#d8ae6c] dark:border-[#d8ae6c]/30 dark:bg-[#d8ae6c]/5 dark:text-[#d8ae6c] rounded-[10px]",
                success: "border border-emerald-500/20 bg-emerald-50/50 p-4 leading-6 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/5 dark:text-emerald-200 rounded-[10px]",
            },
        },
        defaultVariants: {
            variant: "warning",
        },
    }
);

interface BannerProps extends VariantProps<typeof bannerVariants> {
    label: string;
}

const iconMap = {
    warning: AlertTriangle,
    'warning-dark': AlertTriangle,
    success: CheckCircleIcon,
};

export const Banner = ({ label, variant }: BannerProps) => {
    const Icon = iconMap[variant || "warning" || "warning-dark"];

    return (
        <div className={cn(bannerVariants({ variant }), "backdrop-blur-md")}>
            <span className="m-auto flex justify-center items-center">
                <Icon className="h-4 w-4 mr-2" />
                {label}
            </span>
        </div>
    );
};
