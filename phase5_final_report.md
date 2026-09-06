# Phase 5 Final Report

## 1. Existing lot/offer business model
The current Agrimitra business model dictates that **a lot has exactly one accepted offer**. When an offer is accepted, the entire lot transitions to `"Sold"`. The system does not natively support partial lot sale mechanics that keep the lot `"Available"`.

## 2. Quantity invariant
Because the system does not support partial sales, the strict invariant is: **A Produce Lot may have at most ONE successful transaction (accepted offer) associated with it**, ensuring no overselling occurs.

## 3. Current concurrency vulnerability
Previously, the system checked if a lot was available and an offer was pending in memory, assigned the new state in Python, and eventually executed a `db.commit()`. Since SQLite in its default configuration processes reads without locking the table against other readers, multiple concurrent requests could read the lot as `"Available"`, process the in-memory checks, and sequentially write multiple transactions and acceptances—bypassing the one-to-one lot business rule and overselling the lot.

## 4. Chosen concurrency strategy
Because SQLite lacks `SELECT ... FOR UPDATE` (row-level locking), I implemented **Atomic Compare-And-Swap (CAS)** logic using SQLAlchemy's `.update()` statement.
This translates to an atomic SQL `UPDATE` statement that only mutates the row if the `WHERE` condition matches the expected state. 
Additionally, I increased the SQLite `timeout` to 15 seconds in `session.py` to serialize concurrent database locking attempts instead of raising immediate 500 errors.

## 5. Atomic acceptance implementation
In `backend/app/api/offers.py` and `backend/app/api/transactions.py`, the state mutations for the offer and the lot have been replaced with:
```python
updated_lot = db.query(ProduceLot).filter(
    ProduceLot.id == offer.lot_id,
    ProduceLot.status.in_(["Available", "Offer Received"])
).update({"status": "Sold"}, synchronize_session=False)

if updated_lot == 0:
    db.rollback()
    raise HTTPException(status_code=409, detail="Produce lot has already been sold or is unavailable.")
```
If the atomic update hits 0 rows, we explicitly rollback the entire operation and return `409 Conflict`.

## 6. Duplicate acceptance protection
The atomic CAS ensures that if two identical `Accept` requests hit the server concurrently, the first will succeed, and the second will fail the `BuyerOffer.status == "Pending"` condition check (because the first update changed it), preventing duplicate transactions.

## 7. Overselling protection
If multiple competing offers on the exact same lot are accepted simultaneously, the lot status CAS acts as the gate. The first request successfully changes it to `"Sold"`. The concurrent request will hit `updated_lot == 0` (because the status is no longer `"Available"` or `"Offer Received"`) and safely abort.

## 8. Offer state transitions
- `Pending` → `Accepted`: Exclusively handled via CAS.
- `Pending` → `Rejected`: Exclusively handled via CAS.
- Transitions backward are impossible because the CAS targets only `"Pending"` offers.

## 9. Lot state transitions
- `Available` / `Offer Received` → `Sold`: Exclusively gated via CAS.

## 10. Transaction consistency
The transaction logic extracts all core numerical references and identifiers exclusively from trusted internal objects (`offer`, `lot`, `current_user`), fully ignoring client-submitted spoofing attempts for properties like price and quantity.

## 11. Database constraints
The SQLAlchemy schema (`Transaction`) strictly defines `offer_id` as `unique=True`. This adds a hard schema-level constraint against double-accepting the same offer (which would result in an `IntegrityError` if the application layer ever failed).
While `lot_id` is not strictly `unique=True` on the `Transaction` table (allowing for the theoretical addition of partial-sale mechanics later without heavy schema migrations), the atomic CAS application layer perfectly guarantees only one transaction is created per lot under the current business model.

## 12. Concurrency test methodology
Created `backend/test_concurrency.py`. This script spins up a `concurrent.futures.ThreadPoolExecutor` against the live uvicorn server.
**Scenario C** specifically tests the overselling vulnerability by firing competing acceptances simultaneously for two distinct offers (Offer A and Offer B) targeting the same exact lot.

## 13. Actual concurrency test results
- TRUE concurrent test executed: **YES** (via `ThreadPoolExecutor` hitting live uvicorn).
- Scenario C Execution:
    - Attempted to accept two different offers simultaneously on Lot 16.
    - Final state fetched directly from the database:
      - `Lot 16 Final Status: Sold`
      - `Offer 17 Final Status: Pending` (Failed to accept)
      - `Offer 18 Final Status: Accepted` (Succeeded)
      - `Total transactions for Lot 16: 1`
- Database final invariant held: **YES**.

## 14. Duplicate acceptance test
- Scenario A Execution:
    - Sent 10 identical acceptance requests concurrently for the exact same offer.
    - Result: `1 Success (200), 9 Conflicts (409)`.
    - No duplicate transactions were created.

## 15. Normal workflow regression
The standard Farmer/Buyer UI workflow works without interruption.

## 16. Authorization regression
Ran `test_authorization.sh` after applying concurrency logic. 
- All 13 previous Phase 4 security tests **PASSED**, maintaining strict RBAC logic.

## 17. Frontend regression
The frontend build (`npm run build`) succeeded. 

## 18. Files changed
- `backend/app/api/offers.py`
- `backend/app/api/transactions.py`
- `backend/app/database/session.py`
- `backend/test_concurrency.py`

## 19. Remaining limitations
- SQLite does not scale well past moderate read/write workloads due to its database-level locks. While the timeout config and CAS prevent overselling completely, if the site achieves huge throughput, write requests might begin to randomly time out (`500`) once the 15-second lock timeout is breached.

## 20. Recommendations
- Migrate to **PostgreSQL** in production, which offers true `SELECT ... FOR UPDATE` row-level locks, vastly improving write-concurrency limits.

## 21. Final verdict
PHASE 5 STATUS: PASS