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
  useReactTable,
} from "@tanstack/react-table";
import ModificaMezzoModal from "@/components/modifica-mezzo-modal";
import EliminaMezzoModal from "@/components/elimina-mezzo-modal";
import AssegnaUtenteMezzoModal from "@/components/assegna-utente-mezzo-modal";
import { CheckIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import { UserNotBanned } from "@/lib/data/users.data";
import { Mezzo } from "@/lib/data/mezzi.data";

type MezziTableProps = {
  mezzi: Mezzo[];
  users: UserNotBanned[];
};

const createColumns = (users: UserNotBanned[]): ColumnDef<Mezzo>[] => [
  {
    accessorKey: "nome",
    header: () => "Nome",
  },
  {
    accessorKey: "descrizione",
    header: () => "Descrizione",
  },
  {
    accessorKey: "has_license_camion",
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
    accessorKey: "has_license_escavatore",
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
    accessorKey: "user_mezzi",
    header: () => "N. Operatori",
    cell: ({ getValue }) => {
      const userMezzi = getValue<any[]>();
      return (
        <span className="font-medium">
          {userMezzi?.length || 0}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => "Azioni",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex gap-2">
          <AssegnaUtenteMezzoModal 
            mezzoId={item.id} 
            mezzoNome={item.nome}
            mezzoLicenze={{
              has_license_camion: item.has_license_camion,
              has_license_escavatore: item.has_license_escavatore,
            }}
            users={users}
            userMezzi={item.user_mezzi}
          />
          <ModificaMezzoModal
            mezzo={{
              id: item.id,
              nome: item.nome,
              descrizione: item.descrizione,
              has_license_camion: item.has_license_camion,
              has_license_escavatore: item.has_license_escavatore,
            }}
          />
          <EliminaMezzoModal mezzo={{ id: item.id, nome: item.nome }} />
        </div>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];

export default function MezziTable({ mezzi, users }: MezziTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: mezzi,
    columns: createColumns(users),
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue) => {
      if (!filterValue) return true;
      const search = String(filterValue).toLowerCase();
      const valuesToSearch = [
        String(row.getValue("nome") ?? ""),
        String(row.getValue("descrizione") ?? ""),
      ];
      return valuesToSearch.some((v) => v.toLowerCase().includes(search));
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="join w-full md:w-auto">
          <input
            type="text"
            placeholder="Cerca per nome o descrizione"
            className="input input-bordered join-item w-full md:w-80"
            value={globalFilter}
            onChange={(e) => {
              table.setPageIndex(0);
              setGlobalFilter(e.target.value);
            }}
          />
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
