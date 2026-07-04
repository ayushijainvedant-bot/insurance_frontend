import { AdminAuthProvider } from "@/hooks/useAdminAuth";

// The CMS section runs its own auth context (admin token), independent of the
// customer AuthProvider in the root layout.
export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
