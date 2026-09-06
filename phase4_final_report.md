# Phase 4 Final Report

## 1. Authorization architecture
The application uses JSON Web Tokens (JWT) for authentication via FastAPI's `OAuth2PasswordBearer`. Dependencies (`get_current_user`, `get_current_farmer`, `get_current_buyer`) decode the JWT, verify validity/expiration, fetch the active user from the database, and enforce role-based access control (RBAC).

## 2. Endpoint authorization inventory
- All state-mutating endpoints (`POST`, `PATCH`) are correctly protected by authentication and role-specific dependencies.
- Read endpoints (`GET`) are primarily protected, though previously some public-facing routes lacked auth. We secured `get_lot` and `get_buyers` to prevent unauthorized scraping of private marketplace data.

## 3. Lot ownership
- **Endpoint**: `POST /lots` | **Behavior**: Only Farmers/FPOs can create lots. Backend automatically assigns `farmer_id` from the JWT context.
- **Endpoint**: `GET /lots/{lot_id}` | **Behavior**: Now requires an authenticated user.
- **Verdict**: PASS

## 4. Offer ownership
- **Endpoint**: `POST /offers` | **Behavior**: Only Buyers can create offers. Backend explicitly sets `buyer_id` from the JWT context.
- **Endpoint**: `GET /offers/seller/{farmer_id}` | **Behavior**: Only the Farmer matching `farmer_id` can fetch these offers.
- **Endpoint**: `PATCH /offers/{offer_id}/status` | **Behavior**: Enforces that only the Farmer who owns the corresponding lot can accept/reject the offer.
- **Verdict**: PASS

## 5. Transaction ownership
- **Endpoint**: `POST /transactions` | **Behavior**: Restricted to Farmers. Enforces that only the Farmer who owns the lot can convert an offer into a transaction.
- **Endpoint**: `GET /transactions/{transaction_id}` | **Behavior**: Restricted so only the specific buyer or farmer involved in the transaction can view its details.
- **Verdict**: PASS

## 6. Payment authorization
- **Endpoint**: `PATCH /transactions/{transaction_id}/payment-status`
- **Behavior**: Strictly limited to Buyers. Additionally, it explicitly checks that the `buyer_id` on the transaction matches the authenticated Buyer's ID. Unauthorized attempts return `403 Forbidden`.
- **Verdict**: PASS

## 7. Transaction status authorization
- **Endpoint**: `PATCH /transactions/{transaction_id}/status`
- **Behavior**: Strictly limited to Farmers. Additionally, it explicitly checks that the `farmer_id` on the transaction matches the authenticated Farmer's ID. Unauthorized attempts return `403 Forbidden`.
- **Verdict**: PASS

## 8. FPO authorization
- **Architecture**: FPOs share the `farmer` access capabilities via the `get_current_farmer` dependency, which explicitly permits both `"farmer"` and `"fpo"` roles.
- **Behavior**: An FPO can perform all farmer actions for their own resources. They cannot manipulate another FPO's or Farmer's resources since ownership checks (`lot.farmer_id == current_user.id`) are enforced globally.
- **Verdict**: PASS

## 9. IDOR audit
- **Finding**: Read operations like `get_lot` and `get_buyers` were globally accessible without authentication.
- **Fix**: Added `Depends(get_current_user)` to both endpoints.
- **Finding**: Resource mutation endpoints perfectly assert ownership before querying or modifying the database (e.g. `txn.farmer_id != current_user.id -> 403`).
- **Verdict**: PASS

## 10. Request-body ID forgery audit
- **Finding**: Pydantic schemas `ProduceLotCreate` and `BuyerOfferCreate` accepted `farmer_id` and `buyer_id` in the request body (even though the backend ignored them).
- **Fix**: Removed these fields completely from the schemas to eliminate any possibility of client-side ID forgery or confusing Swagger documentation.
- **Verdict**: PASS

## 11. Role authorization matrix
| Role | Action | Target Resource | Result |
|---|---|---|---|
| Farmer | Create Lot | Own | 200 OK |
| Buyer | Create Lot | - | 403 Forbidden |
| Farmer | View Offers | Own Lot | 200 OK |
| Farmer | View Offers | Other's Lot | 403 Forbidden |
| Buyer | Accept Offer | Any | 403 Forbidden |
| Buyer | Update Payment | Own Txn | 200 OK |
| Farmer | Update Payment | Own Txn | 403 Forbidden |
| FPO | Update Status | Own Txn | 200 OK |

## 12. Security tests
An automated test suite (`test_authorization.sh`) was created and run via actual HTTP curls against the live backend.
- Invalid JWT → 401: PASS
- Cross-role mutations (e.g., Buyer acting as Farmer) → 403: PASS
- Cross-tenant mutations (e.g., Farmer manipulating another Farmer's data) → 403: PASS
- ID Forgery attempts → Blocked: PASS

## 13. Regression tests
- **Login / Authentication flows**: Fully functional.
- **Dashboard APIs**: Successfully loading without errors.
- **Build**: `npm run build` completes successfully with 0 errors.
- **Backend Health**: `GET /api/health` returns `200 OK`.
- **Verdict**: PASS

## 14. Files changed
- `backend/app/api/auth.py`
- `backend/app/api/lots.py`
- `backend/app/api/transactions.py`
- `backend/app/schemas/buyer.py`
- `backend/test_authorization.sh`

## 15. Remaining risks
- None identified within the scope of identity and resource ownership. The application rigorously checks both role and ownership prior to performing any CRUD operations.

## 16. Recommendations
- Implement API rate limiting (e.g., `slowapi`) to prevent brute force attacks on the login and registration endpoints.
- If the application scales to allow FPOs to manage multiple farmers under a strict hierarchy, a new `get_managed_farmers` logic system will need to be implemented, rather than treating FPOs strictly as standalone Farmers.

## 17. Final verdict
PHASE 4 STATUS: PASS
