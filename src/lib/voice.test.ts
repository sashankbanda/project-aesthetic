import { describe, expect, it } from "vitest";
import { parseSetSpeech } from "./voice";

describe("parseSetSpeech", () => {
  it("weight first, reps last", () => {
    expect(parseSetSpeech("62.5 for 8")).toEqual({ weight: 62.5, reps: 8 });
    expect(parseSetSpeech("60 kilos 10 reps")).toEqual({ weight: 60, reps: 10 });
    expect(parseSetSpeech("22 by 12")).toEqual({ weight: 22, reps: 12 });
  });

  it("single number disambiguated by unit words, then magnitude", () => {
    expect(parseSetSpeech("8 reps")).toEqual({ reps: 8 });
    expect(parseSetSpeech("12 kilos")).toEqual({ weight: 12 });
    expect(parseSetSpeech("15")).toEqual({ reps: 15 });
    expect(parseSetSpeech("80")).toEqual({ weight: 80 });
  });

  it("comma decimals and noise survive", () => {
    expect(parseSetSpeech("uh 62,5 kg for about 8 reps")).toEqual({ weight: 62.5, reps: 8 });
    expect(parseSetSpeech("nothing useful")).toEqual({});
  });
});
