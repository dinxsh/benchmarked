import { NavItem } from '@/types';

export const navItems: NavItem[] = [
  {
    title: 'Leaderboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: true,
    shortcut: ['l', 'l'],
    items: []
  },
  {
    title: 'Tools',
    url: '#',
    icon: 'laptop',
    isActive: true,
    shortcut: ['t', 't'],
    items: [
      {
        title: 'Block Race',
        url: '/dashboard/race',
        shortcut: ['t', 'r'],
        icon: 'kanban'
      },
      {
        title: 'Cost Calculator',
        url: '/dashboard/calculator',
        shortcut: ['t', 'c'],
        icon: 'billing'
      },
      {
        title: 'Edge vs Cloud',
        url: '/dashboard/edge',
        shortcut: ['t', 'e'],
        icon: 'user'
      }
    ]
  },
  {
    title: 'Compare',
    url: '/dashboard/compare',
    icon: 'kanban', // Using kanban icon as placeholder for compare
    isActive: false,
    shortcut: ['c', 'c'],
    items: []
  },
  {
    title: 'Methodology',
    url: '/dashboard/methodology',
    icon: 'product', // Using product icon as placeholder for methodology
    isActive: false,
    shortcut: ['m', 'm'],
    items: []
  }
];
