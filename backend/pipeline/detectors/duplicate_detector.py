"""
Duplicate and Similar Work Detector for MPLADS Phase 2.
Calculates TF-IDF and Cosine Similarity over work titles and descriptions within geographic/constituency clusters
to detect potential duplicate or highly similar works.
"""

import sqlite3
import re
from typing import List, Dict, Set
from collections import Counter
import math
from .base import BaseDetector, AnomalyResult

def _tokenize(text: str) -> List[str]:
    """Basic text tokenizer stripping punctuation and short stop words."""
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z0-9]{3,}\b', text.lower())
    stopwords = {"and", "for", "the", "with", "near", "from", "road", "work", "construction", "procurement", "area", "dist"}
    return [w for w in words if w not in stopwords]

def _compute_cosine_sim(tokens1: List[str], tokens2: List[str]) -> float:
    """Compute cosine similarity between token lists."""
    if not tokens1 or not tokens2:
        return 0.0
    vec1 = Counter(tokens1)
    vec2 = Counter(tokens2)
    intersection = set(vec1.keys()) & set(vec2.keys())
    if not intersection:
        return 0.0
    dot_product = sum(vec1[x] * vec2[x] for x in intersection)
    mag1 = math.sqrt(sum(v**2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v**2 for v in vec2.values()))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

class DuplicateWorkDetector(BaseDetector):
    """
    Detects potential duplicate or overlapping works using TF-IDF token cosine similarity
    within state/constituency groupings.
    """

    def __init__(self, similarity_threshold: float = 0.85, version: str = "1.0.0"):
        super().__init__(name="DuplicateWorkDetector", version=version)
        self.similarity_threshold = similarity_threshold

    def detect(self, conn: sqlite3.Connection) -> List[AnomalyResult]:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        query = """
        SELECT
            work_id,
            mp_name,
            state,
            constituency,
            work_category,
            work,
            work_description,
            sanction_amount,
            sanction_date
        FROM work
        WHERE work IS NOT NULL AND TRIM(work) != '';
        """
        rows = cur.execute(query).fetchall()

        # Group works by constituency/state
        groups: Dict[str, List[sqlite3.Row]] = {}
        for r in rows:
            key = f"{r['state'] or 'State'}|{r['constituency'] or 'Constituency'}"
            groups.setdefault(key, []).append(r)

        anomalies: List[AnomalyResult] = []
        flagged_pairs: Set[str] = set()

        for group_key, work_list in groups.items():
            if len(work_list) < 2:
                continue

            # Tokenize all works in group
            token_map = {}
            for w in work_list:
                text_content = f"{w['work'] or ''} {w['work_description'] or ''} {w['work_category'] or ''}"
                token_map[w["work_id"]] = _tokenize(text_content)

            # Cap comparison to max 150 items per group or candidate filtering to avoid N^2 explosion on giant groups
            items = work_list[:150]
            n = len(items)
            for i in range(n):
                w1 = items[i]
                id1 = w1["work_id"]
                tokens1 = token_map[id1]
                if len(tokens1) < 2:
                    continue

                set1 = set(tokens1)
                for j in range(i + 1, n):
                    w2 = items[j]
                    id2 = w2["work_id"]
                    tokens2 = token_map[id2]
                    if len(tokens2) < 2:
                        continue

                    # Quick overlap check before full vector product
                    if len(set1 & set(tokens2)) < 2:
                        continue

                    sim = _compute_cosine_sim(tokens1, tokens2)
                    if sim >= self.similarity_threshold:
                        pair_key = f"{min(id1, id2)}::{max(id1, id2)}"
                        if pair_key in flagged_pairs:
                            continue
                        flagged_pairs.add(pair_key)

                        common_words = list(set1 & set(tokens2))
                        score = round(sim * 100.0, 1)
                        severity = "HIGH" if sim >= 0.95 else "MEDIUM"
                        confidence = min(0.90, round(sim, 2))

                        reason = (
                            f"Work has {sim*100:.1f}% description similarity with Work ID {id2} "
                            f"in {w1['constituency']}, {w1['state']}. "
                            f"Shared keywords: {', '.join(common_words[:5])}."
                        )

                        evidence = {
                            "source_dataset": "work",
                            "compared_work_id": id2,
                            "similarity_score": round(sim, 3),
                            "common_keywords": common_words[:10],
                            "work_1_title": w1["work"],
                            "work_2_title": w2["work"],
                            "sanction_amount_1": w1["sanction_amount"],
                            "sanction_amount_2": w2["sanction_amount"]
                        }

                        comp_group = {"state": w1["state"], "constituency": w1["constituency"]}

                        anomalies.append(AnomalyResult(
                            project_id=id1,
                            anomaly_type="DUPLICATE_WORK_CANDIDATE",
                            score=score,
                            severity=severity,
                            confidence=confidence,
                            reason=reason,
                            evidence=evidence,
                            comparison_group=comp_group,
                            comparison_statistics={"similarity_threshold": self.similarity_threshold, "observed_similarity": round(sim, 3)},
                            detector_name=self.name,
                            detector_version=self.version
                        ))

        return anomalies
