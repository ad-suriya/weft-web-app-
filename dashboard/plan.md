# WEFT — Full Idea for the Team

### Tagline

> **One goal. Every device. One continuous workflow.**

## 1. What are we building?

**WEFT is a cross-device work execution system** for students and knowledge workers.

Instead of being another task manager, WEFT connects the user's **Android phone, laptop and browser** around the work they are actually doing.

It takes a goal like:

> "I need to prepare for my FLA exam."

and turns it into a live workflow:

```text
FLA Exam Preparation

✓ CFG
✓ Regular Expressions
→ CNF Conversion
○ Solve PYQs
○ Revision
```

While the user works, WEFT maintains the **actual state of the work**, not just a completed/incomplete checkbox.

---

# 2. The core problem

Most productivity tools answer:

> **What do I need to do?**

But they don't properly answer:

> **What was I doing?**

> **Where did I stop?**

> **What context was I using?**

> **What should I do next?**

Real work happens across multiple devices and applications.

For example:

```text
Phone
↓
"I need to finish my assignment"

Laptop
↓
Browser research
↓
PDF
↓
VS Code
↓
Notes

Interruption
↓
Laptop closed

Next day
↓
"What was I doing?"
```

WEFT solves the **loss of work context**.

---

# 3. The core concept

The fundamental unit isn't just a **task**.

It's a **work state**.

```text
USER GOAL
    ↓
WORKFLOW
    ↓
CURRENT STEP
    ↓
ACTUAL WORK
    ↓
CONTEXT
    ↓
EVIDENCE
    ↓
WORK STATE
    ↓
NEXT ACTION
    ↓
RESUME
```

WEFT continuously maintains this state across devices.

---

# 4. Three surfaces, three jobs

This is very important.

## Android App = CONTROL

The phone is not a second dashboard.

It handles:

* Quick task creation
* Voice capture
* Start/pause work sessions
* Focus controls
* Notifications
* Current work
* Resume work

Example:

> **FLA Exam Preparation**
> Current: CNF Conversion
> Next: Complete example 2
> **[ Resume Work ]**

---

## Laptop = EXECUTION

The laptop is where the actual work happens.

Examples:

* IDE
* Documents
* PDFs
* College LMS
* Research
* Browser

WEFT doesn't replace these tools.

It coordinates them.

---

## Browser Extension = CONTEXT

The extension understands the user's **task-related browser context**.

It can show:

```text
CURRENT WORK
FLA Exam Preparation

CURRENT STEP
→ CNF Conversion

THIS PAGE
CNF Conversion Tutorial

✓ Relevant to current workflow

[ SAVE REFERENCE ]
```

It also allows quick task creation without leaving the laptop.

---

# 5. Tasks can be created anywhere

This is important because users shouldn't need to switch devices.

### From phone

> "Add CN assignment."

### From browser extension

> "Submit CN assignment tomorrow."

### From dashboard

> "Prepare for FLA exam."

All three update the same shared state.

```text
             SHARED STATE
             /     |      \
            /      |       \
       Android   Laptop   Browser
```

---

# 6. Task vs Work Session

We should clearly distinguish these.

### Task

Something the user needs to accomplish.

> Finish CN assignment.

### Work Session

The user is actively working on that task.

> CN assignment → Solving Q3.

This allows WEFT to know when it should actually monitor work context and coordinate devices.

---

# 7. Browser context

During an active WEFT work session, the extension can understand limited task-related context such as:

* Website/domain
* Page title
* Relevant tabs
* Explicitly saved references
* Work-session duration
* Task-related actions

Example:

```text
Task:
CN Assignment

Current step:
Subnetting

Browser:
College LMS
Subnetting tutorial
CN notes

Saved:
3 references
```

### Privacy principle

WEFT should **not** collect everything.

Avoid:

* Passwords
* Credit card information
* Private messages
* Keystrokes
* Full browsing history
* Continuous screenshots
* Unrelated browsing
* Incognito activity

Detailed page content should only be captured when the user explicitly chooses something like:

> **Save Reference**

The positioning should be:

> **Task-related context, not surveillance.**

---

# 8. Focus Bridge

This is our Android/laptop integration.

When the user starts:

> **FLA Exam Work Session**

WEFT can activate the user's chosen focus configuration.

Example:

```text
LAPTOP
● FLA Exam Preparation
● Working

        ↕ WEFT

PHONE
● Study Focus ACTIVE

Allowed
✓ Family
✓ Emergency

Muted
Social
Shopping
Entertainment
```

The important thing is that it is **task-aware**, rather than simply:

> "VS Code opened → DND."

The user explicitly defines their focus rules.

---

# 9. Persistent work state

This is the most important feature.

Instead of:

```text
CN Assignment
Incomplete
```

WEFT stores:

```text
CN Assignment

Progress: 4 / 7

✓ Read questions
✓ Research
✓ Q1
✓ Q2

CURRENT
→ Q3

Last activity:
Solved subnetting example

Saved:
3 references
2 notes

NEXT ACTION:
→ Finish Q3
```

---

# 10. Interruption and resume

This should be one of the biggest demo moments.

User stops working.

WEFT saves:

```text
SESSION PAUSED

FLA Exam Preparation

You stopped at:
→ CNF Conversion

Last activity:
Solved example 1

Next action:
Complete example 2

[ RESUME WORK ]
```

The next day:

> **Welcome back.**

> You stopped at CNF Conversion.

> **Resume?**

The user doesn't have to reconstruct their environment manually.

### Core message:

> **Resume the work, not the setup.**

---

# 11. Context switching

If the user suddenly leaves the workflow, WEFT shouldn't behave like a generic screen-time tracker.

Instead of:

> YouTube: 30 minutes

it can understand:

```text
CONTEXT SWITCH

You were working on:
FLA Exam Preparation

Current step:
CNF Conversion

30 minutes outside the workflow.

[ RETURN TO WORK ]
[ I'M TAKING A BREAK ]
```

This is about **work continuity**, not judging the user.

---

# 12. Dashboard

The dashboard should focus on the user's **current work state**.

### Navigation

```text
TODAY
MY WORK
WORKFLOWS
CONTEXT
DEVICES
ACTIVITY
SETTINGS
```

Avoid turning it into a huge productivity suite.

### Main dashboard

Show:

**CURRENT WORK**

> FLA Exam Preparation
> → CNF Conversion
> 4/7 complete

**NEXT ACTION**

> Complete CNF example 2

**LAST SESSION**

> Yesterday
> Stopped at CNF example 2

**WORKSPACE**

```text
Laptop     ● Active
Browser    ● 3 relevant tabs
Phone      ● Study Focus
```

---

# 13. Architecture

```text
                       WEFT
                        │
                   USER GOAL
                        │
                        ↓
                 WORKFLOW ENGINE
                        │
                        ↓
                  SHARED STATE
                        │
          ┌─────────────┼─────────────┐
          ↓             ↓             ↓
       ANDROID        LAPTOP        BROWSER
       CONTROL       EXECUTE        CONTEXT
          │             │             │
          └─────────────┼─────────────┘
                        ↓
                  WORK STATE
                        ↓
                   NEXT ACTION
                        ↓
                     RESUME
```

### Technical components

**LLM**

* Understand natural-language goals
* Generate workflows
* Extract steps
* Suggest next actions
* Summarize context

**Workflow engine**

* Owns task state
* Manages dependencies
* Tracks progress
* Handles transitions

**Sync layer**

* Android ↔ backend
* Browser ↔ backend
* Dashboard ↔ backend

**Browser extension**

* Provides task-related context
* Captures explicit references
* Tracks active work session

**Android**

* Quick capture
* Focus/notification controls
* Session control
* Resume experience

---

# 14. State machine

A task/work session can move through:

```text
NOT_STARTED
      ↓
IN_PROGRESS
      ↓
PAUSED
      ↓
IN_PROGRESS
      ↓
COMPLETED
```

The state contains more than a checkbox:

```text
Task
Current step
Progress
Device
Application
Browser context
Timestamp
Evidence
Last action
Next action
```

This gives us genuine technical depth.

---

# 15. What makes WEFT different?

We should **not** claim that every individual feature is new.

There are already:

* Task managers
* Focus apps
* Browser context tools
* Cross-device systems
* AI browser agents
* Work-resume tools

Our differentiation is the **integration around live work state**.

### Traditional tools

```text
Task manager → What do I need to do?
Focus app   → Block distractions
Browser tool → Save tabs
Sync tool   → Connect devices
```

### WEFT

```text
                  USER GOAL
                     ↓
                  WORKFLOW
                     ↓
                ACTUAL WORK
                     ↓
              WORK CONTEXT
                     ↓
               DEVICE STATE
                     ↓
              PERSISTENT STATE
                     ↓
                NEXT ACTION
                     ↓
                  RESUME
```

The idea is:

> **WEFT connects intention with the actual state of work across devices.**

---

# 16. What we should NOT build

For the hackathon, don't expand into a generic productivity super-app.

Avoid:

* Habits
* Generic AI chatbot
* Full calendar replacement
* Gamification
* Continuous GPS
* Bluetooth beacons
* Fitness tracking
* Social features
* Generic screen-time tracker
* Hundreds of automations

They dilute the main concept.

---

# 17. MVP

If time is limited, this is enough:

### MUST WORK

**1. Create task anywhere**

↓

**2. AI generates workflow**

↓

**3. Start work session**

↓

**4. Browser understands relevant context**

↓

**5. Phone enters chosen focus mode**

↓

**6. Work state updates**

↓

**7. User stops**

↓

**8. State is saved**

↓

**9. User returns later**

↓

**10. WEFT tells them exactly what to resume**

If these work flawlessly, we have a strong demo.

---

# 18. The 3-minute demo story

The demo should follow one student.

### Scene 1

Phone:

> "I need to prepare for my FLA exam."

WEFT creates the workflow.

### Scene 2

Laptop:

> **FLA Exam Preparation → CNF**

Browser extension shows relevant context.

### Scene 3

Phone:

> **Study Focus ACTIVE**

Laptop continues the work.

### Scene 4

User gets interrupted.

Work session pauses.

### Scene 5

Next day:

> **You stopped at CNF Conversion.**

> **Next: Complete example 2.**

Click:

> **RESUME WORK**

### Final line

# **One goal. Every device. One continuous workflow.**

---

# 19. Brand

## **WEFT**

The name comes from the idea of threads being woven together.

The product weaves together:

**Goal + Context + Devices + Progress + Next Action**

### Tagline

> **One goal. Every device. One continuous workflow.**

### Secondary line

> **Resume the work, not the setup.**

---

# 20. What we need to build first

I'd divide the team into these tracks:

| Track                   | Responsibility                                           |
| ----------------------- | -------------------------------------------------------- |
| **Android**             | App, task capture, session control, focus integration    |
| **Browser**             | Extension, page context, quick task creation, references |
| **Backend**             | Auth, sync, work-state model, APIs                       |
| **AI**                  | Goal → workflow, context interpretation, next action     |
| **Dashboard**           | Current work, workflow, devices, history                 |
| **Design/Presentation** | UI consistency, landing page, deck, video                |

### The priority is not the number of features.

**Priority = one complete workflow working across all three surfaces.**

If we can make this sequence work:

> **Phone creates → laptop executes → browser provides context → phone adapts → state saved → user resumes**

then WEFT has a coherent product story rather than being a collection of productivity features.