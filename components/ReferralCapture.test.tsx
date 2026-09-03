import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
}));

import ReferralCapture from "./ReferralCapture";

describe("ReferralCapture", () => {
  beforeEach(() => {
    mockGet.mockReset();
    document.cookie = "cigibm_ref=; path=/; max-age=0";
  });

  it("sets the referral cookie when ?ref= is present", () => {
    mockGet.mockImplementation((key: string) => (key === "ref" ? "ambassadeur-test" : null));

    render(<ReferralCapture />);

    expect(document.cookie).toContain("cigibm_ref=ambassadeur-test");
  });

  it("does nothing when no ref param is present", () => {
    mockGet.mockReturnValue(null);

    render(<ReferralCapture />);

    expect(document.cookie).not.toContain("cigibm_ref=");
  });
});
