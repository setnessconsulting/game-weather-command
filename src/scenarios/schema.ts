import { z } from "zod";

const normalizedCoordinate = z.number().min(0).max(1);

export const foundationStationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  position: z.object({ x: normalizedCoordinate, y: normalizedCoordinate }),
});

export const foundationScenarioSchema = z.object({
  schemaVersion: z.literal("1"),
  contentVersion: z.string().min(1),
  scenarioId: z.string().min(1),
  title: z.string().min(1),
  seed: z.number().int(),
  stations: z.array(foundationStationSchema).min(3),
});

export type FoundationScenario = z.infer<typeof foundationScenarioSchema>;

export function parseFoundationScenario(input: unknown): FoundationScenario {
  return foundationScenarioSchema.parse(input);
}
