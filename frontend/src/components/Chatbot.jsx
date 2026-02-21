import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { notify } from '../context/NotificationContext'
import './Chatbot.css'

function formatChatText(str) {
  if (typeof str !== 'string') return str
  const parts = str.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

const apiBase = import.meta.env.VITE_API_URL || ''

const FALLBACK_MESSAGE = "I couldn't connect right now. Please try again in a moment. You can use the **Feedback** button above to send a message, or contact us: support@krishimitra.in, phone 083903 12345. Helpline: Mon–Sat, 9 AM – 6 PM."

const QUICK_REPLIES = [
  'What is Trust Score?',
  'How do I contact support?',
  'How to improve my score?',
  'Send feedback',
]

export default function Chatbot() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackType, setFeedbackType] = useState('feedback')
  const [feedbackContent, setFeedbackContent] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const imageInputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const sendMessageWithText = async (textToSend) => {
    const text = (textToSend ?? input).trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const history = messages.map((msg) => ({ role: msg.role, content: msg.content }))
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await res.json()
      const reply = res.ok
        ? (data.reply || 'No response.')
        : (data.error && typeof data.error === 'string' ? data.error : FALLBACK_MESSAGE)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: FALLBACK_MESSAGE }])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = () => sendMessageWithText(input)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    e.target.value = ''
    const displayUrl = URL.createObjectURL(file)
    setMessages((m) => [...m, { role: 'user', content: 'Analyzing this crop image…', image: displayUrl }])
    setLoading(true)
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await fetch(`${apiBase}/api/crop-analysis`, { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok && data.summary != null) {
        const text = [
          data.summary,
          data.details ? `\n\n${data.details}` : '',
          (data.recommendations?.length ? `\n\nRecommendations:\n• ${data.recommendations.join('\n• ')}` : ''),
        ].filter(Boolean).join('')
        setMessages((m) => [...m, { role: 'assistant', content: text || 'Analysis complete.' }])
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: FALLBACK_MESSAGE }])
      }
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: FALLBACK_MESSAGE }])
    } finally {
      setLoading(false)
    }
  }

  const submitFeedback = async () => {
    const content = feedbackContent.trim()
    if (!content && feedbackType !== 'rating') return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          content: content || undefined,
          rating: feedbackType === 'rating' ? feedbackRating : undefined,
          userId: user?.id || undefined,
          email: user?.email || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFeedbackSent(true)
        notify({ type: 'success', title: 'Feedback sent', message: 'Thank you! Your feedback has been submitted.' })
        setMessages((m) => [...m, { role: 'assistant', content: 'Thank you! Your feedback has been submitted.' }])
        setShowFeedbackForm(false)
        setFeedbackContent('')
        setFeedbackRating(5)
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.error || 'Failed to submit feedback.' }])
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="chatbot-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open support chat'}
      >
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <span className="chatbot-title">Krishimitra Support</span>
            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-feedback-header-btn"
                onClick={() => setShowFeedbackForm(true)}
                aria-label="Send feedback"
              >
                Feedback
              </button>
              <button type="button" className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
          </div>
          <div className="chatbot-body">
            {messages.length === 0 && !showFeedbackForm && (
              <div className="chatbot-welcome">
                <p><strong>Krishimitra Support</strong> — Ask about Trust Score, uploads, Weather Insurance, Vouchers, or contact. You can also upload a crop photo for quick analysis.</p>
                <div className="chatbot-quick-replies">
                  {QUICK_REPLIES.map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="chatbot-quick-reply"
                      onClick={() => sendMessageWithText(label)}
                      disabled={loading}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button type="button" className="chatbot-feedback-btn" onClick={() => setShowFeedbackForm(true)}>
                  Send feedback / complaint / rating
                </button>
              </div>
            )}
            <div className="chatbot-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`chatbot-msg-wrap chatbot-msg-wrap-${msg.role}`}>
                  <div className={`chatbot-msg chatbot-msg-${msg.role}`}>
                    {msg.image && <img src={msg.image} alt="Uploaded" className="chatbot-msg-img" />}
                    <span className="chatbot-msg-text">{formatChatText(msg.content)}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chatbot-msg-wrap chatbot-msg-wrap-assistant">
                  <div className="chatbot-msg chatbot-msg-assistant chatbot-typing">
                    <span className="chatbot-msg-dots">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {showFeedbackForm ? (
              <div className="chatbot-feedback-form">
                <h4>Submit feedback</h4>
                <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)}>
                  <option value="feedback">General feedback</option>
                  <option value="complaint">Complaint</option>
                  <option value="rating">Rating only</option>
                </select>
                {(feedbackType === 'feedback' || feedbackType === 'complaint') && (
                  <textarea
                    placeholder="Your message..."
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    rows={3}
                  />
                )}
                {feedbackType === 'rating' && (
                  <div className="chatbot-rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`chatbot-star ${feedbackRating >= n ? 'active' : ''}`}
                        onClick={() => setFeedbackRating(n)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}
                <div className="chatbot-feedback-actions">
                  <button type="button" onClick={() => { setShowFeedbackForm(false); setFeedbackSent(false) }}>
                    Cancel
                  </button>
                  <button type="button" className="chatbot-submit" onClick={submitFeedback} disabled={loading}>
                    {loading ? 'Sending…' : 'Submit'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="chatbot-input-row">
                <input ref={imageInputRef} type="file" className="chatbot-file-input" accept="image/*" onChange={handleImageUpload} />
                <button
                  type="button"
                  className="chatbot-img-btn"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={loading}
                  title="Upload crop image for analysis"
                  aria-label="Upload crop image"
                >
                  🖼️
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type something..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={loading}
                />
                <button type="button" className="chatbot-send" onClick={sendMessage} disabled={loading || !input.trim()} aria-label="Send message" title="Send message" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
