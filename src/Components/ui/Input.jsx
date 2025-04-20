import React from "react";

export function Input({ placeholder, className, ...props }) {
    return (
        <input
            type="text"
            placeholder={placeholder}
            className={`w-full p-3 bg-transparent border border-white/30 rounded-lg text-white placeholder-white/70 focus:ring-0 focus:outline-none ${className}`}
            {...props}
        />
    );
}
