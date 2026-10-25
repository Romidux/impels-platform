import {
  SkeletonPageHeader,
  SkeletonForm,
} from "@/components/dashboard/Skeletons";

export default function NuevoClienteLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader />
      <SkeletonForm campos={5} />
    </div>
  );
}
