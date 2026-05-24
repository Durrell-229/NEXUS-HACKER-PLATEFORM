"""
NEXUS-AI Web Tools
Outils de recherche et d'analyse web pour l'IA.
Créé par Adegbola Leonard Durrell
"""

import httpx
import asyncio
import json
import logging
import re
from urllib.parse import quote_plus, urljoin

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

TIMEOUT = httpx.Timeout(15.0)


def _strip_html(html: str) -> str:
    """Remove HTML tags and collapse whitespace."""
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, "lxml")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
            tag.decompose()
        text = soup.get_text(separator="\n")
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        return "\n".join(lines[:200])  # cap at 200 lines
    except Exception:
        clean = re.sub(r"<[^>]+>", " ", html)
        return re.sub(r"\s+", " ", clean).strip()[:4000]


# ─── DuckDuckGo Search ────────────────────────────────────────────────────────

async def search_web(query: str, max_results: int = 6) -> list[dict]:
    """Search the web via DuckDuckGo and return results."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS
        results = []
        # DDGS is sync — run in thread pool
        loop = asyncio.get_event_loop()

        def _search():
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=max_results, safesearch="off"))

        raw = await loop.run_in_executor(None, _search)
        for r in raw:
            results.append({
                "title": r.get("title", ""),
                "url":   r.get("href", ""),
                "body":  r.get("body", "")[:500],
            })
        return results
    except Exception as e:
        logger.warning(f"DuckDuckGo search error: {e}")
        return [{"error": str(e)}]


# ─── Fetch & analyze any URL ─────────────────────────────────────────────────

async def fetch_url(url: str, max_chars: int = 6000) -> dict:
    """Fetch a URL and return its text content."""
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=TIMEOUT, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "")
            if "json" in ct:
                return {"url": url, "content": resp.text[:max_chars], "type": "json"}
            text = _strip_html(resp.text)
            return {"url": url, "content": text[:max_chars], "type": "html", "status": resp.status_code}
    except Exception as e:
        return {"url": url, "error": str(e)}


# ─── GitHub Search ────────────────────────────────────────────────────────────

async def search_github(query: str, search_type: str = "repositories", language: str = "") -> dict:
    """
    Search GitHub for repositories, code, or users.
    search_type: 'repositories' | 'code' | 'users' | 'issues'
    """
    params = {"q": query + (f" language:{language}" if language else ""), "per_page": 8, "sort": "stars"}
    url = f"https://api.github.com/search/{search_type}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url, params=params, headers={
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            })
            data = resp.json()
            items = data.get("items", [])[:6]
            results = []
            for item in items:
                if search_type == "repositories":
                    results.append({
                        "name":        item.get("full_name"),
                        "description": item.get("description", "")[:200],
                        "url":         item.get("html_url"),
                        "stars":       item.get("stargazers_count", 0),
                        "language":    item.get("language"),
                        "topics":      item.get("topics", []),
                    })
                elif search_type == "code":
                    results.append({
                        "name": item.get("name"),
                        "path": item.get("path"),
                        "repo": item.get("repository", {}).get("full_name"),
                        "url":  item.get("html_url"),
                    })
                else:
                    results.append(item)
            return {"total": data.get("total_count", 0), "results": results}
    except Exception as e:
        return {"error": str(e)}


# ─── Kali Linux Tools ─────────────────────────────────────────────────────────

async def search_kali_tools(tool_name: str) -> dict:
    """Get documentation/info about a Kali Linux tool from kali.org."""
    try:
        url = f"https://www.kali.org/tools/{tool_name.lower().replace(' ', '-')}/"
        result = await fetch_url(url, max_chars=3000)
        if "error" not in result:
            result["source"] = "kali.org"
        else:
            # Fallback: search
            results = await search_web(f"kali linux {tool_name} tool usage site:kali.org OR site:man.kali.org")
            result = {"source": "search", "results": results}
        return result
    except Exception as e:
        return {"error": str(e)}


# ─── ExploitDB / CVE Search ───────────────────────────────────────────────────

async def search_exploits(query: str) -> dict:
    """Search ExploitDB and CVE database for exploits."""
    results = {}
    # ExploitDB search via their search
    try:
        url = f"https://www.exploit-db.com/search?q={quote_plus(query)}&type=exploits"
        page = await fetch_url(url, max_chars=3000)
        results["exploitdb"] = page.get("content", "")[:1500]
    except Exception as e:
        results["exploitdb_error"] = str(e)

    # Also web search for CVEs
    try:
        cve_results = await search_web(f"{query} CVE exploit POC site:nvd.nist.gov OR site:exploit-db.com", max_results=4)
        results["cve_search"] = cve_results
    except Exception:
        pass

    return results


# ─── Tool definitions for function calling ───────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web using DuckDuckGo. Use this to find current information, documentation, tutorials, CVEs, writeups, tools. Always search before saying you don't know something recent.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query":       {"type": "string", "description": "Search query"},
                    "max_results": {"type": "integer", "description": "Number of results (1-10)", "default": 6},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_url",
            "description": "Fetch and read the content of any URL (web page, GitHub file, documentation, API). Use this to get detailed information from a specific page.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {"type": "string", "description": "Full URL to fetch"},
                },
                "required": ["url"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_github",
            "description": "Search GitHub for repositories, code snippets, exploits, tools. Perfect for finding PoC exploits, security tools, CTF writeups, code examples.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query":       {"type": "string", "description": "Search query"},
                    "search_type": {"type": "string", "enum": ["repositories", "code", "users"], "default": "repositories"},
                    "language":    {"type": "string", "description": "Filter by programming language (python, c, rust, go, etc.)"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_kali_tools",
            "description": "Get documentation and usage information for Kali Linux security tools (nmap, metasploit, burpsuite, sqlmap, hydra, john, hashcat, aircrack-ng, wireshark, gobuster, etc.)",
            "parameters": {
                "type": "object",
                "properties": {
                    "tool_name": {"type": "string", "description": "Name of the Kali Linux tool"},
                },
                "required": ["tool_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_exploits",
            "description": "Search ExploitDB and CVE databases for known exploits, vulnerabilities, and proof-of-concept code.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Software name, CVE ID, or vulnerability description"},
                },
                "required": ["query"],
            },
        },
    },
]

# Tool dispatcher
async def execute_tool(name: str, args: dict) -> str:
    fn_map = {
        "search_web":       search_web,
        "fetch_url":        fetch_url,
        "search_github":    search_github,
        "search_kali_tools": search_kali_tools,
        "search_exploits":  search_exploits,
    }
    fn = fn_map.get(name)
    if not fn:
        return json.dumps({"error": f"Unknown tool: {name}"})
    try:
        result = await fn(**args)
        return json.dumps(result, ensure_ascii=False, indent=2)[:8000]
    except Exception as e:
        return json.dumps({"error": str(e)})
