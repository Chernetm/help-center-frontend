import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdminLogged = !!localStorage.getItem("adminToken");
  const isCustomerLogged = !!localStorage.getItem("customerToken");
  const isUserLogged = isAdminLogged || isCustomerLogged;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-700 shadow-xl">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">

          {/* Logout button */}
          <div className="text-white font-extrabold text-xl tracking-wide">
            Birhanena Selam Printing Enterprise
          </div>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex space-x-8 text-white font-medium">
            {["Home", "Order Status", "Help Center", "Login"].map(
              (item) => {
                // Hide Login if already logged in
                if (item === "Login" && isUserLogged) return null;
                return (
                  <a
                    key={item}
                    href={`/${item.toLowerCase().replace(" ", "-")}`}
                    className="relative group"
                  >
                    <span className="group-hover:text-yellow-300 transition">
                      {item}
                    </span>
                    <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-yellow-300 transition-all group-hover:w-full"></span>
                  </a>
                );
              }
            )}
          </div>

          {/* MOBILE BUTTON */}
          <button
            className="md:hidden text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? (
              /* X ICON */
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* MENU ICON */
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {open && (
        <div className="md:hidden bg-indigo-700 border-t border-indigo-500">
          {["Home", "Order Status", "Help Center", "About", "Contact"].map(
            (item) => (
              <a
                key={item}
                href={`/${item.toLowerCase().replace(" ", "-")}`}
                className="block px-6 py-3 text-white hover:bg-indigo-600 transition"
                onClick={() => setOpen(false)}
              >
                {item}
              </a>
            )
          )}
        </div>
      )}
    </nav>
  );
}

