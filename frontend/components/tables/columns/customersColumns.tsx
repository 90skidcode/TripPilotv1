"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ColumnHeader } from "../ColumnHeader";
import { DataTableCheckbox } from "../DataTableCheckbox";

export interface CustomerRow {
  id: number;
  name: string;
  phone: string;
  email?: string;
  whatsapp_number?: string;
}

/**
 * Customers Table Columns
 * Defines column structure for customers data table
 */
export const customersColumns: ColumnDef<CustomerRow>[] = [
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
    accessorKey: "name",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <span className="font-medium">{name}</span>;
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => (
      <a
        href={`tel:${row.getValue("phone")}`}
        className="text-primary hover:underline"
      >
        {row.getValue("phone")}
      </a>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <ColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue("email") as string | undefined;
      return email ? (
        <a
          href={`mailto:${email}`}
          className="text-primary hover:underline"
        >
          {email}
        </a>
      ) : (
        "—"
      );
    },
  },
  {
    accessorKey: "whatsapp_number",
    header: ({ column }) => (
      <ColumnHeader column={column} title="WhatsApp" />
    ),
    cell: ({ row }) => row.getValue("whatsapp_number") || "—",
  },
];
