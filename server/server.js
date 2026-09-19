require("dotenv").config();

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const retrieveKnowledge = require("./rag/retrieve");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Transaction = require("./models/Transaction");

const app = express();
const PORT = 5000;




// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully ✅");
  })
  .catch((error) => {
    console.error("MongoDB connection failed ❌");
    console.error(error.message);
  });

// Home route
app.get("/", (req, res) => {
  res.send("Merchant Intelligence Backend is running 🚀");
});

// GET all transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find();

    res.json(transactions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
});

// GET dashboard analytics
app.get("/api/analytics", async (req, res) => {
  try {
    const { period = "Today" } = req.query;

    const now = new Date();

    let startDate;
    let endDate;

    if (period === "Today") {
      // Start of today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);

      // End of today
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    else if (period === "Yesterday") {
      // Start of yesterday
      endDate = new Date(now);
      endDate.setHours(0, 0, 0, 0);

      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);
    }

    else if (period === "7 Days") {
      // Last 7 calendar days including today
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);

      endDate = now;
    }

    else {
      startDate = new Date(0);
      endDate = now;
    }

    // Get only transactions inside the selected period
    const transactions = await Transaction.find({
      timestamp: {
        $gte: startDate,
        $lt: endDate
      }
    });

    const totalTransactions = transactions.length;

    const successfulTransactions = transactions.filter(
      (transaction) => transaction.status === "Success"
    ).length;

    const failedTransactions = transactions.filter(
      (transaction) => transaction.status === "Failed"
    ).length;

    const pendingTransactions = transactions.filter(
      (transaction) => transaction.status === "Pending"
    ).length;

    const networkErrors = transactions.filter(
  (transaction) => transaction.failureReason === "Network Error"
).length;

const insufficientBalance = transactions.filter(
  (transaction) => transaction.failureReason === "Insufficient Balance"
).length;

const bankServer = transactions.filter(
  (transaction) => transaction.failureReason === "Bank Server"
).length;

const otherFailures = transactions.filter(
  (transaction) =>
    transaction.status === "Failed" &&
    ![
      "Network Error",
      "Insufficient Balance",
      "Bank Server"
    ].includes(transaction.failureReason)
).length;


    const totalRevenue = transactions
      .filter((transaction) => transaction.status === "Success")
      .reduce(
        (total, transaction) => total + transaction.amount,
        0
      );

    const successRate =
      totalTransactions === 0
        ? 0
        : (successfulTransactions / totalTransactions) * 100;

res.json({
  period,
  totalTransactions,
  successfulTransactions,
  failedTransactions,
  pendingTransactions,
  totalRevenue,
  successRate: Number(successRate.toFixed(2)),
  networkErrors,
  insufficientBalance,
  bankServer,
  otherFailures
});
  } catch (error) {
    res.status(500).json({
      message: "Failed to calculate analytics",
      error: error.message
    });
  }
});

app.get("/api/ai", async (req, res) => {
  try {
    const { question } = req.query;

    if (!question) {
      return res.status(400).json({
        answer: "Please ask me a question."
      });
    }

    // 1. Get transaction data
    const transactions = await Transaction.find();

    const failedTransactions = transactions.filter(
      (transaction) => transaction.status === "Failed"
    );

    const successfulTransactions = transactions.filter(
      (transaction) => transaction.status === "Success"
    );

    const pendingTransactions = transactions.filter(
      (transaction) => transaction.status === "Pending"
    );

    const totalRevenue = successfulTransactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

    // 2. Retrieve relevant knowledge
    const knowledge = retrieveKnowledge(question);
       const context = `
TRANSACTION DATA
Total successful payments: ${successfulTransactions.length}
Total failed payments: ${failedTransactions.length}
Total pending payments: ${pendingTransactions.length}
Total revenue: ₹${totalRevenue}

RETRIEVED KNOWLEDGE
${knowledge || "No relevant knowledge was found."}
`;
    // 3. Decide what kind of question it is
    const lowerQuestion = question.toLowerCase();


    const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `
You are a Merchant Intelligence Assistant.

Answer the merchant's question using ONLY the provided transaction
data and retrieved knowledge.

Rules:
- Do not invent transaction numbers.
- Do not invent revenue.
- If the information is unavailable, say so.
- Give practical and concise business advice when appropriate.
- Explain payment failures in simple language.
      `
    },
    {
      role: "user",
      content: `
Merchant question:
${question}

Context:
${context}
      `
    }
  ]
});

const answer = completion.choices[0].message.content;

  } catch (error) {
    console.error(error);

    res.status(500).json({
      answer: "Something went wrong while analyzing your question."
    });
  }
});

// GET revenue by day
app.get("/api/revenue", async (req, res) => {
  try {
    const { period = "7 Days" } = req.query;

    const transactions = await Transaction.find();

    const now = new Date();

    let startDate = new Date();

    if (period === "7 Days") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "30 Days") {
      startDate.setDate(now.getDate() - 30);
    } else if (period === "3 Months") {
      startDate.setMonth(now.getMonth() - 3);
    }

    const revenueByDate = {};

    transactions.forEach((transaction) => {
      // Only successful transactions count as revenue
      if (transaction.status !== "Success") {
        return;
      }

      const transactionDate = new Date(transaction.timestamp);

      // Ignore transactions outside the selected period
      if (transactionDate < startDate) {
        return;
      }

      const date = transactionDate.toISOString().split("T")[0];

      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }

      revenueByDate[date] += transaction.amount;
    });

    const revenue = Object.entries(revenueByDate).map(
      ([date, amount]) => ({
        date,
        revenue: amount
      })
    );

    res.json(revenue);
  } catch (error) {
    res.status(500).json({
      message: "Failed to calculate revenue",
      error: error.message
    });
  }
});

// POST a new transaction
app.post("/api/transactions", async (req, res) => {
  try {
    const transaction = new Transaction(req.body);

    const savedTransaction = await transaction.save();

    res.status(201).json(savedTransaction);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create transaction",
      error: error.message
    });
  }
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

