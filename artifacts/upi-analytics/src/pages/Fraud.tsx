import { useGetFraudPatterns, useGetFraudByHour, useGetFraudByState, useGetAmountDistribution, useGetUserSegments } from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { HeaderControls } from "@/components/HeaderControls";
import { useTheme } from "next-themes";
import { CHART_COLORS, CHART_COLOR_LIST, CustomTooltip, CustomLegend, DATA_SOURCES } from "@/lib/chartUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatRupeeCompact } from "@/lib/formatters";

export default function Fraud() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: patterns, isLoading: loadPat, isFetching: fetchPat, dataUpdatedAt } = useGetFraudPatterns();
  const { data: hourly, isLoading: loadHr, isFetching: fetchHr } = useGetFraudByHour();
  const { data: stateData, isLoading: loadState, isFetching: fetchState } = useGetFraudByState();
  const { data: amountDist, isLoading: loadAmt, isFetching: fetchAmt } = useGetAmountDistribution();
  const { data: userSegs, isLoading: loadSeg, isFetching: fetchSeg } = useGetUserSegments();

  const loading = loadPat || fetchPat || loadHr || fetchHr || loadState || fetchState || loadAmt || fetchAmt || loadSeg || fetchSeg;

  const lastRefreshed = dataUpdatedAt
    ? (() => {
        const d = new Date(dataUpdatedAt);
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${time} on ${date}`;
      })()
    : null;

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="pt-2">
            <h1 className="font-bold text-[32px]">Fraud Intelligence</h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">Deep dive into fraud vectors, patterns, and risk distribution.</p>
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
                {DATA_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                    title={source}
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)", color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)" }}
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
            {lastRefreshed && <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>}
          </div>
          <HeaderControls loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Fraud Patterns</CardTitle>
              {!loadPat && patterns && patterns.length > 0 && (
                <CSVLink data={patterns} filename="fraud-patterns.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadPat ? <Skeleton className="w-full h-[300px]" /> : patterns && patterns.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <PieChart>
                    <Pie data={patterns} dataKey="count" nameKey="patternType" cx="50%" cy="50%" outerRadius={100} innerRadius={60} cornerRadius={2} paddingAngle={2} isAnimationActive={false} stroke="none">
                      {patterns.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Fraud By Hour</CardTitle>
              {!loadHr && hourly && hourly.length > 0 && (
                <CSVLink data={hourly} filename="fraud-hourly.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadHr ? <Skeleton className="w-full h-[300px]" /> : hourly && hourly.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <ComposedChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v * 100).toFixed(1)}%`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} />
                    <Bar yAxisId="left" dataKey="fraudCount" name="Fraud Count" fill={CHART_COLORS.red} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="fraudRate" name="Fraud Rate" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">State Risk Hotspots</CardTitle>
              {!loadState && stateData && stateData.length > 0 && (
                <CSVLink data={stateData} filename="state-fraud.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadState ? <Skeleton className="w-full h-[300px]" /> : stateData && stateData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <BarChart data={stateData} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis dataKey="state" type="category" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="fraudCount" name="Fraud Count" fill={CHART_COLORS.red} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Amount Distribution & Fraud</CardTitle>
              {!loadAmt && amountDist && amountDist.length > 0 && (
                <CSVLink data={amountDist} filename="amount-dist.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}>
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadAmt ? <Skeleton className="w-full h-[300px]" /> : amountDist && amountDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <ComposedChart data={amountDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} angle={-45} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} />
                    <Bar yAxisId="left" dataKey="count" name="Total Txs" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="right" dataKey="fraudCount" name="Fraud Txs" fill={CHART_COLORS.red} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-base">User Segments Risk Profile</CardTitle>
          </CardHeader>
          <CardContent>
            {loadSeg ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-10 w-full" />
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : userSegs && userSegs.length > 0 ? (
              <div className="rounded-md border mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Avg Spend</TableHead>
                      <TableHead className="text-right">Avg Txs</TableHead>
                      <TableHead className="text-right">Fraud Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSegs.map((seg) => (
                      <TableRow key={seg.segment}>
                        <TableCell className="font-medium">{seg.segment}</TableCell>
                        <TableCell className="text-right">{seg.userCount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatRupeeCompact(seg.avgSpend)}</TableCell>
                        <TableCell className="text-right">{seg.avgTransactionCount.toFixed(1)}</TableCell>
                        <TableCell className="text-right">
                          <span className={seg.fraudRate > 0.05 ? "text-red-500 font-bold" : ""}>
                            {(seg.fraudRate * 100).toFixed(2)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
