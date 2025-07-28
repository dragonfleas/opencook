import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Mail,
  CreditCard,
  MapPin,
  Shield
} from 'lucide-react'
import { ProfileResponseDto } from '@/types/profile'

interface ValidationResult {
  field: string
  label: string
  status: 'valid' | 'invalid' | 'warning' | 'pending'
  message: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProfileValidationProps {
  profile: ProfileResponseDto
  onRevalidate: () => void
  isValidating?: boolean
}

export function ProfileValidation({
  profile,
  onRevalidate,
  isValidating = false
}: ProfileValidationProps): JSX.Element {
  const [lastValidated] = useState(new Date().toISOString())

  const validateProfile = (): ValidationResult[] => {
    const results: ValidationResult[] = []

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    results.push({
      field: 'email',
      label: 'Email Address',
      status: emailRegex.test(profile.email) ? 'valid' : 'invalid',
      message: emailRegex.test(profile.email) ? 'Valid email format' : 'Invalid email format',
      icon: Mail
    })

    // Phone number validation (if provided)
    if (profile.phoneNumber) {
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/
      results.push({
        field: 'phoneNumber',
        label: 'Phone Number',
        status: phoneRegex.test(profile.phoneNumber) ? 'valid' : 'warning',
        message: phoneRegex.test(profile.phoneNumber)
          ? 'Valid phone number format'
          : 'Phone number format may be invalid',
        icon: Shield
      })
    }

    // Address validation
    const hasRequiredAddressFields =
      profile.shippingAddress.addressLine1 &&
      profile.shippingAddress.city &&
      profile.shippingAddress.state &&
      profile.shippingAddress.postalCode &&
      profile.shippingAddress.country

    results.push({
      field: 'shippingAddress',
      label: 'Shipping Address',
      status: hasRequiredAddressFields ? 'valid' : 'invalid',
      message: hasRequiredAddressFields
        ? 'All required address fields provided'
        : 'Missing required address fields',
      icon: MapPin
    })

    // Billing address validation
    if (profile.billingAddress) {
      const hasBillingFields =
        profile.billingAddress.addressLine1 &&
        profile.billingAddress.city &&
        profile.billingAddress.state &&
        profile.billingAddress.postalCode &&
        profile.billingAddress.country

      results.push({
        field: 'billingAddress',
        label: 'Billing Address',
        status: hasBillingFields ? 'valid' : 'invalid',
        message: hasBillingFields
          ? 'All required billing fields provided'
          : 'Missing required billing fields',
        icon: MapPin
      })
    }

    // Payment method validation
    const hasPaymentInfo = profile.paymentMethod.type
    let paymentStatus: 'valid' | 'invalid' | 'warning' = 'valid'
    let paymentMessage = 'Payment method configured'

    if (!hasPaymentInfo) {
      paymentStatus = 'invalid'
      paymentMessage = 'No payment method configured'
    } else if (
      profile.paymentMethod.type === 'CREDIT_CARD' ||
      profile.paymentMethod.type === 'DEBIT_CARD'
    ) {
      if (!profile.paymentMethod.holderName || !profile.paymentMethod.lastFourDigits) {
        paymentStatus = 'warning'
        paymentMessage = 'Incomplete card information'
      }
    }

    results.push({
      field: 'paymentMethod',
      label: 'Payment Method',
      status: paymentStatus,
      message: paymentMessage,
      icon: CreditCard
    })

    // Profile completeness check
    const completenessScore =
      (results.filter((r) => r.status === 'valid').length / results.length) * 100
    results.push({
      field: 'completeness',
      label: 'Profile Completeness',
      status: completenessScore >= 80 ? 'valid' : completenessScore >= 60 ? 'warning' : 'invalid',
      message: `${Math.round(completenessScore)}% complete`,
      icon: CheckCircle
    })

    return results
  }

  const validationResults = validateProfile()
  const overallStatus = validationResults.some((r) => r.status === 'invalid')
    ? 'invalid'
    : validationResults.some((r) => r.status === 'warning')
      ? 'warning'
      : 'valid'

  const validCount = validationResults.filter((r) => r.status === 'valid').length
  const totalCount = validationResults.length
  const progressPercentage = (validCount / totalCount) * 100

  const getStatusIcon = (status: ValidationResult['status']): JSX.Element => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="size-4 text-green-600" />
      case 'invalid':
        return <XCircle className="size-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="size-4 text-yellow-600" />
      case 'pending':
        return <Clock className="size-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string): JSX.Element => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid</Badge>
      case 'invalid':
        return <Badge variant="destructive">Invalid</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Profile Validation
              {getStatusBadge(overallStatus)}
            </CardTitle>
            <CardDescription>Last validated: {formatDate(lastValidated)}</CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRevalidate}
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`size-4 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Revalidate'}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Validation Progress</span>
            <span>
              {validCount}/{totalCount} checks passed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {validationResults.map((result, index) => {
          const IconComponent = result.icon

          return (
            <div key={result.field}>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <IconComponent className="size-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{result.label}</div>
                    <div className="text-xs text-muted-foreground">{result.message}</div>
                  </div>
                </div>
                {getStatusIcon(result.status)}
              </div>
              {index < validationResults.length - 1 && <Separator />}
            </div>
          )
        })}

        {overallStatus === 'invalid' && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 border border-red-200">
            <div className="flex items-start gap-3">
              <XCircle className="size-5 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-red-800 text-sm">Validation Failed</div>
                <div className="text-red-700 text-sm">
                  This profile has validation errors that must be resolved before it can be used for
                  retail operations.
                </div>
              </div>
            </div>
          </div>
        )}

        {overallStatus === 'warning' && (
          <div className="mt-6 rounded-lg bg-yellow-50 p-4 border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-yellow-800 text-sm">Validation Warnings</div>
                <div className="text-yellow-700 text-sm">
                  This profile has some warnings. While it can be used, addressing these issues will
                  improve reliability.
                </div>
              </div>
            </div>
          </div>
        )}

        {overallStatus === 'valid' && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 border border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-600 mt-0.5" />
              <div className="space-y-1">
                <div className="font-medium text-green-800 text-sm">Profile Valid</div>
                <div className="text-green-700 text-sm">
                  This profile has passed all validation checks and is ready for retail operations.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
