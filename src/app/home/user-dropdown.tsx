"use client";

import React, {
  useState,
  useEffect,
  useRef,
  type ComponentType,
  type SVGProps,
} from "react";
import Link from "next/link";

import {
  FaUserCircle,
  FaCreditCard,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaTrashAlt,
} from "react-icons/fa";

type IconName =
  | "FaCreditCard"
  | "FaMapMarkerAlt"
  | "FaTrashAlt"
  | "FaSignOutAlt";

const iconMap: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  FaCreditCard,
  FaMapMarkerAlt,
  FaTrashAlt,
  FaSignOutAlt,
};

type DropdownItem = {
  label: string;
  icon: IconName;
  href?: string;
};

type UserDropdownProps = {
  userImage?: string | null;
  userName?: string | null;
  items: DropdownItem[];
};

export default function UserDropdown({
  userImage,
  userName,
  items,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown container

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If the dropdown ref exists and the click was outside the dropdown element
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // Re-run effect when isOpen changes

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          className="flex items-center rounded-full bg-gray-800/50 p-1 text-sm transition-all duration-200 ease-in-out select-none hover:cursor-pointer hover:bg-gray-700/70 hover:shadow-md focus:outline-none"
          id="user-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="sr-only">Open user menu</span>
          {userImage ? (
            // sorry Vercel, not bankrupting me this time
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-8 w-8 rounded-full border-2 border-gray-700 shadow-md select-none"
              src={userImage}
              alt={userName ? `${userName}'s avatar` : "User avatar"}
              width={32}
              height={32}
              draggable="false"
            />
          ) : (
            <FaUserCircle className="h-8 w-8 rounded-full text-gray-400 transition-colors select-none hover:text-gray-300" />
          )}
        </button>
      </div>

      {isOpen && (
        <div
          className="ring-opacity-5 absolute right-0 z-10 mt-2 w-56 origin-top-right overflow-hidden rounded-md border border-gray-700 bg-gray-800 shadow-lg ring-1 ring-black transition-opacity duration-200 ease-in-out focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1} // Generally not focusable itself, items are
        >
          {userName && (
            <div className="border-b border-gray-700 bg-gray-900 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>
            </div>
          )}
          <div className="py-1" role="none">
            {items.map((item, index) => {
              const IconComponent = iconMap[item.icon];

              // Basic check: if the icon name isn't found in the map, skip rendering this item
              if (!IconComponent) {
                console.warn(`Icon component not found for name: ${item.icon}`);
                return null;
              }

              const content = (
                <>
                  <IconComponent
                    className="h-4 w-4 text-gray-400 transition-colors group-hover:text-white"
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </>
              );

              return item.href ? (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 transition-colors hover:scale-[1.02] hover:bg-gray-700 hover:text-white active:scale-100"
                  role="menuitem"
                  tabIndex={-1} // Items are focusable
                  id={`user-menu-item-${index}`}
                  onClick={() => setIsOpen(false)} // Close on click
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 transition-colors hover:scale-[1.02] hover:bg-gray-700 hover:text-white active:scale-100"
                  role="menuitem"
                  tabIndex={-1}
                  id={`user-menu-item-${index}`}
                  onClick={() => setIsOpen(false)}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
