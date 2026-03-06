import { CatalogExplorer } from "@/components/explore/catalog-explorer";

export default function ExploreRulesPage() {
  return (
    <CatalogExplorer
      section="rules"
      fixedType="rule"
      title="Rules"
      description="Search and browse coding rules in a focused table view."
    />
  );
}
