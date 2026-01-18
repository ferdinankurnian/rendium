import { SidebarWrapper } from "@/components/sidebar-wrapper";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
}
