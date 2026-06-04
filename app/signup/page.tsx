"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

type FormValues = z.infer<typeof formSchema>

export default function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  })

  const router = useRouter()

  const onSubmit = async (data: FormValues) => {
    await authClient.signUp.email(
      {
        email: data.email,
        password: data.password,
        name: data.name,
      },
      {
        onSuccess: () => {
          toast.success("Account created successfully")
          router.push("/")
        },
        onError: (error) => {
          console.log("Error", error.error.message)
          toast.error("Failed to create account", {
            description: error.error.message,
          })
        },
      }
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create an account
            </CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your details below to get started today.
          </CardDescription>
        </CardHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-6">
            <FieldGroup className="space-y-5">
              <Field>
                <FieldLabel htmlFor="name" className="text-sm font-medium">
                  Full Name
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  className="mt-1.5"
                  {...register("name")}
                />
                {errors.name ? (
                  <FieldError className="mt-1 text-xs">
                    {errors.name.message}
                  </FieldError>
                ) : (
                  <FieldDescription className="mt-1 text-xs text-muted-foreground">
                    Your publicly visible display name.
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium">
                  Email Address
                </FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className="mt-1.5"
                  {...register("email")}
                />
                {errors.email ? (
                  <FieldError className="mt-1 text-xs">
                    {errors.email.message}
                  </FieldError>
                ) : (
                  <FieldDescription className="mt-1 text-xs text-muted-foreground"></FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-sm font-medium">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  className="mt-1.5"
                  {...register("password")}
                />
                {errors.password ? (
                  <FieldError className="mt-1 text-xs">
                    {errors.password.message}
                  </FieldError>
                ) : (
                  <FieldDescription className="mt-1 text-xs text-muted-foreground">
                    Must be at least 8 characters long.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? "Creating account…" : "Sign Up"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <a
                href="/signin"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
