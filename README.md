# OneAI × OneClaw × WAOC — Autonomous Coordination on XLayer

A hackathon-ready Next.js demo that turns one sentence into:
- AI strategy generation
- execution task dispatch
- community mission flow
- on-chain proof on XLayer

## What is included
- Frontend demo page
- Three API routes: `plan`, `execute`, `record`
- Real-service wiring with safe mock fallback
- Tiny proof contract
- Optional deploy script

## Run locally
```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:
- `http://localhost:3000/`
- `http://localhost:3000/demo`

## Important
This project runs **out of the box in mock mode** so you can demo immediately.

When you are ready to connect your real services:
1. Set `MOCK_MODE=false` in `.env.local`
2. Fill in `ONEAI_*`, `ONECLAW_*`, and XLayer env values
3. Deploy the contract if you want real on-chain proof

## Recommended judge flow
1. Connect wallet
2. Enter `Launch my project on XLayer`
3. Click `Run Full Demo`
4. Show AI plan, execution logs, and transaction proof panel

## Contract deployment
See `contracts/ProofOfCoordination.sol` and `scripts/deploy-proof.ts`.

## Notes
- The frontend is intentionally self-contained and does not depend on shadcn/ui.
- The backend supports both mocked and real external service calls.
