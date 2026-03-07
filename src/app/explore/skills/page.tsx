import { Suspense } from "react";
import { CatalogExplorer } from "@/components/explore/catalog-explorer";

function ExploreFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Loading catalog…
    </div>
  );
}

export default function ExploreSkillsPage() {
  return (
    <Suspense fallback={<ExploreFallback />}>
      <CatalogExplorer
        section="skills"
        fixedType="skill"
        title="Skills"
        description="Search and compare reusable skills with a dedicated view."
      />
    </Suspense>
  );
}
