import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreateProfileFormData } from '@/lib/validations/profile'
import { PaymentMethodType } from '@/shared/types/profile.types'

interface ReviewStepProps {
  form: UseFormReturn<CreateProfileFormData>
}

export function ReviewStep({ form }: ReviewStepProps) {
  const formData = form.getValues()

  const formatCardNumber = (cardNumber: string) => {
    if (!cardNumber) return ''
    return `**** **** **** ${cardNumber.slice(-4)}`
  }

  const getPaymentMethodLabel = (type: PaymentMethodType) => {
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Review Your Information</h3>
        <p className="text-sm text-muted-foreground">
          Please review all information before creating your profile.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name:</span>
              <span className="text-sm font-medium">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm font-medium">{formData.email}</span>
            </div>
            {formData.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phone:</span>
                <span className="text-sm font-medium">{formData.phoneNumber}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="font-medium">
                {formData.shippingAddress.firstName} {formData.shippingAddress.lastName}
              </div>
              <div>{formData.shippingAddress.addressLine1}</div>
              {formData.shippingAddress.addressLine2 && (
                <div>{formData.shippingAddress.addressLine2}</div>
              )}
              <div>
                {formData.shippingAddress.city}, {formData.shippingAddress.state}{' '}
                {formData.shippingAddress.postalCode}
              </div>
              <div>{formData.shippingAddress.country}</div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Billing Address
              {formData.useSameAddress && (
                <Badge variant="secondary" className="text-xs">
                  Same as shipping
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="font-medium">
                {formData.billingAddress.firstName} {formData.billingAddress.lastName}
              </div>
              <div>{formData.billingAddress.addressLine1}</div>
              {formData.billingAddress.addressLine2 && (
                <div>{formData.billingAddress.addressLine2}</div>
              )}
              <div>
                {formData.billingAddress.city}, {formData.billingAddress.state}{' '}
                {formData.billingAddress.postalCode}
              </div>
              <div>{formData.billingAddress.country}</div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Type:</span>
              <span className="text-sm font-medium">
                {getPaymentMethodLabel(formData.paymentMethod.type)}
              </span>
            </div>

            {(formData.paymentMethod.type === PaymentMethodType.CREDIT_CARD ||
              formData.paymentMethod.type === PaymentMethodType.DEBIT_CARD) && (
              <>
                {formData.paymentMethod.holderName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cardholder:</span>
                    <span className="text-sm font-medium">{formData.paymentMethod.holderName}</span>
                  </div>
                )}
                {formData.paymentMethod.cardNumber && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Card:</span>
                    <span className="text-sm font-medium">
                      {formatCardNumber(formData.paymentMethod.cardNumber)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expires:</span>
                  <span className="text-sm font-medium">
                    {String(formData.paymentMethod.expiryMonth).padStart(2, '0')}/
                    {formData.paymentMethod.expiryYear}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          By creating this profile, you confirm that all information provided is accurate and up to
          date. This profile will be used for retail bot operations and purchasing activities.
        </p>
      </div>
    </div>
  )
}
