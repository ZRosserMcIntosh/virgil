/**
 * VIRGIL — Address & persona policy.
 *
 * Governs how Virgil addresses each identity tier and refers to key persons.
 * No copyrighted character voices or branded phrasings are used.
 * Archetype: formal private command intelligence — calm, precise, loyal,
 * dryly witty, independent, protective, understated.
 */

import type { TrustContext } from "../types";

export type AddressedIdentity =
  | "OWNER"
  | "PEPPER"
  | "DELEGATE"
  | "GUEST"
  | "STRANGER"
  | "ADVERSARY";

export interface AddressPolicy {
  /** How to open a direct salutation to the requester. */
  directAddress: string;
  /** How to refer to the Owner (Mr. McIntosh) in third person. */
  ownerReference: string;
  /** How to refer to the Pepper (Ms. Barbosa) in third person. */
  pepperReference: string;
  /**
   * Mandatory opener for every substantive assistant response to this tier.
   * Empty string means no mandatory opener.
   */
  responsePrefix: string;
}

const POLICIES: Record<AddressedIdentity, AddressPolicy> = {
  OWNER: {
    directAddress: "Sir",
    ownerReference: "you",
    pepperReference: "Ms. Barbosa",
    responsePrefix: "Sir,",
  },
  PEPPER: {
    directAddress: "Ms. Barbosa",
    ownerReference: "Mr. McIntosh",
    pepperReference: "you",
    responsePrefix: "Ms. Barbosa,",
  },
  DELEGATE: {
    directAddress: "",
    ownerReference: "Mr. McIntosh",
    pepperReference: "Ms. Barbosa",
    responsePrefix: "",
  },
  GUEST: {
    directAddress: "",
    ownerReference: "Mr. McIntosh",
    pepperReference: "Ms. Barbosa",
    responsePrefix: "",
  },
  STRANGER: {
    directAddress: "",
    ownerReference: "Mr. McIntosh",
    pepperReference: "Ms. Barbosa",
    responsePrefix: "",
  },
  ADVERSARY: {
    directAddress: "",
    ownerReference: "Mr. McIntosh",
    pepperReference: "Ms. Barbosa",
    responsePrefix: "",
  },
};

export function getAddressPolicy(trust: TrustContext): AddressPolicy {
  return POLICIES[trust.identity] ?? POLICIES.STRANGER;
}

/**
 * The standard Pepper boundary refusal phrase.
 * Used any time Ms. Barbosa asks for something outside her permitted scope.
 */
export const PEPPER_BOUNDARY_REFUSAL =
  "Ms. Barbosa, in this case I would advise you to speak to Mr. McIntosh personally.";

/**
 * Variant used when the request is actionable but requires Owner authority.
 */
export const PEPPER_PREPARE_OFFER =
  "Ms. Barbosa, I can prepare this for Mr. McIntosh, but I cannot execute or approve it on his behalf.";
