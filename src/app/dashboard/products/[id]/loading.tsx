import {
  SkeletonPageHeader,
  SkeletonForm,
} from "@/components/dashboard/Skeletons";

export default function EditarProductoLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonForm campos={2} />
          <SkeletonForm campos={1} />
          <SkeletonForm campos={3} />
        </div>
        <div className="space-y-6">
          <SkeletonForm campos={2} />
          <SkeletonForm campos={1} />
        </div>
      </div>
    </div>
  );
}
