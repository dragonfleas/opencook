import * as React from 'react'
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom'
}

const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ className, open, onOpenChange, children, ...props }, ref) => {
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
          onOpenChange(false)
        }
      }

      if (open) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
        return () => {
          document.removeEventListener('keydown', handleEscape)
          document.body.style.overflow = 'unset'
        }
      }

      return undefined
    }, [open, onOpenChange])

    if (!open) return null

    return (
      <div ref={ref} className={cn('fixed inset-0 z-50', className)} {...props}>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
        {children}
      </div>
    )
  }
)
Sheet.displayName = 'Sheet'

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = 'left', className, children, ...props }, ref) => {
    const sideClasses = {
      left: 'left-0 top-0 h-full w-80 border-r',
      right: 'right-0 top-0 h-full w-80 border-l',
      top: 'top-0 left-0 w-full h-80 border-b',
      bottom: 'bottom-0 left-0 w-full h-80 border-t'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'fixed z-50 bg-background shadow-lg transition-transform duration-300 ease-in-out',
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SheetContent.displayName = 'SheetContent'

const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between p-6 border-b', className)}
      {...props}
    />
  )
)
SheetHeader.displayName = 'SheetHeader'

const SheetTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
  )
)
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
))
SheetDescription.displayName = 'SheetDescription'

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none',
      className
    )}
    onClick={onClick}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </button>
))
SheetClose.displayName = 'SheetClose'
SheetClose.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose }
