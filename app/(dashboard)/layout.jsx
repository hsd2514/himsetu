import { Sidebar } from "@/components/sidebar";
import { AlertBanner } from "@/components/alert-banner";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-[1000]">
          <AlertBanner />
        </div>
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
