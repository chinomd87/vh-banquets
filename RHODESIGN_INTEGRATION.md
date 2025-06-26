# RhodeSign Integration Setup Guide

## Overview

This guide explains how to set up the RhodeSign integration with VH Banquets for secure digital signature workflows.

## Integration Components

### 1. Backend API Routes (`/api/rhodesign`)

- **POST** `/initiate-signature` - Start signature process
- **GET** `/signature-status/:contractId` - Check signature status
- **POST** `/webhook/signature-complete` - Handle successful signatures
- **POST** `/webhook/signature-failed` - Handle failed signatures
- **POST** `/webhook/status-update` - Handle general status updates
- **POST** `/resend-signature` - Resend signature request
- **GET** `/contracts` - List all contracts with signature status

### 2. Frontend Components

- `RhodeSignIntegration.js` - Contract signature UI component
- `RhodeSignDashboard.js` - Dashboard for monitoring signature workflows
- `ContractManagement.js` - Enhanced with RhodeSign integration

### 3. Security Features

- ✅ Webhook signature verification using HMAC-SHA256
- ✅ Rate limiting for API endpoints and webhooks
- ✅ Authentication required for administrative functions
- ✅ Secure communication between systems

## Setup Instructions

### 1. Environment Configuration

#### Backend (API)

Create or update `/api/.env` with:

```bash
# RhodeSign Configuration
RHODESIGN_URL=https://rhodesign.app
RHODESIGN_API_URL=https://api.rhodesign.app
RHODESIGN_API_KEY=your_rhodesign_api_key_here
RHODESIGN_WEBHOOK_SECRET=your_webhook_secret_here
RHODESIGN_ENABLED=true

# VH Banquets Configuration
VH_BANQUETS_URL=https://vhbanquets.com
VH_BANQUETS_API_URL=https://api.vhbanquets.com
```

#### Frontend

Update `.env.production` with:

```bash
# RhodeSign Integration
REACT_APP_RHODESIGN_URL=https://rhodesign.app
REACT_APP_RHODESIGN_ENABLED=true
REACT_APP_ENABLE_RHODESIGN_INTEGRATION=true
```

### 2. RhodeSign Configuration

1. **Create RhodeSign Account**

   - Sign up at <https://rhodesign.app>
   - Get your API key from the dashboard
   - Configure webhook endpoints

2. **Webhook Configuration**

   - Success URL: `https://api.vhbanquets.com/api/rhodesign/webhook/signature-complete`
   - Failure URL: `https://api.vhbanquets.com/api/rhodesign/webhook/signature-failed`
   - Status Update URL: `https://api.vhbanquets.com/api/rhodesign/webhook/status-update`

3. **Security Settings**
   - Enable webhook signature verification
   - Set up IP whitelisting if required
   - Configure API rate limits

### 3. Database Setup (if using persistent storage)

```sql
-- Contract signature requests table
CREATE TABLE contract_signature_requests (
    id VARCHAR(255) PRIMARY KEY,
    contract_id VARCHAR(255) NOT NULL,
    request_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL,
    signer_email VARCHAR(255) NOT NULL,
    signer_name VARCHAR(255),
    rhodesign_url TEXT,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    signed_at TIMESTAMP NULL,
    failed_at TIMESTAMP NULL,
    failure_reason TEXT NULL,
    metadata JSON
);

-- Signature status tracking table
CREATE TABLE signature_statuses (
    contract_id VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) NOT NULL,
    signature_request_id VARCHAR(255),
    rhodesign_url TEXT,
    signer_email VARCHAR(255),
    signed_at TIMESTAMP NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    signed_document_url TEXT NULL
);
```

## Usage Workflow

### 1. Initiating a Signature

```javascript
// Frontend usage
import RhodeSignIntegration from "./components/RhodeSignIntegration";

<RhodeSignIntegration
  contract={contractData}
  onStatusUpdate={(status) => {
    console.log("Signature status updated:", status);
  }}
/>;
```

### 2. API Usage

```javascript
// Initiate signature process
const response = await fetch("/api/rhodesign/initiate-signature", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    contractId: "contract-123",
    contractTitle: "Wedding Reception Contract",
    contractContent: htmlContent,
    signerEmail: "client@example.com",
    signerName: "John Doe",
    eventDetails: {
      eventName: "Wedding Reception",
      eventDate: "2025-08-15",
      venue: "VH Banquets Main Hall",
      guestCount: 150,
      totalAmount: 5500,
    },
  }),
});
```

### 3. Webhook Handling

RhodeSign will send webhooks to notify about signature events:

```javascript
// Webhook payload example
{
  "requestId": "vh_contract-123_1735123456789",
  "contractId": "contract-123",
  "status": "SIGNED",
  "signer": {
    "email": "client@example.com",
    "name": "John Doe"
  },
  "signedAt": "2025-06-25T10:30:00Z",
  "signedDocument": "https://rhodesign.app/documents/signed/xyz..."
}
```

## Integration Features

### Real-time Status Updates

- ✅ Webhook-based real-time notifications
- ✅ Status polling for backup reliability
- ✅ Activity logging and audit trail

### User Experience

- ✅ Seamless signature initiation from VH Banquets
- ✅ One-click link generation and sharing
- ✅ Status monitoring dashboard
- ✅ Automatic retry and resend capabilities

### Security & Compliance

- ✅ Legally binding digital signatures
- ✅ Encrypted document transmission
- ✅ Audit trail and timestamping
- ✅ Secure webhook verification

### Error Handling

- ✅ Graceful failure handling
- ✅ Automatic retry mechanisms
- ✅ Clear error messaging
- ✅ Fallback options for signature collection

## Testing

### 1. Development Testing

```bash
# Start the backend with RhodeSign integration
cd api
npm install
npm start

# Start the frontend
cd ..
npm install
npm start
```

### 2. Webhook Testing

Use tools like ngrok for local webhook testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local API
ngrok http 3001

# Update RhodeSign webhook URLs to use ngrok URL
```

## Monitoring

### Dashboard Features

- Contract signature statistics
- Recent activity timeline
- Integration health status
- Error tracking and alerts

### Logging

- All API requests to RhodeSign
- Webhook events and processing
- Error conditions and retry attempts
- Performance metrics

## Troubleshooting

### Common Issues

1. **Webhook Not Received**

   - Check webhook URL configuration in RhodeSign
   - Verify webhook secret is correct
   - Check firewall and network settings

2. **Signature Verification Failed**

   - Verify RHODESIGN_WEBHOOK_SECRET is set correctly
   - Check webhook payload format
   - Ensure HTTPS is used for webhook endpoints

3. **API Connection Issues**
   - Verify RHODESIGN_API_KEY is valid
   - Check API endpoint URLs
   - Review network connectivity and DNS resolution

### Debug Mode

Enable debug logging:

```bash
# Backend
LOG_LEVEL=debug
LOG_RHODESIGN_REQUESTS=true
LOG_WEBHOOK_EVENTS=true

# Frontend
REACT_APP_DEBUG_RHODESIGN=true
```

## Support

For technical support:

- VH Banquets: <admin@vhbanquets.com>
- RhodeSign: <support@rhodesign.app>

## Security Considerations

1. **API Keys**: Store securely, rotate regularly
2. **Webhook Secrets**: Use strong, unique secrets
3. **HTTPS**: Always use HTTPS for all communications
4. **Rate Limiting**: Monitor and adjust as needed
5. **IP Whitelisting**: Consider restricting webhook sources
6. **Audit Logging**: Maintain detailed logs for compliance

## Version History

- **v1.0.0** - Initial RhodeSign integration
- **v1.1.0** - Added dashboard and enhanced error handling
- **v1.2.0** - Improved security and webhook verification

---

_This integration provides a secure, reliable, and user-friendly digital signature solution for VH Banquets, ensuring legally binding contracts while maintaining an excellent customer experience._
