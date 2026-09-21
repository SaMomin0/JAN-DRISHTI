import sqlite3
import re
from pathlib import Path
from difflib import get_close_matches

# ==============================================================
# MPLADS NATURAL LANGUAGE QUERY ENGINE
#
# Safe architecture:
#
# User question
#       ↓
# Intent detection
#       ↓
# Parameter extraction
#       ↓
# Predefined SQL
#       ↓
# SQLite database
#       ↓
# Verified result
#       ↓
# Human-readable answer
# ==============================================================


BASE_DIR = Path(r"D:\SIH_2026")
DB_PATH = BASE_DIR / "database" / "mplads.db"


# ==============================================================
# DATABASE
# ==============================================================

print("=" * 75)
print("MPLADS NATURAL LANGUAGE QUERY ENGINE")
print("=" * 75)

if not DB_PATH.exists():
    print("\nERROR: Database not found:")
    print(DB_PATH)
    raise SystemExit(1)

print(f"\nDatabase:")
print(DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

print("Connected successfully ✓")


# ==============================================================
# DATABASE HELPERS
# ==============================================================

def execute_query(sql, params=()):
    """
    Execute a SELECT query safely using parameterized values.
    """
    cur = conn.cursor()
    return cur.execute(sql, params).fetchall()


def execute_one(sql, params=()):
    """
    Execute a SELECT query expected to return one row.
    """
    cur = conn.cursor()
    return cur.execute(sql, params).fetchone()


# ==============================================================
# FORMATTERS
# ==============================================================

def money(value):
    if value is None:
        return "₹0.00"

    return f"₹{value:,.2f}"


def integer(value):
    if value is None:
        return "0"

    return f"{int(value):,}"


def percentage(value):
    if value is None:
        return "0.00%"

    return f"{value:.2f}%"


def clean_text(value):
    if value is None:
        return ""

    return str(value).strip()


# ==============================================================
# GET DATABASE VALUES
# ==============================================================

states = [
    row["state"]
    for row in execute_query("""
        SELECT DISTINCT state
        FROM mp
        WHERE state IS NOT NULL
          AND TRIM(state) <> ''
        ORDER BY state
    """)
]

mp_names = [
    row["mp_name"]
    for row in execute_query("""
        SELECT mp_name
        FROM mp
        WHERE mp_name IS NOT NULL
        ORDER BY mp_name
    """)
]

constituencies = [
    row["constituency"]
    for row in execute_query("""
        SELECT DISTINCT constituency
        FROM mp
        WHERE constituency IS NOT NULL
          AND TRIM(constituency) <> ''
        ORDER BY constituency
    """)
]


# ==============================================================
# NORMALIZATION
# ==============================================================

def normalize(text):
    text = text.lower().strip()

    # Remove punctuation except useful symbols
    text = re.sub(r"[^\w\s>%₹]", " ", text)

    # Normalize whitespace
    text = re.sub(r"\s+", " ", text)

    return text


# ==============================================================
# ENTITY EXTRACTION
# ==============================================================

def find_state(question):
    """
    Find a known state in the user's question.
    """

    q = normalize(question)

    # Longest first prevents partial matches.
    ordered_states = sorted(
        states,
        key=len,
        reverse=True
    )

    for state in ordered_states:

        state_normalized = normalize(state)

        if state_normalized in q:
            return state

    # Common special spellings
    aliases = {
        "up": "Uttar Pradesh",
        "uttar pradesh": "Uttar Pradesh",
        "j&k": "Jammu And Kashmir",
        "jammu kashmir": "Jammu And Kashmir",
        "jk": "Jammu And Kashmir"
    }

    for alias, actual in aliases.items():

        if re.search(
            r"\b" + re.escape(alias) + r"\b",
            q
        ):
            return actual

    return None


def find_mp(question):
    """
    Try to identify an MP name.

    First searches exact names.
    Then uses fuzzy matching for longer questions.
    """

    q = normalize(question)

    # Exact name matching
    for name in sorted(mp_names, key=len, reverse=True):

        n = normalize(name)

        if n in q:
            return name

    # Token-based fuzzy matching
    words = q.split()

    candidates = []

    for name in mp_names:

        name_normalized = normalize(name)
        name_words = name_normalized.split()

        # Look for at least two meaningful name tokens.
        matching = sum(
            1 for word in name_words
            if word in words and len(word) > 2
        )

        if matching >= 2:
            candidates.append(
                (matching, name)
            )

    if candidates:

        candidates.sort(
            key=lambda x: x[0],
            reverse=True
        )

        return candidates[0][1]

    return None


def find_work_id(question):
    """
    Extract numeric work ID.
    """

    patterns = [
        r"\bwork\s*(?:id)?\s*[:#]?\s*(\d{5,})\b",
        r"\b(?:id|number|no)\s*[:#]?\s*(\d{5,})\b",
        r"\b(\d{6,})\b"
    ]

    q = question.lower()

    for pattern in patterns:

        match = re.search(pattern, q)

        if match:
            return match.group(1)

    return None


def find_percentage(question):
    """
    Extract percentage from question.
    """

    match = re.search(
        r"(\d+(?:\.\d+)?)\s*%",
        question
    )

    if match:
        return float(match.group(1))

    return None


def find_number(question):
    """
    Extract a numeric threshold from natural language.
    """

    match = re.search(
        r"\b(\d+(?:\.\d+)?)\b",
        question
    )

    if match:
        return float(match.group(1))

    return None


# ==============================================================
# INTENT DETECTION
# ==============================================================

def detect_intent(question):

    q = normalize(question)

    # ----------------------------------------------------------
    # Specific work query
    # ----------------------------------------------------------

    if find_work_id(question):

        if (
            "flag" in q
            or "signal" in q
            or "indicator" in q
            or "why" in q
            or "detail" in q
        ):
            return "WORK_DETAILS"

        if (
            "expenditure" in q
            or "spent" in q
            or "payment" in q
        ):
            return "WORK_FINANCIAL"

    # ----------------------------------------------------------
    # No expenditure
    # ----------------------------------------------------------

    if (
        ("no expenditure" in q)
        or ("without expenditure" in q)
        or ("no spending" in q)
    ):
        return "NO_EXPENDITURE"

    # ----------------------------------------------------------
    # Expenditure without completion
    # ----------------------------------------------------------

    if (
        (
            "expenditure" in q
            or "spent" in q
        )
        and (
            "no completion" in q
            or "without completion" in q
            or "not completed" in q
        )
    ):
        return "EXPENDITURE_WITHOUT_COMPLETION"

    # ----------------------------------------------------------
    # Payment in progress
    # ----------------------------------------------------------

    if (
        "payment in progress" in q
        or "payment in-progress" in q
        or "pending payment" in q
        or "payments in progress" in q
    ):
        return "PAYMENT_IN_PROGRESS"

    # ----------------------------------------------------------
    # Multiple transactions
    # ----------------------------------------------------------

    if (
        "multiple transactions" in q
        or "more than one transaction" in q
        or "multiple payments" in q
        or "many transactions" in q
    ):
        return "MULTIPLE_TRANSACTIONS"

    # ----------------------------------------------------------
    # High expenditure ratio
    # ----------------------------------------------------------

    if (
        "90%" in q
        or "90 percent" in q
        or "high expenditure" in q
        or "close to sanction" in q
        or "near sanction" in q
    ):
        return "HIGH_EXPENDITURE_RATIO"

    # ----------------------------------------------------------
    # Long sanction to expenditure
    # ----------------------------------------------------------

    if (
        "long sanction" in q
        or "delayed expenditure" in q
        or "delay in expenditure" in q
        or "sanction to expenditure" in q
    ):
        return "LONG_SANCTION_TO_EXPENDITURE"

    # ----------------------------------------------------------
    # Long sanction to completion
    # ----------------------------------------------------------

    if (
        "long completion" in q
        or "delayed completion" in q
        or "delay in completion" in q
        or "sanction to completion" in q
    ):
        return "LONG_SANCTION_TO_COMPLETION"

    # ----------------------------------------------------------
    # Vendor
    # ----------------------------------------------------------

    if (
        "vendor" in q
        or "contractor" in q
    ):
        if (
            "most" in q
            or "highest" in q
            or "top" in q
            or "concentration" in q
        ):
            return "TOP_VENDORS"

        return "VENDOR_SUMMARY"

    # ----------------------------------------------------------
    # Partially completed MPs
    # ----------------------------------------------------------

    if (
        (
            "mp" in q
            or "member of parliament" in q
            or "members of parliament" in q
        )
        and (
            "partially completed" in q
            or "partial works" in q
            or "partially complete" in q
        )
    ):
        return "MP_PARTIAL_WORKS"

    # ----------------------------------------------------------
    # State expenditure
    # ----------------------------------------------------------

    state = find_state(question)

    if state:

        if (
            "expenditure" in q
            or "spent" in q
            or "spending" in q
        ):
            return "STATE_FINANCIAL"

        if (
            "works" in q
            or "projects" in q
        ):
            return "STATE_WORKS"

    # ----------------------------------------------------------
    # MP financial
    # ----------------------------------------------------------

    mp = find_mp(question)

    if mp:

        if (
            "expenditure" in q
            or "spent" in q
            or "allocation" in q
            or "sanction" in q
            or "works" in q
        ):
            return "MP_FINANCIAL"

    # ----------------------------------------------------------
    # General statistics
    # ----------------------------------------------------------

    if (
        "how many works" in q
        or "total works" in q
        or "number of works" in q
    ):
        return "TOTAL_WORKS"

    if (
        "total expenditure" in q
        or "total spending" in q
        or "how much spent" in q
    ):
        return "TOTAL_EXPENDITURE"

    if (
        "total allocation" in q
        or "allocated amount" in q
    ):
        return "TOTAL_ALLOCATION"

    if (
        "payment summary" in q
        or "payment status" in q
    ):
        return "PAYMENT_SUMMARY"

    return "UNKNOWN"


# ==============================================================
# QUERY FUNCTIONS
# ==============================================================

def query_no_expenditure(question):

    state = find_state(question)

    if state:

        rows = execute_query("""
            SELECT
                work_id,
                mp_name,
                state,
                constituency,
                sanction_amount,
                work_status
            FROM monitoring_work
            WHERE no_expenditure_record = 1
              AND state = ?
            ORDER BY sanction_amount DESC
            LIMIT 100
        """, (state,))

    else:

        rows = execute_query("""
            SELECT
                work_id,
                mp_name,
                state,
                constituency,
                sanction_amount,
                work_status
            FROM monitoring_work
            WHERE no_expenditure_record = 1
            ORDER BY sanction_amount DESC
            LIMIT 100
        """)

    return rows


def query_expenditure_without_completion(question):

    state = find_state(question)

    if state:

        rows = execute_query("""
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
              AND state = ?
            ORDER BY total_expenditure DESC
            LIMIT 100
        """, (state,))

    else:

        rows = execute_query("""
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
            ORDER BY total_expenditure DESC
            LIMIT 100
        """)

    return rows


def query_payment_in_progress(question):

    state = find_state(question)

    if state:

        rows = execute_query("""
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
              AND w.state = ?
            GROUP BY
                e.work_id,
                w.mp_name,
                w.state,
                w.constituency
            ORDER BY total_amount DESC
            LIMIT 100
        """, (state,))

    else:

        rows = execute_query("""
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
            GROUP BY
                e.work_id,
                w.mp_name,
                w.state,
                w.constituency
            ORDER BY total_amount DESC
            LIMIT 100
        """)

    return rows


def query_multiple_transactions(question):

    return execute_query("""
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
        LIMIT 100
    """)


def query_high_expenditure_ratio(question):

    threshold = find_percentage(question)

    if threshold is None:
        threshold = 90.0

    return execute_query("""
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
        ORDER BY expenditure_vs_sanction_percent DESC
        LIMIT 100
    """, (threshold,))


def query_long_sanction_to_expenditure(question):

    days = find_number(question)

    # If user did not explicitly specify a sensible day threshold,
    # use our documented default of 180 days.
    if days is None or days < 1:
        days = 180

    return execute_query("""
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
        LIMIT 100
    """, (days,))


def query_long_sanction_to_completion(question):

    days = find_number(question)

    if days is None or days < 1:
        days = 365

    return execute_query("""
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
        LIMIT 100
    """, (days,))


def query_top_vendors(question):

    return execute_query("""
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
        LIMIT 20
    """)


def query_vendor_summary(question):

    return execute_query("""
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
        LIMIT 100
    """)


def query_mp_partial_works(question):

    state = find_state(question)

    if state:

        return execute_query("""
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
              AND state = ?
            ORDER BY partially_completed_works DESC
            LIMIT 100
        """, (state,))

    return execute_query("""
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
        ORDER BY partially_completed_works DESC
        LIMIT 100
    """)


def query_state_financial(question):

    state = find_state(question)

    if not state:
        return []

    return execute_query("""
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


def query_state_works(question):

    state = find_state(question)

    if not state:
        return []

    return execute_query("""
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
        LIMIT 100
    """, (state,))


def query_mp_financial(question):

    mp = find_mp(question)

    if not mp:
        return []

    return execute_query("""
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
            expenditure_vs_allocation_percent,
            total_calamity_consent
        FROM monitoring_mp
        WHERE mp_name = ?
    """, (mp,))


def query_work_details(question):

    work_id = find_work_id(question)

    if not work_id:
        return []

    rows = execute_query("""
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

    return rows


def query_work_financial(question):

    work_id = find_work_id(question)

    if not work_id:
        return []

    return execute_query("""
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


def query_total_works(question):

    row = execute_one("""
        SELECT COUNT(*) AS total_works
        FROM work
    """)

    return [row]


def query_total_expenditure(question):

    row = execute_one("""
        SELECT
            COUNT(*) AS transaction_count,
            COUNT(DISTINCT work_id) AS work_count,
            SUM(fund_disbursed_amount) AS total_expenditure
        FROM expenditure_transaction
    """)

    return [row]


def query_total_allocation(question):

    row = execute_one("""
        SELECT
            COUNT(*) AS mp_count,
            SUM(allocated_amount) AS total_allocation
        FROM mp
    """)

    return [row]


def query_payment_summary(question):

    return execute_query("""
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
# RESULT DISPLAY
# ==============================================================

def print_table(rows, columns, max_rows=20):

    if not rows:

        print("\nNo matching records found.")
        return

    print(
        f"\nShowing {min(len(rows), max_rows):,} "
        f"of {len(rows):,} returned records:"
    )

    print("\n" + "-" * 120)

    # Header
    header = " | ".join(
        f"{column[:25]:<25}"
        for column in columns
    )

    print(header)
    print("-" * 120)

    for row in rows[:max_rows]:

        values = []

        for column in columns:

            value = row[column]

            if isinstance(value, float):

                if "amount" in column.lower():
                    text = money(value)
                elif "percent" in column.lower():
                    text = percentage(value)
                else:
                    text = f"{value:,.2f}"

            elif isinstance(value, int):

                text = integer(value)

            else:

                text = clean_text(value)

            if len(text) > 25:
                text = text[:22] + "..."

            values.append(
                f"{text:<25}"
            )

        print(" | ".join(values))

    print("-" * 120)


# ==============================================================
# NATURAL LANGUAGE ANSWER
# ==============================================================

def answer(question, intent, rows):

    state = find_state(question)
    mp = find_mp(question)
    work_id = find_work_id(question)

    print("\n" + "=" * 75)
    print("VERIFIED MPLADS RESULT")
    print("=" * 75)

    print(f"\nQuestion: {question}")
    print(f"Detected intent: {intent}")

    if state:
        print(f"State filter: {state}")

    if mp:
        print(f"MP detected: {mp}")

    if work_id:
        print(f"Work ID: {work_id}")

    # ----------------------------------------------------------
    # Special summaries
    # ----------------------------------------------------------

    if intent == "TOTAL_WORKS":

        total = rows[0]["total_works"]

        print(
            f"\nThe database contains "
            f"{integer(total)} works."
        )

        return

    if intent == "TOTAL_EXPENDITURE":

        row = rows[0]

        print(
            f"\nRecorded expenditure: "
            f"{money(row['total_expenditure'])}"
        )

        print(
            f"Transactions: "
            f"{integer(row['transaction_count'])}"
        )

        print(
            f"Works with expenditure: "
            f"{integer(row['work_count'])}"
        )

        return

    if intent == "TOTAL_ALLOCATION":

        row = rows[0]

        print(
            f"\nTotal allocated amount: "
            f"{money(row['total_allocation'])}"
        )

        print(
            f"MP records: "
            f"{integer(row['mp_count'])}"
        )

        return

    if intent == "PAYMENT_SUMMARY":

        print("\nPayment status summary:")

        for row in rows:

            print(
                f"\n{row['payment_status']}"
            )

            print(
                f"  Transactions : "
                f"{integer(row['transaction_count'])}"
            )

            print(
                f"  Works        : "
                f"{integer(row['work_count'])}"
            )

            print(
                f"  Amount       : "
                f"{money(row['total_amount'])}"
            )

        return

    # ----------------------------------------------------------
    # Work details
    # ----------------------------------------------------------

    if intent == "WORK_DETAILS":

        if not rows:
            print(
                f"\nNo work found with ID {work_id}."
            )
            return

        row = rows[0]

        print("\nWORK INFORMATION")
        print("----------------")

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
            f"{percentage(row['expenditure_vs_sanction_percent'])}"
        )
        print(
            f"Transactions  : "
            f"{integer(row['expenditure_transaction_count'])}"
        )
        print(
            f"Completion record : "
            f"{'Yes' if row['has_completion_record'] else 'No'}"
        )

        print("\nMONITORING INDICATORS")
        print("---------------------")

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

            for item in indicators:
                print(f"  • {item}")

        else:

            print("  No configured monitoring indicators.")

        return

    # ----------------------------------------------------------
    # Work financial
    # ----------------------------------------------------------

    if intent == "WORK_FINANCIAL":

        if not rows:
            print(
                f"\nNo work found with ID {work_id}."
            )
            return

        row = rows[0]

        print("\nWORK FINANCIAL SUMMARY")
        print("----------------------")

        print(f"Work ID          : {row['work_id']}")
        print(f"MP               : {row['mp_name']}")
        print(f"State            : {row['state']}")
        print(f"Constituency     : {row['constituency']}")
        print(f"Sanction amount  : {money(row['sanction_amount'])}")
        print(f"Expenditure      : {money(row['total_expenditure'])}")
        print(
            f"Remaining        : "
            f"{money(row['remaining_sanction_amount'])}"
        )
        print(
            f"Expenditure ratio: "
            f"{percentage(row['expenditure_vs_sanction_percent'])}"
        )
        print(
            f"Transactions     : "
            f"{integer(row['expenditure_transaction_count'])}"
        )
        print(
            f"First expenditure: "
            f"{row['first_expenditure_date'] or 'None'}"
        )
        print(
            f"Latest expenditure: "
            f"{row['latest_expenditure_date'] or 'None'}"
        )
        print(
            f"Completion record: "
            f"{'Yes' if row['has_completion_record'] else 'No'}"
        )
        print(
            f"Completion date  : "
            f"{row['completion_date'] or 'None'}"
        )

        return

    # ----------------------------------------------------------
    # MP financial
    # ----------------------------------------------------------

    if intent == "MP_FINANCIAL":

        if not rows:

            print(
                "\nI couldn't identify that MP in the database."
            )

            return

        row = rows[0]

        print("\nMP FINANCIAL SUMMARY")
        print("--------------------")

        print(f"MP                : {row['mp_name']}")
        print(f"State             : {row['state']}")
        print(f"Constituency      : {row['constituency']}")
        print(
            f"Allocation        : "
            f"{money(row['allocated_amount'])}"
        )
        print(
            f"Sanctioned        : "
            f"{money(row['total_sanctioned_amount'])}"
        )
        print(
            f"Expenditure       : "
            f"{money(row['total_expenditure'])}"
        )
        print(
            f"Expenditure / allocation: "
            f"{percentage(row['expenditure_vs_allocation_percent'])}"
        )
        print(
            f"Total works       : "
            f"{integer(row['total_works'])}"
        )
        print(
            f"Completed status  : "
            f"{integer(row['completed_status_works'])}"
        )
        print(
            f"Partially completed: "
            f"{integer(row['partially_completed_works'])}"
        )
        print(
            f"Completion records: "
            f"{integer(row['completion_records'])}"
        )
        print(
            f"Calamity consent  : "
            f"{money(row['total_calamity_consent'])}"
        )

        return

    # ----------------------------------------------------------
    # State financial
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

        print(f"State             : {row['state']}")
        print(
            f"MPs               : "
            f"{integer(row['mp_count'])}"
        )
        print(
            f"Works             : "
            f"{integer(row['total_works'])}"
        )
        print(
            f"Allocated         : "
            f"{money(row['total_allocated_amount'])}"
        )
        print(
            f"Sanctioned        : "
            f"{money(row['total_sanctioned_amount'])}"
        )
        print(
            f"Expenditure       : "
            f"{money(row['total_expenditure'])}"
        )
        print(
            f"Completed status  : "
            f"{integer(row['completed_status_works'])}"
        )
        print(
            f"Partially completed: "
            f"{integer(row['partially_completed_works'])}"
        )

        return

    # ----------------------------------------------------------
    # Everything else
    # ----------------------------------------------------------

    if not rows:

        print("\nNo matching records found.")
        return

    if intent == "NO_EXPENDITURE":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "sanction_amount",
            "work_status"
        ]

    elif intent == "EXPENDITURE_WITHOUT_COMPLETION":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "sanction_amount",
            "total_expenditure",
            "expenditure_transaction_count",
            "work_status"
        ]

    elif intent == "PAYMENT_IN_PROGRESS":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "transaction_count",
            "total_amount"
        ]

    elif intent == "MULTIPLE_TRANSACTIONS":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "expenditure_transaction_count",
            "total_expenditure"
        ]

    elif intent == "HIGH_EXPENDITURE_RATIO":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "sanction_amount",
            "total_expenditure",
            "expenditure_vs_sanction_percent",
            "work_status"
        ]

    elif intent == "LONG_SANCTION_TO_EXPENDITURE":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "sanction_date",
            "first_expenditure_date",
            "days_sanction_to_first_expenditure",
            "sanction_amount",
            "total_expenditure"
        ]

    elif intent == "LONG_SANCTION_TO_COMPLETION":

        columns = [
            "work_id",
            "mp_name",
            "state",
            "constituency",
            "sanction_date",
            "completion_date",
            "days_sanction_to_completion",
            "sanction_amount",
            "total_expenditure"
        ]

    elif intent in (
        "TOP_VENDORS",
        "VENDOR_SUMMARY"
    ):

        columns = [
            "vendor_name",
            "total_works",
            "total_transactions",
            "total_amount_received",
            "average_transaction_amount"
        ]

    elif intent == "MP_PARTIAL_WORKS":

        columns = [
            "mp_id",
            "mp_name",
            "state",
            "constituency",
            "total_works",
            "partially_completed_works",
            "completed_status_works",
            "total_sanctioned_amount",
            "total_expenditure"
        ]

    elif intent == "STATE_WORKS":

        columns = [
            "work_id",
            "mp_name",
            "constituency",
            "work",
            "work_category",
            "sanction_amount",
            "total_expenditure",
            "work_status"
        ]

    else:

        columns = list(rows[0].keys())

    print_table(rows, columns)


# ==============================================================
# MAIN QUERY ROUTER
# ==============================================================

def process_question(question):

    intent = detect_intent(question)

    if intent == "NO_EXPENDITURE":
        rows = query_no_expenditure(question)

    elif intent == "EXPENDITURE_WITHOUT_COMPLETION":
        rows = query_expenditure_without_completion(question)

    elif intent == "PAYMENT_IN_PROGRESS":
        rows = query_payment_in_progress(question)

    elif intent == "MULTIPLE_TRANSACTIONS":
        rows = query_multiple_transactions(question)

    elif intent == "HIGH_EXPENDITURE_RATIO":
        rows = query_high_expenditure_ratio(question)

    elif intent == "LONG_SANCTION_TO_EXPENDITURE":
        rows = query_long_sanction_to_expenditure(question)

    elif intent == "LONG_SANCTION_TO_COMPLETION":
        rows = query_long_sanction_to_completion(question)

    elif intent == "TOP_VENDORS":
        rows = query_top_vendors(question)

    elif intent == "VENDOR_SUMMARY":
        rows = query_vendor_summary(question)

    elif intent == "MP_PARTIAL_WORKS":
        rows = query_mp_partial_works(question)

    elif intent == "STATE_FINANCIAL":
        rows = query_state_financial(question)

    elif intent == "STATE_WORKS":
        rows = query_state_works(question)

    elif intent == "MP_FINANCIAL":
        rows = query_mp_financial(question)

    elif intent == "WORK_DETAILS":
        rows = query_work_details(question)

    elif intent == "WORK_FINANCIAL":
        rows = query_work_financial(question)

    elif intent == "TOTAL_WORKS":
        rows = query_total_works(question)

    elif intent == "TOTAL_EXPENDITURE":
        rows = query_total_expenditure(question)

    elif intent == "TOTAL_ALLOCATION":
        rows = query_total_allocation(question)

    elif intent == "PAYMENT_SUMMARY":
        rows = query_payment_summary(question)

    else:

        print("\n" + "=" * 75)
        print("I DON'T UNDERSTAND THAT QUESTION YET")
        print("=" * 75)

        print("""
Try questions like:

  Show works with no expenditure.

  Show Maharashtra works with no expenditure.

  Show Maharashtra works with expenditure
  but no completion record.

  Which MPs have partially completed works?

  Show payment in-progress works.

  Which vendors have the highest recorded expenditure?

  Show works where expenditure is above 90%.

  Show works with long sanction to expenditure delays.

  Show works with long completion delays.

  How much has been spent in Maharashtra?

  Show expenditure for Pralhad Venkatesh Joshi.

  Show details for work 133167.

  Why was work 133167 flagged?

  What is the total expenditure?

  How many works are there?

  Show payment summary.

  exit
""")

        return

    answer(question, intent, rows)


# ==============================================================
# HELP
# ==============================================================

def show_help():

    print("""
=======================================================================
MPLADS QUERY ENGINE - EXAMPLES
=======================================================================

WORKS
-----
Show works with no expenditure.
Show Maharashtra works with no expenditure.
Show works with expenditure but no completion record.
Show Maharashtra works with expenditure but no completion record.

PAYMENTS
--------
Show payment in-progress works.
Show payment summary.
Show works with multiple transactions.

EXPENDITURE
-----------
Show works where expenditure is above 90%.
Show works where expenditure is above 95%.
Show works with long sanction to expenditure delays.
Show works with long completion delays.

MPs
---
Which MPs have partially completed works?
Which MPs have partially completed works in Maharashtra?
Show expenditure for Pralhad Venkatesh Joshi.

STATE
-----
How much has been spent in Maharashtra?
Show Maharashtra works.

VENDORS
-------
Which vendors have the highest expenditure?
Show top vendors.
Show vendor summary.

SPECIFIC WORK
-------------
Show details for work 133167.
Why was work 133167 flagged?
Show expenditure for work 133167.

GENERAL
-------
How many works are there?
What is the total expenditure?
What is the total allocation?

COMMANDS
--------
help
exit
quit

=======================================================================
""")


# ==============================================================
# INTERACTIVE LOOP
# ==============================================================

print("""
Type your MPLADS question in normal language.

Examples:
  Show works with no expenditure.
  How much has been spent in Maharashtra?
  Show details for work 133167.

Type 'help' for examples.
Type 'exit' to quit.
""")

while True:

    try:

        question = input("\nMPLADS > ").strip()

    except (KeyboardInterrupt, EOFError):

        print("\n\nExiting...")
        break

    if not question:
        continue

    if question.lower() in ("exit", "quit"):

        print("\nGoodbye.")
        break

    if question.lower() == "help":

        show_help()
        continue

    process_question(question)


# ==============================================================
# CLOSE DATABASE
# ==============================================================

conn.close()

print("\nDatabase connection closed.")