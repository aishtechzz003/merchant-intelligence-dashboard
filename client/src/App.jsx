import { useState } from "react";
import "./App.css";
import StatCard from "./components/StatCard";

const transactions = [
  {
    id: "TXN1001",
    amount: "₹850",
    method: "UPI",
    status: "Success",
    failureReason: null,
  },
  {
    id: "TXN1002",
    amount: "₹1,200",
    method: "Card",
    status: "Failed",
    failureReason: "Insufficient Balance",
  },
  {
  id: "TXN1002",
  amount: "₹1,200",
  method: "Card",
  status: "Failed",
  failureReason: "Network Error",
},
  {
    id: "TXN1003",
    amount: "₹650",
    method: "UPI",
    status: "Success",
    failureReason: null,
  },
  {
    id: "TXN1004",
    amount: "₹2,400",
    method: "Net Banking",
    status: "Pending",
    failureReason: null,
  },
  {
    id: "TXN1005",
    amount: "₹950",
    method: "UPI",
    status: "Success",
    failureReason: null,
  },
];

const revenueData = {
  "7 Days": [32000, 41000, 38000, 52000, 46000, 61000, 48250,  42000, 39000, ],
  "30 Days": [28000, 35000, 42000, 39000, 51000, 58000, 48250],
  "3 Months": [22000, 30000, 36000, 45000, 52000, 61000, 48250],
};

function App() {

  const [period, setPeriod] = useState("7 Days");
    const [statusFilter, setStatusFilter] = useState("All");
    const currentRevenue = revenueData[period];
    const chartPoints = currentRevenue
  .map((value, index) => {
    const x = 20 + index * 60;
    const maxRevenue = Math.max(...currentRevenue);
    const y = 180 - (value / maxRevenue) * 140;

    return `${x},${y}`;
  })
  .join(" ");
const [searchTerm, setSearchTerm] = useState("");
const getFailureCount = (reason) => {
  return transactions.filter(
    (transaction) => transaction.failureReason === reason
  ).length;
};

const totalFailures = transactions.filter(
  (transaction) => transaction.status === "Failed"
).length;
const filteredTransactions = transactions.filter((transaction) => {
  const matchesStatus =
    statusFilter === "All" ||
    transaction.status === statusFilter;

  const matchesSearch =
    transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.method.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesStatus && matchesSearch;
});
      
const networkErrorCount = transactions.filter(
  (transaction) => transaction.failureReason === "Network Error"
).length;

console.log("Network Errors:", networkErrorCount);
  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">M</div>

          <div>
            <h2>Merchant</h2>
            <span>INTELLIGENCE</span>
          </div>
        </div>

        <nav className="navigation">

          <p className="nav-title">MENU</p>

          <a className="nav-item active">
            <span>◉</span>
            Overview
          </a>

          <a className="nav-item">
            <span>◇</span>
            Payments
          </a>

          <a className="nav-item">
            <span>▥</span>
            Analytics
          </a>

          <a className="nav-item">
            <span>⚠</span>
            Failures
          </a>

          <p className="nav-title">TOOLS</p>

          <a className="nav-item ai-nav">
            <span>✦</span>
            AI Assistant
          </a>

          <a className="nav-item">
            <span>⚙</span>
            Settings
          </a>

        </nav>

        <div className="sidebar-bottom">
          <div className="merchant-profile">
            <div className="profile-avatar">A</div>

            <div>
              <strong>Merchant</strong>
              <small>Business Owner</small>
            </div>

            <span>⋮</span>
          </div>
        </div>

      </aside>

      {/* Main area */}
      <main className="main">

  <div className="page-header">
    <div>
      <h1>Good morning, Merchant 👋</h1>
      <p>Here's what's happening with your business today.</p>
    </div>

    <button className="date-button">
      Today ▾
    </button>
  </div>


    <section className="stats">

  <StatCard
    title="Today's Revenue"
    value="₹48,250"
    change="↗ 12.4%"
  />

  <StatCard
    title="Total Transactions"
    value="1,284"
    change="↗ 8.2%"
  />

  <StatCard
    title="Success Rate"
    value="94.2%"
    change="↗ 2.1%"
  />

  <StatCard
    title="Failed Transactions"
    value="74"
    change="↘ 3.4%"
    type="negative"
  />

</section>

  <section className="dashboard-section">

  <div className="section-header">
    <div>
      <h2>Revenue Overview</h2>
      <p>Revenue and transaction performance</p>
    </div>

    <div className="chart-tabs">

  <button
    className={period === "7 Days" ? "active-tab" : ""}
    onClick={() => setPeriod("7 Days")}
  >
    7 Days
  </button>

  <button
    className={period === "30 Days" ? "active-tab" : ""}
    onClick={() => setPeriod("30 Days")}
  >
    30 Days
  </button>

  <button
    className={period === "3 Months" ? "active-tab" : ""}
    onClick={() => setPeriod("3 Months")}
  >
    3 Months
  </button>

</div>
  </div>

  <div className="chart">

    <div className="chart-y-axis">
      <span>₹60K</span>
      <span>₹40K</span>
      <span>₹20K</span>
      <span>₹0</span>
    </div>

    <div className="chart-area">

      <div className="grid-line"></div>
      <div className="grid-line"></div>
      <div className="grid-line"></div>
      <div className="grid-line"></div>

      <svg
        className="revenue-line"
        viewBox="0 0 700 220"
        preserveAspectRatio="none"
      >
        <polyline
  points={chartPoints}
            fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>

    </div>

    <div className="chart-x-axis">
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
      <span>Sun</span>
    </div>

  </div>

</section>
<section className="insights-grid">

  {/* Payment Failure Insights */}
  <div className="dashboard-section failure-section">

    <div className="section-header">
      <div>
        <h2>Payment Failure Insights</h2>
        <p>Why are transactions failing?</p>
      </div>

<span className="failure-badge">
  {totalFailures} {totalFailures === 1 ? "failure" : "failures"}
</span>
    </div>

    <div className="failure-items">

      <div className="failure-item">
        <div>
          <strong>Insufficient Balance</strong>
          <small>Customers didn't have enough funds</small>
        </div>

<strong>{getFailureCount("Insufficient Balance")}</strong>      </div>

      <div className="failure-item">
        <div>
          <strong>Network Error</strong>
        </div>

  <strong>{networkErrorCount}</strong>
      </div>

      <div className="failure-item">
        <div>
          <strong>Bank Server</strong>
          <small>Bank service temporarily unavailable</small>
        </div>

        <span>15</span>
      </div>

      <div className="failure-item">
        <div>
          <strong>Other</strong>
          <small>Other payment failures</small>
        </div>

        <span>8</span>
      </div>

    </div>

  </div>


  {/* AI Insight */}
  <div className="dashboard-section ai-insight-section">

    <div className="ai-heading">
      <div className="ai-icon">✦</div>

      <div>
        <h2>AI Business Insight</h2>
        <p>Generated from your transaction data</p>
      </div>
    </div>

    <div className="ai-message">
      <span>✦</span>

      <p>
        Network-related failures increased by
        <strong> 35%</strong> compared with yesterday.
      </p>
    </div>

    <button className="ai-button">
      Ask AI Assistant →
    </button>

  </div>

</section>

<section className="dashboard-section transactions-section">

  <div className="section-header">
    <div>
      <h2>Recent Transactions</h2>
      <p>Your latest payment activity</p>
    </div>

    <button className="view-all">
      View all →
    </button>
  </div>
<div className="space"></div>
<div className="transaction-filters">
 <button
  className={statusFilter === "All" ? "active" : ""}
  onClick={() => setStatusFilter("All")}
>
  All
</button>

<button
  className={statusFilter === "Success" ? "active" : ""}
  onClick={() => setStatusFilter("Success")}
>
  Success
</button>

<button
  className={statusFilter === "Failed" ? "active" : ""}
  onClick={() => setStatusFilter("Failed")}
>
  Failed
</button>

<button
  className={statusFilter === "Pending" ? "active" : ""}
  onClick={() => setStatusFilter("Pending")}
>
  Pending
</button>
  </div>

  <div className="table-container">
<div className="transaction-search">
  <input
    type="text"
    placeholder="Search transaction or payment method..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
</div>
    <table className="transactions-table">
<thead>
  <tr>
    <th>Transaction ID</th>
<th>Amount</th>
<th>Method</th>
<th>Status</th>
<th>Failure Reason</th>
  </tr>
</thead>
      {filteredTransactions.map((transaction) => (
  <tr key={transaction.id}>
    <td className="transaction-id">{transaction.id}</td>
    <td>{transaction.amount}</td>
    <td>{transaction.method}</td>
    <td>
      <span className={`status ${transaction.status.toLowerCase()}`}>
        {transaction.status}
      </span>
    </td>
    <td>
  {transaction.failureReason || "—"}
</td>
  </tr>
))}
    </table>

  </div>

</section>

</main>

    </div>
  );
}

export default App;