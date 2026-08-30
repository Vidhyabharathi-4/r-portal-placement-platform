from datetime import datetime, timezone
from app.database import SessionLocal
from app.models import Company, PlacementDrive, RecruiterStatus, DriveStatus, User, Role
from app.security import hash_password

COMPANIES_AND_DRIVES = [
    {
        "company_name": "Zoho Corporation",
        "website": "https://www.zoho.com",
        "industry": "Enterprise Software / SaaS",
        "contact_name": "Karthik Raja",
        "contact_email": "campus@zohocorp.com",
        "recruiter_status": RecruiterStatus.HOT,
        "title": "Software Engineer",
        "location": "Chennai",
        "package_lpa": "9.0 LPA",
        "eligibility": "B.E / B.Tech (CSE, IT, ECE, AI&DS) - Min 7.0 CGPA with no standing backlogs",
        "drive_date": datetime(2026, 9, 15, 9, 30, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Full-stack development, Java, Python, Javascript and algorithms engineering for core Zoho products.",
        "departments": "CSE, IT, ECE, AI&DS",
        "work_mode": "On-site (Chennai)",
    },
    {
        "company_name": "Amazon Web Services",
        "website": "https://aws.amazon.com",
        "industry": "Cloud Computing / E-Commerce",
        "contact_name": "Rohan Deshmukh",
        "contact_email": "aws-campus@amazon.com",
        "recruiter_status": RecruiterStatus.HOT,
        "title": "Cloud Support Associate",
        "location": "Bangalore",
        "package_lpa": "14.5 LPA",
        "eligibility": "B.E / B.Tech (All Circuits Branches) - Min 7.5 CGPA",
        "drive_date": datetime(2026, 9, 22, 10, 0, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Troubleshoot distributed cloud infrastructure, AWS EC2, S3, networking, and virtualization.",
        "departments": "CSE, IT, ECE, EEE",
        "work_mode": "Hybrid (Bangalore)",
    },
    {
        "company_name": "Tata Consultancy Services",
        "website": "https://www.tcs.com",
        "industry": "IT Services & Consulting",
        "contact_name": "Lakshmi Narayanan",
        "contact_email": "campus.recruitment@tcs.com",
        "recruiter_status": RecruiterStatus.WARM,
        "title": "Systems Engineer (Digital)",
        "location": "Chennai",
        "package_lpa": "7.2 LPA",
        "eligibility": "B.E / B.Tech (All Engineering Branches) - Min 6.5 CGPA",
        "drive_date": datetime(2026, 10, 5, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Digital application engineering across Cloud, DevOps, and Enterprise Microservices.",
        "departments": "All Engineering",
        "work_mode": "On-site (Chennai)",
    },
    {
        "company_name": "Infosys Limited",
        "website": "https://www.infosys.com",
        "industry": "IT Services",
        "contact_name": "Arun Kumar",
        "contact_email": "campus_connect@infosys.com",
        "recruiter_status": RecruiterStatus.WARM,
        "title": "Specialist Programmer",
        "location": "Bangalore",
        "package_lpa": "9.5 LPA",
        "eligibility": "B.E / B.Tech (CSE / IT) - Min 7.0 CGPA",
        "drive_date": datetime(2026, 10, 12, 9, 30, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "High-end product engineering, advanced algorithmic design and modern cloud native systems.",
        "departments": "CSE, IT, AI&DS",
        "work_mode": "Hybrid (Bangalore)",
    },
    {
        "company_name": "Microsoft Corporation",
        "website": "https://www.microsoft.com",
        "industry": "Product & Software Technology",
        "contact_name": "Pooja Sharma",
        "contact_email": "university-india@microsoft.com",
        "recruiter_status": RecruiterStatus.HOT,
        "title": "Software Development Engineer (SDE-1)",
        "location": "Hyderabad",
        "package_lpa": "18.0 LPA",
        "eligibility": "B.E / B.Tech (CSE, IT, ECE) - Min 8.0 CGPA",
        "drive_date": datetime(2026, 11, 1, 10, 0, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Developing features for Microsoft Azure, Office 365, and AI platform integrations.",
        "departments": "CSE, IT, ECE",
        "work_mode": "Hybrid (Hyderabad)",
    },
    {
        "company_name": "Cognizant Technology Solutions",
        "website": "https://www.cognizant.com",
        "industry": "IT & Digital Operations",
        "contact_name": "Venkatesh S",
        "contact_email": "genc.campus@cognizant.com",
        "recruiter_status": RecruiterStatus.DRIVE_COMPLETED,
        "title": "GenC Next Associate",
        "location": "Coimbatore",
        "package_lpa": "6.8 LPA",
        "eligibility": "B.E / B.Tech - Min 6.5 CGPA",
        "drive_date": datetime(2026, 8, 20, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.CLOSED,
        "description": "Full stack web & mobile application development, QA automation, and database systems.",
        "departments": "CSE, IT, ECE, MECH",
        "work_mode": "On-site (Coimbatore)",
    },
    {
        "company_name": "Accenture Solutions",
        "website": "https://www.accenture.com",
        "industry": "Professional Services & Technology",
        "contact_name": "Ananya Roy",
        "contact_email": "campus.india@accenture.com",
        "recruiter_status": RecruiterStatus.HOT,
        "title": "Associate Software Engineer",
        "location": "Bangalore",
        "package_lpa": "8.0 LPA",
        "eligibility": "B.E / B.Tech (All Branches) - Min 6.5 CGPA",
        "drive_date": datetime(2026, 9, 28, 9, 30, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Application modernizations, cloud migrations, and microservices for global enterprise clients.",
        "departments": "All Branches",
        "work_mode": "Hybrid (Bangalore)",
    },
    {
        "company_name": "Qualcomm India",
        "website": "https://www.qualcomm.com",
        "industry": "Semiconductors & Telecommunications",
        "contact_name": "Deepak Verma",
        "contact_email": "india.recruiting@qualcomm.com",
        "recruiter_status": RecruiterStatus.WARM,
        "title": "Embedded Software Engineer",
        "location": "Chennai",
        "package_lpa": "13.0 LPA",
        "eligibility": "B.E / B.Tech (ECE, EEE, CSE) - Min 7.5 CGPA",
        "drive_date": datetime(2026, 10, 25, 10, 0, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Firmware development, 5G baseband processing, RTOS, C/C++, and hardware drivers.",
        "departments": "ECE, EEE, CSE",
        "work_mode": "On-site (Chennai)",
    },
    {
        "company_name": "Wipro Technologies",
        "website": "https://www.wipro.com",
        "industry": "Information Technology",
        "contact_name": "Girish M",
        "contact_email": "turbo.campus@wipro.com",
        "recruiter_status": RecruiterStatus.COLD,
        "title": "Project Engineer (Turbo)",
        "location": "Hyderabad",
        "package_lpa": "6.5 LPA",
        "eligibility": "B.E / B.Tech (All Streams) - Min 6.0 CGPA",
        "drive_date": datetime(2026, 10, 20, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.DRAFT,
        "description": "Backend API development, Python, Node.js, and CI/CD pipelines.",
        "departments": "CSE, IT, ECE",
        "work_mode": "Hybrid (Hyderabad)",
    },
    {
        "company_name": "IBM India",
        "website": "https://www.ibm.com",
        "industry": "Cloud & Cognitive Computing",
        "contact_name": "Harish Shankar",
        "contact_email": "ibm.campus@in.ibm.com",
        "recruiter_status": RecruiterStatus.WARM,
        "title": "Associate Developer - AI & Cloud",
        "location": "Hyderabad",
        "package_lpa": "8.5 LPA",
        "eligibility": "B.E / B.Tech (CSE, IT, AI&DS) - Min 7.0 CGPA",
        "drive_date": datetime(2026, 10, 18, 9, 30, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "AI models, RedHat OpenShift cloud native application engineering and APIs.",
        "departments": "CSE, IT, AI&DS",
        "work_mode": "Hybrid (Hyderabad)",
    },
    {
        "company_name": "Capgemini Technology",
        "website": "https://www.capgemini.com",
        "industry": "IT Consulting & Services",
        "contact_name": "Priyanka Nair",
        "contact_email": "campus.in@capgemini.com",
        "recruiter_status": RecruiterStatus.DRIVE_COMPLETED,
        "title": "Senior Analyst",
        "location": "Bangalore",
        "package_lpa": "7.5 LPA",
        "eligibility": "B.E / B.Tech - Min 6.5 CGPA",
        "drive_date": datetime(2026, 8, 10, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.CLOSED,
        "description": "Cloud migration, microservices architecture, and modern web application development.",
        "departments": "CSE, IT, ECE",
        "work_mode": "On-site (Bangalore)",
    },
    {
        "company_name": "L&T Technology Services",
        "website": "https://www.ltts.com",
        "industry": "Engineering R&D",
        "contact_name": "Balu V",
        "contact_email": "ltts.campus@ltts.com",
        "recruiter_status": RecruiterStatus.COLD,
        "title": "Graduate Engineer Trainee",
        "location": "Chennai",
        "package_lpa": "5.5 LPA",
        "eligibility": "B.E (MECH, EEE, ECE, CIVIL) - Min 6.5 CGPA",
        "drive_date": datetime(2026, 11, 10, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.DRAFT,
        "description": "Industrial IoT, CAD/CAM automation, and embedded systems engineering.",
        "departments": "MECH, EEE, ECE, CIVIL",
        "work_mode": "On-site (Chennai)",
    },
    {
        "company_name": "Tech Mahindra",
        "website": "https://www.techmahindra.com",
        "industry": "IT & Telecom Services",
        "contact_name": "Sanjay Gupta",
        "contact_email": "earlycareers@techmahindra.com",
        "recruiter_status": RecruiterStatus.WARM,
        "title": "Software Engineer - 5G Applications",
        "location": "Pune",
        "package_lpa": "6.0 LPA",
        "eligibility": "B.E / B.Tech (All Engineering) - Min 6.0 CGPA",
        "drive_date": datetime(2026, 10, 30, 9, 30, tzinfo=timezone.utc),
        "status": DriveStatus.OPEN,
        "description": "Telecom software, 5G core network applications, and network virtualization.",
        "departments": "CSE, IT, ECE, EEE",
        "work_mode": "Hybrid (Pune)",
    },
    {
        "company_name": "HCL Technologies",
        "website": "https://www.hcltech.com",
        "industry": "IT Infrastructure & Digital",
        "contact_name": "Sneha Menon",
        "contact_email": "firstcareers@hcl.com",
        "recruiter_status": RecruiterStatus.COLD,
        "title": "Graduate Trainee - Core Tech",
        "location": "Chennai",
        "package_lpa": "5.0 LPA",
        "eligibility": "B.E / B.Tech (All Branches) - Min 6.0 CGPA",
        "drive_date": datetime(2026, 11, 15, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.DRAFT,
        "description": "Network engineering, cloud infrastructure support, and enterprise software engineering.",
        "departments": "All Branches",
        "work_mode": "On-site (Chennai)",
    },
    {
        "company_name": "Hexaware Technologies",
        "website": "https://www.hexaware.com",
        "industry": "IT & Automation",
        "contact_name": "Divya Krishnan",
        "contact_email": "campus@hexaware.com",
        "recruiter_status": RecruiterStatus.DRIVE_COMPLETED,
        "title": "Premier Graduate Engineer Trainee",
        "location": "Chennai",
        "package_lpa": "6.0 LPA",
        "eligibility": "B.E / B.Tech (CSE, IT, ECE) - Min 6.5 CGPA",
        "drive_date": datetime(2026, 7, 28, 9, 0, tzinfo=timezone.utc),
        "status": DriveStatus.CLOSED,
        "description": "Cloud automation, full stack web apps, and enterprise DevOps engineering.",
        "departments": "CSE, IT, ECE",
        "work_mode": "On-site (Chennai)",
    },
]

def seed_companies_and_drives():
    with SessionLocal() as db:
        admin = db.query(User).filter(User.role == Role.ADMIN).first()
        admin_id = admin.id if admin else 1

        for item in COMPANIES_AND_DRIVES:
            company = db.query(Company).filter(Company.name == item["company_name"]).first()
            if not company:
                company = Company(
                    name=item["company_name"],
                    website=item["website"],
                    industry=item["industry"],
                    contact_name=item["contact_name"],
                    contact_email=item["contact_email"],
                    recruiter_status=item["recruiter_status"],
                )
                db.add(company)
                db.flush()
                print(f"Created company: {company.name} ({company.recruiter_status.value})")
            else:
                company.website = item["website"]
                company.industry = item["industry"]
                company.contact_name = item["contact_name"]
                company.contact_email = item["contact_email"]
                company.recruiter_status = item["recruiter_status"]
                db.flush()
                print(f"Updated company: {company.name} ({company.recruiter_status.value})")

            # Check / create placement drive
            drive = db.query(PlacementDrive).filter(
                PlacementDrive.company_id == company.id,
                PlacementDrive.title == item["title"],
            ).first()

            if not drive:
                drive = PlacementDrive(
                    title=item["title"],
                    company_id=company.id,
                    location=item["location"],
                    package_lpa=item["package_lpa"],
                    eligibility=item["eligibility"],
                    deadline=item["drive_date"],
                    status=item["status"],
                    created_by_id=admin_id,
                    description=item["description"],
                    drive_date=item["drive_date"],
                    departments=item["departments"],
                    work_mode=item["work_mode"],
                )
                db.add(drive)
                print(f"  -> Created drive: {drive.title} ({drive.package_lpa}) in {drive.location}")
            else:
                drive.location = item["location"]
                drive.package_lpa = item["package_lpa"]
                drive.eligibility = item["eligibility"]
                drive.deadline = item["drive_date"]
                drive.status = item["status"]
                drive.description = item["description"]
                drive.drive_date = item["drive_date"]
                drive.departments = item["departments"]
                drive.work_mode = item["work_mode"]
                print(f"  -> Updated drive: {drive.title} ({drive.package_lpa}) in {drive.location}")

        db.commit()
        print("\nSuccessfully seeded 15 company drives!")

if __name__ == "__main__":
    seed_companies_and_drives()
