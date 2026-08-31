import io
import re
from typing import Any, Dict, List, Optional, Set, Tuple

COMMON_TECH_SKILLS = [
    "python", "java", "c++", "c#", "javascript", "typescript", "html", "css",
    "react", "angular", "vue", "node.js", "nodejs", "express", "django", "fastapi",
    "flask", "spring", "spring boot", "sql", "mysql", "postgresql", "mongodb",
    "oracle", "redis", "aws", "azure", "gcp", "docker", "kubernetes", "git",
    "github", "ci/cd", "rest api", "graphql", "machine learning", "deep learning",
    "data science", "nlp", "computer vision", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "data structures", "algorithms", "linux", "agile",
    "jira", "devops", "cloud computing", "cybersecurity", "networking", "c",
    "embedded systems", "vlsi", "matlab", "autocad", "solidworks", "tableau", "power bi"
]

COMMON_DEPARTMENTS = [
    "cse", "computer science", "it", "information technology", "ece",
    "electronics & communication", "eee", "electrical & electronics",
    "aids", "artificial intelligence", "aiml", "mechanical", "mech",
    "civil", "mca", "bca", "bsc cs", "b.tech", "b.e", "m.tech"
]


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extracts raw text safely from PDF, DOCX, TXT or CSV files."""
    if not file_bytes:
        return ""
    name_lower = (filename or "").lower()

    if name_lower.endswith(".pdf"):
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text_parts.append(extracted)
            return "\n".join(text_parts).strip()
        except Exception:
            return ""

    elif name_lower.endswith(".docx"):
        try:
            import docx
            doc = docx.Document(io.BytesIO(file_bytes))
            return "\n".join([p.text for p in doc.paragraphs if p.text]).strip()
        except Exception:
            return ""

    else:
        for enc in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
            try:
                return file_bytes.decode(enc).strip()
            except Exception:
                continue
        return ""


def clean_skill_string(skill: str) -> str:
    """Normalizes skill text for robust fuzzy token matching."""
    s = skill.strip().lower()
    s = re.sub(r"[\(\)\[\]\{\}]", "", s)
    if s in ["react.js", "reactjs"]:
        return "react"
    if s in ["node.js", "nodejs"]:
        return "node.js"
    if s in ["c++", "cpp"]:
        return "c++"
    if s in ["c#", "csharp"]:
        return "c#"
    return s


def parse_skills_list(skills_text: Optional[str]) -> List[str]:
    """Splits comma/newline/semicolon/bullet separated skills into a clean list."""
    if not skills_text:
        return []
    raw = re.split(r"[,;\n\r\t•|/]+", skills_text)
    result = []
    seen = set()
    for item in raw:
        cleaned = clean_skill_string(item)
        if cleaned and len(cleaned) >= 2 and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def parse_jd_text(text: str) -> Dict[str, Any]:
    """Extracts structured requirements from Job Description text."""
    if not text:
        return {
            "required_skills": [],
            "preferred_skills": [],
            "min_cgpa": "6.0",
            "max_backlogs": 0,
            "eligible_departments": [],
            "package_lpa": None,
            "detected_roles": [],
        }

    lower_text = text.lower()

    # Detect skills mentioned in text
    detected_skills = []
    for skill in COMMON_TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, lower_text):
            detected_skills.append(skill.title() if len(skill) > 3 else skill.upper())

    # Detect CGPA
    cgpa_match = re.search(r"(?:cgpa|gpa|percentage|cut-?off)[\s:=]+([0-9]+(?:\.[0-9]+)?)", lower_text)
    min_cgpa = "6.0"
    if cgpa_match:
        val = float(cgpa_match.group(1))
        if 0 < val <= 10:
            min_cgpa = str(val)
        elif 50 <= val <= 100:
            min_cgpa = f"{val/10:.1f}"

    # Detect Backlogs
    max_backlogs = 0
    if re.search(r"(?:no|0|zero)\s+(?:active\s+)?backlogs?", lower_text):
        max_backlogs = 0
    else:
        bl_match = re.search(r"(?:max|maximum|up\s+to|at\s+most)\s+([0-9]+)\s+backlogs?", lower_text)
        if bl_match:
            max_backlogs = int(bl_match.group(1))

    # Detect Departments
    eligible_depts = []
    for dept in ["CSE", "IT", "ECE", "EEE", "AIDS", "AIML", "MECH", "CIVIL", "MCA"]:
        if re.search(r"\b" + re.escape(dept.lower()) + r"\b", lower_text):
            eligible_depts.append(dept)

    # Detect Salary / Package
    package_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)?\s*([0-9]+(?:\.[0-9]+)?)?\s*(?:lpa|lakhs?|ctc|inr)", lower_text)
    package_lpa = None
    if package_match:
        if package_match.group(2):
            package_lpa = f"{package_match.group(1)} - {package_match.group(2)} LPA"
        else:
            package_lpa = f"{package_match.group(1)} LPA"

    return {
        "required_skills": detected_skills[:8],
        "preferred_skills": detected_skills[8:14],
        "min_cgpa": min_cgpa,
        "max_backlogs": max_backlogs,
        "eligible_departments": eligible_depts or ["CSE", "IT", "ECE", "AIDS"],
        "package_lpa": package_lpa,
        "extracted_text_preview": text[:400] + ("..." if len(text) > 400 else ""),
    }


def calculate_ats_match(student: Any, drive: Any) -> Dict[str, Any]:
    """
    Computes an ATS Match percentage score & full criteria breakdown
    for a student candidate against a Placement Drive / Job Description.
    """
    reasons = []
    
    # 1. Parse Drive requirements
    drive_req_skills = parse_skills_list(getattr(drive, "required_skills", "") or getattr(drive, "skills", ""))
    drive_pref_skills = parse_skills_list(getattr(drive, "preferred_skills", "") or "")
    drive_depts = parse_skills_list(getattr(drive, "departments", "") or "")
    
    # CGPA threshold
    drive_min_cgpa = 6.0
    try:
        raw_min = getattr(drive, "min_cgpa", None) or "6.0"
        drive_min_cgpa = float(str(raw_min).strip().split()[0])
    except Exception:
        drive_min_cgpa = 6.0

    drive_max_backlogs = getattr(drive, "max_backlogs", 0) or 0

    # 2. Parse Student profile
    student_skills_raw = getattr(student, "skills", "") or ""
    student_skills = parse_skills_list(student_skills_raw)
    student_skills_set = set(student_skills)

    # Student CGPA
    student_cgpa = 0.0
    try:
        raw_cgpa = getattr(student, "cgpa", "") or "0"
        clean_cgpa = re.search(r"([0-9]+(?:\.[0-9]+)?)", str(raw_cgpa))
        if clean_cgpa:
            student_cgpa = float(clean_cgpa.group(1))
            if student_cgpa > 10.0 and student_cgpa <= 100.0:
                student_cgpa = round(student_cgpa / 10.0, 2)
    except Exception:
        student_cgpa = 0.0

    student_dept = str(getattr(student, "department", "") or "").strip().upper()

    # 3. Calculate Skills Match
    matched_req = []
    missing_req = []
    for r_skill in drive_req_skills:
        # Check exact or substring token match
        found = False
        for s_skill in student_skills_set:
            if r_skill == s_skill or r_skill in s_skill or s_skill in r_skill:
                found = True
                break
        if found:
            matched_req.append(r_skill)
        else:
            missing_req.append(r_skill)

    matched_pref = []
    for p_skill in drive_pref_skills:
        found = False
        for s_skill in student_skills_set:
            if p_skill == s_skill or p_skill in s_skill or s_skill in p_skill:
                found = True
                break
        if found:
            matched_pref.append(p_skill)

    total_req_count = len(drive_req_skills) or 1
    req_match_pct = (len(matched_req) / total_req_count) * 100.0

    pref_match_pct = 100.0
    if drive_pref_skills:
        pref_match_pct = (len(matched_pref) / len(drive_pref_skills)) * 100.0

    skills_score = min(100.0, (req_match_pct * 0.8) + (pref_match_pct * 0.2))

    if missing_req:
        reasons.append(f"Missing required skill(s): {', '.join(missing_req[:3])}")
    if matched_req:
        reasons.append(f"Matched {len(matched_req)}/{len(drive_req_skills)} required skills")

    # 4. Calculate Academic / CGPA Match
    academic_score = 100.0
    academic_eligible = True
    if student_cgpa > 0:
        if student_cgpa >= drive_min_cgpa:
            academic_score = 100.0
            reasons.append(f"CGPA {student_cgpa} meets minimum cut-off {drive_min_cgpa}")
        else:
            academic_eligible = False
            deficit = drive_min_cgpa - student_cgpa
            academic_score = max(20.0, 100.0 - (deficit * 40.0))
            reasons.append(f"CGPA {student_cgpa} is below minimum requirement {drive_min_cgpa}")
    else:
        academic_score = 75.0

    # 5. Calculate Department Match
    dept_score = 100.0
    dept_eligible = True
    if drive_depts:
        dept_match = False
        for d in drive_depts:
            if d.upper() in student_dept or student_dept in d.upper():
                dept_match = True
                break
        if dept_match:
            dept_score = 100.0
            reasons.append(f"Department {student_dept} is eligible")
        else:
            dept_eligible = False
            dept_score = 30.0
            reasons.append(f"Department {student_dept} not in target branches ({', '.join(drive_depts[:4])})")

    # 6. Experience / Profile completeness
    profile_score = 90.0 if student_skills else 50.0

    # Overall Composite Weighted ATS Score
    # 50% Skills, 25% Academic, 15% Department, 10% Profile completeness
    overall_score = round(
        (skills_score * 0.50) +
        (academic_score * 0.25) +
        (dept_score * 0.15) +
        (profile_score * 0.10)
    )
    overall_score = max(5, min(99, overall_score))

    # Overall Eligibility Status
    is_overall_eligible = academic_eligible and dept_eligible and (getattr(student, "is_eligible", True) is not False)

    return {
        "student_id": getattr(student, "id", None),
        "student_name": getattr(student, "name", ""),
        "registration_number": getattr(student, "registration_number", ""),
        "department": student_dept,
        "cgpa": student_cgpa,
        "skills": student_skills,
        "ats_score": overall_score,
        "skills_match_pct": round(skills_score),
        "academic_match_pct": round(academic_score),
        "dept_match_pct": round(dept_score),
        "matched_skills": matched_req,
        "missing_skills": missing_req,
        "matched_preferred_skills": matched_pref,
        "is_eligible": is_overall_eligible,
        "reasons": reasons,
    }
