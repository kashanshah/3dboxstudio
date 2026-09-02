import { describe, expect, it } from "vitest";
import { buildTemplateSelectedParams } from "@/lib/analytics/events";

describe("buildTemplateSelectedParams", () => {
  it("records the newly selected template, not stale React state", () => {
    const params = buildTemplateSelectedParams("mailer", {
      templateType: "cube",
      boxType: "cube",
      userStatus: "signed_in",
    });

    expect(params.template_type).toBe("mailer");
    expect(params.template_name).toBe("mailer");
    expect(params.box_type).toBe("mailer");
    expect(params.user_status).toBe("signed_in");
  });

  it("changing from template A to template B records template B", () => {
    const fromA = buildTemplateSelectedParams("cube", {
      templateType: "custom",
      boxType: "custom",
    });
    expect(fromA.template_type).toBe("cube");

    const fromB = buildTemplateSelectedParams("mailer", {
      templateType: "cube",
      boxType: "cube",
    });
    expect(fromB.template_type).toBe("mailer");
    expect(fromB.box_type).toBe("mailer");
  });
});
