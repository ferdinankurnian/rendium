"use client";

import { CustomSignInButton } from "@/components/custom-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
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
          <CustomSignInButton className="w-full py-7 text-lg font-semibold rounded-xl transition-all active:scale-95 shadow-md">
            Sign in with Google
          </CustomSignInButton>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 w-full text-center text-muted-foreground/40">
        Rendium by Ferdinan Iydheko
      </div>
    </div>
  );
}
