import Link from "next/link";

export const metadata = { title: "Offline" };

// Service worker gezinme istegini karsilayamazsa gosterilen yedek sayfa.
export default function OfflinePage() {
  return (
    <div className="wrap" style={{ padding: "90px 0" }}>
      <div className="empty">
        <h3>You’re offline</h3>
        <p>
          We couldn’t reach the network. Recently visited pages may still work —
          otherwise check your connection and try again.
        </p>
        <Link href="/" className="btn" style={{ marginTop: 14 }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
