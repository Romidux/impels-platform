import {
  SkeletonPageHeader,
  SkeletonForm,
} from "@/components/dashboard/Skeletons";

export default function StoreIdentityLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader conAccion={false} />
      <SkeletonForm campos={5} />
    </div>
  );
}
