# MicroAPI Hub API Documentation

## Overview

MicroAPI Hub implements the x402 payment protocol for Solana. This document describes the API endpoints and how to integrate with the payment system.

---

## Base URLs

- **Provider API**: `http://localhost:8080` (development)
- **Facilitator**: `http://localhost:8787` (development)
- **Devnet**: `https://api.devnet.solana.com`

---

## Provider API

### Discovery Endpoint

#### GET `/.well-known/x402`

Returns available payment options for all protected resources.

**Response:**
```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "maxAmountRequired": "1",
      "resource": "GET /api/data",
      "description": "Sample data API (pay-per-call)",
      "mimeType": "application/json",
      "outputSchema": null,
      "payTo": "11111111111111111111111111111111",
      "maxTimeoutSeconds": 60,
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "extra": {
        "name": "USDC",
        "version": "2"
      }
    }
  ]
}
```

---

### Protected Resource Endpoints

#### GET `/api/data`

Protected endpoint that requires payment.

**Request without Payment:**
```http
GET /api/data HTTP/1.1
Host: localhost:8080
```

**Response (402 Payment Required):**
```json
{
  "x402Version": 1,
  "error": "X-PAYMENT header is required",
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana-devnet",
      "maxAmountRequired": "1",
      "resource": "GET /api/data",
      "description": "Sample data API (pay-per-call)",
      "mimeType": "application/json",
      "outputSchema": null,
      "payTo": "11111111111111111111111111111111",
      "maxTimeoutSeconds": 60,
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "extra": {
        "name": "USDC",
        "version": "2"
      }
    }
  ]
}
```

**Request with Payment:**
```http
GET /api/data HTTP/1.1
Host: localhost:8080
X-PAYMENT: <base64-encoded-payment-header>
```

**Response (200 OK):**
```json
{
  "data": {
    "message": "Hello from MicroAPI Hub provider",
    "ts": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response Headers:**
- `X-PAYMENT-RESPONSE`: Base64-encoded settlement response

---

#### Health Check

**GET `/health`**

Returns service health status.

**Response:**
```json
{
  "ok": true
}
```

---

## Facilitator API

### Health Check

**GET `/health`**

Returns facilitator health status and configuration.

**Response:**
```json
{
  "ok": true,
  "rpc": "1.18.0",
  "feePayer": "68fBFbuLiAew3MEwotko9Ms7AsqLw1wy6vQ25dyGQpbj",
  "network": "devnet",
  "settlementMode": "native"
}
```

---

### Supported Schemes

**GET `/supported`**

Returns supported payment schemes.

**Response:**
```json
{
  "kinds": [
    {
      "scheme": "exact",
      "network": "solana-devnet"
    }
  ]
}
```

---

### Payment Verification

**POST `/verify`**

Verifies a payment authorization.

**Request:**
```json
{
  "x402Version": 1,
  "paymentHeader": "<base64-encoded-payment-header>",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "solana-devnet",
    "maxAmountRequired": "1",
    "resource": "GET /api/data",
    "description": "Sample data API (pay-per-call)",
    "mimeType": "application/json",
    "outputSchema": null,
    "payTo": "11111111111111111111111111111111",
    "maxTimeoutSeconds": 60,
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}
```

**Response (Valid):**
```json
{
  "isValid": true,
  "invalidReason": null
}
```

**Response (Invalid):**
```json
{
  "isValid": false,
  "invalidReason": "invalid_nonce_format"
}
```

---

### Payment Settlement

**POST `/settle`**

Settles a verified payment on-chain.

**Request:**
```json
{
  "x402Version": 1,
  "paymentHeader": "<base64-encoded-payment-header>",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "solana-devnet",
    "maxAmountRequired": "1",
    "resource": "GET /api/data",
    "description": "Sample data API (pay-per-call)",
    "mimeType": "application/json",
    "outputSchema": null,
    "payTo": "11111111111111111111111111111111",
    "maxTimeoutSeconds": 60,
    "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "error": null,
  "txHash": "5K3...",
  "networkId": "devnet",
  "payer": "68fBFbuLiAew3MEwotko9Ms7AsqLw1wy6vQ25dyGQpbj"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "insufficient_funds",
  "txHash": null,
  "networkId": "devnet"
}
```

---

## Payment Header Format

The `X-PAYMENT` header contains a base64-encoded JSON payload:

```json
{
  "x402Version": 1,
  "scheme": "exact",
  "network": "solana-devnet",
  "payload": {
    "signature": "demo-signature",
    "authorization": {
      "from": "68fBFbuLiAew3MEwotko9Ms7AsqLw1wy6vQ25dyGQpbj",
      "to": "11111111111111111111111111111111",
      "value": "1",
      "validAfter": "1704067200",
      "validBefore": "1704067500",
      "nonce": "0x1234...abcd"
    }
  }
}
```

**Encoding:**
```javascript
const paymentHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
```

---

## Error Codes

### Verification Errors

- `invalid_x402_version`: Payment header version mismatch
- `invalid_scheme`: Payment scheme not supported
- `invalid_network`: Network mismatch
- `invalid_payload`: Malformed payment payload
- `invalid_address_format`: Invalid Solana address
- `invalid_nonce_format`: Nonce must be 0x-prefixed 64-char hex
- `nonce_replay`: Nonce already used
- `invalid_time_window`: Authorization expired or not yet valid
- `invalid_amount`: Payment amount mismatch
- `invalid_recipient`: Payment recipient mismatch

### Settlement Errors

- `insufficient_funds`: Insufficient balance for settlement
- `invalid_blockhash`: Transaction blockhash expired
- `signature_error`: Transaction signature invalid
- `transaction_failed`: On-chain transaction failed

---

## Rate Limiting

Facilitator endpoints have basic rate limiting:
- Default: 1 request per 250ms per IP
- Can be disabled with `DISABLE_RATE_LIMIT=true`

---

## Authentication

Facilitator supports optional API key authentication:
- Set `AUTH_TOKEN` environment variable
- Include `x-api-key` header in requests

---

## Examples

See `/examples` page for code samples in:
- TypeScript
- Python
- Go

---

## Support

- **Documentation**: `/docs`
- **Examples**: `/examples`
- **FAQ**: `/faq`
- **GitHub**: [Repository URL]

