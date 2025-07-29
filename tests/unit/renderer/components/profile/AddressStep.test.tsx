import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AddressStep } from '@/components/profile/steps/AddressStep'
import { createProfileSchema, type CreateProfileFormData } from '@/lib/validations/profile'
import { Form } from '@/components/ui/form'

function AddressStepWrapper(): JSX.Element {
  const form = useForm<CreateProfileFormData>({
    resolver: zodResolver(createProfileSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      shippingAddress: {
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US'
      },
      billingAddress: {
        firstName: '',
        lastName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US'
      },
      useSameAddress: true,
      paymentMethod: {
        type: 'CREDIT_CARD',
        cardNumber: '',
        expiryMonth: 1,
        expiryYear: new Date().getFullYear(),
        cvv: '',
        holderName: ''
      }
    }
  })

  return (
    <Form {...form}>
      <AddressStep form={form} />
    </Form>
  )
}

describe('AddressStep', () => {
  it('should display "Same as billing" checkbox label', () => {
    render(<AddressStepWrapper />)

    expect(screen.getByText('Same as billing')).toBeInTheDocument()
  })

  it('should hide billing address fields when checkbox is checked by default', () => {
    render(<AddressStepWrapper />)

    // Should not find billing address heading when checkbox is checked
    expect(screen.queryByText('Billing Address')).not.toBeInTheDocument()
  })

  it('should have checkbox checked by default', () => {
    render(<AddressStepWrapper />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })
})
