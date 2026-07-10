// the expanded exercise library — merged into EXERCISES in seed.ts
import type { Exercise } from "../types";
import { CHEST_EXERCISES } from "./chest";
import { BACK_EXERCISES } from "./back";
import { SHOULDER_EXERCISES } from "./shoulders";
import { ARM_EXERCISES } from "./arms";
import { LEG_EXERCISES } from "./legs";
import { CORE_EXERCISES } from "./core";
import { CARDIO_MOBILITY_EXERCISES } from "./cardio-mobility";

export const LIBRARY_EXERCISES: Exercise[] = [
  ...CHEST_EXERCISES,
  ...BACK_EXERCISES,
  ...SHOULDER_EXERCISES,
  ...ARM_EXERCISES,
  ...LEG_EXERCISES,
  ...CORE_EXERCISES,
  ...CARDIO_MOBILITY_EXERCISES,
];
