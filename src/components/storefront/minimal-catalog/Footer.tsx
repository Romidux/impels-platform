import Link from "next/link";
import { Store as StoreType, StoreSettings } from "@/lib/types";
import { Zap } from "lucide-react";

interface FooterProps {
  store: StoreType;
  settings?: StoreSettings;
}

export default function Footer({ store, settings }: FooterProps) {
  return (
    <footer className="w-full bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-gray-100 pb-16">
        
        {/* Brand Info */}
        <div className="col-span-1 md:col-span-1">
          <Link href={`/store/${store.slug}`} className="inline-block hover:opacity-70 transition-opacity">
            <h2 className="text-xl font-medium tracking-tight text-black mb-4">{store.name}</h2>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            {store.description || "Descubre nuestra selección exclusiva. Calidad y diseño en un solo lugar."}
          </p>
        </div>

        {/* Links Column 1 */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-2">Ayuda</h3>
          <Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Envíos</Link>
          <Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Devoluciones</Link>
          <Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Preguntas Frecuentes</Link>
        </div>

        {/* Links Column 2 */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-2">Legal</h3>
          <Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Términos y Condiciones</Link>
          <Link href="#" className="text-sm text-gray-500 hover:text-black transition-colors">Privacidad</Link>
        </div>

        {/* Contact */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-2">Contacto</h3>
          {settings?.whatsapp_number ? (
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              WhatsApp
            </a>
          ) : (
            <span className="text-sm text-gray-500">Próximamente</span>
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between pt-8">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} {store.name}. Todos los derechos reservados.
        </p>
        <div className="mt-4 sm:mt-0 text-xs flex items-center gap-1.5 text-gray-400">
          Powered by
          <Link href="/" className="inline-flex items-center gap-1 text-gray-600 hover:text-black font-semibold transition-colors">
            <Zap className="w-3 h-3" />
            Impels
          </Link>
        </div>
      </div>
    </footer>
  );
}
