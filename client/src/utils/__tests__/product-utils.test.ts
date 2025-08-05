import { describe, it, expect } from 'vitest';
import { getProductRefundabilityStatus } from '../product-utils';

describe('Product Refundability Status Tests', () => {

  describe('getProductRefundabilityStatus', () => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString();

    describe('AI Virality Bot - Non-refundable (Product ID 6)', () => {
      it('should return false regardless of purchase date', () => {
        const recentDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        const oldDate = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
        
        expect(getProductRefundabilityStatus('AI Virality Bot', formatDate(recentDate))).toBe(false);
        expect(getProductRefundabilityStatus('AI Virality Bot', formatDate(oldDate))).toBe(false);
      });
    });

    describe('Endless Video Ideas - 24 Hour Policy (Product ID 1)', () => {
      it('should return true within 24 hours', () => {
        const recentDate = new Date(today.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
        expect(getProductRefundabilityStatus('Endless Video Ideas System', formatDate(recentDate))).toBe(true);
      });

      it('should return false after 24 hours', () => {
        const oldDate = new Date(today.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
        expect(getProductRefundabilityStatus('Endless Video Ideas System', formatDate(oldDate))).toBe(false);
      });
    });

    describe('7-Figure Launchpad - 14 Day Policy (Product ID 3)', () => {
      it('should return true within 14 days', () => {
        const recentDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
        expect(getProductRefundabilityStatus('7-Figure Launchpad', formatDate(recentDate))).toBe(true);
      });

      it('should return false after 14 days', () => {
        const oldDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000); // 15 days ago
        expect(getProductRefundabilityStatus('7-Figure Launchpad', formatDate(oldDate))).toBe(false);
      });

      it('should handle variations', () => {
        const recentDate = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
        expect(getProductRefundabilityStatus('7-Figure Launchpad Discounted', formatDate(recentDate))).toBe(true);
        expect(getProductRefundabilityStatus('7-Figure Launchpad + The $10k Launch Formula', formatDate(recentDate))).toBe(true);
      });
    });

    describe('365-Day Money Back Guarantee Products (IDs 0,2,4,5)', () => {
      it('should return true for Fast-Start within 365 days', () => {
        const recentDate = new Date(today.getTime() - 200 * 24 * 60 * 60 * 1000); // 200 days ago
        expect(getProductRefundabilityStatus('Faceless Income 5-day Fast Start', formatDate(recentDate))).toBe(true);
      });

      it('should return false for Fast-Start after 365 days', () => {
        const oldDate = new Date(today.getTime() - 366 * 24 * 60 * 60 * 1000); // 366 days ago
        expect(getProductRefundabilityStatus('Faceless Income 5-day Fast Start', formatDate(oldDate))).toBe(false);
      });

      it('should return true for Copy-paste within 365 days', () => {
        const recentDate = new Date(today.getTime() - 300 * 24 * 60 * 60 * 1000); // 300 days ago
        expect(getProductRefundabilityStatus('Copy Paste Channel ($695 option)', formatDate(recentDate))).toBe(true);
        expect(getProductRefundabilityStatus('Copy Paste Channel ($995 option)', formatDate(recentDate))).toBe(true);
      });

      it('should return true for Income Stream Bundle within 365 days', () => {
        const recentDate = new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
        expect(getProductRefundabilityStatus('Income Stream Bundle', formatDate(recentDate))).toBe(true);
        expect(getProductRefundabilityStatus('Income Stream Bundle (2x)', formatDate(recentDate))).toBe(true);
      });

      it('should return true for Channel Brand Kit within 365 days', () => {
        const recentDate = new Date(today.getTime() - 50 * 24 * 60 * 60 * 1000); // 50 days ago
        expect(getProductRefundabilityStatus('Channel Brand Kit', formatDate(recentDate))).toBe(true);
        expect(getProductRefundabilityStatus('Fast-start - The Faceless Brand Kit', formatDate(recentDate))).toBe(true);
      });
    });

    describe('Unknown Products - Default Behavior', () => {
      it('should return true for unknown products (default behavior)', () => {
        const recentDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        expect(getProductRefundabilityStatus('Unknown Product', formatDate(recentDate))).toBe(true);
      });

      it('should return true for unrecognized product names', () => {
        const recentDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        expect(getProductRefundabilityStatus('Some Random Product', formatDate(recentDate))).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle same-day purchases correctly', () => {
        const todayDate = new Date(today.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
        expect(getProductRefundabilityStatus('7-Figure Launchpad', formatDate(todayDate))).toBe(true);
        expect(getProductRefundabilityStatus('Endless Video Ideas System', formatDate(todayDate))).toBe(true);
      });

      it('should handle future dates gracefully', () => {
        const futureDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
        // Future dates should return false as the isWithinDaysPeriod function checks diffInMilliseconds > 0
        expect(getProductRefundabilityStatus('7-Figure Launchpad', formatDate(futureDate))).toBe(false);
      });

      it('should handle case sensitivity in product matching', () => {
        const recentDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        // These don't match exact product names, so they fall back to default behavior (return true)
        expect(getProductRefundabilityStatus('COPY PASTE CHANNEL', formatDate(recentDate))).toBe(true);
        // 'endless video ideas' matches partially with 'Endless Video Ideas System' so it gets Product ID 1
        // but since 5 days > 24 hours, it should return false for the 24-hour policy
        expect(getProductRefundabilityStatus('endless video ideas', formatDate(recentDate))).toBe(false);
      });
    });

    describe('Boundary Testing for Time Periods', () => {
      it('should test exact boundary for 24-hour policy', () => {
        const exactBoundary = new Date(today.getTime() - 24 * 60 * 60 * 1000); // exactly 24 hours ago
        expect(getProductRefundabilityStatus('Endless Video Ideas System', formatDate(exactBoundary))).toBe(false);
      });

      it('should test exact boundary for 14-day policy', () => {
        const exactBoundary = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000); // exactly 14 days ago
        expect(getProductRefundabilityStatus('7-Figure Launchpad', formatDate(exactBoundary))).toBe(false);
      });

      it('should test exact boundary for 365-day policy', () => {
        const exactBoundary = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000); // exactly 365 days ago
        expect(getProductRefundabilityStatus('Copy Paste Channel ($695 option)', formatDate(exactBoundary))).toBe(false);
      });
    });
  });
});