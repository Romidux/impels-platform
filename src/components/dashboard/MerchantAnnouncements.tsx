import { createClient } from "@/lib/supabase/server";
import { Megaphone, X, AlertTriangle, Info, CheckCircle } from "lucide-react";

export async function MerchantAnnouncements() {
  const supabase = await createClient();
  
  // Safe fetch - won't crash if table doesn't exist yet
  const { data: announcements, error } = await supabase
    .from("platform_announcements")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error || !announcements || announcements.length === 0) {
    return null; // Don't show anything if no announcements or schema error
  }

  return (
    <div className="space-y-3 mb-6 animate-fade-in">
      {announcements.map((ann) => {
        const isWarning = ann.type === 'warning';
        const isSuccess = ann.type === 'success';
        const isError = ann.type === 'error';
        
        const bgColor = isWarning ? "bg-amber-50" : isSuccess ? "bg-green-50" : isError ? "bg-red-50" : "bg-brand-50";
        const borderColor = isWarning ? "border-amber-200" : isSuccess ? "border-green-200" : isError ? "border-red-200" : "border-brand-200";
        const textColor = isWarning ? "text-amber-900" : isSuccess ? "text-green-900" : isError ? "text-red-900" : "text-brand-900";
        const iconColor = isWarning ? "text-amber-600" : isSuccess ? "text-green-600" : isError ? "text-red-600" : "text-brand-600";
        
        return (
          <div 
            key={ann.id}
            className={`p-4 rounded-xl border flex gap-3 ${bgColor} ${borderColor} ${textColor}`}
          >
            <div className={`mt-0.5 ${iconColor}`}>
              {isWarning ? <AlertTriangle className="w-5 h-5" /> : 
               isSuccess ? <CheckCircle className="w-5 h-5" /> : 
               isError ? <AlertTriangle className="w-5 h-5" /> : 
               <Megaphone className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{ann.title}</h4>
              <p className="text-sm opacity-90 leading-relaxed">{ann.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
