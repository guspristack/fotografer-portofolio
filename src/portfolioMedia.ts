import portrait from './images/portrait-arka.webp';

export type SocialLink = { platform: 'instagram' | 'linkedin' | 'flickr'; url?: string };
export type PortfolioMedia = { portrait: string; socials: readonly SocialLink[] };

export const portfolioMedia = {
  arka: { portrait, socials: [{ platform: 'instagram' }, { platform: 'linkedin' }, { platform: 'flickr' }] },
} satisfies Record<string, PortfolioMedia>;
