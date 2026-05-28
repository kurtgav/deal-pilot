import { Hexagon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold text-zinc-900">
          <Hexagon className="h-5 w-5 text-zinc-900" strokeWidth={2.5} />
          <span>DealPilot AI</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-zinc-600 md:flex">
          <Link to="/use-cases" className="hover:text-zinc-900 transition-colors">Use Cases</Link>
          <Link to="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
          <Link to="/book-demo" className="hover:text-zinc-900 transition-colors">Book a Demo</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/app" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">Log in</Link>
          <Link to="/app" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  );
}
