import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { useGetTransactions } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeaderControls } from "@/components/HeaderControls";
import { DATA_SOURCES, formatDate } from "@/lib/chartUtils";
import { formatRupee } from "@/lib/formatters";
import type { Transaction } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

const CATEGORIES = [
  "All",
  "Grocery",
  "Utility",
  "Transfer",
  "Shopping",
  "Travel",
  "Dining",
  "Entertainment"
];

export default function Explorer() {
  const [page, setPage] = useState(1);
  const [fraudOnly, setFraudOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const debouncedSearch = useDebounce(search, 500);
  const debouncedMin = useDebounce(minAmount, 500);
  const debouncedMax = useDebounce(maxAmount, 500);

  const { data, isLoading, isFetching } = useGetTransactions({
    page,
    limit: 20,
    fraudOnly,
    category: category === "All" ? undefined : category,
    minAmount: debouncedMin ? Number(debouncedMin) : undefined,
    maxAmount: debouncedMax ? Number(debouncedMax) : undefined,
    search: debouncedSearch || undefined
  });

  const loading = isLoading || isFetching;

  const columns = useMemo<ColumnDef<Transaction>[]>(() => [
    {
      accessorKey: "transactionId",
      header: "Txn ID",
      cell: ({ row }) => <span className="font-mono text-[13px]">{row.original.transactionId.substring(0, 8)}...</span>,
    },
    {
      accessorKey: "timestamp",
      header: "Date",
      cell: ({ row }) => <span className="text-[13px]">{formatDate(row.original.timestamp, "MMM d, yyyy HH:mm")}</span>,
    },
    {
      accessorKey: "merchantName",
      header: "Merchant",
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "paymentApp",
      header: "App",
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => <div className="text-right font-medium">{formatRupee(row.original.amount)}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status.toLowerCase();
        const colorMap: Record<string, string> = {
          success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
          failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        };
        return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colorMap[status] || "bg-muted text-muted-foreground"}`}>{status.toUpperCase()}</span>;
      },
    },
    {
      accessorKey: "isFraud",
      header: "Risk",
      cell: ({ row }) => {
        if (row.original.isFraud) {
          return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400 border border-red-200 dark:border-red-800">FRAUD</span>;
        }
        return <span className="text-muted-foreground text-[12px]">Normal</span>;
      },
    }
  ], []);

  const tableData = data?.transactions || [];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="pt-2">
            <h1 className="font-bold text-[32px]">Transaction Explorer</h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">Search and filter raw UPI transactions.</p>
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
                {DATA_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                    title={source}
                    style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#c8c9cc" }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
          <HeaderControls loading={loading} />
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
          <div className="w-[300px]">
            <Label className="text-[13px] mb-1.5 block">Search Merchant or Txn ID</Label>
            <Input 
              placeholder="Search..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-[180px]">
            <Label className="text-[13px] mb-1.5 block">Category</Label>
            <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]">
            <Label className="text-[13px] mb-1.5 block">Min Amount (₹)</Label>
            <Input 
              type="number"
              placeholder="0" 
              value={minAmount}
              onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-[140px]">
            <Label className="text-[13px] mb-1.5 block">Max Amount (₹)</Label>
            <Input 
              type="number"
              placeholder="No limit" 
              value={maxAmount}
              onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Switch id="fraud-mode" checked={fraudOnly} onCheckedChange={(v) => { setFraudOnly(v); setPage(1); }} />
            <Label htmlFor="fraud-mode" className="text-[13px] cursor-pointer">Show Fraud Only</Label>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading && tableData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : tableData.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {data && (
              <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing page {data.page} of {data.totalPages} ({data.total} total)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages || loading}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
