import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

const categories = [
  ["grinders", "Grinders", "Hand and electric coffee grinders", 1],
  ["brewers", "Brewers", "Pour-over, immersion and espresso", 2],
  ["kettles", "Kettles", "Temperature-controlled and stovetop kettles", 3],
  ["scales", "Scales", "Precision coffee scales and timers", 4],
  ["accessories", "Accessories", "Filters, brushes, storage and the rest", 5],
] as const;

type Seed = {
  slug: string;
  name: string;
  description: string;
  price: number; // cents
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  stock: number;
  image: string | null;
  tags: string;
  daysAgo: number;
};

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=70`;

const products: Seed[] = [
  {
    slug: "tare-k2-hand-grinder",
    name: "Tare K2 Hand Grinder",
    description:
      "Stainless conical burrs with 40 clicks of adjustment. Goes from filter to espresso on one device. One-piece aluminium body that will not rattle apart in a bag.",
    price: 14900,
    category: "grinders",
    brand: "Tare",
    rating: 4.7,
    reviews: 214,
    stock: 18,
    image: img("photo-1521302200778-33500795e128"),
    tags: "hand,conical,travel",
    daysAgo: 12,
  },
  {
    slug: "tare-e1-electric-grinder",
    name: "Tare E1 Electric Grinder",
    description:
      "64 mm flat burrs, stepless adjustment. Capped at 1400 rpm so it stays quiet enough for early mornings.",
    price: 38900,
    category: "grinders",
    brand: "Tare",
    rating: 4.5,
    reviews: 96,
    stock: 6,
    image: img("photo-1610889556528-9a770e32642f"),
    tags: "electric,flat-burr",
    daysAgo: 40,
  },
  {
    slug: "midpoint-compact-grinder",
    name: "Midpoint Compact Grinder",
    description: "Budget entry-level hand grinder with ceramic burrs.",
    price: 4600,
    category: "grinders",
    brand: "Midpoint",
    rating: 3.9,
    reviews: 431,
    stock: 52,
    image: img("photo-1587734195503-904fca47e0e9"),
    tags: "hand,ceramic,budget",
    daysAgo: 120,
  },
  {
    slug: "conical-dripper-02",
    name: "Conical Ceramic Dripper 02",
    description:
      "The classic cone. Holds heat well and slows the temperature drop. Brews up to two cups.",
    price: 2200,
    category: "brewers",
    brand: "Hakone",
    rating: 4.8,
    reviews: 1203,
    stock: 74,
    image: img("photo-1544787219-7f47ccb76574"),
    tags: "pour-over,ceramic",
    daysAgo: 200,
  },
  {
    slug: "hourglass-brewer-6-cup",
    name: "Hourglass Brewer, 6 Cup",
    description:
      "Borosilicate glass with a wood collar. The thick filter gives you a notably clean cup.",
    price: 7200,
    category: "brewers",
    brand: "Hourglass",
    rating: 4.6,
    reviews: 587,
    stock: 21,
    image: img("photo-1495474472287-4d71bcdd2085"),
    tags: "pour-over,glass,entertaining",
    daysAgo: 88,
  },
  {
    slug: "steel-french-press-1l",
    name: "Steel French Press 1L",
    description:
      "Double-walled, holds heat for 90 minutes. Dishwasher safe, unlike most of them.",
    price: 5000,
    category: "brewers",
    brand: "Midpoint",
    rating: 4.2,
    reviews: 310,
    stock: 0,
    image: img("photo-1461023058943-07fcbe16d735"),
    tags: "immersion,steel",
    daysAgo: 300,
  },
  {
    slug: "manual-espresso-press",
    name: "Manual Espresso Press",
    description:
      "Nine bars without electricity. Built for espresso on a campsite or a desk with no outlet.",
    price: 9300,
    category: "brewers",
    brand: "Tare",
    rating: 4.4,
    reviews: 78,
    stock: 9,
    image: img("photo-1510707577719-ae7c14805e3a"),
    tags: "espresso,manual,travel",
    daysAgo: 5,
  },
  {
    slug: "variable-temp-kettle-1l",
    name: "Variable Temperature Kettle 1L",
    description:
      "Single-degree control from 104 to 212 F. Gooseneck spout with genuinely fine flow control.",
    price: 11400,
    category: "kettles",
    brand: "Tare",
    rating: 4.9,
    reviews: 402,
    stock: 33,
    image: img("photo-1517668808822-9ebb02f2a0e6"),
    tags: "gooseneck,temp-control",
    daysAgo: 22,
  },
  {
    slug: "classic-gooseneck-kettle",
    name: "Classic Gooseneck Kettle",
    description: "Stovetop stainless steel. No thermometer, no display, no firmware.",
    price: 3900,
    category: "kettles",
    brand: "Midpoint",
    rating: 4.1,
    reviews: 156,
    stock: 41,
    image: img("photo-1594213114663-d94db9b17125"),
    tags: "stovetop,steel",
    daysAgo: 150,
  },
  {
    slug: "coffee-scale-pro",
    name: "Coffee Scale Pro",
    description:
      "0.1 g resolution, built-in timer, automatic flow-rate readout. Charges over USB-C.",
    price: 8200,
    category: "scales",
    brand: "Tare",
    rating: 4.6,
    reviews: 289,
    stock: 27,
    image: img("photo-1516224498413-84ecf3a1e7fd"),
    tags: "precision,timer,usb-c",
    daysAgo: 30,
  },
  {
    slug: "pocket-scale-mini",
    name: "Pocket Scale Mini",
    description: "0.5 g resolution. Takes up no room in a travel kit.",
    price: 2000,
    category: "scales",
    brand: "Midpoint",
    rating: 3.6,
    reviews: 512,
    stock: 88,
    image: null,
    tags: "travel,budget",
    daysAgo: 260,
  },
  {
    slug: "paper-filters-100",
    name: "Paper Filters, 100 Pack",
    description: "Unbleached, sized for the 02 conical dripper.",
    price: 600,
    category: "accessories",
    brand: "Hakone",
    rating: 4.5,
    reviews: 940,
    stock: 240,
    image: img("photo-1509042239860-f550ce710b93"),
    tags: "consumable,filter",
    daysAgo: 400,
  },
  {
    slug: "burr-cleaning-brush",
    name: "Burr Cleaning Brush",
    description:
      "Natural bristle, wooden handle. Thin enough to reach into the burr chamber.",
    price: 900,
    category: "accessories",
    brand: "Tare",
    rating: 4.3,
    reviews: 121,
    stock: 130,
    image: img("photo-1442512595331-e89e73853f31"),
    tags: "maintenance,brush",
    daysAgo: 75,
  },
  {
    slug: "vacuum-storage-canister-500g",
    name: "Vacuum Storage Canister 500 g",
    description:
      "A one-way valve lets carbon dioxide out without letting oxygen in, which buys you about a week of freshness.",
    price: 3300,
    category: "accessories",
    brand: "Tare",
    rating: 4.7,
    reviews: 203,
    stock: 46,
    image: img("photo-1447933601403-0c6688de566e"),
    tags: "storage,valve",
    daysAgo: 18,
  },
  {
    slug: "tare-k6-hand-grinder-max",
    name: "Tare K6 Hand Grinder Max",
    description:
      "84 mm titanium-coated conical burrs and a magnetic catch cup. The one for people who grind for a full household.",
    price: 19900,
    category: "grinders",
    brand: "Tare",
    rating: 4.8,
    reviews: 63,
    stock: 14,
    image: img("photo-1610889556528-9a770e32642f"),
    tags: "hand,conical,titanium",
    daysAgo: 3,
  },
  {
    slug: "titan-espresso-grinder",
    name: "Titan Espresso Grinder",
    description:
      "83 mm flat burrs tuned for espresso, single-dose hopper, near-zero retention. Dials in without the mess.",
    price: 54900,
    category: "grinders",
    brand: "Atelier",
    rating: 4.7,
    reviews: 41,
    stock: 5,
    image: img("photo-1587734195503-904fca47e0e9"),
    tags: "electric,espresso,single-dose",
    daysAgo: 9,
  },
  {
    slug: "cloud-pourover-set",
    name: "Cloud Pour-Over Set",
    description:
      "Dripper, glass carafe and a wooden stand in one box. A complete pour-over station out of the wrapper.",
    price: 8800,
    category: "brewers",
    brand: "Hourglass",
    rating: 4.6,
    reviews: 174,
    stock: 29,
    image: img("photo-1495474472287-4d71bcdd2085"),
    tags: "pour-over,set,gift",
    daysAgo: 15,
  },
  {
    slug: "siphon-vacuum-brewer",
    name: "Siphon Vacuum Brewer",
    description:
      "Vapour-pressure brewing with a theatrical show. Full immersion, then a vacuum draw for a clean, bright cup.",
    price: 12600,
    category: "brewers",
    brand: "Hakone",
    rating: 4.4,
    reviews: 58,
    stock: 11,
    image: img("photo-1510707577719-ae7c14805e3a"),
    tags: "siphon,immersion,glass",
    daysAgo: 27,
  },
  {
    slug: "aeropress-go-travel",
    name: "Aero Go Travel Press",
    description:
      "Full-immersion press that packs into its own mug. Weighs nothing, survives a backpack.",
    price: 4200,
    category: "brewers",
    brand: "Midpoint",
    rating: 4.5,
    reviews: 803,
    stock: 61,
    image: img("photo-1544787219-7f47ccb76574"),
    tags: "immersion,travel,budget",
    daysAgo: 6,
  },
  {
    slug: "copper-stovetop-kettle",
    name: "Copper Stovetop Kettle",
    description:
      "Hammered copper body with a gooseneck spout. Heats fast and looks the part on any hob.",
    price: 8900,
    category: "kettles",
    brand: "Atelier",
    rating: 4.3,
    reviews: 47,
    stock: 17,
    image: img("photo-1594213114663-d94db9b17125"),
    tags: "stovetop,copper,gooseneck",
    daysAgo: 52,
  },
  {
    slug: "smart-gooseneck-kettle-pro",
    name: "Smart Gooseneck Kettle Pro",
    description:
      "App-connected temperature holds, pour-timer and four brew presets. For the mornings you want it decided already.",
    price: 15900,
    category: "kettles",
    brand: "Tare",
    rating: 4.6,
    reviews: 119,
    stock: 23,
    image: img("photo-1517668808822-9ebb02f2a0e6"),
    tags: "gooseneck,smart,temp-control",
    daysAgo: 4,
  },
  {
    slug: "studio-coffee-scale",
    name: "Studio Coffee Scale",
    description:
      "0.1 g resolution on a wide platform that fits any dripper or portafilter dosing cup. Auto-tare and a bright timer.",
    price: 9900,
    category: "scales",
    brand: "Tare",
    rating: 4.7,
    reviews: 156,
    stock: 34,
    image: img("photo-1516224498413-84ecf3a1e7fd"),
    tags: "precision,timer,auto-tare",
    daysAgo: 11,
  },
  {
    slug: "reusable-cloth-filters-3",
    name: "Reusable Cloth Filters, 3 Pack",
    description:
      "Organic cotton filters for the conical dripper. Rinse, dry, reuse — a year of brewing per set.",
    price: 1400,
    category: "accessories",
    brand: "Hakone",
    rating: 4.2,
    reviews: 267,
    stock: 175,
    image: img("photo-1509042239860-f550ce710b93"),
    tags: "consumable,filter,reusable",
    daysAgo: 33,
  },
  {
    slug: "knock-box-compact",
    name: "Knock Box Compact",
    description:
      "A padded bar for knocking out spent pucks, in a footprint that fits a crowded counter.",
    price: 3100,
    category: "accessories",
    brand: "Midpoint",
    rating: 4.4,
    reviews: 92,
    stock: 58,
    image: img("photo-1442512595331-e89e73853f31"),
    tags: "espresso,cleanup",
    daysAgo: 64,
  },
  {
    slug: "distribution-tool-58mm",
    name: "Distribution Tool 58 mm",
    description:
      "Levels and evens the grounds before you tamp, for a more consistent extraction. Adjustable depth.",
    price: 4700,
    category: "accessories",
    brand: "Atelier",
    rating: 4.5,
    reviews: 138,
    stock: 40,
    image: img("photo-1447933601403-0c6688de566e"),
    tags: "espresso,prep",
    daysAgo: 20,
  },
  {
    // Deliberate edge case: very long name, no image, zero stock, low rating,
    // highest price. Cards and the detail page have to carry all of this
    // without breaking. This is the row a visual regression test should watch.
    slug: "limited-run-hand-hammered-copper-plated-gooseneck-kettle-long-name-test",
    name: "Limited Run Hand-Hammered Copper-Plated Gooseneck Kettle (Numbered Series)",
    description:
      "Added on purpose as an edge case: long name, no image, zero stock, low rating. The interface has to render all of it without breaking.",
    price: 64900,
    category: "kettles",
    brand: "Atelier",
    rating: 2.8,
    reviews: 3,
    stock: 0,
    image: null,
    tags: "edge-case,limited",
    daysAgo: 1,
  },
];

async function main() {
  await client.execute("DELETE FROM cart_lines");
  await client.execute("DELETE FROM products");
  await client.execute("DELETE FROM categories");

  for (const [slug, name, description, order] of categories) {
    await client.execute({
      sql: "INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)",
      args: [slug, name, description, order],
    });
  }

  const now = Date.now();
  for (const p of products) {
    const createdAt = new Date(now - p.daysAgo * 86400000).toISOString();
    await client.execute({
      sql: `INSERT INTO products
              (slug, name, description, price, category_slug, brand,
               rating, review_count, stock, image_url, tags, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.slug, p.name, p.description, p.price, p.category, p.brand,
        p.rating, p.reviews, p.stock, p.image, p.tags, createdAt,
      ],
    });
  }

  console.log(
    `Seeded ${categories.length} categories and ${products.length} products → ${url}`
  );
}

main();
