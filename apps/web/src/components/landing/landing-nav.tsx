'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const anchorLinks = [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Visio', href: '#visio' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'À propos', href: '#trust' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-warm-white/90 backdrop-blur-md shadow-sm border-b border-cream-200'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-playfair text-xl font-bold text-charcoal group-hover:text-sage transition-colors">
            PsyLib
          </span>
          <span className="hidden sm:block text-xs text-charcoal-300 font-dm-sans border-l border-charcoal-200 pl-2">
            Conforme HDS
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {anchorLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
            >
              {label}
            </a>
          ))}
          <Link
            href="/trouver-mon-psy"
            className="text-sm font-medium text-sage hover:text-sage-600 transition-colors"
          >
            Trouver un psy
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
          >
            Blog
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-charcoal-400 hover:text-charcoal transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/beta"
            className="inline-flex items-center px-5 py-2.5 rounded-full bg-terracotta text-white text-sm font-medium hover:bg-terracotta-600 transition-colors shadow-sm"
          >
            Devenir Fondateur
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-charcoal hover:bg-cream transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-warm-white border-t border-cream-200 px-6 py-4 space-y-4">
          {anchorLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-charcoal-500 hover:text-charcoal py-1"
            >
              {label}
            </a>
          ))}
          <Link
            href="/trouver-mon-psy"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-sage hover:text-sage-600 py-1"
          >
            Trouver un psy
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileOpen(false)}
            className="block text-sm font-medium text-charcoal-500 hover:text-charcoal py-1"
          >
            Blog
          </Link>
          <Link
            href="/beta"
            className="block w-full text-center px-5 py-3 rounded-full bg-terracotta text-white text-sm font-medium hover:bg-terracotta-600 transition-colors mt-2"
          >
            Devenir Fondateur
          </Link>
        </div>
      )}
    </header>
  );
}
