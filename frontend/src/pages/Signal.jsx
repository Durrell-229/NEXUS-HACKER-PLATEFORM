import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Search, Hash, Lock, Shield, Users, Zap, Circle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

// ─── AI PERSONA ENGINE ────────────────────────────────────────────────────────
const PERSONAS = {
  ph4ntom_r00t: {
    name: 'ph4ntom_r00t',
    avatar: '#7c3aed',
    rank: 'NEXUS',
    online: true,
    typing_speed: [40, 90],   // ms between chars
    think_delay:  [1800, 4200],
    style: 'elite',
    status: 'hacking > /dev/null',
    xp: 48200,
    solved: 192,
    responses: {
      greeting:   ["yo", "sup", "what's up hacker", "hey", "ayo"],
      heap:       ["tcache double-free. size must be 0x20-0x410. you know the trick?", "fastbin dup is patched on glibc 2.32+. use largebin attack", "leak libc first via unsorted bin, then tcache poison. classic", "the size check bypass — look at prev_inuse bit"],
      rop:        ["leak canary with format string first, then build rop chain", "ROPgadget --binary ./vuln | grep 'pop rdi'", "ret2libc if PIE is off. pop rdi, system, /bin/sh", "pwntools ftw. build chain with ROP class"],
      exploit:    ["check mitigations first: checksec --file=./binary", "ghidra for static, gdb-peda for dynamic. combine both", "patchelf + pwninit for libc patching, trust me", "angr for automated solving if it's not too complex"],
      web:        ["burp suite + manual testing. never trust automated scanners alone", "check JWT algo:none bypass. still works on bad implementations", "SQLi: try ' OR 1=1-- and observe behavior, then go blind", "XXE on any XML parser. check /etc/passwd"],
      flag:       ["lol no spoilers. hint: look at what you're NOT supposed to access", "check your privesc path. SUID binaries?", "you're close. think about what the service does with your input"],
      nmap:       ["nmap -sV -sC -p- --min-rate 5000 target. always full port scan", "nmap -A -T4 is fine for ctf, not irl pentesting", "check UDP too: nmap -sU --top-ports 100"],
      hello:      ["what are you working on rn?", "just solved a cool kernel pwn, feeling good lol", "been on this platform for 2 years. still learning every day", "grinding ranked today. you?"],
      fallback:   ["interesting... let me think about that", "hm. what's the exact error?", "paste the decompiled function if you can", "check the binary protections first. checksec output?", "that's a good one. try approach from a different angle", "have you tried the community channel? someone might've seen this"],
    }
  },
  cyb3r_witch: {
    name: 'cyb3r_witch',
    avatar: '#ff6b7a',
    rank: 'ELITE',
    online: true,
    typing_speed: [25, 60],
    think_delay:  [1200, 3500],
    style: 'friendly',
    status: 'CTF grind mode 🔥',
    xp: 42800,
    solved: 178,
    responses: {
      greeting:   ["heyy!!", "heyyy what's up!", "hi!!! omg you're online too", "hey hacker!!"],
      web:        ["ooh web challenges are my fav!! SSRF + IDOR combo is insane when it works", "have you tried the new XSS challenge? the CSP bypass is wild", "GraphQL introspection might be enabled if it's a newer api", "always check robots.txt and /.git/ first lol basic stuff but it works"],
      crypto:     ["rsa with small e? try cube root attack if no padding", "i love the padding oracle challs. CBC byte flipping is so satisfying", "check if n is factorable on factordb before spending hours on it lol", "DH with weak g or p value is super common in ctf crypto"],
      flag:       ["almost!! you're on the right track trust", "YESSS go for it!! let me know when u get it!!", "the flag format is NEXUS{...} don't forget lowercase usually"],
      tools:      ["cyberchef for encoding stuff, it's literally magical", "hashcat + rockyou for password cracking on ctf", "feroxbuster for directory fuzzing, way better than dirb imo"],
      hello:      ["omg hi!! i literally just solved the JWT challenge, finally!!", "hey!! been practicing web exploitation all day lol", "hiii!! you excited for the weekend ctf?? i've been preparing!!"],
      fallback:   ["ooh that's interesting!!", "wait let me try that real quick...", "hmm have you checked the documentation for that service?", "that sounds tricky but i think there's a way!! keep going!!", "maybe try a different approach? sometimes i overthink these lol", "ooh post your progress in #web channel too!!"],
    }
  },
  null_ptr: {
    name: 'null_ptr',
    avatar: '#60a5fa',
    rank: 'ELITE',
    online: false,
    typing_speed: [55, 120],
    think_delay:  [3000, 7000],
    style: 'cryptic',
    status: 'somewhere in kernel space',
    xp: 38500,
    solved: 163,
    responses: {
      greeting:   [".", "...", "acknowledged", "yes"],
      heap:       ["house of orange if you can trigger malloc error. ancient but works on old libc", "study glibc malloc source. everything is there", "ptmalloc2 internals. read the paper"],
      kernel:     ["ret2usr is dead on modern kernels. smep/smap bypass needed", "kernel rop with gadgets from /proc/kallsyms if kptr_restrict=0", "race conditions in kernel drivers. timing is everything", "use-after-free in kernel space = game over for the machine"],
      exploit:    ["ASLR means nothing if you have a leak. find the leak.", "heap spray for type confusion. precision matters", "the vulnerability is always there. find what the developer forgot"],
      hello:      ["working", "thinking", "reversing something", "null"],
      fallback:   ["read the source", "the answer is in the binary", "look at what you can't see", "debug it", "memory doesn't lie", "run ltrace. run strace. then think."],
    }
  },
  binary_wolf: {
    name: 'binary_wolf',
    avatar: '#9fef00',
    rank: 'PLATINUM',
    online: true,
    typing_speed: [35, 75],
    think_delay:  [1500, 4000],
    style: 'methodical',
    status: 'Red Team Ops | Active',
    xp: 31200,
    solved: 144,
    responses: {
      greeting:   ["hey. what's the target?", "sup. working on anything specific?", "hey. pentesting or ctf?"],
      redteam:    ["MITRE ATT&CK T1566 - phishing with weaponized doc. step 1 always", "lateral movement via pass-the-hash. net use \\\\target\\admin$ /user:domain\\admin hash:hash", "C2 setup: covenant or havoc. stay off metasploit if you want to stay stealthy", "living off the land. powershell, wmic, certutil. don't drop tools"],
      recon:      ["amass + subfinder for subdomain enum. combine both", "shodan for exposed services. ip:x.x.x.x org:'target'", "wayback machine for forgotten endpoints. always check", "linkedin for employees = targets for spear phishing"],
      privesc:    ["linpeas.sh first pass. then manual check", "sudo -l is the first thing i check every time", "SUID find: find / -perm -4000 2>/dev/null", "cron jobs with writable paths. classic windows style but works on linux too"],
      hello:      ["just finished a red team engagement. writing the report now", "hey. doing OSCP prep. you?", "been practicing AD attacks all week. kerberoasting is underrated"],
      fallback:   ["enumerate more. you never enumerate enough", "check the attack surface again. there's always something", "think like the attacker. what would YOU do?", "document everything. methodology matters", "try the path of least resistance first"],
    }
  },
  x0r_master: {
    name: 'x0r_master',
    avatar: '#fbbf24',
    rank: 'PLATINUM',
    online: true,
    typing_speed: [45, 95],
    think_delay:  [2000, 5500],
    style: 'mysterious',
    status: 'in the void',
    xp: 28900,
    solved: 131,
    responses: {
      greeting:   ["0x48 0x65 0x79", "greetings, cipher", "hello in base64: aGVsbG8=", "xor key found: 0x41"],
      crypto:     ["AES-128-CBC with IV = key? classic oracle attack", "RSA LSB oracle if server leaks parity", "Fermat's factoring if p and q are close. p-1 and q-1 smooth", "elliptic curves. learn them. they're everywhere now"],
      reverse:    ["ida pro for serious work. ghidra for ctf. both for real research", "angr symbolic execution will solve most ctf binaries automatically", "find the key schedule in AES implementation, that's always the weak point", "strings | grep -i flag never fails in easy challenges lol"],
      hello:      ["decoding something. always decoding something", "base64(hello): aGVsbG8=", "working on a custom cipher. fascinating problem space", "the key is always somewhere"],
      fallback:   ["every cipher has a weakness. find the pattern", "entropy analysis first. high entropy = encrypted, low = compressed or encoded", "the flag is just data with the right key", "xor is everywhere. check if output xored with known plaintext = key", "frequency analysis if it's classical cipher"],
    }
  },
}

const CHANNELS = {
  general: {
    id: 'general',
    name: 'general',
    type: 'channel',
    desc: 'General hacking discussion',
    active_users: ['ph4ntom_r00t', 'cyb3r_witch', 'binary_wolf', 'x0r_master'],
    messages: [
      { id: 1, from: 'system', text: 'Welcome to #general — Keep it technical', time: '00:00', system: true },
      { id: 2, from: 'cyb3r_witch', text: '🚨 CTF event starts in 2h!! prize pool 1000 NEXUS tokens', time: '10:00' },
      { id: 3, from: 'binary_wolf', text: 'been prepping all week. red team + web categories this time?', time: '10:01' },
      { id: 4, from: 'ph4ntom_r00t', text: 'heap pwn category confirmed. i checked the challenge list', time: '10:03' },
      { id: 5, from: 'x0r_master', text: 'crypto flags incoming. prepare your RSA solvers', time: '10:05' },
      { id: 6, from: 'null_ptr', text: 'kernel pwn. my territory.', time: '10:07' },
    ]
  },
  pwn: {
    id: 'pwn',
    name: 'pwn',
    type: 'channel',
    desc: 'Binary exploitation & pwn',
    active_users: ['ph4ntom_r00t', 'null_ptr'],
    messages: [
      { id: 1, from: 'system', text: 'Welcome to #pwn — Binary exploitation channel', time: '00:00', system: true },
      { id: 2, from: 'ph4ntom_r00t', text: 'heap-feng-shui challenge is brutal. 3 days on it', time: '09:30' },
      { id: 3, from: 'null_ptr', text: 'house of lore. study ptmalloc2.', time: '09:35' },
      { id: 4, from: 'ph4ntom_r00t', text: 'wait... the chunk size is 0x420?? it bypasses tcache entirely', time: '09:40' },
      { id: 5, from: 'null_ptr', text: 'correct.', time: '09:41' },
    ]
  },
  web: {
    id: 'web',
    name: 'web',
    type: 'channel',
    desc: 'Web exploitation & OWASP',
    active_users: ['cyb3r_witch', 'binary_wolf'],
    messages: [
      { id: 1, from: 'system', text: 'Welcome to #web — HTTP is a battlefield', time: '00:00', system: true },
      { id: 2, from: 'cyb3r_witch', text: 'JWT challenge hint: check the algorithm header carefully 👀', time: '11:00' },
      { id: 3, from: 'binary_wolf', text: 'alg:none bypass still works in 2026 lmao devs never learn', time: '11:02' },
      { id: 4, from: 'cyb3r_witch', text: 'SSRF + internal metadata = instant cloud pwn. love it', time: '11:05' },
    ]
  },
  crypto: {
    id: 'crypto',
    name: 'crypto',
    type: 'channel',
    desc: 'Cryptography challenges',
    active_users: ['x0r_master', 'null_ptr'],
    messages: [
      { id: 1, from: 'system', text: 'Welcome to #crypto — Mathematics is power', time: '00:00', system: true },
      { id: 2, from: 'x0r_master', text: 'small subgroup attack on DH. elegant solution, terrible for devs', time: '08:00' },
      { id: 3, from: 'null_ptr', text: 'lattice attacks on LWE. post-quantum crypto is not immune', time: '08:10' },
    ]
  },
  'red-team': {
    id: 'red-team',
    name: 'red-team',
    type: 'channel',
    desc: '🔴 Red Team Operations',
    active_users: ['binary_wolf', 'ph4ntom_r00t'],
    messages: [
      { id: 1, from: 'system', text: 'Welcome to #red-team — Offensive Security Operations', time: '00:00', system: true },
      { id: 2, from: 'binary_wolf', text: 'C2 framework comparison: Havoc > Covenant > CS for OPSEC', time: '07:00' },
      { id: 3, from: 'ph4ntom_r00t', text: 'sliver is underrated. open source and solid', time: '07:05' },
      { id: 4, from: 'binary_wolf', text: 'agreed. MITRE ATT&CK coverage is good on sliver', time: '07:07' },
    ]
  },
  'blue-team': {
    id: 'blue-team',
    name: 'blue-team',
    type: 'channel',
    desc: '🔵 Blue Team Defense',
    active_users: ['cyb3r_witch'],
    messages: [
      { id: 1, from: 'system', text: 'Welcome to #blue-team — Detection & Defense', time: '00:00', system: true },
      { id: 2, from: 'cyb3r_witch', text: 'SIEM alert tuning: 80% of SOC alerts are false positives. baseline first!!', time: '06:00' },
      { id: 3, from: 'cyb3r_witch', text: 'honeypot deployed on DMZ. caught 3 scans in 10 min lol', time: '06:15' },
    ]
  },
}

const DMS = ['ph4ntom_r00t', 'cyb3r_witch', 'null_ptr', 'binary_wolf', 'x0r_master']

// ─── AI Response Engine ─────────────────────────────────────────────────────
function getAIResponse(persona, userMessage) {
  const msg = userMessage.toLowerCase()
  const p = PERSONAS[persona]
  if (!p) return null

  const r = p.responses
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

  if (/^(hey|hi|hello|yo|sup|ayo|salut|bonjour|hola)/i.test(msg.trim())) return pick(r.greeting || r.hello || r.fallback)
  if (/heap|tcache|fastbin|chunk|malloc|free|house of/i.test(msg)) return pick(r.heap || r.exploit || r.fallback)
  if (/rop|return.oriented|gadget|ret2|buffer overflow|bof/i.test(msg)) return pick(r.rop || r.exploit || r.fallback)
  if (/exploit|pwn|binary|overflow|shellcode|payload/i.test(msg)) return pick(r.exploit || r.fallback)
  if (/web|http|sql|xss|csrf|ssrf|injection|jwt|cookie/i.test(msg)) return pick(r.web || r.fallback)
  if (/crypto|rsa|aes|cipher|hash|encrypt|decrypt|key/i.test(msg)) return pick(r.crypto || r.fallback)
  if (/flag|solve|stuck|hint|help|challenge/i.test(msg)) return pick(r.flag || r.fallback)
  if (/nmap|scan|recon|enumerate|port|service/i.test(msg)) return pick(r.nmap || r.recon || r.fallback)
  if (/reverse|re|ghidra|ida|decompil|disassembl/i.test(msg)) return pick(r.reverse || r.fallback)
  if (/red team|pentest|engagement|attack|c2|payload/i.test(msg)) return pick(r.redteam || r.exploit || r.fallback)
  if (/blue team|detect|siem|soc|alert|defense|monitor/i.test(msg)) return pick(r.blueteam || r.fallback)
  if (/privesc|privilege|sudo|suid|root/i.test(msg)) return pick(r.privesc || r.fallback)
  if (/kernel|ring0|kvm|kpti|smep|smap/i.test(msg)) return pick(r.kernel || r.fallback)
  return pick(r.fallback)
}

// ─── DM Chat with AI persona ───────────────────────────────────────────────
function DMChat({ persona, onBack }) {
  const { user } = useAuthStore()
  const p = PERSONAS[persona]
  const endRef = useRef(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [msgs, setMsgs] = useState([
    {
      id: 1,
      from: persona,
      text: p.responses.hello ? p.responses.hello[0] : p.responses.greeting[0],
      time: new Date(Date.now() - 120000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
  ])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, isTyping])

  const send = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg = {
      id: Date.now(),
      from: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
    setMsgs((prev) => [...prev, userMsg])
    const sentText = input.trim()
    setInput('')

    // AI thinking delay
    const delay = p.think_delay[0] + Math.random() * (p.think_delay[1] - p.think_delay[0])
    setTimeout(() => {
      setIsTyping(true)
      const response = getAIResponse(persona, sentText)
      // Typing duration based on message length
      const typingDur = response.length * (p.typing_speed[0] + Math.random() * p.typing_speed[1])
      setTimeout(() => {
        setIsTyping(false)
        setMsgs((prev) => [...prev, {
          id: Date.now(),
          from: persona,
          text: response,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        }])
      }, Math.min(typingDur, 3000))
    }, delay)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={onBack} className="text-htb-text-dim hover:text-htb-green transition-colors mr-1">←</button>
        <div className="relative">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black" style={{ background: p.avatar + '22', border: `1px solid ${p.avatar}44`, color: p.avatar }}>
            {p.name[0].toUpperCase()}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: p.online ? '#9fef00' : '#5a6a7e', borderColor: '#0d1117', boxShadow: p.online ? '0 0 4px #9fef00' : 'none' }} />
        </div>
        <div>
          <div className="text-sm font-mono font-bold" style={{ color: p.avatar }}>{p.name}</div>
          <div className="text-[10px] font-mono" style={{ color: p.online ? '#9fef00' : '#5a6a7e' }}>{p.online ? p.status : 'OFFLINE'}</div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono" style={{ color: '#3d4f62' }}>
          <Lock size={10} /> E2E ENCRYPTED
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ background: '#0d1117' }}>
        {msgs.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex items-end gap-2 ${msg.from === 'me' ? 'flex-row-reverse' : ''}`}
          >
            {msg.from !== 'me' && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: p.avatar + '22', color: p.avatar }}>
                {p.name[0].toUpperCase()}
              </div>
            )}
            <div className={`max-w-[72%] ${msg.from === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              {msg.from !== 'me' && (
                <span className="text-[10px] font-mono ml-1" style={{ color: p.avatar }}>{p.name}</span>
              )}
              <div
                className="px-3 py-2 rounded-lg text-xs font-mono leading-relaxed"
                style={msg.from === 'me'
                  ? { background: 'rgba(159,239,0,0.07)', border: '1px solid rgba(159,239,0,0.18)', color: '#c8d8e8' }
                  : { background: '#1a2332', border: '1px solid rgba(255,255,255,0.06)', color: '#a4b1cd' }
                }
              >
                {msg.text}
              </div>
              <span className="text-[9px] font-mono mx-1" style={{ color: '#3d4f62' }}>{msg.time}</span>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-2"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: p.avatar + '22', color: p.avatar }}>
                {p.name[0].toUpperCase()}
              </div>
              <div className="px-3 py-2 rounded-lg" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: p.avatar }}
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0" style={{ background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <form onSubmit={send} className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${p.name}...`}
              className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:opacity-30"
              style={{ color: '#a4b1cd', caretColor: '#9fef00' }}
            />
          </div>
          <button type="submit" disabled={!input.trim()} className="htb-btn px-3 py-2.5 disabled:opacity-30">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Channel Chat (with multiple AI users) ─────────────────────────────────
function ChannelChat({ channelId, onBack }) {
  const { user } = useAuthStore()
  const channel = CHANNELS[channelId]
  const endRef = useRef(null)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState(channel?.messages || [])
  const [typingUsers, setTypingUsers] = useState([])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const send = (e) => {
    e.preventDefault()
    if (!input.trim() || !channel) return
    const userMsg = {
      id: Date.now(),
      from: 'me',
      text: input.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
    setMsgs((prev) => [...prev, userMsg])
    const sentText = input.trim()
    setInput('')

    // Random responders from active users
    const responders = channel.active_users.filter(() => Math.random() > 0.4).slice(0, 2)
    responders.forEach((persona, idx) => {
      const p = PERSONAS[persona]
      if (!p) return
      const delay = 1500 + idx * 2000 + Math.random() * 3000
      setTimeout(() => {
        setTypingUsers((prev) => [...prev, persona])
        const response = getAIResponse(persona, sentText)
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== persona))
          setMsgs((prev) => [...prev, {
            id: Date.now() + idx,
            from: persona,
            text: response,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          }])
        }, response.length * 35)
      }, delay)
    })
  }

  if (!channel) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <button onClick={onBack} className="text-htb-text-dim hover:text-htb-green transition-colors mr-1">←</button>
        <Hash size={14} style={{ color: '#9fef00' }} />
        <div>
          <div className="text-sm font-mono font-bold" style={{ color: '#a4b1cd' }}>{channel.name}</div>
          <div className="text-[10px] font-mono" style={{ color: '#3d4f62' }}>{channel.desc} · {channel.active_users.length} active</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-1">
            {channel.active_users.slice(0, 4).map((u) => (
              <div key={u} className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-black" style={{ borderColor: '#0d1117', background: PERSONAS[u]?.avatar + '33', color: PERSONAS[u]?.avatar }}>
                {u[0].toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-2" style={{ background: '#0d1117' }}>
        {msgs.map((msg) => {
          if (msg.system) return (
            <div key={msg.id} className="text-center py-3">
              <span className="text-[10px] font-mono px-3 py-1 rounded-full" style={{ color: '#3d4f62', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>— {msg.text} —</span>
            </div>
          )
          const p = PERSONAS[msg.from]
          const isMe = msg.from === 'me'
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, x: isMe ? 8 : -8 }} animate={{ opacity: 1, x: 0 }} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: (p?.avatar || '#9fef00') + '22', color: p?.avatar || '#9fef00' }}>
                  {msg.from[0].toUpperCase()}
                </div>
              )}
              <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : ''}`}>
                {!isMe && <span className="text-[10px] font-mono ml-1" style={{ color: p?.avatar || '#9fef00' }}>{msg.from}</span>}
                <div className="px-3 py-2 rounded-lg text-xs font-mono leading-relaxed" style={isMe
                  ? { background: 'rgba(159,239,0,0.07)', border: '1px solid rgba(159,239,0,0.18)', color: '#c8d8e8' }
                  : { background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)', color: '#a4b1cd' }
                }>
                  {msg.text}
                </div>
                <span className="text-[9px] font-mono mx-1" style={{ color: '#3d4f62' }}>{msg.time}</span>
              </div>
            </motion.div>
          )
        })}

        <AnimatePresence>
          {typingUsers.map((u) => {
            const p = PERSONAS[u]
            return (
              <motion.div key={u} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: (p?.avatar || '#9fef00') + '22', color: p?.avatar }}>
                  {u[0].toUpperCase()}
                </div>
                <div className="px-3 py-2 rounded-lg" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map((i) => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: p?.avatar || '#9fef00' }}
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[9px] font-mono" style={{ color: '#3d4f62' }}>{u} is typing...</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="p-4 flex-shrink-0" style={{ background: '#0d1117', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <form onSubmit={send} className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.06)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message #${channel.name}...`}
              className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:opacity-30"
              style={{ color: '#a4b1cd', caretColor: '#9fef00' }}
            />
          </div>
          <button type="submit" disabled={!input.trim()} className="htb-btn px-3 py-2.5 disabled:opacity-30">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Signal Page ──────────────────────────────────────────────────────
export default function Signal() {
  const { user } = useAuthStore()
  const [view, setView] = useState({ type: null, id: null }) // { type: 'dm'|'channel', id }
  const [search, setSearch] = useState('')

  const totalUnread = 12

  const filteredPersonas = DMS.filter((p) => !search || p.toLowerCase().includes(search.toLowerCase()))
  const filteredChannels = Object.keys(CHANNELS).filter((c) => !search || c.toLowerCase().includes(search.toLowerCase()))

  if (view.type === 'dm') {
    return (
      <div className="h-[calc(100vh-60px)]">
        <DMChat persona={view.id} onBack={() => setView({ type: null, id: null })} />
      </div>
    )
  }
  if (view.type === 'channel') {
    return (
      <div className="h-[calc(100vh-60px)]">
        <ChannelChat channelId={view.id} onBack={() => setView({ type: null, id: null })} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="text-[9px] font-mono tracking-[0.4em] mb-2" style={{ color: '#3d4f62' }}>COMMUNICATIONS</div>
        <h1 className="text-2xl font-display font-black mb-1" style={{ color: '#e4e8f0' }}>SIGNAL <span style={{ color: '#9fef00' }}>·</span> E2E ENCRYPTED</h1>
        <p className="text-[11px] font-mono" style={{ color: '#3d4f62' }}>Secure messaging · Zero-knowledge protocol · {totalUnread} unread messages</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-6" style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Search size={13} style={{ color: '#3d4f62' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="flex-1 bg-transparent text-xs font-mono outline-none placeholder:opacity-30"
          style={{ color: '#a4b1cd', caretColor: '#9fef00' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Messages */}
        <div>
          <div className="text-[9px] font-mono tracking-[0.3em] mb-3 flex items-center gap-2" style={{ color: '#3d4f62' }}>
            <MessageSquare size={10} /> DIRECT MESSAGES
          </div>
          <div className="space-y-2">
            {filteredPersonas.map((personaKey) => {
              const p = PERSONAS[personaKey]
              const unread = { ph4ntom_r00t: 2, cyb3r_witch: 1, null_ptr: 0, binary_wolf: 3, x0r_master: 0 }[personaKey] || 0
              return (
                <motion.button
                  key={personaKey}
                  onClick={() => setView({ type: 'dm', id: personaKey })}
                  whileHover={{ x: 3 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                  style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm" style={{ background: p.avatar + '22', border: `1px solid ${p.avatar}33`, color: p.avatar }}>
                      {p.name[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: p.online ? '#9fef00' : '#5a6a7e', borderColor: '#1a2332', boxShadow: p.online ? '0 0 4px #9fef00' : 'none' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold truncate" style={{ color: p.avatar }}>{p.name}</div>
                    <div className="text-[10px] font-mono truncate opacity-60" style={{ color: '#5a6a7e' }}>{p.status}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono" style={{ color: '#3d4f62' }}>⚡ {p.xp.toLocaleString()} XP</span>
                      <span className="text-[9px] font-mono" style={{ color: '#3d4f62' }}>· {p.solved} solves</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: p.avatar + '15', color: p.avatar, border: `1px solid ${p.avatar}25` }}>{p.rank}</span>
                    {unread > 0 && (
                      <span className="text-[9px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#9fef00', color: '#0d1117' }}>{unread}</span>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Channels */}
        <div>
          <div className="text-[9px] font-mono tracking-[0.3em] mb-3 flex items-center gap-2" style={{ color: '#3d4f62' }}>
            <Hash size={10} /> CHANNELS
          </div>
          <div className="space-y-2">
            {filteredChannels.map((channelKey) => {
              const ch = CHANNELS[channelKey]
              const teamColor = channelKey === 'red-team' ? '#ff4757' : channelKey === 'blue-team' ? '#60a5fa' : channelKey === 'purple-team' ? '#a78bfa' : '#9fef00'
              return (
                <motion.button
                  key={channelKey}
                  onClick={() => setView({ type: 'channel', id: channelKey })}
                  whileHover={{ x: 3 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all"
                  style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: teamColor + '15', border: `1px solid ${teamColor}25` }}>
                    <Hash size={14} style={{ color: teamColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-bold" style={{ color: '#a4b1cd' }}>#{ch.name}</div>
                    <div className="text-[10px] font-mono opacity-60" style={{ color: '#5a6a7e' }}>{ch.desc}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {ch.active_users.slice(0, 3).map((u) => (
                        <span key={u} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: (PERSONAS[u]?.avatar || '#9fef00') + '15', color: PERSONAS[u]?.avatar || '#9fef00' }}>{u.split('_')[0]}</span>
                      ))}
                      {ch.active_users.length > 3 && <span className="text-[8px] font-mono" style={{ color: '#3d4f62' }}>+{ch.active_users.length - 3}</span>}
                    </div>
                  </div>
                  <Users size={12} style={{ color: '#3d4f62' }} />
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
