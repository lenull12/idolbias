export type GemPackage = {
  id: string;
  priceId: string;
  amountEur: number;
  gems: number;
  bonusPercent: number;
  featured?: boolean;
};

// Les priceId sont des placeholders. Crée un produit "Gems" dans le Dashboard Stripe
// avec 6 prix (2, 5, 10, 20, 50, 100€), puis remplace les price_xxx ici.
// Pour tester en local : stripe listen --forward-to localhost:8788/api/webhooks/stripe
// → copie le whsec_... dans .dev.vars. Le sk_test_... est dans le Dashboard Stripe.
export const GEM_PACKAGES: GemPackage[] = [
  { id: "gems_2",   priceId: "price_1Tsn05CvcvCTYligXF2bkvvU", amountEur: 199,   gems: 200,   bonusPercent: 0 },
  { id: "gems_5",   priceId: "price_1Tsn0KCvcvCTYligJKHKX9C3", amountEur: 499,   gems: 550,   bonusPercent: 10 },
  { id: "gems_10",  priceId: "price_1Tsn0cCvcvCTYligaRDgWeRR", amountEur: 999,   gems: 1200,  bonusPercent: 20, featured: true },
  { id: "gems_20",  priceId: "price_1Tsn0zCvcvCTYligMFKCFWwR", amountEur: 1999,  gems: 2500,  bonusPercent: 25 },
  { id: "gems_50",  priceId: "price_1TsnGNCvcvCTYligH7Lkm0ZC", amountEur: 4999,  gems: 6500,  bonusPercent: 30 },
  { id: "gems_100", priceId: "price_1TsnIACvcvCTYlig7CBRAaTd", amountEur: 9999,  gems: 14000, bonusPercent: 40 },
];

export function getGemPackage(id: string): GemPackage | undefined {
  return GEM_PACKAGES.find((p) => p.id === id);
}

export function formatGemsPrice(amountEur: number): string {
  return (amountEur / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}
