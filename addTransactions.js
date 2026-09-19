const transactions = [
  {
    transactionId: "TXN1004",
    merchantId: "M001",
    amount: 2500,
    paymentMethod: "UPI",
    status: "Success",
    failureReason: null,
    customerName: "Customer 04",
    timestamp: "2026-09-05T12:30:00"
  },
  {
    transactionId: "TXN1005",
    merchantId: "M001",
    amount: 1800,
    paymentMethod: "Card",
    status: "Success",
    failureReason: null,
    customerName: "Customer 05",
    timestamp: "2026-08-20T14:00:00"
  },
  {
    transactionId: "TXN1006",
    merchantId: "M001",
    amount: 3200,
    paymentMethod: "UPI",
    status: "Success",
    failureReason: null,
    customerName: "Customer 06",
    timestamp: "2026-08-05T16:30:00"
  },
  {
    transactionId: "TXN1007",
    merchantId: "M001",
    amount: 4500,
    paymentMethod: "Card",
    status: "Success",
    failureReason: null,
    customerName: "Customer 07",
    timestamp: "2026-07-15T11:00:00"
  },
  {
    transactionId: "TXN1008",
    merchantId: "M001",
    amount: 2100,
    paymentMethod: "UPI",
    status: "Success",
    failureReason: null,
    customerName: "Customer 08",
    timestamp: "2026-07-25T13:15:00"
  },
  {
    transactionId: "TXN1009",
    merchantId: "M001",
    amount: 900,
    paymentMethod: "UPI",
    status: "Failed",
    failureReason: "Network Error",
    customerName: "Customer 09",
    timestamp: "2026-09-04T10:30:00"
  },
  {
    transactionId: "TXN1010",
    merchantId: "M001",
    amount: 1500,
    paymentMethod: "Card",
    status: "Failed",
    failureReason: "Bank Declined",
    customerName: "Customer 10",
    timestamp: "2026-08-15T15:30:00"
  },
  {
    transactionId: "TXN1011",
    merchantId: "M001",
    amount: 2750,
    paymentMethod: "UPI",
    status: "Success",
    failureReason: null,
    customerName: "Customer 11",
    timestamp: "2026-09-10T12:00:00"
  },
  {
    transactionId: "TXN1012",
    merchantId: "M001",
    amount: 1100,
    paymentMethod: "Card",
    status: "Pending",
    failureReason: null,
    customerName: "Customer 12",
    timestamp: "2026-09-12T17:00:00"
  }
];

async function addTransactions() {
  for (const transaction of transactions) {
    try {
      const response = await fetch(
        "http://localhost:5000/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(transaction)
        }
      );

      const data = await response.json();

      console.log(transaction.transactionId, data);
    } catch (error) {
      console.error(
        "Failed:",
        transaction.transactionId,
        error.message
      );
    }
  }
}

addTransactions();