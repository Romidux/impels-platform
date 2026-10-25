import {
  SkeletonPageHeader,
  SkeletonForm,
} from "@/components/dashboard/Skeletons";

export default function NuevoPedidoLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonForm campos={3} />
          <SkeletonForm campos={2} />
        </div>
        <SkeletonForm campos={3} />
      </div>
    </div>
  );
}
