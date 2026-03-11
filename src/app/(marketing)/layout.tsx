import type { Metadata } from "next";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata: Metadata = {
  title: "Impels Commerce — La forma más fácil de crear tu tienda online",
  description:
    "Crea tu tienda online en minutos. Catálogo digital optimizado para WhatsApp y redes sociales. Sin conocimientos técnicos. Planes desde gratis.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </>
  );
}
