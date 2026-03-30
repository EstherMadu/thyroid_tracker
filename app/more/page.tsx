import Link from 'next/link'
import { Panel, Screen } from '@/components/AppShell'

const links = [
  { href: '/supplements', label: 'Supplements', desc: 'Track adherence, custom reminders, and missed doses.' },
  { href: '/water', label: 'Water', desc: 'Log hydration against your daily target.' },
  { href: '/journal', label: 'Daily notes', desc: 'Keep short notes on patterns and follow-up.' },
  { href: '/insights', label: 'Insights', desc: 'See rule-based patterns from your logs.' },
  { href: '/weekly-review', label: 'Weekly review', desc: 'Review wins, triggers, and next actions.' },
  { href: '/progress', label: '12-week progress', desc: 'Check the long-view charts for the program.' },
  { href: '/records', label: 'Medical records', desc: 'Upload scans, lab files, and notes.' },
]

export default function MorePage() {
  return (
    <Screen eyebrow="Personal tools" title="More">
      <Panel>
        <div className="space-y-3">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-[20px] border border-white/10 bg-black/15 p-4">
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
            </Link>
          ))}
        </div>
      </Panel>
    </Screen>
  )
}

