# GiftFlow - Tax-Deductible Wish Platform

GiftFlow is a platform that responsibly bridges wealth gaps by matching Patrons (donors seeking tax deductions) with Charities (dignity-first name for recipients) who post tax-deductible "wishes" (needs). The system guarantees that only tax-deductible wishes can be published and fulfilled.

## 🎯 Core Features

- **Tax-Deductible Verification**: Every wish is verified for tax eligibility before publication
- **Dual Role System**: Users can be both Charities (recipients) and Patrons (donors)
- **Pre-Verified Categories**: Curated catalog of clearly deductible categories
- **Custom Wish Verification**: OCR + rules engine + LLM assistant for custom wishes
- **Automatic Tax Receipts**: Auto-generated receipts and prefilled tax documents
- **Analytics Dashboard**: Track donations by tags, demographics, purpose, and city
- **Moderation System**: Human review for uncertain cases

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Payments**: Stripe
- **OCR**: Tesseract.js
- **Validation**: Zod
- **ORM**: Prisma

### Security Features
- Row Level Security (RLS) on all database tables
- Server-side authentication and authorization
- Audit logging for all actions
- PII protection and redaction
- Rate limiting on sensitive endpoints
- CSRF protection and XSS prevention

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Supabase account)
- Clerk account for authentication
- Stripe account for payments

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd giftflow
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file with the following variables:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   # Simple Supabase Authentication

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/giftflow

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_... # Optional - only needed for production webhooks

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

4. **Set up Supabase RLS policies**
   Run the following SQL in your Supabase SQL editor:
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE wish_documents ENABLE ROW LEVEL SECURITY;
   ALTER TABLE fulfillments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
   ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

   -- Users can read their own user row
   CREATE POLICY "users_self_read" ON public.users FOR SELECT
   TO authenticated USING (id = auth.uid());

   -- Charities can write only their own wishes
   CREATE POLICY "charities_write_own_wishes" ON public.wishes FOR INSERT
   TO authenticated WITH CHECK (charity_id = auth.uid());

   CREATE POLICY "charities_update_own_wishes" ON public.wishes FOR UPDATE
   TO authenticated USING (charity_id = auth.uid());

   -- Public can read only eligible wishes
   CREATE POLICY "public_read_eligible_wishes" ON public.wishes FOR SELECT
   TO anon, authenticated USING (status = 'eligible');

   -- Only admins can update user roles
   CREATE POLICY "only_admin_update_roles" ON public.users FOR UPDATE
   TO authenticated USING ((auth.jwt()->>'role') = 'admin')
   WITH CHECK ((auth.jwt()->>'role') = 'admin');
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 User Roles & Permissions

### Anonymous User
- View public wish catalog (redacted PII)
- Cannot create/fulfill wishes

### Charity (Recipient)
- Create and manage Wishes (Pre-Verified and Custom)
- Add searchable tags (purpose, demographics, city, deduction type)
- View status, fulfillment progress, receipts

### Patron (Donor)
- Browse/filter wishes
- Fulfill wishes (full or partial)
- Download auto-generated receipts and prefilled tax docs
- View analytics (by tag/demographic/purpose)

### Moderator (Internal)
- Final review queue for Custom wishes rejected/flagged by the verifier
- Override decisions with audit log

### Admin
- Manage users/roles, site-wide settings, risk rules
- Blocklists/allowlists, payouts, reporting

## 🔒 Security & Compliance

### Tax Verification Pipeline
1. **Pre-Verified Wishes**: Curated catalog of clearly deductible categories
2. **Custom Wishes**: OCR + rules engine + LLM assistant decide Eligible/Reject/Review
3. **Document Analysis**: Extract text, validate vendor information, check for duplicates
4. **Human Review**: Moderators review uncertain cases

### Data Protection
- All PII is redacted in public responses
- Signed URLs with short TTL for document access
- Audit logging for all actions
- Rate limiting on sensitive endpoints
- CSRF and XSS protection

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests (when implemented)
npm run test
```

## 📚 API Documentation

### Authentication
All API routes require Clerk authentication. The middleware automatically protects routes under `/api/`.

### Key Endpoints

- `POST /api/wishes` - Create a new wish (Charity only)
- `GET /api/wishes` - Get public wish catalog
- `GET /api/wishes/[id]` - Get wish details
- `POST /api/wishes/[id]/fulfill` - Fulfill a wish (Patron only)
- `GET /api/analytics` - Get patron analytics
- `POST /api/moderation/wishes` - Make moderation decision (Moderator only)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@giftflow.com or join our Discord community.

## ⚠️ Legal Notice

This platform provides standardized receipts and summaries. Consult a tax professional for your specific situation. GiftFlow is not a tax advisor and does not provide tax advice.