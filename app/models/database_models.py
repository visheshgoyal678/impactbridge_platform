import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.db import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    name = Column(String(255), nullable=False)
    role = Column(String(50), default="STUDENT") # CITIZEN, STUDENT, FACULTY, COMPANY_REP, ADMIN
    organization = Column(String(255), nullable=True) # University / Company / NGO
    department = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True) # Comma-separated or JSON list of skills/domains
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    posted_challenges = relationship("Challenge", back_populates="poster")
    led_teams = relationship("Team", foreign_keys="Team.leader_id", back_populates="leader")
    advised_teams = relationship("Team", foreign_keys="Team.faculty_advisor_id", back_populates="faculty_advisor")
    sponsored_grants = relationship("GrantSponsorship", back_populates="sponsor")
    student_applications = relationship("StudentApplication", back_populates="applicant")
    industry_collaborations = relationship("IndustryCollaboration", back_populates="company_rep")

class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    location_name = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    service_radius_km = Column(Float, default=50.0)
    is_verified = Column(Boolean, default=True)
    departments = Column(Text, nullable=True)
    contact_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now)

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False) # e.g. Water & Sanitation, Clean Tech, Agri-tech
    sdg_tag = Column(String(50), nullable=False, index=True) # e.g. SDG_6, SDG_7, SDG_3
    domain = Column(String(100), default="urban_infrastructure") # healthcare, agriculture, clean_energy, water_management, waste_management
    location = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    urgency_level = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    target_community = Column(String(255), nullable=True) # e.g. Rural Smallholders, Coastal Fisherfolk
    budget_needed = Column(Float, default=0.0)
    status = Column(String(50), default="OPEN") # PENDING_MODERATION, OPEN, CLAIMED, IN_PROGRESS, RESOLVED, REJECTED
    moderation_status = Column(String(50), default="APPROVED") # PENDING, APPROVED, REJECTED
    poster_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    upvotes_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    poster = relationship("User", back_populates="posted_challenges")
    votes = relationship("ChallengeVote", back_populates="challenge", cascade="all, delete-orphan")
    comments = relationship("ChallengeComment", back_populates="challenge", cascade="all, delete-orphan")
    solutions = relationship("Solution", back_populates="challenge", cascade="all, delete-orphan")
    grants = relationship("GrantSponsorship", back_populates="challenge", cascade="all, delete-orphan")
    projects = relationship("UniversityProject", back_populates="challenge")

class ChallengeVote(Base):
    __tablename__ = "challenge_votes"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    challenge = relationship("Challenge", back_populates="votes")
    user = relationship("User")

class ChallengeComment(Base):
    __tablename__ = "challenge_comments"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_name = Column(String(255), nullable=False)
    author_role = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    challenge = relationship("Challenge", back_populates="comments")
    user = relationship("User")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    university = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    faculty_advisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    leader = relationship("User", foreign_keys=[leader_id], back_populates="led_teams")
    faculty_advisor = relationship("User", foreign_keys=[faculty_advisor_id], back_populates="advised_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    solutions = relationship("Solution", back_populates="team")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_title = Column(String(100), default="Researcher") # Team Lead, Embedded Engineer, ML Specialist
    joined_at = Column(DateTime, default=utc_now)

    team = relationship("Team", back_populates="members")
    user = relationship("User")

class UniversityProject(Base):
    __tablename__ = "university_projects"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    faculty_lead_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    university_name = Column(String(255), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    trl_level = Column(Integer, default=3) # Technology Readiness Level 1-9
    status = Column(String(50), default="ACTIVE") # ACTIVE, COMPLETED, ABANDONED
    open_roles = Column(Text, nullable=True) # JSON or comma-separated roles needed
    budget_allocated = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    challenge = relationship("Challenge", back_populates="projects")
    faculty_lead = relationship("User")
    applications = relationship("StudentApplication", back_populates="project")
    collaborations = relationship("IndustryCollaboration", back_populates="project")
    pilots = relationship("PilotDeployment", back_populates="project")
    escrow_records = relationship("EscrowLedgerEntry", back_populates="project")

class StudentApplication(Base):
    __tablename__ = "student_applications"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("university_projects.id"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    desired_role = Column(String(100), default="MEMBER") # LEAD, MEMBER, MENTOR
    statement_of_purpose = Column(Text, nullable=False)
    resume_url = Column(String(500), nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, ACCEPTED, REJECTED
    created_at = Column(DateTime, default=utc_now)

    project = relationship("UniversityProject", back_populates="applications")
    applicant = relationship("User", back_populates="student_applications")

class IndustryCollaboration(Base):
    __tablename__ = "industry_collaborations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("university_projects.id"), nullable=False)
    company_rep_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_name = Column(String(255), nullable=False)
    offer_type = Column(String(50), default="FUNDING") # MENTORSHIP, FUNDING, TECHNOLOGY, INFRASTRUCTURE
    funding_amount = Column(Float, default=0.0)
    compute_resources = Column(String(255), nullable=True) # e.g. 500h GPU cluster access
    details = Column(Text, nullable=False)
    status = Column(String(50), default="REQUESTED") # REQUESTED, REVIEWED, ACCEPTED, ACTIVE, COMPLETED
    created_at = Column(DateTime, default=utc_now)

    project = relationship("UniversityProject", back_populates="collaborations")
    company_rep = relationship("User", back_populates="industry_collaborations")

class PilotDeployment(Base):
    __tablename__ = "pilot_deployments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("university_projects.id"), nullable=False)
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="ACTIVE") # PLANNED, ACTIVE, COMPLETED, CANCELLED
    beneficiaries_count = Column(Integer, default=0)
    sensor_telemetry_summary = Column(Text, nullable=True)
    start_date = Column(DateTime, default=utc_now)
    completion_date = Column(DateTime, nullable=True)

    project = relationship("UniversityProject", back_populates="pilots")

class EscrowLedgerEntry(Base):
    __tablename__ = "escrow_ledger_entries"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("university_projects.id"), nullable=False)
    grantor_company = Column(String(255), nullable=False)
    milestone_title = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="HELD") # HELD, RELEASED, REFUNDED
    verification_evidence_url = Column(String(500), nullable=True)
    released_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    project = relationship("UniversityProject", back_populates="escrow_records")

class Solution(Base):
    __tablename__ = "solutions"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    title = Column(String(300), nullable=False)
    abstract = Column(Text, nullable=False)
    tech_stack = Column(String(300), nullable=True) # e.g. LoRaWAN, Solar Inverter, Computer Vision, React
    repository_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    status = Column(String(50), default="PROPOSED") # PROPOSED, UNDER_REVIEW, ACCEPTED, IN_INCUBATION, DEPLOYED
    faculty_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    challenge = relationship("Challenge", back_populates="solutions")
    team = relationship("Team", back_populates="solutions")
    milestones = relationship("Milestone", back_populates="solution", cascade="all, delete-orphan")
    grants = relationship("GrantSponsorship", back_populates="solution")
    mentors = relationship("MentorshipAssignment", back_populates="solution", cascade="all, delete-orphan")

class GrantSponsorship(Base):
    __tablename__ = "grant_sponsorships"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    solution_id = Column(Integer, ForeignKey("solutions.id"), nullable=True)
    sponsor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sponsor_company = Column(String(255), nullable=False)
    amount_pledged = Column(Float, nullable=False)
    amount_released = Column(Float, default=0.0)
    currency = Column(String(10), default="USD")
    csr_focus_area = Column(String(255), nullable=True)
    status = Column(String(50), default="ACTIVE") # PLEDGED, ACTIVE, FULLY_DISBURSED
    created_at = Column(DateTime, default=utc_now)

    challenge = relationship("Challenge", back_populates="grants")
    solution = relationship("Solution", back_populates="grants")
    sponsor = relationship("User", back_populates="sponsored_grants")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    solution_id = Column(Integer, ForeignKey("solutions.id"), nullable=False)
    phase_key = Column(String(50), nullable=False) # FEASIBILITY, PROTOTYPE, FIELD_TESTING, SCALE_PILOT
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deliverable_url = Column(String(500), nullable=True)
    grant_tranche_percentage = Column(Float, default=25.0)
    grant_tranche_amount = Column(Float, default=0.0)
    status = Column(String(50), default="PENDING") # PENDING, SUBMITTED, APPROVED, FUND_RELEASED
    submitted_at = Column(DateTime, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    feedback_notes = Column(Text, nullable=True)
    approved_by_mentor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by_faculty_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    solution = relationship("Solution", back_populates="milestones")

class MentorshipAssignment(Base):
    __tablename__ = "mentorship_assignments"

    id = Column(Integer, primary_key=True, index=True)
    solution_id = Column(Integer, ForeignKey("solutions.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_name = Column(String(255), nullable=False)
    mentor_company = Column(String(255), nullable=False)
    domain_expertise = Column(String(255), nullable=True)
    status = Column(String(50), default="ACTIVE") # ACTIVE, COMPLETED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    solution = relationship("Solution", back_populates="mentors")
    mentor = relationship("User")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_name = Column(String(255), nullable=False)
    actor_role = Column(String(50), nullable=False)
    action_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    entity_type = Column(String(50), nullable=True) # CHALLENGE, SOLUTION, GRANT, MILESTONE, PROJECT, APPLICATION, PILOT
    entity_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utc_now)
