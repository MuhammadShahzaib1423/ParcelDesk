import { Link, NavLink } from "react-router-dom";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-700 text-cream-50">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 8 L12 3 L3 8 L3 16 L12 21 L21 16 Z" />
          <path d="M3 8 L12 13 L21 8 M12 13 L12 21" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-sage-900">
        Parcel<span className="text-gold-600">Desk</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const linkCls = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-sm font-medium transition ${isActive ? "bg-sage-700 text-cream-50" : "text-sage-800 hover:bg-sage-100"}`;
  return (
    <header className="sticky top-0 z-40 border-b border-cream-200 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkCls}>Home</NavLink>
          <NavLink to="/shop/noor-studio" className={linkCls}>Demo shop</NavLink>
          <NavLink to="/dashboard" className={linkCls}>Dashboard</NavLink>
          <NavLink to="/pricing" className={linkCls}>Pricing</NavLink>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-cream-200 bg-cream-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-sage-700 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-semibold text-sage-900">ParcelDesk</span> — built by Muhammad Shahzaib, Full Stack Developer, Rawalpindi.
        </p>
        <p>Demo project. All sellers, customers and orders shown are fictional.</p>
      </div>
    </footer>
  );
}
