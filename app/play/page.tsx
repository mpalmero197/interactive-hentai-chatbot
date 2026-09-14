"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlayClient } from "@/components/PlayClient";

function PlayInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "demo-redhead";
  return <PlayClient id={id} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<p className="text-white/40">Loading…</p>}>
      <PlayInner />
    </Suspense>
  );
}
