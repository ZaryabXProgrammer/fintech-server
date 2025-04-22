# FinConnect API Server

A robust backend API for a modern fintech application that supports user accounts, financial transactions, subscription management, and more.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management
- **Financial Transactions**: User-to-user transfers with detailed transaction history
- **Subscription Management**: Integrated with Stripe for subscription billing
- **Billing Portal**: Customer portal for subscription management
- **API Documentation**: Complete Swagger docs for all endpoints
- **Security**: JWT authentication, rate limiting, and data validation
- **Monitoring**: Comprehensive logging and error handling

## 📋 Prerequisites

- Node.js (v14+)
- MongoDB (v4+)
- Stripe account (for subscription features)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/ZaryabXProgrammer/fintech-server
cd fintech-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/fintech-db (Your DB URI)

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d

# Stripe (optional, for subscription features)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Frontend URL (for Stripe redirect)
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 🛣️ API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### Financial Transactions
- `GET /api/balance` - Get user's current balance
- `POST /api/transfer` - Transfer funds to another user
- `GET /api/transactions` - Get transaction history
- `GET /api/invoice` - Generate period invoice report

### Subscription Management
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout session
- `POST /api/subscriptions/create-portal-session` - Create Stripe customer portal session
- `POST /api/subscriptions/subscribe` - Manual subscription activation
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/status` - Get subscription status

### Webhook
- `POST /api/webhooks/stripe` - Webhook endpoint for Stripe events

## 📚 API Documentation

The API documentation is available at `/api-docs` when the server is running.

```bash
# Example
http://localhost:5000/api-docs
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation using express-validator
- CORS protection
- Helmet for secure HTTP headers

## 📊 Database Models

### User Model
- Core user information (name, email, password)
- Account details (balance, role)
- Subscription status
- Stripe integration fields

### Transaction Model
- Financial transaction records
- Support for various transaction types
- Detailed metadata for financial reporting
- Balance tracking for both sender and recipient

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🔄 Webhook Testing

For local webhook testing with Stripe:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward events to your local server:
```bash
stripe listen --forward-to http://localhost:5000/api/webhooks/stripe
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request