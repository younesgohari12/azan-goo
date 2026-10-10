import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars, faMagnifyingGlass, faBell, faBolt, faMoon, faSun, faChevronLeft, faHouse,
  faTriangleExclamation, faCircleCheck, faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { allItems, findGroup, findItem } from "@/lib/nav";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const notifications = [
  { icon: faTriangleExclamation, tone: "text-destructive", title: "۱۲ تلاش ورود ناموفق", time: "۲ دقیقه پیش" },
  { icon: faShieldHalved, tone: "text-warning", title: "افزونه Contact Form نیاز به بروزرسانی دارد", time: "۱ ساعت پیش" },
  { icon: faCircleCheck, tone: "text-success", title: "اسکن روزانه با موفقیت انجام شد", time: "۳ ساعت پیش" },
];

export function Header({ onMenu, dark, onToggleDark }: { onMenu: () => void; dark: boolean; onToggleDark: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const slug = path.replace(/^\//, "");
  const item = findItem(slug);
  const group = findGroup(slug);
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const quickScan = () => {
    setScanning(true);
    toast.message("اسکن سریع آغاز شد...");
    setTimeout(() => { setScanning(false); toast.success("اسکن کامل شد — ۲ مورد نیازمند توجه"); }, 2200);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
      <button onClick={onMenu} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden" aria-label="منو">
        <FontAwesomeIcon icon={faBars} />
      </button>

      <nav className="hidden items-center gap-2 text-[13px] text-muted-foreground md:flex">
        <Link to="/" className="hover:text-foreground"><FontAwesomeIcon icon={faHouse} className="text-xs" /></Link>
        <FontAwesomeIcon icon={faChevronLeft} className="text-[9px]" />
        <span dir="ltr">YGuard</span>
        {group && (<><FontAwesomeIcon icon={faChevronLeft} className="text-[9px]" /><span>{group.title}</span></>)}
        <FontAwesomeIcon icon={faChevronLeft} className="text-[9px]" />
        <span className="font-semibold text-foreground">{item?.title ?? "داشبورد"}</span>
      </nav>

      <div className="flex-1" />

      <button
        onClick={() => setOpen(true)}
        className="hidden h-9 w-72 items-center gap-2 rounded-lg border border-border bg-background px-3 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 sm:flex"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
        <span className="flex-1 text-right">جستجو در YGuard...</span>
        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]" dir="ltr">Ctrl K</kbd>
      </button>
      <button onClick={() => setOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted sm:hidden" aria-label="جستجو">
        <FontAwesomeIcon icon={faMagnifyingGlass} />
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="اعلان‌ها">
            <FontAwesomeIcon icon={faBell} />
            <span className="absolute left-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">۳</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0" dir="rtl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-bold">اعلان‌ها</span>
            <button className="text-xs text-primary">علامت همه به‌عنوان خوانده‌شده</button>
          </div>
          {notifications.map((n, i) => (
            <div key={i} className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-muted/60">
              <FontAwesomeIcon icon={n.icon} className={`mt-0.5 ${n.tone}`} />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{n.title}</div>
                <div className="text-[11px] text-muted-foreground">{n.time}</div>
              </div>
            </div>
          ))}
        </PopoverContent>
      </Popover>

      <button onClick={onToggleDark} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="حالت تاریک">
        <FontAwesomeIcon icon={dark ? faSun : faMoon} />
      </button>

      <button
        onClick={quickScan}
        disabled={scanning}
        className="flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        <FontAwesomeIcon icon={faBolt} className={scanning ? "animate-pulse" : ""} />
        <span className="hidden sm:inline">{scanning ? "در حال اسکن..." : "اسکن سریع"}</span>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div dir="rtl">
          <CommandInput placeholder="به کجا می‌خواهید بروید؟" />
          <CommandList>
            <CommandEmpty>نتیجه‌ای یافت نشد.</CommandEmpty>
            <CommandGroup heading="صفحات">
              {allItems.map((i) => (
                <CommandItem
                  key={i.slug}
                  value={i.title + " " + i.slug}
                  onSelect={() => {
                    setOpen(false);
                    if (i.slug === "") navigate({ to: "/" });
                    else navigate({ to: "/$section", params: { section: i.slug } });
                  }}
                  className="gap-3"
                >
                  <FontAwesomeIcon icon={i.icon} className="w-4 text-muted-foreground" />
                  <span>{i.title}</span>
                  <span className="mr-auto text-[11px] text-muted-foreground">{i.desc}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="اقدامات">
              <CommandItem onSelect={() => { setOpen(false); quickScan(); }} className="gap-3">
                <FontAwesomeIcon icon={faBolt} className="w-4 text-primary" /> اجرای اسکن سریع
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); onToggleDark(); }} className="gap-3">
                <FontAwesomeIcon icon={dark ? faSun : faMoon} className="w-4 text-muted-foreground" /> تغییر حالت نمایش
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </div>
      </CommandDialog>
    </header>
  );
}
