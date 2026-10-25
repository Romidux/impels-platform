import {
  SkeletonPageHeader,
  SkeletonCardGrid,
} from "@/components/dashboard/Skeletons";

export default function StoreLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SkeletonPageHeader />
      <SkeletonCardGrid cantidad={5} />
    </div>
  );
}
