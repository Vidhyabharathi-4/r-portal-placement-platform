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


class CompanyBase(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    website: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=120)
    contact_name: str | None = Field(default=None, max_length=120)
    contact_email: str | None = Field(default=None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    recruiter_status: RecruiterStatus = RecruiterStatus.COLD


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime
    updated_at: datetime

class CompanyDetailsOut(CompanyOut):
    total_drives: int = 0
    active_drives: int = 0
    total_applications: int = 0
    selected_students: int = 0
    last_engagement: datetime | None = None


class DriveBase(BaseModel):
    title: str = Field(min_length=2, max_length=180)
    company_id: int
    location: str = Field(min_length=2, max_length=140)
    package_lpa: str | None = Field(default=None, max_length=60)
    eligibility: str = Field(min_length=2, max_length=5000)
    deadline: datetime | None = None
    status: DriveStatus = DriveStatus.DRAFT
    description: str | None = None
    drive_date: datetime | None = None
    departments: str | None = None
    required_skills: str | None = None
    work_mode: str | None = None


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
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
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

