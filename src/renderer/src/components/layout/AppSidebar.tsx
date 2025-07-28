import { Home, Users, Plus, Settings, BarChart3, Shield, User } from 'lucide-react'
import { useNavigation } from '@/hooks/use-navigation'
import { type View } from '@/contexts/NavigationContext'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'

// Menu items.
const items = [
  {
    title: 'Dashboard',
    view: 'dashboard' as View,
    icon: Home
  },
  {
    title: 'Profiles',
    view: 'profiles' as View,
    icon: Users
  },
  {
    title: 'Create Profile',
    view: 'create-profile' as View,
    icon: Plus
  },
  {
    title: 'Analytics',
    view: 'analytics' as View,
    icon: BarChart3
  },
  {
    title: 'Validation',
    view: 'validation' as View,
    icon: Shield
  },
  {
    title: 'Settings',
    view: 'settings' as View,
    icon: Settings
  }
]

export function AppSidebar(): JSX.Element {
  const { currentView, setCurrentView } = useNavigation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
              onClick={() => setCurrentView('dashboard')}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-5">
                <User className="size-4 group-data-[collapsible=icon]:size-3" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">OpenCook</span>
                <span className="truncate text-xs">Retail Bot Manager</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={currentView === item.view}
                    onClick={() => setCurrentView(item.view)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User />
              <span>Admin User</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
