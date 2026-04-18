"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function FormCreatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const id = searchParams.get("id");
    router.replace(id ? `/form-builder?id=${id}` : "/form-builder");
  }, [router, searchParams]);

  return null;
}
