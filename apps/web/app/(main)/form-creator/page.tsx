"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FormCreatorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const id = searchParams.get("id");
    router.replace(id ? `/form-builder?id=${id}` : "/form-builder");
  }, [router, searchParams]);

  return null;
}

export default function FormCreatorPage() {
  return (
    <React.Suspense fallback={null}>
      <FormCreatorRedirect />
    </React.Suspense>
  );
}
