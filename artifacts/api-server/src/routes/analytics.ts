import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { sql, desc, count, sum, avg, and, eq, gte, lte, ilike, or } from "drizzle-orm";

const router = Router();

router.get("/analytics/summary", async (req: Request, res: Response): Promise<void> => {
  const [summary] = await db
    .select({
      totalTransactions: count(),
      totalVolume: sum(transactionsTable.amount),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
      fraudVolume: sum(sql<number>`case when ${transactionsTable.isFraud} then ${transactionsTable.amount}::numeric else 0 end`),
      avgTransactionAmount: avg(transactionsTable.amount),
      activeUsers: sql<number>`count(distinct ${transactionsTable.userId})`,
    })
    .from(transactionsTable);

  const total = Number(summary.totalTransactions) || 0;
  const fraudCnt = Number(summary.fraudCount) || 0;
  const successful = await db
    .select({ c: count() })
    .from(transactionsTable)
    .where(eq(transactionsTable.status, "success"));

  res.json({
    totalTransactions: total,
    totalVolume: Number(summary.totalVolume) || 0,
    fraudCount: fraudCnt,
    fraudRate: total > 0 ? (fraudCnt / total) * 100 : 0,
    avgTransactionAmount: Number(summary.avgTransactionAmount) || 0,
    activeUsers: Number(summary.activeUsers) || 0,
    fraudVolume: Number(summary.fraudVolume) || 0,
    successRate: total > 0 ? (Number(successful[0].c) / total) * 100 : 0,
  });
});

router.get("/analytics/transactions-over-time", async (req: Request, res: Response): Promise<void> => {
  const days = Number(req.query.days) || 30;
  const rows = await db
    .select({
      date: sql<string>`date(${transactionsTable.timestamp})`,
      totalTransactions: count(),
      fraudTransactions: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
      totalAmount: sum(transactionsTable.amount),
      fraudAmount: sum(sql<number>`case when ${transactionsTable.isFraud} then ${transactionsTable.amount}::numeric else 0 end`),
    })
    .from(transactionsTable)
    .where(sql`${transactionsTable.timestamp} >= (select max(timestamp) from transactions) - interval '${sql.raw(String(days))} days'`)
    .groupBy(sql`date(${transactionsTable.timestamp})`)
    .orderBy(sql`date(${transactionsTable.timestamp})`);

  res.json(
    rows.map((r) => ({
      date: r.date,
      totalTransactions: Number(r.totalTransactions),
      fraudTransactions: Number(r.fraudTransactions),
      totalAmount: Number(r.totalAmount),
      fraudAmount: Number(r.fraudAmount),
    }))
  );
});

router.get("/analytics/spending-by-category", async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      category: transactionsTable.category,
      totalAmount: sum(transactionsTable.amount),
      transactionCount: count(),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
      avgAmount: avg(transactionsTable.amount),
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.category)
    .orderBy(desc(sum(transactionsTable.amount)));

  res.json(
    rows.map((r) => ({
      category: r.category,
      totalAmount: Number(r.totalAmount),
      transactionCount: Number(r.transactionCount),
      fraudCount: Number(r.fraudCount),
      avgAmount: Number(r.avgAmount),
    }))
  );
});

router.get("/analytics/top-merchants", async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const rows = await db
    .select({
      merchantName: transactionsTable.merchantName,
      category: transactionsTable.category,
      totalAmount: sum(transactionsTable.amount),
      transactionCount: count(),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.merchantName, transactionsTable.category)
    .orderBy(desc(sum(transactionsTable.amount)))
    .limit(limit);

  res.json(
    rows.map((r) => ({
      merchantName: r.merchantName,
      category: r.category,
      totalAmount: Number(r.totalAmount),
      transactionCount: Number(r.transactionCount),
      fraudCount: Number(r.fraudCount),
    }))
  );
});

router.get("/analytics/fraud-patterns", async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      patternType: transactionsTable.fraudType,
      count: count(),
      totalAmount: sum(transactionsTable.amount),
    })
    .from(transactionsTable)
    .where(eq(transactionsTable.isFraud, true))
    .groupBy(transactionsTable.fraudType)
    .orderBy(desc(count()));

  const totalFraud = rows.reduce((s, r) => s + Number(r.count), 0);

  res.json(
    rows.map((r) => ({
      patternType: r.patternType || "Unknown",
      count: Number(r.count),
      totalAmount: Number(r.totalAmount),
      percentage: totalFraud > 0 ? (Number(r.count) / totalFraud) * 100 : 0,
    }))
  );
});

router.get("/analytics/fraud-by-hour", async (req: Request, res: Response): Promise<void> => {
  const hours = await db
    .select({
      hour: sql<number>`extract(hour from ${transactionsTable.timestamp})`,
      totalCount: count(),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
    })
    .from(transactionsTable)
    .groupBy(sql`extract(hour from ${transactionsTable.timestamp})`)
    .orderBy(sql`extract(hour from ${transactionsTable.timestamp})`);

  res.json(
    hours.map((r) => ({
      hour: Number(r.hour),
      fraudCount: Number(r.fraudCount),
      totalCount: Number(r.totalCount),
      fraudRate: Number(r.totalCount) > 0 ? (Number(r.fraudCount) / Number(r.totalCount)) * 100 : 0,
    }))
  );
});

router.get("/analytics/amount-distribution", async (req: Request, res: Response): Promise<void> => {
  const buckets = [
    { bucket: "0-100", label: "₹0–100", min: 0, max: 100 },
    { bucket: "100-500", label: "₹100–500", min: 100, max: 500 },
    { bucket: "500-1000", label: "₹500–1K", min: 500, max: 1000 },
    { bucket: "1000-5000", label: "₹1K–5K", min: 1000, max: 5000 },
    { bucket: "5000-10000", label: "₹5K–10K", min: 5000, max: 10000 },
    { bucket: "10000+", label: "₹10K+", min: 10000, max: 9999999 },
  ];

  const results = await Promise.all(
    buckets.map(async (b) => {
      const [row] = await db
        .select({
          count: count(),
          fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
        })
        .from(transactionsTable)
        .where(
          and(
            gte(transactionsTable.amount, String(b.min)),
            lte(transactionsTable.amount, String(b.max))
          )
        );
      return {
        bucket: b.bucket,
        label: b.label,
        count: Number(row.count),
        fraudCount: Number(row.fraudCount),
      };
    })
  );

  res.json(results);
});

router.get("/analytics/payment-apps", async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      appName: transactionsTable.paymentApp,
      transactionCount: count(),
      totalAmount: sum(transactionsTable.amount),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.paymentApp)
    .orderBy(desc(count()));

  const totalTxns = rows.reduce((s, r) => s + Number(r.transactionCount), 0);

  res.json(
    rows.map((r) => ({
      appName: r.appName,
      transactionCount: Number(r.transactionCount),
      totalAmount: Number(r.totalAmount),
      fraudCount: Number(r.fraudCount),
      marketShare: totalTxns > 0 ? (Number(r.transactionCount) / totalTxns) * 100 : 0,
    }))
  );
});

router.get("/analytics/transactions", async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const offset = (page - 1) * limit;
  const fraudOnly = req.query.fraudOnly === "true";
  const category = req.query.category as string | undefined;
  const minAmount = req.query.minAmount ? Number(req.query.minAmount) : undefined;
  const maxAmount = req.query.maxAmount ? Number(req.query.maxAmount) : undefined;
  const search = req.query.search as string | undefined;

  const conditions = [];
  if (fraudOnly) conditions.push(eq(transactionsTable.isFraud, true));
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (minAmount !== undefined) conditions.push(gte(transactionsTable.amount, String(minAmount)));
  if (maxAmount !== undefined) conditions.push(lte(transactionsTable.amount, String(maxAmount)));
  if (search) {
    conditions.push(
      or(
        ilike(transactionsTable.merchantName, `%${search}%`),
        ilike(transactionsTable.userId, `%${search}%`),
        ilike(transactionsTable.transactionId, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(transactionsTable)
      .where(where)
      .orderBy(desc(transactionsTable.timestamp))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(transactionsTable).where(where),
  ]);

  res.json({
    transactions: rows.map((r) => ({
      id: r.id,
      transactionId: r.transactionId,
      userId: r.userId,
      merchantName: r.merchantName,
      category: r.category,
      amount: Number(r.amount),
      paymentApp: r.paymentApp,
      status: r.status,
      isFraud: r.isFraud,
      fraudType: r.fraudType,
      timestamp: r.timestamp.toISOString(),
      senderState: r.senderState,
    })),
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

router.get("/analytics/fraud-by-state", async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      state: transactionsTable.senderState,
      totalTransactions: count(),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
      totalAmount: sum(transactionsTable.amount),
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.senderState)
    .orderBy(desc(sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`)));

  res.json(
    rows.map((r) => ({
      state: r.state,
      totalTransactions: Number(r.totalTransactions),
      fraudCount: Number(r.fraudCount),
      fraudRate: Number(r.totalTransactions) > 0 ? (Number(r.fraudCount) / Number(r.totalTransactions)) * 100 : 0,
      totalAmount: Number(r.totalAmount),
    }))
  );
});

router.get("/analytics/monthly-trends", async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${transactionsTable.timestamp}), 'YYYY-MM')`,
      totalTransactions: count(),
      fraudTransactions: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
      totalAmount: sum(transactionsTable.amount),
      fraudAmount: sum(sql<number>`case when ${transactionsTable.isFraud} then ${transactionsTable.amount}::numeric else 0 end`),
    })
    .from(transactionsTable)
    .groupBy(sql`date_trunc('month', ${transactionsTable.timestamp})`)
    .orderBy(sql`date_trunc('month', ${transactionsTable.timestamp})`);

  res.json(
    rows.map((r) => ({
      month: r.month,
      totalTransactions: Number(r.totalTransactions),
      fraudTransactions: Number(r.fraudTransactions),
      totalAmount: Number(r.totalAmount),
      fraudAmount: Number(r.fraudAmount),
      fraudRate: Number(r.totalTransactions) > 0 ? (Number(r.fraudTransactions) / Number(r.totalTransactions)) * 100 : 0,
    }))
  );
});

router.get("/analytics/user-segments", async (req: Request, res: Response): Promise<void> => {
  const userStats = await db
    .select({
      userId: transactionsTable.userId,
      totalSpend: sum(transactionsTable.amount),
      txnCount: count(),
      fraudCount: sum(sql<number>`case when ${transactionsTable.isFraud} then 1 else 0 end`),
    })
    .from(transactionsTable)
    .groupBy(transactionsTable.userId);

  const segments: { [key: string]: { users: number; spend: number; txns: number; fraud: number } } = {
    "High Value": { users: 0, spend: 0, txns: 0, fraud: 0 },
    "Regular": { users: 0, spend: 0, txns: 0, fraud: 0 },
    "Occasional": { users: 0, spend: 0, txns: 0, fraud: 0 },
    "Low Activity": { users: 0, spend: 0, txns: 0, fraud: 0 },
  };

  for (const u of userStats) {
    const spend = Number(u.totalSpend);
    const txns = Number(u.txnCount);
    const fraud = Number(u.fraudCount);
    let seg: string;
    if (spend >= 50000) seg = "High Value";
    else if (spend >= 10000) seg = "Regular";
    else if (spend >= 2000) seg = "Occasional";
    else seg = "Low Activity";
    segments[seg].users++;
    segments[seg].spend += spend;
    segments[seg].txns += txns;
    segments[seg].fraud += fraud;
  }

  res.json(
    Object.entries(segments).map(([segment, data]) => ({
      segment,
      userCount: data.users,
      avgSpend: data.users > 0 ? data.spend / data.users : 0,
      avgTransactionCount: data.users > 0 ? data.txns / data.users : 0,
      fraudRate: data.txns > 0 ? (data.fraud / data.txns) * 100 : 0,
    }))
  );
});

export default router;
