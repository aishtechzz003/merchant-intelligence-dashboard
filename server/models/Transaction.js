const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },

  merchantId: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  paymentMethod: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["Success", "Failed", "Pending"],
    required: true
  },

  failureReason: {
    type: String,
    default: null
  },

  customerName: {
    type: String,
    required: true
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;