"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

export default function SSOCallback() {
  const { handleRedirectCallback } = useClerk();
  const router = useRouter();

  useEffect(() => {
    async function handleCallback() {
      try {
        await handleRedirectCallback({
          afterSignInUrl: "/",
          afterSignUpUrl: "/",
        });
      } catch (err) {
        console.error("SSO callback error:", err);
        router.push("/login");
      }
    }

    handleCallback();
  }, [handleRedirectCallback, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Spinner className="h-8 w-8" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
