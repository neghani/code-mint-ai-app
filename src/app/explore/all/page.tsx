import { Suspense } from "react";
import { CatalogExplorer } from "@/components/explore/catalog-explorer";

const fallback = (
  <div className="flex min-h-screen items-center justify-center text-gray-500">
    Loading catalog…
  </div>
);

export default function ExploreAllPage() {
  return (
    <Suspense fallback={fallback}>
      <CatalogExplorer
        section="all"
        title="All Catalog Items"
        description="Search across skills, rules, and prompts in one table."
      />
    </Suspense>
  );
}
