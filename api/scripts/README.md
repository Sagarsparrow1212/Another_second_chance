# Admin User Setup Script

This script helps you create the admin user for the application.

## Prerequisites

1. Make sure MongoDB is running
2. Make sure your `.env` file has the correct `MONGODB_URI`
3. Install dependencies: `npm install`

## Usage

### Option 1: Using Environment Variables (Recommended)

1. Add to your `.env` file:
```env
ADMIN_EMAIL=homelessadmin@gmail.com
ADMIN_PASSWORD=Admin@123
```

2. Run the script:
```bash
node scripts/createAdmin.js
```

### Option 2: Using Default Values

If you don't set environment variables, the script will use:
- Email: `homelessadmin@gmail.com`
- Password: `Admin@123`

Run the script:
```bash
node scripts/createAdmin.js
```

## Important Notes

- **Only one admin account is allowed** - The script will check if an admin already exists
- **Change the default password** after first login for security
- The admin user will be created with:
  - `isVerified: true`
  - `isActive: true`
  - `role: 'admin'`

## Troubleshooting

If you get an error that an admin already exists:
1. Delete the existing admin from the database, OR
2. Use the existing admin credentials to login

## Security

⚠️ **IMPORTANT**: After creating the admin, change the default password immediately!

