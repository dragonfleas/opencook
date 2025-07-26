import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PersonalInfoStep } from './steps/PersonalInfoStep'
import { AddressStep } from './steps/AddressStep'
import { PaymentStep } from './steps/PaymentStep'
import { ReviewStep } from './steps/ReviewStep'
import { createProfileSchema, type CreateProfileFormData } from '@/lib/validations/profile'

const STEPS = [
  { id: 'personal', title: 'Personal Info', description: 'Basic information' },
  { id: 'address', title: 'Address', description: 'Shipping and billing details' },
  { id: 'payment', title: 'Payment', description: 'Payment method information' },
  { id: 'review', title: 'Review', description: 'Confirm your details' }
] as const

type StepId = (typeof STEPS)[number]['id']

interface ProfileFormProps {
  onSubmit: (data: CreateProfileFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ProfileForm({ onSubmit, onCancel, isLoading = false }: ProfileFormProps) {
  const [currentStep, setCurrentStep] = useState<StepId>('personal')

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

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const handleNext = async () => {
    const stepFields = getStepFields(currentStep)
    const isStepValid = await form.trigger(stepFields)

    if (isStepValid) {
      const nextIndex = currentStepIndex + 1
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex].id)
      }
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleSubmit = form.handleSubmit(onSubmit)

  const isLastStep = currentStepIndex === STEPS.length - 1
  const isFirstStep = currentStepIndex === 0

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Profile</CardTitle>
          <CardDescription>
            Step {currentStepIndex + 1} of {STEPS.length}: {STEPS[currentStepIndex].description}
          </CardDescription>
          <Progress value={progress} className="w-full" />
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step Navigation */}
              <div className="flex justify-between items-center mb-6">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn('flex items-center', index < STEPS.length - 1 && 'flex-1')}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        index <= currentStepIndex
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={cn(
                        'ml-2 text-sm font-medium hidden sm:block',
                        index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </span>
                    {index < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'h-px flex-1 mx-4',
                          index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div className="min-h-[400px]">
                {currentStep === 'personal' && <PersonalInfoStep form={form} />}
                {currentStep === 'address' && <AddressStep form={form} />}
                {currentStep === 'payment' && <PaymentStep form={form} />}
                {currentStep === 'review' && <ReviewStep form={form} />}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div>
                  {!isFirstStep && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>

                  {isLastStep ? (
                    <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                      {isLoading ? 'Creating...' : 'Create Profile'}
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext} className="flex items-center gap-2">
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

function getStepFields(step: StepId): (keyof CreateProfileFormData)[] {
  switch (step) {
    case 'personal':
      return ['name', 'email', 'phoneNumber']
    case 'address':
      return ['shippingAddress', 'billingAddress', 'useSameAddress']
    case 'payment':
      return ['paymentMethod']
    case 'review':
      return []
    default:
      return []
  }
}
