import {
  SkeletonPageHeader,
  SkeletonCard,
  SkeletonBar,
  SkeletonTable,
} from "@/components/dashboard/Skeletons";

export default function DetallePedidoLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SkeletonTable filas={3} columnas={3} conAvatar />
          <SkeletonCard className="space-y-3">
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="h-4 w-full" tono="suave" />
            <SkeletonBar className="h-4 w-2/3" tono="suave" />
          </SkeletonCard>
        </div>
        <div className="space-y-6">
          <SkeletonCard className="space-y-3">
            <SkeletonBar className="h-5 w-28" />
            <SkeletonBar className="h-4 w-full" tono="suave" />
            <SkeletonBar className="h-4 w-3/4" tono="suave" />
          </SkeletonCard>
          <SkeletonCard className="space-y-3">
            <SkeletonBar className="h-5 w-24" />
            <SkeletonBar className="h-4 w-full" tono="suave" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
