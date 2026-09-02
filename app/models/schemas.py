from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    name: str
    email: str
    role: str = "STUDENT" # CITIZEN, STUDENT, FACULTY, INDUSTRY, ADMIN
    organization: Optional[str] = None
    department: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserRead(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- CHALLENGE SCHEMAS ---
class ChallengeBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=300)
    description: str = Field(..., min_length=20)
    category: str
    sdg_tag: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgency_level: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    target_community: Optional[str] = None
    budget_needed: float = 0.0

class ChallengeCreate(ChallengeBase):
    poster_id: int

class ChallengeCommentCreate(BaseModel):
    user_id: int
    author_name: str
    author_role: str
    content: str

class ChallengeCommentRead(BaseModel):
    id: int
    challenge_id: int
    user_id: int
    author_name: str
    author_role: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChallengeRead(ChallengeBase):
    id: int
    status: str
    poster_id: int
    upvotes_count: int
    created_at: datetime
    updated_at: datetime
    poster: Optional[UserRead] = None
    comments: List[ChallengeCommentRead] = []
    model_config = ConfigDict(from_attributes=True)

# --- TEAM SCHEMAS ---
class TeamMemberCreate(BaseModel):
    user_id: int
    role_title: str = "Researcher"

class TeamMemberRead(BaseModel):
    id: int
    team_id: int
    user_id: int
    role_title: str
    joined_at: datetime
    user: Optional[UserRead] = None
    model_config = ConfigDict(from_attributes=True)

class TeamCreate(BaseModel):
    name: str
    university: str
    department: Optional[str] = None
    description: Optional[str] = None
    leader_id: int
    faculty_advisor_id: Optional[int] = None
    member_user_ids: List[int] = []

class TeamRead(BaseModel):
    id: int
    name: str
    university: str
    department: Optional[str] = None
    description: Optional[str] = None
    leader_id: int
    faculty_advisor_id: Optional[int] = None
    created_at: datetime
    leader: Optional[UserRead] = None
    faculty_advisor: Optional[UserRead] = None
    members: List[TeamMemberRead] = []
    model_config = ConfigDict(from_attributes=True)

# --- MILESTONE SCHEMAS ---
class MilestoneCreate(BaseModel):
    phase_key: str
    title: str
    description: str
    grant_tranche_percentage: float = 25.0
    grant_tranche_amount: float = 0.0

class MilestoneSubmit(BaseModel):
    deliverable_url: str
    submission_notes: Optional[str] = None

class MilestoneApprove(BaseModel):
    approver_id: int
    approver_role: str # FACULTY or MENTOR/INDUSTRY
    feedback_notes: Optional[str] = None

class MilestoneRead(BaseModel):
    id: int
    solution_id: int
    phase_key: str
    title: str
    description: str
    deliverable_url: Optional[str] = None
    grant_tranche_percentage: float
    grant_tranche_amount: float
    status: str
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    feedback_notes: Optional[str] = None
    approved_by_mentor_id: Optional[int] = None
    approved_by_faculty_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

# --- SOLUTION SCHEMAS ---
class SolutionCreate(BaseModel):
    challenge_id: int
    team_id: int
    title: str
    abstract: str
    tech_stack: Optional[str] = None
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None

class SolutionRead(BaseModel):
    id: int
    challenge_id: int
    team_id: int
    title: str
    abstract: str
    tech_stack: Optional[str] = None
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None
    status: str
    faculty_approved: bool
    created_at: datetime
    updated_at: datetime
    team: Optional[TeamRead] = None
    milestones: List[MilestoneRead] = []
    model_config = ConfigDict(from_attributes=True)

# --- GRANT & SPONSORSHIP SCHEMAS ---
class GrantPledge(BaseModel):
    challenge_id: int
    solution_id: Optional[int] = None
    sponsor_id: int
    sponsor_company: str
    amount_pledged: float
    currency: str = "USD"
    csr_focus_area: Optional[str] = None

class GrantRead(BaseModel):
    id: int
    challenge_id: int
    solution_id: Optional[int] = None
    sponsor_id: int
    sponsor_company: str
    amount_pledged: float
    amount_released: float
    currency: str
    csr_focus_area: Optional[str] = None
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- MENTORSHIP SCHEMAS ---
class MentorshipAssign(BaseModel):
    solution_id: int
    mentor_id: int
    mentor_name: str
    mentor_company: str
    domain_expertise: Optional[str] = None
    notes: Optional[str] = None

class MentorshipRead(BaseModel):
    id: int
    solution_id: int
    mentor_id: int
    mentor_name: str
    mentor_company: str
    domain_expertise: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- AI & MATCHMAKING SCHEMAS ---
class MatchRecommendation(BaseModel):
    entity_id: int
    title: str
    category: str
    match_score: float # 0.0 to 1.0 (or 0-100%)
    match_reasons: List[str]
    metadata: Dict[str, Any] = {}

class DuplicateCheckResult(BaseModel):
    is_duplicate: bool
    highest_similarity: float
    similar_challenges: List[Dict[str, Any]] = []

# --- ANALYTICS SCHEMAS ---
class DashboardKPIs(BaseModel):
    total_challenges: int
    active_solutions: int
    participating_universities: int
    industry_partners_count: int
    total_grants_pledged: float
    total_grants_disbursed: float
    solved_challenges_count: int
    active_innovators_count: int
    sdg_distribution: Dict[str, int]
    top_categories: List[Dict[str, Any]]
    recent_activities: List[Dict[str, Any]]
