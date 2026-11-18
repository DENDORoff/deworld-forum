import { Suspense } from "react";

import { LandingContent } from "@/components/landing-content";
import { LandingSkeleton } from "@/components/landing-skeleton";

export default function LandingPage() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingContent />
    </Suspense>
  );
}
