import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { kmKey } from '../utils/storageKeys'
import { useState, useEffect, useCallback } from 'react'
import './Settings.css'

// Transactions loaded from Firestore for the logged-in user
function useTransactions(getTransactions, userId) {
  const [rows, setRows] = useState([])
  const refresh = useCallback(async () => {
    if (!getTransactions || !userId) { setRows([]); return }
    const txs = await getTransactions()
    setRows(txs)
  }, [getTransactions, userId])
  useEffect(() => { refresh() }, [refresh])
  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('km_transactions_updated', handler)
    return () => window.removeEventListener('km_transactions_updated', handler)
  }, [refresh])
  return rows
}

const MOCK_LOAN = {
  status: 'Active',
  amount: 100,
  stage: 'Stage 2 – Labor / Weeding',
  currency: 'USD',
}

export default function Settings() {
  const { user, addTrustScore, getTransactions } = useAuth()
  const { t } = useLanguage()
  const address = 'Karjat, Raigad'
  const weatherZone = 'Karjat (Rainfall zone)'
  const [nominee, setNominee] = useState('')
  const [dob, setDob] = useState('')
  const [addr, setAddr] = useState('')
  const [phone, setPhone] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const score = user?.trustScore ?? 0
  const eligible = score >= 80
  const txRows = useTransactions(getTransactions, user?.id)

  return (
    <div className="settings-page">
      <h1 className="settings-title">{t('settings.title')}</h1>

      <section className="settings-section">
        <h2>{t('settings.profile')}</h2>
        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-label">{t('settings.name')}</span>
            <span className="settings-value">{user?.name ?? '—'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('settings.email')}</span>
            <span className="settings-value">{user?.email ?? '—'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('settings.phone')}</span>
            <span className="settings-value">{user?.phone || '—'}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('settings.address')}</span>
            <span className="settings-value">{address}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('settings.weatherZone')}</span>
            <span className="settings-value">{weatherZone}</span>
          </div>
        </div>
        <div className="settings-card" style={{ marginTop: '1rem' }}>
          <div className="settings-row">
            <label className="settings-label" htmlFor="nominee">{t('settings.nominee')}</label>
            <input id="nominee" type="text" value={nominee} onChange={(e) => setNominee(e.target.value)} placeholder="Full name" />
          </div>
          <div className="settings-row">
            <label className="settings-label" htmlFor="dob">{t('settings.dob')}</label>
            <input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="settings-row">
            <label className="settings-label" htmlFor="addr">{t('settings.address')}</label>
            <input id="addr" type="text" value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Village, Taluka, District" />
          </div>
          <div className="settings-row">
            <label className="settings-label" htmlFor="phone">{t('settings.phone')}</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
          </div>
          <div className="settings-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setSaveMsg('')
                const allFilled = nominee.trim() && dob && addr.trim() && phone.trim()
                if (!allFilled) { setSaveMsg(t('settings.fillAllFields')); return }
                try {
                  const uid = user?.id
                  localStorage.setItem(kmKey('profile_data', uid), JSON.stringify({ nominee, dob, addr, phone }))
                  const used = localStorage.getItem(kmKey('session_used_profile', uid)) === '1'
                  if (!used) {
                    addTrustScore(10, 'Profile completed')
                    localStorage.setItem(kmKey('profile_awarded', uid), '1')
                    localStorage.setItem(kmKey('session_used_profile', uid), '1')
                  }
                  setSaveMsg(t('settings.profileSaved'))
                } catch {}
              }}
            >
              {t('settings.saveProfile')}
            </button>
            {saveMsg && <span className="settings-value" style={{ marginLeft: '0.75rem' }}>{saveMsg}</span>}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.transactionHistory')}</h2>
        <div className="settings-card">
          <p className="settings-hint">{t('settings.pointsEarned')} / {t('settings.pointsDepleted')}</p>
          {txRows.length === 0 && (
            <p className="settings-hint" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{t('settings.noTransactionsYet')}</p>
          )}
          <div className="settings-table-wrap">
            <table className="settings-table">
              <thead>
                <tr>
                  <th>{t('settings.date')}</th>
                  <th>{t('settings.description')}</th>
                  <th>{t('settings.change')}</th>
                </tr>
              </thead>
              <tbody>
                {txRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td>{row.description}</td>
                    <td className={row.type === 'earned' ? 'settings-change-plus' : 'settings-change-minus'}>
                      {row.change > 0 ? `+${row.change}` : row.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.loan')}</h2>
        <div className="settings-card">
          <p className="settings-hint">{t('settings.loanStatus')}</p>
          <div className="settings-row">
            <span className="settings-label">{t('settings.status')}</span>
            <span className="settings-value settings-status">{eligible ? t('settings.approved') : t('settings.pendingRequires80')}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('settings.amount')}</span>
            <span className="settings-value">${MOCK_LOAN.amount} {MOCK_LOAN.currency}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t('settings.stage')}</span>
            <span className="settings-value">{MOCK_LOAN.stage}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
