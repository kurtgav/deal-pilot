export default function LeadScoreGauge({ score }: { score: number }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#94a3b8';
  const label = score >= 80 ? 'SQL' : score >= 60 ? 'MQL' : score >= 40 ? 'Review' : 'Gathering...';

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="80" cy="80" r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '40px' }}>
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-[var(--color-muted)] mt-1">{label}</span>
      </div>
    </div>
  );
}
