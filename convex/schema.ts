import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  contracts: defineTable({
    contractId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    postalCode: v.string(),
    city: v.string(),
    numberOfAircos: v.optional(v.number()),
    numberOfOutdoorUnits: v.number(),
    numberOfIndoorUnits: v.number(),
    contractType: v.union(
      v.literal("geen"),
      v.literal("basis"),
      v.literal("premium")
    ),
    paymentFrequency: v.optional(v.string()),
    iban: v.optional(v.string()),
    accountHolder: v.optional(v.string()),
    mandateDate: v.optional(v.string()),
    signature: v.optional(v.string()),
    customerNumber: v.optional(v.string()),
    lastQuoteNumber: v.optional(v.string()),
    lastInvoiceNumber: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    pdfGeneratedAt: v.optional(v.string()),
  })
    .index("by_contract_id", ["contractId"])
    .index("by_email", ["email"]),
});
