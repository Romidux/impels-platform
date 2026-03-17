import React from "react";

interface MinimalCatalogGridProps {
  children: React.ReactNode;
}

export default function MinimalCatalogGrid({ children }: MinimalCatalogGridProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16">
        {children}
      </div>
    </div>
  );
}
