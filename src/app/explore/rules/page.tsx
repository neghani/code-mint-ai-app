import { Suspense } from "react";
import { CatalogExplorer } from "@/components/explore/catalog-explorer";

const fallback = (
  <div className="flex min-h-screen items-center justify-center text-gray-500">
    Loading catalog…
  </div>
);

export default function ExploreRulesPage() {
  return (
    <Suspense fallback={fallback}>
      <CatalogExplorer
        section="rules"
        fixedType="rule"
        title="Rules"
        description="Search and browse coding rules in a focused table view."
      />
    </Suspense>
  );
}
