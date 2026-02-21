import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarWrapper } from "@/components/sidebar-wrapper";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return <SidebarWrapper>{children}</SidebarWrapper>;
}
