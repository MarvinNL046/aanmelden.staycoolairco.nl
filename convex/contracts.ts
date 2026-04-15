import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const submit = mutation({
  args: {
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
  },
  returns: v.id("contracts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("contracts", {
      ...args,
      pdfGeneratedAt: args.pdfStorageId ? new Date().toISOString() : undefined,
    });
  },
});

export const getPdfUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getByContractId = query({
  args: { contractId: v.string() },
  handler: async (ctx, args) => {
    const contract = await ctx.db
      .query("contracts")
      .withIndex("by_contract_id", (q) => q.eq("contractId", args.contractId))
      .first();
    if (!contract) return null;
    const pdfUrl = contract.pdfStorageId
      ? await ctx.storage.getUrl(contract.pdfStorageId)
      : null;
    return { ...contract, pdfUrl };
  },
});
