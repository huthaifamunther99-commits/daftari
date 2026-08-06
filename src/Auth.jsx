import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setMessage('خطأ: ' + error.message)
      } else {
        setMessage('تم التسجيل! افتح إيميلك واضغط رابط التأكيد، بعدها سجل دخول.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessage('خطأ: ' + error.message)
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h2>{isSignUp ? 'إنشاء حساب' : 'تسجيل دخول'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="الإيميل"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}
        />
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'جاري...' : isSignUp ? 'تسجيل' : 'دخول'}
        </button>
      </form>
      {message && <p style={{ marginTop: 10 }}>{message}</p>}
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: 15, background: 'none', border: 'none', color: 'blue' }}
      >
        {isSignUp ? 'عندك حساب؟ سجل دخول' : 'ما عندك حساب؟ سجل جديد'}
      </button>
    </div>
  )
}
