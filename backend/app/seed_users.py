from app.database import SessionLocal
from app.models import User, Role
from app.security import hash_password, verify_password

ACCOUNTS = [
    {
        "full_name": "sivasubramaniyam",
        "email": "sivasubramaniyam@gmail.com",
        "password": "SS@Rathinam",
        "role": Role.ADMIN,
    },
    {
        "full_name": "Jeyakkanan",
        "email": "jeyakkanan@gmail.com",
        "password": "Jk@Rathinam",
        "role": Role.MANAGER,
    },
    {
        "full_name": "Swetha",
        "email": "swetha@gmail.com",
        "password": "Swetha@Rathinam",
        "role": Role.LEAD,
    },
]

def seed_users():
    with SessionLocal() as db:
        for acc in ACCOUNTS:
            email_clean = acc["email"].strip().lower()
            user = db.query(User).filter(User.email == email_clean).first()
            if user:
                user.full_name = acc["full_name"]
                user.password_hash = hash_password(acc["password"])
                user.role = acc["role"]
                user.is_active = True
                print(f"Updated user: {email_clean} -> Role: {acc['role'].value}")
            else:
                user = User(
                    full_name=acc["full_name"],
                    email=email_clean,
                    password_hash=hash_password(acc["password"]),
                    role=acc["role"],
                    is_active=True,
                    preferences={},
                )
                db.add(user)
                print(f"Created user: {email_clean} -> Role: {acc['role'].value}")
        db.commit()

        print("\n--- VERIFICATION OF ACCOUNTS ---")
        for acc in ACCOUNTS:
            email_clean = acc["email"].strip().lower()
            u = db.query(User).filter(User.email == email_clean).first()
            is_valid = verify_password(acc["password"], u.password_hash)
            print(f"User: {u.full_name} ({u.email}) | Role: {u.role.value} | Active: {u.is_active} | Password Valid: {is_valid}")

if __name__ == "__main__":
    seed_users()
