"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ColumnHeader } from "../ColumnHeader";

export interface FollowupRow {
  id: number;
  lead_id: number;
  customer_name?: string;
  type: string;
  status: string;
  scheduled_date: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive"> = {
  pending: "warning",
  completed: "success",
  cancelled: "destructive",
  scheduled: "default",
};

const TYPE_COLORS: Record<string, "default" | "secondary"> = {
  call: "secondary",
  email: "secondary",
  meeting: "default",
};

/**
 * Followups Table Columns
 * Defines column structure for followups data table
 */
export const followupsColumns: ColumnDef<FollowupRow>[] = [
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.getValue("customer_name")}
      </span>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <Badge variant="outline">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={STATUS_COLORS[status] || "default"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "scheduled_date",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Scheduled" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("scheduled_date") as string);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "notes",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Notes" />
    ),
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string | undefined;
      return notes ? (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {notes}
        </span>
      ) : (
        "—"
      );
    },
  },
];
