# Plan: Rewrite ReactPad as Tezforge — Builder-Centric Web3 Forge on Tezos

## Goal

Rewrite the existing ReactPad launchpad project into **Tezforge**, an industrial-grade, builder-focused platform on Tezos/Etherlink. The app provides the tools, infrastructure, and capital formation layer required to launch and grow onchain projects — from fundraising and token launches to token creation, NFT deployment, liquidity locking, airdrop distribution, and staking.

All existing pages, routes, components, hooks, and contract integrations are **repurposed** — the architecture, layout, and design system stay the same, but every page is rewritten with Tezforge copy, branding, token references, and ecosystem alignment.

## Tasks

- [x] **1. Design System & Branding** — Updated `index.html` (title, meta, favicon), `tailwind.config.js` (tezforge color palette), `index.css` (animations, bg color).

- [x] **2. Config & Contract Layer** — Updated `src/config/index.ts` (barrel exports), `src/config/abis/contracts.ts` (chain config, helpers, exports), `src/config/presale-metadata.ts` (social links), `src/components/Providers.tsx` (Etherlink mainnet).

- [x] **3. Home Page** — Rewritten with Tezforge branding: hero, stats, how-it-works, featured launches, CTA, footer.

- [x] **4. App Layout & Sidebar** — Rewritten with Tezforge branding, logo, colors, and navigation labels.

- [x] **5. Projects Landing (`/projects`)** — Rewritten with Tezforge branding.

- [x] **6. Project Detail (`/projects/:id`)** — Rewritten with Tezforge branding, updated copy, and Tezos ecosystem language.

- [x] **7. NFTs Pages** — Rewritten `src/pages/nfts/page.tsx` and `src/pages/nfts/[id]/page.tsx`.

- [x] **8. Dashboard Hub (`/dashboard/create`)** — Rewritten with Tezforge branding.

- [x] **9. Create Token (`/dashboard/create/token`)** — Rewritten with Tezforge branding, XTZ references.

- [x] **10. Create Presale (`/dashboard/create/presale`)** — Updated with Tezforge branding and styling.

- [x] **11. Create NFT (`/dashboard/create/nft`)** — Rewritten with Tezforge branding.

- [x] **12. Create Project (`/dashboard/create/project`)** — Rewritten with Tezforge branding.

- [x] **13. User Dashboard (`/dashboard/user`)** — Rewritten with Tezforge branding.

- [x] **14. Presales List & Manage** — Rewritten with Tezforge branding.

- [x] **15. Staking (`/dashboard/staking`)** — Updated with Tezforge branding.

- [x] **16. Token Locker (`/dashboard/tools/token-locker`)** — Updated with Tezforge branding.

- [x] **17. Airdrop (`/dashboard/tools/airdrop`)** — Updated with Tezforge branding, XTZ references.

- [x] **18. Lock Detail (`/locks/:id`)** — Updated with Tezforge branding.

- [x] **19. Admin Pages** — Updated with Tezforge branding.

- [x] **20. Hooks & Store Copy** — Updated `useReactPriceUsd` (XTZ/Coingecko), `useLaunchpadPresales` (XTZ refs), `usePresaleActions` (XTZ refs).

- [x] **21. UI Components** — Updated all base UI components (button, card, input, select, textarea, badge, sonner, dialog, badge, progress, nft-card, presale-card, project-card, swap-form, presale-participation-form) with Tezforge color palette.

## Assumptions

- The existing architecture (routing, component structure, hooks, contract ABIs) stays intact — only copy, branding, token names, and references change.
- The contract addresses in `contracts.ts` remain the same (Etherlink) — only the ecosystem name and descriptions change.
- The RainbowKit project ID is reused or replaced with a Tezforge-specific one.
- The color palette will shift from ReactPad's pink/cyan to a more Tezos-appropriate palette (keeping the bold blocky design style).
- The font will remain Albert Sans (or change to a Tezos-compatible font).

## Open Questions

1. Should the color palette change significantly (e.g., Tezos orange/teal) or stay close to the current bold blocky style?
2. What is the Tezforge logo asset URL? (Currently using ReactPad's Cloudinary logo)
3. What are the correct Tezforge social links (X/Twitter, Telegram, docs)?
4. RainbowKit project ID — reuse or create new?
5. Which Tezos/Etherlink chain ID should be used? (Etherlink mainnet or testnet)

## Out of scope

- No changes to contract ABIs, hook logic, or data fetching patterns
- No new features or pages beyond what exists
- No restructuring of the codebase or file organization
- No migration to a different framework or build tool