# PS 260 Website

This is the official website for PS 260, built with Nuxt 3 and Storyblok CMS. The site features a responsive design with dynamic content management through Storyblok, custom animations, and specialized layouts for the contact page and editor profiles.

## Features

- Responsive design with mobile-optimized layouts
- Storyblok CMS integration for content management
- Dynamic contact page with accent image support and clickable addresses
- Editor profiles with reels and featured work
- Custom animations and transitions
- Simian API integration for video content
- Font optimization with preloading for custom fonts
- Location-specific styling for contact information

## Tech Stack

- [Nuxt 3](https://nuxt.com/) - Vue-based framework
- [Storyblok](https://www.storyblok.com/) - Headless CMS
- [SCSS](https://sass-lang.com/) - For styling
- [Lottie](https://airbnb.io/lottie/) - For animations
- [Vercel](https://vercel.com/) - For deployment

## Development Setup

First, enable corepack (for PNPM management):

```bash
npx corepack enable
```

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

The site will be available at http://localhost:3000

## Local HTTPS Development

To test with HTTPS locally (useful for testing third-party integrations):

```bash
pnpm proxy
```

This creates a local SSL certificate and proxies the dev server through HTTPS on port 3010.

## CMS Documentation

For detailed information about the Storyblok CMS setup and content structure, refer to the [PS 260 Notion Documentation](https://bit.ly/ps260).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
STORYBLOK_TOKEN=storyblok_token
NUXT_SIMIAN_AUTH_TOKEN=simian_api_token
```

## Build and Deployment

Create a production build:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

The site is automatically deployed to Vercel when changes are pushed to the main branch.

## Project Structure

- `assets/` - SCSS variables, breakpoints, and global styles
- `components/` - Vue components
- `composables/` - Reusable Vue composables
- `layouts/` - Page layouts
- `middleware/` - Nuxt middleware
- `pages/` - Page components and routing
- `plugins/` - Nuxt plugins
  - `lottie.js` - Lottie animation integration
  - `font-preloader.client.js` - Custom font preloading for performance
- `public/` - Static assets
- `server/` - API endpoints and Nitro server plugins
  - `api/` - Server API endpoints
  - `plugins/` - Nitro server plugins that modify server behavior
    - `inject-comments.ts` - Adds attribution comments to HTML output
    - `plugins.error.ts` - Custom error handling for 404 errors
- `storyblok/` - Storyblok-specific components

## Page Types and Features

### Home Page (`/pages/index.vue`)

The home page serves as the main entry point to the website, featuring:

- Dynamic content loading from Storyblok CMS
- Expandable accent image that responds to viewport width changes
- Hidden locker window that appears when viewport width increases
- Accent window with parallax scrolling and animation capabilities
- Optimized performance with conditional component rendering
- Social media meta tags for improved sharing experience
- Responsive design with mobile-specific optimizations
- Smart width detection with automatic content adjustments

### Contact Page

The contact page is implemented as a direct page component in `/pages/contact.vue`, similar to the homepage and editors index page. It uses the AccentImage component for consistent visual design across key pages.

#### Contact Page Features

- Location-specific color coding (different colors for each office location)
- Clickable addresses that link to Google Maps for each location
- Clickable phone numbers with proper formatting
- Accent image support with expandable hidden locker window
- Responsive design with optimized mobile layout
- Custom PS260 font with performance optimization
- Separate layout for company team members and representation contacts
- Collapsing margins between sections for clean spacing

### Editors Pages

The editors section consists of multiple pages that work together:

#### Editors Index (`/pages/editors/index.vue`)

- Background video/image with overlay
- Dynamic grid layout of editor profiles from Storyblok
- Expandable accent image with manual toggle on desktop
- Hidden locker window with click interaction for expansion
- Accent window that triggers on viewport width change
- Categorization of editors by type
- Responsive layout with mobile-specific adjustments

#### Editor Profile (`/pages/editors/[name]/[index].vue`)

- Sticky header video that plays automatically
- Dynamic video grid loaded from Simian API
- Q&A section with rich text formatting
- Editor biography with styled content
- Support for featured reels through sticky override
- Hover interactions that dim background when hovering over reels
- Responsive grid that adapts to all screen sizes

#### Editor Reel Page (`/pages/editors/[name]/[reel].vue`)

- Dedicated page for single video viewing
- Enhanced video player with inline and fullscreen options
- Video metadata display (title, credits, etc.)
- Related videos suggestions
- Back navigation to editor profile

### Featured Projects (`/pages/featured/[slug].vue`)

- Showcases special featured projects
- Rich media support (images, videos)
- Detailed project information with metadata
- Client and credit details
- Related project recommendations

### Dynamic Content Pages (`/pages/[...slug].vue`)

- Generic template for all CMS-driven content
- Support for all Storyblok components
- Dynamic SEO metadata
- Automatic content structure based on CMS data
- Fallback handling for missing content

### Accent Window / Hidden Locker Functionality

A key unique feature of the PS260 website is the "Accent Window" and "Hidden Locker" system that appears on multiple page types:

- **Accent Window**: A section of the page that contains special media content, typically animated or video-based
- **Hidden Locker**: An expandable area that appears when the viewport width increases or when triggered by user interaction

This functionality is implemented in:
- Home page - Automatic expansion based on viewport width
- Editors index page - Both automatic expansion and manual toggle via click
- Contact page - Integrated with accent image components

Technical details:
- Uses a global state to track expansion across components
- Checks for minimum width thresholds before activating (usually 960px+)
- Detects viewport width changes to dynamically adjust layout
- Supports manual toggling on desktop layouts
- Remembers expanded state until viewport width decreases below threshold
- Smooth transitions between expanded and collapsed states
- Proper handling of media playback when expanding/collapsing

## Contributing

1. Create a new branch from `main`
2. Make your changes
3. Open a pull request against `main`
4. Wait for review and approval

## License

All rights reserved. This codebase is proprietary and confidential.