import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default function Page() {
  return (
    <>
      <PageHeader title="Inventory & forecast" subtitle="Stock, burn-rates and stock-out dates" />
      <Card className="text-sm text-slate-400">Coming in a later phase.</Card>
    </>
  );
}
