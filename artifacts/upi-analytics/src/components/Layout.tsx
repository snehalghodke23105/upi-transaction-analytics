import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShieldAlert, Search } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/fraud", label: "Fraud Intelligence", icon: ShieldAlert },
    { href: "/explorer", label: "Transaction Explorer", icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-card flex-shrink-0">
        <div className="p-4 border-b h-16 flex items-center">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center mr-3 text-white font-bold">
            U
          </div>
          <h2 className="font-bold text-lg">UPI Analytics</h2>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  location === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-0">
        {children}
      </main>
    </div>
  );
}
