// ============================================================
// LORE — ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import './App.css'

// ---------- SUPABASE ----------
import { createClient } from '@supabase/supabase-js'

// ВРЕМЕННО - вручную вставляем новые ключи
const supabaseUrl = 'https://dbpvdcxajiaijtsgfivb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicHZkY3hhamlhaWp0c2dmaXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTczODEsImV4cCI6MjA5OTI3MzM4MX0.m83gkr59oshHKBRQPLg2uacSPhZviQWEiuVksON-9Jg'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---------- КОНСТАНТЫ ----------
const DEFAULT_TRAITS = [
  { name: "Уютность", emoji: "☕" },
  { name: "Хаос", emoji: "🔥" },
  { name: "Интеллект", emoji: "🧠" },
  { name: "Чувство юмора", emoji: "😂" },
  { name: "Заботливость", emoji: "💌" },
]

const RARITIES = ["Common", "Rare", "Epic", "Legendary"]
const RARITY_COLORS = {
  Common: "#95a5a6",
  Rare: "#3498db",
  Epic: "#9b59b6",
  Legendary: "#ffd700",
}

const TABS = [
  { key: "lore", label: "Лор", icon: "📖" },
  { key: "quotes", label: "Цитаты", icon: "💬" },
  { key: "gifts", label: "Подарки", icon: "🎁" },
  { key: "traits", label: "Статы", icon: "🎚️" },
  { key: "eggs", label: "Пасхалки", icon: "🧩" },
  { key: "intro", label: "Intro", icon: "🎬" },
]

function cx(...arr) { return arr.filter(Boolean).join(" ") }

function Spinner() {
  return <div className="spinner">⏳</div>
}

// ---------- RARITY BADGE ----------
function RarityBadge({ rarity }) {
  const color = RARITY_COLORS[rarity] || RARITY_COLORS.Common
  return (
    <span className="rarity-badge" style={{ color, borderColor: color + '55' }}>
      {rarity}
    </span>
  )
}

// ---------- AUTH SCREEN ----------
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    if (!username.trim() || !password) {
      setError("Заполни логин и пароль")
      return
    }
    setLoading(true)
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: `${username.trim().toLowerCase()}@lore.local`,
          password,
        })
        if (error) throw error
        
        if (data.user) {
          try {
            await supabase
              .from('profiles')
              .insert({ id: data.user.id, username: username.trim() })
          } catch (profileErr) {
            console.warn('Profile insert warning:', profileErr)
          }
        }
        
        onAuthed(data.user)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: `${username.trim().toLowerCase()}@lore.local`,
          password,
        })
        if (error) throw error
        onAuthed(data.user)
      }
    } catch (err) {
      console.error('Auth error:', err)
      let msg = err.message
      if (msg.includes("already registered")) msg = "Такой логин уже занят"
      if (msg.includes("Invalid login")) msg = "Неверный логин или пароль"
      if (msg.includes("email")) msg = "Ошибка: попробуй другой логин"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-box">
        <div className="auth-logo">
          <span>✨</span>
          <h1>LORE</h1>
        </div>
        <div className="auth-tabs">
          <button className={cx(mode === "login" && "active")} onClick={() => setMode("login")}>
            Вход
          </button>
          <button className={cx(mode === "signup" && "active")} onClick={() => setMode("signup")}>
            Регистрация
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Логин"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (минимум 6 символов)"
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading} className="btn-accent">
            {loading ? <Spinner /> : mode === "signup" ? "Создать аккаунт" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ---------- CHARACTER CARD ----------
function CharacterCard({ character, onClick }) {
  const color = RARITY_COLORS[character.rarity] || RARITY_COLORS.Common
  return (
    <div className="character-card" onClick={() => onClick(character.id)}>
      <div className="card-header">
        <div className="avatar" style={{ background: color + '22' }}>
          {character.name?.[0]?.toUpperCase() || "?"}
        </div>
        <RarityBadge rarity={character.rarity} />
      </div>
      <div className="card-body">
        <h3>{character.name}</h3>
        <p className="class-tag">{character.character_class || "Без класса"}</p>
        {character.arc && <p className="arc-text">"{character.arc}"</p>}
      </div>
    </div>
  )
}

// ---------- NEW CHARACTER MODAL ----------
function NewCharacterModal({ onClose, onCreate }) {
  const [name, setName] = useState("")
  const [characterClass, setCharacterClass] = useState("")
  const [rarity, setRarity] = useState("Common")
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    await onCreate({ name: name.trim(), character_class: characterClass.trim(), rarity })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Новый персонаж</h2>
          <button onClick={onClose}>✕</button>
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
        />
        <input
          value={characterClass}
          onChange={(e) => setCharacterClass(e.target.value)}
          placeholder="Класс персонажа"
        />
        <div className="rarity-select">
          {RARITIES.map((r) => (
            <button
              key={r}
              className={cx(rarity === r && "selected")}
              onClick={() => setRarity(r)}
            >
              {r}
            </button>
          ))}
        </div>
        <button onClick={handleCreate} disabled={saving || !name.trim()} className="btn-accent">
          {saving ? <Spinner /> : "Создать"}
        </button>
      </div>
    </div>
  )
}

// ---------- DASHBOARD ----------
function Dashboard({ session, onOpenCharacter, onLogout }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: false })
      setCharacters(data || [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [session])

  useEffect(() => { load() }, [load])

  async function handleCreate({ name, character_class, rarity }) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert({ owner_id: session.user.id, name, character_class, rarity })
        .select()
        .single()
      if (error) throw error
      
      await supabase.from('traits').insert(
        DEFAULT_TRAITS.map((t) => ({
          character_id: data.id,
          name: t.name,
          emoji: t.emoji,
          value: 50,
        }))
      )
      
      setShowNew(false)
      setCharacters(prev => [data, ...prev])
      onOpenCharacter(data.id)
    } catch (e) {
      alert("Не получилось создать персонажа: " + e.message)
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="logo">
          <span>✨</span>
          <h1>LORE</h1>
        </div>
        <div className="header-actions">
          <span className="username">@{session.user.email?.split('@')[0] || 'user'}</span>
          <button onClick={onLogout} className="logout-btn">⎋</button>
        </div>
      </div>
      <div className="dashboard-body">
        <button onClick={() => setShowNew(true)} className="new-character-btn">
          + Новый персонаж
        </button>
        {loading ? (
          <div className="loading"><Spinner /></div>
        ) : characters.length === 0 ? (
          <p className="empty-state">Пока никого нет. Добавь первого человека в свой архив.</p>
        ) : (
          <div className="characters-grid">
            {characters.map((c) => (
              <CharacterCard key={c.id} character={c} onClick={onOpenCharacter} />
            ))}
          </div>
        )}
      </div>
      {showNew && <NewCharacterModal onClose={() => setShowNew(false)} onCreate={handleCreate} />}
    </div>
  )
}

// ---------- STAT BAR ----------
function StatBar({ trait, onChange, editable }) {
  return (
    <div className="stat-bar">
      <div className="stat-label">
        <span>{trait.emoji} {trait.name}</span>
        <span>{trait.value}/100</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={trait.value}
        disabled={!editable}
        onChange={(e) => onChange(trait.id, Number(e.target.value))}
      />
    </div>
  )
}

// ---------- LORE TAB ----------
function LoreTab({ characterId }) {
  const [chapters, setChapters] = useState([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('character_id', characterId)
      .order('order_index', { ascending: true })
    setChapters(data || [])
    setLoading(false)
  }, [characterId])

  useEffect(() => { load() }, [load])

  async function addChapter() {
    if (!title.trim()) return
    const { data } = await supabase
      .from('chapters')
      .insert({
        character_id: characterId,
        title: title.trim(),
        content: content.trim(),
        order_index: chapters.length
      })
      .select()
      .single()
    setChapters(prev => [...prev, data])
    setTitle("")
    setContent("")
  }

  async function removeChapter(id) {
    await supabase.from('chapters').delete().eq('id', id)
    setChapters(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return <div className="loading"><Spinner /></div>

  return (
    <div className="tab-content">
      {chapters.map((c, i) => (
        <div key={c.id} className="chapter-item">
          <div className="chapter-header">
            <span className="chapter-number">📌 Глава {i + 1}</span>
            <button onClick={() => removeChapter(c.id)} className="delete-btn">🗑</button>
          </div>
          <h4>{c.title}</h4>
          {c.content && <p>{c.content}</p>}
        </div>
      ))}
      {chapters.length === 0 && <p className="empty-state">Глав пока нет.</p>}
      <div className="add-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название главы"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Расскажи, что произошло..."
          rows={3}
        />
        <button onClick={addChapter} disabled={!title.trim()} className="btn-secondary">
          + Добавить главу
        </button>
      </div>
    </div>
  )
}

// ---------- QUOTES TAB ----------
function QuotesTab({ characterId }) {
  const [quotes, setQuotes] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
    setQuotes(data || [])
    setLoading(false)
  }, [characterId])

  useEffect(() => { load() }, [load])

  async function addQuote() {
    if (!text.trim()) return
    const { data } = await supabase
      .from('quotes')
      .insert({ character_id: characterId, text: text.trim() })
      .select()
      .single()
    setQuotes(prev => [data, ...prev])
    setText("")
  }

  async function removeQuote(id) {
    await supabase.from('quotes').delete().eq('id', id)
    setQuotes(prev => prev.filter(q => q.id !== id))
  }

  if (loading) return <div className="loading"><Spinner /></div>

  return (
    <div className="tab-content">
      <div className="add-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='"Я не опоздала, я пришла в свою временную линию."'
          onKeyDown={(e) => e.key === "Enter" && addQuote()}
        />
        <button onClick={addQuote} className="btn-secondary">+</button>
      </div>
      {quotes.length === 0 && <p className="empty-state">Цитат пока нет.</p>}
      {quotes.map((q) => (
        <div key={q.id} className="quote-item">
          <p>"{q.text}"</p>
          <button onClick={() => removeQuote(q.id)} className="delete-btn">🗑</button>
        </div>
      ))}
    </div>
  )
}

// ---------- GIFTS TAB ----------
function GiftsTab({ characterId }) {
  const [gifts, setGifts] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('gift_memories')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false })
    setGifts(data || [])
    setLoading(false)
  }, [characterId])

  useEffect(() => { load() }, [load])

  async function addGift() {
    if (!text.trim()) return
    const { data } = await supabase
      .from('gift_memories')
      .insert({ character_id: characterId, text: text.trim() })
      .select()
      .single()
    setGifts(prev => [data, ...prev])
    setText("")
  }

  async function toggleFulfilled(g) {
    await supabase
      .from('gift_memories')
      .update({ fulfilled: !g.fulfilled })
      .eq('id', g.id)
    setGifts(prev => prev.map(x => x.id === g.id ? { ...x, fulfilled: !x.fulfilled } : x))
  }

  async function removeGift(id) {
    await supabase.from('gift_memories').delete().eq('id', id)
    setGifts(prev => prev.filter(g => g.id !== id))
  }

  if (loading) return <div className="loading"><Spinner /></div>

  return (
    <div className="tab-content">
      <div className="add-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='"Хочу попробовать хороший чай"'
          onKeyDown={(e) => e.key === "Enter" && addGift()}
        />
        <button onClick={addGift} className="btn-secondary">+</button>
      </div>
      {gifts.length === 0 && <p className="empty-state">Идей для подарков пока нет.</p>}
      {gifts.map((g) => (
        <div key={g.id} className="gift-item">
          <button 
            onClick={() => toggleFulfilled(g)} 
            className={cx("checkbox", g.fulfilled && "checked")}
          >
            {g.fulfilled && "✓"}
          </button>
          <p className={cx(g.fulfilled && "fulfilled")}>{g.text}</p>
          <button onClick={() => removeGift(g.id)} className="delete-btn">🗑</button>
        </div>
      ))}
    </div>
  )
}

// ---------- TRAITS TAB ----------
function TraitsTab({ characterId }) {
  const [traits, setTraits] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('traits')
      .select('*')
      .eq('character_id', characterId)
    setTraits(data || [])
    setLoading(false)
  }, [characterId])

  useEffect(() => { load() }, [load])

  async function commitUpdate(id, value) {
    await supabase.from('traits').update({ value }).eq('id', id)
  }

  if (loading) return <div className="loading"><Spinner /></div>

  return (
    <div className="tab-content">
      {traits.map((t) => (
        <StatBar
          key={t.id}
          trait={t}
          editable={true}
          onChange={(id, value) => {
            setTraits(prev => prev.map(x => x.id === id ? { ...x, value } : x))
            commitUpdate(id, value)
          }}
        />
      ))}
    </div>
  )
}

// ---------- EGGS TAB ----------
function EggsTab({ characterId }) {
  const [eggs, setEggs] = useState([])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('easter_eggs')
      .select('*')
      .eq('character_id', characterId)
    setEggs(data || [])
    setLoading(false)
  }, [characterId])

  useEffect(() => { load() }, [load])

  async function addEgg() {
    if (!text.trim()) return
    const { data } = await supabase
      .from('easter_eggs')
      .insert({ character_id: characterId, text: text.trim() })
      .select()
      .single()
    setEggs(prev => [...prev, data])
    setText("")
  }

  async function removeEgg(id) {
    await supabase.from('easter_eggs').delete().eq('id', id)
    setEggs(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <div className="loading"><Spinner /></div>

  return (
    <div className="tab-content">
      <div className="add-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="любит запах дождя"
          onKeyDown={(e) => e.key === "Enter" && addEgg()}
        />
        <button onClick={addEgg} className="btn-secondary">+</button>
      </div>
      {eggs.length === 0 && <p className="empty-state">Пасхалок пока нет.</p>}
      <div className="eggs-container">
        {eggs.map((e) => (
          <span key={e.id} className="egg-tag">
            🧩 {e.text}
            <button onClick={() => removeEgg(e.id)} className="delete-btn">✕</button>
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------- INTRO TAB ----------
function IntroTab({ character }) {
  const [ability, setAbility] = useState(character.intro_ability || "")
  const [weakness, setWeakness] = useState(character.intro_weakness || "")
  const [boss, setBoss] = useState(character.intro_boss || "")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await supabase
      .from('characters')
      .update({ intro_ability: ability, intro_weakness: weakness, intro_boss: boss })
      .eq('id', character.id)
    setSaving(false)
  }

  return (
    <div className="tab-content">
      <div className="intro-card">
        <p className="intro-icon">🎬</p>
        <p className="intro-label">CHARACTER INTRO</p>
        <h2>{character.name?.toUpperCase()} — Season 2026</h2>
        <div className="intro-stats">
          <p><span>Главная способность:</span> {ability || "—"}</p>
          <p><span>Слабость:</span> {weakness || "—"}</p>
          <p><span>Финальный босс:</span> {boss || "—"}</p>
        </div>
      </div>
      <div className="add-form">
        <input
          value={ability}
          onChange={(e) => setAbility(e.target.value)}
          placeholder="Главная способность"
        />
        <input
          value={weakness}
          onChange={(e) => setWeakness(e.target.value)}
          placeholder="Слабость"
        />
        <input
          value={boss}
          onChange={(e) => setBoss(e.target.value)}
          placeholder="Финальный босс"
        />
        <button onClick={save} disabled={saving} className="btn-secondary">
          {saving ? <Spinner /> : "Сохранить"}
        </button>
      </div>
    </div>
  )
}

// ---------- CHARACTER DETAIL ----------
function CharacterDetail({ characterId, onBack }) {
  const [character, setCharacter] = useState(null)
  const [tab, setTab] = useState("lore")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()
    setCharacter(data)
    setLoading(false)
  }, [characterId])

  useEffect(() => { load() }, [load])

  async function updateCharacter(fields) {
    const { data } = await supabase
      .from('characters')
      .update(fields)
      .eq('id', characterId)
      .select()
      .single()
    setCharacter(data)
  }

  if (loading || !character) return <div className="loading"><Spinner /></div>

  const color = RARITY_COLORS[character.rarity] || RARITY_COLORS.Common

  return (
    <div className="detail-screen">
      <div className="detail-header">
        <button onClick={onBack} className="back-btn">← Назад</button>
      </div>
      <div className="detail-body">
        <div className="character-profile">
          <div className="profile-avatar" style={{ background: color + '22' }}>
            {character.name?.[0]?.toUpperCase()}
          </div>
          <div className="profile-info">
            <input
              value={character.name}
              onChange={(e) => setCharacter({ ...character, name: e.target.value })}
              onBlur={(e) => updateCharacter({ name: e.target.value })}
              className="profile-name"
            />
            <input
              value={character.character_class || ""}
              onChange={(e) => setCharacter({ ...character, character_class: e.target.value })}
              onBlur={(e) => updateCharacter({ character_class: e.target.value })}
              className="profile-class"
              placeholder="Класс персонажа"
            />
          </div>
          <RarityBadge rarity={character.rarity} />
        </div>
        <textarea
          value={character.arc || ""}
          onChange={(e) => setCharacter({ ...character, arc: e.target.value })}
          onBlur={(e) => updateCharacter({ arc: e.target.value })}
          className="arc-input"
          placeholder='Арка: "Человек, который появился случайно"'
          rows={2}
        />
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={cx(tab === t.key && "active")}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {tab === "lore" && <LoreTab characterId={character.id} />}
        {tab === "quotes" && <QuotesTab characterId={character.id} />}
        {tab === "gifts" && <GiftsTab characterId={character.id} />}
        {tab === "traits" && <TraitsTab characterId={character.id} />}
        {tab === "eggs" && <EggsTab characterId={character.id} />}
        {tab === "intro" && <IntroTab character={character} />}
      </div>
    </div>
  )
}

// ---------- MAIN APP ----------
function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState("dashboard")
  const [activeCharacterId, setActiveCharacterId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setSession(null)
    setView("dashboard")
  }

  if (loading) {
    return <div className="loading-screen"><Spinner /></div>
  }

  if (!session) {
    return <AuthScreen onAuthed={(user) => setSession(user)} />
  }

  if (view === "detail" && activeCharacterId) {
    return (
      <CharacterDetail
        characterId={activeCharacterId}
        onBack={() => setView("dashboard")}
      />
    )
  }

  return (
    <Dashboard
      session={session}
      onOpenCharacter={(id) => {
        setActiveCharacterId(id)
        setView("detail")
      }}
      onLogout={handleLogout}
    />
  )
}

export default App