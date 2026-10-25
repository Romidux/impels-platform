import {
  SkeletonPageHeader,
  SkeletonCardGrid,
} from "@/components/dashboard/Skeletons";

export default function AppsLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader conAccion={false} />
      <SkeletonCardGrid cantidad={6} />
    </div>
  );
}
