import {
  SkeletonPageHeader,
  SkeletonForm,
} from "@/components/dashboard/Skeletons";

export default function StoreHomeLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader conAccion={false} />
      <SkeletonForm campos={4} />
    </div>
  );
}
