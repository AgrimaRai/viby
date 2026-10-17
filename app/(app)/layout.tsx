import { redirect } from "next/navigation";
import { DeviceFrame } from "@/components/shell/DeviceFrame";
import { TabBar } from "@/components/shell/TabBar";
import { hasSupabase } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Connected mode: protect the app and bounce un-onboarded users.
  if (hasSupabase) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarded) redirect("/onboarding");
  }

  return (
    <DeviceFrame>
      <main className="no-scrollbar relative flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>
      <TabBar />
    </DeviceFrame>
  );
}
