from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from .models import ApplicationStatus, DriveStatus, PlacementStatus, RecruiterStatus, Role


class NotificationPreferences(BaseModel):
    application_updates: bool = True
    drive_updates: bool = True
    recruiter_updates: bool = True
    student_updates: bool = True
    system_updates: bool = True


class UserPreferences(BaseModel):
    theme: str = "system"
    table_density: str = "comfortable"
    default_page: str = "/dashboard"
    default_export_format: str = "CSV"
    default_print_orientation: str = "portrait"
    notifications: NotificationPreferences = Field(default_factory=NotificationPreferences)


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class SettingsUpdate(BaseModel):
    theme: str | None = None
    table_density: str | None = None
    default_page: str | None = None
    default_export_format: str | None = None
    default_print_orientation: str | None = None
    notifications: dict | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)
    role: Role


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    role: Role
    is_active: bool
    created_at: datetime
    preferences: dict | None = Field(default_factory=dict)


class LoginRequest(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CompanyStatusUpdate(BaseModel):
    status: RecruiterStatus


class CompanyBase(BaseModel):
    name: str = Field(default="Company", max_length=160)
    website: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=140)
    address: str | None = None
    description: str | None = None
    contact_name: str | None = Field(default=None, max_length=120)
    contact_email: str | None = Field(default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    contact_phone: str | None = Field(default=None, max_length=30)
    contact_designation: str | None = Field(default="HR Manager", max_length=120)
    logo_url: str | None = Field(default=None, max_length=500)
    notes: str | None = None
    last_contacted_at: datetime | None = None
    recruiter_status: RecruiterStatus = RecruiterStatus.COLD

    @field_validator("contact_email", "website", "industry", "contact_name", mode="before")
    @classmethod
    def empty_string_to_none(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    website: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=140)
    address: str | None = None
    description: str | None = None
    contact_name: str | None = Field(default=None, max_length=120)
    contact_email: str | None = Field(default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    contact_phone: str | None = Field(default=None, max_length=30)
    contact_designation: str | None = Field(default=None, max_length=120)
    logo_url: str | None = Field(default=None, max_length=500)
    notes: str | None = None
    recruiter_status: RecruiterStatus | None = None


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime


class RecruiterContactBase(BaseModel):
    company_id: int
    name: str = Field(min_length=2, max_length=140)
    designation: str | None = Field(default="HR Manager", max_length=120)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str | None = Field(default=None, max_length=30)
    alternate_phone: str | None = Field(default=None, max_length=30)
    department: str | None = Field(default=None, max_length=120)
    linkedin_url: str | None = Field(default=None, max_length=255)
    status: str = Field(default="ACTIVE", max_length=30)
    last_contacted: datetime | None = None
    notes: str | None = None


class RecruiterContactCreate(RecruiterContactBase):
    pass


class RecruiterContactUpdate(BaseModel):
    company_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=140)
    designation: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str | None = Field(default=None, max_length=30)
    alternate_phone: str | None = Field(default=None, max_length=30)
    department: str | None = Field(default=None, max_length=120)
    linkedin_url: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=30)
    last_contacted: datetime | None = None
    notes: str | None = None


class RecruiterContactOut(RecruiterContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime
    company: CompanyOut | None = None
    total_drives: int = 0


class CompanyCardOut(CompanyOut):
    recruiter_count: int = 0
    primary_contact: str | None = None
    primary_email: str | None = None
    primary_phone: str | None = None
    primary_designation: str | None = None
    total_drives: int = 0
    latest_drive_title: str | None = None
    latest_drive_date: datetime | None = None
    latest_drive_status: str | None = None
    applicants_count: int = 0
    shortlisted_count: int = 0
    selected_count: int = 0
    students_placed_count: int = 0


class CompanyDetailsOut(CompanyOut):
    total_recruiters: int = 0
    total_drives: int = 0
    active_drives: int = 0
    total_applications: int = 0
    selected_students: int = 0
    placed_students_count: int = 0
    last_engagement: datetime | None = None
    recruiters: list[RecruiterContactOut] = Field(default_factory=list)
    drives: list[dict] = Field(default_factory=list)
    job_descriptions: list[dict] = Field(default_factory=list)
    eligible_students: list[dict] = Field(default_factory=list)
    applications: list[dict] = Field(default_factory=list)
    placed_students: list[dict] = Field(default_factory=list)
    activity_history: list[dict] = Field(default_factory=list)


class RecruitersOverviewOut(BaseModel):
    summary: dict
    engagement_distribution: dict
    companies: list[CompanyCardOut]
    recruiters: list[dict]


class DriveBase(BaseModel):
    title: str = Field(default="Placement Drive", max_length=180)
    company_id: int
    location: str = Field(default="TBD", max_length=140)
    package_lpa: str | None = Field(default=None, max_length=60)
    eligibility: str = Field(default="N/A", max_length=5000)
    deadline: datetime | None = None
    status: DriveStatus = DriveStatus.DRAFT
    description: str | None = None
    drive_date: datetime | None = None
    departments: str | None = None
    required_skills: str | None = None
    preferred_skills: str | None = None
    min_cgpa: str | None = "6.0"
    max_backlogs: int | None = 0
    job_role: str | None = None
    experience_requirement: str | None = None
    certifications: str | None = None
    jd_document_path: str | None = None
    jd_text: str | None = None
    work_mode: str | None = "On-site"

    @field_validator("location", "eligibility", "title", mode="before")
    @classmethod
    def empty_string_to_default(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return "N/A"
        return v


class DriveCreate(DriveBase):
    pass


class DriveUpdate(DriveBase):
    pass


class DriveOut(DriveBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    company: CompanyOut


class ATSMatchItem(BaseModel):
    student_id: int | None
    student_name: str
    registration_number: str
    department: str
    cgpa: float
    skills: list[str]
    ats_score: int
    skills_match_pct: int
    academic_match_pct: int
    dept_match_pct: int
    matched_skills: list[str]
    missing_skills: list[str]
    matched_preferred_skills: list[str]
    is_eligible: bool
    reasons: list[str]
    has_applied: bool = False
    application_status: str | None = None


class ATSBulkMatchOut(BaseModel):
    drive_id: int
    drive_title: str
    company_name: str
    required_skills: list[str]
    preferred_skills: list[str]
    min_cgpa: float
    max_backlogs: int
    eligible_departments: list[str]
    total_candidates: int
    eligible_count: int
    high_match_count: int
    matches: list[ATSMatchItem]


class ApplicationCreate(BaseModel):
    student_name: str = Field(min_length=2, max_length=140)
    student_email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    drive_id: int


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_name: str
    student_email: str
    drive_id: int
    status: ApplicationStatus
    resume_path: str | None
    created_at: datetime
    drive: DriveOut


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    actor_id: int | None
    action: str
    entity_type: str
    entity_id: str
    details: dict
    created_at: datetime


class DashboardOut(BaseModel):
    total_students: int
    eligible_students: int
    placed_students: int
    placement_percentage: float
    active_drives: int
    total_companies: int
    total_applications: int
    offers: int
    recent_drives: list[DriveOut]
    recent_activity: list[AuditOut]

class StudentBase(BaseModel):
    registration_number: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=140)
    email: str
    phone: str | None = None
    department: str = Field(min_length=2, max_length=120)
    academic_details: str | None = None
    cgpa: str | None = None
    skills: str | None = None
    is_eligible: bool = False
    placement_status: PlacementStatus = PlacementStatus.SEEKING
    placed_company_id: int | None = None
    offer_package_lpa: str | None = None
    drive_links: list = Field(default_factory=list)

    @field_validator("phone", "academic_details", "cgpa", "skills", "offer_package_lpa", mode="before")
    @classmethod
    def student_empty_to_none(cls, v):
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return v
class StudentCreate(StudentBase): pass
class StudentOut(StudentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int; created_at: datetime; updated_at: datetime
class TeamMemberCreate(BaseModel):
    user_id: int
    role: str = Field(default="Placement Officer", min_length=2, max_length=120)
    responsibility: str = Field(min_length=2, max_length=255)
    department: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    assignment: str | None = Field(default=None, max_length=255)
    is_active: bool = True
    is_team_lead: bool = False

class TeamMemberUpdate(BaseModel):
    role: str | None = Field(default=None, min_length=2, max_length=120)
    responsibility: str | None = Field(default=None, min_length=2, max_length=255)
    department: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    assignment: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None
    is_team_lead: bool | None = None

class PlacementTeamDriveAssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    team_member_id: int
    drive_id: int
    responsibility: str | None
    created_at: datetime
    drive: dict | None = None

class TeamMemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    role: str
    responsibility: str
    department: str | None
    phone: str | None
    assignment: str | None
    is_active: bool
    is_team_lead: bool
    invitation_status: str
    joined_date: datetime | None
    created_at: datetime
    updated_at: datetime
    user: UserOut
    assigned_drives: list[dict] = []

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    message: str
    notification_type: str
    entity_type: str | None
    entity_id: str | None
    is_read: bool
    read_at: datetime | None
    created_at: datetime

class RecruiterMetricsOut(BaseModel):
    company_id: int
    company_name: str
    contact_name: str | None
    contact_email: str | None
    status: RecruiterStatus
    total_drives: int
    active_drives: int
    total_applications: int
    selected_count: int
    rejected_count: int
    last_engagement: datetime | None

class ReportsOut(BaseModel):
    total_students: int
    eligible_students: int
    placed_students: int
    unplaced_students: int
    placement_percentage: float
    total_companies: int
    cold_recruiters: int
    warm_recruiters: int
    hot_recruiters: int
    drive_completed_recruiters: int = 0
    applications: int
    offers: int
    active_drives: int
    department_placements: list[dict] = []
    application_funnel: list[dict] = []
    recruiter_metrics: list[RecruiterMetricsOut] = []
    records: list[dict] = []

