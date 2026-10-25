import {
  SkeletonPageHeader,
  SkeletonCardGrid,
} from "@/components/dashboard/Skeletons";

export default function PlanLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader conAccion={false} />
      <SkeletonCardGrid cantidad={3} />
    </div>
  );
}
