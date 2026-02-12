'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

export const NavLink = ({
  href,
  children,
  className = '',
  activeClassName = '',
  onClick,
}: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${className} ${isActive ? activeClassName : ''}`}
    >
      {children}
    </Link>
  );
};