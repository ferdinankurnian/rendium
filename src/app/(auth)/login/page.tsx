"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google");
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-sm border-none bg-transparent shadow-none sm:bg-card sm:border sm:shadow-sm">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-background border rounded-2xl shadow-sm">
              <Image src="/rendium.png" alt="Rendium Logo" width={72} height={72} className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-extrabold tracking-tight">Rendium</CardTitle>
            <CardDescription className="text-base text-muted-foreground font-medium">
              Organize your bookmarks with style.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 pt-4">
          <Button 
            variant="default" 
            size="lg" 
            className="w-full py-7 text-lg font-semibold rounded-xl transition-all active:scale-95 shadow-md"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-6 w-full text-center text-muted-foreground/40">
        Rendium by Ferdinan Iydheko
      </div>
    </div>
  );
}