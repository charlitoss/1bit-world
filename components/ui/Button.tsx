"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: IconName;
  active?: boolean;
}

export function Button({
  icon,
  active,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${active ? "btn-on" : ""} px-3 py-2 text-sm font-display uppercase tracking-wider ${className}`}
      {...props}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}
