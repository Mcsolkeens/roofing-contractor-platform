/**
 * EagleView sandbox sample data.
 *
 * The sandbox ONLY returns data for these pre-loaded report ids / addresses
 * (from EagleView's official Postman collection). Any other address returns an
 * error. We use these to run a real, repeatable end-to-end demo against the
 * sandbox environment.
 */

export interface SandboxSample {
  reportId: string
  label: string
  category: "Roof" | "Full House" | "Walls"
  address: string
}

export const SANDBOX_SAMPLES: SandboxSample[] = [
  {
    reportId: "68789287",
    label: "Roof — Single Structure",
    category: "Roof",
    address: "4800 Floral Park Rd, Brandywine, Maryland 20613",
  },
  {
    reportId: "69154380",
    label: "Roof — Multiple Structures",
    category: "Roof",
    address: "97 Via Los Altos, Tiburon, California 94920",
  },
  {
    reportId: "69154384",
    label: "Roof — Complex Structure",
    category: "Roof",
    address: "725 Sandmeyer St, San Antonio, Texas 78208",
  },
  {
    reportId: "69108768",
    label: "Full House — Single Structure",
    category: "Full House",
    address: "419 Prairie Ridge Ln, North Aurora, Illinois 60542",
  },
]

export const DEFAULT_SANDBOX_REPORT_ID = "68789287"
