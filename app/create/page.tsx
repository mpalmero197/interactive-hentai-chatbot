"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CharacterCreator } from "@/components/CharacterCreator";
import { useCharacters } from "@/stores/characterStore";

function CreateInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const characters = useCharacters();
  const initial = id ? characters.find((c) => c.id === id) : undefined;
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/55">
          {initial ? "edit" : "new girl"}
        </p>
        <h1 className="font-serif text-3xl text-rose-50">
          {initial ? `Edit ${initial.name}` : "Create"}
        </h1>
      </div>
      <CharacterCreator initial={initial} />
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<p className="text-white/40">Loading…</p>}>
      <CreateInner />
    </Suspense>
  );
}
