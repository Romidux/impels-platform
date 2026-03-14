"use client";

import { Store as StoreType, StoreSettings, Category } from "@/lib/types";
import Header from "./Header";
import Footer from "./Footer";

interface MinimalLayoutProps {
  children: React.ReactNode;
  store: StoreType;
  settings?: StoreSettings;
  categories?: Category[];
}

export default function MinimalLayout({
  children,
  store,
  settings,
  categories = [],
}: MinimalLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 selection:bg-gray-900 selection:text-white">
      <Header store={store} settings={settings} categories={categories} />
      
      <main className="flex-1 w-full flex flex-col items-center">
        <div className="w-full">
          {children}
        </div>
      </main>

      <Footer store={store} settings={settings} />
    </div>
  );
}
