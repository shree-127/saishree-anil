/**
 * Internationalization formatting helpers for bilingual address and area resolution.
 */

export interface Addressable {
  address?: string;
  addressKn?: string;
}

export interface AreaAddressable extends Addressable {
  areaEn?: string;
  areaKn?: string;
}

/**
 * Returns addressKn when lang is 'kn' and addressKn is non-empty, otherwise address (or empty string).
 */
export function getAddress(
  report?: Addressable | null,
  lang: string = "kn"
): string {
  if (!report) return "";
  const isKn = lang === "kn";
  if (isKn && report.addressKn && report.addressKn.trim().length > 0) {
    return report.addressKn;
  }
  return report.address || report.addressKn || "";
}

/**
 * Returns areaKn when lang is 'kn' and areaKn is non-empty, otherwise areaEn (or fallback to getAddress).
 */
export function getArea(
  report?: AreaAddressable | null,
  lang: string = "kn"
): string {
  if (!report) return "";
  const isKn = lang === "kn";
  if (isKn && report.areaKn && report.areaKn.trim().length > 0) {
    return report.areaKn;
  }
  if (report.areaEn && report.areaEn.trim().length > 0) {
    return report.areaEn;
  }
  // Fallback to getAddress if specific area is not specified
  return getAddress(report, lang);
}
