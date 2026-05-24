import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Heart, Bookmark, Clock, User, Tag, ArrowRight, TrendingUp } from 'lucide-react'
import GlassCard from '../components/ui/GlassCard'
import NeonButton from '../components/ui/NeonButton'
import HologramText from '../components/ui/HologramText'

const ARTICLES = [
  { slug: 'heap-tcache', title: 'Heap Exploitation Techniques: tcache poisoning & house of orange', author: 'null_ptr', readTime: '18 min', tags: ['PWN', 'HEAP', 'GLIBC'], likes: 847, bookmarks: 312, date: '2026-05-10', featured: true, summary: 'Deep dive into modern glibc heap exploitation, covering tcache poisoning, double-free vulnerabilities, and advanced house-of techniques.' },
  { slug: 'jwt-attacks', title: 'JWT Attack Vectors: alg=none, RS256→HS256 confusion, and JWK injection', author: 'cyb3r_witch', readTime: '12 min', tags: ['WEB', 'AUTH', 'JWT'], likes: 692, bookmarks: 245, date: '2026-05-08', featured: false, summary: 'Comprehensive guide to JWT vulnerabilities — from classic algorithm confusion to JWKS injection for RCE.' },
  { slug: 'afl-fuzzing', title: 'Coverage-guided Fuzzing with AFL++: from setup to crash triage', author: 'ph4ntom_r00t', readTime: '22 min', tags: ['FUZZING', 'REVERSE', 'TOOLING'], likes: 531, bookmarks: 198, date: '2026-05-05', featured: false, summary: 'Learn how to set up AFL++ for maximum coverage, write harnesses, and efficiently triage crashes.' },
  { slug: 'web3-reentrancy', title: 'Reentrancy Attacks on Ethereum: DAO hack anatomy and modern variants', author: 'x0r_master', readTime: '15 min', tags: ['WEB3', 'BLOCKCHAIN', 'SOLIDITY'], likes: 489, bookmarks: 176, date: '2026-05-02', featured: false, summary: 'Understand reentrancy attack vectors at a deep technical level and learn to find them in production contracts.' },
  { slug: 'ret2libc', title: 'ret2libc, ret2plt, and ROP Chains: building exploits for NX-protected binaries', author: 'binary_wolf', readTime: '20 min', tags: ['PWN', 'ROP', 'EXPLOITATION'], likes: 723, bookmarks: 289, date: '2026-04-28', featured: false, summary: 'Master binary exploitation bypasses: from basic ret2libc to full ROP chains defeating ASLR+NX+PIE.' },
  { slug: 'active-directory', title: 'Active Directory Attack Playbook: from initial access to Domain Admin', author: 'h4x0r_elite', readTime: '35 min', tags: ['AD', 'WINDOWS', 'PENTESTING'], likes: 1240, bookmarks: 567, date: '2026-04-20', featured: true, summary: 'Complete offensive methodology for Active Directory environments — Kerberoasting, DCSync, and lateral movement.' },
]

const tagColors = {
  PWN: '#ffa500', WEB: '#00ffcc', CRYPTO: '#7b2fff', REVERSE: '#ff0080',
  FORENSICS: '#32ff64', MISC: '#64c8ff', HEAP: '#ffa500', GLIBC: '#ffa500',
  AUTH: '#00ffcc', JWT: '#00ffcc', FUZZING: '#ff0080', TOOLING: '#64c8ff',
  WEB3: '#7b2fff', BLOCKCHAIN: '#7b2fff', SOLIDITY: '#7b2fff', ROP: '#ffa500',
  EXPLOITATION: '#ff0080', AD: '#c0c0c0', WINDOWS: '#64c8ff', PENTESTING: '#32ff64',
}

function ArticleCard({ article, index, featured = false }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -2 }}
    >
      <GlassCard
        padding="p-5"
        className="cursor-pointer h-full"
        style={featured ? { borderColor: 'rgba(0,255,204,0.25)' } : {}}
      >
        {featured && (
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp size={11} className="text-nexus-cyan" />
            <span className="text-[9px] font-mono text-nexus-cyan tracking-widest">FEATURED</span>
          </div>
        )}

        <h3 className="text-sm font-mono font-bold text-nexus-text leading-snug mb-2 hover:text-white transition-colors">
          {article.title}
        </h3>

        <p className="text-[11px] font-mono text-nexus-text-dim leading-relaxed mb-3 line-clamp-2">
          {article.summary}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                color: tagColors[tag] || '#64c8ff',
                background: `${tagColors[tag] || '#64c8ff'}15`,
                border: `1px solid ${tagColors[tag] || '#64c8ff'}30`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 text-[10px] font-mono text-nexus-text-dim">
          <span className="flex items-center gap-1"><User size={9} /> {article.author}</span>
          <span className="flex items-center gap-1"><Clock size={9} /> {article.readTime}</span>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1"><Heart size={9} /> {article.likes}</span>
            <span className="flex items-center gap-1"><Bookmark size={9} /> {article.bookmarks}</span>
          </span>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function Codex() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)

  const allTags = [...new Set(ARTICLES.flatMap((a) => a.tags))]
  const filtered = ARTICLES.filter((a) => {
    if (activeTag && !a.tags.includes(activeTag)) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={20} className="text-nexus-magenta" style={{ filter: 'drop-shadow(0 0 6px rgba(255,0,128,0.6))' }} />
          <HologramText as="h1" className="text-2xl font-display font-bold" color="magenta">CODEX</HologramText>
        </div>
        <p className="text-xs font-mono text-nexus-text-dim">Hacker knowledge base — writeups, tutorials, research</p>
      </motion.div>

      {/* Search + filters */}
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 mb-6 space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded border border-nexus-border bg-nexus-surface focus-within:border-nexus-magenta/40">
          <Search size={13} className="text-nexus-text-dim" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH ARTICLES..."
            className="flex-1 bg-transparent text-xs font-mono text-nexus-text placeholder:text-nexus-text-dim/40 outline-none caret-nexus-magenta"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className="text-[10px] font-mono px-2 py-0.5 rounded border transition-all"
            style={!activeTag
              ? { color: '#ff0080', background: 'rgba(255,0,128,0.1)', borderColor: 'rgba(255,0,128,0.3)' }
              : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }
            }
          >
            ALL
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className="text-[10px] font-mono px-2 py-0.5 rounded border transition-all"
              style={activeTag === tag
                ? { color: tagColors[tag] || '#64c8ff', background: `${tagColors[tag] || '#64c8ff'}15`, borderColor: `${tagColors[tag] || '#64c8ff'}40` }
                : { color: '#6b7a8d', background: 'transparent', borderColor: 'rgba(255,255,255,0.08)' }
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((article, i) => (
          <ArticleCard key={article.slug} article={article} index={i} featured={article.featured} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <BookOpen size={40} className="text-nexus-text-dim mx-auto mb-4 opacity-30" />
          <p className="font-mono text-nexus-text-dim text-sm">No articles match your search</p>
        </div>
      )}
    </div>
  )
}
