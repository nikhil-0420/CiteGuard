# Evaluation kit

Rules (from the project description):
1. Label evidence BEFORE running the system (`labeled_before_run = Y`).
2. 8 dev + 32 held-out, split by SOURCE PAPER (never the same paper in dev and held-out).
3. Held-out: 24 accessible (6 each: supported, partial, not_supported, contradicted) + 8 simulated retrieval failures (expected: abstain).
4. Record natural vs synthetic separately.
5. Reference benchmark: public 104-reference dataset (Zenodo, CC BY 4.0). Report TP/FP/FN/TN, precision, recall, unresolved count, technical failures.
   Call it a "historical published comparison", not "we beat five tools".

Fill `claims_template.csv` tonight if anyone has spare time (prep is allowed). Sam writes `run_eval.py` against POST /api/audit.
