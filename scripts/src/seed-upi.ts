import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";

const PAYMENT_APPS = ["PhonePe", "Google Pay", "Paytm", "Amazon Pay", "BHIM UPI"];
const APP_WEIGHTS = [0.45, 0.35, 0.12, 0.05, 0.03];

const CATEGORIES = [
  "Food & Dining", "Shopping", "Utilities", "Entertainment", "Travel",
  "Healthcare", "Education", "Fuel", "Groceries", "Recharge & Bills",
];

const MERCHANTS: { name: string; category: string }[] = [
  { name: "Swiggy", category: "Food & Dining" },
  { name: "Zomato", category: "Food & Dining" },
  { name: "McDonald's", category: "Food & Dining" },
  { name: "Starbucks India", category: "Food & Dining" },
  { name: "Amazon India", category: "Shopping" },
  { name: "Flipkart", category: "Shopping" },
  { name: "Myntra", category: "Shopping" },
  { name: "Nykaa", category: "Shopping" },
  { name: "Reliance Digital", category: "Shopping" },
  { name: "BSES Delhi", category: "Utilities" },
  { name: "Tata Power", category: "Utilities" },
  { name: "Jio Recharge", category: "Recharge & Bills" },
  { name: "Airtel", category: "Recharge & Bills" },
  { name: "BookMyShow", category: "Entertainment" },
  { name: "Netflix India", category: "Entertainment" },
  { name: "Hotstar", category: "Entertainment" },
  { name: "MakeMyTrip", category: "Travel" },
  { name: "Uber", category: "Travel" },
  { name: "Ola", category: "Travel" },
  { name: "IRCTC", category: "Travel" },
  { name: "Apollo Pharmacy", category: "Healthcare" },
  { name: "Practo", category: "Healthcare" },
  { name: "BYJU'S", category: "Education" },
  { name: "Unacademy", category: "Education" },
  { name: "HPCL Petrol", category: "Fuel" },
  { name: "Indian Oil", category: "Fuel" },
  { name: "BigBasket", category: "Groceries" },
  { name: "Grofers", category: "Groceries" },
  { name: "DMart", category: "Groceries" },
  { name: "Unknown Merchant 1", category: "Shopping" },
  { name: "Unknown Merchant 2", category: "Shopping" },
];

const FRAUD_TYPES = [
  "Phishing", "Account Takeover", "SIM Swap", "Unauthorized Transfer",
  "Merchant Fraud", "Velocity Attack", "Social Engineering",
];

const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana",
  "Gujarat", "Rajasthan", "Uttar Pradesh", "West Bengal", "Kerala",
  "Madhya Pradesh", "Punjab", "Haryana", "Bihar", "Odisha",
];

function weightedRandom<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return items[i];
  }
  return items[items.length - 1];
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function generateTransactionId(): string {
  return "TXN" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateUserId(index: number): string {
  return `USER${String(index).padStart(6, "0")}`;
}

function generateAmount(isFraud: boolean, category: string): number {
  if (isFraud) {
    // Fraud: either very high or unusual amounts
    const type = Math.random();
    if (type < 0.3) return Math.round(randomBetween(45000, 99999) * 100) / 100;
    if (type < 0.6) return Math.round(randomBetween(9999, 44999) * 100) / 100;
    return Math.round(randomBetween(1, 99) * 100) / 100; // micro-fraud
  }
  const ranges: Record<string, [number, number]> = {
    "Food & Dining": [50, 1500],
    "Shopping": [200, 15000],
    "Utilities": [500, 5000],
    "Entertainment": [100, 2000],
    "Travel": [300, 25000],
    "Healthcare": [200, 8000],
    "Education": [500, 50000],
    "Fuel": [300, 3000],
    "Groceries": [100, 5000],
    "Recharge & Bills": [50, 2000],
  };
  const [min, max] = ranges[category] || [50, 5000];
  return Math.round(randomBetween(min, max) * 100) / 100;
}

async function seed() {
  console.log("Seeding UPI transaction data...");

  const TOTAL_TRANSACTIONS = 25000;
  const FRAUD_RATE = 0.065; // 6.5% fraud rate
  const TOTAL_USERS = 3000;
  const START_DATE = new Date("2024-01-01");
  const END_DATE = new Date("2025-05-01");
  const DATE_RANGE_MS = END_DATE.getTime() - START_DATE.getTime();

  // Check if already seeded
  const existing = await db.select().from(transactionsTable).limit(1);
  if (existing.length > 0) {
    console.log("Data already exists, skipping seed.");
    process.exit(0);
  }

  const BATCH_SIZE = 500;
  let totalInserted = 0;

  for (let batch = 0; batch < Math.ceil(TOTAL_TRANSACTIONS / BATCH_SIZE); batch++) {
    const records = [];
    const batchSize = Math.min(BATCH_SIZE, TOTAL_TRANSACTIONS - totalInserted);

    for (let i = 0; i < batchSize; i++) {
      const isFraud = Math.random() < FRAUD_RATE;
      const merchant = MERCHANTS[randomInt(0, MERCHANTS.length - 1)];
      const paymentApp = weightedRandom(PAYMENT_APPS, APP_WEIGHTS);
      const amount = generateAmount(isFraud, merchant.category);
      const userId = generateUserId(randomInt(1, TOTAL_USERS));
      const state = STATES[randomInt(0, STATES.length - 1)];

      // Fraud more likely at night (10pm-4am)
      let hour: number;
      if (isFraud && Math.random() < 0.45) {
        hour = [22, 23, 0, 1, 2, 3][randomInt(0, 5)];
      } else {
        hour = randomInt(6, 23);
      }

      const baseDate = new Date(START_DATE.getTime() + Math.random() * DATE_RANGE_MS);
      baseDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));

      const status = isFraud && Math.random() < 0.3 ? "failed" : "success";

      records.push({
        transactionId: generateTransactionId() + i + batch,
        userId,
        merchantName: merchant.name,
        category: merchant.category,
        amount: String(amount),
        paymentApp,
        status,
        isFraud,
        fraudType: isFraud ? FRAUD_TYPES[randomInt(0, FRAUD_TYPES.length - 1)] : null,
        senderState: state,
        timestamp: baseDate,
      });
    }

    await db.insert(transactionsTable).values(records);
    totalInserted += batchSize;
    if (totalInserted % 2000 === 0 || totalInserted === TOTAL_TRANSACTIONS) {
      console.log(`Inserted ${totalInserted}/${TOTAL_TRANSACTIONS} transactions...`);
    }
  }

  console.log(`Done! Seeded ${totalInserted} transactions.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
