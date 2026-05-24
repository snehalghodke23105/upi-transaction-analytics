import { useGetAnalyticsSummary, useGetTransactionsOverTime, useGetSpendingByCategory, useGetPaymentApps, useGetTopMerchants } from "@workspace/api-client-react";
import { CSVLink } from "react-csv";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { formatRupeeCompact, formatNumberCompact } from "@/lib/formatters";
import { HeaderControls } from "@/components/HeaderControls";
import { useTheme } from "next-themes";
import { CHART_COLORS, CHART_COLOR_LIST, CustomTooltip, CustomLegend, DATA_SOURCES, formatDate } from "@/lib/chartUtils";

function KPICard({ title, value, change, trend, loading }: { title: string; value: string; change: string; trend: "up" | "down" | "neutral", loading: boolean }) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "#0079F2" }}>{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {isPositive && <ArrowUpIcon className="w-4 h-4 text-green-600" />}
              {isNegative && <ArrowDownIcon className="w-4 h-4 text-red-600" />}
              <span className={`text-sm ${isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"}`}>{change}</span>
              <span className="text-sm text-muted-foreground">from last period</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Overview() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: summary, isLoading: loadingSummary, isFetching: fetchingSummary, dataUpdatedAt } = useGetAnalyticsSummary();
  const { data: dailyData, isLoading: loadingDaily, isFetching: fetchingDaily } = useGetTransactionsOverTime({ days: 30 });
  const { data: categoryData, isLoading: loadingCategory, isFetching: fetchingCategory } = useGetSpendingByCategory();
  const { data: paymentApps, isLoading: loadingApps, isFetching: fetchingApps } = useGetPaymentApps();
  const { data: topMerchants, isLoading: loadingMerchants, isFetching: fetchingMerchants } = useGetTopMerchants({ limit: 5 });

  const loading = loadingSummary || fetchingSummary || loadingDaily || fetchingDaily || loadingCategory || fetchingCategory || loadingApps || fetchingApps || loadingMerchants || fetchingMerchants;

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
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="pt-2">
            <h1 className="font-bold text-[32px]">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1.5 text-[14px]">High-level view of UPI transaction activity and fraud.</p>
            {DATA_SOURCES.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
                {DATA_SOURCES.map((source) => (
                  <span
                    key={source}
                    className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                    title={source}
                    style={{
                      maxWidth: "20ch",
                      backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                      color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                    }}
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

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KPICard
            loading={loadingSummary}
            title="Total Volume"
            value={summary ? formatRupeeCompact(summary.totalVolume) : "0"}
            change="+4.2%"
            trend="up"
          />
          <KPICard
            loading={loadingSummary}
            title="Total Transactions"
            value={summary ? formatNumberCompact(summary.totalTransactions) : "0"}
            change="+2.1%"
            trend="up"
          />
          <KPICard
            loading={loadingSummary}
            title="Fraud Count"
            value={summary ? formatNumberCompact(summary.fraudCount) : "0"}
            change="-1.2%"
            trend="down"
          />
          <KPICard
            loading={loadingSummary}
            title="Avg Transaction Amount"
            value={summary ? formatRupeeCompact(summary.avgTransactionAmount) : "0"}
            change="+0.5%"
            trend="up"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Daily Volume Area Chart */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Transaction Volume (30 Days)</CardTitle>
              {!loadingDaily && dailyData && dailyData.length > 0 && (
                <CSVLink
                  data={dailyData}
                  filename="daily-volume.csv"
                  className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                  aria-label="Export chart data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadingDaily ? <Skeleton className="w-full h-[300px]" /> : dailyData && dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="gradientVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis tickFormatter={(value) => `₹${(value / 10000000).toFixed(1)}Cr`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ fill: 'rgba(0,0,0,0.05)', stroke: 'none' }} />
                    <Legend content={<CustomLegend />} />
                    <Area type="linear" dataKey="totalAmount" name="Total Amount" fill="url(#gradientVol)" stroke={CHART_COLORS.blue} fillOpacity={1} strokeWidth={2} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Spending By Category */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Spending By Category</CardTitle>
              {!loadingCategory && categoryData && categoryData.length > 0 && (
                <CSVLink
                  data={categoryData}
                  filename="spending-by-category.csv"
                  className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                  aria-label="Export chart data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadingCategory ? <Skeleton className="w-full h-[300px]" /> : categoryData && categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="totalAmount" name="Total Spend" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Payment Apps Market Share */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Payment Apps Market Share</CardTitle>
              {!loadingApps && paymentApps && paymentApps.length > 0 && (
                <CSVLink
                  data={paymentApps}
                  filename="payment-apps.csv"
                  className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                  aria-label="Export chart data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadingApps ? <Skeleton className="w-full h-[300px]" /> : paymentApps && paymentApps.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <PieChart>
                    <Pie data={paymentApps} dataKey="transactionCount" nameKey="appName" cx="50%" cy="50%" outerRadius={100} innerRadius={60} cornerRadius={2} paddingAngle={2} isAnimationActive={false} stroke="none">
                      {paymentApps.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>

          {/* Top Merchants */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Top Merchants (Volume)</CardTitle>
              {!loadingMerchants && topMerchants && topMerchants.length > 0 && (
                <CSVLink
                  data={topMerchants}
                  filename="top-merchants.csv"
                  className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
                  style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
                  aria-label="Export chart data as CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </CSVLink>
              )}
            </CardHeader>
            <CardContent>
              {loadingMerchants ? <Skeleton className="w-full h-[300px]" /> : topMerchants && topMerchants.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} debounce={0}>
                  <BarChart data={topMerchants}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="merchantName" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                    <Legend content={<CustomLegend />} />
                    <Bar dataKey="totalAmount" name="Amount" fill={CHART_COLORS.purple} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
