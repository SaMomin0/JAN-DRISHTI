import sqlite3
import re
from pathlib import Path

# ==============================================================
# MPLADS SMART NATURAL LANGUAGE QUERY ENGINE
# Version 2
#
# Safe design:
# Natural language
#       ↓
# Intent + entity extraction
#       ↓
# Predefined SQL
#       ↓
# SQLite
#       ↓
# Verified result
# ==============================================================


BASE_DIR = Path(r"D:\SIH_2026")
DB_PATH = BASE_DIR / "database" / "mplads.db"


# ==============================================================
# START
# ==============================================================

print("=" * 75)
print("MPLADS SMART NATURAL LANGUAGE QUERY ENGINE")
print("=" * 75)

if not DB_PATH.exists():
    print("\nERROR: Database not found:")
    print(DB_PATH)
    raise SystemExit(1)

print(f"\nDatabase:")
print(DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

print("Connected successfully.")


# ==============================================================
# DATABASE HELPERS
# ==============================================================

def query(sql, params=()):
    cur = conn.cursor()
    return cur.execute(sql, params).fetchall()


def one(sql, params=()):
    cur = conn.cursor()
    return cur.execute(sql, params).fetchone()


# ==============================================================
# FORMATTERS
# ==============================================================

def money(value):
    if value is None:
        return "₹0.00"
    return f"₹{value:,.2f}"


def number(value):
    if value is None:
        return "0"
    return f"{int(value):,}"


def pct(value):
    if value is None:
        return "0.00%"
    return f"{float(value):.2f}%"


# ==============================================================
# NORMALIZATION
# ==============================================================

def normalize(text):

    text = text.lower().strip()

    # Common spelling corrections.
    replacements = {
        "summaray": "summary",
        "summery": "summary",
        "higest": "highest",
        "heighest": "highest",
        "highst": "highest",
        "expediture": "expenditure",
        "expendeture": "expenditure",
        "sanctioned amount": "sanction amount",
        "projects": "works",
        "project": "work",
        "spending": "expenditure",
        "spent": "expenditure",
        "spend": "expenditure",
        "budget": "allocation",
        "budgets": "allocation",
        "pending payment": "payment in progress",
        "pending payments": "payment in progress",
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    text = re.sub(r"[^\w\s%₹]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text


# ==============================================================
# LOAD ENTITIES
# ==============================================================

states = [
    row["state"]
    for row in query("""
        SELECT DISTINCT state
        FROM mp
        WHERE state IS NOT NULL
          AND TRIM(state) <> ''
        ORDER BY LENGTH(state) DESC
    """)
]

mp_names = [
    row["mp_name"]
    for row in query("""
        SELECT mp_name
        FROM mp
        WHERE mp_name IS NOT NULL
        ORDER BY LENGTH(mp_name) DESC
    """)
]

constituencies = [
    row["constituency"]
    for row in query("""
        SELECT DISTINCT constituency
        FROM mp
        WHERE constituency IS NOT NULL
          AND TRIM(constituency) <> ''
        ORDER BY LENGTH(constituency) DESC
    """)
]


# ==============================================================
# ENTITY EXTRACTION
# ==============================================================

def find_state(question):

    q = normalize(question)

    aliases = {
        "up": "Uttar Pradesh",
        "uttar pradesh": "Uttar Pradesh",
        "jammu kashmir": "Jammu And Kashmir",
        "jammu and kashmir": "Jammu And Kashmir",
        "j&k": "Jammu And Kashmir",
        "jk": "Jammu And Kashmir",
    }

    for alias, actual in aliases.items():

        if re.search(
            r"\b" + re.escape(alias) + r"\b",
            q
        ):
            return actual

    for state in states:

        if normalize(state) in q:
            return state

    return None


def find_mp(question):

    q = normalize(question)

    for name in mp_names:

        if normalize(name) in q:
            return name

    # Token matching for names with small spelling differences.
    q_words = set(q.split())

    best_name = None
    best_score = 0

    for name in mp_names:

        words = set(normalize(name).split())

        if not words:
            continue

        score = len(words.intersection(q_words))

        if score > best_score and score >= 2:
            best_score = score
            best_name = name

    return best_name


def find_work_id(question):

    patterns = [
        r"\bwork\s*(?:id)?\s*[:#]?\s*(\d{5,})\b",
        r"\b(?:id|number|no)\s*[:#]?\s*(\d{5,})\b",
        r"\b(\d{6,})\b"
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            question.lower()
        )

        if match:
            return match.group(1)

    return None


def find_percentage(question):

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*%",
        question
    )

    if match:
        return float(match.group(1))

    return None


def find_limit(question, default=20):

    q = normalize(question)

    # top 10 / first 10 / show 10
    patterns = [
        r"\btop\s+(\d+)\b",
        r"\bfirst\s+(\d+)\b",
        r"\bshow\s+(\d+)\b",
        r"\blimit\s+(\d+)\b",
    ]

    for pattern in patterns:

        match = re.search(pattern, q)

        if match:
            value = int(match.group(1))

            return max(1, min(value, 500))

    if "all" in q:
        return 500

    return default


def find_days(question, default=None):

    q = normalize(question)

    patterns = [
        r"(\d+)\s+days?",
        r"more than\s+(\d+)\s+days?",
        r"over\s+(\d+)\s+days?"
    ]

    for pattern in patterns:

        match = re.search(pattern, q)

        if match:
            return int(match.group(1))

    return default


# ==============================================================
# INTENT DETECTION
# ==============================================================

def detect_intent(question):

    q = normalize(question)

    work_id = find_work_id(question)
    state = find_state(question)
    mp = find_mp(question)

    # ----------------------------------------------------------
    # SPECIFIC WORK
    # ----------------------------------------------------------

    if work_id:

        if any(word in q for word in [
            "why",
            "flag",
            "signal",
            "indicator",
            "detail",
            "details"
        ]):
            return "WORK_DETAILS"

        if any(word in q for word in [
            "expenditure",
            "payment",
            "spent",
            "money",
            "financial"
        ]):
            return "WORK_FINANCIAL"

    # ----------------------------------------------------------
    # COUNTS
    # ----------------------------------------------------------

    if (
        ("how many" in q or "number of" in q or "count of" in q)
        and "work" in q
    ):
        return "TOTAL_WORKS"

    if (
        ("how many" in q or "number of" in q)
        and "mp" in q
    ):
        return "TOTAL_MPS"

    # ----------------------------------------------------------
    # PAYMENT
    # ----------------------------------------------------------

    if (
        "payment summary" in q
        or "payment status" in q
        or "payment in progress" in q
        or "payment" in q and (
            "pending" in q
            or "status" in q
            or "summary" in q
        )
    ):

        if (
            "summary" in q
            or "status" in q
        ):
            return "PAYMENT_SUMMARY"

        return "PAYMENT_IN_PROGRESS"

    # ----------------------------------------------------------
    # NO EXPENDITURE
    # ----------------------------------------------------------

    if (
        "no expenditure" in q
        or "without expenditure" in q
        or "no spending" in q
        or "not spent" in q
    ):
        return "NO_EXPENDITURE"

    # ----------------------------------------------------------
    # EXPENDITURE WITHOUT COMPLETION
    # ----------------------------------------------------------

    if (
        "expenditure" in q
        and (
            "no completion" in q
            or "without completion" in q
            or "not completed" in q
        )
    ):
        return "EXPENDITURE_WITHOUT_COMPLETION"

    # ----------------------------------------------------------
    # MULTIPLE TRANSACTIONS
    # ----------------------------------------------------------

    if (
        "multiple transaction" in q
        or "multiple payment" in q
        or "more than one transaction" in q
        or "many transactions" in q
    ):
        return "MULTIPLE_TRANSACTIONS"

    # ----------------------------------------------------------
    # HIGHEST / LOWEST SANCTION
    # ----------------------------------------------------------

    if (
        "highest sanction" in q
        or "highest sanctioned" in q
        or "largest sanction" in q
        or "largest sanctioned" in q
        or "maximum sanction" in q
        or "maximum sanctioned" in q
    ):
        return "TOP_SANCTIONED_WORKS"

    if (
        "lowest sanction" in q
        or "lowest sanctioned" in q
        or "smallest sanction" in q
        or "minimum sanction" in q
    ):
        return "LOWEST_SANCTIONED_WORKS"

    # ----------------------------------------------------------
    # HIGHEST / LOWEST EXPENDITURE
    # ----------------------------------------------------------

    if (
        "highest expenditure" in q
        or "highest spending" in q
        or "most expenditure" in q
        or "most spent" in q
        or "largest expenditure" in q
        or "maximum expenditure" in q
    ):
        return "TOP_EXPENDITURE_WORKS"

    if (
        "lowest expenditure" in q
        or "least expenditure" in q
        or "smallest expenditure" in q
    ):
        return "LOWEST_EXPENDITURE_WORKS"

    # ----------------------------------------------------------
    # HIGH EXPENDITURE RATIO
    # ----------------------------------------------------------

    percentage_value = find_percentage(question)

    if (
        percentage_value is not None
        and (
            "expenditure" in q
            or "spent" in q
        )
    ):
        return "HIGH_EXPENDITURE_RATIO"

    if (
        "high expenditure ratio" in q
        or "near sanction" in q
        or "close to sanction" in q
        or "high spending ratio" in q
    ):
        return "HIGH_EXPENDITURE_RATIO"

    # ----------------------------------------------------------
    # LONG DELAYS
    # ----------------------------------------------------------

    if (
        "sanction to expenditure" in q
        or "sanction to first expenditure" in q
        or "delay in expenditure" in q
        or "delayed expenditure" in q
    ):
        return "LONG_SANCTION_TO_EXPENDITURE"

    if (
        "sanction to completion" in q
        or "delay in completion" in q
        or "delayed completion" in q
        or "long completion" in q
    ):
        return "LONG_SANCTION_TO_COMPLETION"

    # ----------------------------------------------------------
    # VENDORS
    # ----------------------------------------------------------

    if "vendor" in q or "contractor" in q:

        if any(word in q for word in [
            "highest",
            "top",
            "most",
            "largest"
        ]):
            return "TOP_VENDORS"

        return "VENDOR_SUMMARY"

    # ----------------------------------------------------------
    # PARTIAL MP
    # ----------------------------------------------------------

    if (
        "mp" in q
        and (
            "partially completed" in q
            or "partial works" in q
            or "partially complete" in q
        )
    ):
        return "MP_PARTIAL_WORKS"

    # ----------------------------------------------------------
    # STATE
    # ----------------------------------------------------------

    if state:

        if any(word in q for word in [
            "expenditure",
            "spending",
            "spent",
            "allocation",
            "sanction",
            "money"
        ]):
            return "STATE_FINANCIAL"

        if "works" in q:
            return "STATE_WORKS"

    # ----------------------------------------------------------
    # MP
    # ----------------------------------------------------------

    if mp:

        if any(word in q for word in [
            "expenditure",
            "spending",
            "spent",
            "allocation",
            "sanction",
            "works",
            "money"
        ]):
            return "MP_FINANCIAL"

    # ----------------------------------------------------------
    # GENERAL FINANCIAL
    # ----------------------------------------------------------

    if (
        "total expenditure" in q
        or "total spending" in q
        or "how much expenditure" in q
        or "how much spent" in q
    ):
        return "TOTAL_EXPENDITURE"

    if (
        "total allocation" in q
        or "allocated amount" in q
        or "total budget" in q
    ):
        return "TOTAL_ALLOCATION"

    if (
        "how many mps" in q
        or "number of mps" in q
        or "total mps" in q
    ):
        return "TOTAL_MPS"

    return "UNKNOWN"


# ==============================================================
# QUERY FUNCTIONS
# ==============================================================

def no_expenditure(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_amount,
            work_status
        FROM monitoring_work
        WHERE no_expenditure_record = 1
    """

    params = []

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY sanction_amount DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def expenditure_without_completion(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_amount,
            total_expenditure,
            expenditure_transaction_count,
            work_status
        FROM monitoring_work
        WHERE expenditure_without_completion_record = 1
    """

    params = []

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY total_expenditure DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def payment_in_progress(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            e.work_id,
            w.mp_name,
            w.state,
            w.constituency,
            COUNT(*) AS transaction_count,
            SUM(e.fund_disbursed_amount) AS total_amount
        FROM expenditure_transaction e
        JOIN work w
          ON e.work_id = w.work_id
        WHERE LOWER(TRIM(e.payment_status))
              = 'payment in-progress'
    """

    params = []

    if state:
        sql += " AND w.state = ?"
        params.append(state)

    sql += """
        GROUP BY
            e.work_id,
            w.mp_name,
            w.state,
            w.constituency
        ORDER BY total_amount DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def multiple_transactions(question):

    limit = find_limit(question)

    return query("""
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            expenditure_transaction_count,
            total_expenditure
        FROM monitoring_work
        WHERE expenditure_transaction_count > 1
        ORDER BY expenditure_transaction_count DESC,
                 total_expenditure DESC
        LIMIT ?
    """, (limit,))


def top_sanctioned(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            work,
            sanction_amount,
            total_expenditure,
            work_status
        FROM monitoring_work
    """

    params = []

    if state:
        sql += " WHERE state = ?"
        params.append(state)

    sql += """
        ORDER BY sanction_amount DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def lowest_sanctioned(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            work,
            sanction_amount,
            total_expenditure,
            work_status
        FROM monitoring_work
        WHERE sanction_amount > 0
    """

    params = []

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY sanction_amount ASC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def top_expenditure(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            work,
            sanction_amount,
            total_expenditure,
            expenditure_vs_sanction_percent,
            work_status
        FROM monitoring_work
        WHERE total_expenditure > 0
    """

    params = []

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY total_expenditure DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def lowest_expenditure(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_amount,
            total_expenditure,
            work_status
        FROM monitoring_work
        WHERE total_expenditure > 0
    """

    params = []

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY total_expenditure ASC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def high_expenditure_ratio(question):

    threshold = find_percentage(question)

    if threshold is None:
        threshold = 90

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_amount,
            total_expenditure,
            expenditure_vs_sanction_percent,
            work_status
        FROM monitoring_work
        WHERE expenditure_vs_sanction_percent >= ?
          AND sanction_amount > 0
    """

    params = [threshold]

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY expenditure_vs_sanction_percent DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def long_sanction_to_expenditure(question):

    days = find_days(question, 180)
    limit = find_limit(question)

    return query("""
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_date,
            first_expenditure_date,
            days_sanction_to_first_expenditure,
            sanction_amount,
            total_expenditure
        FROM monitoring_work
        WHERE days_sanction_to_first_expenditure >= ?
        ORDER BY days_sanction_to_first_expenditure DESC
        LIMIT ?
    """, (days, limit))


def long_sanction_to_completion(question):

    days = find_days(question, 365)
    limit = find_limit(question)

    return query("""
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_date,
            completion_date,
            days_sanction_to_completion,
            sanction_amount,
            total_expenditure
        FROM monitoring_work
        WHERE days_sanction_to_completion >= ?
        ORDER BY days_sanction_to_completion DESC
        LIMIT ?
    """, (days, limit))


def top_vendors(question):

    limit = find_limit(question, 20)

    return query("""
        SELECT
            vendor_name,
            total_works,
            total_transactions,
            total_amount_received,
            average_transaction_amount,
            first_payment_date,
            latest_payment_date
        FROM monitoring_vendor
        WHERE vendor_name IS NOT NULL
          AND TRIM(vendor_name) <> ''
        ORDER BY total_amount_received DESC
        LIMIT ?
    """, (limit,))


def vendor_summary(question):

    limit = find_limit(question, 20)

    return query("""
        SELECT
            vendor_name,
            total_works,
            total_transactions,
            total_amount_received,
            average_transaction_amount
        FROM monitoring_vendor
        WHERE vendor_name IS NOT NULL
          AND TRIM(vendor_name) <> ''
        ORDER BY total_amount_received DESC
        LIMIT ?
    """, (limit,))


def mp_partial_works(question):

    state = find_state(question)
    limit = find_limit(question)

    sql = """
        SELECT
            mp_id,
            mp_name,
            state,
            constituency,
            total_works,
            partially_completed_works,
            completed_status_works,
            total_sanctioned_amount,
            total_expenditure
        FROM monitoring_mp
        WHERE partially_completed_works > 0
    """

    params = []

    if state:
        sql += " AND state = ?"
        params.append(state)

    sql += """
        ORDER BY partially_completed_works DESC
        LIMIT ?
    """

    params.append(limit)

    return query(sql, params)


def state_financial(question):

    state = find_state(question)

    if not state:
        return []

    return query("""
        SELECT
            state,
            mp_count,
            total_works,
            completed_status_works,
            partially_completed_works,
            total_allocated_amount,
            total_sanctioned_amount,
            total_expenditure
        FROM monitoring_state
        WHERE state = ?
    """, (state,))


def state_works(question):

    state = find_state(question)
    limit = find_limit(question)

    if not state:
        return []

    return query("""
        SELECT
            work_id,
            mp_name,
            constituency,
            work,
            work_category,
            sanction_amount,
            total_expenditure,
            work_status
        FROM monitoring_work
        WHERE state = ?
        ORDER BY sanction_amount DESC
        LIMIT ?
    """, (state, limit))


def mp_financial(question):

    mp = find_mp(question)

    if not mp:
        return []

    return query("""
        SELECT
            mp_id,
            mp_name,
            state,
            constituency,
            allocated_amount,
            total_works,
            completed_status_works,
            partially_completed_works,
            completion_records,
            total_sanctioned_amount,
            total_expenditure,
            CASE
                WHEN allocated_amount > 0
                THEN (total_expenditure * 100.0 / allocated_amount)
                ELSE 0
            END AS expenditure_vs_allocation_percent,
            total_calamity_consent
        FROM monitoring_mp
        WHERE mp_name = ?
    """, (mp,))


def work_details(question):

    work_id = find_work_id(question)

    if not work_id:
        return []

    return query("""
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            work,
            work_category,
            work_description,
            recommended_date,
            sanction_date,
            sanction_amount,
            work_status,
            expenditure_transaction_count,
            total_expenditure,
            first_expenditure_date,
            latest_expenditure_date,
            has_completion_record,
            completion_date,
            completion_amount_disbursed,
            expenditure_vs_sanction_percent,
            remaining_sanction_amount,
            expenditure_exceeds_sanction,
            no_expenditure_record,
            expenditure_without_completion_record,
            partially_completed_status,
            completed_status,
            days_sanction_to_first_expenditure,
            days_sanction_to_completion
        FROM monitoring_work
        WHERE work_id = ?
    """, (work_id,))


def work_financial(question):

    work_id = find_work_id(question)

    if not work_id:
        return []

    return query("""
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            sanction_amount,
            total_expenditure,
            remaining_sanction_amount,
            expenditure_vs_sanction_percent,
            expenditure_transaction_count,
            first_expenditure_date,
            latest_expenditure_date,
            has_completion_record,
            completion_date,
            completion_amount_disbursed
        FROM monitoring_work
        WHERE work_id = ?
    """, (work_id,))


def total_works(question):

    state = find_state(question)

    if state:

        return query("""
            SELECT COUNT(*) AS total_works
            FROM work
            WHERE state = ?
        """, (state,))

    return query("""
        SELECT COUNT(*) AS total_works
        FROM work
    """)


def total_mps(question):

    state = find_state(question)

    if state:

        return query("""
            SELECT COUNT(*) AS total_mps
            FROM mp
            WHERE state = ?
        """, (state,))

    return query("""
        SELECT COUNT(*) AS total_mps
        FROM mp
    """)


def total_expenditure(question):

    state = find_state(question)

    if state:

        return query("""
            SELECT
                COUNT(*) AS transaction_count,
                COUNT(DISTINCT work_id) AS work_count,
                SUM(fund_disbursed_amount) AS total_expenditure
            FROM expenditure_transaction
            WHERE state = ?
        """, (state,))

    return query("""
        SELECT
            COUNT(*) AS transaction_count,
            COUNT(DISTINCT work_id) AS work_count,
            SUM(fund_disbursed_amount) AS total_expenditure
        FROM expenditure_transaction
    """)


def total_allocation(question):

    state = find_state(question)

    if state:

        return query("""
            SELECT
                COUNT(*) AS mp_count,
                SUM(allocated_amount) AS total_allocation
            FROM mp
            WHERE state = ?
        """, (state,))

    return query("""
        SELECT
            COUNT(*) AS mp_count,
            SUM(allocated_amount) AS total_allocation
        FROM mp
    """)


def payment_summary(question):

    return query("""
        SELECT
            payment_status,
            transaction_count,
            work_count,
            total_amount,
            average_transaction_amount
        FROM monitoring_payment
        ORDER BY total_amount DESC
    """)


# ==============================================================
# TABLE DISPLAY
# ==============================================================

def display_table(rows, limit):

    if not rows:

        print("\nNo matching records found.")
        return

    columns = list(rows[0].keys())

    print(
        f"\nReturned {len(rows):,} record(s)."
    )

    print("\n" + "-" * 130)

    header = " | ".join(
        f"{c[:24]:<24}"
        for c in columns
    )

    print(header)
    print("-" * 130)

    for row in rows[:limit]:

        values = []

        for column in columns:

            value = row[column]

            if value is None:
                text = "None"

            elif isinstance(value, float):

                if (
                    "amount" in column.lower()
                    or "expenditure" in column.lower()
                    or "allocation" in column.lower()
                    or "sanction" in column.lower()
                ):
                    text = money(value)

                elif "percent" in column.lower():
                    text = pct(value)

                else:
                    text = f"{value:,.2f}"

            elif isinstance(value, int):

                if (
                    "amount" in column.lower()
                    or "expenditure" in column.lower()
                    or "allocation" in column.lower()
                    or "sanction" in column.lower()
                ):
                    text = money(value)

                else:
                    text = number(value)

            else:
                text = str(value)

            if len(text) > 24:
                text = text[:21] + "..."

            values.append(
                f"{text:<24}"
            )

        print(" | ".join(values))

    print("-" * 130)


# ==============================================================
# ANSWER
# ==============================================================

def answer(question, intent, rows):

    print("\n" + "=" * 75)
    print("VERIFIED MPLADS RESULT")
    print("=" * 75)

    print(f"\nQuestion: {question}")
    print(f"Intent: {intent}")

    state = find_state(question)
    mp = find_mp(question)
    work_id = find_work_id(question)

    if state:
        print(f"State: {state}")

    if mp:
        print(f"MP: {mp}")

    if work_id:
        print(f"Work ID: {work_id}")

    # ----------------------------------------------------------
    # COUNTS
    # ----------------------------------------------------------

    if intent == "TOTAL_WORKS":

        if not rows:
            print("\nNo result.")
            return

        print(
            f"\nTotal works: "
            f"{number(rows[0]['total_works'])}"
        )

        return

    if intent == "TOTAL_MPS":

        if not rows:
            print("\nNo result.")
            return

        print(
            f"\nTotal MPs: "
            f"{number(rows[0]['total_mps'])}"
        )

        return

    # ----------------------------------------------------------
    # TOTAL EXPENDITURE
    # ----------------------------------------------------------

    if intent == "TOTAL_EXPENDITURE":

        if not rows:
            print("\nNo result.")
            return

        row = rows[0]

        print(
            f"\nTotal expenditure: "
            f"{money(row['total_expenditure'])}"
        )

        print(
            f"Transactions: "
            f"{number(row['transaction_count'])}"
        )

        print(
            f"Works with expenditure: "
            f"{number(row['work_count'])}"
        )

        return

    # ----------------------------------------------------------
    # TOTAL ALLOCATION
    # ----------------------------------------------------------

    if intent == "TOTAL_ALLOCATION":

        if not rows:
            print("\nNo result.")
            return

        row = rows[0]

        print(
            f"\nTotal allocation: "
            f"{money(row['total_allocation'])}"
        )

        print(
            f"MP records: "
            f"{number(row['mp_count'])}"
        )

        return

    # ----------------------------------------------------------
    # PAYMENT SUMMARY
    # ----------------------------------------------------------

    if intent == "PAYMENT_SUMMARY":

        if not rows:
            print("\nNo payment records found.")
            return

        print("\nPAYMENT SUMMARY")

        for row in rows:

            print(
                f"\n{row['payment_status']}"
            )

            print(
                f"  Transactions : "
                f"{number(row['transaction_count'])}"
            )

            print(
                f"  Works        : "
                f"{number(row['work_count'])}"
            )

            print(
                f"  Amount       : "
                f"{money(row['total_amount'])}"
            )

        return

    # ----------------------------------------------------------
    # SPECIFIC WORK
    # ----------------------------------------------------------

    if intent == "WORK_DETAILS":

        if not rows:

            print(
                f"\nWork {work_id} was not found."
            )

            return

        row = rows[0]

        print("\nWORK DETAILS")
        print("------------")

        print(f"Work ID       : {row['work_id']}")
        print(f"MP            : {row['mp_name']}")
        print(f"State         : {row['state']}")
        print(f"Constituency  : {row['constituency']}")
        print(f"Category      : {row['work_category']}")
        print(f"Status        : {row['work_status']}")
        print(f"Sanction      : {money(row['sanction_amount'])}")
        print(f"Expenditure   : {money(row['total_expenditure'])}")
        print(
            f"Expenditure % : "
            f"{pct(row['expenditure_vs_sanction_percent'])}"
        )
        print(
            f"Transactions  : "
            f"{number(row['expenditure_transaction_count'])}"
        )
        print(
            f"Completion record: "
            f"{'Yes' if row['has_completion_record'] else 'No'}"
        )

        print("\nMONITORING INDICATORS")

        indicators = []

        if row["no_expenditure_record"]:
            indicators.append("No expenditure record")

        if row["expenditure_without_completion_record"]:
            indicators.append(
                "Expenditure without completion record"
            )

        if row["expenditure_exceeds_sanction"]:
            indicators.append(
                "Expenditure exceeds sanction"
            )

        if row["partially_completed_status"]:
            indicators.append(
                "Source status: partially completed"
            )

        if row["completed_status"]:
            indicators.append(
                "Source status: completed"
            )

        if row["expenditure_transaction_count"] > 1:
            indicators.append(
                "Multiple expenditure transactions"
            )

        if indicators:

            for indicator in indicators:
                print(f"  • {indicator}")

        else:

            print("  No configured monitoring indicators.")

        return

    # ----------------------------------------------------------
    # WORK FINANCIAL
    # ----------------------------------------------------------

    if intent == "WORK_FINANCIAL":

        if not rows:

            print(
                f"\nWork {work_id} was not found."
            )

            return

        row = rows[0]

        print("\nWORK FINANCIAL SUMMARY")
        print("----------------------")

        print(f"Work ID          : {row['work_id']}")
        print(f"MP               : {row['mp_name']}")
        print(f"State            : {row['state']}")
        print(f"Constituency     : {row['constituency']}")
        print(f"Sanction         : {money(row['sanction_amount'])}")
        print(f"Expenditure      : {money(row['total_expenditure'])}")
        print(
            f"Remaining       : "
            f"{money(row['remaining_sanction_amount'])}"
        )
        print(
            f"Expenditure ratio: "
            f"{pct(row['expenditure_vs_sanction_percent'])}"
        )
        print(
            f"Transactions     : "
            f"{number(row['expenditure_transaction_count'])}"
        )
        print(
            f"First expenditure: "
            f"{row['first_expenditure_date'] or 'None'}"
        )
        print(
            f"Latest expenditure: "
            f"{row['latest_expenditure_date'] or 'None'}"
        )

        return

    # ----------------------------------------------------------
    # MP FINANCIAL
    # ----------------------------------------------------------

    if intent == "MP_FINANCIAL":

        if not rows:

            print(
                "\nI could not identify that MP."
            )

            return

        row = rows[0]

        print("\nMP FINANCIAL SUMMARY")
        print("--------------------")

        print(f"MP: {row['mp_name']}")
        print(f"State: {row['state']}")
        print(f"Constituency: {row['constituency']}")
        print(
            f"Allocation: "
            f"{money(row['allocated_amount'])}"
        )
        print(
            f"Sanctioned: "
            f"{money(row['total_sanctioned_amount'])}"
        )
        print(
            f"Expenditure: "
            f"{money(row['total_expenditure'])}"
        )
        print(
            f"Expenditure / Allocation: "
            f"{pct(row['expenditure_vs_allocation_percent'])}"
        )
        print(
            f"Works: "
            f"{number(row['total_works'])}"
        )
        print(
            f"Completed status: "
            f"{number(row['completed_status_works'])}"
        )
        print(
            f"Partially completed: "
            f"{number(row['partially_completed_works'])}"
        )

        return

    # ----------------------------------------------------------
    # STATE FINANCIAL
    # ----------------------------------------------------------

    if intent == "STATE_FINANCIAL":

        if not rows:

            print(
                f"\nState '{state}' was not found."
            )

            return

        row = rows[0]

        print("\nSTATE FINANCIAL SUMMARY")
        print("-----------------------")

        print(f"State: {row['state']}")
        print(f"MPs: {number(row['mp_count'])}")
        print(f"Works: {number(row['total_works'])}")
        print(
            f"Allocation: "
            f"{money(row['total_allocated_amount'])}"
        )
        print(
            f"Sanctioned: "
            f"{money(row['total_sanctioned_amount'])}"
        )
        print(
            f"Expenditure: "
            f"{money(row['total_expenditure'])}"
        )

        return

    # ----------------------------------------------------------
    # TABLE RESULTS
    # ----------------------------------------------------------

    limit = find_limit(question)

    display_table(
        rows,
        limit
    )


# ==============================================================
# ROUTER
# ==============================================================

def process_question(question):

    intent = detect_intent(question)

    if intent == "NO_EXPENDITURE":
        rows = no_expenditure(question)

    elif intent == "EXPENDITURE_WITHOUT_COMPLETION":
        rows = expenditure_without_completion(question)

    elif intent == "PAYMENT_IN_PROGRESS":
        rows = payment_in_progress(question)

    elif intent == "MULTIPLE_TRANSACTIONS":
        rows = multiple_transactions(question)

    elif intent == "TOP_SANCTIONED_WORKS":
        rows = top_sanctioned(question)

    elif intent == "LOWEST_SANCTIONED_WORKS":
        rows = lowest_sanctioned(question)

    elif intent == "TOP_EXPENDITURE_WORKS":
        rows = top_expenditure(question)

    elif intent == "LOWEST_EXPENDITURE_WORKS":
        rows = lowest_expenditure(question)

    elif intent == "HIGH_EXPENDITURE_RATIO":
        rows = high_expenditure_ratio(question)

    elif intent == "LONG_SANCTION_TO_EXPENDITURE":
        rows = long_sanction_to_expenditure(question)

    elif intent == "LONG_SANCTION_TO_COMPLETION":
        rows = long_sanction_to_completion(question)

    elif intent == "TOP_VENDORS":
        rows = top_vendors(question)

    elif intent == "VENDOR_SUMMARY":
        rows = vendor_summary(question)

    elif intent == "MP_PARTIAL_WORKS":
        rows = mp_partial_works(question)

    elif intent == "STATE_FINANCIAL":
        rows = state_financial(question)

    elif intent == "STATE_WORKS":
        rows = state_works(question)

    elif intent == "MP_FINANCIAL":
        rows = mp_financial(question)

    elif intent == "WORK_DETAILS":
        rows = work_details(question)

    elif intent == "WORK_FINANCIAL":
        rows = work_financial(question)

    elif intent == "TOTAL_WORKS":
        rows = total_works(question)

    elif intent == "TOTAL_MPS":
        rows = total_mps(question)

    elif intent == "TOTAL_EXPENDITURE":
        rows = total_expenditure(question)

    elif intent == "TOTAL_ALLOCATION":
        rows = total_allocation(question)

    elif intent == "PAYMENT_SUMMARY":
        rows = payment_summary(question)

    else:

        print("\n" + "=" * 75)
        print("I DON'T UNDERSTAND THAT QUESTION YET")
        print("=" * 75)

        print("""
Try:

  how many works
  how many works in Maharashtra
  total expenditure
  total allocation

  highest sanction amount
  highest sanction amount top 10
  highest expenditure
  lowest sanction amount

  show payment summary
  show payment summaray

  Maharashtra works with no expenditure
  Maharashtra works with expenditure but no completion

  which MPs have partially completed works

  show top vendors
  which vendors have the highest expenditure

  show details for work 133167
  why was work 133167 flagged?

  show works where expenditure is above 95%

  show works with delays of more than 180 days

  exit
""")

        return

    answer(question, intent, rows)


# ==============================================================
# HELP
# ==============================================================

print("""
Type a question about the MPLADS database.

Examples:

  how many works
  how many works in Maharashtra
  how many MPs

  highest sanction amount
  highest sanction amount top 10
  highest expenditure top 10
  lowest sanction amount

  show payment summary
  show payment summaray

  Maharashtra works with no expenditure

  Maharashtra works with expenditure
  but no completion

  which MPs have partially completed works

  how much has been spent in Maharashtra

  show top vendors

  show details for work 133167

  why was work 133167 flagged?

  show works where expenditure is above 95%

Type:
  help
  exit
""")


# ==============================================================
# INTERACTIVE LOOP
# ==============================================================

while True:

    try:

        question = input("\nMPLADS > ").strip()

    except (KeyboardInterrupt, EOFError):

        print("\nExiting...")
        break

    if not question:
        continue

    if question.lower() in ("exit", "quit"):
        print("\nGoodbye.")
        break

    if question.lower() == "help":

        print("""
Examples:

  how many works
  how many works in Maharashtra
  total expenditure
  total allocation

  highest sanction amount
  highest sanction amount top 10
  highest expenditure top 10
  lowest sanction amount

  show payment summary
  show payment summaray

  Maharashtra works with no expenditure
  Maharashtra works with expenditure but no completion

  which MPs have partially completed works

  how much has been spent in Maharashtra

  show top vendors

  show details for work 133167
  why was work 133167 flagged?

  show works where expenditure is above 95%
""")

        continue

    process_question(question)


# ==============================================================
# CLOSE
# ==============================================================

conn.close()

print("\nDatabase connection closed.")