import Link from "next/link";
import { Zap, Instagram, Twitter, Facebook } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white">
                Impels<span className="gradient-text">Commerce</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              La forma más fácil de crear tu tienda online. Pensado para
              emprendedores y pequeñas empresas de LATAM.
            </p>
            <div className="flex gap-3 mt-6">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              Plataforma
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Cómo funciona", "#how-it-works"],
                ["Precios", "#pricing"],
                ["Ejemplos de tiendas", "#examples"],
                ["Crear cuenta", "/register"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">
              Soporte
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                ["Ayuda", "#"],
                ["Términos de uso", "#"],
                ["Política de privacidad", "#"],
                ["Contacto", "#"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Impels Commerce. Todos los derechos
            reservados.
          </p>
          <p className="text-xs text-gray-600">
            Hecho con ❤️ para emprendedores de LATAM
          </p>
        </div>
      </div>
    </footer>
  );
}
