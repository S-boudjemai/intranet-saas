import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parseJwt, type JwtPayload } from "../utils/jwt";
import Button from "./ui/Button";
import NotificationBadge from "./NotificationBadge";
import { useNotifications } from "../contexts/NotificationContext";
import GlobalSearch from "./GlobalSearch";
import { useServiceWorker } from "../hooks/useServiceWorker";

const MenuIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    className="h-6 w-6" 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    {isOpen ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    )}
  </svg>
);

export default function MobileNav() {
  const { token, logout } = useAuth();
  const { notificationCounts, markAllAsRead } = useNotifications();
  const { isOnline } = useServiceWorker();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const raw = token ? parseJwt<JwtPayload>(token) : null;
  const canManage = raw?.role === "manager" || raw?.role === "admin";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleLinkClick = async (type?: string) => {
    setIsOpen(false);
    if (type === 'documents') await markAllAsRead('document_uploaded');
    if (type === 'tickets') await markAllAsRead('ticket_created');
    if (type === 'announcements') await markAllAsRead('announcement_posted');
  };

  const linkClasses = "block px-4 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border";
  const activeLinkClasses = "bg-secondary text-secondary-foreground";

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
        <div className="flex items-center space-x-3">
          <Link
            to={canManage ? "/dashboard" : "/documents"}
            className="text-xl font-bold text-foreground tracking-wider"
            onClick={() => setIsOpen(false)}
          >
            FRANCHISE<span className="text-primary">HUB</span>
          </Link>
          
          {/* Online/Offline Indicator */}
          <div className="flex items-center space-x-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          <MenuIcon isOpen={isOpen} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="fixed top-0 right-0 h-full w-80 max-w-full bg-background z-50 shadow-xl animate-slide-in-right">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-lg font-semibold">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md hover:bg-accent transition-colors"
              >
                <MenuIcon isOpen={true} />
              </button>
            </div>

            <div className="p-4">
              <GlobalSearch />
            </div>

            <nav className="overflow-y-auto">
              {canManage && (
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `${linkClasses} ${isActive ? activeLinkClasses : ""}`
                  }
                  onClick={() => handleLinkClick()}
                >
                  Dashboard
                </NavLink>
              )}
              
              <NavLink
                to="/documents"
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ""} relative`
                }
                onClick={() => handleLinkClick('documents')}
              >
                <span className="flex items-center justify-between">
                  Documents
                  <NotificationBadge count={notificationCounts.documents || 0} />
                </span>
              </NavLink>

              <NavLink
                to="/tickets"
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ""} relative`
                }
                onClick={() => handleLinkClick('tickets')}
              >
                <span className="flex items-center justify-between">
                  Tickets
                  <NotificationBadge count={notificationCounts.tickets || 0} />
                </span>
              </NavLink>

              <NavLink
                to="/announcements"
                className={({ isActive }) =>
                  `${linkClasses} ${isActive ? activeLinkClasses : ""} relative`
                }
                onClick={() => handleLinkClick('announcements')}
              >
                <span className="flex items-center justify-between">
                  Annonces
                  <NotificationBadge count={notificationCounts.announcements || 0} />
                </span>
              </NavLink>

              {canManage && (
                <>
                  <NavLink
                    to="/audits"
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : ""}`
                    }
                    onClick={() => handleLinkClick()}
                  >
                    Audits
                  </NavLink>

                  <NavLink
                    to="/planning"
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : ""}`
                    }
                    onClick={() => handleLinkClick()}
                  >
                    Planning
                  </NavLink>
                </>
              )}

              {canManage && (
                <>

                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `${linkClasses} ${isActive ? activeLinkClasses : ""}`
                    }
                    onClick={() => handleLinkClick()}
                  >
                    Utilisateurs
                  </NavLink>
                </>
              )}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}