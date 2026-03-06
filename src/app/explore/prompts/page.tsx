import { CatalogExplorer } from "@/components/explore/catalog-explorer";

export default function ExplorePromptsPage() {
  return (
    <CatalogExplorer
      section="prompts"
      fixedType="prompt"
      title="Prompts"
      description="Search and evaluate prompt entries without mixing in rules and skills."
    />
  );
}
