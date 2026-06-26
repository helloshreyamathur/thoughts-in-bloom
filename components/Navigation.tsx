"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/home", label: "Garden" },
  { href: "/constellation", label: "Constellation" },
  { href: "/insights", label: "Insights" },
  { href: "/analytics", label: "Analytics" },
  { href: "/archive", label: "Archive" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-[rgba(250,250,248,0.75)] border-b border-[rgba(0,0,0,0.05)] shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-2.5">
            {/* Brand mark — abstract bloom dot */}
            <div
              className="w-5 h-5 rounded-full flex-shrink-0"
              style={{
                background: "radial-gradient(circle at 35% 35%, rgba(201,160,160,0.6) 0%, rgba(160,154,201,0.4) 60%, rgba(143,175,154,0.3) 100%)",
              }}
            />
            <span className="font-serif italic text-[1.2rem] text-[#1C1C1E] tracking-[-0.01em]">
              Thoughts in Bloom
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative font-sans text-[0.75rem] tracking-[0.06em] uppercase text-[#6B6B6B] hover:text-[#1C1C1E] transition-colors duration-200"
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-[1.5px] rounded-full"
                    style={{ background: "linear-gradient(90deg, #C9A0A0, #A09AC9)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <motion.span
              animate={mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block w-5 h-[1.5px] bg-[#1C1C1E] origin-center"
              transition={{ duration: 0.2 }}
            />
            <motion.span
              animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              className="block w-5 h-[1.5px] bg-[#1C1C1E]"
              transition={{ duration: 0.15 }}
            />
            <motion.span
              animate={mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block w-5 h-[1.5px] bg-[#1C1C1E] origin-center"
              transition={{ duration: 0.2 }}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden"
            style={{
              background: "rgba(250,250,248,0.92)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex flex-col py-4 px-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className={`block py-3 font-sans text-[0.85rem] tracking-[0.04em] transition-colors ${
                      pathname === link.href ? "text-[#1C1C1E]" : "text-[#6B6B6B]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
