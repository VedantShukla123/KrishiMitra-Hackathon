import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'
import { useLanguage } from '../context/LanguageContext'
import './Vouchers.css'

const CATEGORIES = {
  seeds: 'vouchers.categorySeeds',
  fertilizer: 'vouchers.categoryFertilizer',
  labor: 'vouchers.categoryLabor',
  pesticides: 'vouchers.categoryPesticides',
  harvest: 'vouchers.categoryHarvest',
}

// Stage-based vouchers. Unlocks when milestones activate; QR+PIN are generated and persisted.
function useVouchers(user) {
  const uid = user?.id
  const qualifiedAmount = 100
  const readFlag = (base) => {
    try { return localStorage.getItem(kmKey(base, uid)) === '1' } catch { return false }
  }
  const stage1 = readFlag('stage1_active')
  const stage2 = readFlag('stage2_active')
  const stage3 = readFlag('stage3_active')

  const ensureVoucher = (id, amount, category) => {
    const key = uid ? `km_voucher_${id}_${uid}` : `km_voucher_${id}`
    try {
      const existing = localStorage.getItem(key)
      if (existing) return JSON.parse(existing)
      const pin = String(Math.floor(100000 + Math.random() * 900000))
      const v = {
        id,
        code: 'KVM-' + pin,
        pin,
        amount,
        category,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      }
      localStorage.setItem(key, JSON.stringify(v))
      return v
    } catch {
      return null
    }
  }

  const vouchers = []
  if (stage1) {
    const v = ensureVoucher('v1', 50, 'seeds')
    if (v) vouchers.push(v)
  }
  if (stage2) {
    const v = ensureVoucher('v2', 30, 'labor')
    if (v) vouchers.push(v)
  }
  if (stage3) {
    const v = ensureVoucher('v3', 20, 'harvest')
    if (v) vouchers.push(v)
  }

  return { qualifiedAmount, vouchers }
}

function VoucherCard({ voucher, t }) {
  const categoryKey = CATEGORIES[voucher.category]
  const categoryLabel = categoryKey ? t(categoryKey) : voucher.category
  const isRedeemed = voucher.status === 'redeemed'
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(voucher.code)}`

  return (
    <div className={`vouch-card vouch-card-${voucher.status}`}>
      <div className="vouch-card-head">
        <span className="vouch-amount">${voucher.amount}</span>
        <span className={`vouch-badge vouch-badge-${voucher.status}`}>
          {isRedeemed ? t('vouchers.redeemed') : t('vouchers.active')}
        </span>
      </div>
      <p className="vouch-category">{t('vouchers.lockedTo')} <strong>{categoryLabel}</strong></p>
      {!isRedeemed && (
        <>
          <div className="vouch-redeem-wrap">
            <div className="vouch-qr">
              <img src={qrUrl} alt="Voucher QR" />
            </div>
            <div className="vouch-pin-wrap">
              <span className="vouch-pin-label">{t('vouchers.pinLabel')}</span>
              <span className="vouch-pin">{voucher.pin}</span>
            </div>
          </div>
          <p className="vouch-instruction">
            {t('vouchers.redeemAt')}
          </p>
        </>
      )}
      {isRedeemed && (
        <p className="vouch-redeemed-note">{t('vouchers.redeemedOn', { date: voucher.redeemedAt })}</p>
      )}
    </div>
  )
}

export default function Vouchers() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { qualifiedAmount, vouchers } = useVouchers(user)
  const activeCount = vouchers.filter((v) => v.status === 'active').length
  const uid = user?.id
  const evaluated = (() => { try { return localStorage.getItem(kmKey('evaluated', uid)) === '1' } catch { return false } })()
  const score = user?.trustScore ?? 0
  const eligible = score >= 80

  return (
    <div className="vouchers-page">
      <div className="vouch-hero">
        <span className="vouch-hero-icon">🎫</span>
        <h1>{t('vouchers.title')}</h1>
        <p className="vouch-hero-desc">
          {t('vouchers.subtitle')}</p>
      </div>

      {!evaluated && (
        <div className="vouch-qualification">
          <h3>{t('vouchers.lockedUntilEvaluation')}</h3>
          <p>{t('vouchers.unlockEvalHint')}</p>
        </div>
      )}

      {evaluated && !eligible && (
        <div className="vouch-qualification">
          <h3>{t('vouchers.lockedUntil80')}</h3>
          <p>{t('vouchers.unlockHint', { score })}</p>
        </div>
      )}

      <div className="vouch-qualification">
        <h3>{t('vouchers.yourApproval')}</h3>
        <p>
          {t('vouchers.qualifiesFor')} <strong>${qualifiedAmount}</strong> {t('vouchers.inVouchers')}
        </p>
        <p>{t('vouchers.disbursementNote')}</p>
      </div>

      <div className="vouch-flow">
        <h3>{t('vouchers.howItWorks')}</h3>
        <ol>
          <li>{t('vouchers.step1')}</li>
          <li>{t('vouchers.step2')}</li>
          <li>{t('vouchers.step3')}</li>
          <li>{t('vouchers.step4')}</li>
          <li>{t('vouchers.step5')}</li>
        </ol>
      </div>

      {evaluated && eligible && (
      <div className="vouch-list">
        <h2>{t('vouchers.myVouchers')}</h2>
        {activeCount > 0 && (
          <p className="vouch-list-sub">{t('vouchers.activeCountNote', { count: activeCount })}</p>
        )}
        <div className="vouch-grid">
          {vouchers.map((v) => (
            <VoucherCard key={v.id} voucher={v} t={t} />
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
