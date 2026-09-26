import { Sidebar } from "@/components/sidebar";
import { AlertBanner } from "@/components/alert-banner";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <AlertBanner />
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
