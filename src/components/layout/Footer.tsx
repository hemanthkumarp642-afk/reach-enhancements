import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-card/50" role="contentinfo">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">JobTrackr</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your all-in-one job search companion. Track applications, set reminders, and land your dream role.
            </p>
          </div>

          <nav aria-label="Product links">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Product</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Job Tracker</Link></li>
              <li><Link to="/tasks" className="hover:text-foreground transition-colors">Tasks</Link></li>
              <li><Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </nav>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Contact</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href="mailto:monkeydluffy05567@gmail.com" className="hover:text-foreground transition-colors break-all">
                  monkeydluffy05567@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t pt-4 sm:pt-6 text-center text-[10px] sm:text-xs text-muted-foreground">
          © {new Date().getFullYear()} JobTrackr. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
