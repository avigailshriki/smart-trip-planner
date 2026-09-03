// רקע דקורטיבי: כמה "שורות" של איורי נוף (הרים, מפלים, חוף, יער, אגם, מדבר)
// שזזות ברצף אינסופי (marquee) מאחורי מסכי ההתחברות/הרשמה.
// האיורים הם SVG פשוט (בלי תלות ברשת/תמונות חיצוניות) כדי שהרקע תמיד ייטען ולא ישבר.

function MountainsScene() {
  return (
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#bfe3f2" />
      <circle cx="240" cy="50" r="28" fill="#ffd166" />
      <polygon points="0,200 60,90 120,200" fill="#5b7f9e" />
      <polygon points="70,200 150,60 230,200" fill="#3f6280" />
      <polygon points="180,200 250,110 300,200" fill="#5b7f9e" />
      <rect y="180" width="300" height="20" fill="#7fae7a" />
    </svg>
  );
}

function WaterfallScene() {
  return (
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#a7d8d9" />
      <polygon points="0,200 40,40 95,200" fill="#4a6b5a" />
      <polygon points="205,200 260,50 300,200" fill="#4a6b5a" />
      <rect x="118" width="64" height="185" fill="#dff3f5" />
      <rect x="132" width="14" height="185" fill="#ffffff" opacity="0.65" />
      <rect x="85" y="182" width="130" height="18" fill="#8fb9c9" />
    </svg>
  );
}

function BeachScene() {
  return (
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="140" fill="#8ed1e0" />
      <rect y="140" width="300" height="60" fill="#f2e2b6" />
      <circle cx="250" cy="42" r="22" fill="#ffe08a" />
      <path d="M40,150 C40,110 15,95 8,60" stroke="#5a7d4a" strokeWidth="6" fill="none" />
      <ellipse cx="10" cy="55" rx="26" ry="10" fill="#5a8f4a" transform="rotate(-20 10 55)" />
      <ellipse cx="45" cy="50" rx="26" ry="10" fill="#5a8f4a" transform="rotate(15 45 50)" />
      <ellipse cx="30" cy="40" rx="24" ry="9" fill="#6ba055" transform="rotate(-55 30 40)" />
    </svg>
  );
}

function ForestHillsScene() {
  return (
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#cfeaf5" />
      <ellipse cx="150" cy="185" rx="220" ry="55" fill="#8fbf7a" />
      <circle cx="60" cy="155" r="22" fill="#4c7a45" />
      <circle cx="95" cy="145" r="26" fill="#3f6a3a" />
      <circle cx="135" cy="155" r="20" fill="#4c7a45" />
      <circle cx="200" cy="150" r="24" fill="#3f6a3a" />
      <circle cx="240" cy="158" r="20" fill="#4c7a45" />
    </svg>
  );
}

function LakeReflectionScene() {
  return (
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="100" fill="#cfe8f5" />
      <rect y="100" width="300" height="100" fill="#9fcadb" />
      <circle cx="250" cy="35" r="18" fill="#fff3c4" />
      <polygon points="60,100 130,20 200,100" fill="#5b7f9e" />
      <polygon points="60,100 130,178 200,100" fill="#4a6d8c" opacity="0.55" />
    </svg>
  );
}

function DesertBalloonScene() {
  return (
    <svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="200" fill="#fbe0a6" />
      <ellipse cx="150" cy="195" rx="220" ry="35" fill="#e8b866" />
      <circle cx="220" cy="60" r="30" fill="#e8785a" />
      <rect x="211" y="86" width="18" height="13" fill="#7a4a2a" />
      <line x1="213" y1="88" x2="220" y2="60" stroke="#7a4a2a" strokeWidth="2" />
      <line x1="227" y1="88" x2="220" y2="60" stroke="#7a4a2a" strokeWidth="2" />
    </svg>
  );
}

const SCENES = [
  MountainsScene,
  WaterfallScene,
  BeachScene,
  ForestHillsScene,
  LakeReflectionScene,
  DesertBalloonScene,
];

function MarqueeRow({
  reverse = false,
  durationSeconds = 45,
  offset = 0,
}: {
  reverse?: boolean;
  durationSeconds?: number;
  offset?: number;
}) {
  // מכפילים את רשימת הסצנות פעמיים כדי שהאנימציה תלולאה בלי "קפיצה" נראית לעין
  const ordered = [...SCENES.slice(offset), ...SCENES.slice(0, offset)];
  const doubled = [...ordered, ...ordered];

  return (
    <div className="marquee-row">
      <div
        className={`marquee-track${reverse ? " reverse" : ""}`}
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {doubled.map((Scene, index) => (
          <div className="scene-card" key={index}>
            <Scene />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TravelBackground() {
  return (
    <div className="auth-background" aria-hidden="true">
      <MarqueeRow durationSeconds={50} offset={0} />
      <MarqueeRow reverse durationSeconds={65} offset={2} />
      <MarqueeRow durationSeconds={40} offset={4} />
    </div>
  );
}
