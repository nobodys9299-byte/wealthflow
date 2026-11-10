import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';

export const SAMPLE_BANK_MESSAGES = [
  {
    source: 'SMS (HDFC Bank)',
    body: 'Alert: Rs 750.00 debited from A/c **4120 at Swiggy on 10-Nov-26. Avail Bal: Rs 42,100.',
    date: new Date().toISOString().split('T')[0],
  },
  {
    source: 'SMS (State Bank of India)',
    body: 'Dear UPI user A/C *8901 debited by Rs 1,250.00 on 10-Nov-26 transfer to Zomato Ref 34215.',
    date: new Date().toISOString().split('T')[0],
  },
  {
    source: 'SMS (ICICI Bank)',
    body: 'Acct XX109 debited with INR 2,400.00 on 10-Nov at Amazon India. Avail Bal: INR 18,500.',
    date: new Date().toISOString().split('T')[0],
  },
  {
    source: 'SMS (Axis Bank)',
    body: 'Rs 4,500.00 debited from A/c *5678 on 10-Nov towards Electricity Bill. Info: BESCOM.',
    date: new Date().toISOString().split('T')[0],
  },
  {
    source: 'SMS (UPI / PhonePe)',
    body: 'Paid Rs 320 to Chai Point on 10-Nov. UPI transaction ID 4321098765.',
    date: new Date().toISOString().split('T')[0],
  },
  {
    source: 'SMS (State Bank)',
    body: 'Salary Credit: INR 85,000.00 credited to your A/c *8990 from Tech Innovations Corp.',
    date: new Date().toISOString().split('T')[0],
  },
];

export const parseBankMessage = (text, source = 'SMS') => {
  if (!text) return null;

  const lower = text.toLowerCase();
  
  // 1. Detect Type
  const isIncome =
    lower.includes('credit') ||
    lower.includes('credited') ||
    lower.includes('received') ||
    lower.includes('deposit') ||
    lower.includes('salary');

  const isExpense =
    lower.includes('debit') ||
    lower.includes('debited') ||
    lower.includes('spent') ||
    lower.includes('charged') ||
    lower.includes('paid') ||
    lower.includes('billed') ||
    lower.includes('purchase');

  const type = isIncome ? 'income' : 'expense';

  // 2. Extract Amount
  // Matches: $45, $45.50, Rs 500, Rs. 500, INR 1250, 1,250.00
  const amountRegex = /(?:rs\.?|inr|\$|usd|eur|€|£)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const amountMatch = text.match(amountRegex);
  let amount = 0;
  if (amountMatch && amountMatch[1]) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  } else {
    // Fallback: search for stand-alone decimal number
    const numMatch = text.match(/(?:[\s:]|^)([\d,]+\.\d{2})(?:[\s.]|$)/);
    if (numMatch && numMatch[1]) {
      amount = parseFloat(numMatch[1].replace(/,/g, ''));
    }
  }

  // 3. Extract Merchant or Description
  let merchant = 'Bank Transaction';
  const merchantPatterns = [
    /(?:at|to|for|from)\s+([A-Za-z0-9&'.\s]{3,24})(?:\s+on|\.|$)/i,
    /(?:vpa|merchant)\s*[:\-]\s*([A-Za-z0-9&'.\s]{3,20})/i,
  ];

  for (const pat of merchantPatterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      merchant = m[1].trim().replace(/\.$/, '');
      break;
    }
  }

  // 4. Guess Category
  let categoryId = type === 'income' ? 'salary' : 'other_exp';
  const mLower = merchant.toLowerCase() + ' ' + lower;

  if (mLower.includes('starbucks') || mLower.includes('cafe') || mLower.includes('restaurant') || mLower.includes('bistro') || mLower.includes('food') || mLower.includes('burger')) {
    categoryId = 'food';
  } else if (mLower.includes('grocery') || mLower.includes('whole foods') || mLower.includes('trader') || mLower.includes('walmart') || mLower.includes('market') || mLower.includes('supermarket')) {
    categoryId = 'groceries';
  } else if (mLower.includes('netflix') || mLower.includes('spotify') || mLower.includes('movie') || mLower.includes('cinema') || mLower.includes('apple') || mLower.includes('disney')) {
    categoryId = 'entertainment';
  } else if (mLower.includes('uber') || mLower.includes('lyft') || mLower.includes('fuel') || mLower.includes('gas') || mLower.includes('shell') || mLower.includes('petrol')) {
    categoryId = 'transport';
  } else if (mLower.includes('electric') || mLower.includes('wifi') || mLower.includes('bill') || mLower.includes('utility') || mLower.includes('water')) {
    categoryId = 'bills';
  } else if (mLower.includes('nike') || mLower.includes('amazon') || mLower.includes('zara') || mLower.includes('shopping')) {
    categoryId = 'shopping';
  } else if (mLower.includes('upwork') || mLower.includes('fiverr') || mLower.includes('freelance') || mLower.includes('client')) {
    categoryId = 'freelance';
  } else if (mLower.includes('dividend') || mLower.includes('stock') || mLower.includes('invest') || mLower.includes('crypto')) {
    categoryId = 'investment';
  }

  return {
    id: `parsed_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    source,
    type,
    amount,
    title: merchant,
    categoryId,
    rawText: text,
    date: new Date().toISOString().split('T')[0],
  };
};
