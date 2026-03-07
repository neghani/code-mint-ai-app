import { Suspense } from "react";
import { CatalogExplorer } from "@/components/explore/catalog-explorer";

const fallback = (
  <div className="flex min-h-screen items-center justify-center text-gray-500">
    Loading catalog…
  </div>
);

export default function ExplorePromptsPage() {
  return (
    <Suspense fallback={fallback}>
      <CatalogExplorer
        section="prompts"
        fixedType="prompt"
        title="Prompts"
        description="Search and evaluate prompt entries without mixing in rules and skills."
      />
    </Suspense>
  );
}
