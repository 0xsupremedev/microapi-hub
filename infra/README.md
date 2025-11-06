# Infra

## Quickstart

1. Fill env vars:
   - facilitator: set `FEE_PAYER_SECRET` (devnet, bs58 secret), optionally `RPC_URL`
   - provider: set `PAY_TO_PUBKEY` and `USDC_MINT`
   - Update `infra/docker-compose.yml` or local `.env`
2. Start services:
   - `docker compose -f infra/docker-compose.yml up --build`
3. Run e2e:
   - `PROVIDER_URL=http://localhost:8080/api/data PAYER_PUBKEY=<your_devnet_pubkey> tsx infra/e2e.ts`

## Notes
- Healthchecks are enabled on 8787 and 8080.
- Ensure devnet funding for fee payer and payer accounts.
