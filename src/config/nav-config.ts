import { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Leaderboard',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: true,
    shortcut: ['l', 'l'],
    items: []
  },
  {
    title: 'Cost Calculator',
    url: '/dashboard/calculator',
    shortcut: ['t', 'c'],
    icon: 'billing',
    isActive: false,
    items: []
  },
  {
    title: 'Compare',
    url: '/dashboard/compare',
    icon: 'kanban',
    isActive: false,
    shortcut: ['c', 'c'],
    items: []
  },
  {
    title: 'Token Price',
    url: '/dashboard/token-price',
    icon: 'billing',
    isActive: false,
    shortcut: ['t', 'p'],
    items: []
  }
];
