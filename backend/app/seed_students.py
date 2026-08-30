import random
from app.database import SessionLocal
from app.models import Student, PlacementStatus

FIRST_NAMES = [
    "Sanjay", "Rahul", "Priya", "Amit", "Sneha", "Karan", "Anjali", "Vikram", "Deepa", "Rohan",
    "Divya", "Karthik", "Preeti", "Arjun", "Shalini", "Vijay", "Aishwarya", "Manoj", "Keerthi", "Hari",
    "Gautham", "Shruti", "Varun", "Pooja", "Aditya", "Swetha", "Nikhil", "Meera", "Rajesh", "Sandhya",
    "Siddharth", "Janani", "Pranav", "Nandini", "Ashwin", "Pavithra", "Rishi", "Dhanya", "Manish", "Ganga"
]

LAST_NAMES = [
    "Kumar", "Sharma", "Rajan", "Patel", "Gupta", "Nair", "Iyer", "Joshi", "Verma", "Reddy",
    "Sen", "Prasad", "Rao", "Menon", "Singh", "Choudhury", "Bose", "Mehta", "Das", "Pillai",
    "Kalyan", "Subramanian", "Murthy", "Krishnan", "Venkatesh", "Deshmukh", "Patil", "Gowda", "Naidu", "Sastry"
]

SKILLS_POOL = [
    "Python", "FastAPI", "React", "SQL", "PostgreSQL", "Git", "Docker", "Kubernetes", "AWS", "Java",
    "Spring Boot", "C++", "HTML", "CSS", "JavaScript", "TypeScript", "Node.js", "Redis", "Linux", "TensorFlow",
    "PyTorch", "Machine Learning", "Data Structures", "Algorithms", "Jenkins", "DevOps", "Mongo DB", "REST APIs"
]

RESUME_TEMPLATES = [
    "Aspiring Software Developer with strong foundation in {skills}. Completed projects in web development and data analytics. Good problem-solving and algorithmic thinking capabilities.",
    "B.E Student with core skills in {skills}. Experienced in system design, database management, and object-oriented programming. Interested in backend roles.",
    "Enthusiastic developer proficient in {skills}. Actively built cloud-native microservices and REST APIs. Familiar with Agile methodologies and source control.",
    "Data science and analytics engineer. Strong expertise in {skills}. Skilled in statistics, model building, and data visualization. Practical experience with frameworks.",
    "Hardware and embedded systems enthusiast. Proficient in C/C++, assembly, and {skills}. Built custom IoT sensors and communication hubs."
]

def generate_random_resume(skills):
    template = random.choice(RESUME_TEMPLATES)
    skills_str = ", ".join(skills[:4])
    return template.format(skills=skills_str)

def seed_students():
    with SessionLocal() as db:
        # Check current student count
        count = db.query(Student).count()
        if count >= 100:
            print(f"Database already has {count} students. Skipping student seeding.")
            return

        print("Seeding 120 students...")
        departments = ["CSE", "IT", "ECE", "AI&DS"]
        
        students_seeded = 0
        for i in range(1, 121):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            name = f"{first} {last}"
            
            dept = random.choice(departments)
            reg_num = f"2026{dept}{i:03d}"
            
            # CGPA between 5.5 and 9.7
            cgpa = round(random.uniform(5.5, 9.7), 2)
            
            # 85% chance of 0 backlogs, 10% chance of 1, 5% chance of 2 or 3
            backlog_roll = random.random()
            if backlog_roll < 0.85:
                backlogs = 0
            elif backlog_roll < 0.95:
                backlogs = 1
            else:
                backlogs = random.choice([2, 3])
                
            # Sample 4-7 unique skills
            skills_count = random.randint(4, 7)
            skills = random.sample(SKILLS_POOL, skills_count)
            skills_str = ", ".join(skills)
            
            resume = generate_random_resume(skills)
            
            import json
            academic_info = {
                "active_backlogs": backlogs,
                "total_backlogs": backlogs,
                "graduation_year": 2026,
            }

            student = Student(
                name=name,
                registration_number=reg_num,
                email=f"{first.lower()}.{last.lower()}{i}@rathinam.in",
                phone=f"+91 9{random.randint(10000000, 99999999)}",
                department=dept,
                cgpa=str(cgpa),
                academic_details=json.dumps(academic_info),
                skills=skills_str,
                is_eligible=True,
                placement_status=PlacementStatus.SEEKING,
            )
            
            db.add(student)
            students_seeded += 1
            
        db.commit()
        print(f"Successfully seeded {students_seeded} student records!")

if __name__ == "__main__":
    seed_students()
