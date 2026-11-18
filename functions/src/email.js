"use strict";

/**
 * Transactional email via the Brevo HTTP API (https://developers.brevo.com/reference/sendtransacemail).
 * The sender address must be a verified sender in the Brevo account.
 */
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Subject, plain text and HTML for the login-code email. */
function buildOtpEmail({ name, otp, minutes }) {
  const greeting = name ? `Hello ${name},` : "Hello,";
  const subject = `${otp} is your Election App verification code`;
  const text =
    `${greeting}\n\nYour Election App verification code is ${otp}.\n\n` +
    `It expires in ${minutes} minutes. If you did not try to sign in, you can ignore this email.\n`;
  const digits = String(otp).split("").map((d) =>
    `<td style="width:44px;height:54px;border:2px solid #c7d2fe;border-radius:12px;background:#eef2ff;` +
    `font:800 26px/54px Segoe UI,Roboto,Arial,sans-serif;color:#3730a3;text-align:center">${escapeHtml(d)}</td>`,
  ).join('<td style="width:8px"></td>');
  const html = `<!doctype html>
<html><body style="margin:0;background:#f5f6fb;padding:32px 12px;font-family:Segoe UI,Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(17,24,39,.08)">
    <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);background-color:#5b3fe6;padding:28px 32px;color:#fff">
      <div style="font-size:13px;letter-spacing:1px;opacity:.85">ELECTION APP</div>
      <div style="font-size:24px;font-weight:800;margin-top:6px">Your verification code</div>
    </td></tr>
    <tr><td style="padding:28px 32px;color:#111827">
      <p style="margin:0 0 18px;font-size:16px">${escapeHtml(greeting)}</p>
      <p style="margin:0 0 22px;font-size:15px;color:#4b5563;line-height:22px">Enter this code in the Election App to sign in and vote:</p>
      <table role="presentation" style="margin:0 auto 22px"><tr>${digits}</tr></table>
      <p style="margin:0;font-size:14px;color:#6b7280;line-height:21px">
        The code expires in <b>${minutes} minutes</b>. If you didn't try to sign in, you can safely ignore this email &mdash; nobody can vote without this code.
      </p>
    </td></tr>
    <tr><td style="padding:16px 32px 24px;font-size:12px;color:#9ca3af">Never share this code with anyone, including election staff.</td></tr>
  </table>
</body></html>`;
  return { subject, text, html };
}

/** Sends one transactional email. Throws with Brevo's error message on failure. */
async function sendBrevoEmail({ apiKey, sender, to, subject, text, html, fetchImpl = fetch }) {
  const res = await fetchImpl(BREVO_URL, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender,
      to: [{ email: to.email, ...(to.name ? { name: to.name } : {}) }],
      subject,
      textContent: text,
      htmlContent: html,
      tags: ["otp"],
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

module.exports = { buildOtpEmail, sendBrevoEmail, BREVO_URL };
