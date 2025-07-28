import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  children: ReactNode
  className?: string
}

export function DashboardCard({ children, className }: DashboardCardProps): JSX.Element {
  return <Card className={cn('mb-8 p-6', className)}>{children}</Card>
}
