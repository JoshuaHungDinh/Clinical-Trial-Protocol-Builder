import './PlaceholderPage.scss'

interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page__card">
        <svg className="placeholder-page__icon" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="#e0e7ff" />
          <path d="M16 24h16M24 16v16" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <h2 className="placeholder-page__title">{title}</h2>
        <p className="placeholder-page__text">This feature is coming soon.</p>
      </div>
    </div>
  )
}
