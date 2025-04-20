import React from "react";

export function Button({ children, className, ...props }) {
    return (
        <button className={`p-2 bg-blue-500 rounded-lg text-white ${className}`} {...props}>
            {children}
        </button>
    );
}
