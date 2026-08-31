import io
import os
import re
import shutil
from pathlib import Path
from uuid import uuid4
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, joinedload
from .audit import log_action
from .config import get_settings
from .database import Base, SessionLocal, ensure_sqlite_schema, engine, get_db
from .dependencies import get_current_user, require_roles
from .models import Application, ApplicationStatus, AuditLog, Company, DriveStatus, Notification, PlacementDrive, PlacementStatus, PlacementTeamDriveAssignment, PlacementTeamMember, RecruiterStatus, Role, Student, User
from .schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate, AuditOut, CompanyBase, CompanyOut, DashboardOut, DriveCreate, DriveOut, DriveUpdate, LoginRequest, NotificationOut, ReportsOut, StudentCreate, StudentOut, TeamMemberCreate, TeamMemberOut, TeamMemberUpdate, Token, UserCreate, UserOut
from .security import create_access_token, hash_password, verify_password

try:
    import openpyxl
except ImportError:  # pragma: no cover
    openpyxl = None

try:
    import xlrd
except ImportError:  # pragma: no cover
    xlrd = None

Base.metadata.create_all(bind=engine)
ensure_sqlite_schema()


def seed_default_admin():
    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == "admin@rportal.com"))
        if existing:
            return

        admin = User(
            full_name="System Admin",
            email="admin@rportal.com",
            password_hash=hash_password("admin123"),
            role=Role.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()


seed_default_admin()
app = FastAPI(title="R-PORTAL API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=get_settings().origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
UPLOAD_DIR = Path("/tmp/uploads" if os.getenv("VERCEL") else "uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def audit_commit(db: Session):
    db.commit()


def create_notification(db: Session, recipient_id: int, title: str, message: str, notification_type: str, entity_type: str | None = None, entity_id: int | str | None = None):
    db.add(Notification(recipient_id=recipient_id, title=title, message=message, notification_type=notification_type, entity_type=entity_type, entity_id=str(entity_id) if entity_id is not None else None))


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(409, "An account with this email already exists")
    user = User(full_name=payload.full_name, email=str(payload.email).lower(), password_hash=hash_password(payload.password), role=payload.role)
    db.add(user); db.flush()
    log_action(db, user, "CREATE", "user", user.id, {"role": user.role.value, "email": user.email})
    audit_commit(db); db.refresh(user)
    return Token(access_token=create_access_token(str(user.id)), user=user)


@app.post("/api/auth/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account is inactive")
    log_action(db, user, "LOGIN", "user", user.id)
    audit_commit(db)
    return Token(access_token=create_access_token(str(user.id)), user=user)


@app.get("/api/auth/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current

@app.get("/api/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return db.scalars(select(User).where(User.is_active.is_(True)).order_by(User.full_name)).all()


@app.get("/api/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    drives = db.scalars(select(PlacementDrive).options(joinedload(PlacementDrive.company)).order_by(PlacementDrive.created_at.desc()).limit(5)).unique().all()
    activity = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(8)).all()
    total_students=db.scalar(select(func.count()).select_from(Student)) or 0; eligible=db.scalar(select(func.count()).select_from(Student).where(Student.is_eligible.is_(True))) or 0; placed=db.scalar(select(func.count()).select_from(Student).where(Student.placement_status==PlacementStatus.PLACED)) or 0
    return DashboardOut(total_students=total_students, eligible_students=eligible, placed_students=placed, placement_percentage=round((placed/total_students)*100,2) if total_students else 0, active_drives=db.scalar(select(func.count()).select_from(PlacementDrive).where(PlacementDrive.status == DriveStatus.OPEN,PlacementDrive.is_archived.is_(False))) or 0, total_companies=db.scalar(select(func.count()).select_from(Company)) or 0, total_applications=db.scalar(select(func.count()).select_from(Application)) or 0, offers=db.scalar(select(func.count()).select_from(Application).where(Application.status == ApplicationStatus.OFFERED)) or 0, recent_drives=drives, recent_activity=activity)


@app.get("/api/companies", response_model=list[CompanyOut])
def list_companies(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return db.scalars(select(Company).order_by(Company.name)).all()


@app.post("/api/companies", response_model=CompanyOut, status_code=201)
def create_company(payload: CompanyBase, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    if db.scalar(select(Company).where(Company.name == payload.name)):
        raise HTTPException(409, "A company with this name already exists")
    company = Company(**payload.model_dump()); db.add(company); db.flush(); log_action(db, current, "CREATE", "company", company.id, {"name": company.name}); audit_commit(db); db.refresh(company); return company


@app.put("/api/companies/{company_id}", response_model=CompanyOut)
def update_company(company_id: int, payload: CompanyBase, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    company = db.get(Company, company_id)
    if not company: raise HTTPException(404, "Company not found")
    for key, value in payload.model_dump().items(): setattr(company, key, value)
    log_action(db, current, "UPDATE", "company", company.id, {"name": company.name}); audit_commit(db); db.refresh(company); return company


@app.get("/api/drives", response_model=list[DriveOut])
def list_drives(status_filter: DriveStatus | None = None, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    query = select(PlacementDrive).options(joinedload(PlacementDrive.company)).order_by(PlacementDrive.created_at.desc())
    if status_filter: query = query.where(PlacementDrive.status == status_filter)
    return db.scalars(query).unique().all()


@app.post("/api/drives", response_model=DriveOut, status_code=201)
def create_drive(payload: DriveCreate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    if not db.get(Company, payload.company_id): raise HTTPException(404, "Company not found")
    drive = PlacementDrive(**payload.model_dump(), created_by_id=current.id); db.add(drive); db.flush(); log_action(db, current, "CREATE", "placement_drive", drive.id, {"title": drive.title, "status": drive.status.value})
    for recipient in db.scalars(select(User).where(User.is_active.is_(True), User.id != current.id, User.role.in_([Role.ADMIN, Role.MANAGER]))).all():
        create_notification(db, recipient.id, "New placement drive", f"{drive.title} was created for {drive.location}.", "DRIVE_CREATED", "placement_drive", drive.id)
    audit_commit(db); db.refresh(drive); return db.scalar(select(PlacementDrive).options(joinedload(PlacementDrive.company)).where(PlacementDrive.id == drive.id))


@app.put("/api/drives/{drive_id}", response_model=DriveOut)
def update_drive(drive_id: int, payload: DriveUpdate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    drive = db.get(PlacementDrive, drive_id)
    if not drive: raise HTTPException(404, "Placement drive not found")
    if not db.get(Company, payload.company_id): raise HTTPException(404, "Company not found")
    previous_status = drive.status.value
    for key, value in payload.model_dump().items(): setattr(drive, key, value)
    log_action(db, current, "STATUS_CHANGE" if previous_status != drive.status.value else "UPDATE", "placement_drive", drive.id, {"title": drive.title, "from": previous_status, "to": drive.status.value}); audit_commit(db)
    return db.scalar(select(PlacementDrive).options(joinedload(PlacementDrive.company)).where(PlacementDrive.id == drive.id))


@app.delete("/api/drives/{drive_id}", status_code=204)
def delete_drive(drive_id: int, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    drive = db.get(PlacementDrive, drive_id)
    if not drive: raise HTTPException(404, "Placement drive not found")
    log_action(db, current, "DELETE", "placement_drive", drive.id, {"title": drive.title}); db.delete(drive); audit_commit(db)


@app.get("/api/applications", response_model=list[ApplicationOut])
def list_applications(drive_id: int | None = None, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    query = select(Application).options(joinedload(Application.drive).joinedload(PlacementDrive.company)).order_by(Application.created_at.desc())
    if drive_id: query = query.where(Application.drive_id == drive_id)
    return db.scalars(query).unique().all()


@app.post("/api/applications", response_model=ApplicationOut, status_code=201)
def create_application(payload: ApplicationCreate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    if not db.get(PlacementDrive, payload.drive_id): raise HTTPException(404, "Placement drive not found")
    application = Application(**payload.model_dump()); db.add(application); db.flush(); log_action(db, current, "CREATE", "application", application.id, {"student_email": application.student_email}); audit_commit(db)
    return db.scalar(select(Application).options(joinedload(Application.drive).joinedload(PlacementDrive.company)).where(Application.id == application.id))


@app.patch("/api/applications/{application_id}/status", response_model=ApplicationOut)
def update_application_status(application_id: int, payload: ApplicationStatusUpdate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    application = db.get(Application, application_id)
    if not application: raise HTTPException(404, "Application not found")
    before = application.status.value; application.status = payload.status; log_action(db, current, "STATUS_CHANGE", "application", application.id, {"from": before, "to": payload.status.value})
    if application.student_id:
        student = db.get(Student, application.student_id)
        if student:
            pass
    audit_commit(db)
    return db.scalar(select(Application).options(joinedload(Application.drive).joinedload(PlacementDrive.company)).where(Application.id == application.id))


@app.post("/api/applications/{application_id}/resume", response_model=ApplicationOut)
def upload_resume(application_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    application = db.get(Application, application_id)
    if not application: raise HTTPException(404, "Application not found")
    if Path(file.filename or "").suffix.lower() not in {".pdf", ".doc", ".docx"}: raise HTTPException(400, "Only PDF, DOC and DOCX files are allowed")
    filename = f"{application.id}-{uuid4().hex}{Path(file.filename).suffix.lower()}"; target = UPLOAD_DIR / filename
    with target.open("wb") as buffer: shutil.copyfileobj(file.file, buffer)
    application.resume_path = filename; log_action(db, current, "UPLOAD", "application_resume", application.id, {"filename": filename}); audit_commit(db)
    return db.scalar(select(Application).options(joinedload(Application.drive).joinedload(PlacementDrive.company)).where(Application.id == application.id))


@app.get("/api/uploads/{filename}")
def download_upload(filename: str, current: User = Depends(get_current_user)):
    safe_name = Path(filename).name; path = UPLOAD_DIR / safe_name
    if not path.exists(): raise HTTPException(404, "File not found")
    return FileResponse(path)


@app.get("/api/audit", response_model=list[AuditOut])
def list_audit(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).all()

def _normalize_excel_header(value: object) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").strip().lower()).strip()


def _clean_excel_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _parse_excel_rows(file_bytes: bytes, filename: str):
    ext = Path(filename).suffix.lower()
    if ext not in {".xlsx", ".xls"}:
        raise ValueError("Only .xlsx and .xls files are supported.")
    if ext == ".xlsx":
        if openpyxl is None:
            raise ValueError("Excel import requires openpyxl to be installed.")
        workbook = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
        if not workbook.sheetnames:
            raise ValueError("The Excel file does not contain a sheet.")
        worksheet = workbook[workbook.sheetnames[0]]
        rows = list(worksheet.iter_rows(values_only=True))
    else:
        if xlrd is None:
            raise ValueError("Excel import requires xlrd to be installed.")
        workbook = xlrd.open_workbook(file_contents=file_bytes)
        sheet = workbook.sheet_by_index(0)
        rows = [[sheet.cell_value(row_index, col_index) for col_index in range(sheet.ncols)] for row_index in range(sheet.nrows)]
    
    if not rows:
        raise ValueError("The Excel file is empty.")
    
    # Find the header row by looking for known header keywords
    known_headers = {"roll no", "roll number", "registration number", "reg no", "student id", "name", "department", "email", "phone"}
    header_row_index = 0
    
    for idx, row in enumerate(rows):
        normalized_headers = {_normalize_excel_header(cell) for cell in row}
        if normalized_headers.intersection(known_headers):
            header_row_index = idx
            break
    
    # Remove rows before the header row
    rows = rows[header_row_index:]
    
    if not rows or not any(_clean_excel_value(cell) for cell in rows[0]):
        raise ValueError("The Excel file is empty or missing headers.")
    return rows


def _parse_placement_status(raw_value: object) -> PlacementStatus:
    value = _clean_excel_value(raw_value).lower().replace(" ", "")
    mapping = {
        "placed": PlacementStatus.PLACED,
        "selected": PlacementStatus.PLACED,
        "offer": PlacementStatus.PLACED,
        "hired": PlacementStatus.PLACED,
        "unplaced": PlacementStatus.SEEKING,
        "notplaced": PlacementStatus.SEEKING,
        "available": PlacementStatus.SEEKING,
        "seeking": PlacementStatus.SEEKING,
        "noteligible": PlacementStatus.NOT_ELIGIBLE,
        "ineligible": PlacementStatus.NOT_ELIGIBLE,
        "eligible": PlacementStatus.SEEKING,
    }
    return mapping.get(value, PlacementStatus.SEEKING)


def _coerce_float(value: object) -> float | None:
    if value is None or _clean_excel_value(value) == "":
        return None
    try:
        raw = _clean_excel_value(value).replace(",", "")
        number = float(raw)
    except (TypeError, ValueError):
        return None
    return number


@app.post("/api/students/import")
def import_students(file: UploadFile = File(...), db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No file selected.")

    ext = Path(file.filename).suffix.lower()
    if ext not in {".xlsx", ".xls"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .xlsx and .xls files are supported.")

    try:
        contents = file.file.read()
        rows = _parse_excel_rows(contents, file.filename)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid Excel file: {exc}") from exc

    headers = [_clean_excel_value(cell) for cell in rows[0]]
    header_map = {
        "registration number": "registration_number",
        "reg no": "registration_number",
        "reg no ": "registration_number",
        "student id": "registration_number",
        "roll number": "registration_number",
        "roll no": "registration_number",
        "name": "name",
        "full name": "name",
        "student name": "name",
        "email": "email",
        "student email": "email",
        "email address": "email",
        "phone": "phone",
        "mobile": "phone",
        "phone number": "phone",
        "mobile number": "phone",
        "department": "department",
        "branch": "department",
        "dept": "department",
        "year": "academic_details",
        "cgpa": "cgpa",
        "gpa": "cgpa",
        "10th percentage": "academic_details",
        "12th percentage": "academic_details",
        "sslc": "academic_details",
        "hsc": "academic_details",
        "diploma percentage": "academic_details",
        "backlogs": "academic_details",
        "skills": "skills",
        "resume link": "academic_details",
        "linkedin": "academic_details",
        "github": "academic_details",
        "github id": "academic_details",
        "placement status": "placement_status",
        "status": "placement_status",
        "company": "academic_details",
        "package": "offer_package_lpa",
        "drive link": "academic_details",
        "gender": "academic_details",
        "student type": "academic_details",
    }

    lookup = {}
    for index, header in enumerate(headers):
        normalized = _normalize_excel_header(header)
        target = header_map.get(normalized)
        if target:
            lookup[target] = index

    if not {"registration_number", "name", "department"}.issubset(set(lookup)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing required columns: Registration Number, Name, and Department.")

    created = []
    duplicates = 0
    invalid_rows = 0
    errors: list[str] = []

    for row_number, row in enumerate(rows[1:], start=2):
        if not any(_clean_excel_value(cell) for cell in row):
            continue

        registration_number = _clean_excel_value(row[lookup["registration_number"]]) if lookup.get("registration_number") is not None and lookup["registration_number"] < len(row) else ""
        name = _clean_excel_value(row[lookup["name"]]) if lookup.get("name") is not None and lookup["name"] < len(row) else ""
        email = _clean_excel_value(row[lookup["email"]]) if lookup.get("email") is not None and lookup["email"] < len(row) else ""
        department = _clean_excel_value(row[lookup["department"]]) if lookup.get("department") is not None and lookup["department"] < len(row) else ""

        if not registration_number:
            invalid_rows += 1
            errors.append(f"Row {row_number} - Missing registration number")
            continue

        normalized_registration = registration_number.strip()
        
        # Auto-generate email if not provided
        if not email or "@" not in email:
            email = f"{normalized_registration.lower().replace(' ', '.')}@student.rportal.local"
        
        email_lower = email.strip().lower()
        existing = db.scalar(
            select(Student).where(
                (Student.registration_number == normalized_registration)
                | (Student.email == email_lower)
            )
        )
        if existing:
            duplicates += 1
            errors.append(f"Row {row_number} - Duplicate registration number or email: {normalized_registration}")
            continue

        if not name:
            invalid_rows += 1
            errors.append(f"Row {row_number} - Missing student name")
            continue

        if not department:
            invalid_rows += 1
            errors.append(f"Row {row_number} - Missing department")
            continue

        phone = row[lookup["phone"]] if "phone" in lookup and lookup["phone"] < len(row) else None
        cgpa_raw = row[lookup["cgpa"]] if "cgpa" in lookup and lookup["cgpa"] < len(row) else None
        cgpa = None
        if cgpa_raw is not None and _clean_excel_value(cgpa_raw) != "":
            cgpa_value = _coerce_float(cgpa_raw)
            if cgpa_value is None or cgpa_value < 0 or cgpa_value > 10:
                invalid_rows += 1
                errors.append(f"Row {row_number} - Invalid CGPA")
                continue
            cgpa = str(cgpa_value)

        placement_status = _parse_placement_status(row[lookup["placement_status"]] if "placement_status" in lookup and lookup["placement_status"] < len(row) else "")
        is_eligible = placement_status != PlacementStatus.NOT_ELIGIBLE

        academic_parts = []
        for field_name in ["academic_details", "cgpa", "phone"]:
            if field_name in lookup and lookup[field_name] < len(row):
                value = _clean_excel_value(row[lookup[field_name]])
                if value:
                    academic_parts.append(value)
        academic_details = "; ".join(academic_parts) if academic_parts else None

        skills_raw = row[lookup["skills"]] if "skills" in lookup and lookup["skills"] < len(row) else None
        skills = _clean_excel_value(skills_raw) if skills_raw is not None else None
        offer_package_lpa = _clean_excel_value(row[lookup["offer_package_lpa"]]) if "offer_package_lpa" in lookup and lookup["offer_package_lpa"] < len(row) else None

        student = Student(
            registration_number=normalized_registration,
            name=name,
            email=email_lower,
            phone=_clean_excel_value(phone) if phone is not None else None,
            department=department,
            academic_details=academic_details,
            cgpa=cgpa,
            skills=skills,
            is_eligible=is_eligible,
            placement_status=placement_status,
            offer_package_lpa=offer_package_lpa or None,
            drive_links=[],
        )

        try:
            db.add(student)
            db.flush()
            created.append(student)
        except Exception:
            db.rollback()
            invalid_rows += 1
            errors.append(f"Row {row_number} - Database validation failed")
            continue

    if not created:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, {"message": "Import failed", "imported": 0, "duplicates": duplicates, "invalid": invalid_rows, "errors": errors[:20]})

    try:
        db.commit()
    except Exception as exc:  # pragma: no cover
        db.rollback()
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "The import could not be saved. Please review the uploaded rows and try again.") from exc

    return {
        "message": "Import completed",
        "imported": len(created),
        "duplicates": duplicates,
        "invalid": invalid_rows,
        "errors": errors[:20],
    }


@app.get("/api/students", response_model=list[StudentOut])
def list_students(query: str | None = None, department: str | None = None, eligible: bool | None = None, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    stmt=select(Student).order_by(Student.name)
    if query: stmt=stmt.where((Student.name.ilike(f"%{query}%")) | (Student.email.ilike(f"%{query}%")) | (Student.registration_number.ilike(f"%{query}%")))
    if department: stmt=stmt.where(Student.department==department)
    if eligible is not None: stmt=stmt.where(Student.is_eligible==eligible)
    return db.scalars(stmt).all()
@app.get("/api/students/{student_id}", response_model=StudentOut)
def get_student(student_id:int,db:Session=Depends(get_db),current:User=Depends(get_current_user)):
    student=db.get(Student,student_id)
    if not student: raise HTTPException(404,"Student not found")
    return student
@app.post("/api/students",response_model=StudentOut,status_code=201)
def create_student(payload:StudentCreate,db:Session=Depends(get_db),current:User=Depends(require_roles(Role.ADMIN))):
    if db.scalar(select(Student).where((Student.email==payload.email)|(Student.registration_number==payload.registration_number))): raise HTTPException(409,"Student email or registration number already exists")
    student=Student(**payload.model_dump());db.add(student);db.flush();log_action(db,current,"CREATE","student",student.id,{"registration_number":student.registration_number});audit_commit(db);db.refresh(student);return student
@app.put("/api/students/{student_id}",response_model=StudentOut)
def update_student(student_id:int,payload:StudentCreate,db:Session=Depends(get_db),current:User=Depends(require_roles(Role.ADMIN))):
    student=db.get(Student,student_id)
    if not student: raise HTTPException(404,"Student not found")
    for key,value in payload.model_dump().items(): setattr(student,key,value)
    log_action(db,current,"UPDATE","student",student.id);audit_commit(db);db.refresh(student);return student
@app.delete("/api/students/{student_id}",status_code=204)
def delete_student(student_id:int,db:Session=Depends(get_db),current:User=Depends(require_roles(Role.ADMIN))):
    student=db.get(Student,student_id)
    if not student: raise HTTPException(404,"Student not found")
    log_action(db,current,"DELETE","student",student.id);db.delete(student);audit_commit(db)

@app.get("/api/recruiters/active",response_model=list[CompanyOut])
def active_recruiters(db:Session=Depends(get_db),current:User=Depends(get_current_user)):
    return db.scalars(select(Company).where(Company.recruiter_status.in_([RecruiterStatus.HOT,RecruiterStatus.WARM])).order_by(Company.recruiter_status,Company.name)).all()

@app.get("/api/recruiters",response_model=list[CompanyOut])
def list_recruiters(status:str|None=None,search:str|None=None,db:Session=Depends(get_db),current:User=Depends(get_current_user)):
    query=select(Company)
    if status and status!="ALL":
        query=query.where(Company.recruiter_status==RecruiterStatus(status))
    if search:
        query=query.where((Company.name.ilike(f"%{search}%"))|(Company.contact_name.ilike(f"%{search}%"))|(Company.contact_email.ilike(f"%{search}%")))
    return db.scalars(query.order_by(Company.recruiter_status,Company.name)).all()

@app.post("/api/recruiters",response_model=CompanyOut,status_code=201)
def create_recruiter(payload:CompanyBase,db:Session=Depends(get_db),current:User=Depends(require_roles(Role.ADMIN))):
    if db.scalar(select(Company).where(Company.name==payload.name)):
        raise HTTPException(409,"A recruiter with this name already exists")
    company=Company(**payload.model_dump());db.add(company);db.flush();log_action(db,current,"CREATE","recruiter",company.id,{"name":company.name,"status":company.recruiter_status.value});audit_commit(db);db.refresh(company);return company

@app.put("/api/recruiters/{recruiter_id}",response_model=CompanyOut)
def update_recruiter(recruiter_id:int,payload:CompanyBase,db:Session=Depends(get_db),current:User=Depends(require_roles(Role.ADMIN))):
    company=db.get(Company,recruiter_id)
    if not company:raise HTTPException(404,"Recruiter not found")
    old_status=company.recruiter_status.value
    for key,value in payload.model_dump().items():setattr(company,key,value)
    log_action(db,current,"UPDATE","recruiter",company.id,{"name":company.name,"old_status":old_status,"new_status":company.recruiter_status.value});audit_commit(db);db.refresh(company);return company

@app.delete("/api/recruiters/{recruiter_id}",status_code=204)
def delete_recruiter(recruiter_id:int,db:Session=Depends(get_db),current:User=Depends(require_roles(Role.ADMIN))):
    company=db.get(Company,recruiter_id)
    if not company:raise HTTPException(404,"Recruiter not found")
    log_action(db,current,"DELETE","recruiter",company.id,{"name":company.name});db.delete(company);audit_commit(db)

def _team_member_payload(member: PlacementTeamMember):
    assigned_drives = []
    for assignment in sorted(member.drive_assignments, key=lambda item: item.created_at, reverse=True):
        if assignment.drive is not None:
            assigned_drives.append({
                "id": assignment.drive.id,
                "title": assignment.drive.title,
                "company": assignment.drive.company.name if assignment.drive.company else "—",
                "drive_date": assignment.drive.drive_date.isoformat() if assignment.drive.drive_date else None,
                "status": assignment.drive.status.value if assignment.drive.status else None,
                "responsibility": assignment.responsibility,
            })
    return {
        "id": member.id,
        "user_id": member.user_id,
        "role": member.role,
        "responsibility": member.responsibility,
        "department": member.department,
        "phone": member.phone,
        "assignment": member.assignment,
        "is_active": member.is_active,
        "is_team_lead": member.is_team_lead,
        "invitation_status": member.invitation_status,
        "joined_date": member.joined_date,
        "created_at": member.created_at,
        "updated_at": member.updated_at,
        "user": member.user,
        "assigned_drives": assigned_drives,
    }

@app.post("/api/placement-team/import")
def import_placement_team(file: UploadFile = File(...), db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    if not file.filename or Path(file.filename).suffix.lower() not in {".xlsx", ".xls"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .xlsx and .xls files are supported.")
    try:
        rows = _parse_excel_rows(file.file.read(), file.filename)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid Excel file: {exc}") from exc

    headers = [_normalize_excel_header(cell) for cell in rows[0]]
    aliases = {
        "email": {"email", "user email", "email address"},
        "role": {"role", "team role"},
        "responsibility": {"responsibility", "responsibility area"},
        "department": {"department", "team department"},
        "phone": {"phone", "phone number", "mobile"},
        "assignment": {"assignment", "assignment name"},
        "company": {"company", "company name"},
        "drive": {"drive", "drive title", "placement drive"},
        "team_lead": {"team lead", "is team lead", "lead"},
        "is_active": {"active", "is active", "status"},
    }
    lookup = {target: next((index for index, header in enumerate(headers) if header in names), None) for target, names in aliases.items()}
    if lookup["email"] is None or lookup["responsibility"] is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing required columns: Email and Responsibility.")

    imported = 0
    duplicates = 0
    invalid = 0
    errors = []

    def cell(row, field):
        index = lookup[field]
        return _clean_excel_value(row[index]) if index is not None and index < len(row) else ""

    def truthy(value, default=True):
        normalized = value.lower()
        if not normalized:
            return default
        return normalized not in {"false", "0", "no", "inactive", "in-active"}

    for row_number, row in enumerate(rows[1:], start=2):
        if not any(_clean_excel_value(value) for value in row):
            continue
        email = cell(row, "email").lower()
        responsibility = cell(row, "responsibility")
        user = db.scalar(select(User).where(User.email == email))
        if not user or not responsibility:
            invalid += 1
            errors.append(f"Row {row_number} - Existing user email and responsibility are required")
            continue
        if db.scalar(select(PlacementTeamMember).where(PlacementTeamMember.user_id == user.id)):
            duplicates += 1
            continue

        member = PlacementTeamMember(
            user_id=user.id,
            role=cell(row, "role") or "Placement Officer",
            responsibility=responsibility,
            department=cell(row, "department") or None,
            phone=cell(row, "phone") or None,
            assignment=cell(row, "assignment") or None,
            is_active=truthy(cell(row, "is_active")),
            is_team_lead=truthy(cell(row, "team_lead"), False),
            invited_by_id=current.id,
            invitation_status="ACTIVE" if truthy(cell(row, "is_active")) else "INACTIVE",
        )
        db.add(member)
        db.flush()

        company_name = cell(row, "company")
        drive_title = cell(row, "drive")
        if company_name or drive_title:
            drives = db.scalars(select(PlacementDrive).options(joinedload(PlacementDrive.company)).order_by(PlacementDrive.created_at.desc())).unique().all()
            matching_drive = next((drive for drive in drives if (not company_name or (drive.company and drive.company.name.lower() == company_name.lower())) and (not drive_title or drive.title.lower() == drive_title.lower())), None)
            if matching_drive:
                db.add(PlacementTeamDriveAssignment(team_member_id=member.id, drive_id=matching_drive.id, responsibility=cell(row, "assignment") or responsibility))
            else:
                errors.append(f"Row {row_number} - No matching existing company/drive assignment found")
        imported += 1

    if not imported:
        db.rollback()
        raise HTTPException(status.HTTP_400_BAD_REQUEST, {"message": "Import failed", "imported": 0, "duplicates": duplicates, "invalid": invalid, "errors": errors[:20]})
    db.commit()
    return {"message": "Import completed", "imported": imported, "duplicates": duplicates, "invalid": invalid, "errors": errors[:20]}

@app.get("/api/placement-team", response_model=list[TeamMemberOut])
def list_placement_team(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    members = db.scalars(
        select(PlacementTeamMember)
        .options(
            joinedload(PlacementTeamMember.user),
            joinedload(PlacementTeamMember.drive_assignments).joinedload(PlacementTeamDriveAssignment.drive).joinedload(PlacementDrive.company),
        )
        .order_by(PlacementTeamMember.created_at.desc())
    ).unique().all()
    return [_team_member_payload(member) for member in members]

@app.get("/api/team", response_model=list[TeamMemberOut])
def list_team(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    return list_placement_team(db=db, current=current)

@app.get("/api/placement-team/{member_id}", response_model=TeamMemberOut)
def get_placement_team_member(member_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    member = db.scalar(select(PlacementTeamMember).options(joinedload(PlacementTeamMember.user), joinedload(PlacementTeamMember.drive_assignments).joinedload(PlacementTeamDriveAssignment.drive).joinedload(PlacementDrive.company)).where(PlacementTeamMember.id == member_id))
    if not member:
        raise HTTPException(404, "Team member not found")
    return _team_member_payload(member)

@app.post("/api/placement-team", response_model=TeamMemberOut, status_code=201)
def add_team_member(payload: TeamMemberCreate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    if not db.get(User, payload.user_id):
        raise HTTPException(404, "User not found")
    if db.scalar(select(PlacementTeamMember).where(PlacementTeamMember.user_id == payload.user_id)):
        raise HTTPException(409, "User is already in the placement team")
    member = PlacementTeamMember(
        user_id=payload.user_id,
        role=payload.role,
        responsibility=payload.responsibility,
        department=payload.department,
        phone=payload.phone,
        assignment=payload.assignment,
        is_active=payload.is_active,
        is_team_lead=payload.is_team_lead,
        invited_by_id=current.id,
        invitation_status="ACTIVE",
    )
    db.add(member)
    db.flush()
    log_action(db, current, "CREATE", "placement_team_member", member.id, {"name": db.get(User, payload.user_id).full_name, "role": payload.role})
    audit_commit(db)
    return _team_member_payload(db.scalar(select(PlacementTeamMember).options(joinedload(PlacementTeamMember.user), joinedload(PlacementTeamMember.drive_assignments).joinedload(PlacementTeamDriveAssignment.drive).joinedload(PlacementDrive.company)).where(PlacementTeamMember.id == member.id)))

@app.post("/api/team", response_model=TeamMemberOut, status_code=201)
def add_team_member_legacy(payload: TeamMemberCreate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    return add_team_member(payload=payload, db=db, current=current)

@app.patch("/api/placement-team/{member_id}", response_model=TeamMemberOut)
def update_team_member(member_id: int, payload: TeamMemberUpdate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    member = db.get(PlacementTeamMember, member_id)
    if not member:
        raise HTTPException(404, "Team member not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    if payload.is_active is not None:
        member.invitation_status = "ACTIVE" if payload.is_active else "INACTIVE"
    log_action(db, current, "UPDATE", "placement_team_member", member.id, {"name": member.user.full_name if member.user else "team_member", "status": member.is_active})
    audit_commit(db)
    return _team_member_payload(db.scalar(select(PlacementTeamMember).options(joinedload(PlacementTeamMember.user), joinedload(PlacementTeamMember.drive_assignments).joinedload(PlacementTeamDriveAssignment.drive).joinedload(PlacementDrive.company)).where(PlacementTeamMember.id == member.id)))

@app.patch("/api/team/{member_id}", response_model=TeamMemberOut)
def update_team_member_legacy(member_id: int, payload: TeamMemberUpdate, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    return update_team_member(member_id=member_id, payload=payload, db=db, current=current)

@app.get("/api/placement-team/{member_id}/drives", response_model=list[dict])
def get_member_drive_assignments(member_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    member = db.get(PlacementTeamMember, member_id)
    if not member:
        raise HTTPException(404, "Team member not found")
    return [{
        "id": assignment.id,
        "drive_id": assignment.drive_id,
        "title": assignment.drive.title if assignment.drive else None,
        "company": assignment.drive.company.name if assignment.drive and assignment.drive.company else None,
        "responsibility": assignment.responsibility,
        "status": assignment.drive.status.value if assignment.drive and assignment.drive.status else None,
    } for assignment in member.drive_assignments]

@app.post("/api/placement-team/{member_id}/drives", response_model=dict, status_code=201)
def assign_drive_to_member(member_id: int, payload: dict, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    member = db.get(PlacementTeamMember, member_id)
    if not member:
        raise HTTPException(404, "Team member not found")
    drive_id = payload.get("drive_id")
    drive = db.get(PlacementDrive, drive_id)
    if not drive:
        raise HTTPException(404, "Placement drive not found")
    if db.scalar(select(PlacementTeamDriveAssignment).where(PlacementTeamDriveAssignment.team_member_id == member_id, PlacementTeamDriveAssignment.drive_id == drive_id)):
        raise HTTPException(409, "This drive is already assigned to the team member")
    assignment = PlacementTeamDriveAssignment(team_member_id=member_id, drive_id=drive_id, responsibility=payload.get("responsibility") or member.responsibility)
    db.add(assignment)
    db.flush()
    log_action(db, current, "ASSIGN_DRIVE", "placement_team_member", member.id, {"drive_id": drive_id, "drive_title": drive.title})
    audit_commit(db)
    return {"message": "Drive assigned successfully", "assignment_id": assignment.id, "team_member_id": member_id, "drive_id": drive_id}

@app.delete("/api/placement-team/{member_id}/drives/{drive_id}", status_code=204)
def remove_drive_from_member(member_id: int, drive_id: int, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    assignment = db.scalar(select(PlacementTeamDriveAssignment).where(PlacementTeamDriveAssignment.team_member_id == member_id, PlacementTeamDriveAssignment.drive_id == drive_id))
    if not assignment:
        raise HTTPException(404, "Drive assignment not found")
    log_action(db, current, "REMOVE_DRIVE_ASSIGNMENT", "placement_team_member", member_id, {"drive_id": drive_id})
    db.delete(assignment)
    audit_commit(db)

@app.get("/api/notifications",response_model=list[NotificationOut])
def notifications(db:Session=Depends(get_db),current:User=Depends(get_current_user)):
    return db.scalars(select(Notification).where(Notification.recipient_id==current.id).order_by(Notification.created_at.desc())).all()

@app.get("/api/notifications/unread-count")
def notification_count(db:Session=Depends(get_db),current:User=Depends(get_current_user)):
    return {"unread_count":db.scalar(select(func.count()).select_from(Notification).where(Notification.recipient_id==current.id,Notification.is_read.is_(False))) or 0}

@app.patch("/api/notifications/{notification_id}/read",response_model=NotificationOut)
def mark_notification_read(notification_id:int,db:Session=Depends(get_db),current:User=Depends(get_current_user)):
    note=db.get(Notification,notification_id)
    if not note or note.recipient_id!=current.id:raise HTTPException(404,"Notification not found")
    from datetime import datetime, timezone
    note.is_read=True;note.read_at=datetime.now(timezone.utc);audit_commit(db);return note

@app.patch("/api/notifications/read-all", response_model=dict)
def mark_all_notifications_read(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    from datetime import datetime, timezone
    db.execute(
        update(Notification)
        .where(Notification.recipient_id == current.id, Notification.is_read.is_(False))
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )

    audit_commit(db)
    return {"message": "All notifications marked as read"}

@app.get("/api/reports", response_model=ReportsOut)
def reports(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    total = db.scalar(select(func.count()).select_from(Student)) or 0
    eligible = db.scalar(select(func.count()).select_from(Student).where(Student.is_eligible.is_(True))) or 0
    placed = db.scalar(select(func.count()).select_from(Student).where(Student.placement_status == PlacementStatus.PLACED)) or 0
    unplaced = db.scalar(select(func.count()).select_from(Student).where(Student.placement_status == PlacementStatus.SEEKING)) or 0
    departments = [{"department": name, "placed": count} for name, count in db.execute(select(Student.department, func.count()).where(Student.placement_status == PlacementStatus.PLACED).group_by(Student.department)).all()]
    funnel = [{"status": status.value, "count": count} for status, count in db.execute(select(Application.status, func.count()).group_by(Application.status)).all()]
    cold = db.scalar(select(func.count()).select_from(Company).where(Company.recruiter_status == RecruiterStatus.COLD)) or 0
    warm = db.scalar(select(func.count()).select_from(Company).where(Company.recruiter_status == RecruiterStatus.WARM)) or 0
    hot = db.scalar(select(func.count()).select_from(Company).where(Company.recruiter_status == RecruiterStatus.HOT)) or 0

    companies = db.scalars(select(Company)).all()
    recruiter_metrics = []
    for company in companies:
        total_drives = db.scalar(select(func.count()).select_from(PlacementDrive).where(PlacementDrive.company_id == company.id)) or 0
        active_drives = db.scalar(select(func.count()).select_from(PlacementDrive).where(PlacementDrive.company_id == company.id, PlacementDrive.status == DriveStatus.OPEN, PlacementDrive.is_archived.is_(False))) or 0
        total_apps = db.scalar(select(func.count()).select_from(Application).join(PlacementDrive).where(PlacementDrive.company_id == company.id)) or 0
        selected_c = db.scalar(select(func.count()).select_from(Application).join(PlacementDrive).where(PlacementDrive.company_id == company.id, Application.status == ApplicationStatus.OFFERED)) or 0
        rejected_c = db.scalar(select(func.count()).select_from(Application).join(PlacementDrive).where(PlacementDrive.company_id == company.id, Application.status == ApplicationStatus.REJECTED)) or 0
        recruiter_metrics.append({
            "company_id": company.id,
            "company_name": company.name,
            "contact_name": company.contact_name,
            "contact_email": company.contact_email,
            "status": company.recruiter_status,
            "total_drives": total_drives,
            "active_drives": active_drives,
            "total_applications": total_apps,
            "selected_count": selected_c,
            "rejected_count": rejected_c,
            "last_engagement": company.updated_at,
        })

    return ReportsOut(
        total_students=total,
        eligible_students=eligible,
        placed_students=placed,
        unplaced_students=unplaced,
        placement_percentage=round(placed * 100 / total, 2) if total else 0.0,
        total_companies=len(companies),
        cold_recruiters=cold,
        warm_recruiters=warm,
        hot_recruiters=hot,
        applications=db.scalar(select(func.count()).select_from(Application)) or 0,
        offers=db.scalar(select(func.count()).select_from(Application).where(Application.status == ApplicationStatus.OFFERED)) or 0,
        active_drives=db.scalar(select(func.count()).select_from(PlacementDrive).where(PlacementDrive.status == DriveStatus.OPEN, PlacementDrive.is_archived.is_(False))) or 0,
        department_placements=departments,
        application_funnel=funnel,
        recruiter_metrics=recruiter_metrics,
    )



# Serve frontend static files
from fastapi.staticfiles import StaticFiles
@app.delete("/api/placement-team/{member_id}", status_code=204)
def delete_team_member(member_id: int, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    member = db.get(PlacementTeamMember, member_id)
    if not member:
        raise HTTPException(404, "Team member not found")
    db.delete(member)
    log_action(db, current, "DELETE", "placement_team_member", member_id, {})
    audit_commit(db)
    return None


@app.delete("/api/applications/{application_id}", status_code=204)
def delete_application(application_id: int, db: Session = Depends(get_db), current: User = Depends(require_roles(Role.ADMIN))):
    application = db.get(Application, application_id)
    if not application:
        raise HTTPException(404, "Application not found")
    db.delete(application)
    log_action(db, current, "DELETE", "application", application_id, {})
    audit_commit(db)
    return None


from fastapi.responses import FileResponse

frontend_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist"
)

if os.path.exists(frontend_dir):
    assets_dir = os.path.join(frontend_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        if catchall.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        
        file_path = os.path.join(frontend_dir, catchall)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(frontend_dir, "index.html"))

