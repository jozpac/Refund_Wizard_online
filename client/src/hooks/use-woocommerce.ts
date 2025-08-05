import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { OrderLookupRequest, OrderLookupResponse } from "@shared/schema";

export function useOrderLookup() {
  return useMutation({
    mutationFn: async (data: OrderLookupRequest) => {
      const response = await apiRequest("POST", "/api/orders/lookup", data);
      return response.json() as Promise<OrderLookupResponse>;
    },
  });
}

export function useWooCommerceConnectionTest() {
  return useQuery({
    queryKey: ["/api/woocommerce/test"],
    enabled: false, // Only run when explicitly triggered
  });
}
