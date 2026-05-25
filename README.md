# Chaptr Income-Share Open-Source Portal
This portal manages income-share agreements from the student financing application and credit vetting process (before joining a program) to the income-tracking and repayment layer (upon program graduation).

## The Portals
The application is a monorepo that is broken down into 2 micro-frontends and backend logic layer

### Student Portal – Next.JS
- Apply for income-share financing, covers initial application, KYC, credit vetting, and contract signing
- Make monthly income reports and fulfil repayments upon graduation

### Admin Portal – Next.JS
- Track student ISA applications and where they are on the pipeline
- Track active contracts and repayments made by graduates
- Track settlement to your school bank account

### Backend API – FastAPI
- Manage the database sync (PostgreSQL)
- Manage the application logic
- Connect to external services i.e. invoicing, payments, e-signatures, etc.
