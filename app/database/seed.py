import datetime
from sqlalchemy.orm import Session
from app.models.database_models import (
    User, University, Challenge, ChallengeVote, ChallengeComment,
    Team, TeamMember, Solution, GrantSponsorship,
    Milestone, MentorshipAssignment, ActivityLog,
    UniversityProject, StudentApplication, IndustryCollaboration,
    PilotDeployment, EscrowLedgerEntry
)
from app.config import settings

def seed_database(db: Session):
    """Populates the database with realistic seed data if empty."""
    if db.query(User).first():
        # Check if new university projects exist, if not seed them
        if not db.query(University).first():
            _seed_civicnexus_extensions(db)
        return # Already seeded

    # --- 1. SEED USERS ---
    users = [
        # Citizen & Community Posters
        User(
            id=1,
            email="arjun.sharma@civicnexus.org",
            name="Arjun Sharma",
            first_name="Arjun",
            last_name="Sharma",
            role="CITIZEN",
            organization="Gwalior Citizen Action Group",
            department="Community Ward 4",
            skills="Community Mobilization, Infrastructure Tracking, Citizen Science",
            bio="Active resident in Gwalior & Belagavi driving local municipal and environmental improvements.",
            location="Gwalior, MP • Belagavi Ward",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
        ),
        User(
            id=2,
            email="priya.nair@coastalprotect.org",
            name="Priya Nair",
            first_name="Priya",
            last_name="Nair",
            role="CITIZEN",
            organization="Coastal Resilience Alliance",
            department="Marine Conservation",
            skills="Ocean Health, Plastic Pollution, Estuary Ecology, Citizen Science",
            bio="Grassroots environmental activist coordinating coastal waste management in Kerala.",
            location="Kochi, Kerala",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        ),
        User(
            id=3,
            email="dr.ananya.roy@ruralhealth.org",
            name="Dr. Ananya Roy",
            first_name="Ananya",
            last_name="Roy",
            role="CITIZEN",
            organization="Jan Seva Rural Health Mission",
            department="Community Medicine",
            skills="Primary Care, Rural Triage, Ophthalmology Screening, Maternal Health",
            bio="Public health physician operating mobile clinics in 18 underserved tribal districts.",
            location="Bastar, Chhattisgarh",
            avatar_url="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        ),
        # Student Innovators
        User(
            id=4,
            email="aarav.sharma@iitb.ac.in",
            name="Aarav Sharma",
            first_name="Aarav",
            last_name="Sharma",
            role="STUDENT",
            organization="IIT Bombay",
            department="Electrical Engineering",
            skills="Embedded Systems, LoRaWAN, IoT Sensors, Firmware, Circuit Design",
            bio="Final year B.Tech student passionate about frugal IoT sensors for agriculture.",
            location="Mumbai, MH",
            avatar_url="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"
        ),
        User(
            id=5,
            email="sneha.patel@pilani.bits-pilani.ac.in",
            name="Sneha Patel",
            first_name="Sneha",
            last_name="Patel",
            role="STUDENT",
            organization="BITS Pilani",
            department="Computer Science & AI",
            skills="Computer Vision, PyTorch, Edge AI, TensorRT, Medical Imaging",
            bio="M.Sc AI researcher building low-latency diagnostic models for edge devices.",
            location="Pilani, Rajasthan",
            avatar_url="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80"
        ),
        # Faculty Advisors
        User(
            id=8,
            email="prof.swaminathan@iitb.ac.in",
            name="Prof. Dr. Arvind Swaminathan",
            first_name="Arvind",
            last_name="Swaminathan",
            role="FACULTY",
            organization="IIT Bombay",
            department="Centre for Environmental Science and Engineering",
            skills="Hydrology, Sensor Networks, Water Quality Standards, Grant Review",
            bio="Professor with 22 years experience in river basin hydro-informatics and community tech.",
            location="Powai, Mumbai",
            avatar_url="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
        ),
        # Industry Sponsors & Mentors
        User(
            id=10,
            email="vikram.singhania@tata.com",
            name="Vikram Singhania",
            first_name="Vikram",
            last_name="Singhania",
            role="COMPANY_REP",
            organization="Tata Sustainability & CSR",
            department="Rural Development & Water Security",
            skills="CSR Grant Management, Agri-Supply Chains, Scale Deployments, Social Impact",
            bio="CSR Director managing a $4.5M annual grant portfolio for drought mitigation.",
            location="Mumbai, Maharashtra",
            avatar_url="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80"
        ),
        User(
            id=13,
            email="admin@civicnexus.org",
            name="CivicNexus Review Board",
            first_name="CivicNexus",
            last_name="Admin",
            role="ADMIN",
            organization="National Innovation Mission",
            department="Platform Governance",
            skills="Ecosystem Curation, Policy, Verification, Impact Audit",
            bio="Central coordination body managing university-industry societal grants.",
            location="New Delhi, India",
            avatar_url="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
        )
    ]
    for u in users:
        db.add(u)
    db.commit()

    # --- 2. SEED CHALLENGES ---
    challenges = [
        Challenge(
            id=1,
            title="Smart Groundwater Depletion Alert & Precision Solar Drip Automation for Arid Drought Zones",
            description="Smallholder farming communities in Marathwada and Northern Karnataka are facing severe borewell dry-ups due to unmonitored over-extraction. We need an ultra-low-cost (<$50), solar-powered sub-surface telemetry node that detects water table level, soil matrix suction, and automatically meters drip valves to reduce agricultural water consumption by 45%.",
            category="Water & Agriculture",
            sdg_tag="SDG_6",
            domain="water_management",
            location="Marathwada & Belagavi, India",
            latitude=19.8762,
            longitude=75.3433,
            urgency_level="CRITICAL",
            target_community="2,400 Smallholder Dryland Farmers",
            budget_needed=18000.0,
            status="IN_PROGRESS",
            poster_id=1,
            upvotes_count=142
        ),
        Challenge(
            id=2,
            title="Low-Cost Edge AI Screening Device for Diabetic Retinopathy in Off-Grid Primary Health Clinics",
            description="Over 70% of rural diabetic patients in tribal districts suffer irreversible vision loss due to lack of ophthalmologists and fundus camera equipment. We require an optical clip-on adapter for standard smartphones coupled with an on-device, offline-first convolutional neural network to triage diabetic retinopathy lesions in under 30 seconds with >92% sensitivity.",
            category="Healthcare & AI",
            sdg_tag="SDG_3",
            domain="healthcare",
            location="Bastar District, Chhattisgarh, India",
            latitude=19.0748,
            longitude=82.0298,
            urgency_level="HIGH",
            target_community="15,000 Tribal Villagers & Primary Health Workers",
            budget_needed=25000.0,
            status="IN_PROGRESS",
            poster_id=3,
            upvotes_count=218
        ),
        Challenge(
            id=3,
            title="Decentralized Solar-Powered Phase-Change Cold Storage for Remote Perishable Agri-Hubs",
            description="Up to 38% of harvested tomatoes, chillies, and papayas rot before reaching wholesale mandis due to zero cold chain infrastructure at the village level. We need a 2-ton modular cold chamber powered by a 3kW rooftop solar array utilizing non-toxic phase-change salt thermal buffers that maintain 4°C-8°C for 36 hours without grid electricity.",
            category="Clean Energy & Food Security",
            sdg_tag="SDG_7",
            domain="clean_energy",
            location="Anantapur & Kurnool, Andhra Pradesh, India",
            latitude=14.6819,
            longitude=77.6006,
            urgency_level="HIGH",
            target_community="850 Horticultural Farmer Households",
            budget_needed=30000.0,
            status="OPEN",
            poster_id=1,
            upvotes_count=98
        )
    ]
    for c in challenges:
        db.add(c)
    db.commit()

    # --- 3. SEED UNIVERSITIES & PROJECTS ---
    _seed_civicnexus_extensions(db)
    print("Seed data successfully injected into database.")

def _seed_civicnexus_extensions(db: Session):
    # Seed Universities
    univs = [
        University(id=1, name="IIT Bombay", location_name="Powai, Mumbai", latitude=19.1334, longitude=72.9133, service_radius_km=100.0, is_verified=True, departments="Civil, Computer Science, Environmental Engineering"),
        University(id=2, name="IIT Indore", location_name="Simrol, Indore", latitude=22.5204, longitude=75.9207, service_radius_km=80.0, is_verified=True, departments="Sensors & IoT, Electrical, Mechanical"),
        University(id=3, name="IIT Kharagpur", location_name="Kharagpur, West Bengal", latitude=22.3149, longitude=87.3105, service_radius_km=150.0, is_verified=True, departments="Water Resources, Agriculture, AI"),
        University(id=4, name="BITS Pilani", location_name="Pilani, Rajasthan", latitude=28.3639, longitude=75.5870, service_radius_km=90.0, is_verified=True, departments="Computer Science, Bio-Optics, Embedded Systems")
    ]
    for u in univs:
        if not db.query(University).filter(University.name == u.name).first():
            db.add(u)
    db.commit()

    # Seed University Projects
    if not db.query(UniversityProject).first():
        projects = [
            UniversityProject(
                id=1,
                challenge_id=1,
                faculty_lead_id=8,
                university_name="IIT Bombay - Hydro-Informatics Lab",
                title="AquaPulse: Sub-surface LoRa Telemetry & Smart Solenoid Grid",
                description="Developing ultra-low-power capacitive probes and solar valve actuators for Marathwada & Belagavi dryland farm clusters.",
                trl_level=5,
                status="ACTIVE",
                open_roles="Embedded Systems Lead, LoRa RF Specialist, React Frontend Developer",
                budget_allocated=18000.0
            ),
            UniversityProject(
                id=2,
                challenge_id=2,
                faculty_lead_id=8,
                university_name="BITS Pilani - Machine Intelligence Lab",
                title="RetinaEdge: On-Device Diabetic Retinopathy Triage",
                description="3D-printed optical smartphone adapter with INT8 quantized MobileNetV3 model for offline tribal healthcare triage.",
                trl_level=6,
                status="ACTIVE",
                open_roles="Mobile ML Engineer, Optical CAD Designer",
                budget_allocated=25000.0
            ),
            UniversityProject(
                id=3,
                challenge_id=3,
                faculty_lead_id=8,
                university_name="IISc Bangalore - Smart Mobility & Robotics Lab",
                title="PotholeVision: AI LiDAR & Accelerometer Edge Road Scanner",
                description="Roof-mounted dual IMU + computer vision unit detecting structural road defects in real-time with GPS precision.",
                trl_level=6,
                status="ACTIVE",
                open_roles="ROS2 Robotics Engineer, Edge Computer Vision Specialist",
                budget_allocated=22000.0
            ),
            UniversityProject(
                id=4,
                challenge_id=1,
                faculty_lead_id=8,
                university_name="IIT Delhi - Clean Energy & Smart Grids Center",
                title="SolarFreeze: PCM Phase-Change Cold Storage for Fisherfolk",
                description="Thermal storage refrigeration unit powered by micro solar PV with 36-hour off-grid sub-zero retention.",
                trl_level=5,
                status="ACTIVE",
                open_roles="Thermal Modeling Engineer, Firmware Developer",
                budget_allocated=28000.0
            )
        ]
        for p in projects:
            db.add(p)
        db.commit()

        # Seed Student Applications
        app1 = StudentApplication(
            project_id=1,
            applicant_id=4,
            desired_role="LEAD",
            statement_of_purpose="Experienced in building LoRaWAN gateways and firmware on ESP32-S3.",
            status="ACCEPTED"
        )
        app2 = StudentApplication(
            project_id=2,
            applicant_id=5,
            desired_role="LEAD",
            statement_of_purpose="Published paper on edge model quantization for retinal vessel segmentation.",
            status="ACCEPTED"
        )
        db.add(app1)
        db.add(app2)

        # Seed Industry Collaborations
        collab1 = IndustryCollaboration(
            project_id=1,
            company_rep_id=10,
            company_name="Tata Sustainability & CSR",
            offer_type="FUNDING",
            funding_amount=18000.0,
            compute_resources="100 IoT Prototype Hardware Kits",
            details="Sponsoring Marathwada district field trials and hardware fabrication.",
            status="ACCEPTED"
        )
        db.add(collab1)

        # Seed Pilots
        pilot1 = PilotDeployment(
            project_id=1,
            location_name="Belagavi Ward 4 Agricultural Testbed",
            latitude=15.8497,
            longitude=74.4977,
            beneficiaries_count=2400,
            sensor_telemetry_summary="Active telemetry stream: 12 nodes reporting soil suction every 15 minutes.",
            status="ACTIVE"
        )
        db.add(pilot1)

        # Seed Escrow
        escrow1 = EscrowLedgerEntry(
            project_id=1,
            grantor_company="Tata Sustainability & CSR",
            milestone_title="Phase 1 & Phase 2 Benchmarking",
            amount=9000.0,
            status="RELEASED"
        )
        escrow2 = EscrowLedgerEntry(
            project_id=1,
            grantor_company="Tata Sustainability & CSR",
            milestone_title="Phase 3 Live Field Pilot",
            amount=5400.0,
            status="HELD"
        )
        db.add(escrow1)
        db.add(escrow2)
        db.commit()
