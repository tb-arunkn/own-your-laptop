import React from 'react';
import { LayoutDashboard, FileText, Users, UserPlus, Settings, BarChart3, ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  userRole: string;
  expandedMenus: Record<string, boolean>;
  onMenuToggle: (menu: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  userRole,
  expandedMenus,
  onMenuToggle
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['it_admin', 'finance']
    },
    {
      id: 'requests',
      label: userRole === 'finance' ? 'Manage Requests' : 'Manage Requests',
      icon: FileText,
      roles: ['it_admin', 'finance']
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      roles: ['it_admin'],
      hasSubmenu: true,
      submenu: [
        { id: 'add-user', label: 'Add User', icon: UserPlus },
        { id: 'manage-users', label: 'Manage Users', icon: Settings }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      roles: ['it_admin', 'finance']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      roles: ['it_admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole));

  const handleMenuClick = (item: any) => {
    if (item.hasSubmenu) {
      onMenuToggle(item.id);
    } else {
      onSectionChange(item.id);
    }
  };

  const handleSubmenuClick = (parentId: string, submenuId: string) => {
    onSectionChange(submenuId);
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-full">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {userRole === 'it_admin' ? 'IT Admin Panel' : 'Finance Panel'}
        </h2>
      </div>
      
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {filteredMenuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeSection === item.id || (item.hasSubmenu && item.submenu?.some(sub => activeSection === sub.id))
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
                {item.hasSubmenu && (
                  expandedMenus[item.id] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )
                )}
              </button>
              
              {item.hasSubmenu && expandedMenus[item.id] && (
                <ul className="mt-1 ml-6 space-y-1">
                  {item.submenu?.map((subItem) => (
                    <li key={subItem.id}>
                      <button
                        onClick={() => handleSubmenuClick(item.id, subItem.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                          activeSection === subItem.id
                            ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <subItem.icon className="h-4 w-4" />
                        <span>{subItem.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};