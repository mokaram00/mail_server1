# Mail Server Backend

This is the backend for a mail server that receives emails via POP3 protocol without sending capabilities. It works with your own domain to receive emails on your private server.

## Features

- Receive emails via POP3 protocol
- No email sending capabilities (receiving only)
- Custom domain support
- User authentication and management
- Email storage in a database
- RESTful API for email management

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A custom domain with DNS configuration
- Access to POP3 email accounts

## Setup Instructions

### 1. Environment Configuration

1. Update the `.env` file with your configuration:
   ```
   DOMAIN=your-domain.com
   ```

2. Configure your DNS settings:
   - Set up MX records to point to your server
   - Configure SPF, DKIM, and DMARC records for proper email handling

### 2. POP3 Configuration

Update the `.env` file with your POP3 settings:
```
POP3_HOST=pop.your-domain.com
POP3_PORT=995
POP3_USER=your-email@your-domain.com
POP3_PASSWORD=your-password
POP3_TLS=true
```

### 3. Database Setup

The application uses SQLite by default. For production, you can configure MySQL or PostgreSQL in `src/config/db.ts`.

### 4. Installation

```bash
npm install
```

### 5. Running the Application

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Email Management
- `GET /api/emails` - Get user emails
- `GET /api/emails/:id` - Get specific email
- `PUT /api/emails/:id` - Update email (mark as read, star, etc.)

### Email Receiving
- `POST /api/email-receive/receive` - Fetch emails from POP3 server
- `POST /api/email-receive/configure` - Configure POP3 settings

## How It Works

1. Users register and log in to the system
2. Users configure their email account settings (POP3)
3. The server periodically fetches emails from the configured email server
4. Received emails are stored in the database
5. Users can access their received emails through the API

## Security Notes

- Emails are only received, not sent
- All passwords are hashed and stored securely
- JWT tokens are used for authentication
- TLS encryption is used for POP3 connections
- Rate limiting is implemented to prevent DDoS attacks:
  - General rate limiting: 100 requests per 15 minutes per IP
  - Authentication rate limiting: 5 requests per 15 minutes per IP
  - API rate limiting: 200 requests per 15 minutes per IP
- POP3 server has connection limits:
  - Maximum 10 connections per IP per minute
  - Maximum 1000 concurrent connections
  - Maximum 10000 messages per session
- CSRF (Cross-Site Request Forgery) protection is implemented for all state-changing requests

## Custom Domain Setup

To use your own domain:

1. Purchase a domain or use an existing one
2. Configure DNS records:
   - MX record pointing to your server
   - A record for your domain
3. Set up SSL certificates (recommended)
4. Configure email routing on your server

## Limitations

- This server only receives emails, it does not send them
- Requires an existing email provider with POP3 access
- Not a full MTA (Mail Transfer Agent) replacement