import { redirect } from "next/navigation";

export default function SettingsRedirectPage() {
  redirect("/dashboard/store?tab=general");
}
