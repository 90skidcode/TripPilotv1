"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ColumnHeader } from "../ColumnHeader";
import { DataTableCheckbox } from "../DataTableCheckbox";

export interface LeadRow {
  id: number;
  customer?: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  source: string;
  stage: string;
  destination?: string;
  budget?: string;
  assigned_to?: number;
  created_at: string;
}

const STAGE_COLORS: Record<string, "default" | "success" | "warning" | "destructive" | "info"> = {
  fresh: "info",
  qualified_hot: "success",
  qualified_warm: "warning",
  won: "success",
  lost: "destructive",
  not_responding: "destructive",
  disqualified: "destructive",
  future_prospect: "info",
};

const STAGE_LABELS: Record<string, string> = {
  fresh: "Fresh",
  qualified_hot: "Hot",
  qualified_warm: "Warm",
  won: "Won",
  lost: "Lost",
  not_responding: "Not Responding",
  disqualified: "Disqualified",
  future_prospect: "Future Prospect",
};

/**
 * Leads Table Columns
 * Defines column structure for leads data table
 */
export const leadsColumns: ColumnDef<LeadRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <DataTableCheckbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <DataTableCheckbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "customer",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
      const customer = row.getValue("customer") as LeadRow["customer"];
      return (
        <div>
          <p className="font-medium">{customer?.name}</p>
          <p className="text-xs text-muted-foreground">{customer?.phone}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Source" />
    ),
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      return (
        <Badge variant="outline">
          {source.charAt(0).toUpperCase() + source.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "stage",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Stage" />
    ),
    cell: ({ row }) => {
      const stage = row.getValue("stage") as string;
      return (
        <Badge variant={STAGE_COLORS[stage] || "default"}>
          {STAGE_LABELS[stage] || stage}
        </Badge>
      );
    },
  },
  {
    accessorKey: "destination",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Destination" />
    ),
    cell: ({ row }) => row.getValue("destination") || "—",
  },
  {
    accessorKey: "budget",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Budget" />
    ),
    cell: ({ row }) => row.getValue("budget") || "—",
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at") as string);
      return date.toLocaleDateString();
    },
  },
];
