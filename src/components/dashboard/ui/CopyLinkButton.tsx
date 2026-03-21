"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyLinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  url: string;
  label?: string;
  copiedLabel?: string;
}

export function CopyLinkButton({ 
  url, 
  label = "Copiar link", 
  copiedLabel = "Copiado", 
  className,
  ...props
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn("flex flex-row items-center justify-center gap-2 cursor-pointer", className)}
      {...props}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? copiedLabel : label}
    </button>
  );
}
