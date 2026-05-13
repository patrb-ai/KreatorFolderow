import { useState } from 'react'
import { useNavigate } from 'react-router'

export default function LoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (login === 'Admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true')
      navigate('/templates')
    } else {
      setError('Nieprawidłowy login lub hasło')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="bg-white border border-[#e2e8f0] rounded-[16px] p-10 w-[454px]">
        <h1 className="text-[32px] font-bold text-[#314158] mb-8 leading-[1.5]">Login</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[14px] text-[#314158]">Login</label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              className="bg-[#f8fafc] rounded-[8px] h-[48px] px-3 text-[14px] outline-none border-0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[14px] text-[#314158]">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-[#f8fafc] rounded-[8px] h-[48px] px-3 text-[14px] outline-none border-0"
            />
          </div>
          {error && (
            <p className="text-red-600 text-[12px]">{error}</p>
          )}
          <button
            type="submit"
            className="bg-[#020618] text-white rounded-[8px] h-[48px] text-[14px] font-semibold hover:opacity-90 cursor-pointer mt-2 border-0"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
