"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Dirección de prueba de Resend — no requiere dominio verificado.
// Cambiar a algo como "Impels Commerce <pedidos@impelspy.com>" una vez
// que el dominio esté verificado en Resend.
const FROM_EMAIL = "Impels Commerce <onboarding@resend.dev>";

function emailShell(title: string, bodyHtml: string) {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <div style="font-size: 20px; font-weight: 800; background: linear-gradient(135deg, #0040df 0%, #5f00e3 100%); -webkit-background-clip: text; background-clip: text; color: #0040df; margin-bottom: 24px;">
        Impels Commerce
      </div>
      <h1 style="font-size: 20px; font-weight: 700; color: #1c1c19; margin: 0 0 16px;">${title}</h1>
      <div style="font-size: 15px; line-height: 1.6; color: #434656;">${bodyHtml}</div>
    </div>
  `;
}

export async function sendWelcomeEmail(email: string, storeName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `¡Bienvenido a Impels Commerce!`,
      html: emailShell(
        `¡Hola! Tu tienda "${storeName}" ya está lista`,
        `<p>Gracias por crear tu cuenta en Impels Commerce. Ya podés empezar a cargar productos y compartir el link de tu tienda con tus clientes.</p>`
      ),
    });
    return true;
  } catch (error) {
    console.error(`[EVENT_DISPATCH] Email failure (welcome):`, error);
    return false;
  }
}

export async function sendNewOrderNotification(
  storeEmail: string,
  orderId: string,
  customerName: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: storeEmail,
      subject: `🎉 Nuevo pedido de ${customerName}`,
      html: emailShell(
        `Tenés un pedido nuevo`,
        `<p><strong>${customerName}</strong> acaba de hacer un pedido en tu tienda.</p>
         <p>Número de pedido: <strong>${orderId}</strong></p>
         <p>Entrá a tu panel de Impels Commerce para ver el detalle y confirmarlo.</p>`
      ),
    });
    return true;
  } catch (error) {
    console.error(`[EVENT_DISPATCH] Email failure (new order):`, error);
    return false;
  }
}

export async function sendSubscriptionWarning(email: string, daysLeft: number) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Tu plan Pro vence en ${daysLeft} días`,
      html: emailShell(
        `Tu plan Pro está por vencer`,
        `<p>Te quedan <strong>${daysLeft} días</strong> de plan Pro. Renueva desde tu panel para no perder tus beneficios.</p>`
      ),
    });
    return true;
  } catch (error) {
    console.error(`[EVENT_DISPATCH] Email failure (subscription warning):`, error);
    return false;
  }
}
