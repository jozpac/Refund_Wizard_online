/**
 * Map product names to their short names
 * For WP orders (before July 8th, 2025), use price-based mapping with WooCommerce name override
 * For GHL orders, use description-based mapping
 */
export function getProductName(productName: string, price?: number, dataSource?: string, wooCommerceLineName?: string): string {
  // For WP orders, use price-based mapping with special handling for $197 products
  if (dataSource === 'woocommerce' && price !== undefined) {
    // Special case: $197 can be either "Income Stream Bundle" or "7-Figure Launchpad" 
    // Check if original productName contains "Income Stream Bundle"
    if (price === 197) {
      if (productName.toLowerCase().includes('income stream bundle')) {
        return "Income Stream Bundle";
      }
      // Default to 7-Figure Launchpad for other $197 products
      return "7-Figure Launchpad";
    }
    
    const priceMapping: { [key: number]: string } = {
      27: "Fast-Start",
      47: "Endless Video Ideas", 
      74: "Fast-Start + Endless Video Ideas", // Single Stripe transaction for both products
      97: "Channel Brand Kit",
      147: "7-Figure Launchpad",
      297: "7-Figure Launchpad + The $10k Launch Formula"
    };
    
    if (priceMapping[price]) {
      return priceMapping[price];
    }
  }
  const names: { [key: string]: string } = {
    // copy-paste channel
    "Copy Paste Channel ($695 option)": "Copy-paste",
    "Copy Paste Channel ($995 option)": "Copy-paste",

    // fast start
    "Faceless Income 5-day Fast Start": "Fast-Start",
    // GHL case: Stripe
    "Faceless Income 5-day Fast Start ($27)": "Fast-Start",

    // GHL case: Stripe handles Fast-Start + Bump Up as one transaction
    "Faceless Income 5-day Fast Start ($27) + Endless Video Ideas System ($47)":
      "Fast-Start + Endless Video Ideas",

    // endless video ideas
    "Endless Video Ideas System ($47)": "Endless Video Ideas",
    "Endless Video Ideas System": "Endless Video Ideas",

    // launchpad
    "7-Figure Launchpad": "7-Figure Launchpad",
    "7-Figure Launchpad Discounted": "7-Figure Launchpad",
    // TO DO: Should we show in UI that this is discounted variant?
    "Fast-Start - 7-Figure Launchpad Discounted": "7-Figure Launchpad",
    "7-Figure Launchpad + The $10k Launch Formula":
      "7-Figure Launchpad + The $10k Launch Formula",
    // GHL case: Stripe
    "7-Figure Launchpad ($197)": "7-Figure Launchpad",
    "7-Figure Launchpad + The $10k Launch Formula ($297)":
      "7-Figure Launchpad + The $10k Launch Formula",
    "Fast-Start - 7-Figure Launchpad Discounted  ($147)": "7-Figure Launchpad",

    // income stream bundle
    "Fast-start - Income Stream Bundle": "Income Stream Bundle",
    "Income Stream Bundle": "Income Stream Bundle",
    "Income Stream Bundle (2x)": "Income Stream Bundle",
    // GHL case: Stripe
    "Fast-start - Income Stream Bundle ($197)": "Income Stream Bundle",

    // channel brand kit
    // Check and unify namings
    "Fast-start - The Faceless Brand Kit": "Channel Brand Kit",
    "Channel Brand Kit": "Channel Brand Kit",
    // GHL case: Stripe
    "Fast-start - The Faceless Brand Kit ($97)": "Channel Brand Kit",

    // channel brand kit
    "AI Virality Bot": "AI Virality Bot",
    
    // Handle Stripe generic descriptions that don't match actual products
    "Subscription creation": "7-Figure Launchpad", // $147 transaction, maps to 7-Figure Launchpad
  };

  // Check for exact matches first
  if (names[productName]) {
    return names[productName];
  }

  // Since we now cover all possible product names in the exact mapping above,
  // we don't need partial matching. Just return the original product name if no exact match.
  return productName;
}

/**
 * Get Product ID from product name
 */
export function getProductId(productName: string) {
  switch (getProductName(productName)) {
    case "Fast-Start":
      return 0;
    case "Endless Video Ideas":
      return 1;
    case "Copy-paste":
      return 2;
    case "7-Figure Launchpad":
    case "7-Figure Launchpad + The $10k Launch Formula":
      return 3;
    case "Income Stream Bundle":
      return 4;
    case "Channel Brand Kit":
      return 5;
    case "AI Virality Bot":
      return 6;
  }
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function isWithinDaysPeriod(
  numberOfDays: number,
  purchaseDateString: string,
) {
  const inputDate = new Date(purchaseDateString);

  const now = new Date();
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds(),
  );

  const diffInMilliseconds = nowUTC - inputDate.getTime();

  return (
    diffInMilliseconds > 0 &&
    diffInMilliseconds < numberOfDays * DAY_IN_MILLISECONDS
  );
}

export function isWithin24HCooloffPeriod(purchaseDateString: string) {
  return isWithinDaysPeriod(1, purchaseDateString);
}

export function isWithin14DaysRefundPeriod(purchaseDateString: string) {
  return isWithinDaysPeriod(14, purchaseDateString);
}

export function isEligibleForMoneybackGuarantee(purchaseDateString: string) {
  return isWithinDaysPeriod(365, purchaseDateString);
}

export function getProductRefundabilityStatus(
  productName: string,
  purchaseDate: string,
): boolean {
  switch (getProductId(productName)) {
    // Endless Video Ideas - 24 Hours
    case 1:
      return isWithin24HCooloffPeriod(purchaseDate);
    // 7-Figure Launchpad - 14 Days
    case 3:
      return isWithin14DaysRefundPeriod(purchaseDate);
    // Fast-Start, Copy-paste, Income Stream Bundle, Channel Brand Kit - 365 Days
    case 0:
    case 2:
    case 4:
    case 5:
      return isEligibleForMoneybackGuarantee(purchaseDate);
    // AI Virality Bot - Non-refundable
    case 6:
      return false;
    default:
      return true;
  }
}

/**
 * Map product names to their descriptions
 */
export function getProductDescription(productName: string): string {
  const descriptions: { [key: string]: string } = {
    // fast start
    "Faceless Income 5-day Fast Start":
      "Launch your first faceless YouTube channel in 5 days — no skills, no guesswork.",
    // GHL case: Stripe
    "Faceless Income 5-day Fast Start ($27)":
      "Launch your first faceless YouTube channel in 5 days — no skills, no guesswork.",
    // Mapped Name
    "Fast-Start": "Launch your first faceless YouTube channel in 5 days — no skills, no guesswork.",

    // GHL case: Stripe handles Fast-Start + Bump Up as one transaction
    "Faceless Income 5-day Fast Start ($27) + Endless Video Ideas System ($47)":
      "Launch your first faceless YouTube channel in 5 days — no skills, no guesswork + Save yourself time and generate unique video ideas for your channel in just 10 minutes.",

    // endless video ideas
    "Endless Video Ideas System":
      "Save yourself time and generate unique video ideas for your channel in just 10 minutes.",
    // GHL case: Stripe
    "Endless Video Ideas System ($47)":
      "Save yourself time and generate unique video ideas for your channel in just 10 minutes.",

    // launchpad
    "7-Figure Launchpad":
      "Go viral and earn faster using Jake's plug-and-play templates and proven video formulas.",
    "7-Figure Launchpad Discounted":
      "Go viral and earn faster using Jake's plug-and-play templates and proven video formulas.",
    "7-Figure Launchpad + The $10k Launch Formula":
      "Go viral and earn faster using Jake's plug-and-play templates and proven video formulas.",
    // GHL case: Stripe
    "7-Figure Launchpad ($197)":
      "Go viral and earn faster using Jake's plug-and-play templates and proven video formulas.",
    "7-Figure Launchpad + The $10k Launch Formula ($297)":
      "Go viral and earn faster using Jake's plug-and-play templates and proven video formulas.",
    "Fast-Start - 7-Figure Launchpad Discounted  ($147)":
      "Go viral and earn faster using Jake's plug-and-play templates and proven video formulas.",

    // income stream bundle
    "Income Stream Bundle":
      "Multiply your income with sponsors, affiliates, and monetization layers most creators miss.",
    "Income Stream Bundle (2x)":
      "Multiply your income with sponsors, affiliates, and monetization layers most creators miss.",
    // GHL case: Stripe
    "Fast-start - Income Stream Bundle ($197)":
      "Multiply your income with sponsors, affiliates, and monetization layers most creators miss.",

    // channel brand kit
    "Channel Brand Kit":
      "Attract high-paying sponsors by branding your channel like a professional.",
    // GHL case: Stripe
    "Fast-start - The Faceless Brand Kit ($97)":
      "Attract high-paying sponsors by branding your channel like a professional.",

    // Virality AI
    "AI Virality Bot":
      "Generate viral video ideas and optimize your channel for maximum growth with the power of AI.",

    // copy-paste channel
    "Copy Paste Channel ($695 option)":
      "Earn full-time income by launching a faceless channel with Jake’s proven idea, templates, and team.",
    "Copy Paste Channel ($995 option)":
      "Earn full-time income by launching a faceless channel with Jake’s proven idea, templates, and team.",
  };

  // Check for exact matches only - no partial matching to avoid conflicts
  if (descriptions[productName]) {
    return descriptions[productName];
  }

  // Fallback to a default description
  return "Unlock proven strategies and tools to accelerate your YouTube success with this comprehensive digital product.";
}

// Define benefits based on product
export const getProductBenefits = (productName: string) => {
  const benefits: { [key: string]: string[] } = {
    // fast start
    "Fast-Start": [
      "You’ve already unlocked the only shortcut that turns a simple YouTube channel idea into full-time faceless income — including Jake’s step-by-step guide, proven niche formulas, and a plug-and-play system for getting views and getting paid… without showing your face or learning how to edit – it’s all just sitting there waiting to be used and earn you money…",
      "You now have the same 5-step system that allowed Jake to turn 1 faceless channel into a multi-million dollar asset that generates cashflow to this day on autopilot — and it’s already broken down for you in plain steps, so you can skip the guesswork, tech overwhelm, and wasted months trying to figure it out yourself.",
      "What you’re sitting on is what most people are still desperately looking for – the same roadmap that’s helped dozens of beginners build income-generating faceless channels from scratch — and the only thing left to do is follow it. You’re already one decision in… don’t quit before the second one pays off. All you have to do is press “start” and not give up before you try it…",
    ],
    
    "Faceless Income 5-day Fast Start": [
      "You've already unlocked the only shortcut that turns a simple YouTube channel idea into full-time faceless income — including Jake's step-by-step guide, proven niche formulas, and a plug-and-play system for getting views and getting paid… without showing your face or learning how to edit – it's all just sitting there waiting to be used and earn you money…",
      "You now have the same 5-step system that allowed Jake to turn 1 faceless channel into a multi-million dollar asset that generates cashflow to this day on autopilot — and it's already broken down for you in plain steps, so you can skip the guesswork, tech overwhelm, and wasted months trying to figure it out yourself.",
      "What you're sitting on is what most people are still desperately looking for – the same roadmap that's helped dozens of beginners build income-generating faceless channels from scratch — and the only thing left to do is follow it. You're already one decision in… don't quit before the second one pays off. All you have to do is press 'start' and not give up before you try it…",
    ],

    // endless video ideas
    "Endless Video Ideas": [
      "Never run out of high-performing content ideas that attract views",
      "Proprietary formula for creating videos that both viewers and the algorithm love",
      "Freedom from the creative struggle that stops most creators",
    ],

    "Fast-Start + Endless Video Ideas": [
      "You’ve already unlocked the only shortcut that turns a simple YouTube channel idea into full-time faceless income — including Jake’s step-by-step guide, proven niche formulas, and a plug-and-play system for getting views and getting paid… without showing your face or learning how to edit – it’s all just sitting there waiting to be used and earn you money…",
      "You now have the same 5-step system that allowed Jake to turn 1 faceless channel into a multi-million dollar asset that generates cashflow to this day on autopilot — and it’s already broken down for you in plain steps, so you can skip the guesswork, tech overwhelm, and wasted months trying to figure it out yourself.",
      "What you’re sitting on is what most people are still desperately looking for – the same roadmap that’s helped dozens of beginners build income-generating faceless channels from scratch — and the only thing left to do is follow it. You’re already one decision in… don’t quit before the second one pays off. All you have to do is press “start” and not give up before you try it…",
      "Never run out of high-performing content ideas that attract views",
      "Proprietary formula for creating videos that both viewers and the algorithm love",
      "Freedom from the creative struggle that stops most creators",
    ],

    // launchpad
    "7-Figure Launchpad": [
      "You already have access to the 7-Figure Launchpad — the exact virality formula Jake used to build multi-million dollar channels from day 0 — and now it’s yours to copy, fill in, and go viral and earn more without spending years testing what works…",
      "You now own the same viral video triggers, hook templates, and fill-in-the-blank formulas Jake’s top students used to hit 10k–50k+ views on their first uploads — which means you’re able to skip the “luck” other creators are waiting for…",
      "You’ve unlocked a fast track most people would kill for — no guessing what works, no wasting time and money on videos that flop — just a plug-and-play system to publish with certainty and make YouTube pay you back more and faster…",
    ],
    "7-Figure Launchpad + The $10k Launch Formula": [
      "You already have access to the 7-Figure Launchpad — the exact virality formula Jake used to build multi-million dollar channels from day 0 — and now it’s yours to copy, fill in, and go viral and earn more without spending years testing what works…",
      "You now own the same viral video triggers, hook templates, and fill-in-the-blank formulas Jake’s top students used to hit 10k–50k+ views on their first uploads — which means you’re able to skip the “luck” other creators are waiting for…",
      "You’ve unlocked a fast track most people would kill for — no guessing what works, no wasting time and money on videos that flop — just a plug-and-play system to publish with certainty and make YouTube pay you back more and faster…",
    ],

    // income stream bundle
    "Income Stream Bundle": [
      "You already unlocked the Income Stream Bundle — the exact framework Jake used to 10x the money he made from the same videos — with sponsors, affiliates, and hidden monetization layers that most creators never even hear about…",
      "You now have access to the actual contracts, price formulas, and vetted sponsor lists that helped students like Hoan or WIll lock in $5K brand deals before uploading a single video — meaning you can start profiting even before your channel gains traction.",
      "You’ve got the entire system to turn YouTube into a true multiple-income machine — so even if your ad revenue slows down, you’ll still have money flowing in from multiple angles while other channels struggle to survive on views alone…",
    ],

    // channel brand kit
    "Channel Brand Kit": [
      "You already have the exact Channel Brand Kit Jake used to attract $10k–$30k video sponsors — including the fonts, colors, music, and script tweaks that make his faceless channel feel like a premium brand – which makes sponsors pay more and choose your channel over other channels.",
      "You’ve unlocked the shortcut to making your channel look and feel like a 7-figure brand from Day 1 — the kind that makes sponsors reach out to you, even if you’re just starting out.",
      "While others guess and DIY their way through random thumbnails and random vibes, you’ve got a plug-and-play system that instantly installs emotional consistency across your channel and videos — so your viewers trust you more and sponsors pay you more.",
    ],

    // copy-paste channel
    "Copy Paste Channel ($695 option)": [
      "You already unlocked the only system designed to earn you extra full-time income using a profitable faceless channel — including your proven channel idea, templates for viral content, and a plug-and-play team of freelancers — it’s all just sitting there waiting to be used and earn you money…",
      "You now have the exact system that allows Jake to turn simple videos he didn’t even make into $20k—$35k+ automated cash machines. Plus, the “Earnings Activation” bonus which shows you how to make money from your first upload—no guesswork, waiting, additional investments, or tech skills needed…",
      "You’ve got what most people are still desperately looking for — a viral channel idea, the script template, the team to make the videos, and the profit system behind it — and all you have to do is press “start” and not give up before you try it…",
    ],
    "Copy Paste Channel ($995 option)": [
      "You already unlocked the only system designed to earn you extra full-time income using a profitable faceless channel — including your proven channel idea, templates for viral content, and a plug-and-play team of freelancers — it’s all just sitting there waiting to be used and earn you money…",
      "You now have the exact system that allows Jake to turn simple videos he didn’t even make into $20k—$35k+ automated cash machines. Plus, the “Earnings Activation” bonus which shows you how to make money from your first upload—no guesswork, waiting, additional investments, or tech skills needed…",
      "You’ve got what most people are still desperately looking for — a viral channel idea, the script template, the team to make the videos, and the profit system behind it — and all you have to do is press “start” and not give up before you try it…",
    ],
  };

  // Check for exact matches only - no partial matching to avoid conflicts
  if (benefits[productName]) {
    return benefits[productName];
  }

  // Fallback to generic benefits
  return [
    "Transform your YouTube presence with proven strategies",
    "Exclusive tools and resources to accelerate your results", 
    "Long-term support on your journey to YouTube success",
  ];
};
