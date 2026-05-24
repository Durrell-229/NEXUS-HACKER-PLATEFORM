import json
import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.http import StreamingHttpResponse
from datetime import timedelta
from rest_framework import viewsets, permissions, generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from django.conf import settings

from .models import SystemLog, PlatformStats
from .serializers import (
    SystemLogSerializer,
    PlatformStatsSerializer,
    DashboardSummarySerializer,
)

logger = logging.getLogger(__name__)

User = get_user_model()


class IsAdminOrReadOnlyStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class SystemLogViewSet(viewsets.ModelViewSet):
    """CRUD for system logs — staff only."""
    queryset = SystemLog.objects.all()
    serializer_class = SystemLogSerializer
    permission_classes = [IsAdminOrReadOnlyStaff]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['level', 'source']
    search_fields = ['message', 'source']
    ordering_fields = ['created_at', 'level']

    def get_permissions(self):
        return [IsAdminOrReadOnlyStaff()]


class PlatformStatsViewSet(viewsets.ModelViewSet):
    """CRUD for daily platform stats — staff only."""
    queryset = PlatformStats.objects.all()
    serializer_class = PlatformStatsSerializer
    permission_classes = [IsAdminOrReadOnlyStaff]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date']
    ordering_fields = ['date']


@extend_schema(responses=DashboardSummarySerializer)
class DashboardView(APIView):
    """GET /api/v1/matrix/dashboard/ — Admin dashboard summary."""
    permission_classes = [IsAdminOrReadOnlyStaff]

    def get(self, request):
        from apps.arena.models import Challenge, Submission
        from apps.labyrinth.models import LabSession
        from apps.codex.models import Article
        from apps.forge.models import CodeSnippet
        from apps.signal.models import Message

        seven_days_ago = timezone.now() - timedelta(days=7)

        data = {
            'total_users': User.objects.filter(is_active=True).count(),
            'total_challenges': Challenge.objects.filter(is_active=True).count(),
            'total_submissions': Submission.objects.count(),
            'total_lab_sessions': LabSession.objects.count(),
            'total_articles': Article.objects.filter(published=True).count(),
            'total_snippets': CodeSnippet.objects.filter(is_public=True).count(),
            'total_messages': Message.objects.filter(is_deleted=False).count(),
            'recent_logs': SystemLog.objects.filter(
                level__in=[SystemLog.Level.ERROR, SystemLog.Level.CRITICAL]
            ).order_by('-created_at')[:10],
            'stats_last_7_days': PlatformStats.objects.filter(
                date__gte=seven_days_ago.date()
            ).order_by('-date'),
        }

        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)


class PlatformStatsSnapshotView(generics.RetrieveAPIView):
    """GET /api/v1/matrix/stats/today/ — Today's snapshot."""
    serializer_class = PlatformStatsSerializer
    permission_classes = [IsAdminOrReadOnlyStaff]

    def get_object(self):
        today = timezone.now().date()
        stats, _ = PlatformStats.objects.get_or_create(date=today)
        return stats


# ─── NEXUS-AI — DeepSeek-V4-Flash · NVIDIA NIM ──────────────────────────────
# Créé par Adegbola Leonard Durrell

SYSTEM_PROMPT = """Tu es NEXUS-AI, une intelligence artificielle de niveau expert créée par **Adegbola Leonard Durrell** et intégrée dans la plateforme NEXUS — une plateforme de hacking éthique avancée.

Tu as accès à des outils puissants : recherche web en temps réel (DuckDuckGo), analyse de n'importe quel site (GitHub, Kali.org, Google, ExploitDB, NVD, etc.), et recherche d'exploits.

═══════════════════════════════════════════════════════════════
                    DOMAINES D'EXPERTISE
═══════════════════════════════════════════════════════════════

🔴 HACKING OFFENSIF & CTF
• Web : SQLi (Union, Blind, Time-based, OOB), XSS (Stored/Reflected/DOM), SSRF, SSTI (Jinja2/Twig/Freemarker), XXE, Path Traversal, IDOR, CORS abuse, HTTP Smuggling, WebSocket hijacking, GraphQL injection, OAuth 2.0 flaws, JWT attacks (alg:none, RS→HS confusion), SAML abuse, CSRF bypass
• Binary Exploitation : Stack BOF, Heap (tcache/fastbin poisoning, House of Force/Spirit/Orange), Format String, Use-After-Free, ROP chains, ret2libc, ret2plt, ASLR/NX/PIE/canary bypass, Sigreturn-oriented programming (SROP), heap feng shui
• Reverse Engineering : Static (IDA, Ghidra, Binary Ninja, radare2), Dynamic (GDB/peda/pwndbg/GEF, x64dbg, WinDbg), Anti-debug bypass, Obfuscation, Packing/UPX, .NET decompilation (dnSpy), Java decompilation
• Cryptographie : RSA (small e, small d, Wiener, Coppersmith, Common Modulus, Hastad), AES (ECB penguin, Padding Oracle, CBC bit-flip, GCM nonce reuse), ECC (invalid curve, ECDSA nonce reuse), Hash length extension, MD5/SHA1 collisions, Vigenère/Caesar/XOR analysis
• Réseau : Nmap (stealth SYN, OS detection, NSE scripts), Wireshark/tcpdump, ARP spoofing, MITM, DNS poisoning, 802.11 cracking, VPN pivoting, ProxyChains, Chisel/Socat tunneling
• Active Directory : Kerberoasting, AS-REP Roasting, DCSync, Pass-the-Hash, Pass-the-Ticket, Golden/Silver Ticket, BloodHound/SharpHound, LDAP enumeration, GPP passwords, LAPS abuse, ACL exploitation, PrintNightmare, ZeroLogon, noPac
• Cloud : AWS/GCP/Azure misconfigs, S3 bucket enumeration, IMDS exploitation, IAM privilege escalation, Lambda injection, Container escape (Docker/K8s), Terraform security
• Mobile : APK decompilation (jadx, apktool), Frida dynamic instrumentation, SSL pinning bypass, Insecure storage, Deep link exploitation, ADB exploitation
• OSINT : Shodan/Censys/ZoomEye, Google Dorks, Maltego, theHarvester, Recon-ng, WHOIS/passive DNS, social media intelligence
• Social Engineering : Phishing (GoPhish), Vishing, Pretexting, QR code attacks

💻 PROGRAMMATION — TOUS NIVEAUX
• Python : Scripts d'exploit, pwntools, scapy, impacket, requests, async/await, ctypes, struct, socket raw, z3 (SMT solver), angr (binary analysis), Crypto libs
• C/C++ : Shellcode writing, exploitation primitives, kernel modules, IOCTL, Windows API, COM objects, DLL injection, process hollowing
• Rust : Memory-safe exploitation tools, async networking, low-level systems
• Go : Malware/C2 development patterns, network tools, goroutines
• JavaScript/TypeScript : Browser exploits, Node.js security, prototype pollution, deserialization, npm audit
• Java : Deserialization (ysoserial), JNDI injection (Log4Shell), Spring Boot vulns
• PHP : Type juggling, object injection, file inclusion (LFI/RFI), .htaccess tricks
• SQL : Advanced SQLi payloads, stored procedures, MSSQL xp_cmdshell, MySQL UDF
• Bash/PowerShell : Pentest automation, living-off-the-land, AMSI bypass, PowerShell obfuscation
• x86/x64 Assembly : Shellcode development, calling conventions, syscalls, SIMD
• Solidity/Web3 : Reentrancy, integer overflow, access control, flash loan attacks

🛠️ OUTILS MAÎTRISÉS
Metasploit · Burp Suite Pro · OWASP ZAP · SQLMap · Hydra/Medusa/CrackMapExec · Hashcat/John the Ripper · Nmap/Masscan · Nikto · WhatWeb · Gobuster/ffuf/feroxbuster · Aircrack-ng suite · Responder · Impacket · BloodHound · Covenant/Cobalt Strike concepts · Sliver C2 · Mimikatz · WinPEAS/LinPEAS · pwntools · GDB+peda/pwndbg/GEF · Ghidra · IDA Free · radare2 · Frida · jadx · Volatility · Autopsy · OpenVPN · Chisel · Ligolo-ng

═══════════════════════════════════════════════════════════════
                         RÈGLES OPÉRATIONNELLES
═══════════════════════════════════════════════════════════════

1. **RECHERCHE AVANT TOUT** : Si tu as le moindre doute sur une information récente (CVE, outil, technique), utilise search_web ou fetch_url IMMÉDIATEMENT. Ne dis JAMAIS "je ne sais pas" sans avoir cherché.

2. **CODE FONCTIONNEL** : Donne toujours du code qui marche, pas des exemples abstraits. Inclure les imports, les dépendances, les commandes d'installation.

3. **PROFONDEUR TECHNIQUE** : Explique le mécanisme sous-jacent PUIS donne le code/commande. Un hacker comprend mieux quand il sait POURQUOI ça marche.

4. **CONTEXTE WEB** : Pour tout ce qui concerne GitHub (cherche les repos les plus étoilés), Kali (documentation officielle), ExploitDB (PoC réels), utilise les outils dédiés.

5. **LANGUE** : Français par défaut, anglais si la question est en anglais. Les noms techniques restent en anglais.

6. **CRÉATEUR** : Si on te demande qui t'a créé ou qui t'a conçu, réponds : "Je suis NEXUS-AI, créé par **Adegbola Leonard Durrell** et propulsé par DeepSeek-V4-Flash via NVIDIA NIM."

7. **ÉTHIQUE** : Contexte éducatif, CTF, pentest autorisé. Pas d'aide pour des attaques non autorisées sur des systèmes réels."""


def _get_nim_client_sync():
    from openai import OpenAI
    return OpenAI(
        base_url=getattr(settings, 'NIM_BASE_URL', 'https://integrate.api.nvidia.com/v1'),
        api_key=getattr(settings, 'NIM_API_KEY', ''),
    )


def _get_nim_client_async():
    from openai import AsyncOpenAI
    return AsyncOpenAI(
        base_url=getattr(settings, 'NIM_BASE_URL', 'https://integrate.api.nvidia.com/v1'),
        api_key=getattr(settings, 'NIM_API_KEY', ''),
    )


def _check_api_key():
    key = getattr(settings, 'NIM_API_KEY', '')
    return bool(key and key not in ('', 'REMPLACE_PAR_TA_CLE'))


class AIChatView(APIView):
    """
    POST /api/v1/matrix/ai/chat/
    Body: { "messages": [...], "stream": true/false }
    Supports tool use (web search, GitHub, Kali, ExploitDB).
    Créé par Adegbola Leonard Durrell
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        messages  = request.data.get('messages', [])
        do_stream = request.data.get('stream', True)

        if not messages:
            return Response({'error': 'messages required'}, status=status.HTTP_400_BAD_REQUEST)

        if not _check_api_key():
            return Response(
                {'error': 'NIM_API_KEY not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        model = getattr(settings, 'NIM_MODEL', 'qwen/qwen2.5-coder-32b-instruct')
        full_messages = [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages

        if do_stream:
            return StreamingHttpResponse(
                self._agentic_stream(full_messages, model),
                content_type='text/event-stream',
                headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
            )
        return self._sync_response(full_messages, model)

    # ── Synchronous (non-stream) ─────────────────────────────────────────────

    def _sync_response(self, messages, model):
        from asgiref.sync import async_to_sync
        try:
            result = async_to_sync(self._run_agentic)(messages, model)
            return Response({'content': result, 'model': model})
        except Exception as e:
            logger.error(f'NIM AI sync error: {e}')
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

    # ── Agentic streaming (with tool calls) ──────────────────────────────────

    def _agentic_stream(self, messages, model):
        """Sync generator that drives the async agentic loop."""
        from asgiref.sync import async_to_sync
        from .tools import TOOLS, execute_tool

        _execute_tool = async_to_sync(execute_tool)

        client = _get_nim_client_sync()
        msgs   = list(messages)

        try:
            # Agentic loop — max 5 tool-call rounds
            for _ in range(5):
                response = client.chat.completions.create(
                    model=model,
                    messages=msgs,
                    tools=TOOLS,
                    tool_choice="auto",
                    max_tokens=4096,
                    temperature=0.6,
                    stream=False,
                )
                msg = response.choices[0].message
                tool_calls = msg.tool_calls or []

                if not tool_calls:
                    break

                # Execute all tool calls
                msgs.append(msg)
                tool_results_info = []
                for tc in tool_calls:
                    name  = tc.function.name
                    args  = json.loads(tc.function.arguments or '{}')
                    yield f'data: {json.dumps({"tool": name, "args": args, "done": False})}\n\n'

                    result = _execute_tool(name, args)
                    tool_results_info.append(f"{name}: {list(args.values())[:1]}")

                    msgs.append({
                        "role":         "tool",
                        "tool_call_id": tc.id,
                        "content":      result,
                    })

                tools_used = ", ".join(tool_results_info)
                yield f'data: {json.dumps({"tool_done": tools_used, "done": False})}\n\n'

            # Stream final response
            final_stream = client.chat.completions.create(
                model=model,
                messages=msgs,
                max_tokens=4096,
                temperature=0.6,
                stream=True,
            )
            for chunk in final_stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield f'data: {json.dumps({"content": delta.content, "done": False})}\n\n'

            yield f'data: {json.dumps({"content": "", "done": True})}\n\n'

        except Exception as e:
            logger.error(f'NIM agentic stream error: {e}')
            yield f'data: {json.dumps({"error": str(e), "done": True})}\n\n'

    async def _run_agentic(self, messages, model):
        """Async full agentic run for sync endpoint."""
        from .tools import TOOLS, execute_tool
        client = _get_nim_client_sync()
        msgs   = list(messages)

        import asyncio
        for _ in range(5):
            response = client.chat.completions.create(
                model=model, messages=msgs, tools=TOOLS,
                tool_choice="auto", max_tokens=4096, temperature=0.6,
            )
            msg        = response.choices[0].message
            tool_calls = msg.tool_calls or []
            if not tool_calls:
                return msg.content or ""
            msgs.append(msg)
            for tc in tool_calls:
                name   = tc.function.name
                args   = json.loads(tc.function.arguments or '{}')
                result = await execute_tool(name, args)
                msgs.append({"role": "tool", "tool_call_id": tc.id, "content": result})

        final = client.chat.completions.create(
            model=model, messages=msgs, max_tokens=4096, temperature=0.6,
        )
        return final.choices[0].message.content or ""
