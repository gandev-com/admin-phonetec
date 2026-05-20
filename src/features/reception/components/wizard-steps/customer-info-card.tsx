"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, StickyNote, User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Customer } from "@/types/customer";

export function CustomerInfoCard({ customer }: { customer: Customer }) {
  const fullName = [customer.firstName, customer.lastName, customer.secondLastName]
    .filter(Boolean)
    .join(" ");
  const initials = `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase();
  const location = [customer.address, customer.postalCode, customer.city, customer.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {customer.documentType} {customer.document}
            </p>
          </div>
        </div>
        <Link
          href={`/customers/${customer.id}`}
          target="_blank"
          className={buttonVariants({ variant: "ghost", size: "xs" })}
        >
          <User className="h-3 w-3" />
          Perfil
        </Link>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span className="text-foreground">{customer.phone1}</span>
        </div>

        {customer.phone2 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">{customer.phone2}</span>
            <span className="text-muted-foreground">(alt.)</span>
          </div>
        ) : null}

        {customer.email ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-foreground">{customer.email}</span>
          </div>
        ) : null}

        {location ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground sm:col-span-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="text-foreground">{location}</span>
          </div>
        ) : null}
      </div>

      {customer.internalNotes ? (
        <>
          <Separator />
          <div className="flex items-start gap-2 text-xs">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <p className="text-muted-foreground">{customer.internalNotes}</p>
          </div>
        </>
      ) : null}
    </div>
  );
}
