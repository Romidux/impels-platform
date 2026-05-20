import Link from "next/link";
import { Zap, Shield } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad — Impels Commerce",
  description:
    "Conocé cómo Impels Commerce recopila, usa y protege tu información personal.",
};

const sections = [
  {
    title: "1. Información que recopilamos",
    content: `Cuando te registrás en Impels Commerce, recopilamos la información necesaria para brindarte el servicio:

- **Datos de cuenta:** nombre, dirección de correo electrónico y foto de perfil (cuando iniciás sesión con Google).
- **Datos de tu tienda:** nombre, logo, número de WhatsApp, productos, categorías, variantes y stock que cargás vos mismo.
- **Datos de uso:** páginas visitadas, acciones realizadas dentro de la plataforma, y datos técnicos como dirección IP, tipo de navegador y dispositivo.
- **Datos de pedidos:** información de los pedidos que tus clientes realizan a través de tu tienda.`,
  },
  {
    title: "2. Cómo usamos tu información",
    content: `Usamos la información recopilada para:

- Crear y gestionar tu cuenta y tienda.
- Procesar las operaciones que realizás en la plataforma.
- Enviarte notificaciones sobre tu cuenta, actualizaciones del servicio y novedades (podés desuscribirte en cualquier momento).
- Mejorar y personalizar tu experiencia en la plataforma.
- Detectar y prevenir actividades fraudulentas o no autorizadas.
- Cumplir con las obligaciones legales aplicables.`,
  },
  {
    title: "3. Autenticación con Google",
    content: `Si elegís iniciar sesión con Google, utilizamos el servicio de OAuth 2.0 de Google. En ese caso:

- Google nos provee tu nombre, correo electrónico y foto de perfil con tu autorización.
- No almacenamos tu contraseña de Google en ningún momento.
- Podés revocar el acceso de Impels Commerce desde tu cuenta de Google en cualquier momento: myaccount.google.com → Seguridad → Aplicaciones con acceso a tu cuenta.
- El uso de los datos está sujeto también a la Política de Privacidad de Google: policies.google.com/privacy`,
  },
  {
    title: "4. Compartición de datos con terceros",
    content: `No vendemos ni alquilamos tu información personal. Solo la compartimos con:

- **Supabase:** proveedor de base de datos y autenticación. Almacena los datos de tu cuenta de forma segura.
- **Vercel:** infraestructura de hosting donde corre la plataforma.
- **Google:** para la autenticación OAuth (ver sección 3).
- **Autoridades competentes:** cuando sea requerido por ley o por orden judicial.

Todos nuestros proveedores están sujetos a acuerdos de confidencialidad y cumplen con estándares de seguridad adecuados.`,
  },
  {
    title: "5. Seguridad de los datos",
    content: `Implementamos medidas técnicas y organizativas para proteger tu información:

- Comunicaciones cifradas mediante TLS/HTTPS.
- Contraseñas almacenadas con hash seguro (nunca en texto plano).
- Acceso restringido a los datos del personal autorizado.
- Auditorías periódicas de seguridad.

Aunque hacemos todo lo posible para proteger tu información, ningún sistema es 100% invulnerable. Te recomendamos usar contraseñas únicas y seguras.`,
  },
  {
    title: "6. Retención de datos",
    content: `Conservamos tu información mientras tu cuenta esté activa o sea necesaria para brindarte el servicio. Si eliminás tu cuenta, eliminaremos o anonimizaremos tus datos personales dentro de los 30 días posteriores a la solicitud, salvo que estemos obligados a conservarlos por ley.`,
  },
  {
    title: "7. Tus derechos",
    content: `Tenés derecho a:

- **Acceder** a los datos personales que tenemos sobre vos.
- **Rectificar** información inexacta o incompleta.
- **Eliminar** tu cuenta y los datos asociados.
- **Oponerte** al tratamiento de tus datos para fines de marketing.
- **Portabilidad:** solicitar una copia de tus datos en formato legible.

Para ejercer cualquiera de estos derechos, escribinos a: soporte@impelscommerce.com`,
  },
  {
    title: "8. Cookies",
    content: `Usamos cookies y tecnologías similares para mantener tu sesión activa, recordar tus preferencias y analizar el uso de la plataforma. Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del servicio.`,
  },
  {
    title: "9. Menores de edad",
    content: `Impels Commerce está dirigido a personas mayores de 18 años. No recopilamos intencionalmente información de menores de edad. Si creés que un menor nos ha proporcionado datos personales, escribinos para eliminarlos de inmediato.`,
  },
  {
    title: "10. Cambios en esta política",
    content: `Podemos actualizar esta Política de Privacidad ocasionalmente. Cuando lo hagamos, actualizaremos la fecha al pie de esta página y, si los cambios son significativos, te notificaremos por correo electrónico o mediante un aviso en la plataforma.`,
  },
  {
    title: "11. Contacto",
    content: `Si tenés preguntas sobre esta política o sobre el tratamiento de tus datos, podés contactarnos en:

**Impels Commerce**
Email: soporte@impelscommerce.com`,
  },
];

export default function PrivacyPage() {
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
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1
            className="font-display text-4xl md:text-5xl font-black mb-4 tracking-tight"
            style={{ letterSpacing: "-0.02em" }}
          >
            Política de Privacidad
          </h1>
          <p className="text-lg" style={{ color: "#434656" }}>
            Última actualización: 19 de mayo de 2025
          </p>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "#434656" }}>
            En Impels Commerce nos tomamos en serio la privacidad de tus datos.
            Esta política explica qué información recopilamos, cómo la usamos y
            qué derechos tenés sobre ella.
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

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
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
