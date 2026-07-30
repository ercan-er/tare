"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

// Kendi "Storyly"miz: Instagram tarzi reklam hikayeleri. Tamamen sunumsal,
// veri asagida sabit. Gorseller urun seed'iyle ayni Unsplash ID'leri.

const cover = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=200&h=200&q=70`;
const portrait = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1600&q=75`;

type Slide = {
  photo: string;
  tint: string; // ust/alt karartma icin ana renk
  eyebrow: string;
  heading: string;
  body?: string;
  cta: string;
  href: string;
};

type Story = {
  id: string;
  label: string;
  ring: string; // balon halka gradyani
  coverId: string;
  slides: Slide[];
};

const STORIES: Story[] = [
  {
    id: "new",
    label: "New in",
    ring: "linear-gradient(45deg,#A87B3C,#E9C77E)",
    coverId: "photo-1521302200778-33500795e128",
    slides: [
      {
        photo: portrait("photo-1521302200778-33500795e128"),
        tint: "#1c130a",
        eyebrow: "Just landed",
        heading: "The 2026 grinder line",
        body: "Flat burrs, stepless dial, quieter motor.",
        cta: "Shop new arrivals",
        href: "/products?sort=newest",
      },
      {
        photo: portrait("photo-1610889556528-9a770e32642f"),
        tint: "#0f1512",
        eyebrow: "Just landed",
        heading: "Built to be repeatable",
        body: "Every unit dialed and tested before it ships.",
        cta: "See the range",
        href: "/products?sort=newest",
      },
    ],
  },
  {
    id: "sale",
    label: "-20%",
    ring: "linear-gradient(45deg,#B4432F,#E9A07E)",
    coverId: "photo-1544787219-7f47ccb76574",
    slides: [
      {
        photo: portrait("photo-1544787219-7f47ccb76574"),
        tint: "#1a0d0a",
        eyebrow: "This week only",
        heading: "20% off all scales",
        body: "Precision to 0.1g. Now for less.",
        cta: "Grab the deal",
        href: "/products?category=scales",
      },
    ],
  },
  {
    id: "grinders",
    label: "Grinders",
    ring: "linear-gradient(45deg,#2F6B4F,#8FD0AE)",
    coverId: "photo-1587734195503-904fca47e0e9",
    slides: [
      {
        photo: portrait("photo-1587734195503-904fca47e0e9"),
        tint: "#0c1410",
        eyebrow: "Editor's pick",
        heading: "Grind size, solved",
        body: "From espresso fine to French press coarse.",
        cta: "Browse grinders",
        href: "/products?category=grinders",
      },
    ],
  },
  {
    id: "brew",
    label: "Brew guide",
    ring: "linear-gradient(45deg,#4A6FA5,#A8C6F0)",
    coverId: "photo-1495474472287-4d71bcdd2085",
    slides: [
      {
        photo: portrait("photo-1495474472287-4d71bcdd2085"),
        tint: "#0a0f16",
        eyebrow: "How to",
        heading: "A cleaner pour-over",
        body: "Kettle, filter, scale — the whole setup.",
        cta: "Shop the setup",
        href: "/products?category=brewers",
      },
      {
        photo: portrait("photo-1461023058943-07fcbe16d735"),
        tint: "#0a0f16",
        eyebrow: "How to",
        heading: "Weigh, don't guess",
        body: "A 1:16 ratio, every single morning.",
        cta: "Shop scales",
        href: "/products?category=scales",
      },
    ],
  },
  {
    id: "bestsellers",
    label: "⭐ Bestsellers",
    ring: "linear-gradient(45deg,#F7971E,#FFD200 55%,#FF8008)",
    coverId: "photo-1517668808822-9ebb02f2a0e6",
    slides: [
      {
        photo: portrait("photo-1517668808822-9ebb02f2a0e6"),
        tint: "#14100a",
        eyebrow: "Most loved",
        heading: "The gear everyone's buying",
        body: "Top-rated kettles, grinders and scales in one place.",
        cta: "Shop bestsellers",
        href: "/products?sort=rating",
      },
      {
        photo: portrait("photo-1594213114663-d94db9b17125"),
        tint: "#120f0a",
        eyebrow: "4.6★ and up",
        heading: "Rated by 3,000+ brewers",
        body: "If it's here, it earned its spot.",
        cta: "See the ranking",
        href: "/products?sort=rating",
      },
    ],
  },
  {
    id: "freeship",
    label: "🚚 Free ship",
    ring: "linear-gradient(45deg,#11998E,#38EF7D 60%,#00C2A8)",
    coverId: "photo-1447933601403-0c6688de566e",
    slides: [
      {
        photo: portrait("photo-1447933601403-0c6688de566e"),
        tint: "#08130f",
        eyebrow: "On us",
        heading: "Free shipping over $75",
        body: "Add one more thing — the plane's on us.",
        cta: "Start a basket",
        href: "/products",
      },
    ],
  },
  {
    id: "gifts",
    label: "🎁 Gift sets",
    ring: "linear-gradient(45deg,#8E2DE2,#DA22FF 55%,#FF4FD8)",
    coverId: "photo-1516224498413-84ecf3a1e7fd",
    slides: [
      {
        photo: portrait("photo-1516224498413-84ecf3a1e7fd"),
        tint: "#120a16",
        eyebrow: "For the coffee person",
        heading: "Ready-to-gift sets",
        body: "Scale, dripper and filters, boxed together.",
        cta: "Shop gift sets",
        href: "/products?category=accessories",
      },
      {
        photo: portrait("photo-1509042239860-f550ce710b93"),
        tint: "#120a16",
        eyebrow: "No guesswork",
        heading: "Can't pick? Can't lose.",
        body: "Our bestsellers make an easy present.",
        cta: "Browse gifts",
        href: "/products?sort=rating",
      },
    ],
  },
];

const DURATION = 5000; // ms, her slayt

export function Stories() {
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  const close = useCallback(() => setOpen(null), []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const openStory = useCallback((i: number) => {
    setOpen(i);
    setSlide(0);
    setPaused(false);
    markSeen(STORIES[i].id);
  }, [markSeen]);

  const next = useCallback(() => {
    if (open === null) return;
    const group = STORIES[open];
    if (slide < group.slides.length - 1) {
      setSlide((s) => s + 1);
    } else if (open < STORIES.length - 1) {
      const ni = open + 1;
      setOpen(ni);
      setSlide(0);
      markSeen(STORIES[ni].id);
    } else {
      close();
    }
  }, [open, slide, close, markSeen]);

  const prev = useCallback(() => {
    if (open === null) return;
    if (slide > 0) {
      setSlide((s) => s - 1);
    } else if (open > 0) {
      setOpen(open - 1);
      setSlide(0);
    }
  }, [open, slide]);

  // Acikken sayfayi kilitle + Escape / oklar.
  useEffect(() => {
    if (open === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, next, prev, close]);

  const group = open === null ? null : STORIES[open];
  const current = group?.slides[slide];

  // Bir sonraki gorseli sessizce on-yukle: slayt gecerken beklemesin.
  useEffect(() => {
    if (!group) return;
    const nextInGroup = group.slides[slide + 1];
    const nextGroup = open !== null ? STORIES[open + 1] : undefined;
    const src = nextInGroup?.photo ?? nextGroup?.slides[0]?.photo;
    if (src) {
      const im = new Image();
      im.src = src;
    }
  }, [group, slide, open]);

  return (
    <>
      <div className="stories-bar" data-testid="stories">
        <div className="wrap stories-row">
          {STORIES.map((s, i) => (
            <button
              key={s.id}
              className="story-bubble"
              data-seen={seen.has(s.id)}
              onClick={() => openStory(i)}
              data-testid="story-bubble"
            >
              <span className="story-ring" style={{ background: s.ring }}>
                <span className="story-img">
                  <img src={cover(s.coverId)} alt="" loading="lazy" />
                </span>
              </span>
              <span className="story-label">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {group && current && (
        <div
          className="stories-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${group.label} story`}
          data-testid="story-viewer"
          onClick={close}
        >
          <div
            className="story-stage"
            data-paused={paused}
            style={{ background: current.tint }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          >
            <img className="story-bg" src={current.photo} alt="" draggable={false} />
            <div className="story-scrim" />

            <div className="story-bars">
              {group.slides.map((_, i) => (
                <span className="story-track" key={i}>
                  {i < slide ? (
                    <span className="story-progress" style={{ width: "100%" }} />
                  ) : i === slide ? (
                    <span
                      // CSS ile 0→100 dolar; her karede React render yok.
                      key={`${open}-${slide}`}
                      className="story-progress run"
                      style={{ animationDuration: `${DURATION}ms` }}
                      onAnimationEnd={next}
                    />
                  ) : (
                    <span className="story-progress" style={{ width: "0%" }} />
                  )}
                </span>
              ))}
            </div>

            <div className="story-top">
              <span className="story-brand">Tare<em>.</em></span>
              <button
                className="story-close"
                onClick={close}
                aria-label="Close"
                data-testid="story-close"
              >
                ✕
              </button>
            </div>

            {/* dokunma bolgeleri */}
            <button className="story-tap left" aria-label="Previous" onClick={prev} />
            <button className="story-tap right" aria-label="Next" onClick={next} />

            <div className="story-content">
              <span className="story-eyebrow">{current.eyebrow}</span>
              <h2 className="story-heading">{current.heading}</h2>
              {current.body && <p className="story-body">{current.body}</p>}
              <Link href={current.href} className="btn story-cta" onClick={close}>
                {current.cta}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
