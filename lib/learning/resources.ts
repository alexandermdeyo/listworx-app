/**
 * ListWorx Learning Center starter library. "free" resources are public;
 * "growth" resources require a verified Growth or Business Pro membership and
 * are served only through /api/learning/[slug]. Starter content, written to be
 * practical; no certifications or credentials are claimed.
 */

export type ResourceSection = { heading: string; paragraphs?: string[]; bullets?: string[] };
export type LearningResource = {
  slug: string;
  title: string;
  audience: 'Homeowners' | 'Contractors' | 'Realtors' | 'Everyone';
  category: 'Hiring guide' | 'IronClad Standards' | 'Realtor resource' | 'Business manual' | 'Marketing and photography' | 'Templates';
  access: 'free' | 'growth';
  summary: string;
  sections: ResourceSection[];
};

export const LEARNING_RESOURCES: LearningResource[] = [
  {
    slug: 'how-to-hire-a-contractor',
    title: 'How to Hire a Contractor Without Getting Burned',
    audience: 'Homeowners',
    category: 'Hiring guide',
    access: 'free',
    summary: 'The questions to ask, the paperwork to see, and the red flags to walk away from.',
    sections: [
      { heading: 'Start with the paperwork', paragraphs: ['Before anyone sets foot in your house, ask for proof of insurance and, if your trade and county require it, a license number. Look the license up yourself on your state licensing board website. It takes two minutes.'] },
      {
        heading: 'Questions worth asking',
        bullets: [
          'Who will actually be doing the work, you or a crew?',
          'How long will it take, and what could push that back?',
          'What happens if you find something unexpected once the work starts?',
          'Is the price fixed, or an estimate that can change?',
          'How do you handle cleanup, and who hauls away debris?',
        ],
      },
      { heading: 'Get it in writing', paragraphs: ['A written estimate should list the scope, materials, price, payment schedule, and timeline. If it is vague, ask for detail. Vague estimates turn into arguments later.'] },
      {
        heading: 'Red flags',
        bullets: ['Asks for most of the money up front', 'Pressures you to decide today', 'Will not put anything in writing', 'Cannot show insurance', 'Only accepts cash with no receipt'],
      },
      { heading: 'How ListWorx helps', paragraphs: ['Every contractor ListWorx refers has been reviewed by our team and agreed to the IronClad Standards. We do not run background checks or guarantee the work, so still ask these questions. They protect you no matter who you hire.'] },
    ],
  },
  {
    slug: 'ironclad-standards-explained',
    title: 'IronClad Standards, Explained in Plain English',
    audience: 'Everyone',
    category: 'IronClad Standards',
    access: 'free',
    summary: 'What IronClad Verified means, what it does not mean, and how certification works.',
    sections: [
      { heading: 'Agreeing is not the same as certified', paragraphs: ['Every ListWorx contractor must accept the IronClad Standards before receiving referrals. That is a commitment, not an award. IronClad Certification is separate: it is awarded, and can be removed, only by ListWorx after review.'] },
      {
        heading: 'What ListWorx checks',
        bullets: [
          'Each contractor is reviewed by ListWorx before approval.',
          'Where a trade requires a license, we check it against state licensing records.',
          'Contractors upload insurance documents with expiration dates, and we review them.',
        ],
      },
      { heading: 'What it does not mean', bullets: ['ListWorx does not run criminal background checks.', 'We review insurance documents but do not confirm coverage directly with insurers.', 'We do not guarantee the quality of any job.'] },
      { heading: 'Money never buys placement', paragraphs: ['Network, Growth, and Business Pro members all receive equal referral consideration. Paying more never buys referral priority, approval, or certification.'] },
    ],
  },
  {
    slug: 'realtor-pre-listing-repairs',
    title: 'The Realtor’s Pre-Listing Repair Checklist',
    audience: 'Realtors',
    category: 'Realtor resource',
    access: 'free',
    summary: 'A practical walk-through list to spot the small fixes that cost buyers confidence.',
    sections: [
      {
        heading: 'Walk the house like a buyer',
        bullets: ['Doors that stick or do not latch', 'Dripping faucets and running toilets', 'Missing outlet covers and dead bulbs', 'Scuffed paint in hallways and entries', 'Loose handrails and cabinet hardware', 'Stained ceiling tiles that raise water questions'],
      },
      { heading: 'Outside first impressions', bullets: ['Gutters and downspouts clear and attached', 'Overgrown shrubs trimmed back from siding', 'Pressure-washed walks and driveway', 'Front door hardware and house numbers clean and visible'] },
      { heading: 'Send one request', paragraphs: ['Use one free ListWorx request per trade and your client chooses from up to three approved contractors. Your client’s information stays private until they reach out.'] },
    ],
  },
  {
    slug: 'getting-started-on-listworx',
    title: 'Getting Started on ListWorx',
    audience: 'Contractors',
    category: 'Business manual',
    access: 'free',
    summary: 'How referrals work, what to keep current, and how to get the most from your membership.',
    sections: [
      { heading: 'How a referral works', paragraphs: ['A homeowner or realtor sends a request. ListWorx shares up to three approved contractors for that trade and county, and the requestor chooses who to contact. You are notified when your contact information is shared. You will not see the requestor’s job details through ListWorx.'] },
      { heading: 'Keep your documents current', paragraphs: ['Upload insurance documents and any required licenses with expiration dates. Your dashboard warns you before they expire. Upload renewals early so there is no gap.'] },
      { heading: 'Make your profile work', bullets: ['Use a clear logo and real job photos', 'Write a short, specific bio', 'Add your website and Google reviews', 'Answer every call and message fast'] },
    ],
  },
  {
    slug: 'job-photos-that-win-work',
    title: 'Job Photos That Win Work: A Phone Photo Checklist',
    audience: 'Contractors',
    category: 'Marketing and photography',
    access: 'growth',
    summary: 'How to shoot before-and-after photos on a phone that look professional.',
    sections: [
      { heading: 'Before you shoot', bullets: ['Wipe your phone lens. A smudge ruins more photos than anything else.', 'Pick up tools, trash, and cords.', 'Turn on every light in the room, then open the blinds.'] },
      {
        heading: 'Taking the shot',
        bullets: [
          'Hold the phone at chest height and keep it level. Tilted walls look sloppy.',
          'Shoot from a corner to show the whole space.',
          'Take the before and after from the same spot. Mark it with tape if you have to.',
          'Take a few close-ups of the details you are proud of.',
          'Shoot horizontal for your website and profile, vertical for stories and reels.',
        ],
      },
      { heading: 'After you shoot', bullets: ['Pick your best five, not all fifty.', 'Straighten and brighten. Skip heavy filters.', 'Ask the homeowner before posting anything that shows their address or family.'] },
      { heading: 'When to bring in a pro', paragraphs: ['For your website, profile, and brand photos, ListWorx Media Services can shoot it for you. Growth members save 5% and Business Pro members save 10%.'] },
    ],
  },
  {
    slug: 'follow-up-and-review-templates',
    title: 'Estimate Follow-Up and Review Request Templates',
    audience: 'Contractors',
    category: 'Templates',
    access: 'growth',
    summary: 'Copy-and-paste messages for following up on estimates and asking for reviews.',
    sections: [
      { heading: 'Estimate follow-up (2 days later)', paragraphs: ['Hi [Name], this is [Your Name] with [Company]. Just checking in on the estimate for [project]. Happy to answer any questions or walk through options if the number needs to move. No pressure either way.'] },
      { heading: 'Estimate follow-up (1 week later)', paragraphs: ['Hi [Name], I wanted to follow up one more time on [project]. Our schedule is filling up for [month], so let me know if you would like to hold a spot. If you went another direction, no hard feelings. Thanks for considering us.'] },
      { heading: 'Review request (job finished)', paragraphs: ['Hi [Name], thanks again for trusting us with [project]. If you were happy with the work, would you mind leaving a quick review? It helps a small business like ours more than you would think. Here is the link: [review link].'] },
      { heading: 'Tips', bullets: ['Send review requests within 48 hours of finishing.', 'Make the link one tap.', 'Never offer anything in exchange for a review.'] },
    ],
  },
];

export const getResource = (slug: string) => LEARNING_RESOURCES.find((r) => r.slug === slug);
