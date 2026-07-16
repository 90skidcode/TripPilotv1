/**
 * EXAMPLE: How to use DataTable component in a realistic admin scenario
 *
 * This example shows how to refactor the users page to use the new DataTable component
 * instead of manual table rendering. This demonstrates:
 * - Server-side pagination
 * - Icon-based actions (edit, delete, impersonate)
 * - Custom cell rendering
 * - Loading states
 * - Empty states
 */

"use client";

import { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { Edit2, Trash2, LogIn, MoreVertical } from "lucide-react";

interface AgencyUser {
  id: number;
  name: string;
  email: string;
  org_id: number;
  group_id: number | null;
  role?: string;
}

interface UserGroup {
  id: number;
  name: string;
}

interface ExampleUsersTableProps {
  agencyId: number;
  groups: UserGroup[];
  onEditUser: (user: AgencyUser) => void;
  onDeleteUser: (user: AgencyUser) => void;
  onImpersonate: (user: AgencyUser) => void;
}

export function ExampleUsersTable({
  agencyId,
  groups,
  onEditUser,
  onDeleteUser,
  onImpersonate,
}: ExampleUsersTableProps) {
  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { pagination, sort, handlers } = usePagination(0, {
    initialPageSize: 25,
  });
  const [total, setTotal] = useState(0);

  // Fetch users from server with pagination, sorting, etc.
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        // Replace with your actual API endpoint
        const params = new URLSearchParams({
          page: String(pagination.page),
          pageSize: String(pagination.pageSize),
          ...(sort.field && { sortBy: sort.field }),
          ...(sort.order && { sortOrder: sort.order }),
        });

        // const response = await SuperAdminAPI.getAgencyUsers(agencyId, {
        //   page: pagination.page,
        //   pageSize: pagination.pageSize,
        //   sortBy: sort.field,
        //   sortOrder: sort.order,
        // });

        // For now, this is a mock implementation
        // setUsers(response.data);
        // setTotal(response.total);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (agencyId) {
      fetchUsers();
    }
  }, [agencyId, pagination.page, pagination.pageSize, sort.field, sort.order]);

  const columns: DataTableColumn<AgencyUser>[] = [
    {
      key: "name",
      header: "User Name",
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
              user.role === "admin" ? "bg-blue-500" : "bg-slate-400"
            }`}
          >
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "group_id",
      header: "Permission Group",
      sortable: false,
      render: (_, user) => {
        const assignedGroup = groups.find((g) => g.id === user.group_id);
        return assignedGroup ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            🛡️ {assignedGroup.name}
          </span>
        ) : (
          <span className="text-xs text-amber-600 font-medium italic">
            ⚠️ No Group (Blocked)
          </span>
        );
      },
    },
  ];

  const handleActionClick = (action: string, user: AgencyUser) => {
    switch (action) {
      case "edit":
        onEditUser(user);
        break;
      case "delete":
        if (
          confirm(
            `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
          )
        ) {
          onDeleteUser(user);
        }
        break;
      case "impersonate":
        onImpersonate(user);
        break;
    }
  };

  const actions = [
    {
      id: "edit",
      icon: <Edit2 className="w-4 h-4" />,
      label: "Edit",
      tooltip: "Edit user settings",
      onClick: (user: AgencyUser) => handleActionClick("edit", user),
      variant: "default" as const,
    },
    {
      id: "impersonate",
      icon: <LogIn className="w-4 h-4" />,
      label: "Impersonate",
      tooltip: "Generate impersonation token",
      onClick: (user: AgencyUser) => handleActionClick("impersonate", user),
      variant: "default" as const,
    },
    {
      id: "delete",
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete",
      tooltip: "Delete user",
      onClick: (user: AgencyUser) => handleActionClick("delete", user),
      variant: "danger" as const,
      disabled: (user) => user.id === 1, // Prevent deleting admin user
    },
  ];

  return (
    <DataTable<AgencyUser>
      columns={columns}
      data={users}
      actions={actions}
      pagination={{ ...pagination, total }}
      onPaginationChange={handlers.onPaginationChange}
      onSort={handlers.onSort}
      isLoading={isLoading}
      emptyMessage="No users found in this agency"
      emptyIcon="👥"
      compact={false}
      striped={true}
      hoverable={true}
    />
  );
}
