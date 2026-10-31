import type { Certificate } from '@/features/platform/platformApi'

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

/** Public verification link for a code (served by VerifyCertificatePage, no login). */
export const verificationLink = (code: string) => `${window.location.origin}/verify/${encodeURIComponent(code)}`

/**
 * Opens a print-ready landscape certificate in a new window (browser "Save as PDF").
 * Same approach as the payment receipt: no PDF library.
 */
export function printCertificate(cert: Certificate, fallbackOrgName?: string) {
  const holder =
    cert.recipientSnapshot?.name ?? (typeof cert.userId === 'object' ? cert.userId?.name : undefined) ?? 'Recipient'
  const org = cert.issuer?.organizationName ?? fallbackOrgName ?? 'PAISA'
  const code = cert.verification?.verificationCode ?? ''
  const link = code ? verificationLink(code) : ''
  const revoked = cert.status === 'revoked'

  const win = window.open('', '_blank', 'width=1100,height=800')
  if (!win) return false
  win.document.write(`<!doctype html><html><head><title>Certificate ${esc(cert.certificateNumber ?? '')}</title>
<style>
@page{size:A4 landscape;margin:12mm}
*{box-sizing:border-box}
body{font-family:Georgia,'Times New Roman',serif;color:#1f2937;margin:0;background:#fff}
.frame{position:relative;border:10px double #1e3a5f;padding:48px 64px;min-height:180mm;text-align:center}
.org{font-family:Inter,system-ui,sans-serif;font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#1e3a5f;font-weight:600}
h1{font-size:44px;margin:28px 0 6px;font-weight:normal;letter-spacing:.04em}
.sub{font-size:16px;color:#6b7280;margin:0}
.holder{font-size:36px;font-style:italic;margin:26px auto 6px;padding:0 24px 8px;border-bottom:1px solid #9ca3af;display:inline-block;min-width:50%}
.title{font-size:22px;margin:18px 0 6px}
.desc{font-size:14px;color:#4b5563;max-width:70%;margin:0 auto}
.meta{display:flex;justify-content:space-between;align-items:flex-end;margin-top:48px;font-family:Inter,system-ui,sans-serif;font-size:12px;color:#374151;text-align:left}
.meta b{display:block;font-size:13px;color:#111}
.verify{text-align:right;max-width:55%;word-break:break-all}
.revoked{position:absolute;top:40%;left:0;right:0;font-family:Inter,system-ui,sans-serif;font-size:72px;font-weight:800;color:rgba(220,38,38,.25);transform:rotate(-12deg)}
</style></head><body>
<div class="frame">
${revoked ? '<div class="revoked">REVOKED</div>' : ''}
<div class="org">${esc(org)}</div>
<h1>Certificate</h1>
<p class="sub">This is to certify that</p>
<div class="holder">${esc(holder)}</div>
<p class="sub">has been awarded</p>
<div class="title">${esc(cert.title)}</div>
${cert.description ? `<p class="desc">${esc(cert.description)}</p>` : ''}
<div class="meta">
  <div>
    <b>Issued ${esc(fmtDate(cert.issueDate ?? cert.createdAt))}</b>
    ${cert.validUntil ? `Valid until ${esc(fmtDate(cert.validUntil))}<br>` : ''}
    Certificate no. ${esc(cert.certificateNumber ?? '—')}
    ${cert.issuer?.name ? `<br>Issued by ${esc(cert.issuer.name)}` : ''}
  </div>
  <div class="verify">
    ${code ? `<b>Verification code ${esc(code)}</b>Verify at ${esc(link)}` : ''}
  </div>
</div>
</div>
<script>window.onload=()=>window.print()</script></body></html>`)
  win.document.close()
  return true
}
