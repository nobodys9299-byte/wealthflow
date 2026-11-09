# 💰 WealthFlow - Mobile Money Tracking App (React Native & Expo)

A complete personal finance tracker built with **React Native**, **Expo SDK 58**, and **SVG charts**, running seamlessly on **iOS, Android, and Web**.

---

## 🌟 Key Features

1. **💸 Income & Expense Logging**
   - Quick logging with category presets (Food & Dining, Groceries, Rent, Fuel, Shopping, Health, Salary, Freelance, Investments, etc.).
   - Edit, delete, and note tags.
   - Filter transactions by type (Income vs Expense), accounts, and instant text search.

2. **📊 Interactive Analytics & Charts**
   - **Category Spending Donut Chart** with percentage breakdowns and total expense in the center.
   - **Comparative Cash Flow Bar Chart** displaying Income vs Expense over past months.
   - Timeframe toggling: *This Month*, *Last 30 Days*, *This Year*, and *All Time*.
   - Smart Financial Insights: Monthly savings rate, daily average spending, and top spending category badge.

3. **🎯 Monthly Budget Goals & Alerts**
   - Set monthly spending limits per category.
   - Real-time progress bars with dynamic status alerts:
     - 🟢 **Safe / On Track** (< 75%)
     - 🟡 **Near Limit Warning** (75% - 99%)
     - 🔴 **Over Budget Alert** (≥ 100%)
   - Dashboard alert banner when any budget needs attention.

4. **💳 Multi-Account & Payment Method Tracking**
   - Track **Cash Wallets**, **Checking Banks**, **Savings Accounts**, and **Credit Cards**.
   - Live auto-calculated balances based on real transactions.
   - Transfer money between accounts with linked transactions.

5. **🔁 Recurring Bills & Subscriptions**
   - Manage monthly fixed bills (Netflix, Rent, Internet, etc.) and recurring income (Salary).

6. **📁 Export & Data Backup**
   - **CSV Export**: Instant downloadable or copyable spreadsheet with all transactions.
   - **JSON Backup & Restore**: Full database backup and 1-click restore.
   - **Sample Data**: 1-click load of realistic sample data or complete reset.

7. **🎨 High-End Design & Customization**
   - High-contrast Slate **Dark Mode** & crisp **Light Mode**.
   - Currency switcher supporting **USD ($)**, **EUR (€)**, **GBP (£)**, **INR (₹)**, **CAD**, **AUD**, **JPY (¥)**, and more.

---

## 🚀 Running the App

The app is located at:
```text
C:\Users\Admin\.gemini\antigravity\scratch\money-tracker-app
```

### 1. Web Preview (Browser)
```bash
npm run web
# Opens at http://localhost:8081
```

### 2. Mobile (Android & iOS with Expo Go)
1. Install **Expo Go** from Google Play Store or Apple App Store on your mobile phone.
2. In the project directory, run:
   ```bash
   npx expo start
   ```
3. Scan the QR code shown in your terminal with your phone's camera (iOS) or the Expo Go app (Android).

---

## 📁 Project Structure

```text
money-tracker-app/
├── App.js                         # Root application with floating tab bar & modal orchestration
├── app.json                       # Expo configuration
├── package.json                   # Dependencies (Expo SDK 58, React Native, SVG, AsyncStorage)
└── src/
    ├── constants/
    │   ├── theme.js               # Dark/Light color tokens & currencies
    │   ├── categories.js          # Expense & Income categories with vector icons
    │   └── initialData.js         # Pre-populated demo transactions, budgets & recurring items
    ├── context/
    │   └── FinanceContext.js      # Central state store with AsyncStorage persistence & financial math
    ├── utils/
    │   └── formatters.js          # Currency formatting, date labels, and CSV generators
    ├── components/
    │   ├── SummaryCards.js        # Net Worth hero banner & cash flow indicators
    │   ├── TransactionItem.js     # Transaction card with icons & delete action
    │   ├── BudgetCard.js          # Category budget card with dynamic progress bar
    │   ├── AccountCard.js         # Account card (full & compact styles)
    │   ├── charts/
    │   │   ├── CategoryPieChart.js # SVG Donut chart with category legend
    │   │   └── CashflowBarChart.js # SVG comparative bar chart
    │   └── modals/
    │       ├── TransactionModal.js # Log / edit income and expenses
    │       ├── TransferModal.js    # Transfer funds between accounts
    │       ├── BudgetModal.js      # Create / edit category budgets
    │       └── AccountModal.js     # Create / edit accounts
    └── screens/
        ├── DashboardScreen.js     # Home dashboard with quick actions & alerts
        ├── TransactionsScreen.js  # Searchable & filterable transaction log
        ├── AnalyticsScreen.js     # Visual charts & financial insights
        ├── BudgetsScreen.js       # Budget goals & recurring subscriptions
        ├── AccountsScreen.js      # Consolidated accounts & balances
        └── SettingsScreen.js      # Themes, currencies, CSV/JSON export & backup
```
