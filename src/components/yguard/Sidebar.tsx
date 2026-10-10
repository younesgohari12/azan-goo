import { Link, useRouterState } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { dashboardItem, navGroups, settingsItem, type NavItem } from "@/lib/nav";

function ItemLink({ item, active }: { item: NavItem; active: boolean }) {
  const cls = cn(
    "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
    active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-muted hover:text-foreground",
  );
  const inner = (
    <>
      <FontAwesomeIcon icon={item.icon} className={cn("w-4 text-[13px]", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1">{item.title}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
    </>
  );
  return item.slug === "" ? (
    <Link to="/" className={cls}>{inner}</Link>
  ) : (
    <Link to="/$section" params={{ section: item.slug }} className={cls}>{inner}</Link>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = path.replace(/^\//, "");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-64 flex-col border-l border-sidebar-border bg-sidebar transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-primary-foreground shadow-glow">
            <FontAwesomeIcon icon={faShieldHalved} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight" dir="ltr">YGuard</div>
            <div className="text-[11px] text-muted-foreground">پایش و امنیت وردپرس</div>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          <ItemLink item={dashboardItem} active={current === ""} />
          {navGroups.map((g) => {
            const isClosed = collapsed[g.title];
            return (
              <div key={g.title}>
                <button
                  onClick={() => setCollapsed((c) => ({ ...c, [g.title]: !c[g.title] }))}
                  className="mb-1 flex w-full items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {g.title}
                  <FontAwesomeIcon icon={faChevronDown} className={cn("text-[9px] transition-transform", isClosed && "rotate-90")} />
                </button>
                {!isClosed && (
                  <div className="space-y-0.5">
                    {g.items.map((i) => <ItemLink key={i.slug} item={i} active={current === i.slug} />)}
                  </div>
                )}
              </div>
            );
          })}
          <div className="border-t border-sidebar-border pt-3">
            <ItemLink item={settingsItem} active={current === settingsItem.slug} />
          </div>
        </nav>

        <div className="m-3 rounded-xl border border-sidebar-border bg-primary-soft p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold" dir="ltr">YGuard</span>
            <span className="rounded-md bg-card px-2 py-0.5 text-[10px] font-semibold text-primary" dir="ltr">Version 1.0.0</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            ساخته شده توسط <span className="font-semibold text-foreground" dir="ltr">Younes Gohari</span>
          </div>
        </div>
      </aside>
    </>
  );
}
