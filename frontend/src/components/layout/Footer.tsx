import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'

const footerLinks = [
  {
    title: 'Product',
    links: [
      { to: '/pricing', label: 'Pricing' },
      { to: '/docs', label: 'Documentation' },
      { to: '/upload', label: 'Upload Invoice' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/contact', label: 'Contact' },
      { to: '#', label: 'Privacy Policy' },
      { to: '#', label: 'Terms of Service' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-surface-950">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-accent-500" />
              <span className="text-lg font-bold">
                Creative<span className="text-accent-400">Invoice</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-white/50">
              AI-powered GST invoice data extraction. Upload, extract, and export in seconds.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="mb-3 text-sm font-semibold text-white/80">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-white/50 transition-colors hover:text-white/80">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-white/30">
          &copy; {new Date().getFullYear()} Creative Invoice. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
