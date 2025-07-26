import { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CreateProfileFormData } from '@/lib/validations/profile'
import { PaymentMethodType } from '@/shared/types/profile.types'

interface PaymentStepProps {
  form: UseFormReturn<CreateProfileFormData>
}

const PAYMENT_TYPES = [
  { value: PaymentMethodType.CREDIT_CARD, label: 'Credit Card' },
  { value: PaymentMethodType.DEBIT_CARD, label: 'Debit Card' },
  { value: PaymentMethodType.PAYPAL, label: 'PayPal' },
  { value: PaymentMethodType.APPLE_PAY, label: 'Apple Pay' },
  { value: PaymentMethodType.GOOGLE_PAY, label: 'Google Pay' }
]

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, '0')
}))

const YEARS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() + i
  return { value: year, label: String(year) }
})

export function PaymentStep({ form }: PaymentStepProps) {
  const paymentType = form.watch('paymentMethod.type')
  const showCardFields =
    paymentType === PaymentMethodType.CREDIT_CARD || paymentType === PaymentMethodType.DEBIT_CARD

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Payment Information</h3>
        <p className="text-sm text-muted-foreground">
          Choose your payment method and enter the required details.
        </p>
      </div>

      <FormField
        control={form.control}
        name="paymentMethod.type"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Payment Method *</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="grid grid-cols-1 gap-4"
              >
                {PAYMENT_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <label
                      htmlFor={type.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCardFields && (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="paymentMethod.holderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cardholder Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Name on card" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentMethod.cardNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Number *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    {...field}
                    onChange={(e) => {
                      // Format card number with spaces
                      const value = e.target.value
                        .replace(/\s/g, '')
                        .replace(/(\d{4})/g, '$1 ')
                        .trim()
                      field.onChange(value)
                    }}
                    maxLength={19}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="paymentMethod.expiryMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={String(month.value)}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod.expiryYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {YEARS.map((year) => (
                        <SelectItem key={year.value} value={String(year.value)}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod.cvv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123"
                      {...field}
                      maxLength={4}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      )}

      {!showCardFields && (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {paymentType === PaymentMethodType.PAYPAL &&
              'PayPal account will be linked during checkout.'}
            {paymentType === PaymentMethodType.APPLE_PAY &&
              'Apple Pay will be configured during checkout.'}
            {paymentType === PaymentMethodType.GOOGLE_PAY &&
              'Google Pay will be configured during checkout.'}
          </p>
        </div>
      )}
    </div>
  )
}
