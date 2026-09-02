# 🌐 ImpactBridge — Crowdsourced Societal Problem-Solving Platform
> **A unified open innovation ecosystem bridging Civil Society, University Research Labs, and Industry CSR Partnerships to solve real-world societal challenges aligned with UN Sustainable Development Goals (SDGs).**

---

## 🚀 Key Value Proposition & Stakeholder Personas

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│   CIVIL SOCIETY & NGOs  │      │  UNIVERSITIES & LABS    │      │  INDUSTRY & CSR DONORS  │
│  (Grassroots Problem)   │      │  (Cross-domain Teams)   │      │  (Capital & Mentors)    │
│                         │      │                         │      │                         │
│ • Post ground challenges│      │ • Interdisciplinary     │      │ • Sponsor CSR grants    │
│ • Geotag & SDG tagging  │ ───► │   student teams         │ ◄─── │ • Assign expert mentors │
│ • Upvoting & evidence   │      │ • Faculty endorsement   │      │ • Milestone sign-off    │
│ • Community validation  │      │ • Deliverable submission│      │ • Escrow fund release   │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │   MEASURABLE OUTCOME    │
                                 │  • Deployed Prototypes  │
                                 │  • Field-tested tech    │
                                 │  • Verified SDG Impact  │
                                 └─────────────────────────┘
```

### 1. 🧑‍🌾 Grassroots Communities, NGOs & Citizens
- Submit urgent ground challenges with geographic coordinates, urgency ratings (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), target demographic impact, and evidence.
- Real-time **AI Semantic Deduplication** prevents fragmented efforts and connects community submitters to existing initiatives.
- Democratic upvoting and discussion boards to validate problem severity.

### 2. 🎓 Universities (Students & Faculty Researchers)
- Form cross-disciplinary innovation teams across Engineering, Computer Science, Biotechnology, Agriculture, and Economics.
- Submit structured technical proposals with GitHub repositories and live testbed demos.
- Receive **Faculty Advisor Endorsement** certifying research methodology and academic credit qualification.

### 3. 🏢 Industry Partners & Corporate CSR Sponsors
- Explore high-impact societal problem statements aligned with corporate ESG/CSR mandates.
- Pledge milestone-based CSR micro-grants into secure **Fund Escrow Pipelines**.
- Assign technical architects and domain specialists to provide hands-on mentorship.

### 4. 🎯 4-Stage Milestone & Escrow Release Pipeline
1. **Phase 1: Research & Feasibility Study (20% Grant Release)** — Baseline surveys, literature review, and link budget calculations.
2. **Phase 2: MVP & Lab Prototyping (30% Grant Release)** — Working hardware/software prototype and test bench calibration.
3. **Phase 3: Community Field Testing (30% Grant Release)** — Live deployment in target hamlets and user validation.
4. **Phase 4: Industrial Scale & Pilot (20% Grant Release)** — Manufacturing CAD, bill-of-materials optimization, and technology handover.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend API** | **FastAPI (Python 3.14)** | High-throughput asynchronous REST API & OpenAPI schema |
| **Data & ORM** | **SQLAlchemy + SQLite** | Structured relational models for Challenges, Teams, Grants & Milestones |
| **AI Matching Engine** | **Scikit-Learn (TF-IDF & Cosine Similarity)** | Semantic matchmaking of challenges to student skills and industry mentors |
| **Frontend UI** | **Tailwind CSS + HTML5 + Vanilla JS** | Modern glassmorphic responsive single-page web portal |
| **Visualizations** | **Chart.js + Lucide Icons** | Real-time SDG distribution and CSR capital flow dashboards |
| **Testing** | **Pytest + FastAPI TestClient** | 100% automated test coverage of all critical workflows |

---

## 📦 Project Structure

```
c:\Users\hp\impactbridge\
├── app/
│   ├── main.py                     # FastAPI application entry point & router mounting
│   ├── config.py                   # App settings, UN SDGs, & milestone phase definitions
│   ├── models/
│   │   ├── database_models.py      # SQLAlchemy ORM models
│   │   └── schemas.py              # Pydantic v2 schemas for requests & responses
│   ├── database/
│   │   ├── db.py                   # Database connection & session generator
│   │   └── seed.py                 # Realistic seed data (6 SDGs, 4 teams, $73k in CSR grants)
│   ├── services/
│   │   ├── matcher.py              # AI Semantic Matchmaking & Duplicate Detection engine
│   │   └── notification.py         # Real-time activity log & event feed service
│   ├── routes/
│   │   ├── challenges.py           # Challenge crowdsourcing, voting, & comments
│   │   ├── solutions.py            # Solution proposals, teams, & faculty endorsement
│   │   ├── partnerships.py         # CSR grant pledges & mentor assignments
│   │   ├── milestones.py           # 4-stage milestone verification & escrow fund release
│   │   ├── matching.py             # AI recommendation endpoints
│   │   └── analytics.py            # Platform KPIs & SDG charts
│   └── static/
│       ├── index.html              # Interactive Single Page Web Portal
│       ├── css/
│       │   └── custom.css          # Glassmorphic UI styling & animations
│       └── js/
│           ├── api.js              # Frontend API client
│           ├── app.js              # Global app state & persona switcher
│           ├── challenges.js       # Challenges browsing & wizard
│           ├── solutions.js        # Innovation Lab & team builder
│           ├── industry.js         # Corporate CSR & mentorship
│           ├── milestones.js       # Milestone delivery & escrow approvals
│           └── analytics.js        # Chart.js analytics & AI matcher UI
├── tests/
│   └── test_api.py                 # Comprehensive automated test suite
├── requirements.txt                # Python dependencies
├── run.py                          # Single-command application launcher
└── README.md                       # Documentation & platform guide
```

---

## ⚡ Quickstart Guide

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Platform
```bash
python run.py
```
Open your browser and navigate to:
👉 **`http://127.0.0.1:8000`**

### 3. Run Automated Tests
```bash
pytest -v
```

---

## 🌟 Interactive Live Persona Walkthrough

Use the **Persona Switcher** in the top-right header to test all stakeholder perspectives:

1. **Switch to Ramesh Kumar (Citizen / Farmer NGO Lead):**
   - Click *Post Societal Challenge*, type a problem statement, observe real-time AI duplicate checking, and crowdsource the issue.
2. **Switch to Aarav Sharma (Student Innovator - IIT Bombay):**
   - Open *AI Matchmaker* tab to see smart recommendations based on IoT/embedded skills.
   - Propose a new solution or submit a *Milestone Deliverable* (Phase 3 field trial data).
3. **Switch to Prof. Dr. Arvind Swaminathan (Faculty Advisor):**
   - Review pending student proposals in *University Innovation Lab* and click **Endorse**.
4. **Switch to Vikram Singhania (Tata CSR Director):**
   - Open *Industry & CSR Grants* tab and pledge a new $20,000 grant.
   - Go to *Milestone & Escrow Pipeline*, review a submitted student deliverable, and click **Sign-off & Release Tranche** to release funds from escrow.
5. **Open Impact & SDG Analytics Tab:**
   - Watch live Chart.js graphs dynamically recalculate grant capital flows, SDG distribution, and verified societal milestones.
