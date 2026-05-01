"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { loginSchema, type LoginSchema } from "@/lib/schemas/auth";
import { useAuthStore } from "@/store/auth-store";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setSession(session);
      toast.success("Bienvenido al panel");
      router.replace("/dashboard");
    },
    onError: () => {
      toast.error("No fue posible iniciar sesion");
    },
  });

  return (
    <Card className="w-full border-slate-200 shadow-lg shadow-slate-200/50">
      <CardHeader>
        <CardTitle className="text-2xl">Iniciar sesion</CardTitle>
        <CardDescription>Accede con tu cuenta para gestionar usuarios y clientes.</CardDescription>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit((data) => loginMutation.mutate(data))}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <Input id="email" type="email" autoComplete="email" placeholder="name@phonetec.com" {...register("email")} />
            {errors.email ? <p className="text-sm text-red-600">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              {...register("password")}
            />
            {errors.password ? <p className="text-sm text-red-600">{errors.password.message}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
