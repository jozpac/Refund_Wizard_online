import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Homepage from "@/pages/homepage";
import OrderLookup from "@/pages/order-lookup";
import OrderResults from "@/pages/order-results";
import RefundOptions from "@/pages/refund-options";
import RefundRequest from "@/pages/refund-request";
import FullRefundRequest from "@/pages/full-refund-request";
import Finish from "@/pages/finish";
import RefundSuccess from "@/pages/refund-success";
import RefundFailed from "@/pages/refund-failed";
import GHLTest from "@/pages/ghl-test";
import NotFound from "@/pages/not-found";
import Footer from "@/components/Footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Homepage} />
      <Route path="/search" component={OrderLookup} />
      <Route path="/:userId/orders" component={OrderResults} />
      <Route path="/refund-options" component={RefundOptions} />
      <Route path="/refund-request" component={RefundRequest} />
      <Route path="/full-refund-request" component={FullRefundRequest} />
      <Route path="/finish" component={Finish} />
      <Route path="/refund-success" component={RefundSuccess} />
      <Route path="/refund-failure" component={RefundFailed} />
      <Route path="/ghl-test" component={GHLTest} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Toaster />
            <Router />
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
