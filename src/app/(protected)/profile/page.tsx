"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, Pencil, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/store/auth-store";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  const meQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: authApi.me,
  });

  const profile = meQuery.data;
  const initials = profile
    ? `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase()
    : "??";

  // ── Edit profile ──────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  function startEditing() {
    if (!profile) return;
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEditing(true);
  }

  const updateMutation = useMutation({
    mutationFn: (data: { firstName: string; lastName: string }) =>
      usersApi.update(profile!.id, data),
    onSuccess: (updated) => {
      toast.success("Perfil actualizado");
      setUser(updated);
      queryClient.setQueryData(["profile", "me"], updated);
      setEditing(false);
    },
    onError: () => toast.error("No se pudo actualizar el perfil"),
  });

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({ firstName: firstName.trim(), lastName: lastName.trim() });
  }

  // ── Change password ───────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: usersApi.changeMyPassword,
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () =>
      toast.error("No se pudo cambiar la contraseña. Verifica la contraseña actual."),
  });

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu información personal y seguridad.</p>
      </div>

      {/* Avatar + info header */}
      <Card>
        <CardContent className="flex items-center gap-5 py-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {meQuery.isPending ? "…" : initials}
          </div>
          <div className="space-y-1">
            {meQuery.isPending ? (
              <>
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-4 w-56 animate-pulse rounded bg-muted" />
              </>
            ) : profile ? (
              <>
                <p className="text-lg font-semibold text-foreground">
                  {profile.firstName} {profile.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {profile.role}
                </span>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">
            <UserRound className="size-3.5" />
            Mi perfil
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <KeyRound className="size-3.5" />
            Seguridad
          </TabsTrigger>
        </TabsList>

        {/* ── Mi perfil ── */}
        <TabsContent value="perfil" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Información personal</CardTitle>
              {!editing && (
                <Button variant="outline" size="sm" onClick={startEditing} disabled={!profile}>
                  <Pencil />
                  Editar
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {meQuery.isError && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  No fue posible cargar el perfil.
                </p>
              )}

              {editing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Correo electrónico</Label>
                    <Input value={profile?.email ?? ""} disabled />
                    <p className="text-xs text-muted-foreground">El correo no puede modificarse aquí.</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      <Save />
                      {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditing(false)}
                      disabled={updateMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-0">
                  <ProfileField label="Nombre" value={profile?.firstName} loading={meQuery.isPending} />
                  <ProfileField label="Apellido" value={profile?.lastName} loading={meQuery.isPending} />
                  <ProfileField label="Correo electrónico" value={profile?.email} loading={meQuery.isPending} />
                  <ProfileField label="Rol" value={profile?.role} loading={meQuery.isPending} />
                  <ProfileField
                    label="Estado"
                    value={profile ? (profile.isActive ? "Activo" : "Inactivo") : undefined}
                    loading={meQuery.isPending}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Seguridad ── */}
        <TabsContent value="seguridad" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="max-w-sm space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <PasswordInput
                    id="currentPassword"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    show={showCurrent}
                    onToggle={() => setShowCurrent((v) => !v)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                  />
                </div>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending ? "Actualizando…" : "Actualizar contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ProfileField({
  label,
  value,
  loading,
}: {
  label: string;
  value?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {loading ? (
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      ) : (
        <span className="text-sm font-medium text-foreground">{value ?? "—"}</span>
      )}
    </div>
  );
}

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}

function PasswordInput({ id, value, onChange, show, onToggle }: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10"
        required
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
