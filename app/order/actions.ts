"use server";

import { redirect } from "next/navigation";
import { LEMONSQUEEZY_CHECKOUT_URL } from "@/lib/checkout";
import { createOrderWithReport } from "@/lib/orders";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitOrderForm(formData: FormData) {
  const email = getField(formData, "email");
  const socialProfileUrl = getField(formData, "socialProfileUrl");
  const industryNiche = getField(formData, "industryNiche");
  const mainConcern = getField(formData, "mainConcern");
  const additionalNotes = getField(formData, "additionalNotes");

  if (!email || !socialProfileUrl || !industryNiche || !mainConcern) {
    throw new Error("Please fill in all required fields.");
  }

  await createOrderWithReport({
    email,
    socialProfileUrl,
    industryNiche,
    mainConcern,
    additionalNotes,
  });

  redirect(LEMONSQUEEZY_CHECKOUT_URL);
}
