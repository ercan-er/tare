"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "./locale-provider";

export type AiGuideProduct = {
  id: number;
  name: string;
  brand: string;
  categoryName: string;
  categorySlug: string;
  description: string;
  rating: number;
  reviewCount: number;
  stock: number;
  price: number;
  tags: string[];
  variants: { optionName: string; optionValue: string }[];
  insight: {
    purchaseRate: number;
    topReason: string;
    alsoBoughtPct: number | null;
    alsoBoughtLabel: string | null;
  } | null;
};

type PromptId = "overview" | "forWhom" | "howTo" | "compare";

const PROMPTS: { id: PromptId; label: string }[] = [
  { id: "overview", label: "Quick take" },
  { id: "forWhom", label: "Who is this for?" },
  { id: "howTo", label: "How to use it" },
  { id: "compare", label: "Should I buy it?" },
];

function buildAnswer(id: PromptId, p: AiGuideProduct, money: (c: number) => string): string {
  const tags = p.tags.length ? p.tags.slice(0, 3).join(", ") : p.categoryName.toLowerCase();
  const variantLine = p.variants.length
    ? ` Available as ${p.variants.map((v) => v.optionValue).join(", ")}.`
    : "";
  const stockLine =
    p.stock <= 0
      ? " It’s currently sold out — worth a watchlist tap if you want it later."
      : p.stock <= 5
        ? ` Only ${p.stock} left, so this one moves.`
        : ` In stock (${p.stock} units).`;
  const social = p.insight
    ? ` About ${p.insight.purchaseRate}% of people who open this page end up buying — ${p.insight.topReason}`
    : ` Rated ${p.rating.toFixed(1)} across ${p.reviewCount} reviews.`;
  const also =
    p.insight?.alsoBoughtPct && p.insight.alsoBoughtLabel
      ? ` ${p.insight.alsoBoughtPct}% also grab ${p.insight.alsoBoughtLabel}.`
      : "";

  const catTip: Record<string, string> = {
    grinders:
      "Dial in coarse for pour-over, finer for espresso, and wipe the burrs every couple of weeks so fines don’t muddle the cup.",
    brewers:
      "Bloom for 30–45 seconds, keep the pour slow, and aim for a total brew time that matches the recipe on the bag.",
    kettles:
      "Heat to the temp your coffee asks for, then pour in thin spirals from the center out — control beats speed.",
    scales:
      "Zero the vessel, weigh dose and yield, and you’ll stop guessing ratios after two mornings.",
    accessories:
      "Small tools, big consistency — use them the same way each brew and the cup stops tasting random.",
  };

  switch (id) {
    case "overview":
      return (
        `${p.name} by ${p.brand} sits in ${p.categoryName.toLowerCase()} for a reason. ` +
        `${p.description.trim()} ` +
        `At ${money(p.price)}, you’re paying for ${tags}.${variantLine}${stockLine}`
      );
    case "forWhom":
      return (
        `I’d point this at someone who already cares about a repeatable cup — not a gadget collector. ` +
        `If you brew ${p.categorySlug === "grinders" ? "at home most mornings" : "with intention a few times a week"}, ` +
        `${p.brand}’s ${p.name} matches that pace. ` +
        (p.rating >= 4.5
          ? `The ${p.rating.toFixed(1)} rating from ${p.reviewCount} buyers is the quiet signal it’s not a novelty.`
          : `Reviews sit at ${p.rating.toFixed(1)} — read a couple of recent ones if you’re between two options.`) +
        also
      );
    case "howTo":
      return (
        `Start simple: unbox, wipe, then run one practice session before you chase a perfect recipe. ` +
        `${catTip[p.categorySlug] ?? "Follow the product notes, then adjust one variable at a time."} ` +
        (p.variants.length
          ? `Pick the ${p.variants[0].optionName.toLowerCase()} that matches how you actually brew — don’t buy “future you.”`
          : `Keep the workflow boring for a week; consistency teaches faster than upgrades.`)
      );
    case "compare":
      return (
        `Buy it if the job this does shows up in your routine at least a few times a week. ` +
        `Skip it if you’re still deciding whether you even like ${p.categoryName.toLowerCase()}. ` +
        social +
        also +
        stockLine
      );
  }
}

export function ProductAiGuide({ product }: { product: AiGuideProduct }) {
  const { money } = useLocale();
  const [prompt, setPrompt] = useState<PromptId>("overview");
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(true);
  const [done, setDone] = useState(false);
  const runId = useRef(0);

  const answer = useMemo(() => buildAnswer(prompt, product, money), [prompt, product, money]);

  useEffect(() => {
    const id = ++runId.current;
    setText("");
    setDone(false);
    setThinking(true);

    const thinkFor = 420 + (product.id % 5) * 80;
    const thinkTimer = window.setTimeout(() => {
      if (runId.current !== id) return;
      setThinking(false);

      let i = 0;
      const step = () => {
        if (runId.current !== id) return;
        i += 1 + (i % 3 === 0 ? 1 : 0);
        setText(answer.slice(0, i));
        if (i >= answer.length) {
          setDone(true);
          return;
        }
        window.setTimeout(step, 12 + (i % 7));
      };
      step();
    }, thinkFor);

    return () => {
      window.clearTimeout(thinkTimer);
      runId.current += 1;
    };
  }, [answer, product.id]);

  return (
    <section className="ai-guide" data-testid="product-ai-guide" aria-label="AI product guide">
      <div className="ai-guide-head">
        <div className="ai-guide-avatar" aria-hidden>
          <span className="ai-guide-pulse" />
          <span className="ai-guide-mark">T</span>
        </div>
        <div>
          <div className="ai-guide-title">Tare Guide</div>
          <div className="ai-guide-sub">AI product brief · grounded in this listing</div>
        </div>
        <span className={`ai-guide-status${done ? " on" : ""}`}>
          {thinking ? "Thinking…" : done ? "Ready" : "Writing…"}
        </span>
      </div>

      <div className="ai-guide-chips" role="tablist" aria-label="Ask the guide">
        {PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={prompt === p.id}
            className={`ai-chip${prompt === p.id ? " on" : ""}`}
            onClick={() => setPrompt(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ai-guide-bubble" aria-live="polite">
        {thinking ? (
          <div className="ai-thinking" aria-hidden>
            <span /><span /><span />
          </div>
        ) : (
          <p className="ai-guide-text">
            {text}
            {!done && <span className="ai-caret" aria-hidden />}
          </p>
        )}
      </div>
    </section>
  );
}
