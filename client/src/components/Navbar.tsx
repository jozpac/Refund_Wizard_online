import { Shield } from "lucide-react";
import { useLocation } from "wouter";

interface NavbarProps {
  title: string;
  showSecureConnection?: boolean;
}

export default function Navbar({ title, showSecureConnection = true }: NavbarProps) {
  const [, setLocation] = useLocation();
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => setLocation("/")}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: "#262B37" }}
            >
              <img
                src="https://viralprofits.yt/favicon.ico"
                alt="Viral Profits"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = '<svg class="text-white w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2a1 1 0 0 0-2 0v2H8V2a1 1 0 0 0-2 0v2H5a3 3 0 0 0-3 3v14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2H4V7zm16 14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9h16v9z"/></svg>';
                  }
                }}
              />
            </div>
            <h1 className="text-base font-bold text-slate-800">
              <span className="sm:hidden">Viral Profits | Orders</span>
              <span className="hidden sm:inline">Viral Profits | Order Management</span>
            </h1>
          </div>
          {showSecureConnection && (
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-slate-500">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Secure Connection</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}