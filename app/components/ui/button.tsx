import React, { ComponentProps } from "react";

interface ButtonProps extends ComponentProps<"button"> {
  children: React.ReactNode;
}

export default function Button({ children, className, ...rest }: ButtonProps) {
  return (
    <button
      className={`cursor-pointer disabled:cursor-auto ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
