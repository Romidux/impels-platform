import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Plus_Jakarta_Sans } from "next/font/google";

/* Una sola familia para todo. Antes eran dos (Inter para cuerpo, Outfit para
   títulos), lo que son dos descargas y dos personalidades tipográficas en la
   misma pantalla.

   Se expone en las DOS variables a propósito: hay 80 usos de .font-display y la
   regla de headings de globals.css apunta a --font-outfit. Manteniendo los dos
   nombres, ningún componente necesita cambiar — simplemente resuelven a la
   misma fuente. Si algún día vuelve una segunda familia, se cambia solo acá. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const jakartaDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Impels Commerce — La forma más fácil de crear tu tienda online",
    template: "%s | Impels Commerce",
  },
  description:
    "Crea tu tienda online en minutos. Catálogo digital, optimizado para WhatsApp y redes sociales. Sin conocimientos técnicos.",
  keywords: [
    "tienda online",
    "ecommerce",
    "catalogo digital",
    "whatsapp",
    "pymEs",
    "emprendedores",
    "LATAM",
  ],
  openGraph: {
    title: "Impels Commerce",
    description: "La forma más fácil de crear tu tienda online",
    type: "website",
    locale: "es_PY",
  },
  twitter: {
    card: "summary_large_image",
    title: "Impels Commerce",
    description: "La forma más fácil de crear tu tienda online",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${jakarta.variable} ${jakartaDisplay.variable} antialiased`}>
        {children}
        <Toaster 
          position="top-center" 
          expand={false}
          duration={4000}
          theme="light"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1a1a1a',
              border: '1px solid #f0f0f0',
              borderRadius: '12px',
              fontSize: '12px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '12px 20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            },
          }}
        />
      </body>
    </html>
  );
}
