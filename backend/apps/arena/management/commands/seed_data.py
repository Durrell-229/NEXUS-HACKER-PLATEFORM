from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = "Load demo data into the database"

    def handle(self, *args, **options):
        self.stdout.write("\n=== NEXUS Platform - Seed Data ===")
        users = self._create_users()
        challenges = self._create_challenges(users)
        self._create_tournaments(users, challenges)
        self._create_articles(users)
        self.stdout.write(self.style.SUCCESS("\nSeed complete."))

    def _create_users(self):
        from apps.vault.models import User, UserStats
        self.stdout.write("Creating users...")
        users_data = [
            {"username": "admin",        "email": "admin@nexus.io",      "password": "nexus2026!", "rank": "LEGEND",     "xp_points": 99999, "is_staff": True, "is_superuser": True},
            {"username": "shadow_rex",   "email": "shadow@nexus.io",     "password": "nexus2026!", "rank": "ELITE",      "xp_points": 15000},
            {"username": "nx0r",         "email": "nx0r@nexus.io",       "password": "nexus2026!", "rank": "VETERAN",    "xp_points": 8500},
            {"username": "cipher_ghost", "email": "cipher@nexus.io",     "password": "nexus2026!", "rank": "HACKER",     "xp_points": 3200},
            {"username": "byte_witch",   "email": "byte@nexus.io",       "password": "nexus2026!", "rank": "APPRENTICE", "xp_points": 750},
        ]
        created = []
        for d in users_data:
            u, new = User.objects.get_or_create(username=d["username"], defaults={
                "email": d["email"], "rank": d["rank"], "xp_points": d["xp_points"],
                "is_staff": d.get("is_staff", False), "is_superuser": d.get("is_superuser", False),
            })
            if new:
                u.set_password(d["password"])
                u.save()
                UserStats.objects.get_or_create(user=u)
                self.stdout.write(f"  Created: {u.username} [{u.rank}]")
            created.append(u)
        return created

    def _create_challenges(self, users):
        from apps.arena.models import Challenge
        self.stdout.write("Creating CTF challenges...")
        admin = users[0]
        data = [
            {"title": "SQL Injection 101",      "category": "WEB",       "difficulty": "EASY",   "points": 100,  "flag": "NEXUS{sql_injection_classic}",   "description": "Bypass a login form via SQL injection."},
            {"title": "XSS Playground",         "category": "WEB",       "difficulty": "EASY",   "points": 150,  "flag": "NEXUS{xss_stored_in_wild}",      "description": "Exploit a stored XSS vulnerability."},
            {"title": "JWT Forgery",             "category": "WEB",       "difficulty": "MEDIUM", "points": 300,  "flag": "NEXUS{jwt_alg_none_attack}",     "description": "Forge a JWT to escalate privileges."},
            {"title": "Hello Reversing",         "category": "REVERSE",   "difficulty": "EASY",   "points": 100,  "flag": "NEXUS{welcome_to_reverse}",      "description": "Your first reverse engineering challenge."},
            {"title": "Anti-Debug Nightmare",    "category": "REVERSE",   "difficulty": "HARD",   "points": 500,  "flag": "NEXUS{anti_debug_bypassed}",     "description": "Bypass anti-debug techniques in a binary."},
            {"title": "Caesar Last Secret",      "category": "CRYPTO",    "difficulty": "EASY",   "points": 75,   "flag": "NEXUS{caesar_cipher_cracked}",   "description": "Decrypt a Caesar cipher message."},
            {"title": "RSA Weak Primes",         "category": "CRYPTO",    "difficulty": "HARD",   "points": 600,  "flag": "NEXUS{rsa_weak_prime_factored}", "description": "Factor weak RSA primes to get the key."},
            {"title": "Corrupted PNG",           "category": "FORENSICS", "difficulty": "MEDIUM", "points": 250,  "flag": "NEXUS{png_header_repaired}",     "description": "Repair a corrupted PNG to reveal the flag."},
            {"title": "Digital Footprint",       "category": "FORENSICS", "difficulty": "EASY",   "points": 125,  "flag": "NEXUS{osint_is_everywhere}",     "description": "Track a user digital footprint online."},
            {"title": "Buffer Overflow Classic", "category": "PWN",       "difficulty": "MEDIUM", "points": 400,  "flag": "NEXUS{stack_smashing_detected}", "description": "Exploit a classic stack buffer overflow."},
        ]
        created = []
        for d in data:
            c, new = Challenge.objects.get_or_create(
                title=d["title"],
                defaults={**d, "author": admin, "hints": [], "files": []},
            )
            if new:
                self.stdout.write(f"  [{d['category']}] {d['title']} ({d['points']} pts)")
            created.append(c)
        return created

    def _create_tournaments(self, users, challenges):
        from apps.arena.models import Tournament, TournamentParticipant
        self.stdout.write("Creating tournaments...")
        now = timezone.now()
        data = [
            {"name": "NEXUS Qualifier 2026", "status": "UPCOMING", "start_time": now + timedelta(days=7),   "end_time": now + timedelta(days=9),    "max_participants": 100, "description": "Official NEXUS qualifier."},
            {"name": "Weekend CTF 12",        "status": "ACTIVE",   "start_time": now - timedelta(hours=5),  "end_time": now + timedelta(hours=43),  "max_participants": 50,  "description": "Bi-weekly community CTF."},
            {"name": "Inaugural NEXUS CTF",   "status": "ENDED",    "start_time": now - timedelta(days=30),  "end_time": now - timedelta(days=28),   "max_participants": 200, "description": "The first NEXUS CTF event."},
        ]
        for d in data:
            t, new = Tournament.objects.get_or_create(name=d["name"], defaults=d)
            if new:
                t.challenges.set(challenges[:5])
                for u in users[1:4]:
                    TournamentParticipant.objects.get_or_create(tournament=t, user=u)
                self.stdout.write(f"  Tournament: {d['name']} [{d['status']}]")

    def _create_articles(self, users):
        from apps.codex.models import Article, Tag
        self.stdout.write("Creating Codex articles...")
        admin = users[0]
        tag_web, _ = Tag.objects.get_or_create(slug="web-security", defaults={"name": "Web Security", "color": "#00ffcc"})
        tag_ctf, _ = Tag.objects.get_or_create(slug="ctf",          defaults={"name": "CTF",          "color": "#7b2fff"})
        tag_rev, _ = Tag.objects.get_or_create(slug="reverse",      defaults={"name": "Reverse",      "color": "#ff0080"})
        articles = [
            {"title": "Intro CTF Guide Debutants",          "slug": "intro-ctf-debutants",         "content": "Bienvenue dans le monde du CTF...",       "tags": [tag_ctf]},
            {"title": "SQL Injection Techniques Avancees",  "slug": "sql-injection-avancees",       "content": "Au-dela du basique OR 1=1...",            "tags": [tag_web]},
            {"title": "Writeup JWT Forgery",                "slug": "writeup-jwt-forgery",          "content": "Voici comment resoudre ce challenge...",  "tags": [tag_ctf, tag_web]},
            {"title": "Introduction au Reverse Engineering","slug": "intro-reverse-engineering",    "content": "Le reverse engineering consiste a...",    "tags": [tag_rev]},
        ]
        for d in articles:
            tags = d.pop("tags")
            a, new = Article.objects.get_or_create(slug=d["slug"], defaults={**d, "author": admin, "published": True})
            if new:
                a.tags.set(tags)
                self.stdout.write(f"  Article: {d['title']}")
