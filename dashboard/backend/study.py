"""Deterministic study-workflow logic: progress, deadline distribution, quiz
grading, weak-topic detection. Kept out of engine.py (Gemini) on purpose —
progress math and grading must be exact and reproducible, not model output.
Only "what should the syllabus/plan/quiz content be" goes through Gemini.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

REVIEW_TAG = "review"
STUDY_TAG = "study"
WEAK_TOPIC_THRESHOLD = 70  # a topic scoring below this on a quiz gets a revision task


def _parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s)
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def days_remaining(exam_date: Optional[str], now: datetime) -> Optional[int]:
    dt = _parse_dt(exam_date)
    if not dt:
        return None
    now = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    return max(0, (dt.date() - now.date()).days)


def stage_progress(stage: dict, tasks: list[dict]) -> dict:
    linked = [t for t in tasks if t.get("step_id") == stage["id"]]
    total = len(linked)
    done = sum(1 for t in linked if t.get("status") == "COMPLETED")
    return {
        "id": stage["id"],
        "name": stage["name"],
        "order": stage.get("order", 0),
        "completed": done,
        "total": total,
        "pct": round((done / total) * 100) if total else 0,
    }


def _next_task(tasks: list[dict], stages: list[dict]) -> Optional[dict]:
    """The next recommended task: earliest-order stage with incomplete work,
    then earliest deadline, then earliest id (creation order)."""
    order_by_stage = {s["id"]: s.get("order", 0) for s in stages}
    open_tasks = [t for t in tasks if t.get("status") != "COMPLETED"]
    if not open_tasks:
        return None
    in_progress = [t for t in open_tasks if t.get("status") == "IN_PROGRESS"]
    pool = in_progress or open_tasks

    def key(t: dict):
        return (
            order_by_stage.get(t.get("step_id"), 999),
            t.get("deadline") or "9999",
            t["id"],
        )

    return sorted(pool, key=key)[0]


def compute_progress(workflow: dict, tasks: list[dict], now: Optional[datetime] = None) -> dict:
    now = now or datetime.now(timezone.utc)
    wf_tasks = [t for t in tasks if t.get("workflow_id") == workflow["id"]]
    stages = workflow.get("stages") or []
    stage_prog = [stage_progress(s, wf_tasks) for s in sorted(stages, key=lambda s: s.get("order", 0))]
    total = len(wf_tasks)
    done = sum(1 for t in wf_tasks if t.get("status") == "COMPLETED")

    # A stage is "just finished" (eligible for a quiz) when every one of its
    # tasks is complete, it has at least one task, and no quiz has already
    # been generated for that exact set of topics since it finished.
    quizzed_topics = set()
    for q in workflow.get("quiz_history") or []:
        quizzed_topics.update(q.get("topics") or [])

    quiz_available = False
    quiz_reason = None
    quiz_topics: list[str] = []
    for sp in stage_prog:
        if sp["total"] > 0 and sp["completed"] == sp["total"]:
            stage_tasks = [t for t in wf_tasks if t.get("step_id") == sp["id"]]
            topics = sorted({t.get("topic") for t in stage_tasks if t.get("topic")})
            if topics and not set(topics).issubset(quizzed_topics):
                quiz_available = True
                quiz_reason = f'You’ve finished "{sp["name"]}" — want to test your understanding before moving on?'
                quiz_topics = topics
                break

    return {
        "overall_pct": round((done / total) * 100) if total else 0,
        "completed": done,
        "total": total,
        "stage_progress": stage_prog,
        "next_task": _next_task(wf_tasks, stages),
        "quiz_available": quiz_available,
        "quiz_reason": quiz_reason,
        "quiz_topics": quiz_topics,
        "days_remaining": days_remaining(workflow.get("exam_date"), now),
    }


def redistribute_deadlines(tasks: list[dict], exam_date: Optional[str], hours_per_day: Optional[float],
                            now: Optional[datetime] = None) -> list[dict]:
    """Spread incomplete tasks evenly across the days remaining until
    exam_date, respecting hours_per_day as a per-day time budget. Ordered by
    stage order (via step_id's position in `stages`), then priority, then id
    — i.e. the most important/urgent remaining work lands on earlier days.
    Returns [{task_id, deadline}] to be patched onto each task.
    """
    # Task.deadline is a NAIVE local datetime everywhere else in this app
    # (risk.py, scheduler.py) — never attach tzinfo to the values this
    # function outputs, or every deadline-vs-now comparison downstream
    # breaks with "can't compare offset-naive and offset-aware datetimes".
    now = now or datetime.now()
    days_basis = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    remaining_days = days_remaining(exam_date, days_basis)
    if remaining_days is None:
        remaining_days = max(1, len({t.get("deadline") for t in tasks if t.get("deadline")}) or 7)
    remaining_days = max(1, remaining_days)
    budget_minutes = (hours_per_day or 2) * 60

    urgency_rank = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    incomplete = [t for t in tasks if t.get("status") != "COMPLETED"]
    incomplete.sort(key=lambda t: (urgency_rank.get(t.get("urgency"), 1), t["id"]))

    plan: list[dict] = []
    day = 0
    used_today = 0.0
    for t in incomplete:
        est = t.get("estimated_minutes") or 30
        if used_today + est > budget_minutes and used_today > 0:
            day = min(day + 1, remaining_days - 1)
            used_today = 0.0
        used_today += est
        target = (now + timedelta(days=day)).replace(hour=20, minute=0, second=0, microsecond=0)
        plan.append({"task_id": t["id"], "deadline": target.isoformat()})
    return plan


def assign_initial_deadlines(stage_task_pairs: list[tuple[str, dict]], exam_date: Optional[str],
                              hours_per_day: Optional[float], now: Optional[datetime] = None) -> list[Optional[str]]:
    """Same distribution logic as redistribute_deadlines, but for tasks that
    don't have ids yet (freshly generated, in stage order) — used right after
    a plan is generated, before the tasks are persisted. Returns one deadline
    (or None) per input pair, in the same order."""
    # See redistribute_deadlines — output must stay naive local, same as
    # every other deadline in the app.
    now = now or datetime.now()
    days_basis = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    remaining_days = max(1, days_remaining(exam_date, days_basis) or 7)
    budget_minutes = (hours_per_day or 2) * 60

    out: list[Optional[str]] = []
    day = 0
    used_today = 0.0
    for _stage_id, task in stage_task_pairs:
        est = task.get("estimated_minutes") or 30
        if used_today + est > budget_minutes and used_today > 0:
            day = min(day + 1, remaining_days - 1)
            used_today = 0.0
        used_today += est
        target = (now + timedelta(days=day)).replace(hour=20, minute=0, second=0, microsecond=0)
        out.append(target.isoformat())
    return out


def grade_quiz(questions: list[dict], answers: list[int]) -> dict:
    """questions: [{question, options, correct_index, topic}], answers: list
    of the chosen option index per question (same order), -1/None for
    unanswered. Returns overall score + per-topic breakdown + weak topics."""
    per_topic: dict[str, list[int]] = {}  # topic -> [correct_count, total_count]
    correct_total = 0
    for i, q in enumerate(questions):
        chosen = answers[i] if i < len(answers) else None
        is_correct = chosen is not None and chosen == q.get("correct_index")
        topic = q.get("topic") or "General"
        bucket = per_topic.setdefault(topic, [0, 0])
        bucket[1] += 1
        if is_correct:
            bucket[0] += 1
            correct_total += 1

    total = len(questions)
    per_topic_result = [
        {
            "topic": topic,
            "correct": correct,
            "total": count,
            "score_pct": round((correct / count) * 100) if count else 0,
        }
        for topic, (correct, count) in per_topic.items()
    ]
    weak_topics = [t["topic"] for t in per_topic_result if t["score_pct"] < WEAK_TOPIC_THRESHOLD]
    strong_topics = [t["topic"] for t in per_topic_result if t["score_pct"] >= WEAK_TOPIC_THRESHOLD]

    return {
        "correct": correct_total,
        "total": total,
        "score_pct": round((correct_total / total) * 100) if total else 0,
        "per_topic": per_topic_result,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
    }
