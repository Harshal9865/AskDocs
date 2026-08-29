"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyDocumentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/documents?view=mine");
  }, [router]);
  return null;
}
