"use server";

/**
 * Abstract Event Dispatcher
 * 
 * In a production environment, this file acts as the single source of truth
 * for transactional emails (Resend, SendGrid) and webhooks.
 * 
 * MVP Usage: Currently logs events to standard output. 
 * To activate emails, replace the console.log with an API call to your provider.
 */

export async function sendWelcomeEmail(email: string, storeName: string) {
  try {
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ ... });
    
    console.log(`[EVENT_DISPATCH] 📧 EMAIL SENT -> To: ${email} | Template: Welcome | Store: ${storeName}`);
    return true;
  } catch (error) {
    console.error(`[EVENT_DISPATCH] Email failure:`, error);
    return false;
  }
}

export async function sendNewOrderNotification(storeEmail: string, orderId: string, customerName: string) {
  try {
    console.log(`[EVENT_DISPATCH] 📧 EMAIL SENT -> To: ${storeEmail} | Template: New Order | OrderID: ${orderId} | Customer: ${customerName}`);
    return true;
  } catch (error) {
    console.error(`[EVENT_DISPATCH] Email failure:`, error);
    return false;
  }
}

export async function sendSubscriptionWarning(email: string, daysLeft: number) {
  try {
    console.log(`[EVENT_DISPATCH] 📧 EMAIL SENT -> To: ${email} | Template: Subscription Expiring | DaysLeft: ${daysLeft}`);
    return true;
  } catch (error) {
    console.error(`[EVENT_DISPATCH] Email failure:`, error);
    return false;
  }
}
