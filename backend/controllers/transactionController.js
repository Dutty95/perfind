import Transaction from '../models/Transaction.js';

// @desc    Get all transactions for a user
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findByUserId(req.user._id);
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUserId(req.params.id, req.user._id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction' });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body;
    
    // Validation
    if (!description || !amount || !category || !type) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either income or expense' });
    }
    
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a valid positive number' });
    }
    
    // Store amount as positive value, type field indicates income/expense
    const processedAmount = Math.abs(parseFloat(amount));
    
    const transactionData = {
      userId: req.user._id,
      description: description.trim(),
      amount: processedAmount,
      category: category.trim(),
      type,
      date: date || new Date().toISOString().split('T')[0]
    };
    
    const transaction = await Transaction.create(transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const { description, amount, category, type, date } = req.body;
    
    // Check if transaction exists and belongs to user
    const existingTransaction = await Transaction.findByIdAndUserId(req.params.id, req.user._id);
    if (!existingTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Validation
    if (type && !['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either income or expense' });
    }
    
    if (amount !== undefined && (isNaN(amount) || amount === 0)) {
      return res.status(400).json({ message: 'Amount must be a valid number and not zero' });
    }
    
    // Prepare update data
    const updateData = {};
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (type !== undefined) updateData.type = type;
    if (date !== undefined) updateData.date = date;
    
    // Handle amount processing
    if (amount !== undefined) {
      const transactionType = type || existingTransaction.type;
      updateData.amount = transactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    }
    
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error while updating transaction' });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    // Check if transaction exists and belongs to user
    const transaction = await Transaction.findByIdAndUserId(req.params.id, req.user._id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
export const getTransactionStats = async (req, res) => {
  try {
    const stats = await Transaction.getStatsByUserId(req.user._id);
    res.json(stats);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction statistics' });
  }
};

// @desc    Get monthly income vs expense data
// @route   GET /api/transactions/monthly
// @access  Private
export const getMonthlyData = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const monthlyData = await Transaction.getMonthlyData(req.user._id, months);
    res.json(monthlyData);
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({ message: 'Server error while fetching monthly data' });
  }
};

// @desc    Get category breakdown data
// @route   GET /api/transactions/categories
// @access  Private
export const getCategoryData = async (req, res) => {
   try {
     const categoryData = await Transaction.getCategoryData(req.user._id);
     res.json(categoryData);
   } catch (error) {
     console.error('Get category data error:', error);
     res.status(500).json({ message: 'Server error while fetching category data' });
   }
 };