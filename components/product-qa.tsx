"use client";

import { useMemo, useState } from "react";

type Q = { id: string; q: string; a: string; helpful: number };

function seedQuestions(productId: number, name: string, category: string): Q[] {
  const base = [
    {
      id: "q1",
      q: `Is the ${name} beginner-friendly?`,
      a: `Yes for most people stepping up from entry gear. Start with the factory mid setting, brew two cups, then nudge one click at a time. ${category} products reward small changes more than big ones.`,
      helpful: 12 + (productId % 9),
    },
    {
      id: "q2",
      q: "Does it work for espresso and filter?",
      a:
        category.toLowerCase().includes("grind")
          ? "Filter is its happy place; espresso is possible if you dial carefully and accept a longer workflow. Omni setups help if you switch often."
          : "It pairs well with both if your grinder can keep up. Focus on dose and water temp more than the accessory itself.",
      helpful: 8 + (productId % 7),
    },
    {
      id: "q3",
      q: "How loud is it in a small kitchen?",
      a: "Quieter than a blender, louder than a kettle click. Early mornings are fine in an apartment if you’re not pressing against a shared wall.",
      helpful: 5 + (productId % 5),
    },
  ];
  return base;
}

export function ProductQA({
  productId,
  name,
  category,
}: {
  productId: number;
  name: string;
  category: string;
}) {
  const initial = useMemo(
    () => seedQuestions(productId, name, category),
    [productId, name, category],
  );
  const [items, setItems] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(initial[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState(false);

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = draft.trim();
    if (!q) return;
    const id = `u-${Date.now()}`;
    setItems((prev) => [
      {
        id,
        q,
        a: "Thanks — a specialist usually replies within a day. Meanwhile, check the specs table and recent reviews below.",
        helpful: 0,
      },
      ...prev,
    ]);
    setOpenId(id);
    setDraft("");
    setSent(true);
  }

  return (
    <section className="sec qa" style={{ borderBottom: "none" }} data-testid="product-qa">
      <div className="sec-head">
        <div>
          <span className="eyebrow">Community</span>
          <h2>Questions & answers</h2>
        </div>
      </div>

      <ul className="qa-list">
        {items.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className={`qa-item${open ? " on" : ""}`}>
              <button
                type="button"
                className="qa-q"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span>{item.q}</span>
                <span className="qa-chev" aria-hidden>{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="qa-a">
                  <p>{item.a}</p>
                  <button
                    type="button"
                    className="qa-help"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === item.id ? { ...x, helpful: x.helpful + 1 } : x,
                        ),
                      )
                    }
                  >
                    Helpful ({item.helpful})
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <form className="qa-ask" onSubmit={ask}>
        <label className="qa-ask-label" htmlFor="qa-input">Ask a question</label>
        <div className="qa-ask-row">
          <input
            id="qa-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Ask about ${name}…`}
            data-testid="qa-input"
          />
          <button className="btn sm" type="submit" disabled={!draft.trim()} data-testid="qa-submit">
            Post
          </button>
        </div>
        {sent && (
          <p className="qa-note">Posted locally for this session — great for demos.</p>
        )}
      </form>
    </section>
  );
}
