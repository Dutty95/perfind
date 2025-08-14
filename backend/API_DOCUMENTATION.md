# Personal Finance API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true|false,
  "message": "Response message",
  "data": {}, // Response data
  "count": 0, // For list responses
  "total": 0, // For paginated responses
  "page": 1,
  "pages": 1
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST /auth/login
Login user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### GET /auth/profile
Get user profile (Protected)

### PUT /auth/profile
Update user profile (Protected)

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

---

## Transaction Endpoints

### GET /transactions
Get all transactions for user (Protected)

**Query Parameters:**
- `category` (optional): Filter by category
- `type` (optional): Filter by type (income/expense)
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### POST /transactions
Create new transaction (Protected)

**Request Body:**
```json
{
  "description": "Grocery shopping",
  "amount": 150.50,
  "category": "Food",
  "type": "expense",
  "date": "2024-01-15"
}
```

### GET /transactions/:id
Get single transaction (Protected)

### PUT /transactions/:id
Update transaction (Protected)

### DELETE /transactions/:id
Delete transaction (Protected)

### GET /transactions/stats
Get transaction statistics (Protected)

### GET /transactions/monthly
Get monthly transaction data (Protected)

### GET /transactions/category
Get category breakdown (Protected)

---

## Budget Endpoints

### GET /budgets
Get all budgets for user (Protected)

### POST /budgets
Create new budget (Protected)

**Request Body:**
```json
{
  "category": "Food",
  "amount": 500,
  "period": "monthly"
}
```

### GET /budgets/:id
Get single budget (Protected)

### PUT /budgets/:id
Update budget (Protected)

### DELETE /budgets/:id
Delete budget (Protected)

### GET /budgets/overview
Get budget overview with spending analysis (Protected)

---

## Goal Endpoints

### GET /goals
Get all goals for user (Protected)

**Query Parameters:**
- `status` (optional): Filter by status (active/completed/paused/cancelled)
- `type` (optional): Filter by type (save/reduce/earn/invest)
- `category` (optional): Filter by category

### POST /goals
Create new goal (Protected)

**Request Body:**
```json
{
  "title": "Emergency Fund",
  "description": "Build 6 months emergency fund",
  "type": "save",
  "category": "Savings",
  "targetAmount": 10000,
  "targetDate": "2024-12-31",
  "priority": "high",
  "isRecurring": false
}
```

### GET /goals/:id
Get single goal (Protected)

### PUT /goals/:id
Update goal (Protected)

### PATCH /goals/:id/progress
Update goal progress (Protected)

**Request Body:**
```json
{
  "amount": 1500,
  "action": "set" // or "add"
}
```

### DELETE /goals/:id
Delete goal (Protected)

### GET /goals/stats
Get goal statistics (Protected)

### GET /goals/overview
Get goals overview for dashboard (Protected)

---

## Dashboard Endpoints

### GET /dashboard
Get dashboard overview data (Protected)

Returns comprehensive dashboard data including:
- Financial summary
- Recent transactions
- Budget overview
- Goal progress
- Monthly trends

### GET /dashboard/insights
Get financial insights and recommendations (Protected)

### GET /dashboard/trends
Get spending trends over time (Protected)

**Query Parameters:**
- `period` (optional): Time period (monthly/quarterly/yearly)
- `months` (optional): Number of months to include (default: 6)

---

## Report Endpoints

### GET /reports/templates
Get available report templates (Protected)

### GET /reports/summary
Get quick financial summary (Protected)

**Query Parameters:**
- `period` (optional): Time period (daily/weekly/monthly/quarterly/yearly)

### POST /reports/generate
Generate new report (Protected)

**Request Body:**
```json
{
  "title": "Monthly Financial Report",
  "type": "comprehensive", // income/expense/budget/goal/comprehensive/custom
  "period": "monthly", // daily/weekly/monthly/quarterly/yearly/custom
  "startDate": "2024-01-01", // Required if period is "custom"
  "endDate": "2024-01-31", // Required if period is "custom"
  "categories": ["Food", "Transport"], // Optional filter
  "isScheduled": false,
  "scheduleFrequency": "monthly" // Required if isScheduled is true
}
```

### GET /reports
Get all reports for user (Protected)

**Query Parameters:**
- `type` (optional): Filter by report type
- `period` (optional): Filter by period
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### GET /reports/:id
Get single report (Protected)

### DELETE /reports/:id
Delete report (Protected)

---

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String (unique)",
  "password": "String (hashed)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Transaction
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "description": "String",
  "amount": "Number",
  "category": "String",
  "type": "String (income/expense)",
  "date": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Budget
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "category": "String",
  "amount": "Number",
  "period": "String (weekly/monthly/yearly)",
  "startDate": "Date",
  "endDate": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Goal
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "String",
  "description": "String",
  "type": "String (save/reduce/earn/invest)",
  "category": "String",
  "targetAmount": "Number",
  "currentAmount": "Number",
  "targetDate": "Date",
  "startDate": "Date",
  "status": "String (active/completed/paused/cancelled)",
  "priority": "String (low/medium/high)",
  "isRecurring": "Boolean",
  "recurringPeriod": "String (weekly/monthly/yearly)",
  "progressPercentage": "Number (virtual)",
  "remainingAmount": "Number (virtual)",
  "daysRemaining": "Number (virtual)",
  "goalStatus": "String (virtual)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Report
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "String",
  "type": "String (income/expense/budget/goal/comprehensive/custom)",
  "period": "String (daily/weekly/monthly/quarterly/yearly/custom)",
  "startDate": "Date",
  "endDate": "Date",
  "categories": "[String]",
  "data": "Mixed",
  "summary": {
    "totalIncome": "Number",
    "totalExpenses": "Number",
    "netIncome": "Number",
    "budgetUtilization": "Number",
    "goalProgress": "Number",
    "savingsRate": "Number"
  },
  "insights": [{
    "type": "String (warning/info/success/recommendation)",
    "message": "String",
    "category": "String",
    "priority": "String (low/medium/high)"
  }],
  "isScheduled": "Boolean",
  "scheduleFrequency": "String (weekly/monthly/quarterly/yearly)",
  "nextGenerationDate": "Date",
  "status": "String (draft/generated/archived)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Error Codes

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Access denied
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **500**: Internal Server Error - Server error

---

## Common Categories

### Expense Categories
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills & Utilities
- Healthcare
- Education
- Travel
- Personal Care
- Home & Garden
- Insurance
- Taxes
- Gifts & Donations
- Business
- Other

### Income Categories
- Salary
- Freelance
- Business
- Investments
- Rental
- Gifts
- Refunds
- Other

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

---

## Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Paginated responses include:
- `count`: Number of items in current page
- `total`: Total number of items
- `page`: Current page number
- `pages`: Total number of pages