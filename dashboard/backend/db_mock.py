"""Mock in-memory database for testing without Firebase credentials."""

from datetime import date, datetime, timezone
from typing import Optional

_data = {
    "tasks": {},
    "reminders": {},
    "goals": {},
    "habits": {},
    "habit_logs": {},
    "sessions": {},
    "projects": {},
    "users": {},
    "calendar_accounts": {},
    "workflows": {},
    "counters": {},
    "chats": {},
    "references": {},
    "quizzes": {},
}

_next_ids = {
    "tasks": 1,
    "reminders": 1,
    "goals": 1,
    "habits": 1,
    "sessions": 1,
    "projects": 1,
    "workflows": 1,
    "references": 1,
    "quizzes": 1,
}


def _db():
    """Mock DB client (always available)."""
    return None


def now_iso() -> str:
    # Kept timezone-aware to match db.py (see its now_iso for why).
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def today_str() -> str:
    return date.today().isoformat()


def init_db() -> None:
    """No-op for mock DB."""
    pass


# --- Tasks
def list_tasks(user_id: str) -> list[dict]:
    # Copies, not the live stored dicts — db.py's Firestore equivalent always
    # returns a fresh snapshot, so code comparing a value fetched here against
    # the same record after a later update_task() call (e.g. was_done/now_done
    # checks) must see the pre-update state, not a reference that update_task
    # mutates in place underneath it.
    return sorted((dict(t) for t in _data["tasks"].values() if t["user_id"] == user_id), key=lambda t: t["id"])


def get_task(task_id: int, user_id: str) -> Optional[dict]:
    task = _data["tasks"].get(task_id)
    return dict(task) if task and task["user_id"] == user_id else None


def create_task(user_id: str, task_name, status="TODO", urgency="MEDIUM", estimated_minutes=30,
                deadline=None, next_micro_step="", goal_id=None, url=None,
                selected_text=None, tags=None, dependencies=None, completed_minutes=0,
                workflow_id=None, step_id=None, subject=None, topic=None) -> dict:
    task_id = _next_ids["tasks"]
    _next_ids["tasks"] += 1
    ts = now_iso()
    task = {
        "id": task_id,
        "user_id": user_id,
        "task_name": task_name,
        "status": status,
        "urgency": urgency,
        "estimated_minutes": estimated_minutes,
        "completed_minutes": completed_minutes or 0,
        "deadline": deadline,
        "next_micro_step": next_micro_step,
        "scheduled_start": None,
        "scheduled_end": None,
        "goal_id": goal_id,
        "workflow_id": workflow_id,
        "step_id": step_id,
        "subject": subject,
        "topic": topic,
        "url": url,
        "selected_text": selected_text,
        "tags": tags or [],
        "dependencies": dependencies or [],
        "calendar_event_id": None,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["tasks"][task_id] = task
    return task


def update_task(task_id: int, user_id: str, **fields) -> Optional[dict]:
    allowed = {"task_name", "status", "urgency", "estimated_minutes", "completed_minutes", "deadline",
               "next_micro_step", "scheduled_start", "scheduled_end", "goal_id", "workflow_id", "step_id",
               "url", "selected_text", "tags", "calendar_event_id", "dependencies", "subject", "topic"}
    task = _data["tasks"].get(task_id)
    if not task or task["user_id"] != user_id:
        return None
    for k, v in fields.items():
        if k in allowed and v is not None:
            task[k] = v
    task["updated_at"] = now_iso()
    return task


def set_schedule(task_id: int, user_id: str, start: Optional[str], end: Optional[str]) -> None:
    task = _data["tasks"].get(task_id)
    if task and task["user_id"] == user_id:
        task["scheduled_start"] = start
        task["scheduled_end"] = end
        task["updated_at"] = now_iso()


def clear_calendar_event(task_id: int, user_id: str) -> None:
    """Drop the stored Google Calendar event id (update_task ignores None, so
    it can set a value but never unset one)."""
    task = _data["tasks"].get(task_id)
    if task and task["user_id"] == user_id:
        task["calendar_event_id"] = None
        task["updated_at"] = now_iso()


def delete_task(task_id: int, user_id: str) -> bool:
    task = _data["tasks"].get(task_id)
    if task and task["user_id"] == user_id:
        del _data["tasks"][task_id]
        return True
    return False


def find_active_by_name(name: str, user_id: str) -> Optional[dict]:
    matches = [t for t in _data["tasks"].values()
               if t["user_id"] == user_id and t.get("status") not in ("COMPLETED", "ARCHIVED")
               and (t.get("task_name") or "").lower() == name.lower()]
    return max(matches, key=lambda t: t["id"]) if matches else None


def find_by_calendar_event(event_id: str, user_id: str) -> Optional[dict]:
    matches = [t for t in _data["tasks"].values()
               if t["user_id"] == user_id and t.get("calendar_event_id") == event_id]
    return matches[0] if matches else None


def upsert_from_engine(task: dict, user_id: str) -> dict:
    existing = find_active_by_name(task["task_name"], user_id)
    if existing:
        return update_task(existing["id"], user_id, status=task.get("status"), urgency=task.get("urgency_level"),
                           estimated_minutes=task.get("estimated_minutes"), deadline=task.get("deadline"),
                           next_micro_step=task.get("next_micro_step"))  # type: ignore[return-value]
    return create_task(user_id, task_name=task["task_name"], status=task.get("status", "TODO"),
                       urgency=task.get("urgency_level", "MEDIUM"),
                       estimated_minutes=task.get("estimated_minutes", 30),
                       deadline=task.get("deadline"), next_micro_step=task.get("next_micro_step", ""))


# --- Reminders
def list_reminders(user_id: str, include_ack: bool = False) -> list[dict]:
    items = [r for r in _data["reminders"].values() if r["user_id"] == user_id]
    if not include_ack:
        items = [r for r in items if not r.get("acknowledged")]
    return sorted(items, key=lambda r: r.get("remind_at") or "")


def create_reminder(user_id: str, message: str, remind_at: str, kind: str = "CUSTOM", task_id: Optional[int] = None) -> dict:
    reminder_id = _next_ids["reminders"]
    _next_ids["reminders"] += 1
    reminder = {
        "id": reminder_id,
        "user_id": user_id,
        "task_id": task_id,
        "message": message,
        "remind_at": remind_at,
        "kind": kind,
        "acknowledged": 0,
        "created_at": now_iso(),
    }
    _data["reminders"][reminder_id] = reminder
    return reminder


def ack_reminder(rid: int, user_id: str) -> bool:
    reminder = _data["reminders"].get(rid)
    if reminder and reminder["user_id"] == user_id:
        reminder["acknowledged"] = 1
        return True
    return False


def delete_reminder(rid: int, user_id: str) -> bool:
    reminder = _data["reminders"].get(rid)
    if reminder and reminder["user_id"] == user_id:
        del _data["reminders"][rid]
        return True
    return False


def clear_auto_reminders(user_id: str) -> None:
    to_delete = [r["id"] for r in _data["reminders"].values()
                 if r["user_id"] == user_id and r.get("kind") != "CUSTOM"]
    for rid in to_delete:
        del _data["reminders"][rid]


# --- Goals
def list_goals(user_id: str) -> list[dict]:
    tasks = [t for t in _data["tasks"].values() if t["user_id"] == user_id]
    goals = sorted((dict(g) for g in _data["goals"].values() if g["user_id"] == user_id), key=lambda g: g["id"])
    for g in goals:
        linked = [t for t in tasks if t.get("goal_id") == g["id"]]
        g["linked_total"] = len(linked)
        g["linked_done"] = sum(1 for t in linked if t.get("status") == "COMPLETED")
    return goals


def get_goal(gid: int, user_id: str) -> Optional[dict]:
    goal = _data["goals"].get(gid)
    return dict(goal) if goal and goal["user_id"] == user_id else None


def create_goal(user_id: str, title, description="", metric="steps", target_value=1, deadline=None) -> dict:
    goal_id = _next_ids["goals"]
    _next_ids["goals"] += 1
    ts = now_iso()
    goal = {
        "id": goal_id,
        "user_id": user_id,
        "title": title,
        "description": description,
        "metric": metric,
        "target_value": target_value,
        "current_value": 0,
        "deadline": deadline,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["goals"][goal_id] = goal
    return goal


def update_goal(gid: int, user_id: str, **fields) -> Optional[dict]:
    allowed = {"title", "description", "metric", "target_value", "current_value", "deadline"}
    goal = _data["goals"].get(gid)
    if not goal or goal["user_id"] != user_id:
        return None
    for k, v in fields.items():
        if k in allowed and v is not None:
            goal[k] = v
    goal["updated_at"] = now_iso()
    return goal


def adjust_goal(gid: int, user_id: str, delta: int) -> Optional[dict]:
    g = get_goal(gid, user_id)
    if not g:
        return None
    return update_goal(gid, user_id, current_value=max(0, g["current_value"] + delta))


def delete_goal(gid: int, user_id: str) -> bool:
    goal = _data["goals"].get(gid)
    if goal and goal["user_id"] == user_id:
        for t in _data["tasks"].values():
            if t["user_id"] == user_id and t.get("goal_id") == gid:
                t["goal_id"] = None
        del _data["goals"][gid]
        return True
    return False


# --- Habits
def list_habits_raw(user_id: str) -> list[dict]:
    return sorted((dict(h) for h in _data["habits"].values() if h["user_id"] == user_id), key=lambda h: h["id"])


def habit_log_dates(habit_id: int) -> list[str]:
    dates = [l["done_date"] for l in _data["habit_logs"].values() if l.get("habit_id") == habit_id]
    return sorted(dates)


def create_habit(user_id: str, name: str, cadence: str = "DAILY") -> dict:
    habit_id = _next_ids["habits"]
    _next_ids["habits"] += 1
    habit = {
        "id": habit_id,
        "user_id": user_id,
        "name": name,
        "cadence": cadence,
        "created_at": now_iso(),
    }
    _data["habits"][habit_id] = habit
    return habit


def get_habit(hid: int, user_id: str) -> Optional[dict]:
    habit = _data["habits"].get(hid)
    return dict(habit) if habit and habit["user_id"] == user_id else None


def toggle_habit_today(hid: int, user_id: str) -> bool:
    """Toggle today's completion."""
    if not get_habit(hid, user_id):
        return False
    today = today_str()
    doc_id = f"{hid}_{today}"
    if doc_id in _data["habit_logs"]:
        del _data["habit_logs"][doc_id]
        return False
    _data["habit_logs"][doc_id] = {"habit_id": hid, "done_date": today}
    return True


def delete_habit(hid: int, user_id: str) -> bool:
    habit = _data["habits"].get(hid)
    if not habit or habit["user_id"] != user_id:
        return False
    to_delete = [k for k, v in _data["habit_logs"].items() if v.get("habit_id") == hid]
    for k in to_delete:
        del _data["habit_logs"][k]
    del _data["habits"][hid]
    return True


# --- Sessions
def list_sessions(user_id: str) -> list[dict]:
    return sorted((dict(s) for s in _data["sessions"].values() if s["user_id"] == user_id), key=lambda s: s["id"])


def get_session(session_id: int, user_id: str) -> Optional[dict]:
    session = _data["sessions"].get(session_id)
    return dict(session) if session and session["user_id"] == user_id else None


def create_session(user_id: str, description: str = "", project_id: Optional[int] = None, duration_minutes: int = 0,
                    task_id: Optional[int] = None, current_step_id: Optional[str] = None) -> dict:
    session_id = _next_ids["sessions"]
    _next_ids["sessions"] += 1
    ts = now_iso()
    session = {
        "id": session_id,
        "user_id": user_id,
        "description": description,
        "project_id": project_id,
        "task_id": task_id,
        "current_step_id": current_step_id,
        "start_time": ts,
        "end_time": None,
        "duration_minutes": duration_minutes,
        "is_paused": False,
        "breaks_taken": 0,
        "total_break_minutes": 0,
        "calendar_event_id": None,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["sessions"][session_id] = session
    return session


def update_session(session_id: int, user_id: str, **fields) -> Optional[dict]:
    allowed = {"description", "project_id", "end_time", "duration_minutes",
               "is_paused", "breaks_taken", "total_break_minutes", "calendar_event_id",
               "task_id", "current_step_id"}
    session = _data["sessions"].get(session_id)
    if not session or session["user_id"] != user_id:
        return None
    for k, v in fields.items():
        if k in allowed and v is not None:
            session[k] = v
    session["updated_at"] = now_iso()
    return session


def delete_session(session_id: int, user_id: str) -> bool:
    session = _data["sessions"].get(session_id)
    if session and session["user_id"] == user_id:
        del _data["sessions"][session_id]
        return True
    return False


# --- References — mirrors db.py's (Context screen's "saved for this task"
# working set: title, url, optional short user-selected snippet, task_id).
def list_references(user_id: str, task_id: Optional[int] = None) -> list[dict]:
    refs = [dict(r) for r in _data["references"].values() if r["user_id"] == user_id]
    if task_id is not None:
        refs = [r for r in refs if r.get("task_id") == task_id]
    return sorted(refs, key=lambda r: r["id"], reverse=True)


def create_reference(user_id: str, title: str, url: str = "", task_id: Optional[int] = None,
                      snippet: str = "") -> dict:
    ref_id = _next_ids["references"]
    _next_ids["references"] += 1
    ref = {
        "id": ref_id,
        "user_id": user_id,
        "title": title,
        "url": url,
        "task_id": task_id,
        "snippet": snippet,
        "created_at": now_iso(),
    }
    _data["references"][ref_id] = ref
    return ref


def delete_reference(reference_id: int, user_id: str) -> bool:
    ref = _data["references"].get(reference_id)
    if ref and ref["user_id"] == user_id:
        del _data["references"][reference_id]
        return True
    return False


# --- Workflows (AI Workflow Builder)
def list_workflows(user_id: str) -> list[dict]:
    return sorted((dict(w) for w in _data["workflows"].values() if w["user_id"] == user_id), key=lambda w: w["id"])


def get_workflow(workflow_id: int, user_id: str) -> Optional[dict]:
    workflow = _data["workflows"].get(workflow_id)
    return dict(workflow) if workflow and workflow["user_id"] == user_id else None


def create_workflow(user_id: str, name: str, sop_text: str, trigger_type: str,
                     trigger_match: str, steps: list[dict], active: bool = True) -> dict:
    workflow_id = _next_ids["workflows"]
    _next_ids["workflows"] += 1
    ts = now_iso()
    workflow = {
        "id": workflow_id,
        "user_id": user_id,
        "kind": "AUTOMATION",
        "name": name,
        "sop_text": sop_text,
        "trigger_type": trigger_type,
        "trigger_match": trigger_match,
        "steps": steps,
        "active": active,
        "last_run": None,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["workflows"][workflow_id] = workflow
    return workflow


def create_study_workflow(user_id: str, name: str, subject: str, canonical_subject: str,
                           goal_summary: str = "") -> dict:
    workflow_id = _next_ids["workflows"]
    _next_ids["workflows"] += 1
    ts = now_iso()
    workflow = {
        "id": workflow_id,
        "user_id": user_id,
        "kind": "STUDY_PLAN",
        "name": name,
        "sop_text": "",
        "trigger_type": "MANUAL",
        "trigger_match": "",
        "steps": [],
        "active": True,
        "last_run": None,
        "subject": subject,
        "canonical_subject": canonical_subject,
        "goal_summary": goal_summary,
        "exam_date": None,
        "hours_per_day": None,
        "target": "",
        "level": "",
        "syllabus_topics": [],
        "status": "PLANNING",
        "stages": [],
        "plan_summary": "",
        "weak_topics": [],
        "quiz_history": [],
        "goal_id": None,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["workflows"][workflow_id] = workflow
    return workflow


def update_workflow(workflow_id: int, user_id: str, **fields) -> Optional[dict]:
    allowed = {
        "name", "sop_text", "trigger_type", "trigger_match", "steps", "active", "last_run",
        "kind", "subject", "canonical_subject", "goal_summary", "exam_date", "hours_per_day",
        "target", "level", "syllabus_topics", "status", "stages", "plan_summary", "weak_topics",
        "quiz_history", "goal_id",
    }
    workflow = _data["workflows"].get(workflow_id)
    if not workflow or workflow["user_id"] != user_id:
        return None
    for k, v in fields.items():
        if k in allowed and v is not None:
            workflow[k] = v
    workflow["updated_at"] = now_iso()
    return workflow


def find_study_workflow_by_subject(user_id: str, canonical_subject: str) -> Optional[dict]:
    subject_lc = canonical_subject.strip().lower()
    candidates = [
        w for w in list_workflows(user_id)
        if w.get("kind") == "STUDY_PLAN"
        and (w.get("canonical_subject") or "").strip().lower() == subject_lc
        and w.get("status") != "COMPLETED"
    ]
    return max(candidates, key=lambda w: w["id"]) if candidates else None


def list_study_workflows(user_id: str) -> list[dict]:
    return [w for w in list_workflows(user_id) if w.get("kind") == "STUDY_PLAN"]


# --- Quizzes (Study Planner review)
def create_quiz(user_id: str, workflow_id: int, subject: str, topics: list[str], questions: list[dict]) -> dict:
    quiz_id = _next_ids["quizzes"]
    _next_ids["quizzes"] += 1
    ts = now_iso()
    quiz = {
        "id": quiz_id,
        "user_id": user_id,
        "workflow_id": workflow_id,
        "subject": subject,
        "topics": topics,
        "questions": questions,
        "submitted": False,
        "answers": None,
        "result": None,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["quizzes"][quiz_id] = quiz
    return quiz


def get_quiz(quiz_id: int, user_id: str) -> Optional[dict]:
    quiz = _data["quizzes"].get(quiz_id)
    return dict(quiz) if quiz and quiz["user_id"] == user_id else None


def submit_quiz(quiz_id: int, user_id: str, answers: list[int], result: dict) -> Optional[dict]:
    quiz = _data["quizzes"].get(quiz_id)
    if not quiz or quiz["user_id"] != user_id:
        return None
    quiz["submitted"] = True
    quiz["answers"] = answers
    quiz["result"] = result
    quiz["updated_at"] = now_iso()
    return quiz


def list_quizzes(user_id: str, workflow_id: Optional[int] = None) -> list[dict]:
    items = [dict(q) for q in _data["quizzes"].values() if q["user_id"] == user_id]
    if workflow_id is not None:
        items = [q for q in items if q.get("workflow_id") == workflow_id]
    return sorted(items, key=lambda q: q["id"])


def delete_workflow(workflow_id: int, user_id: str) -> bool:
    workflow = _data["workflows"].get(workflow_id)
    if workflow and workflow["user_id"] == user_id:
        del _data["workflows"][workflow_id]
        return True
    return False


# --- Projects
def list_projects(user_id: str) -> list[dict]:
    return sorted((dict(p) for p in _data["projects"].values() if p["user_id"] == user_id), key=lambda p: p["id"])


def get_project(project_id: int, user_id: str) -> Optional[dict]:
    project = _data["projects"].get(project_id)
    return dict(project) if project and project["user_id"] == user_id else None


def create_project(user_id: str, name: str, color: str = "#2563eb") -> dict:
    project_id = _next_ids["projects"]
    _next_ids["projects"] += 1
    ts = now_iso()
    project = {
        "id": project_id,
        "user_id": user_id,
        "name": name,
        "color": color,
        "created_at": ts,
        "updated_at": ts,
    }
    _data["projects"][project_id] = project
    return project


def update_project(project_id: int, user_id: str, **fields) -> Optional[dict]:
    allowed = {"name", "color"}
    project = _data["projects"].get(project_id)
    if not project or project["user_id"] != user_id:
        return None
    for k, v in fields.items():
        if k in allowed and v is not None:
            project[k] = v
    project["updated_at"] = now_iso()
    return project


def delete_project(project_id: int, user_id: str) -> bool:
    project = _data["projects"].get(project_id)
    if project and project["user_id"] == user_id:
        for s in _data["sessions"].values():
            if s["user_id"] == user_id and s.get("project_id") == project_id:
                s["project_id"] = None
        del _data["projects"][project_id]
        return True
    return False


# --- Chat sessions (Dashboard AI chat, persisted so a refresh/restart
# restores the conversation)
def get_chat(session_id: str, user_id: str) -> Optional[dict]:
    chat = _data["chats"].get(session_id)
    if chat and chat.get("user_id") != user_id:
        return None
    return chat


def append_chat_message(session_id: str, user_id: str, role: str, content: str) -> Optional[dict]:
    existing = _data["chats"].get(session_id)
    if existing and existing.get("user_id") != user_id:
        return None
    ts = now_iso()
    messages = (existing or {}).get("messages", [])
    messages = messages + [{"id": len(messages) + 1, "role": role, "content": content, "timestamp": ts}]
    doc = {
        "id": session_id,
        "user_id": user_id,
        "messages": messages,
        "created_at": existing["created_at"] if existing else ts,
        "updated_at": ts,
    }
    _data["chats"][session_id] = doc
    return doc


# --- Users (Google login identity, persisted instead of staying client-only)
def get_user(user_id: str) -> Optional[dict]:
    return _data["users"].get(user_id)


def upsert_user(user_id: str, email: str = "", name: str = "", picture: Optional[str] = None) -> dict:
    existing = _data["users"].get(user_id)
    ts = now_iso()
    user = {
        **(existing or {}),
        "id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "created_at": existing["created_at"] if existing else ts,
        "updated_at": ts,
    }
    _data["users"][user_id] = user
    return user


def set_user_consent(user_id: str, version: str) -> dict:
    """Record acceptance of the data-use notice on the user's profile."""
    ts = now_iso()
    user = {**_data["users"].get(user_id, {"id": user_id, "created_at": ts}),
            "consent_accepted_at": ts, "consent_version": version, "updated_at": ts}
    _data["users"][user_id] = user
    return user


# Mirrors db.py: per-user collections wiped by delete_user_data (not `users`).
_USER_COLLECTIONS = (
    "tasks", "workflows", "sessions", "goals", "habits", "habit_logs",
    "reminders", "projects", "task_events", "chats", "references", "quizzes",
)


def export_user_data(user_id: str) -> dict:
    out = {"exported_at": now_iso(), "user": _data["users"].get(user_id)}
    for name in _USER_COLLECTIONS:
        out[name] = [d for d in _data.get(name, {}).values() if d.get("user_id") == user_id]
    out["memory"] = get_memory_facts(user_id)
    return out


def delete_user_data(user_id: str) -> dict:
    counts = {}
    for name in _USER_COLLECTIONS:
        bucket = _data.get(name, {})
        ids = [k for k, v in bucket.items() if v.get("user_id") == user_id]
        for k in ids:
            del bucket[k]
        counts[name] = len(ids)
    counts["memory"] = len(_data.setdefault("memory", {}).pop(user_id, []))
    if _data["calendar_accounts"].pop(user_id, None) is not None:
        counts["calendar_accounts"] = 1
    return counts


# --- Long-term behavioral memory ---------------------------------------------
def log_task_event(user_id: str, task_id: int, task_name: str, tags, event: str,
                    planned_start, planned_end) -> dict:
    event_id = _next_ids.setdefault("task_events", 1)
    _next_ids["task_events"] += 1
    ts = now_iso()
    rec = {
        "id": event_id, "user_id": user_id, "task_id": task_id, "task_name": task_name,
        "tags": tags or [], "event": event, "planned_start": planned_start, "planned_end": planned_end,
        "actual_at": ts, "created_at": ts,
    }
    _data.setdefault("task_events", {})[event_id] = rec
    return rec


def list_task_events(user_id: str) -> list[dict]:
    return sorted((e for e in _data.get("task_events", {}).values() if e["user_id"] == user_id), key=lambda e: e["id"])


def get_memory_facts(user_id: str) -> list[dict]:
    return sorted(_data.setdefault("memory", {}).get(user_id, []), key=lambda f: f.get("id", 0))


def set_memory_facts(user_id: str, facts: list[str]) -> list[dict]:
    ts = now_iso()
    saved = [{"id": i, "fact": fact, "created_at": ts} for i, fact in enumerate(facts, start=1)]
    _data.setdefault("memory", {})[user_id] = saved
    return saved


def set_memory_checkpoint(user_id: str, event_count: int) -> None:
    user = _data["users"].get(user_id)
    if user:
        user["memory_event_count"] = event_count
        user["memory_summarized_at"] = now_iso()


# --- Google Calendar accounts
def get_calendar_account(user_id: str) -> Optional[dict]:
    return _data["calendar_accounts"].get(user_id)


def save_calendar_account(user_id: str, refresh_token: str, access_token: str, expires_at: float) -> dict:
    account = {
        "id": user_id,
        "refresh_token": refresh_token,
        "access_token": access_token,
        "expires_at": expires_at,
        "updated_at": now_iso(),
    }
    _data["calendar_accounts"][user_id] = account
    return account


def update_calendar_access_token(user_id: str, access_token: str, expires_at: float) -> None:
    account = _data["calendar_accounts"].get(user_id)
    if account:
        account["access_token"] = access_token
        account["expires_at"] = expires_at


def delete_calendar_account(user_id: str) -> bool:
    if user_id in _data["calendar_accounts"]:
        del _data["calendar_accounts"][user_id]
        return True
    return False
