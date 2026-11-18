"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildOtpEmail, sendBrevoEmail, BREVO_URL } = require("../src/email");

test("OTP email contains the code and escapes the name", () => {
  const m = buildOtpEmail({ name: "Amal <b>Perera</b>", otp: "046628", minutes: 5 });
  assert.match(m.subject, /^046628 /);
  assert.match(m.text, /046628/);
  assert.match(m.text, /5 minutes/);
  assert.ok(!m.html.includes("<b>Perera</b>"), "name must be HTML-escaped");
  assert.ok(m.html.includes("Amal &lt;b&gt;Perera&lt;/b&gt;"));
  for (const d of "046628") assert.ok(m.html.includes(`>${d}</td>`));
});

test("sendBrevoEmail posts the right request", async () => {
  let call;
  const fakeFetch = async (url, init) => {
    call = { url, init, body: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ messageId: "<abc@brevo>" }) };
  };
  const res = await sendBrevoEmail({
    apiKey: "k-123", sender: { email: "from@example.com", name: "Election App" },
    to: { email: "to@example.com", name: "Amal" }, subject: "s", text: "t", html: "<p>h</p>",
    fetchImpl: fakeFetch,
  });
  assert.equal(res.messageId, "<abc@brevo>");
  assert.equal(call.url, BREVO_URL);
  assert.equal(call.init.headers["api-key"], "k-123");
  assert.deepEqual(call.body.sender, { email: "from@example.com", name: "Election App" });
  assert.deepEqual(call.body.to, [{ email: "to@example.com", name: "Amal" }]);
  assert.equal(call.body.htmlContent, "<p>h</p>");
});

test("sendBrevoEmail surfaces Brevo errors", async () => {
  const fakeFetch = async () => ({ ok: false, status: 401, text: async () => '{"code":"unauthorized"}' });
  await assert.rejects(
    sendBrevoEmail({ apiKey: "bad", sender: { email: "a@b.c" }, to: { email: "x@y.z" }, subject: "s", text: "t", html: "h", fetchImpl: fakeFetch }),
    /Brevo 401/,
  );
});
