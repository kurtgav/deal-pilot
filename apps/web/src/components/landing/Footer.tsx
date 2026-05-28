import { Hexagon } from 'lucide-react';

const columns = [
  { title: 'Product', links: ['How It Works', 'Pricing', 'Use Cases', 'Book a Demo', 'Changelog'] },
  { title: 'Features', links: ['Voice Discovery', 'Technical Q&A', 'Objection Handling', 'Lead Scoring', 'CRM Handoff'] },
  { title: 'Resources', links: ['Documentation', 'Knowledge Base Setup', 'API Reference', 'Blog', 'Status'] },
  { title: 'Company', links: ['About', 'Careers', 'Contact', 'Press', 'Partners'] },
];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white px-6 pt-16 pb-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-zinc-900 mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-8">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Hexagon className="h-4 w-4" />
            <span>© 2026 DealPilot AI. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-400">
            <a href="#" className="hover:text-zinc-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
