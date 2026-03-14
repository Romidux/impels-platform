import Link from "next/link";
import { Store as StoreType, StoreSettings } from "@/lib/types";
import { Zap, Instagram, Facebook } from "lucide-react";

interface FooterProps {
  store: StoreType;
  settings?: StoreSettings;
}

export default function Footer({ store, settings }: FooterProps) {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 pt-16 pb-8 text-gray-500">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-gray-200 pb-16">
        
        {/* Brand Info */}
        <div className="col-span-1 md:col-span-1">
          <Link href={`/store/${store.slug}`} className="inline-block hover:opacity-70 transition-opacity">
            <h2 className="text-xl font-medium tracking-tight text-black mb-4">{store.name}</h2>
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-6">
            {store.description || "Descubre nuestra selección exclusiva. Calidad y diseño en un solo lugar."}
          </p>

          {/* Social Media Icons */}
          <div className="flex items-center gap-4">
            {settings?.instagram_url && (
              <a 
                href={settings.instagram_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all duration-300 bg-white shadow-sm"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {settings?.facebook_url && (
              <a 
                href={settings.facebook_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all duration-300 bg-white shadow-sm"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {settings?.tiktok_url && (
              <a 
                href={settings.tiktok_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all duration-300 bg-white shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.13-.31-2.34-.25-3.41.33-.71.38-1.27 1.03-1.51 1.8-.23.68-.24 1.43-.04 2.13.25.96.95 1.78 1.83 2.22.84.45 1.82.56 2.75.34 1.05-.21 1.98-.88 2.45-1.85.28-.6.41-1.25.42-1.92-.01-4.71-.01-9.42-.01-14.13z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-2">Ayuda</h3>
          <Link href="#" className="text-sm text-gray-400 hover:text-black transition-colors">Envíos</Link>
          <Link href="#" className="text-sm text-gray-400 hover:text-black transition-colors">Devoluciones</Link>
          <Link href="#" className="text-sm text-gray-400 hover:text-black transition-colors">Preguntas Frecuentes</Link>
        </div>

        {/* Shop Navigation */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-2">Tienda</h3>
          <Link href={`/store/${store.slug}`} className="text-sm text-gray-400 hover:text-black transition-colors">Inicio</Link>
          <Link href={`/store/${store.slug}/catalog`} className="text-sm text-gray-400 hover:text-black transition-colors">Categorías</Link>
          <Link href={`/store/${store.slug}/catalog`} className="text-sm text-gray-400 hover:text-black transition-colors">Productos</Link>
        </div>

        {/* Contact */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-2">Contacto</h3>
          {settings?.whatsapp_number ? (
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-400 hover:text-black transition-colors"
            >
              WhatsApp
            </a>
          ) : (
            <span className="text-sm text-gray-400">Próximamente</span>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between pt-8">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
        </p>
        <div className="mt-4 sm:mt-0 text-xs flex items-center gap-1.5 text-gray-400">
          Powered by
          <Link href="/" className="inline-flex items-center gap-1 text-black hover:text-gray-500 font-semibold transition-colors">
            <Zap className="w-3 h-3" />
            Impels
          </Link>
        </div>
      </div>
    </footer>
  );
}
