"""
NEXUS Forge — Terminal WebSocket Consumer
Provides an interactive hacking terminal session per user.

Connection URL: ws://host/ws/forge/terminal/?token=<access_token>
"""

import json
import asyncio
import logging
import random
import string
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()

BANNER = r"""
\x1b[1;32m
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗    ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗    █████╗  ██║   ██║██████╔╝██║  ███╗█████╗
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║    ██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║    ██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝    ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
\x1b[0m
\x1b[1;36m  NEXUS Terminal v2.4.1  —  Hacking Operations Center\x1b[0m
\x1b[90m  Type \x1b[1;33mhelp\x1b[0m\x1b[90m to list available commands. Stay ethical.\x1b[0m

"""

HELP_TEXT = """\x1b[1;36m╔═══════════════════════════════════════════════════════╗
║               NEXUS TERMINAL — COMMANDS               ║
╚═══════════════════════════════════════════════════════╝\x1b[0m

\x1b[1;33m  Platform Commands\x1b[0m
  \x1b[1;32mwhoami\x1b[0m              Show your operator profile
  \x1b[1;32mstats\x1b[0m               Display your hacking statistics
  \x1b[1;32mmachines\x1b[0m            List available target machines
  \x1b[1;32mconnect\x1b[0m \x1b[90m<id>\x1b[0m         Connect to a machine (VPN required)
  \x1b[1;32msubmit\x1b[0m \x1b[90m<flag>\x1b[0m       Submit a flag

\x1b[1;33m  Recon Tools (simulated)\x1b[0m
  \x1b[1;32mnmap\x1b[0m \x1b[90m<target>\x1b[0m        Port scan simulation
  \x1b[1;32mgobuster\x1b[0m \x1b[90m<url>\x1b[0m       Directory brute-force simulation
  \x1b[1;32mwfuzz\x1b[0m \x1b[90m<url>\x1b[0m          Web fuzzer simulation

\x1b[1;33m  Utilities\x1b[0m
  \x1b[1;32mclear\x1b[0m               Clear terminal
  \x1b[1;32mhistory\x1b[0m             Show command history
  \x1b[1;32mdate\x1b[0m                Show current date/time
  \x1b[1;32mping\x1b[0m \x1b[90m<host>\x1b[0m         ICMP ping simulation
  \x1b[1;32mecho\x1b[0m \x1b[90m<text>\x1b[0m         Print text
  \x1b[1;32mexit\x1b[0m                Close terminal session
"""

MACHINES = [
    {"id": 1,  "name": "LunaSec",    "ip": "10.10.11.201", "os": "Linux",   "diff": "EASY",   "pts": 20,  "status": "active",  "release": "2026-04-01"},
    {"id": 2,  "name": "DarkForest", "ip": "10.10.11.187", "os": "Linux",   "diff": "MEDIUM", "pts": 30,  "status": "active",  "release": "2026-03-15"},
    {"id": 3,  "name": "Phantom",    "ip": "10.10.11.212", "os": "Windows", "diff": "HARD",   "pts": 40,  "status": "active",  "release": "2026-05-01"},
    {"id": 4,  "name": "NullByte",   "ip": "10.10.11.099", "os": "Linux",   "diff": "INSANE", "pts": 50,  "status": "retired", "release": "2025-11-20"},
    {"id": 5,  "name": "StackSmash", "ip": "10.10.11.143", "os": "Linux",   "diff": "MEDIUM", "pts": 30,  "status": "active",  "release": "2026-02-28"},
]

DIFF_COLORS = {
    "EASY":   "\x1b[1;32m",
    "MEDIUM": "\x1b[1;33m",
    "HARD":   "\x1b[1;31m",
    "INSANE": "\x1b[1;35m",
}

OS_ICONS = {"Linux": "🐧", "Windows": "🪟"}


def random_mac():
    return ":".join([f"{random.randint(0, 255):02x}" for _ in range(6)])


def random_hex(length=8):
    return "".join(random.choices(string.hexdigits[:16], k=length))


class TerminalConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            self.user = await self._authenticate_from_query()
            if not self.user:
                await self.close(code=4001)
                return

        self.history = []
        self.connected_machine = None
        await self.accept()
        await self._send_raw(BANNER)
        await self._send_raw(
            f"\x1b[90mWelcome back, \x1b[1;32m{self.user.username}\x1b[0m"
            f"\x1b[90m. Session started at "
            f"{datetime.now().strftime('%H:%M:%S UTC')}\x1b[0m\r\n\r\n"
        )
        await self._prompt()
        logger.info(f"Terminal connect: {self.user.username}")

    async def disconnect(self, close_code):
        logger.info(f"Terminal disconnect: {getattr(self, 'user', '?')} code={close_code}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get("type") == "input":
            cmd = data.get("data", "").strip()
            if cmd:
                self.history.append(cmd)
            await self._handle_command(cmd)

    # ─── Command Router ───────────────────────────────────────────────────────

    async def _handle_command(self, cmd: str):
        if not cmd:
            await self._prompt()
            return

        parts = cmd.split()
        verb = parts[0].lower()
        args = parts[1:]

        await self._send_raw(f"\r\n")

        handlers = {
            "help":     self._cmd_help,
            "whoami":   self._cmd_whoami,
            "stats":    self._cmd_stats,
            "machines": self._cmd_machines,
            "connect":  self._cmd_connect,
            "nmap":     self._cmd_nmap,
            "gobuster": self._cmd_gobuster,
            "wfuzz":    self._cmd_wfuzz,
            "ping":     self._cmd_ping,
            "submit":   self._cmd_submit,
            "echo":     self._cmd_echo,
            "date":     self._cmd_date,
            "history":  self._cmd_history,
            "clear":    self._cmd_clear,
            "exit":     self._cmd_exit,
            "ls":       self._cmd_machines,
            "ai":       self._cmd_ai,
            "ask":      self._cmd_ai,
            "nexus":    self._cmd_ai,
        }

        handler = handlers.get(verb)
        if handler:
            await handler(args)
        else:
            await self._send_raw(
                f"\x1b[1;31m  bash: {verb}: command not found\x1b[0m\r\n"
                f"\x1b[90m  Hint: type \x1b[33mhelp\x1b[0m\x1b[90m for available commands\x1b[0m\r\n"
            )

        await self._send_raw("\r\n")
        await self._prompt()

    # ─── Commands ─────────────────────────────────────────────────────────────

    async def _cmd_help(self, args):
        await self._send_raw(HELP_TEXT)

    async def _cmd_whoami(self, args):
        user = await self._get_user_data()
        rank_color = "\x1b[1;36m"
        await self._send_raw(
            f"\x1b[1;32m  ┌─────────────────────────────────────┐\x1b[0m\r\n"
            f"\x1b[1;32m  │       OPERATOR PROFILE              │\x1b[0m\r\n"
            f"\x1b[1;32m  └─────────────────────────────────────┘\x1b[0m\r\n"
            f"  \x1b[90mUsername :\x1b[0m \x1b[1;32m{user['username']}\x1b[0m\r\n"
            f"  \x1b[90mEmail    :\x1b[0m \x1b[37m{user['email']}\x1b[0m\r\n"
            f"  \x1b[90mRank     :\x1b[0m {rank_color}{user['rank']}\x1b[0m\r\n"
            f"  \x1b[90mLevel    :\x1b[0m \x1b[1;33m{user['level']}\x1b[0m\r\n"
            f"  \x1b[90mXP       :\x1b[0m \x1b[1;33m{user['xp_points']:,}\x1b[0m pts\r\n"
            f"  \x1b[90mVerified :\x1b[0m {'✓' if user['is_verified'] else '✗'}\r\n"
        )

    async def _cmd_stats(self, args):
        stats = await self._get_stats()
        await self._send_raw(
            f"\x1b[1;36m  ┌─────────────────────────────────────┐\x1b[0m\r\n"
            f"\x1b[1;36m  │       HACKING STATISTICS            │\x1b[0m\r\n"
            f"\x1b[1;36m  └─────────────────────────────────────┘\x1b[0m\r\n"
            f"  \x1b[90mChallenges Solved :\x1b[0m \x1b[1;32m{stats.get('challenges_solved', 0)}\x1b[0m\r\n"
            f"  \x1b[90mCTF Wins          :\x1b[0m \x1b[1;33m{stats.get('ctf_wins', 0)}\x1b[0m\r\n"
            f"  \x1b[90mCode Battles Won  :\x1b[0m \x1b[1;35m{stats.get('code_battles_won', 0)}\x1b[0m\r\n"
            f"  \x1b[90mTotal Submissions :\x1b[0m \x1b[37m{stats.get('total_submissions', 0)}\x1b[0m\r\n"
            f"  \x1b[90mArticles Written  :\x1b[0m \x1b[37m{stats.get('articles_written', 0)}\x1b[0m\r\n"
        )

    async def _cmd_machines(self, args):
        header = (
            f"  \x1b[1;36m{'ID':<4} {'NAME':<12} {'IP':<16} {'OS':<8} "
            f"{'DIFF':<8} {'PTS':<5} STATUS\x1b[0m\r\n"
            f"  \x1b[90m{'─'*62}\x1b[0m\r\n"
        )
        await self._send_raw(f"\x1b[1;32m  ACTIVE MACHINES ({len(MACHINES)} total)\x1b[0m\r\n\r\n")
        await self._send_raw(header)
        for m in MACHINES:
            dc = DIFF_COLORS.get(m["diff"], "\x1b[37m")
            status_color = "\x1b[1;32m" if m["status"] == "active" else "\x1b[90m"
            icon = OS_ICONS.get(m["os"], "")
            await self._send_raw(
                f"  \x1b[90m{m['id']:<4}\x1b[0m "
                f"\x1b[1;37m{m['name']:<12}\x1b[0m "
                f"\x1b[33m{m['ip']:<16}\x1b[0m "
                f"{icon} \x1b[90m{m['os']:<6}\x1b[0m "
                f"{dc}{m['diff']:<8}\x1b[0m "
                f"\x1b[36m{m['pts']:<5}\x1b[0m "
                f"{status_color}{m['status']}\x1b[0m\r\n"
            )
        await self._send_raw(
            f"\r\n  \x1b[90mUse \x1b[33mconnect <id>\x1b[0m\x1b[90m to start a session.\x1b[0m\r\n"
        )

    async def _cmd_connect(self, args):
        if not args:
            await self._send_raw("  \x1b[1;31mUsage: connect <machine_id>\x1b[0m\r\n")
            return

        machine_id = args[0]
        machine = next((m for m in MACHINES if str(m["id"]) == machine_id), None)
        if not machine:
            await self._send_raw(f"  \x1b[1;31mMachine '{machine_id}' not found. Use 'machines' to list.\x1b[0m\r\n")
            return

        await self._send_raw(f"\x1b[90m  Initiating VPN tunnel to {machine['ip']}...\x1b[0m\r\n")
        await asyncio.sleep(0.3)
        await self._send_raw(f"\x1b[90m  Authenticating... \x1b[1;32m[OK]\x1b[0m\r\n")
        await asyncio.sleep(0.2)
        await self._send_raw(f"\x1b[90m  Establishing encrypted channel... \x1b[1;32m[OK]\x1b[0m\r\n")
        await asyncio.sleep(0.2)
        await self._send_raw(f"\x1b[90m  Routing traffic... \x1b[1;32m[OK]\x1b[0m\r\n")
        await asyncio.sleep(0.2)
        self.connected_machine = machine
        await self._send_raw(
            f"\r\n\x1b[1;32m  ✓ Connected to \x1b[1;37m{machine['name']}\x1b[0m"
            f"\x1b[1;32m ({machine['ip']})\x1b[0m\r\n"
            f"  \x1b[90mPrompt updated. Use 'nmap {machine['ip']}' to begin recon.\x1b[0m\r\n"
        )

    async def _cmd_nmap(self, args):
        target = args[0] if args else (self.connected_machine["ip"] if self.connected_machine else "10.10.10.1")
        flags = " ".join(args[1:]) if len(args) > 1 else "-sV -sC"

        await self._send_raw(
            f"\x1b[1;32m  Starting Nmap 7.94 ( https://nmap.org )\x1b[0m\r\n"
            f"  \x1b[90mNmap scan report for {target}\x1b[0m\r\n"
            f"  \x1b[90mHost is up (0.0{random.randint(20,80)}s latency).\x1b[0m\r\n\r\n"
        )
        await asyncio.sleep(0.4)

        ports = [
            (22,  "tcp", "open", "ssh",   "OpenSSH 8.9p1 Ubuntu 3ubuntu0.6"),
            (80,  "tcp", "open", "http",  "Apache httpd 2.4.52"),
            (443, "tcp", "open", "https", "Apache httpd 2.4.52 (TLS 1.3)"),
        ]
        if random.random() > 0.4:
            ports.append((8080, "tcp", "open", "http-proxy", "nginx 1.18.0"))
        if random.random() > 0.6:
            ports.append((3306, "tcp", "filtered", "mysql", ""))

        await self._send_raw(
            f"  \x1b[1;36m{'PORT':<10} {'STATE':<10} {'SERVICE':<14} VERSION\x1b[0m\r\n"
            f"  \x1b[90m{'─'*52}\x1b[0m\r\n"
        )
        for port, proto, state, svc, ver in ports:
            sc = "\x1b[1;32m" if state == "open" else "\x1b[1;31m" if state == "filtered" else "\x1b[90m"
            await self._send_raw(
                f"  \x1b[33m{port}/{proto:<7}\x1b[0m "
                f"{sc}{state:<10}\x1b[0m "
                f"\x1b[37m{svc:<14}\x1b[0m "
                f"\x1b[90m{ver}\x1b[0m\r\n"
            )
            await asyncio.sleep(0.05)

        await self._send_raw(
            f"\r\n  \x1b[90mNmap done: 1 IP address (1 host up) scanned in "
            f"{random.uniform(8, 25):.2f} seconds\x1b[0m\r\n"
        )

    async def _cmd_gobuster(self, args):
        url = args[0] if args else (f"http://{self.connected_machine['ip']}" if self.connected_machine else "http://10.10.10.1")
        await self._send_raw(
            f"\x1b[1;33m  Gobuster v3.6  —  Directory/File Brute-force\x1b[0m\r\n"
            f"  \x1b[90mTarget: {url}\x1b[0m\r\n"
            f"  \x1b[90mWordlist: /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt\x1b[0m\r\n"
            f"  \x1b[90mThreads: 50\x1b[0m\r\n\r\n"
        )
        paths = [
            ("/admin",        200, "234"),
            ("/login",        200, "1892"),
            ("/api",          200, "421"),
            ("/uploads",      403, "280"),
            ("/backup",       301, "0"),
            ("/.git",         403, "280"),
            ("/config",       403, "280"),
            ("/api/v1",       200, "180"),
        ]
        for path, code, size in paths:
            cc = "\x1b[1;32m" if code == 200 else "\x1b[1;33m" if code in (301, 302) else "\x1b[1;31m"
            await self._send_raw(
                f"  {cc}{path:<20}\x1b[0m "
                f"(Status: \x1b[36m{code}\x1b[0m) "
                f"[\x1b[90mSize: {size}\x1b[0m]\r\n"
            )
            await asyncio.sleep(0.08)
        await self._send_raw(f"\r\n  \x1b[90mFinished. {len(paths)} results found.\x1b[0m\r\n")

    async def _cmd_wfuzz(self, args):
        url = args[0] if args else "http://target/FUZZ"
        params = [
            ("admin",    200, 1892), ("login",   200, 934), ("api",     200, 421),
            ("shell",    403, 0),    ("upload",  302, 0),   ("passwd",  403, 0),
            ("id",       200, 224),  ("config",  403, 0),
        ]
        await self._send_raw(
            f"\x1b[1;35m  WFuzz 3.1.0  —  The Web Fuzzer\x1b[0m\r\n"
            f"  \x1b[90mTarget: {url}\x1b[0m\r\n\r\n"
            f"  \x1b[1;36m{'ID':<6} {'Response':<12} {'Lines':<8} {'Word':<8} PAYLOAD\x1b[0m\r\n"
            f"  \x1b[90m{'─'*44}\x1b[0m\r\n"
        )
        for i, (payload, code, chars) in enumerate(params, 1):
            cc = "\x1b[1;32m" if code == 200 else "\x1b[1;33m" if code in (301, 302) else "\x1b[90m"
            await self._send_raw(
                f"  \x1b[90m{i:05d}\x1b[0m  "
                f"{cc}C={code:<10}\x1b[0m "
                f"\x1b[90mL={random.randint(1,80):<6}\x1b[0m "
                f"\x1b[90mW={chars:<6}\x1b[0m "
                f"\x1b[1;37m\"{payload}\"\x1b[0m\r\n"
            )
            await asyncio.sleep(0.06)

    async def _cmd_ping(self, args):
        host = args[0] if args else "8.8.8.8"
        await self._send_raw(f"  \x1b[90mPING {host}: 56 bytes of data\x1b[0m\r\n")
        for i in range(1, 5):
            ms = round(random.uniform(12, 80), 3)
            await self._send_raw(
                f"  \x1b[37m64 bytes from {host}: icmp_seq={i} ttl=64 time={ms} ms\x1b[0m\r\n"
            )
            await asyncio.sleep(0.2)
        avg = round(random.uniform(20, 60), 3)
        await self._send_raw(f"\r\n  \x1b[90m4 packets transmitted, 4 received, 0% packet loss\x1b[0m\r\n")
        await self._send_raw(f"  \x1b[90mrtt min/avg/max = 12.0/{avg}/80.0 ms\x1b[0m\r\n")

    async def _cmd_submit(self, args):
        if not args:
            await self._send_raw("  \x1b[1;31mUsage: submit <flag>\x1b[0m\r\n  \x1b[90mExample: submit HTB{s0m3_fl4g_h3r3}\x1b[0m\r\n")
            return
        flag = args[0]
        if flag.startswith("HTB{") or flag.startswith("NEXUS{"):
            await self._send_raw(
                f"\x1b[1;32m  ✓ FLAG ACCEPTED!\x1b[0m\r\n"
                f"  \x1b[90mFlag: \x1b[1;33m{flag}\x1b[0m\r\n"
                f"  \x1b[1;32m+{random.choice([20, 30, 40, 50])} pts awarded!\x1b[0m\r\n"
            )
        else:
            await self._send_raw(f"  \x1b[1;31m✗ Invalid flag format. Expected HTB{{...}} or NEXUS{{...}}\x1b[0m\r\n")

    async def _cmd_echo(self, args):
        await self._send_raw(f"  {' '.join(args)}\r\n")

    async def _cmd_date(self, args):
        now = datetime.utcnow()
        await self._send_raw(f"  \x1b[37m{now.strftime('%a %b %d %H:%M:%S UTC %Y')}\x1b[0m\r\n")

    async def _cmd_history(self, args):
        if not self.history:
            await self._send_raw("  \x1b[90m(no history)\x1b[0m\r\n")
            return
        for i, cmd in enumerate(self.history[-20:], 1):
            await self._send_raw(f"  \x1b[90m{i:3}  \x1b[0m{cmd}\r\n")

    async def _cmd_clear(self, args):
        await self._send_raw("\x1b[2J\x1b[H")

    async def _cmd_ai(self, args):
        if not args:
            await self._send_raw(
                "  \x1b[1;35mNEXUS-AI\x1b[0m\x1b[90m — Qwen2.5-Coder-32B\x1b[0m\r\n"
                "  \x1b[90mUsage: \x1b[33mai <question>\x1b[0m\r\n"
                "  \x1b[90mEx   : \x1b[33mai how does a heap use-after-free work?\x1b[0m\r\n"
            )
            return

        question = " ".join(args)
        api_key = getattr(settings, "NIM_API_KEY", "")
        if not api_key or api_key in ("REMPLACE_PAR_TA_CLE", ""):
            await self._send_raw("\x1b[1;31m  ERROR: NIM_API_KEY not set in .env\x1b[0m\r\n")
            return

        await self._send_raw(
            f"\x1b[1;35m  ▶ NEXUS-AI\x1b[0m\x1b[90m (Qwen2.5-Coder-32B)\x1b[0m\r\n"
            f"  \x1b[90m{'─'*52}\x1b[0m\r\n"
        )

        try:
            from openai import OpenAI
            from apps.matrix.views import SYSTEM_PROMPT
            from apps.matrix.tools import TOOLS, execute_tool

            client = OpenAI(
                base_url=getattr(settings, "NIM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
                api_key=api_key,
            )
            model  = getattr(settings, "NIM_MODEL", "qwen/qwen2.5-coder-32b-instruct")
            msgs   = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": question},
            ]

            # Agentic loop with tool use
            for _round in range(4):
                resp   = client.chat.completions.create(
                    model=model, messages=msgs, tools=TOOLS,
                    tool_choice="auto", max_tokens=2048, temperature=0.6,
                )
                msg        = resp.choices[0].message
                tool_calls = msg.tool_calls or []

                if not tool_calls:
                    break  # ready to stream answer

                msgs.append(msg)
                for tc in tool_calls:
                    name  = tc.function.name
                    args  = json.loads(tc.function.arguments or "{}")
                    label = {"search_web": "🔍 Web", "fetch_url": "🌐 URL",
                             "search_github": "🐙 GitHub", "search_kali_tools": "🐉 Kali",
                             "search_exploits": "💥 ExploitDB"}.get(name, name)
                    q = args.get("query") or args.get("url") or args.get("tool_name") or ""
                    await self._send_raw(
                        f"\x1b[90m  ⟳ {label}\x1b[0m \x1b[33m{q[:60]}\x1b[0m\r\n"
                    )
                    result = await execute_tool(name, args)
                    msgs.append({"role": "tool", "tool_call_id": tc.id, "content": result})

            # Stream final answer
            final  = client.chat.completions.create(
                model=model, messages=msgs, max_tokens=2048, temperature=0.6, stream=True,
            )
            in_code  = False
            line_buf = ""

            for chunk in final:
                delta = chunk.choices[0].delta
                if not delta.content:
                    continue
                for ch in delta.content:
                    line_buf += ch
                    if ch == "\n":
                        stripped = line_buf.rstrip("\n")
                        if stripped.startswith("```"):
                            in_code = not in_code
                            color   = "\x1b[90m" if in_code else "\x1b[0m"
                            await self._send_raw(f"  {color}{stripped}\x1b[0m\r\n")
                        elif in_code:
                            await self._send_raw(f"  \x1b[1;32m{stripped}\x1b[0m\r\n")
                        elif stripped.startswith("#"):
                            await self._send_raw(f"  \x1b[1;36m{stripped}\x1b[0m\r\n")
                        elif stripped.startswith(("- ", "* ")):
                            await self._send_raw(f"  \x1b[90m▸\x1b[0m \x1b[37m{stripped[2:]}\x1b[0m\r\n")
                        else:
                            await self._send_raw(f"  \x1b[37m{stripped}\x1b[0m\r\n")
                        line_buf = ""

            if line_buf.strip():
                await self._send_raw(f"  \x1b[37m{line_buf.rstrip()}\x1b[0m\r\n")

            await self._send_raw(f"  \x1b[90m{'─'*52}\x1b[0m\r\n")

        except Exception as e:
            await self._send_raw(f"\x1b[1;31m  AI Error: {e}\x1b[0m\r\n")

    async def _cmd_exit(self, args):
        await self._send_raw("\x1b[90m  Closing terminal session... Goodbye.\x1b[0m\r\n")
        await self.close()

    # ─── Helpers ──────────────────────────────────────────────────────────────

    async def _prompt(self):
        if self.connected_machine:
            m = self.connected_machine
            prompt = (
                f"\x1b[1;32mroot@{m['name'].lower()}\x1b[0m"
                f"\x1b[90m:\x1b[0m"
                f"\x1b[1;34m~\x1b[0m"
                f"\x1b[90m# \x1b[0m"
            )
        else:
            prompt = (
                f"\x1b[1;36m{getattr(self.user, 'username', 'operator')}"
                f"@nexus\x1b[0m\x1b[90m:\x1b[0m\x1b[1;34m~\x1b[0m\x1b[90m$ \x1b[0m"
            )
        await self._send_raw(prompt)

    async def _send_raw(self, text: str):
        await self.send(text_data=json.dumps({"type": "output", "data": text}))

    @database_sync_to_async
    def _authenticate_from_query(self):
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        qs = self.scope.get("query_string", b"").decode()
        params = dict(p.split("=") for p in qs.split("&") if "=" in p)
        token_str = params.get("token")
        if not token_str:
            return None
        try:
            token = AccessToken(token_str)
            return User.objects.get(id=token["user_id"], is_active=True)
        except (InvalidToken, TokenError, User.DoesNotExist, KeyError):
            return None

    @database_sync_to_async
    def _get_user_data(self):
        u = self.user
        return {
            "username": u.username,
            "email": u.email,
            "rank": u.rank,
            "level": u.level,
            "xp_points": u.xp_points,
            "is_verified": u.is_verified,
        }

    @database_sync_to_async
    def _get_stats(self):
        from .models import CodeSnippet
        try:
            s = self.user.stats
            return {
                "challenges_solved": s.challenges_solved,
                "ctf_wins": s.ctf_wins,
                "code_battles_won": s.code_battles_won,
                "total_submissions": s.total_submissions,
                "articles_written": s.articles_written,
            }
        except Exception:
            return {}
