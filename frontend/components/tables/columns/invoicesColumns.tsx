"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ColumnHeader } from "../ColumnHeader";
import { DataTableCheckbox } from "../DataTableCheckbox";

export interface InvoiceRow {
  id: number;
  invoice_number: string;
  customer_name?: string;
  amount: number;
  currency?: string;
  status: string;
  issue_date: string;
  due_date?: string;
}

const STATUS_COLORS: Record<string, "default" | "success" | "warning" | "destructive"> = {
  draft: "default",
  sent: "default",
  paid: "success",
  overdue: "destructive",
};

/**
 * Invoices Table Columns
 * Defines column structure for invoices data table
 */
export const invoicesColumns: ColumnDef<InvoiceRow>[] = [
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
    accessorKey: "invoice_number",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Invoice #" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("invoice_number")}</span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => row.getValue("customer_name") || "—",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const currency = row.original.currency || "INR";
      const formatter = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
      });
      return <span>{formatter.format(amount)}</span>;
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
    accessorKey: "issue_date",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Issued" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("issue_date") as string);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Due" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("due_date") as string | undefined;
      return date ? new Date(date).toLocaleDateString() : "—";
    },
  },
];
