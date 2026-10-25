/**
 * Curated, sourced support listings.
 * Rules: real programmes only, official source link on every listing, a last-checked date,
 * and a deadline ONLY when it has been verified (none are listed yet, so none are shown).
 * Re-check each entry before every release and update `chk`. Remove anything that cannot be confirmed.
 */
export const OPPS = [
  { id: 'seda-incubation', n: 'Seda and SEDFA incubation centres', type: 'Incubation', stage: 'Any', loc: 'National',
    what: 'Incubators hosted across the country offer shared space, infrastructure and shared services, plus networking.',
    elig: 'Anyone with a viable business idea, or a registered small business. Each incubator runs its own intake, so ask your nearest branch.',
    chk: '25 Oct 2026', dl: null, src: 'seda.org.za', url: 'https://www.seda.org.za',
    note: 'Seda merged into the Small Enterprise Development and Finance Agency (SEDFA) on 1 October 2024. The Seda site and branches were still taking applications at the last check.' },
  { id: 'seda-advice', n: 'Seda branch business advice and registration', type: 'Mentorship', stage: 'Any', loc: 'National',
    what: 'Free business advice and information, small-business training and help registering your business.',
    elig: 'Open to aspiring and existing small business owners. Walk in at a branch or apply online.',
    chk: '25 Oct 2026', dl: null, src: 'seda.org.za', url: 'https://www.seda.org.za' },
  { id: 'nyda-grant', n: 'NYDA Grant Programme', type: 'Grants', stage: 'Any', loc: 'National',
    what: 'Non-repayable grants from the National Youth Development Agency, with mentorship and training alongside.',
    elig: 'South African citizens aged 18 to 35 with a youth-owned business. Amounts and rules differ by tier, and training is usually required first, so read the current criteria.',
    chk: '25 Oct 2026', dl: null, src: 'nyda.gov.za', url: 'https://www.nyda.gov.za' },
  { id: 'nyda-voucher', n: 'NYDA Voucher Programme', type: 'In-kind', stage: 'Any', loc: 'National',
    what: 'Vouchers for business services such as registration, branding or bookkeeping, instead of cash.',
    elig: 'Young entrepreneurs registered with the NYDA. Check the current voucher round and its criteria on the official site.',
    chk: '25 Oct 2026', dl: null, src: 'nyda.gov.za', url: 'https://www.nyda.gov.za' },
  { id: 'sedfa-finance', n: 'SEDFA small-business finance (formerly sefa)', type: 'Loans', stage: 'Operating', loc: 'National',
    what: 'Loans for small businesses. This is borrowed money: it must be repaid with interest.',
    elig: 'Established small businesses with a business plan. Registration and supporting documents are normally required.',
    chk: '25 Oct 2026', dl: null, src: 'sedfa.org.za', url: 'https://www.sedfa.org.za', repay: true,
    note: 'sefa merged into SEDFA on 1 October 2024. Confirm current products on the official site.' }
];
export const OPP_TYPES = ['All', 'Incubation', 'Mentorship', 'Grants', 'Loans', 'In-kind'];
export const OPP_LOCS = ['Any', 'National', 'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'];
