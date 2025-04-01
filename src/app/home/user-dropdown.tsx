// src/app/home/user-dropdown.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  type ComponentType,
  type SVGProps,
} from "react";
import Image from "next/image";
import Link from "next/link";
// Import ALL possible icons that might be passed as strings
import {
  FaUserCircle,
  FaCreditCard,
  FaMapMarkerAlt,
  FaCog,
  FaSignOutAlt,
  // Add any other icons you might use in the dropdown here
} from "react-icons/fa"; // Default user icon and others

// Define the possible icon names as a type (must match strings passed from server)
type IconName = "FaCreditCard" | "FaMapMarkerAlt" | "FaCog" | "FaSignOutAlt"; // Add others if needed

// Create a map from the string name to the actual component
const iconMap: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  FaCreditCard,
  FaMapMarkerAlt,
  FaCog,
  FaSignOutAlt,
  // Add mappings for any other icons here
};

// Updated item structure to expect a string icon name
type DropdownItem = {
  label: string;
  icon: IconName; // Expects one of the string names
  href?: string;
  action?: () => Promise<void> | void; // Action prop remains the same
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

  // Toggle dropdown
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
      // Clean up listener
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup function on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // Re-run effect when isOpen changes

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Button to toggle the dropdown */}
      <div>
        <button
          type="button"
          onClick={toggleDropdown}
          className="flex items-center rounded-full bg-gray-800/50 p-1 text-sm transition-colors hover:bg-gray-700/70 focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
          id="user-menu-button"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="sr-only">Open user menu</span>
          {userImage ? (
            <Image
              className="h-8 w-8 rounded-full"
              src={userImage}
              alt={userName ? `${userName}'s avatar` : "User avatar"}
              width={32}
              height={32}
            />
          ) : (
            <FaUserCircle className="h-8 w-8 rounded-full text-gray-400" />
          )}
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="ring-opacity-5 absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          tabIndex={-1} // Generally not focusable itself, items are
        >
          <div className="py-1" role="none">
            {items.map((item, index) => {
              // Look up the actual icon component using the string name
              const IconComponent = iconMap[item.icon];

              // Basic check: if the icon name isn't found in the map, skip rendering this item
              if (!IconComponent) {
                console.warn(`Icon component not found for name: ${item.icon}`); // Optional warning
                return null;
              }

              // Conditional rendering based on href or action
              if (item.href) {
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700 hover:text-white"
                    role="menuitem"
                    tabIndex={-1} // Items are focusable
                    id={`user-menu-item-${index}`}
                    onClick={() => setIsOpen(false)} // Close on click
                  >
                    <IconComponent // Use the looked-up component
                      className="h-4 w-4 text-gray-400"
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              } else if (item.action) {
                const handleAction = async () => {
                  setIsOpen(false); // Close immediately
                  // Server actions passed as props are handled correctly by Next.js
                  await item.action!(); // Then execute action
                };
                return (
                  <button
                    key={index}
                    onClick={handleAction}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-200 transition-colors hover:bg-gray-700 hover:text-white"
                    role="menuitem"
                    tabIndex={-1}
                    id={`user-menu-item-${index}`}
                  >
                    <IconComponent // Use the looked-up component
                      className="h-4 w-4 text-gray-400"
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return null; // Should not happen if items are structured correctly
            })}
          </div>
        </div>
      )}
    </div>
  );
}
