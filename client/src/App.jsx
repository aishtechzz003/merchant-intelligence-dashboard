import { useEffect, useMemo, useState } from "react";
import "./App.css";
import StatCard from "./components/StatCard";

function App() {
  const [activePage, setActivePage] = useState("Overview");

  // Overview
  const [dashboardPeriod, setDashboardPeriod] = useState("Today");
  const [period, setPeriod] = useState("7 Days");
  const [revenue, setRevenue] = useState([]);
  const [aiInput, setAiInput] = useState("");

const [aiMessages, setAiMessages] = useState([
  {
    role: "assistant",
    content:
      "Hi! I'm your Merchant Intelligence Assistant. Ask me about transactions, revenue, failed payments, or business performance."
  }
]);
const handleAiSubmit = async () => {
  if (!aiInput.trim()) return;

  const question = aiInput;

  // Show user's message
  setAiMessages((prev) => [
    ...prev,
    {
      role: "user",
      content: question
    }
  ]);

  // Clear input
  setAiInput("");

  try {
    const response = await fetch(
      `http://localhost:5000/api/ai?question=${encodeURIComponent(question)}`
    );

    const data = await response.json();

    setAiMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data.answer
      }
    ]);
  } catch (error) {
    setAiMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Sorry, I couldn't connect to the AI server."
      }
    ]);
  }
};
  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Analytics
  const [analyticsPeriod, setAnalyticsPeriod] = useState("7 Days");

  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    totalRevenue: 0,
    successRate: 0,
    networkErrors: 0,
    insufficientBalance: 0,
    bankServer: 0,
    otherFailures: 0,
  });

  // =========================================================
  // FETCH ALL TRANSACTIONS
  // =========================================================

  useEffect(() => {
    fetch("http://localhost:5000/api/transactions")
      .then((response) => response.json())
      .then((data) => {
        const formattedTransactions = data.map((transaction) => ({
          id: transaction.transactionId,
          amount: Number(transaction.amount),
          method: transaction.paymentMethod,
          status: transaction.status,
          failureReason: transaction.failureReason,
          customerName: transaction.customerName,
          timestamp: transaction.timestamp,
        }));

        setTransactions(formattedTransactions);
      })
      .catch((error) => {
        console.error("Failed to fetch transactions:", error);
      });
  }, []);

  // =========================================================
  // FETCH OVERVIEW ANALYTICS
  // =========================================================

  useEffect(() => {
    fetch(
      `http://localhost:5000/api/analytics?period=${encodeURIComponent(
        dashboardPeriod
      )}`
    )
      .then((response) => response.json())
      .then((data) => {
        setAnalytics(data);
      })
      .catch((error) => {
        console.error("Failed to fetch analytics:", error);
      });
  }, [dashboardPeriod]);

  // =========================================================
  // FETCH REVENUE
  // =========================================================

  useEffect(() => {
    fetch(
      `http://localhost:5000/api/revenue?period=${encodeURIComponent(period)}`
    )
      .then((response) => response.json())
      .then((data) => {
        setRevenue(data);
      })
      .catch((error) => {
        console.error("Failed to fetch revenue:", error);
      });
  }, [period]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    return new Date(timestamp).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPeriodStart = (selectedPeriod) => {
    const now = new Date();

    if (selectedPeriod === "Today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (selectedPeriod === "Yesterday") {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (selectedPeriod === "30 Days") {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (selectedPeriod === "3 Months") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 2);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    // Default = 7 days
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return start;
  };

  // =========================================================
  // ANALYTICS PAGE DATA
  // =========================================================

  const analyticsTransactions = useMemo(() => {
    const startDate = getPeriodStart(analyticsPeriod);
    const now = new Date();

    return transactions.filter((transaction) => {
      if (!transaction.timestamp) return true;

      const transactionDate = new Date(transaction.timestamp);

      return transactionDate >= startDate && transactionDate <= now;
    });
  }, [transactions, analyticsPeriod]);

  const analyticsStats = useMemo(() => {
    const total = analyticsTransactions.length;

    const success = analyticsTransactions.filter(
      (transaction) => transaction.status === "Success"
    ).length;

    const failed = analyticsTransactions.filter(
      (transaction) => transaction.status === "Failed"
    ).length;

    const pending = analyticsTransactions.filter(
      (transaction) => transaction.status === "Pending"
    ).length;

    const revenueTotal = analyticsTransactions
      .filter((transaction) => transaction.status === "Success")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const successRate = total === 0 ? 0 : (success / total) * 100;

    return {
      total,
      success,
      failed,
      pending,
      revenue: revenueTotal,
      successRate: Number(successRate.toFixed(1)),
    };
  }, [analyticsTransactions]);

  // =========================================================
  // PAYMENT METHOD ANALYSIS
  // =========================================================

  const paymentMethodStats = useMemo(() => {
    const methods = {};

    analyticsTransactions.forEach((transaction) => {
      const method = transaction.method || "Unknown";

      if (!methods[method]) {
        methods[method] = {
          count: 0,
          revenue: 0,
        };
      }

      methods[method].count += 1;

      if (transaction.status === "Success") {
        methods[method].revenue += transaction.amount;
      }
    });

    return Object.entries(methods)
      .map(([method, data]) => ({
        method,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count);
  }, [analyticsTransactions]);

  // =========================================================
  // FAILURE ANALYSIS
  // =========================================================

  const failureStats = useMemo(() => {
    const failures = {};

    analyticsTransactions
      .filter((transaction) => transaction.status === "Failed")
      .forEach((transaction) => {
        const reason = transaction.failureReason || "Other";

        failures[reason] = (failures[reason] || 0) + 1;
      });

    return Object.entries(failures)
      .map(([reason, count]) => ({
        reason,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [analyticsTransactions]);

  // =========================================================
  // TRANSACTION STATUS ANALYSIS
  // =========================================================

  const statusStats = [
    {
      label: "Success",
      count: analyticsStats.success,
      className: "success",
    },
    {
      label: "Failed",
      count: analyticsStats.failed,
      className: "failed",
    },
    {
      label: "Pending",
      count: analyticsStats.pending,
      className: "pending",
    },
  ];

  // =========================================================
  // ANALYTICS REVENUE CHART
  // =========================================================

  const analyticsRevenueChart = useMemo(() => {
    const grouped = {};

    analyticsTransactions
      .filter((transaction) => transaction.status === "Success")
      .forEach((transaction) => {
        const date = new Date(transaction.timestamp);

        const key = date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });

        grouped[key] = (grouped[key] || 0) + transaction.amount;
      });

    return Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount,
    }));
  }, [analyticsTransactions]);

  const analyticsMaxRevenue =
    analyticsRevenueChart.length > 0
      ? Math.max(...analyticsRevenueChart.map((item) => item.amount), 1)
      : 1;

  // =========================================================
  // TRANSACTION FILTERING
  // =========================================================

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesStatus =
      statusFilter === "All" || transaction.status === statusFilter;

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      transaction.id.toLowerCase().includes(search) ||
      transaction.method.toLowerCase().includes(search) ||
      (transaction.customerName || "").toLowerCase().includes(search) ||
      (transaction.failureReason || "").toLowerCase().includes(search);

    return matchesStatus && matchesSearch;
  });

  const totalFailures = analytics.failedTransactions;

  // =========================================================
  // CHART POINTS
  // =========================================================

  const chartPoints =
    revenue.length > 1
      ? revenue
          .map((item, index) => {
            const x = (index / (revenue.length - 1)) * 700;

            const maxRevenue = Math.max(
              ...revenue.map((item) => Number(item.revenue) || 0),
              1
            );

            const y = 200 - (item.revenue / maxRevenue) * 180;

            return `${x},${y}`;
          })
          .join(" ")
      : "";

  // =========================================================
  // SIDEBAR
  // =========================================================

  const Sidebar = () => (
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

        <button
          className={`nav-item ${
            activePage === "Overview" ? "active" : ""
          }`}
          onClick={() => setActivePage("Overview")}
        >
          <span>◉</span>
          Overview
        </button>

        <button
          className={`nav-item ${
            activePage === "Payments" ? "active" : ""
          }`}
          onClick={() => setActivePage("Payments")}
        >
          <span>◇</span>
          Payments
        </button>

        <button
          className={`nav-item ${
            activePage === "Analytics" ? "active" : ""
          }`}
          onClick={() => setActivePage("Analytics")}
        >
          <span>▥</span>
          Analytics
        </button>

        <button
          className={`nav-item ${
            activePage === "Failures" ? "active" : ""
          }`}
          onClick={() => setActivePage("Failures")}
        >
          <span>⚠</span>
          Failures
        </button>

        <p className="nav-title">TOOLS</p>

        <button
          className={`nav-item ai-nav ${
            activePage === "AI Assistant" ? "active" : ""
          }`}
          onClick={() => setActivePage("AI Assistant")}
        >
          <span>✦</span>
          AI Assistant
        </button>

        <button
          className={`nav-item ${
            activePage === "Settings" ? "active" : ""
          }`}
          onClick={() => setActivePage("Settings")}
        >
          <span>⚙</span>
          Settings
        </button>
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
  );

  // =========================================================
  // PAYMENTS PAGE
  // =========================================================

  const PaymentsPage = () => (
    <section className="dashboard-section payments-page">
      <div className="section-header">
        <div>
          <h1>Payments</h1>
          <p>View and manage all your transactions</p>
        </div>
      </div>

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

      <div className="transaction-search">
        <input
          type="text"
          placeholder="Search transaction, customer, method..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="transaction-count">
        Showing <strong>{filteredTransactions.length}</strong> transactions
      </div>

      <div className="transaction-table-wrapper">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Failure Reason</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="transaction-id">{transaction.id}</td>

                <td className="customer-name">
                  {transaction.customerName || "—"}
                </td>

                <td className="amount">
                  {formatCurrency(transaction.amount)}
                </td>

                <td>{transaction.method}</td>

                <td>
                  <span
                    className={`status ${transaction.status.toLowerCase()}`}
                  >
                    {transaction.status}
                  </span>
                </td>

                <td className="failure-reason">
                  {transaction.failureReason || "—"}
                </td>

                <td>{formatDate(transaction.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="empty-state">
            <h3>No transactions found</h3>
            <p>Try changing your filters or search term.</p>
          </div>
        )}
      </div>
    </section>
  );

  // =========================================================
  // ANALYTICS PAGE
  // =========================================================

  const AnalyticsPage = () => (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Understand your business performance and payment trends.</p>
        </div>

        <select
          className="date-button"
          value={analyticsPeriod}
          onChange={(e) => setAnalyticsPeriod(e.target.value)}
        >
          <option value="7 Days">Last 7 Days</option>
          <option value="30 Days">Last 30 Days</option>
          <option value="3 Months">Last 3 Months</option>
        </select>
      </div>

      {/* Analytics KPI cards */}

      <section className="analytics-stats">
        <div className="analytics-card">
          <span className="analytics-label">TOTAL REVENUE</span>
          <strong>{formatCurrency(analyticsStats.revenue)}</strong>
          <small>Successful payments</small>
        </div>

        <div className="analytics-card">
          <span className="analytics-label">TRANSACTIONS</span>
          <strong>{analyticsStats.total}</strong>
          <small>Total payment activity</small>
        </div>

        <div className="analytics-card">
          <span className="analytics-label">SUCCESS RATE</span>
          <strong>{analyticsStats.successRate}%</strong>
          <small>
            {analyticsStats.success} successful transactions
          </small>
        </div>

        <div className="analytics-card danger-card">
          <span className="analytics-label">FAILED</span>
          <strong>{analyticsStats.failed}</strong>
          <small>Transactions requiring attention</small>
        </div>
      </section>

      {/* Revenue trend */}

      <section className="dashboard-section analytics-chart-section">
        <div className="section-header">
          <div>
            <h2>Revenue Trend</h2>
            <p>Successful transaction revenue over the selected period</p>
          </div>
        </div>

        <div className="analytics-line-chart">
          {analyticsRevenueChart.length > 0 ? (
            <>
              <div className="analytics-y-axis">
                <span>
                  {formatCurrency(analyticsMaxRevenue)}
                </span>
                <span>
                  {formatCurrency(analyticsMaxRevenue / 2)}
                </span>
                <span>₹0</span>
              </div>

              <div className="analytics-chart-area">
                <div className="analytics-grid-line"></div>
                <div className="analytics-grid-line"></div>
                <div className="analytics-grid-line"></div>

                <svg
                  viewBox="0 0 700 220"
                  preserveAspectRatio="none"
                  className="analytics-svg"
                >
                  <polyline
                    points={analyticsRevenueChart
                      .map((item, index) => {
                        const x =
                          analyticsRevenueChart.length === 1
                            ? 350
                            : (index /
                                (analyticsRevenueChart.length - 1)) *
                              700;

                        const y =
                          200 -
                          (item.amount / analyticsMaxRevenue) *
                            180;

                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>

                <div className="analytics-x-axis">
                  {analyticsRevenueChart
                    .slice(0, 8)
                    .map((item) => (
                      <span key={item.date}>{item.date}</span>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>No revenue data</h3>
              <p>No successful transactions exist for this period.</p>
            </div>
          )}
        </div>
      </section>

      {/* Two-column analytics */}

      <section className="analytics-two-column">
        {/* Payment methods */}

        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Payment Methods</h2>
              <p>Transaction distribution by payment channel</p>
            </div>
          </div>

          <div className="analytics-list">
            {paymentMethodStats.length > 0 ? (
              paymentMethodStats.map((item) => {
                const percentage =
                  analyticsStats.total === 0
                    ? 0
                    : (item.count / analyticsStats.total) * 100;

                return (
                  <div
                    className="analytics-list-item"
                    key={item.method}
                  >
                    <div className="analytics-list-top">
                      <span>{item.method}</span>
                      <strong>{item.count}</strong>
                    </div>

                    <div className="analytics-progress">
                      <div
                        className="analytics-progress-fill"
                        style={{
                          width: `${percentage}%`,
                        }}
                      ></div>
                    </div>

                    <small>
                      {formatCurrency(item.revenue)} revenue
                    </small>
                  </div>
                );
              })
            ) : (
              <p className="analytics-empty">
                No payment method data available.
              </p>
            )}
          </div>
        </div>

        {/* Status */}

        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Transaction Status</h2>
              <p>Current payment outcome distribution</p>
            </div>
          </div>

          <div className="status-analysis">
            {statusStats.map((item) => {
              const percentage =
                analyticsStats.total === 0
                  ? 0
                  : (item.count / analyticsStats.total) * 100;

              return (
                <div
                  className="status-analysis-item"
                  key={item.label}
                >
                  <div>
                    <span
                      className={`status ${item.className}`}
                    >
                      {item.label}
                    </span>

                    <strong>{item.count}</strong>
                  </div>

                  <div className="status-percentage">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Failure analysis */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Failure Analysis</h2>
            <p>Understand why payment attempts are failing.</p>
          </div>

          <span className="failure-badge">
            {analyticsStats.failed} failures
          </span>
        </div>

        <div className="failure-analysis-grid">
          {failureStats.length > 0 ? (
            failureStats.map((item) => {
              const percentage =
                analyticsStats.failed === 0
                  ? 0
                  : (item.count / analyticsStats.failed) * 100;

              return (
                <div
                  className="failure-analysis-item"
                  key={item.reason}
                >
                  <div className="failure-analysis-header">
                    <div>
                      <strong>{item.reason}</strong>
                      <small>
                        {percentage.toFixed(1)}% of failed payments
                      </small>
                    </div>

                    <span>{item.count}</span>
                  </div>

                  <div className="analytics-progress">
                    <div
                      className="failure-progress-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <h3>No payment failures 🎉</h3>
              <p>
                There are no failed transactions in this period.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Business insight */}

      <section className="dashboard-section business-insight">
        <div className="ai-heading">
          <div className="ai-icon">✦</div>

          <div>
            <h2>Business Insight</h2>
            <p>Automatically generated from transaction data</p>
          </div>
        </div>

        <div className="business-insight-message">
          {analyticsStats.failed > 0 ? (
            <>
              <strong>
                {analyticsStats.failed} payment
                {analyticsStats.failed === 1 ? "" : "s"} failed
              </strong>{" "}
              during this period.{" "}
              {failureStats.length > 0 && (
                <>
                  The most common failure reason is{" "}
                  <strong>{failureStats[0].reason}</strong>.
                </>
              )}
            </>
          ) : (
            <>
              No payment failures were recorded during this
              period. Your payment flow is currently operating
              without recorded failures.
            </>
          )}
        </div>
      </section>
    </div>
  );

  // =========================================================
  // FAILURES PAGE
  // =========================================================

  const FailuresPage = () => {
    const failedTransactions = transactions.filter(
      (transaction) => transaction.status === "Failed"
    );

    return (
      <section className="dashboard-section payments-page">
        <div className="section-header">
          <div>
            <h1>Payment Failures</h1>
            <p>Review failed transactions and their reasons.</p>
          </div>

          <span className="failure-badge">
            {failedTransactions.length} failures
          </span>
        </div>

        <div className="transaction-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Failure Reason</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {failedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="transaction-id">
                    {transaction.id}
                  </td>

                  <td>{transaction.customerName || "—"}</td>

                  <td className="amount">
                    {formatCurrency(transaction.amount)}
                  </td>

                  <td>{transaction.method}</td>

                  <td className="failure-reason">
                    {transaction.failureReason || "Other"}
                  </td>

                  <td>{formatDate(transaction.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {failedTransactions.length === 0 && (
            <div className="empty-state">
              <h3>No failures found</h3>
              <p>There are no failed transactions.</p>
            </div>
          )}
        </div>
      </section>
    );
  };

  // =========================================================
  // PLACEHOLDER PAGES
  // =========================================================

  const PlaceholderPage = ({ title, description }) => (
    <section className="dashboard-section placeholder-page">
      <div className="placeholder-icon">✦</div>

      <h1>{title}</h1>

      <p>{description}</p>

      <span>Coming next...</span>
    </section>
  );

  // =========================================================
  // OVERVIEW PAGE
  // =========================================================

  const OverviewPage = () => (
    <>
      <div className="page-header">
        <div>
          <h1>Good morning, Merchant 👋</h1>
          <p>Here's what's happening with your business today.</p>
        </div>

        <select
          className="date-button"
          value={dashboardPeriod}
          onChange={(e) => setDashboardPeriod(e.target.value)}
        >
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="7 Days">Last 7 Days</option>
        </select>
      </div>

      {/* Statistics */}

      <section className="stats">
        <StatCard
          title={
            dashboardPeriod === "Today"
              ? "Today's Revenue"
              : dashboardPeriod === "Yesterday"
              ? "Yesterday's Revenue"
              : "Last 7 Days Revenue"
          }
          value={formatCurrency(analytics.totalRevenue)}
          change="↗ 12.4%"
        />

        <StatCard
          title="Total Transactions"
          value={analytics.totalTransactions}
          change="↗ 8.2%"
        />

        <StatCard
          title="Success Rate"
          value={`${analytics.successRate}%`}
          change="↗ 2.1%"
        />

        <StatCard
          title="Failed Transactions"
          value={analytics.failedTransactions}
          change="↘ 3.4%"
          type="negative"
        />
      </section>

      {/* Revenue */}

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

      {/* Insights */}

      <section className="insights-grid">
        <div className="dashboard-section failure-section">
          <div className="section-header">
            <div>
              <h2>Payment Failure Insights</h2>
              <p>Why are transactions failing?</p>
            </div>

            <span className="failure-badge">
              {totalFailures}{" "}
              {totalFailures === 1 ? "failure" : "failures"}
            </span>
          </div>

          <div className="failure-items">
            <div className="failure-item">
              <div>
                <strong>Insufficient Balance</strong>
                <small>
                  Customers didn't have enough funds
                </small>
              </div>

              <strong>{analytics.insufficientBalance}</strong>
            </div>

            <div className="failure-item">
              <div>
                <strong>Network Error</strong>
                <small>Payment network connection issue</small>
              </div>

              <strong>{analytics.networkErrors}</strong>
            </div>

            <div className="failure-item">
              <div>
                <strong>Bank Server</strong>
                <small>
                  Bank service temporarily unavailable
                </small>
              </div>

              <span>{analytics.bankServer}</span>
            </div>

            <div className="failure-item">
              <div>
                <strong>Other</strong>
                <small>Other payment failures</small>
              </div>

              <span>{analytics.otherFailures}</span>
            </div>
          </div>
        </div>

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
              {analytics.failedTransactions > 0 ? (
                <>
                  There are currently{" "}
                  <strong>
                    {analytics.failedTransactions} failed
                  </strong>{" "}
                  transactions. The Analytics page can help
                  identify the main failure patterns.
                </>
              ) : (
                <>
                  No failed transactions were recorded for the
                  selected period.
                </>
              )}
            </p>
          </div>

          <button
            className="ai-button"
            onClick={() => setActivePage("AI Assistant")}
          >
            Ask AI Assistant →
          </button>
        </div>
      </section>

      {/* Recent transactions */}

      <section className="dashboard-section transactions-section">
        <div className="section-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>Your latest payment activity</p>
          </div>

          <button
            className="view-all"
            onClick={() => setActivePage("Payments")}
          >
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

            <tbody>
              {filteredTransactions.slice(0, 5).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="transaction-id">
                    {transaction.id}
                  </td>

                  <td>{formatCurrency(transaction.amount)}</td>

                  <td>{transaction.method}</td>

                  <td>
                    <span
                      className={`status ${transaction.status.toLowerCase()}`}
                    >
                      {transaction.status}
                    </span>
                  </td>

                  <td>
                    {transaction.failureReason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  // =========================================================
  // PAGE ROUTER
  // =========================================================

  const renderPage = () => {
    if (activePage === "Overview") {
      return <OverviewPage />;
    }

    if (activePage === "Payments") {
      return <PaymentsPage />;
    }

    if (activePage === "Analytics") {
      return <AnalyticsPage />;
    }

    if (activePage === "Failures") {
      return <FailuresPage />;
    }
if (activePage === "AI Assistant") {
  return (
    <section className="assistant-page">

      <div className="assistant-header">
        <div>
          <h1>AI Assistant</h1>
          <p>
            Your intelligent merchant business assistant
          </p>
        </div>
      </div>

      <div className="assistant-container">

        <div className="assistant-chat">

          {/* Chat Header */}
          <div className="assistant-chat-header">

            <div className="assistant-avatar">
              ✦
            </div>

            <div>
              <h3>Merchant Intelligence</h3>
              <span>AI Assistant</span>
            </div>

          </div>


          {/* Messages */}
          <div className="assistant-messages">

            {aiMessages.map((message, index) => (
              <div
                key={index}
                className={`assistant-message-row ${message.role}`}
              >

                <div className="assistant-message">
                  {message.content}
                </div>

              </div>
            ))}

          </div>


          {/* Suggested Questions */}
          <div className="assistant-suggestions">

            <button
              onClick={() =>
                setAiInput("How many payments failed?")
              }
            >
              How many payments failed?
            </button>

            <button
              onClick={() =>
                setAiInput("What is my revenue?")
              }
            >
              What is my revenue?
            </button>

            <button
              onClick={() =>
                setAiInput("Why are payments failing?")
              }
            >
              Why are payments failing?
            </button>

            <button
              onClick={() =>
                setAiInput("Give me business recommendations")
              }
            >
              Give me recommendations
            </button>

          </div>


          {/* Input */}
          <div className="assistant-input-area">

            <input
              type="text"
              placeholder="Ask about your business..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
            />

            <button onClick={handleAiSubmit}>
  ➤
</button>

          </div>

        </div>

      </div>

    </section>
  );
}

    if (activePage === "Settings") {
      return (
        <PlaceholderPage
          title="Settings"
          description="Merchant account and dashboard settings will appear here."
        />
      );
    }

    return <OverviewPage />;
  };

  return (
    <div className="app">
      <Sidebar />

      <main className="main">{renderPage()}</main>
    </div>
  );
}

export default App;