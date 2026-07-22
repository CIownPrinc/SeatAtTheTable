export interface ParodyCityReference {
  name: string;
  realWorldReference: string;
  usage: string;
}

// LEGAL: In-universe city references for parody naming. Keep these names fictional:
// LEGAL: San Plastica points at Bay Area / Northern California tech-and-real-estate culture,
// LEGAL: Rentport points at New York finance/rent pressure, and Flamingo Bay points at Miami.
export const parodyCityReferences: ParodyCityReference[] = [
  {
    name:'San Plastica',
    realWorldReference:'Bay Area / Northern California cities',
    usage:'Use for tech money, venture capital, expensive housing, startup culture, and glossy West Coast brands.',
  },
  {
    name:'Rentport',
    realWorldReference:'New York City',
    usage:'Use for finance, rent pressure, dense city institutions, old money, tabloids, and East Coast corporate power.',
  },
  {
    name:'Flamingo Bay',
    realWorldReference:'Miami',
    usage:'Use for nightlife, waterfront luxury, offshore cash, beach real estate, and flashy heat.',
  },
];
