import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import {
  orderLookupRequestSchema,
  type OrderLookupRequest,
} from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Navbar from "@/components/Navbar";

export default function OrderLookup() {
  const [, setLocation] = useLocation();

  const form = useForm<OrderLookupRequest>({
    resolver: zodResolver(orderLookupRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: OrderLookupRequest) => {
    // Navigate to results page with email as parameter
    setLocation(`/${encodeURIComponent(data.email)}/orders`);
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url('https://viralprofits.yt/wp-content/uploads/2025/02/Mask-group-1.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Navbar title="Viral Profits | Order Management" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                Manage your orders
              </h2>
              <p className="text-slate-600 text-sm px-4 sm:px-0 sm:max-w-[60%] sm:mx-auto">
                Enter the email address you used for your purchase
              </p>
            </div>

            <div className="max-w-[50%] mx-auto">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="customer@example.com"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 w-full text-white px-6 py-3 rounded-lg font-bold inline-flex items-center justify-center space-x-2"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find my order
                  </Button>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
