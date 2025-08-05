import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  orderLookupRequestSchema, 
  type OrderLookupResponse,
  ghlContactsSearchResponseSchema,
  ghlTransactionsResponseSchema,
  type GHLContact,
  type GHLTransaction
} from "@shared/schema";
import { z } from "zod";
import * as postmark from 'postmark';
import Stripe from "stripe";

// Product name mapping function (temporary direct implementation for debugging)
function getProductName(productName: string, price?: number, dataSource?: string): string {
  // Apply price-based mapping for:
  // 1. WP orders (dataSource === 'woocommerce') 
  // 2. GHL orders with generic "Order" format (contains " - Order" pattern)
  const shouldUsePriceMapping = (dataSource === 'woocommerce') || 
                               (dataSource === 'gohighlevel' && productName.includes(' - Order'));
  
  if (shouldUsePriceMapping && price !== undefined) {
    // Special case: $197 can be either "Income Stream Bundle" or "7-Figure Launchpad" 
    // Check if original productName contains "Income Stream Bundle"
    if (price === 197) {
      if (productName.toLowerCase().includes('income stream bundle')) {
        return "Income Stream Bundle";
      }
      
      // Default to 7-Figure Launchpad for other $197 products
      return "7-Figure Launchpad";
    }
    
    const priceMapping: { [key: number]: string } = {
      27: "Fast-Start",
      47: "Endless Video Ideas", 
      74: "Fast-Start + Endless Video Ideas", // Single Stripe transaction for both products
      97: "Channel Brand Kit",
      147: "7-Figure Launchpad",
      297: "7-Figure Launchpad + The $10k Launch Formula"
    };
    
    if (priceMapping[price]) {
      return priceMapping[price];
    }
  }
  
  return productName;
}

// WooCommerce configuration
const getWooCommerceClient = () => {
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL || process.env.STORE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY || process.env.CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET || process.env.CONSUMER_SECRET;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce API credentials not configured. Please set WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET environment variables.");
  }

  // Use require with default export for compatibility
  const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

  return new WooCommerceRestApi({
    url: storeUrl,
    consumerKey: consumerKey,
    consumerSecret: consumerSecret,
    version: "wc/v3"
  });
};

// GoHighLevel API client
const getGHLHeaders = () => {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    throw new Error("GoHighLevel API key not configured. Please set GHL_API_KEY environment variable.");
  }
  
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
};

const searchGHLContactByEmail = async (email: string): Promise<GHLContact | null> => {
  try {
    const headers = getGHLHeaders();
    console.log('GHL API Headers (without key):', { 'Content-Type': headers['Content-Type'] });
    console.log('GHL API Key exists:', !!process.env.GHL_API_KEY);
    console.log('GHL API Key length:', process.env.GHL_API_KEY?.length);
    
    const url = `https://rest.gohighlevel.com/v1/contacts/?query=${encodeURIComponent(email)}`;
    console.log('GHL API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log('GHL Response Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GHL contact search failed: ${response.status} ${response.statusText}`);
      console.error('GHL Error Response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('GHL Raw Response:', data);
    
    const parsed = ghlContactsSearchResponseSchema.parse(data);
    console.log('GHL Parsed Response:', parsed);
    
    return parsed.contacts.length > 0 ? parsed.contacts[0] : null;
  } catch (error) {
    console.error('Error searching GHL contact:', error);
    return null;
  }
};

const searchGHLTransactionsByContactId = async (contactId: string): Promise<any> => {
  try {
    console.log(`Fetching transactions for contact ID: ${contactId}`);
    const headers = getGHLHeaders();
    console.log('GHL Transactions API Headers (without key):', { 'Content-Type': headers['Content-Type'] });
    
    // Try API v2.0 transactions endpoint with contact filter
    const url = `https://rest.gohighlevel.com/v1/payments/transactions?contactId=${contactId}`;
    console.log('GHL Transactions API URL (v2):', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log('GHL Transactions Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GHL transactions search failed: ${response.status} ${response.statusText}`);
      console.error('GHL Transactions Error Response:', errorText);
      
      // Try alternative: orders endpoint
      console.log('Trying orders endpoint as fallback...');
      return await searchGHLOrdersByContactId(contactId);
    }

    const data = await response.json();
    console.log('GHL Transactions Raw Response:', data);
    
    return data;
  } catch (error) {
    console.error('Error searching GHL transactions:', error);
    throw error;
  }
};

const searchGHLOrdersByContactId = async (contactId: string): Promise<any> => {
  try {
    console.log(`Fetching orders for contact ID: ${contactId}`);
    const headers = getGHLHeaders();
    
    // Try API v2.0 orders endpoint with contact filter
    const url = `https://rest.gohighlevel.com/v1/payments/orders?contactId=${contactId}`;
    console.log('GHL Orders API URL (v2):', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log('GHL Orders Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GHL orders search failed: ${response.status} ${response.statusText}`);
      console.error('GHL Orders Error Response:', errorText);
      throw new Error(`Orders API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('GHL Orders Raw Response:', data);
    
    return { type: 'orders', ...data };
  } catch (error) {
    console.error('Error searching GHL orders:', error);
    throw error;
  }
};

const getGHLTransactions = async (contactId: string): Promise<GHLTransaction[]> => {
  try {
    const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/${contactId}/transactions`, {
      method: 'GET',
      headers: getGHLHeaders()
    });

    if (!response.ok) {
      console.error(`GHL transactions fetch failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const parsed = ghlTransactionsResponseSchema.parse(data);
    
    // Filter out pending transactions to prevent them from being rendered
    const filteredTransactions = parsed.transactions.filter(transaction => {
      const isPending = transaction.status === 'pending';
      if (isPending) {
        console.log(`Filtering out pending GHL transaction: ${transaction.id}`);
      }
      return !isPending;
    });
    
    return filteredTransactions;
  } catch (error) {
    console.error('Error fetching GHL transactions:', error);
    return [];
  }
};

// Convert GHL transaction to WooCommerce-like format for consistency
const convertGHLTransactionToWooFormat = (transaction: GHLTransaction, contact: GHLContact) => {
  return {
    id: parseInt(transaction.id.replace(/\D/g, '')) || Math.floor(Math.random() * 999999), // Convert to number, fallback to random
    parent_id: 0,
    status: transaction.status === 'paid' ? 'completed' : transaction.status,
    currency: 'USD', // Default currency for GHL
    version: '1.0.0',
    prices_include_tax: false,
    date_created: transaction.createdAt,
    date_modified: transaction.createdAt,
    discount_total: '0.00',
    discount_tax: '0.00',
    shipping_total: '0.00',
    shipping_tax: '0.00',
    cart_tax: '0.00',
    total: transaction.amount.toString(),
    total_tax: '0.00',
    customer_id: 0,
    order_key: `ghl_${transaction.id}`,
    billing: {
      first_name: contact.firstName || '',
      last_name: contact.lastName || '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      email: contact.email,
      phone: ''
    },
    shipping: {
      first_name: '',
      last_name: '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
      phone: ''
    },
    payment_method: 'ghl',
    payment_method_title: 'GoHighLevel',
    transaction_id: transaction.id,
    customer_ip_address: '',
    customer_user_agent: '',
    created_via: 'gohighlevel',
    customer_note: '',
    date_completed: transaction.createdAt,
    date_paid: transaction.createdAt,
    cart_hash: '',
    number: transaction.id,
    meta_data: [],
    line_items: transaction.products?.map((product, index) => ({
      id: index + 1,
      name: product.name,
      product_id: index + 1,
      quantity: product.quantity,
      total: product.price.toString(),
      sku: product.sku || ''
    })) || [{
      id: 1,
      name: 'GoHighLevel Transaction',
      product_id: 1,
      quantity: 1,
      total: transaction.amount.toString(),
      sku: ''
    }],
    shipping_lines: []
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Raw WooCommerce data endpoint for debugging
  app.get("/api/woocommerce-raw/:email", async (req, res) => {
    try {
      const email = req.params.email;
      console.log(`Getting raw WooCommerce data for: ${email}`);
      
      const wooApi = getWooCommerceClient();
      const wooResponse = await wooApi.get("orders", {
        search: email,
        per_page: 100,
        status: "any"
      });
      
      console.log(`Found ${wooResponse.data.length} WooCommerce orders for ${email}`);
      res.json({
        success: true,
        email: email,
        orders: wooResponse.data
      });
    } catch (error: any) {
      console.error("Error fetching raw WooCommerce data:", error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // WooCommerce order lookup endpoint - REDESIGNED TO USE STRIPE AS AUTHORITATIVE SOURCE
  app.post("/api/orders/lookup", async (req, res) => {
    try {
      // Validate request body
      const { email } = orderLookupRequestSchema.parse(req.body);

      // STEP 1: Get all Stripe transactions first (AUTHORITATIVE SOURCE)
      let allStripeTransactions = [];
      try {
        const stripeResponse = await fetch(`${req.protocol}://${req.get('host')}/api/stripe-orders?email=${encodeURIComponent(email)}`);
        const stripeData = await stripeResponse.json();
        
        if (stripeData.success && stripeData.transactions && stripeData.transactions.length > 0) {
          allStripeTransactions = stripeData.transactions;
          console.log(`Found ${allStripeTransactions.length} total Stripe transactions for ${email}`);
        } else {
          console.log(`No Stripe transactions found for ${email}`);
        }
      } catch (stripeError) {
        console.log(`Stripe lookup failed:`, stripeError);
      }

      // Debug: Log all transactions for this customer
      console.log(`DEBUG: All ${allStripeTransactions.length} transactions for ${email}:`);
      allStripeTransactions.forEach((t: any, index: number) => {
        console.log(`  ${index + 1}. $${t.amount} - ${t.status} - ${t.description || 'No description'} - Refunded: ${t.has_refunds ? 'YES' : 'NO'} - ${t.timestamp}`);
      });

      // Filter to only successful transactions (exclude failed payments)
      const stripeTransactions = allStripeTransactions.filter((transaction: any) => 
        transaction.status !== 'failed' && transaction.status !== 'canceled'
      );
      console.log(`Filtered to ${stripeTransactions.length} successful Stripe transactions`);

      // Critical business rule: July 8th, 2025 cutoff for WP vs GHL classification
      const ghlLaunchDate = new Date('2025-07-08T00:00:00Z');

      // If no Stripe transactions, return empty result immediately
      if (stripeTransactions.length === 0) {
        console.log(`No Stripe transactions found for ${email} - returning empty result`);
        return res.json({
          success: true,
          customer_email: email,
          total_orders: 0,
          total_value: "0.00",
          orders: [],
          products: []
        });
      }

      // STEP 2: Fetch WooCommerce orders to match against Stripe transactions
      const wooCommerce = getWooCommerceClient();
      let wooCommerceOrders = [];
      
      try {
        const wooResponse = await wooCommerce.get("orders", {
          search: email,
          per_page: 100,
          status: "any"
        });
        wooCommerceOrders = wooResponse.data || [];
        console.log(`Found ${wooCommerceOrders.length} WooCommerce orders for ${email}`);
        
        // Debug: Log WooCommerce orders details
        if (wooCommerceOrders.length > 0) {
          console.log(`DEBUG: WooCommerce orders for ${email}:`);
          wooCommerceOrders.forEach((order: any, index: number) => {
            console.log(`  ${index + 1}. Order ${order.id}: $${order.total} - ${order.date_created} - Status: ${order.status}`);
            if (order.line_items && order.line_items.length > 0) {
              console.log(`    Line items:`, order.line_items.map((item: any) => `"${item.name}" ($${item.total})`));
            }
          });
        }
      } catch (wooError: any) {
        console.log(`WooCommerce lookup failed:`, wooError.message);
      }

      // STEP 3: Process each successful Stripe transaction and classify as WP or GHL
      const processedProducts = [];
      const matchedWooOrders = [];
      
      for (let index = 0; index < stripeTransactions.length; index++) {
        const transaction = stripeTransactions[index];
        const transactionDate = new Date(transaction.timestamp);
        
        // Try to match with WooCommerce order first
        let matchingWooOrder = null;
        const transactionAmount = parseFloat(transaction.amount.toString());
        
        // First try exact transaction_id match
        if (transaction.id) {
          matchingWooOrder = wooCommerceOrders.find((order: any) => order.transaction_id === transaction.id);
        }
        
        // If no exact match, try matching by line item amount and approximate date
        if (!matchingWooOrder && transaction.amount && transaction.timestamp) {
          matchingWooOrder = wooCommerceOrders.find((order: any) => {
            const orderDate = new Date(order.date_created);
            const timeDiff = Math.abs(transactionDate.getTime() - orderDate.getTime());
            const twoDays = 48 * 60 * 60 * 1000; // 48 hours in milliseconds (more flexible for timezone differences)
            
            // Check if this order has a line item matching the transaction amount
            const hasMatchingLineItem = order.line_items?.some((item: any) => {
              const itemTotal = parseFloat(item.total);
              return Math.abs(itemTotal - transactionAmount) < 0.01;
            }) || false;
            

            
            return hasMatchingLineItem && timeDiff < twoDays;
          });
        }
        
        // Classification logic: WooCommerce match takes priority over date
        let dataSource = 'gohighlevel'; // Default to GHL
        if (matchingWooOrder) {
          dataSource = 'woocommerce'; // Has WooCommerce data = WordPress order
        } else if (transactionDate < ghlLaunchDate) {
          dataSource = 'woocommerce'; // Before July 8th = WordPress
        }
        
        // CRITICAL: Always create exactly ONE product per Stripe transaction
        // Use Stripe data as source of truth, WooCommerce only for enrichment
        let productName = transaction.description || transaction.product_name || 'Unknown Product';
        let productId = 30000 + index;
        let orderNumber = transaction.id;
        let orderDate = transaction.timestamp;
        let orderStatus = transaction.status === 'succeeded' ? 'completed' : transaction.status;
        let wooCommerceLineName: string | undefined;
        
        // If we have a matching WooCommerce order, use its data for enrichment
        if (matchingWooOrder && dataSource === 'woocommerce') {
          // Only add to matched orders if not already there (avoid duplicates)
          if (!matchedWooOrders.find(order => order.id === matchingWooOrder.id)) {
            matchedWooOrders.push(matchingWooOrder);
          }
          
          // Try to find a matching line item by amount
          const lineItems = matchingWooOrder.line_items || [];
          console.log(`DEBUG: Looking for line item matching $${transactionAmount} in WooCommerce order ${matchingWooOrder.id}`);
          console.log(`DEBUG: Available line items:`, lineItems.map((item: any) => `"${item.name}" ($${item.total})`));
          
          const matchingItem = lineItems.find((item: any) => {
            const itemTotal = parseFloat(item.total);
            return Math.abs(itemTotal - transactionAmount) < 0.01;
          });
          
          if (matchingItem) {
            productId = matchingItem.product_id;
            wooCommerceLineName = matchingItem.name; // Store WooCommerce line item name for product differentiation
            console.log(`DEBUG: Found matching line item: "${wooCommerceLineName}" for $${transactionAmount}`);
          } else {
            console.log(`DEBUG: No matching line item found for $${transactionAmount}`);
          }
          
          orderNumber = matchingWooOrder.number;
          orderDate = matchingWooOrder.date_created;
          orderStatus = matchingWooOrder.status;
        }
        
        // For WP orders, if we have a WooCommerce line item name, use that for better product differentiation
        if (wooCommerceLineName && dataSource === 'woocommerce') {
          productName = wooCommerceLineName;
          console.log(`Using WooCommerce line item name for $${transaction.amount} transaction: "${wooCommerceLineName}"`);
        } else {
          console.log(`No WooCommerce line item name found for $${transaction.amount} transaction. Using Stripe description: "${productName}"`);
        }

        // Create exactly ONE product per Stripe transaction
        // For WP orders, use price-based mapping with productName (WooCommerce line name when available) for $197 differentiation
        console.log(`DEBUG: About to call getProductName with: productName="${productName}", price=${parseFloat(transaction.amount.toString())}, dataSource="${dataSource}"`);
        
        let finalProductName: string;
        try {
          finalProductName = getProductName(productName, parseFloat(transaction.amount.toString()), dataSource);
          console.log(`Product mapping: "${productName}" -> "${finalProductName}" (price: $${transaction.amount}, source: ${dataSource})`);
        } catch (error) {
          console.error(`Error calling getProductName:`, error);
          finalProductName = productName; // Fallback to original name
        }
        
        const productData = {
          id: productId,
          name: finalProductName,
          sku: transaction.sku || "",
          quantity: transaction.quantity || 1,
          price: transaction.amount.toString(),
          total: transaction.amount.toString(),
          order_id: matchingWooOrder ? matchingWooOrder.id : (30000 + index),
          order_number: orderNumber,
          order_date: orderDate,
          order_status: orderStatus,
          data_source: dataSource, // Use date-based classification
          transaction_id: transaction.id,
          has_refunds: transaction.has_refunds || false,
          refund_amount: transaction.refund_amount || 0,
        };
        processedProducts.push(productData);
      }

      console.log(`Processed ${processedProducts.length} products from ${stripeTransactions.length} Stripe transactions`);

      // STEP 4: Apply product processing (splitting, etc.)
      let allProducts = processedProducts;
      
      // Calculate total value from all sources
      const totalValue = allProducts.reduce((sum: number, product: any) => {
        return sum + parseFloat(product.total || "0");
      }, 0);

      // Special handling for "Fast-Start - 7-Figure Launchpad Discounted" split payments
      const launchpadProducts = allProducts.filter((p: any) => p.name === "Fast-Start - 7-Figure Launchpad Discounted");
      
      if (launchpadProducts.length === 2) {
        // Check if they are approximately one month apart
        const date1 = new Date(launchpadProducts[0].order_date);
        const date2 = new Date(launchpadProducts[1].order_date);
        const timeDiff = Math.abs(date1.getTime() - date2.getTime());
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        
        // If between 25-35 days apart, consider them split payments
        if (daysDiff >= 25 && daysDiff <= 35) {
          // Sort by date to get the earlier one first
          launchpadProducts.sort((a: any, b: any) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
          
          // Calculate total amount (sum of both payments)
          const totalAmount = (parseFloat(launchpadProducts[0].total) + parseFloat(launchpadProducts[1].total)).toFixed(2);
          
          // Create merged product with split payment info
          const mergedProduct = {
            ...launchpadProducts[0], // Use earlier payment as base (this gives us the earlier date)
            total: totalAmount,
            price: (parseFloat(totalAmount) / launchpadProducts[0].quantity).toFixed(2), // Price per unit
            is_split_payment: true,
            split_payments: [
              {
                order_id: launchpadProducts[0].order_id,
                order_number: launchpadProducts[0].order_number,
                amount: launchpadProducts[0].total,
                date: launchpadProducts[0].order_date,
              },
              {
                order_id: launchpadProducts[1].order_id,
                order_number: launchpadProducts[1].order_number,
                amount: launchpadProducts[1].total,
                date: launchpadProducts[1].order_date,
              }
            ]
          };
          
          // Remove original launchpad products and add merged one
          allProducts = allProducts.filter((p: any) => p.name !== "Fast-Start - 7-Figure Launchpad Discounted");
          allProducts.push(mergedProduct);
        }
      }

      // Format response - only use Stripe transaction count as source of truth
      const orderLookupResponse: OrderLookupResponse = {
        success: true,
        customer_email: email,
        total_orders: stripeTransactions.length, // Only count actual Stripe transactions
        total_value: totalValue.toFixed(2),
        orders: matchedWooOrders, // Only include matched WooCommerce orders for enrichment
        products: allProducts,
        debug_woocommerce_raw: matchedWooOrders // Include raw WooCommerce data for debugging
      };



      res.json(orderLookupResponse);
    } catch (error: any) {
      console.error("Error looking up orders:", error);
      
      // Handle specific WooCommerce API errors
      if (error.response?.data?.message) {
        return res.status(400).json({
          success: false,
          message: error.response.data.message
        });
      }

      // Handle configuration errors
      if (error.message.includes("credentials not configured")) {
        return res.status(500).json({
          success: false,
          message: error.message.includes("GoHighLevel") 
            ? "GoHighLevel API is not properly configured. Please check your API credentials."
            : "WooCommerce API is not properly configured. Please check your API credentials."
        });
      }

      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: error.errors[0]?.message || "Invalid request data"
        });
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: "An error occurred while fetching order data. Please try again."
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // WooCommerce connection test endpoint
  app.get("/api/woocommerce/test", async (req, res) => {
    try {
      const wooCommerce = getWooCommerceClient();
      await wooCommerce.get("orders", { per_page: 1 });
      res.json({ success: true, message: "WooCommerce API connection successful" });
    } catch (error: any) {
      console.error("WooCommerce connection test failed:", error);
      res.status(500).json({
        success: false,
        message: error.message.includes("credentials not configured") 
          ? "WooCommerce API credentials not configured"
          : "Failed to connect to WooCommerce API"
      });
    }
  });

  // Submit refund request endpoint
  app.post("/api/refund/submit", async (req, res) => {
    try {
      const { firstName, productName, feedback, recaptchaToken, isFullRefund } = req.body;
      
      // Get additional data from request body for email
      const { selectedProduct, customerEmail } = req.body;

      // Validate required fields (feedback is optional)
      if (!firstName || !productName || typeof isFullRefund !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: "Required fields are missing"
        });
      }

      // Temporarily disable reCAPTCHA verification for testing
      // TODO: Re-enable reCAPTCHA verification after testing
      /*
      // Verify reCAPTCHA token with Google
      if (process.env.RECAPTCHA_SECRET_KEY) {
        const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
        });
        
        const recaptchaData = await recaptchaResponse.json();
        
        if (!recaptchaData.success) {
          return res.status(400).json({
            success: false,
            error: "reCAPTCHA verification failed. Please try again."
          });
        }
      }
      */

      // Send email using Postmark
      if (process.env.POSTMARK_API_KEY) {
        const postmarkClient = new postmark.ServerClient(process.env.POSTMARK_API_KEY);
        
        // Calculate refund amount
        const productTotal = selectedProduct?.total ? parseFloat(selectedProduct.total) : 0;
        const refundAmount = isFullRefund ? productTotal : (productTotal * 0.5);
        
        // Prepare email data
        const emailData = {
          order_id: selectedProduct?.orderId || 'N/A',
          product_name: productName,
          refund_amount: refundAmount.toFixed(2),
          refund_type: isFullRefund ? 'full' : 'half',
          customer_name: firstName,
          customer_email: customerEmail || 'N/A',
          feedback: feedback,
          timestamp: new Date().toISOString(),
        };
        
        try {
          // Create subject with required format
          const submissionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
          
          await postmarkClient.sendEmail({
            From: 'noreply@viralprofits.yt',
            To: 'hello@viralprofits.yt',
            ReplyTo: customerEmail || 'noreply@viralprofits.yt',
            Subject: `Refund Request for ${customerEmail} - Order #${selectedProduct?.orderId || 'N/A'} - ${productName} - ${submissionDate}`,
            HtmlBody: `
              <h2>New Refund Request</h2>
              <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; width: 200px;">Order ID:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${selectedProduct?.orderId || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Product Name:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${productName}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Refund Amount:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">$${refundAmount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Refund Type:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${isFullRefund ? 'Full Refund' : '50% Refund (Lifetime Access Retained)'}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Customer Name:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${firstName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Customer Email:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${customerEmail || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Submission Date:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${submissionDate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; vertical-align: top;">Customer Feedback:</td>
                  <td style="padding: 12px; border: 1px solid #dee2e6;">${feedback}</td>
                </tr>
              </table>
            `,
            TextBody: `
New Refund Request

Order ID: ${selectedProduct?.orderId || 'N/A'}
Product Name: ${productName}
Refund Amount: $${refundAmount.toFixed(2)}
Refund Type: ${isFullRefund ? 'Full Refund' : '50% Refund (Lifetime Access Retained)'}
Customer Name: ${firstName}
Customer Email: ${customerEmail || 'N/A'}
Submission Date: ${submissionDate}
Customer Feedback: ${feedback}
            `
          });
          
          console.log('Refund request email sent successfully via Postmark');
        } catch (error: any) {
          console.error('Failed to send email via Postmark:', error.message);
          // Don't fail the request if email fails, just log it
        }
      }

      console.log("Refund request submitted:", {
        firstName,
        productName,
        feedback,
        isFullRefund,
        refundType: isFullRefund ? 'Full refund with access removal' : '50% refund with lifetime access retained',
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        message: "Refund request submitted successfully"
      });
    } catch (error: any) {
      console.error("Error submitting refund request:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to submit refund request"
      });
    }
  });

  // GHL Testing endpoint
  app.post("/api/ghl/test-contact", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      console.log(`Testing GHL API for email: ${email}`);
      
      // Test the GHL contact search
      const contact = await searchGHLContactByEmail(email);
      
      console.log(`GHL API test result:`, { email, contact });
      
      let transactions = null;
      let transactionsError = null;
      
      // If contact found, get their transactions
      if (contact) {
        try {
          console.log(`Fetching transactions for contact ID: ${contact.id}`);
          transactions = await searchGHLTransactionsByContactId(contact.id);
          console.log(`GHL Transactions result:`, transactions);
        } catch (error: any) {
          console.error("Error fetching GHL transactions:", error);
          transactionsError = error.message;
        }
      }
      
      res.json({
        success: true,
        email: email,
        contact: contact,
        found: !!contact,
        transactions: transactions,
        transactionsError: transactionsError
      });
    } catch (error: any) {
      console.error("Error testing GHL API:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to test GHL API"
      });
    }
  });

  // Stripe configuration and helper functions
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY not found. Stripe integration will not be available.');
  }
  
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil',
  }) : null;

  // Stripe orders lookup endpoint
  app.get("/api/stripe-orders", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: "Stripe integration not configured. Please set STRIPE_SECRET_KEY environment variable."
        });
      }

      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Email parameter is required"
        });
      }

      console.log(`Searching Stripe for customer: ${email}`);
      
      // Look up customer by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length === 0) {
        console.log(`No Stripe customer found for email: ${email}`);
        return res.json({
          success: true,
          email: email,
          customer: null,
          transactions: [],
          total_value: 0,
          total_orders: 0
        });
      }

      const customer = customers.data[0];
      console.log(`Found Stripe customer: ${customer.id}`);

      // Fetch charges for this customer with refunds expanded
      const charges = await stripe.charges.list({
        customer: customer.id,
        limit: 100,
        expand: ['data.refunds']
      });

      // Fetch payment intents for this customer
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 100
      });

      // Process charges into transaction format
      const transactions = [];
      let totalValue = 0;

      // Process charges
      for (const charge of charges.data) {
        const amount = charge.amount / 100; // Convert cents to dollars
        totalValue += amount;

        // Try to get product info from invoice line items if available
        let productName = 'Unknown Product';
        let sku = null;
        let quantity = 1;

        if ((charge as any).invoice) {
          try {
            const invoice = await stripe.invoices.retrieve((charge as any).invoice as string, {
              expand: ['lines.data.price.product']
            });
            
            if (invoice.lines.data.length > 0) {
              const lineItem = invoice.lines.data[0];
              if ((lineItem as any).price?.product && typeof (lineItem as any).price.product === 'object') {
                productName = (lineItem as any).price.product.name || 'Unknown Product';
              }
              quantity = lineItem.quantity || 1;
            }
          } catch (invoiceError) {
            console.log('Could not fetch invoice details:', invoiceError);
          }
        }

        // Check if charge has been refunded
        console.log(`Checking refunds for charge ${charge.id}:`, {
          refunded: charge.refunded,
          amount_refunded: charge.amount_refunded,
          refunds_data_length: charge.refunds?.data?.length || 0,
          refunds_total_count: (charge.refunds as any)?.total_count || 0
        });
        
        const hasRefunds = charge.refunded || (charge.refunds && charge.refunds.data && charge.refunds.data.length > 0);
        const refundAmount = charge.amount_refunded ? charge.amount_refunded / 100 : 0;
        
        transactions.push({
          id: charge.id,
          amount: amount,
          status: charge.status,
          product_name: productName,
          sku: sku,
          quantity: quantity,
          timestamp: new Date(charge.created * 1000).toISOString(),
          currency: charge.currency,
          description: charge.description || null,
          payment_method: charge.payment_method_details?.type || 'unknown',
          has_refunds: hasRefunds,
          refund_amount: refundAmount,
          refunds: charge.refunds?.data || []
        });
      }

      // Process payment intents that might not have charges
      for (const pi of paymentIntents.data) {
        // Skip if we already have this as a charge
        const existingCharge = transactions.find(t => t.id === pi.latest_charge);
        if (existingCharge) continue;

        const amount = pi.amount / 100;
        totalValue += amount;

        // For payment intents, check if the latest charge has refunds
        let hasRefunds = false;
        let refundAmount = 0;
        let refunds: any[] = [];
        
        if (pi.latest_charge) {
          try {
            const charge = await stripe.charges.retrieve(pi.latest_charge as string, {
              expand: ['refunds']
            });
            hasRefunds = charge.refunded || false;
            refundAmount = charge.amount_refunded ? charge.amount_refunded / 100 : 0;
            refunds = charge.refunds?.data || [];
          } catch (chargeError) {
            console.log('Could not fetch charge refund details:', chargeError);
          }
        }

        transactions.push({
          id: pi.id,
          amount: amount,
          status: pi.status,
          product_name: pi.description || 'Unknown Product',
          sku: null,
          quantity: 1,
          timestamp: new Date(pi.created * 1000).toISOString(),
          currency: pi.currency,
          description: pi.description || null,
          payment_method: 'payment_intent',
          has_refunds: hasRefunds,
          refund_amount: refundAmount,
          refunds: refunds
        });
      }

      console.log(`Found ${transactions.length} Stripe transactions for ${email}`);
      
      // Debug: Log transaction refund data
      transactions.forEach(transaction => {
        if (transaction.has_refunds) {
          console.log(`Transaction ${transaction.id} has refunds:`, {
            has_refunds: transaction.has_refunds,
            refund_amount: transaction.refund_amount,
            refunds_count: transaction.refunds.length
          });
        }
      });

      res.json({
        success: true,
        email: email,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          created: new Date(customer.created * 1000).toISOString()
        },
        transactions: transactions,
        total_value: totalValue.toFixed(2),
        total_orders: transactions.length
      });

    } catch (error: any) {
      console.error("Error fetching Stripe orders:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch Stripe orders"
      });
    }
  });

  // WooCommerce test endpoint
  app.get("/api/woocommerce/test-orders", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Email parameter is required"
        });
      }

      console.log(`Testing WooCommerce order lookup for: ${email}`);
      
      // Get WooCommerce client
      const wooCommerce = getWooCommerceClient();

      // Fetch orders for the email address (same logic as main lookup)
      const response = await wooCommerce.get("orders", {
        search: email,
        per_page: 100,
        status: "any"
      });

      const orders = response.data || [];
      console.log(`Found ${orders.length} WooCommerce orders for ${email}`);

      // Calculate total value
      const totalValue = orders.reduce((sum: number, order: any) => {
        return sum + parseFloat(order.total || "0");
      }, 0);

      // Extract products from orders
      const products = orders.flatMap((order: any) => 
        (order.line_items || []).map((item: any) => ({
          id: item.product_id,
          name: item.name,
          sku: item.sku || "",
          quantity: item.quantity,
          price: (parseFloat(item.total) / item.quantity).toFixed(2),
          total: item.total,
          order_id: order.id,
          order_number: order.number,
          order_date: order.date_created,
          order_status: order.status,
        }))
      );

      res.json({
        success: true,
        email: email,
        total_orders: orders.length,
        total_value: totalValue.toFixed(2),
        orders: orders,
        products: products,
        raw_response: response.data // Include raw response for debugging
      });

    } catch (error: any) {
      console.error("Error testing WooCommerce orders:", error);
      
      // Handle specific WooCommerce API errors
      if (error.response?.data?.message) {
        return res.status(400).json({
          success: false,
          message: error.response.data.message,
          error_details: error.response.data
        });
      }

      // Handle configuration errors
      if (error.message.includes("credentials not configured")) {
        return res.status(500).json({
          success: false,
          message: "WooCommerce API is not properly configured. Please check your API credentials."
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to test WooCommerce API"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
