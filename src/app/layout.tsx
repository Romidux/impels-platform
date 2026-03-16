import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

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
      <body className="antialiased">
        {children}
        <Toaster 
          position="top-center" 
          expand={false}
          duration={2000}
          theme="light"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1a1a1a',
              border: '1px solid #f0f0f0',
              borderRadius: '0px',
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
