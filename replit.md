# WooCommerce Order Lookup Application

## Overview

This is a full-stack React + Express application that provides WooCommerce order lookup functionality. The application allows users to search for orders by email address and displays comprehensive order information including customer details, order totals, and order history.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL support
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: PostgreSQL session store with connect-pg-simple
- **Development**: tsx for TypeScript execution in development

### API Integration
- **WooCommerce REST API**: @woocommerce/woocommerce-rest-api client for primary order data retrieval
- **GoHighLevel API**: Fallback order source when WooCommerce has no results
- **Email Service**: Postmark for transactional email delivery
- **Authentication**: WooCommerce API key-based authentication, GoHighLevel Bearer token authentication
- **Data Validation**: Zod schemas for request/response validation

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users Table**: Basic user management with username/password
- **WooCommerce Types**: Zod schemas for order data validation
- **Drizzle Configuration**: PostgreSQL database connection and migration setup

### API Routes (`server/routes.ts`)
- **Order Lookup Endpoint**: `/api/orders/lookup` - Searches orders by customer email
- **WooCommerce Integration**: Fetches order data from external WooCommerce store
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

### Frontend Pages
- **Order Lookup Page**: Main interface for searching orders by email
- **Results Display**: Shows order summaries, totals, and detailed order information
- **Error States**: Handles no orders found and API error scenarios

### UI Component System
- **shadcn/ui Components**: Pre-built accessible components (Button, Card, Form, etc.)
- **Custom Components**: CodeBlock for JSON display, specialized form components
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Data Flow

1. **User Input**: Customer enters email address in search form
2. **Form Validation**: React Hook Form validates input using Zod schema
3. **API Request**: TanStack Query sends POST request to `/api/orders/lookup`
4. **Primary Query**: Backend fetches orders from WooCommerce REST API
5. **Fallback Query**: If no WooCommerce orders found, searches GoHighLevel API
6. **Data Processing**: Order data is validated, normalized to WooCommerce format, and total values calculated
7. **Response Handling**: Frontend displays results or error messages
8. **State Management**: Query results cached by TanStack Query

## External Dependencies

### WooCommerce Integration
- **API Endpoint**: Configurable WooCommerce store URL
- **Authentication**: Consumer Key and Consumer Secret
- **API Version**: WooCommerce REST API v3
- **Rate Limiting**: Handled by WooCommerce API limits

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Built-in connection management
- **Migrations**: Drizzle Kit for schema management

### Development Tools
- **Replit Integration**: Configured for Replit development environment
- **Hot Module Replacement**: Vite HMR for fast development
- **Error Overlay**: Replit runtime error modal for debugging

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Assets**: Static files served from built frontend

### Production Configuration
- **Environment Variables**: 
  - `DATABASE_URL` for PostgreSQL connection
  - `WOOCOMMERCE_STORE_URL` for WooCommerce API endpoint
  - `WOOCOMMERCE_CONSUMER_KEY` and `WOOCOMMERCE_CONSUMER_SECRET` for API auth
- **Port Configuration**: Application runs on port 5000
- **Auto-scaling**: Configured for Replit autoscale deployment

### Development Setup
- **Development Server**: Concurrent frontend (Vite) and backend (tsx) processes
- **Database Migrations**: `npm run db:push` applies schema changes
- **Type Checking**: `npm run check` validates TypeScript

## Recent Changes
- January 30, 2025: Extended price-based product name mapping to GHL orders with generic "Order" format - system now applies proper product names (Fast-Start, Channel Brand Kit, etc.) to post-July 8th orders instead of showing raw Stripe descriptions like "- Order 32168 - 1 click upsell: 28268"
- January 26, 2025: Successfully implemented $197 product differentiation using WooCommerce line item names and upsell ID detection (23024 = Income Stream Bundle) - system now correctly distinguishes between "Income Stream Bundle" and "7-Figure Launchpad" for both WordPress and GoHighLevel orders
- January 26, 2025: Fixed WP order product names by implementing price-based mapping for all WordPress orders - $27="Fast-Start", $47="Endless Video Ideas", $74="Fast-Start + Endless Video Ideas", $97="Channel Brand Kit", $147/$197="7-Figure Launchpad", $297="7-Figure Launchpad + The $10k Launch Formula"
- January 30, 2025: Fixed $197 product differentiation by correcting WooCommerce matching logic - system now prioritizes WooCommerce line item matching over date-based classification, ensuring orders with WooCommerce data (like "Fast-start - Income Stream Bundle") are correctly identified as WordPress orders regardless of date
- January 26, 2025: Business rule clarification: Orders before July 8th, 2025 are definitively WordPress orders; orders after this date can be either WordPress (if WooCommerce data exists) or GoHighLevel orders
- January 26, 2025: Fixed critical duplicate order issue by filtering failed Stripe transactions and ensuring exactly one product per successful Stripe transaction 
- January 26, 2025: Fixed Zod schema validation issue for GHL contacts with null lastName values by adding .nullable() support - eliminates validation errors that prevented proper product name mapping
- January 26, 2025: Fixed critical product name mapping issues by implementing smart field selection logic - for GHL contacts, system now uses description field instead of generic product_name field, eliminating "Unknown Product" errors for recent customers
- January 26, 2025: Added "Subscription creation" to product mapping to handle edge cases where Stripe transactions have generic descriptions that need mapping to actual products (maps to "7-Figure Launchpad")
- January 25, 2025: Fixed frontend filtering to include both 'stripe' and 'gohighlevel' data sources, resolving issue where recent GHL orders weren't displaying
- January 25, 2025: Redesigned order querying process to use Stripe as authoritative source - eliminates duplicates and ensures only refundable transactions are shown
- January 18, 2025: Fixed application errors by adding filtering to exclude GHL transactions with "pending" status from being rendered in the UI
- January 10, 2025: Hidden "Manage GHL Orders (Testing)" card from homepage while keeping /ghl-test route accessible
- January 10, 2025: Fixed Fast-Start product descriptions showing incorrect 7-Figure Launchpad content by removing partial matching from getProductDescription and getProductBenefits functions and adding explicit product name mappings
- January 10, 2025: Fixed React key duplication warnings by ensuring unique IDs for split products (Fast-Start + Endless Video Ideas)
- January 10, 2025: Resolved all smart quote syntax errors in product-utils.ts that were causing build failures
- January 09, 2025: Enhanced Stripe API to retrieve refund information from charges and payment intents, automatically detecting refunded transactions to set hasRefundRequest property correctly
- January 09, 2025: Added pending status handling with disabled manage buttons and yellow "Pending" labels for incomplete transactions
- January 09, 2025: Added product splitting logic for "Fast-Start + Endless Video Ideas" - splits single $74 Stripe transaction into separate $27 Fast-Start and $47 Endless Video Ideas products
- January 09, 2025: Integrated GHL-to-Stripe fallback flow in main order lookup - when WooCommerce returns 0 orders, system checks GHL for contact and fetches Stripe transactions
- January 09, 2025: Added WooCommerce testing functionality to GHL test page with dedicated "Test WooCommerce Orders" button for API response inspection
- January 08, 2025: Integrated GoHighLevel API as fallback order source when WooCommerce returns no results
- June 26, 2025: Added Reply-To header to refund emails using customer email address for direct reply capability
- June 26, 2025: Changed target email for refund submissions from jan@viralprofits.yt to hello@viralprofits.yt
- June 23, 2025: Fixed Copy-Paste product flow to correctly follow special product path (refund-options → full-refund-request with Google Form)
- June 23, 2025: Updated product benefits copy across all major products with new compelling messaging focused on Jake's proven systems and results
- June 23, 2025: Fixed "Back to Orders" button navigation on refund-options page to use correct dynamic route with customer email
- June 23, 2025: Updated Fast Start product to skip refund-request (50% refund) step and go directly from refund-options to full-refund-request
- June 23, 2025: Restored original reCAPTCHA implementation - widget shows with hardcoded site key, backend verification disabled for testing
- June 23, 2025: Made feedback textarea optional for all products on full-refund-request page
- June 23, 2025: Removed "Keep in mind" 50% refund section for Fast Start product on full-refund-request page
- June 22, 2025: Fixed navigation issue for special products (Copy-Paste, Income Stream Bundle, Channel Brand Kit) - back button now correctly navigates to refund-options instead of refund-request page
- June 22, 2025: Updated reCAPTCHA implementation to use environment variables and re-enabled backend verification for enhanced security
- June 22, 2025: Added iframe embedding support for viralprofits.yt domain with proper security headers
- June 22, 2025: Updated Google Form URLs for special products with product-specific forms (Copy-Paste, Income Stream Bundle, Channel Brand Kit)
- June 22, 2025: Formatted email body with professional table layout showing labeled fields instead of raw JSON data
- June 22, 2025: Updated email subject format to: "Refund Request for {customer_email} - Order #{orderId} - {productName} - {YYYY-MM-DD}"
- June 22, 2025: Changed trophy icon to check icon on refund success page for better visual communication
- June 22, 2025: Increased padding on refund success and failure cards to p-16 for more prominent visual presence
- June 22, 2025: Updated refund success and failure pages to use full-width cards positioned at top with background image, matching landing page layout
- June 22, 2025: Updated refund success and failure pages to span full viewport height, pushing footer below the fold for better focus on messaging
- June 22, 2025: Updated "Keep in mind" banner design with white background and black text for full refund warning, maintained green styling for 50% refund confirmation
- June 22, 2025: Created refund failure page (/refund-failure) with red X icon and error messaging, integrated into form error handling flow
- June 22, 2025: Created refund success page similar to finish.tsx with same styling and navigation to it after successful email submission
- June 22, 2025: Fixed form submission fetch error by correcting API request parameters and implemented proper error handling
- June 22, 2025: Modified refund flow for special products (Copy-Paste, Income Stream Bundle, Channel Brand Kit) to skip 50% refund option and go directly to full refund Google Form
- June 22, 2025: Updated specialized refund form copy with specific eligibility requirements for each special product (completion proof, implementation evidence, etc.)
- June 22, 2025: Added special handling for specific products (Copy-Paste, Income Stream Bundle, Channel Brand Kit) to redirect to Google Form instead of email submission
- June 22, 2025: Switched from SendGrid to Postmark for email delivery service
- June 21, 2025: Implemented email functionality for refund requests with formatted JSON data structure
- June 21, 2025: Added comprehensive email template containing order_id, product_name, refund_amount, refund_type, customer details, and feedback
- June 21, 2025: Configured Postmark email delivery to jan@viralprofits.yt for all refund submissions (both full and 50% refunds)
- June 21, 2025: Configured reCAPTCHA with production site key and implemented backend verification using secret key
- June 21, 2025: Added real reCAPTCHA validation to refund submission endpoint with proper error handling
- June 21, 2025: Added isFullRefund prop navigation to FullRefundRequest page with conditional content rendering
- June 21, 2025: Updated refund request buttons to pass isFullRefund=true/false via URL parameters
- June 21, 2025: Modified FullRefundRequest page to show different titles, descriptions, and button text based on refund type
- June 21, 2025: Enhanced backend API to handle and log isFullRefund parameter for proper refund type tracking
- June 21, 2025: Implemented refund detection logic to check API response for existing refunds and mark products as already refunded
- June 21, 2025: Added checkForRefundedProducts function to match refund totals against product totals and update hasRefundRequest property
- June 21, 2025: Updated product display to show "This product has already been refunded" warning for refunded products
- June 21, 2025: Created /full-refund-request page with feedback form, reCAPTCHA integration, and email submission functionality
- June 21, 2025: Added /api/refund/submit endpoint for handling full refund requests with placeholder email functionality
- June 21, 2025: Fixed dynamic pricing calculation on refund-request page to show accurate 50% refund amounts
- June 20, 2025: Created /refund-request page with 50% refund offer and lifetime access retention messaging
- June 20, 2025: Connected "Cancel and request refund" button to navigate to /refund-request page
- June 20, 2025: Updated /finish page content with trophy icon and "You made the right decision" messaging
- June 20, 2025: Created /finish page with thank you message and cancellation confirmation, matching app styling
- June 20, 2025: Connected "Keep my access and continue" button to navigate to /finish page
- June 20, 2025: Applied green button styling (bg-green-600 hover:bg-green-700) to all buttons on homepage, order-lookup, and Manage buttons on order-results
- June 20, 2025: Fixed customer name handling to store only first name from billing.first_name or by splitting customer_name property
- June 20, 2025: Created comprehensive unit tests for getProductRefundabilityStatus covering all product types and refund policies
- June 20, 2025: Standardized navbar titles to "Viral Profits | Order Management" (desktop) and "Viral Profits | Orders" (mobile) across all pages
- June 20, 2025: Refactored navbar into reusable Navbar component to improve maintainability and follow React best practices
- June 20, 2025: Updated navbar title font-size to 1rem and font-weight to 700 across all pages
- June 20, 2025: Added scroll-to-top functionality when navigating to refund-options page
- June 20, 2025: Enhanced product cards with full-card click handling and appropriate toast messages
- June 20, 2025: Added product utility functions for enhanced order data formatting
- June 20, 2025: Updated order results to display formatted product data with descriptions, benefits, and refund status
- June 20, 2025: Fixed JSX parsing error in homepage.tsx onError handler
- June 20, 2025: Updated bottom padding on all main content areas to 4rem for consistent spacing

## Changelog
- June 19, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.