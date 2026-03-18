import { redirect } from "next/navigation";

// Old appearance route now redirects to the new Store > Theme page
export default function AppearancePage() {
  redirect("/dashboard/store/theme");
}
