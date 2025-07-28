import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Edit,
  MoreVertical,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  User
} from 'lucide-react'
import { ProfileResponseDto } from '@/types/profile'
import { PaymentMethodType } from '@/shared/types/profile.types'

interface ProfileDetailsProps {
  profile: ProfileResponseDto
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export function ProfileDetails({
  profile,
  onEdit,
  onDelete,
  onToggleActive
}: ProfileDetailsProps): JSX.Element {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const formatCardNumber = (cardNumber?: string): string => {
    if (!cardNumber) return 'Not provided'
    return `**** **** **** ${cardNumber.slice(-4)}`
  }

  const getPaymentMethodLabel = (type: PaymentMethodType): string => {
    switch (type) {
      case PaymentMethodType.CREDIT_CARD:
        return 'Credit Card'
      case PaymentMethodType.DEBIT_CARD:
        return 'Debit Card'
      case PaymentMethodType.PAYPAL:
        return 'PayPal'
      case PaymentMethodType.APPLE_PAY:
        return 'Apple Pay'
      case PaymentMethodType.GOOGLE_PAY:
        return 'Google Pay'
      default:
        return type
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {profile.name}
                <Badge variant={profile.isActive ? 'default' : 'secondary'}>
                  {profile.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Created {formatDate(profile.createdAt)} • {profile.purchaseCount} purchases
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="size-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleActive}>
                  {profile.isActive ? (
                    <>
                      <ToggleLeft className="size-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleRight className="size-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <User className="size-4" />
              Personal Information
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              {profile.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{profile.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="size-4" />
              Shipping Address
            </h4>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {profile.shippingAddress.firstName} {profile.shippingAddress.lastName}
              </div>
              <div>{profile.shippingAddress.addressLine1}</div>
              {profile.shippingAddress.addressLine2 && (
                <div>{profile.shippingAddress.addressLine2}</div>
              )}
              <div>
                {profile.shippingAddress.city}, {profile.shippingAddress.state}{' '}
                {profile.shippingAddress.postalCode}
              </div>
              <div>{profile.shippingAddress.country}</div>
            </div>
          </div>

          <Separator />

          {/* Billing Address */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="size-4" />
              Billing Address
            </h4>
            <div className="text-sm space-y-1">
              <div className="font-medium">
                {profile.billingAddress?.firstName} {profile.billingAddress?.lastName}
              </div>
              <div>{profile.billingAddress?.addressLine1}</div>
              {profile.billingAddress?.addressLine2 && (
                <div>{profile.billingAddress.addressLine2}</div>
              )}
              <div>
                {profile.billingAddress?.city}, {profile.billingAddress?.state}{' '}
                {profile.billingAddress?.postalCode}
              </div>
              <div>{profile.billingAddress?.country}</div>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CreditCard className="size-4" />
              Payment Method
            </h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{getPaymentMethodLabel(profile.paymentMethod.type)}</span>
              </div>

              {(profile.paymentMethod.type === PaymentMethodType.CREDIT_CARD ||
                profile.paymentMethod.type === PaymentMethodType.DEBIT_CARD) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cardholder:</span>
                    <span>{profile.paymentMethod.holderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card:</span>
                    <span>{formatCardNumber(profile.paymentMethod.lastFourDigits)}</span>
                  </div>
                  {profile.paymentMethod.expiryMonth && profile.paymentMethod.expiryYear && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span>
                        {String(profile.paymentMethod.expiryMonth).padStart(2, '0')}/
                        {profile.paymentMethod.expiryYear}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Usage Statistics */}
          <Separator />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{profile.purchaseCount}</div>
              <div className="text-xs text-muted-foreground">Total Purchases</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {profile.lastUsedAt ? formatDate(profile.lastUsedAt) : 'Never'}
              </div>
              <div className="text-xs text-muted-foreground">Last Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{profile.name}&quot;? This action cannot be
              undone. All data associated with this profile will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete()
                setShowDeleteDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
