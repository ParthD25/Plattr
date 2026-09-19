// Routes + page frame: logo on top, primary nav, account bar, breadcrumbs, footer sitemap.
// Shared file: builders do not edit; each page file has one owner.
import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Logo } from './components/Logo'
import { actions, useAccount, type Role } from './store'
import Landing from './pages/Landing'
import Explore from './pages/Explore'
import FoodPage from './pages/FoodPage'
import LookupPage from './pages/LookupPage'
import LoginPage from './pages/LoginPage'
import DemoAccountPage from './pages/DemoAccountPage'
import ProfilePage from './pages/ProfilePage'
import HistoryPage from './pages/HistoryPage'
import ShopPage from './pages/ShopPage'
import MapPage from './pages/MapPage'
import TrendsPage from './pages/TrendsPage'
import ProducerDashboard from './pages/ProducerDashboard'
import PassportBuilder from './pages/PassportBuilder'
import HowItWorks from './pages/HowItWorks'
import ImpactPage from './pages/ImpactPage'
import AboutPage from './pages/AboutPage'
import LearnPage from './pages/LearnPage'
import LibraryPage from './pages/library/LibraryPage'
import HazardsPage from './pages/library/HazardsPage'
import NutrientsPage from './pages/library/NutrientsPage'
import ForProducersPage from './pages/ForProducersPage'
import DemoGuidePage from './pages/DemoGuidePage'
import Home from './pages/Home'
import PlantPage from './pages/PlantPage'
import ProductPage from './pages/ProductPage'
import RancherProfilePage from './pages/RancherProfilePage'
import RanchersPage from './pages/RanchersPage'

/** Pages that need an account of a given role send everyone else to the demo-account page. */
function Guard({ role, children }: { role: Role; children: React.ReactNode }) {
  const account = useAccount()
  if (!account) return <Navigate to={`/demo-account?next=${encodeURIComponent(location.pathname)}`} replace />
  if (account.role !== role) return <p className="note">This page is for {role} accounts. You are signed in as a {account.role}. <Link to="/demo-account">Switch account</Link></p>
  return <>{children}</>
}

// Where each URL segment sits in the site, for the breadcrumb trail.
const CRUMB: Record<string, { label: string; to?: string }> = {
  explore: { label: 'Find a food', to: '/explore' }, food: { label: 'Find a food', to: '/explore' }, lookup: { label: 'Find a food', to: '/explore' },
  shop: { label: 'Grocery trip', to: '/shop' }, history: { label: 'My groceries', to: '/history' }, map: { label: 'Map', to: '/map' }, trends: { label: 'Health trends', to: '/trends' },
  profile: { label: 'Profile', to: '/profile' }, login: { label: 'Sign in', to: '/login' }, 'demo-account': { label: 'Demo accounts', to: '/demo-account' },
  demo: { label: 'Demo walkthrough', to: '/demo' }, 'how-it-works': { label: 'How it works', to: '/how-it-works' }, impact: { label: 'Our impact', to: '/impact' },
  about: { label: 'About', to: '/about' }, learn: { label: 'Field notes', to: '/learn' }, library: { label: 'Library', to: '/library' },
  hazards: { label: 'Parasites and hazards', to: '/library/hazards' }, nutrients: { label: 'Nutrients and food groups', to: '/library/nutrients' },
  'for-producers': { label: 'For producers', to: '/for-producers' }, producer: { label: 'My farm', to: '/producer' }, passports: { label: 'Product passports', to: '/producer/passports' },
  'plant-lookup': { label: 'USDA plant lookup', to: '/plant-lookup' }, est: { label: 'USDA plant lookup', to: '/plant-lookup' }, ranchers: { label: 'Rancher profiles', to: '/ranchers' },
  r: { label: 'Rancher profiles', to: '/ranchers' }, p: { label: 'USDA plant lookup', to: '/plant-lookup' },
}
const pretty = (slug: string) => decodeURIComponent(slug).replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())

function Breadcrumbs() {
  const parts = useLocation().pathname.split('/').filter(Boolean)
  if (!parts.length) return null
  const trail: { label: string; to?: string }[] = []
  parts.forEach((seg, i) => {
    const known = CRUMB[seg]
    const item = known ?? { label: pretty(seg) }
    if (trail[trail.length - 1]?.label !== item.label) trail.push(i === parts.length - 1 ? { label: item.label } : item)
  })
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {trail.map((c, i) => <span key={i}> <span aria-hidden="true">›</span> {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</span>)}
    </nav>
  )
}

export default function App() {
  const account = useAccount()
  return (
    <>
      <header className="site-head">
        <div className="head-top">
          <Link to="/" className="brand"><Logo /><span>Plattr<small>from the ground up</small></span></Link>
          <div className="head-actions">
            {account
              ? <><span className="muted">Signed in: <strong>{account.name}</strong> ({account.role === 'consumer' ? 'shopper' : 'producer'})</span><button className="small secondary" onClick={() => actions.signOut()}>Sign out</button></>
              : <><Link className="btn small secondary" to="/demo-account">Try a demo account</Link><Link className="btn small" to="/login">Sign in</Link></>}
          </div>
        </div>
        <nav className="main-nav" aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/explore">Find a food</NavLink>
          {/* The tabs follow who is signed in: shoppers get their shopping pages, producers their farm pages. */}
          {!account && <><NavLink to="/how-it-works">How it works</NavLink><NavLink to="/library">Library</NavLink><NavLink to="/learn">Field notes</NavLink><NavLink to="/impact">Our impact</NavLink><NavLink to="/for-producers">For producers</NavLink><NavLink to="/about">About</NavLink></>}
          {account?.role === 'consumer' && <><NavLink to="/shop">Grocery trip</NavLink><NavLink to="/history">My groceries</NavLink><NavLink to="/map">Map</NavLink><NavLink to="/trends">Health trends</NavLink><NavLink to="/library">Library</NavLink><NavLink to="/profile">Profile</NavLink></>}
          {account?.role === 'producer' && <><NavLink to="/producer" end>My farm</NavLink><NavLink to="/producer/passports">Product passports</NavLink><NavLink to="/library">Library</NavLink><NavLink to="/learn">Field notes</NavLink></>}
        </nav>
      </header>
      <main>
        <Breadcrumbs />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/impact" element={<ImpactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/:slug" element={<LearnPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/hazards" element={<HazardsPage />} />
          <Route path="/library/hazards/:slug" element={<HazardsPage />} />
          <Route path="/library/nutrients" element={<NutrientsPage />} />
          <Route path="/library/nutrients/:slug" element={<NutrientsPage />} />
          <Route path="/for-producers" element={<ForProducersPage />} />
          <Route path="/demo" element={<DemoGuidePage />} />
          <Route path="/demo-account" element={<DemoAccountPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/food/:id" element={<FoodPage />} />
          <Route path="/lookup/:barcode" element={<LookupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<Guard role="consumer"><ProfilePage /></Guard>} />
          <Route path="/shop" element={<Guard role="consumer"><ShopPage /></Guard>} />
          <Route path="/history" element={<Guard role="consumer"><HistoryPage /></Guard>} />
          <Route path="/map" element={<Guard role="consumer"><MapPage /></Guard>} />
          <Route path="/trends" element={<Guard role="consumer"><TrendsPage /></Guard>} />
          <Route path="/producer" element={<Guard role="producer"><ProducerDashboard /></Guard>} />
          <Route path="/producer/passports" element={<Guard role="producer"><PassportBuilder /></Guard>} />
          {/* public-record lookups */}
          <Route path="/plant-lookup" element={<Home />} />
          <Route path="/est/:est" element={<PlantPage />} />
          <Route path="/p/:code" element={<ProductPage />} />
          <Route path="/r/:slug" element={<RancherProfilePage />} />
          <Route path="/ranchers" element={<RanchersPage />} />
          <Route path="*" element={<p>Page not found. <Link to="/">Back to the start</Link>.</p>} />
        </Routes>
      </main>
      <footer className="site-foot">
        <nav className="sitemap" aria-label="All pages">
          <div><h2>Shop</h2><Link to="/explore">Find or scan a food</Link><Link to="/shop">Grocery trip</Link><Link to="/history">My groceries</Link><Link to="/map">Map</Link><Link to="/trends">Health trends</Link><Link to="/profile">Profile and allergens</Link></div>
          <div><h2>Learn</h2><Link to="/how-it-works">How it works</Link><Link to="/library/hazards">Parasites and hazards</Link><Link to="/library/nutrients">Nutrients and food groups</Link><Link to="/learn">Field notes</Link><Link to="/plant-lookup">USDA plant lookup</Link></div>
          <div><h2>Producers</h2><Link to="/for-producers">Why join</Link><Link to="/producer">My farm</Link><Link to="/producer/passports">Product passports</Link><Link to="/ranchers">Rancher profiles</Link></div>
          <div><h2>Plattr</h2><Link to="/impact">Our impact</Link><Link to="/about">About the team</Link><Link to="/demo-account">Demo accounts</Link><Link to="/demo">Demo walkthrough</Link><Link to="/login">Sign in</Link></div>
        </nav>
        <p>
          Plattr is a student prototype. Product passports marked SAMPLE are fictional demo data; products looked up live come from Open Food Facts (© contributors, ODbL) and are
          crowd-sourced, not checked by Plattr. The Plattr score measures how much of a food's story is documented and backed up — it is not a medical or food-safety guarantee, and
          nothing here is medical advice. Federal plant records: USDA FSIS (public domain). Map tiles © OpenStreetMap contributors.
        </p>
      </footer>
    </>
  )
}
