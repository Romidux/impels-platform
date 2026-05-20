import Link from "next/link";
import { Zap, FileText } from "lucide-react";

export const metadata = {
  title: "Términos de Uso — Impels Commerce",
  description:
    "Leé los términos y condiciones que rigen el uso de la plataforma Impels Commerce.",
};

const sections = [
  {
    title: "1. Aceptación de los términos",
    content: `Al registrarte y utilizar Impels Commerce ("la Plataforma"), aceptás cumplir con estos Términos de Uso. Si no estás de acuerdo con alguno de estos términos, no podés usar la Plataforma.

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entran en vigencia al publicarse en esta página. El uso continuado de la Plataforma después de cualquier modificación implica tu aceptación de los nuevos términos.`,
  },
  {
    title: "2. Descripción del servicio",
    content: `Impels Commerce es una plataforma de comercio electrónico que permite a emprendedores y pequeñas empresas:

- Crear y gestionar un catálogo digital de productos.
- Publicar una tienda online con URL propia.
- Recibir pedidos de sus clientes a través de WhatsApp.
- Administrar su equipo con roles diferenciados.

La Plataforma se ofrece "tal cual está" y podemos modificar, suspender o discontinuar funcionalidades con previo aviso.`,
  },
  {
    title: "3. Registro y cuenta",
    content: `Para usar la Plataforma debés:

- Ser mayor de 18 años.
- Proveer información veraz, completa y actualizada durante el registro.
- Mantener la confidencialidad de tus credenciales de acceso.
- Notificarnos de inmediato ante cualquier uso no autorizado de tu cuenta.

Sos responsable de todas las actividades que ocurran bajo tu cuenta. Podemos suspender o eliminar cuentas que proporcionen información falsa o que violen estos términos.`,
  },
  {
    title: "4. Planes y pagos",
    content: `**Plan Gratuito:** disponible sin costo, con las limitaciones indicadas en la página de precios.

**Plan Pro:** suscripción mensual con renovación automática. El monto se debita al inicio de cada período.

- Podés cancelar tu suscripción en cualquier momento desde la configuración de tu cuenta.
- No realizamos reembolsos por períodos parciales ya facturados.
- Los precios pueden cambiar con 30 días de aviso previo.
- Los precios se expresan en Guaraníes (Gs) e incluyen los impuestos aplicables.`,
  },
  {
    title: "5. Uso aceptable",
    content: `Aceptás usar la Plataforma únicamente para fines legítimos y comerciales lícitos. Está prohibido:

- Vender productos ilegales, falsificados, peligrosos o que infrinjan derechos de terceros.
- Usar la Plataforma para actividades fraudulentas, engañosas o ilegales.
- Hacer scraping, reverse engineering o intentar acceder a partes no autorizadas del sistema.
- Distribuir malware, spam o contenido dañino.
- Suplantar identidad de personas o empresas.
- Violar derechos de propiedad intelectual de terceros.

El incumplimiento puede resultar en la suspensión inmediata de tu cuenta.`,
  },
  {
    title: "6. Contenido del usuario",
    content: `Sos el único responsable del contenido que publicás en tu tienda (productos, imágenes, descripciones, precios). Al subir contenido a la Plataforma:

- Garantizás que tenés los derechos necesarios para publicarlo.
- Nos otorgás una licencia no exclusiva para mostrar ese contenido en la Plataforma con el fin de prestar el servicio.
- Reconocés que podemos eliminar contenido que viole estos términos o la ley.

No somos responsables por el contenido publicado por los usuarios.`,
  },
  {
    title: "7. Propiedad intelectual",
    content: `Todos los derechos sobre la Plataforma, su diseño, código, marca y contenidos propios son propiedad de Impels Commerce o sus licenciantes.

No podés copiar, modificar, distribuir, vender o sublicenciar ninguna parte de la Plataforma sin autorización expresa y por escrito.

Tus datos y el contenido de tu tienda siguen siendo de tu propiedad.`,
  },
  {
    title: "8. Privacidad",
    content: `El tratamiento de tus datos personales se rige por nuestra Política de Privacidad, disponible en impels-platform.vercel.app/privacy, que forma parte integral de estos Términos de Uso.`,
  },
  {
    title: "9. Limitación de responsabilidad",
    content: `En la medida permitida por la ley:

- La Plataforma se provee "tal cual", sin garantías de ningún tipo.
- No garantizamos disponibilidad ininterrumpida del servicio.
- No somos responsables por pérdidas de datos, lucro cesante, daños indirectos o consecuentes derivados del uso de la Plataforma.
- Nuestra responsabilidad máxima está limitada al monto que hayas pagado por el servicio en los últimos 3 meses.`,
  },
  {
    title: "10. Suspensión y terminación",
    content: `Podemos suspender o cancelar tu acceso a la Plataforma si:

- Violás estos Términos de Uso.
- Tu cuenta presenta actividad sospechosa o fraudulenta.
- Nos lo solicitás vos mismo.

Tras la cancelación, tus datos se conservarán por 30 días para que puedas exportarlos, luego serán eliminados conforme a nuestra Política de Privacidad.`,
  },
  {
    title: "11. Ley aplicable",
    content: `Estos términos se rigen por las leyes de la República del Paraguay. Cualquier disputa que no pueda resolverse amigablemente será sometida a los tribunales competentes de Asunción, Paraguay.`,
  },
  {
    title: "12. Contacto",
    content: `Para consultas sobre estos Términos de Uso:

**Impels Commerce**
Email: soporte@impelscommerce.com`,
  },
];

export default function TermsPage() {
  return (
    <div style={{ background: "#fdf9f4", color: "#1c1c19" }} className="min-h-screen">
      {/* Header */}
      <div
        className="py-16 md:py-24"
        style={{ background: "linear-gradient(160deg, #fdf9f4 60%, #f0ebff 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{ background: "linear-gradient(135deg, #0040df, #5f00e3)" }}
          >
            <FileText className="w-7 h-7 text-white" />
          </div>
          <h1
            className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            Términos de Uso
          </h1>
          <p className="text-lg" style={{ color: "#434656" }}>
            Última actualización: 19 de mayo de 2025
          </p>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "#434656" }}>
            Estos términos regulan el uso de la plataforma Impels Commerce.
            Leelos con atención antes de usar el servicio.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl p-8 md:p-12"
          style={{
            background: "#ffffff",
            boxShadow: "0 12px 32px -4px rgba(28,28,25,0.06)",
          }}
        >
          <div className="space-y-10">
            {sections.map((section) => (
              <div key={section.title}>
                <h2
                  className="font-display text-xl font-bold mb-3"
                  style={{ color: "#1c1c19" }}
                >
                  {section.title}
                </h2>
                <div
                  className="text-sm leading-relaxed space-y-2 whitespace-pre-line"
                  style={{ color: "#434656" }}
                  dangerouslySetInnerHTML={{
                    __html: section.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1c1c19">$1</strong>')
                      .replace(/^- /gm, "• "),
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
          <Link
            href="/privacy"
            className="font-semibold transition-colors"
            style={{ color: "#0040df" }}
          >
            Política de Privacidad
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold transition-colors"
            style={{ color: "#0040df" }}
          >
            <Zap className="w-4 h-4" />
            Volver a Impels Commerce
          </Link>
        </div>
      </div>
    </div>
  );
}
