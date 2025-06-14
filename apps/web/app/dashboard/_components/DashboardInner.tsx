"use client";

import {
  useSharedContext,
  useTheme,
} from "@/app/dashboard/_components/DynamicSharedLayout";
import { Avatar } from "@/app/s/[videoId]/_components/tabs/Activity";
import { UpgradeModal } from "@/components/UpgradeModal";
import { buildEnv } from "@cap/env";
import {
  Command,
  CommandGroup,
  CommandItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@cap/ui";
import {
  faCrown,
  faGear,
  faHome,
  faMessage,
  faMoon,
  faSignOut,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import clsx from "clsx";
import { MoreVertical } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const titles: Record<string, string> = {
    "/dashboard/caps": "Caps",
    "/dashboard/shared-caps": "Shared Caps",
    "/dashboard/settings/organization": "Organization Settings",
    "/dashboard/settings/account": "Account Settings",
  };
  const title = titles[pathname] || "";
  const { theme, setThemeHandler } = useTheme();
  return (
    <>
      {/* Top Bar - Fixed at top with proper z-index */}
      <header
        className={clsx(
          "flex sticky z-50 justify-between items-center px-5 mt-10 w-full border-b bg-gray-1 lg:bg-transparent min-h-16 lg:min-h-10 border-gray-3 lg:border-b-0 lg:pl-0 lg:pr-5 lg:top-0 lg:relative top-[64px] lg:mt-5 lg:h-8"
        )}
      >
        <p className="relative text-xl truncate md:max-w-full text-gray-12 lg:text-2xl w-fit max-w-[150px]">
          {title}
        </p>
        <div className="flex gap-4 items-center">
          <div
            onClick={() => {
              setThemeHandler(theme === "light" ? "dark" : "light");
            }}
            className="hidden justify-center items-center bg-gradient-to-t rounded-full border transition-colors cursor-pointer lg:flex from-gray-4 to-gray-2 border-gray-4 hover:border-gray-6 hover:bg-gray-5 size-9"
          >
            <FontAwesomeIcon
              className="text-gray-12 size-3.5"
              icon={theme === "dark" ? faMoon : faSun}
            />
          </div>
          <User />
        </div>
      </header>
      {/* Content Area - Scrollable content with proper spacing */}
      <main
        className={
          "flex flex-col flex-1 p-5 pb-5 mt-5 border border-b-0 min-h-fit bg-gray-2 border-gray-3 lg:rounded-tl-2xl lg:p-8"
        }
      >
        <div className="flex flex-col flex-1 gap-4">{children}</div>
      </main>
    </>
  );
}

const User = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { user, isSubscribed } = useSharedContext();
  return (
    <>
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
      />
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <div
            data-state={menuOpen ? "open" : "closed"}
            className="flex gap-2 justify-between  items-center p-2 rounded-xl border data-[state=open]:border-gray-5 data-[state=open]:bg-gray-3 border-transparent transition-colors cursor-pointer group lg:gap-6 hover:border-gray-4"
          >
            <div className="flex items-center">
              <Avatar
                letterClass="text-xs lg:text-md"
                name={user.name ?? "User"}
                className="size-[24px] text-gray-12"
              />
              <span className="ml-2 text-sm lg:ml-2 lg:text-md text-gray-12">
                {user.name ?? "User"}
              </span>
            </div>
            <MoreVertical
              data-state={menuOpen ? "open" : "closed"}
              className="w-5 h-5 data-[state=open]:text-gray-12 transition-colors text-gray-10 group-hover:text-gray-12"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-1 w-48">
          <Command>
            <CommandGroup>
              <Link href="/home">
                <CommandItem
                  className="px-2 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer hover:bg-gray-5 group"
                  onSelect={() => {
                    setMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faHome}
                    className="mr-2 text-gray-11 transition-colors duration-300 size-3.5 group-hover:text-gray-12"
                  />
                  <span className="text-[13px] transition-colors duration-300 text-gray-11 group-hover:text-gray-12">
                    Homepage
                  </span>
                </CommandItem>
              </Link>
              {!isSubscribed && buildEnv.NEXT_PUBLIC_IS_CAP && (
                <CommandItem
                  className="px-2 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer hover:bg-gray-5 group"
                  onSelect={() => {
                    setMenuOpen(false);
                    setUpgradeModalOpen(true);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCrown}
                    className="mr-2 text-amber-400 transition-colors duration-300 size-3.5 group-hover:text-amber-500"
                  />
                  <span className="text-[13px] transition-colors duration-300 text-gray-11 group-hover:text-gray-12">
                    Upgrade to Pro
                  </span>
                </CommandItem>
              )}
              <Link href="/dashboard/settings/account">
                <CommandItem
                  className="px-2 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer hover:bg-gray-5 group"
                  onSelect={() => {
                    setMenuOpen(false);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faGear}
                    className="mr-2 text-gray-11 transition-colors duration-300 size-3.5 group-hover:text-gray-12"
                  />
                  <span className="text-[13px] transition-colors duration-300 text-gray-11 group-hover:text-gray-12">
                    Settings
                  </span>
                </CommandItem>
              </Link>
              <CommandItem
                className="px-2 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer hover:bg-gray-5 group"
                onSelect={() =>
                  window.open("https://cap.link/discord", "_blank")
                }
              >
                <FontAwesomeIcon
                  icon={faMessage}
                  className="mr-2 text-gray-11 transition-colors duration-300 size-3.5 group-hover:text-gray-12"
                />
                <span className="text-[13px] transition-colors duration-300 text-gray-11 group-hover:text-gray-12">
                  Chat Support
                </span>
              </CommandItem>
              <CommandItem
                className="px-2 py-1.5 rounded-lg transition-colors duration-300 cursor-pointer hover:bg-gray-5 group"
                onSelect={() => signOut()}
              >
                <FontAwesomeIcon
                  icon={faSignOut}
                  className="mr-2 text-gray-11 transition-colors duration-300 size-3.5 group-hover:text-gray-12"
                />
                <span className="text-[13px] transition-colors duration-300 text-gray-11 group-hover:text-gray-12">
                  Sign Out
                </span>
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};
