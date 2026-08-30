import {
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings as SettingsIcon,
  UsersRound,
  UserRoundCog,
  X,
} from "lucide-react";

import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";

const navigation = [
  ["/dashboard", LayoutDashboard, "Overview"],
  ["/students", UsersRound, "Students"],
  ["/placement-team", UserRoundCog, "Placement Team"],
  ["/companies", Building2, "Companies"],
  ["/drives", BriefcaseBusiness, "Placement Drives"],
  ["/applications", ClipboardList, "Applications"],
  ["/reports", FileBarChart2, "Reports"],
  ["/audit", ScrollText, "Audit Log"],
  ["/notifications", Bell, "Notifications"],
  ["/settings", SettingsIcon, "Settings"],
];

const titles = {
  "/dashboard": [
    "Overview",
    "Placement operations at a glance",
  ],
  "/students": [
    "Students",
    "Student records, eligibility and placement outcomes",
  ],
  "/placement-team": [
    "Placement Team",
    "Coordinate responsibilities across placement operations",
  ],
  "/recruiters": [
    "Recruiters",
    "Company relationships and recruitment momentum",
  ],
  "/companies": [
    "Companies",
    "Company management, recruiters, drives and placement tracking",
  ],
  "/drives": [
    "Placement Drives",
    "Manage active opportunities and recruitment timelines",
  ],
  "/applications": [
    "Applications",
    "Monitor the candidate pipeline across placement drives",
  ],
  "/reports": [
    "Reports",
    "Placement intelligence and outcome reporting",
  ],
  "/audit": [
    "Audit Log",
    "Trace operational actions across R-PORTAL",
  ],
  "/notifications": [
    "Notifications",
    "Operational updates requiring attention",
  ],
  "/settings": [
    "Settings",
    "Manage profile, security, appearance, notifications, and application preferences",
  ],
};

export default function AppShell({ user, onSignOut, onUserUpdated }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const location = useLocation();

  const [title, description] =
    titles[location.pathname] || titles["/dashboard"];

  useEffect(() => {
    let active = true;

    api
      .get("/notifications/unread-count")
      .then(({ data }) => {
        if (active) {
          setUnread(data.unread_count || 0);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <div className="portal-shell">
      {/* SIDEBAR */}
      <aside
        className={
          open ? "sidebar sidebar-open" : "sidebar"
        }
      >
        <div className="sidebar-brand">
          <img
            src="/rathinam-logo.png"
            alt="Rathinam College"
            className="sidebar-college-logo"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px 4px',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />

          <span>
            <b>R-PORTAL</b>
            <small>Placement Operations</small>
          </span>

          <button
            className="mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          {navigation.map(([to, Icon, label]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <NavLink to="/settings" className="sidebar-user" title="Open Settings">
          <div className="avatar">
            {user?.full_name
              ?.slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <b>{user?.full_name || "User"}</b>
            <small>{user?.role || "User"}</small>
          </div>
        </NavLink>

        <button
          className="signout"
          onClick={onSignOut}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      {/* MAIN AREA */}
      <div className="shell-main">
        {/* TOP BAR */}
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <div className="topbar-user">
            <NavLink
              to="/notifications"
              aria-label="Notifications"
              className="notification-bell"
            >
              <Bell size={19} />

              {unread > 0 && (
                <span>
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </NavLink>

            <NavLink to="/settings" className="topbar-user-link" title="Open Settings" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <div className="avatar">
                {user?.full_name
                  ?.slice(0, 1)
                  .toUpperCase()}
              </div>

              <span>
                {user?.full_name || "User"}
              </span>
            </NavLink>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="content">
          <Outlet context={{ user, onSignOut, onUserUpdated }} />
        </main>
      </div>
    </div>
  );
}