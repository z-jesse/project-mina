// Curated historical fixtures, not a live news feed. Summaries are AI-written.
// Article metadata and remote preview images come from the linked publishers.
// Production image reuse/hosting terms still need review.

import type { Topic } from '../lib/content'

export const sampleGtaGame = {
  name: 'Grand Theft Auto VI',
  description:
    'Rockstar Games’ open-world crime series returns to Vice City and the surrounding state of Leonida.',
}

const gtaArticles = [
  {
    outlet: 'VGC',
    author: 'Chris Scullion',
    date: '2025-05-02',
    dateLabel: 'May 2, 2025',
    title:
      'Grand Theft Auto 6 release date has been announced, but the game has been delayed to 2026',
    description:
      'The announcement and its implications for other publishers planning releases in fall 2025.',
    url: 'https://www.videogameschronicle.com/news/grand-theft-auto-6-has-been-delayed-to-2026/',
    image: 'https://www.videogameschronicle.com/files/2023/12/gta-6.jpg',
  },
  {
    outlet: 'TechSpot',
    author: 'Rob Thubron',
    date: '2025-05-02',
    dateLabel: 'May 2, 2025',
    title: 'Grand Theft Auto VI has been delayed, will launch on May 26, 2026',
    description:
      'Also considers the wait for PC players, with no PC release date announced at the time.',
    url: 'https://www.techspot.com/news/107776-grand-theft-auto-vi-has-delayed-launch-may.html',
    image:
      'https://www.techspot.com/images2/news/ts3_thumbs/2025/05/2025-05-02-ts3_thumbs-ada.jpg',
  },
  {
    outlet: 'The AU Review',
    author: 'Matthew Arcari',
    date: '2025-05-03',
    dateLabel: 'May 3, 2025',
    title: 'Grand Theft Auto 6 has been delayed to May 2026',
    description:
      'The studio’s statement, with commentary on launch quality and the room left in the 2025 calendar.',
    url: 'https://www.theaureview.com/games/grand-theft-auto-6-delayed/',
    image:
      'https://www.theaureview.com/wp-content/uploads/2025/05/gta6-keyart-notext-crop.webp',
  },
]

export const sampleTopics: Topic[] = [
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'steamos-3-7-handheld-support',
    title: 'SteamOS expands beyond the Steam Deck',
    date: '2025-05-23',
    dateLabel: 'May 23, 2025',
    subjects: ['Steam', 'PC gaming', 'Handhelds'],
    description:
      'Valve’s update adds official Legion Go S support and improves compatibility with other AMD handhelds.',
    summary:
      'SteamOS 3.7 brought official support for Lenovo’s Legion Go S, alongside improved compatibility with other AMD handhelds. Full support remained limited to the Steam Deck and Legion Go S.',
    image: {
      src: 'https://cdn.arstechnica.net/wp-content/uploads/2025/05/steamos-logo.jpg',
      alt: 'SteamOS logo',
      sourceName: 'Ars Technica',
      sourceUrl:
        'https://arstechnica.com/gadgets/2025/05/steamos-3-7-brings-valves-gaming-os-to-other-handhelds-and-generic-amd-pcs/',
      width: 1016,
      height: 460,
    },
    articles: [
      {
        outlet: 'Ars Technica',
        author: 'Andrew Cunningham',
        date: '2025-05-23',
        dateLabel: 'May 23, 2025',
        title:
          'SteamOS 3.7 brings Valve’s gaming OS to other handhelds and generic AMD PCs',
        description:
          'Details the supported hardware and the limits of compatibility beyond Valve’s own handheld.',
        url: 'https://arstechnica.com/gadgets/2025/05/steamos-3-7-brings-valves-gaming-os-to-other-handhelds-and-generic-amd-pcs/',
      },
    ],
  },
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'gta-6-second-trailer',
    title: 'GTA 6’s second trailer takes a closer look at Jason and Lucia',
    date: '2025-05-06',
    dateLabel: 'May 6, 2025',
    subjects: [sampleGtaGame.name, 'Rockstar Games', 'Trailers'],
    description:
      'New footage and character details expand the picture of life in Leonida.',
    summary:
      'Rockstar released a second GTA VI trailer on May 6, 2025, alongside character profiles and new screenshots. The reveal explored Jason and Lucia’s story and more of the locations across Leonida.',
    image: {
      src: 'https://www.gematsu.com/wp-content/uploads/2025/05/Grand-Theft-Auto-VI_2025_05-06-25_026.jpg',
      alt: 'Grand Theft Auto VI promotional screenshot released with the second trailer',
      sourceName: 'Gematsu',
      sourceUrl:
        'https://www.gematsu.com/2025/05/grand-theft-auto-vi-second-trailer-characters-and-places-detailed',
      width: 3840,
      height: 2160,
    },
    articles: [
      {
        outlet: 'Gematsu',
        author: 'Sal Romano',
        date: '2025-05-06',
        dateLabel: 'May 6, 2025',
        title:
          'Grand Theft Auto VI second trailer; characters and places detailed',
        description:
          'Collects the trailer, screenshots, and Rockstar’s newly published character and location profiles.',
        url: 'https://www.gematsu.com/2025/05/grand-theft-auto-vi-second-trailer-characters-and-places-detailed',
      },
    ],
  },
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'gta-6-may-2026-delay',
    title: 'GTA 6 moves from fall 2025 to May 2026',
    date: '2025-05-02',
    dateLabel: 'May 2, 2025',
    subjects: [sampleGtaGame.name, 'Rockstar Games', 'Release delays'],
    description:
      'Rockstar says it needs more development time, moving the game out of its planned fall release window.',
    summary:
      'Rockstar announced that Grand Theft Auto VI would arrive on May 26, 2026, moving it out of its planned fall 2025 window. The studio said it needed additional development time to meet its quality goals.',
    announcement: {
      label: 'Rockstar’s announcement',
      url: 'https://www.rockstargames.com/newswire/article/258aa538o412ok/grand-theft-auto-vi-is-now-coming-may-26-2026',
    },
    image: {
      src: gtaArticles[2].image,
      alt: 'Grand Theft Auto VI artwork showing two characters beside a car at sunset',
      sourceName: 'The AU Review',
      sourceUrl: gtaArticles[2].url,
      width: 1000,
      height: 670,
      position: 'center 10%',
    },
    articles: gtaArticles,
  },
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'ea-respawn-job-cuts',
    title: 'EA cuts jobs as Respawn cancels two projects',
    date: '2025-04-30',
    dateLabel: 'April 30, 2025',
    subjects: ['Electronic Arts', 'Respawn', 'Layoffs'],
    description:
      'Reporting links wider job cuts at EA to the cancellation of two early-stage Respawn projects.',
    summary:
      'Respawn said it was ending work on two early-stage projects and making changes to its teams. VGC reported that hundreds of jobs were affected across EA, citing Bloomberg. The reported headcount was not a confirmed total from the company.',
    // Intentionally image-free to exercise the text-only discovery layout.
    articles: [
      {
        outlet: 'VGC',
        author: 'Andy Robinson',
        date: '2025-04-30',
        dateLabel: 'April 30, 2025',
        title: 'Hundreds of jobs lost as EA culls two Respawn game projects',
        description:
          'Includes Respawn’s statement and distinguishes it from reporting on the scale of the cuts.',
        url: 'https://www.videogameschronicle.com/news/hundreds-of-jobs-lost-as-ea-culls-two-respawn-game-projects/',
      },
    ],
  },
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'oblivion-remastered-launch',
    title: 'Oblivion Remastered launches on PC and consoles',
    date: '2025-04-22',
    dateLabel: 'April 22, 2025',
    subjects: ['Oblivion Remastered', 'Bethesda', 'Game releases'],
    description:
      'Bethesda’s return to Cyrodiil arrives on the day of its reveal, including on Game Pass.',
    summary:
      'Bethesda announced and released The Elder Scrolls IV: Oblivion Remastered on April 22, 2025 for PC, PlayStation 5, and Xbox Series X|S. The remaster included the original game’s expansions and was available through Game Pass.',
    image: {
      src: 'https://www.gematsu.com/wp-content/uploads/2025/04/TES4-Oblivion-Ann_04-22-25.jpg',
      alt: 'The Elder Scrolls IV: Oblivion Remastered promotional artwork',
      sourceName: 'Gematsu',
      sourceUrl:
        'https://www.gematsu.com/2025/04/the-elder-scrolls-iv-oblivion-remastered-announced-for-ps5-xbox-series-and-pc-now-available',
      width: 3840,
      height: 2160,
    },
    articles: [
      {
        outlet: 'Gematsu',
        author: 'Sal Romano',
        date: '2025-04-22',
        dateLabel: 'April 22, 2025',
        title:
          'The Elder Scrolls IV: Oblivion Remastered announced for PS5, Xbox Series, and PC; now available',
        description:
          'Lists the platforms, editions, included expansions, and announcement trailer.',
        url: 'https://www.gematsu.com/2025/04/the-elder-scrolls-iv-oblivion-remastered-announced-for-ps5-xbox-series-and-pc-now-available',
      },
    ],
  },
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'switch-2-launch-date',
    title: 'Nintendo sets a June 5 launch for Switch 2',
    date: '2025-04-02',
    dateLabel: 'April 2, 2025',
    subjects: ['Nintendo Switch 2', 'Nintendo', 'Hardware'],
    description:
      'The console reveal brings a launch date, US pricing, and a closer look at its new features.',
    summary:
      'Nintendo’s April presentation set a June 5, 2025 launch for Switch 2, with a US starting price of $449.99. The company also showed new hardware features and a console bundle with Mario Kart World.',
    image: {
      src: 'https://www.gematsu.com/wp-content/uploads/2025/04/Switch-2-Date_04-02-25.jpg',
      alt: 'Nintendo Switch 2 console and controllers',
      sourceName: 'Gematsu',
      sourceUrl:
        'https://www.gematsu.com/2025/04/switch-2-launches-june-5-for-449',
      width: 3840,
      height: 2160,
    },
    articles: [
      {
        outlet: 'Gematsu',
        author: 'Sal Romano',
        date: '2025-04-02',
        dateLabel: 'April 2, 2025',
        title: 'Switch 2 launches June 5 for $449',
        description:
          'The launch details, console bundles, and announced games.',
        url: 'https://www.gematsu.com/2025/04/switch-2-launches-june-5-for-449',
      },
      {
        outlet: 'Ars Technica',
        author: 'Kyle Orland',
        date: '2025-04-02',
        dateLabel: 'April 2, 2025',
        title: 'Nintendo unveils Switch 2 ahead of June 5 launch',
        description:
          'Explains the new controllers, GameChat, and hardware changes shown in the presentation.',
        url: 'https://arstechnica.com/gaming/2025/04/nintendo-offers-new-details-on-switch-2-hardware-software/',
      },
    ],
  },
  {
    isSample: true,
    summaryIsAi: true,
    slug: 'gta-6-first-trailer',
    title: 'GTA 6’s first trailer reveals a return to Vice City',
    date: '2023-12-04',
    dateLabel: 'December 4, 2023',
    subjects: [sampleGtaGame.name, 'Rockstar Games', 'Trailers'],
    description:
      'The first reveal introduces Leonida and announces an initial 2025 release window.',
    summary:
      'Rockstar unveiled GTA VI’s first trailer in December 2023, introducing its Florida-inspired setting of Leonida, including Vice City. The announcement named PlayStation 5 and Xbox Series X|S and initially targeted 2025; that historical window was later revised.',
    image: {
      src: 'https://www.gematsu.com/wp-content/uploads/2023/12/GTAVI-Trailer-1_12-04-23.jpg',
      alt: 'Grand Theft Auto VI artwork accompanying the first trailer reveal',
      sourceName: 'Gematsu',
      sourceUrl:
        'https://www.gematsu.com/2023/12/grand-theft-auto-vi-launches-in-2025-for-ps5-and-xbox-series-first-trailer',
      width: 1920,
      height: 1080,
    },
    articles: [
      {
        outlet: 'Gematsu',
        author: 'Sal Romano',
        date: '2023-12-04',
        dateLabel: 'December 4, 2023',
        title:
          'Grand Theft Auto VI launches in 2025 for PS5 and Xbox Series, first trailer',
        description:
          'The original reveal, including the trailer and the platforms announced at the time.',
        url: 'https://www.gematsu.com/2023/12/grand-theft-auto-vi-launches-in-2025-for-ps5-and-xbox-series-first-trailer',
      },
    ],
  },
]
