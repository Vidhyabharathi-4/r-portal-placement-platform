import { AlertCircle, Bell, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PageHeader({ eyebrow, title, description, children }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{children && <div className="page-actions">{children}</div>}</header>
}

export function StatusBadge({ value }) { return <span className={`status status-${String(value).toLowerCase()}`}>{String(value).replaceAll('_', ' ')}</span> }
export function LoadingState() { return <div className="state"><span className="spinner"/> Loading operational data…</div> }
export function ErrorState({ message }) { return <div className="state state-error"><AlertCircle size={18}/>{message}</div> }
export function EmptyState({ title, detail, action }) { return <div className="empty-state"><h2>{title}</h2><p>{detail}</p>{action && <Link className="button button-secondary" to={action.to}>{action.label}</Link>}</div> }
export function MetricCard({ label, value, note = 'Data unavailable', icon: Icon, unavailable = false }) { return <article className={`metric-card ${unavailable ? 'metric-unavailable' : ''}`}><div className="metric-heading"><span>{label}</span><Icon size={18}/></div><strong>{unavailable ? '—' : value}</strong><small>{unavailable ? note : 'Live database total'}</small></article> }
export function SearchBox({ placeholder = 'Search', value, onChange }) { return <label className="search-box"><Search size={17}/><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)}/></label> }
export function FilterSelect({ label, value, onChange, options }) { return <label className="filter-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option value={optionValue} key={optionValue}>{optionLabel}</option>)}</select></label> }
export function Modal({ title, children, onClose }) { return <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button onClick={onClose} aria-label="Close">×</button></header>{children}</section></div> }
export function NotificationLink() { return <Link to="/notifications" className="header-icon" aria-label="Notifications"><Bell size={19}/></Link> }
