import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-600 focus:outline-none ${className}`}
      {...props}
    />
  );
}
