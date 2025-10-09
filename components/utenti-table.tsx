"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  useReactTable,
} from "@tanstack/react-table";
import BanUserDialog from "@/components/ban-user-dialog";
import ModificaUtenteModal from "@/components/modifica-utente-modal";
import { useSession } from "@/lib/auth-client";
import { CheckIcon } from "lucide-react";
import { XIcon } from "lucide-react";

export type Utente = {
  id: string;
  name: string | null;
  email: string;
  banned: boolean | null | undefined;
  licenseCamion: boolean | null | undefined;
  licenseEscavatore: boolean | null | undefined;
  phone: string | null | undefined;
};

type UtentiTableProps = {
  utenti: Utente[];
};

const columns: ColumnDef<Utente>[] = [
  {
    accessorKey: "name",
    header: () => "Nome",
    cell: ({ row }) => row.original.name ?? "",
  },
  {
    accessorKey: "email",
    header: () => "Email",
  },
  {
    accessorKey: "phone",
    header: () => "Telefono",
    cell: ({ row }) => row.original.phone ?? "",
  },
  {
    accessorKey: "licenseCamion",
    header: () => "Patente Camion",
    cell: ({ getValue }) => {
      const hasLicense = Boolean(getValue<boolean>());
      return (
        <span>
          {hasLicense ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
        </span>
      );
    },
  },
  {
    accessorKey: "licenseEscavatore",
    header: () => "Patente Escavatore",
    cell: ({ getValue }) => {
      const hasLicense = Boolean(getValue<boolean>());
      return (
        <span>
          {hasLicense ? <CheckIcon className="w-4 h-4" /> : <XIcon className="w-4 h-4" />}
        </span>
      );
    },
  },
  {
    accessorKey: "banned",
    header: () => "Stato",
    cell: ({ getValue }) => {
      const banned = Boolean(getValue<boolean>());
      return (
        <span className={`badge ${banned ? "badge-error" : "badge-success"}`}>
          {banned ? "Bloccato" : "Attivo"}
        </span>
      );
    },
    filterFn: (row, _columnId, filterValue) => {
      if (filterValue === undefined) return true;
      const banned = Boolean(row.getValue<boolean | null>("banned"));
      return banned === Boolean(filterValue);
    },
  },
  {
    id: "actions",
    header: () => "Azioni",
    cell: ({ row, table }) => {
      const user = row.original;
      const currentUser = (
        table.options.meta as { currentUser?: { id: string } }
      )?.currentUser;
      const isCurrentUser = currentUser?.id === user.id;

      return (
        <div className="flex gap-2">
          <ModificaUtenteModal
            utente={{
              id: user.id,
              name: user.name,
              phone: user.phone,
              licenseCamion: user.licenseCamion,
              licenseEscavatore: user.licenseEscavatore,
            }}
          />
          {!isCurrentUser && (
            <BanUserDialog
              user={{ id: user.id, name: user.name, banned: user.banned }}
            />
          )}
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];

export default function UtentiTable({ utenti }: UtentiTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const session = useSession();

  const table = useReactTable({
    data: utenti,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const search = String(filterValue).toLowerCase();
      const valuesToSearch = [
        String(row.getValue("name") ?? ""),
        String(row.getValue("email") ?? ""),
        String(row.getValue("phone") ?? "")
      ];
      return valuesToSearch.some((v) => v.toLowerCase().includes(search));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      currentUser: session.data?.user,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  // Apply status filter by controlling columnFilters for "banned"
  React.useEffect(() => {
    setColumnFilters((prev) => {
      const other = prev.filter((f) => f.id !== "banned");
      if (!statusFilter) return other;
      const value = statusFilter === "bloccato" ? true : false;
      return [...other, { id: "banned", value }];
    });
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="join w-full md:w-auto">
          <input
            type="text"
            placeholder="Cerca per nome o email"
            className="input input-bordered join-item w-full md:w-80"
            value={globalFilter}
            onChange={(e) => {
              table.setPageIndex(0);
              setGlobalFilter(e.target.value);
            }}
          />
          <select
            className="select select-bordered join-item"
            value={statusFilter}
            onChange={(e) => {
              table.setPageIndex(0);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">Tutti</option>
            <option value="attivo">Attivi</option>
            <option value="bloccato">Bloccati</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="select select-bordered"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / pagina
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getIsSorted() === "asc" && <span>▲</span>}
                      {header.column.getIsSorted() === "desc" && <span>▼</span>}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="text-sm opacity-70">
          Pagina {table.getState().pagination.pageIndex + 1} di{" "}
          {table.getPageCount() || 1}
        </div>
        <div className="join">
          <button
            className="btn btn-ghost join-item"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            «
          </button>
          <button
            className="btn btn-ghost join-item"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Precedente
          </button>
          <button
            className="btn btn-ghost join-item"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Successiva
          </button>
          <button
            className="btn btn-ghost join-item"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
