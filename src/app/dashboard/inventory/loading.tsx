import {
  SkeletonPageHeader,
  SkeletonKpiRow,
  SkeletonToolbar,
  SkeletonTable,
} from "@/components/dashboard/Skeletons";

export default function InventoryLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader />
      <SkeletonKpiRow cantidad={4} />
      <SkeletonToolbar />
      <SkeletonTable filas={8} columnas={5} conAvatar />
    </div>
  );
}
