"use client";

import React from "react";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SolarisButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "small" | "icon" | "danger" | "success";
    isLoading?: boolean;
    icon?: React.ElementType;
    active?: boolean; // For toggle states
}

export function SolarisButton({
    children,
    className,
    variant = "default",
    isLoading = false,
    icon: Icon,
    active = false,
    disabled,
    ...props
}: SolarisButtonProps) {

    // Base container classes for HoverBorderGradient
    const containerClasses = cn(
        "cursor-pointer transition-all duration-300",
        variant === "default" && "rounded-full",
        variant === "small" && "rounded-lg",
        variant === "icon" && "rounded-lg w-10 h-10 p-0 flex items-center justify-center",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className?.includes("w-") ? "" : "w-fit" // Allow override
    );

    // Inner content classes
    const contentClasses = cn(
        "flex items-center justify-center gap-2 font-bold backdrop-blur-md transition-colors",
        // Text Colors
        variant === "danger" ? "text-red-500" :
            variant === "success" || active ? "text-green-500" : "text-white dark:text-primary-foreground",

        // Backgrounds
        active ? "bg-primary/10" : "bg-black/40 dark:bg-black/40",

        // Sizing
        variant === "default" && "px-6 py-3 text-base",
        variant === "small" && "px-3 py-1.5 text-xs uppercase tracking-wider",
        variant === "icon" && "w-full h-full p-0",

        className
    );

    return (
        <HoverBorderGradient
            containerClassName={containerClasses}
            as="button"
            className={contentClasses}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && Icon && (() => {
                const IconComponent = Icon as any;
                return <IconComponent className={cn("w-4 h-4", variant === "default" ? "w-5 h-5" : "")} />;
            })()}
            {children}
        </HoverBorderGradient>
    );
}
