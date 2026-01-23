<!-- // ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Protected Page (Server Component)
/*
import { requireAuth, hasPermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default async function AdminPage() {
  const session = await requireAuth();
  const canViewUsers = await hasPermission(PERMISSIONS.VIEW_USERS);
  
  return (
    <div>
      <h1>Welcome {session.user.username}</h1>
      {canViewUsers && <UsersList />}
    </div>
  );
}
*/

// Example 2: Protected Page (Client Component)
/*
"use client";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import { PERMISSIONS, ROLES } from "@/lib/auth/permissions";

export default function DashboardPage() {
  return (
    <ProtectedRoute 
      requiredPermissions={[PERMISSIONS.VIEW_CONTENT]}
      requiredRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
    >
      <div>Dashboard Content</div>
    </ProtectedRoute>
  );
}
*/

// Example 3: Conditional Rendering
/*
"use client";
import RoleGuard from "@/components/Auth/RoleGuard";
import { PERMISSIONS } from "@/lib/auth/permissions";

export default function ContentPage() {
  return (
    <div>
      <h1>Content</h1>
      
      <RoleGuard 
        requiredPermissions={[PERMISSIONS.EDIT_CONTENT]}
        fallback={<p>You don't have permission to edit</p>}
      >
        <button>Edit Content</button>
      </RoleGuard>
    </div>
  );
}
*/

// Example 4: Using Custom Hook
/*
"use client";
import { useAuth } from "@/hooks/useAuth";
import { PERMISSIONS, ROLES } from "@/lib/auth/permissions";

export default function MyComponent() {
  const { user, hasPermission, hasRole } = useAuth();
  
  const canEdit = hasPermission(PERMISSIONS.EDIT_CONTENT);
  const isAdmin = hasRole(ROLES.ADMIN);
  
  return (
    <div>
      <p>Hello {user?.username}</p>
      {canEdit && <button>Edit</button>}
      {isAdmin && <button>Admin Panel</button>}
    </div>
  );
}
*/ -->