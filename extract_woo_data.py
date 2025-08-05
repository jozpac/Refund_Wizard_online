#!/usr/bin/env python3
import json

with open('/tmp/response.json', 'r') as f:
    data = json.load(f)

if 'debug_woocommerce_raw' in data and data['debug_woocommerce_raw']:
    woo_order = data['debug_woocommerce_raw'][0]
    print('=== BASIC ORDER INFO ===')
    print(f'Order ID: {woo_order.get("id")}')
    print(f'Order Date: {woo_order.get("date_created")}')
    print(f'Total: ${woo_order.get("total")}')
    print(f'Status: {woo_order.get("status")}')
    print('')
    print('=== LINE ITEMS ===')
    for i, item in enumerate(woo_order.get('line_items', [])):
        print(f'Item {i+1}:')
        print(f'  Name: {item.get("name")}')
        print(f'  Product ID: {item.get("product_id")}')
        print(f'  Variation ID: {item.get("variation_id")}')
        print(f'  SKU: {item.get("sku")}')
        print(f'  Total: ${item.get("total")}')
        print(f'  Quantity: {item.get("quantity")}')
        print(f'  Subtotal: ${item.get("subtotal")}')
        
        # Print all meta_data entries
        meta_data = item.get('meta_data', [])
        if meta_data:
            print(f'  Meta Data:')
            for meta in meta_data:
                print(f'    {meta.get("key")}: {meta.get("value")}')
        print('')
        
    print('=== ORDER META DATA ===')
    for meta in woo_order.get('meta_data', []):
        print(f'{meta.get("key")}: {meta.get("value")}')
else:
    print('No WooCommerce debug data found')