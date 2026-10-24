import { fixtureSource } from "./fixture/fixture-source";
import type { Source } from "./source";

/** Every source the generator listens to. Add a source here with its own fetching code. */
export const sources: Source[] = [fixtureSource];
