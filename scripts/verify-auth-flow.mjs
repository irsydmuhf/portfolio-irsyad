// E2E auth-flow verification for the admin CMS (Phase 4 acceptance):
//   negative login -> real login (progressive-enhancement form post) ->
//   non-admin denied by requireAdmin -> RLS hides admin_users -> garbage
//   session yields the readable message -> temp user cleanup.
//
// Usage: start the server first, then run the script —
//   npx next start -p 3100
//   npm run auth:verify
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (creates + deletes one
// throwaway probe user; no owner credentials involved).

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import fs from "node:fs";

// ------------------------------------------------------------------ config
const SITE = process.env.PROBE_SITE ?? "http://127.0.0.1:3100";

const envText = fs.readFileSync(".env.local", "utf8");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const SUPA = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const SESSION_COOKIE = `sb-${new URL(SUPA).hostname.split(".")[0]}-auth-token`;

if (!SUPA || !ANON || !SVC) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE_ROLE in .env.local");
  process.exit(1);
}

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS " : "FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? passed++ : failed++;
}

const decodeEntities = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function actionField(html, name) {
  const m = html.match(
    new RegExp(`name="${escapeRe(name)}"(?:\\s+value="([^"]*)")?`)
  );
  if (!m) return m; // null when the field is missing entirely
  return m[1] === undefined ? "" : decodeEntities(m[1]);
}

const redirectStatus = (s) => [301, 302, 303, 307, 308].includes(s);

async function main() {
  // 0. server reachable?
  let html;
  try {
    const page = await fetch(`${SITE}/admin/login`);
    html = await page.text();
    check("login page reachable", page.status === 200, `status ${page.status}`);
  } catch (e) {
    console.error(`Server not reachable at ${SITE} — run \`npx next start -p 3100\` first. (${e.message})`);
    process.exit(1);
  }

  // 1. progressive-enhancement fields present (form works without JS)
  const ref1 = actionField(html, "$ACTION_REF_1");
  const a10 = actionField(html, "$ACTION_1:0");
  const a11 = actionField(html, "$ACTION_1:1");
  const key = actionField(html, "$ACTION_KEY");
  check(
    "P.E. action fields present",
    ref1 !== null && a10 !== null && a11 !== null && key !== null,
    `ref=${ref1 !== null} 1:0=${a10 !== null} 1:1=${a11 !== null} key=${key !== null}`
  );

  // 2. create throwaway NON-admin user (GoTrue admin API; signup-off is irrelevant)
  const email = `auth-probe-${Math.floor(Math.random() * 1e9)}@example.com`;
  const password = "TempProbePass123!";
  const createRes = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const created = await createRes.json();
  check("probe user created", createRes.ok && !!created.id, createRes.ok ? created.id : JSON.stringify(created).slice(0, 160));

  // 3. negative login: wrong password must yield the friendly error, no cookie
  const postLogin = (addr, pw) => {
    const fd = new FormData();
    fd.append("$ACTION_REF_1", ref1 ?? "");
    fd.append("$ACTION_1:0", a10 ?? "");
    fd.append("$ACTION_1:1", a11 ?? "");
    fd.append("$ACTION_KEY", key ?? "");
    fd.append("email", addr);
    fd.append("password", pw);
    fd.append("next", "/admin");
    return fetch(`${SITE}/admin/login`, { method: "POST", body: fd, redirect: "manual" });
  };

  const bad = await postLogin(email, "WrongPass999!");
  const badBody = await bad.text();
  check(
    "wrong password rejected",
    !redirectStatus(bad.status) && badBody.includes("Invalid email or password."),
    `status ${bad.status}`
  );

  // 4. correct login: server action sets session cookie and redirects to next.
  // GoTrue may briefly lag user creation right after the admin API call (and
  // probe runs can hit request throttling) — one delayed retry.
  let good = await postLogin(email, password);
  let goodBody = good.status === 200 ? await good.text() : "";
  let retried = false;
  if (good.status === 200) {
    retried = true;
    await new Promise((r) => setTimeout(r, 6000));
    good = await postLogin(email, password);
    goodBody = good.status === 200 ? await good.text() : "";
  }
  const setCookies = good.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  check(
    "valid login sets session + redirects",
    redirectStatus(good.status) && cookieHeader.includes("auth-token"),
    `status ${good.status}, location=${good.headers.get("location") ?? "-"}, cookie=${cookieHeader ? "yes" : "no"}, retried=${retried}, invalidMsg=${goodBody.includes("Invalid email or password.")}`
  );

  // 5. non-admin session hits /admin -> requireAdmin denies (membership, not just auth)
  const deniedRes = await fetch(`${SITE}/admin`, {
    headers: { Cookie: cookieHeader },
    redirect: "manual",
  });
  const deniedLoc = deniedRes.headers.get("location") ?? "";
  check(
    "non-admin denied by requireAdmin",
    redirectStatus(deniedRes.status) && deniedLoc.includes("error=unauthorized"),
    `status ${deniedRes.status} -> ${deniedLoc}`
  );

  // 6. that session lands on the denial page instead of looping
  const deniedPage = await fetch(`${SITE}/admin/login`, { headers: { Cookie: cookieHeader } });
  const deniedHtml = await deniedPage.text();
  check(
    "denial page shown (no redirect loop)",
    deniedPage.status === 200 && deniedHtml.includes("Admin access required")
  );

  // 7. RLS: the same non-admin token sees zero admin_users rows
  const tokRes = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const tok = await tokRes.json();
  check("password grant for RLS probe", !!tok.access_token, tokRes.ok ? "token ok" : JSON.stringify(tok).slice(0, 160));
  if (tok.access_token) {
    const amRes = await fetch(`${SUPA}/rest/v1/admin_users?select=user_id`, {
      headers: { apikey: ANON, Authorization: `Bearer ${tok.access_token}` },
    });
    const rows = await amRes.json();
    check(
      "RLS hides admin_users from non-admin",
      Array.isArray(rows) && rows.length === 0,
      `rows=${JSON.stringify(rows).slice(0, 120)}`
    );
  }

  // 8. garbage/expired session -> readable message (never a blank page)
  const garbage = await fetch(`${SITE}/admin`, {
    headers: { Cookie: `${SESSION_COOKIE}=garbage` },
    redirect: "manual",
  });
  const garbageLoc = garbage.headers.get("location") ?? "";
  check(
    "garbage session -> readable message",
    redirectStatus(garbage.status) && garbageLoc.includes("error=session"),
    `status ${garbage.status} -> ${garbageLoc}`
  );

  // 9. cleanup: delete probe user
  if (created.id) {
    const del = await fetch(`${SUPA}/auth/v1/admin/users/${created.id}`, {
      method: "DELETE",
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
    });
    check("probe user deleted", del.status === 200 || del.status === 204, `status ${del.status}`);
  }

  // 10. probe ADMIN session: proves the owner path end-to-end (dashboard
  // render + logout). admin_users rows cascade when the user is deleted.
  const adminEmail = `auth-probe-admin-${Math.floor(Math.random() * 1e9)}@example.com`;
  const adminCreate = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: adminEmail, password, email_confirm: true }),
  });
  const adminUser = await adminCreate.json();
  check(
    "probe admin user created",
    adminCreate.ok && !!adminUser.id,
    adminUser.id ?? JSON.stringify(adminUser).slice(0, 160)
  );

  if (adminUser.id) {
    const memRes = await fetch(`${SUPA}/rest/v1/admin_users`, {
      method: "POST",
      headers: {
        apikey: SVC,
        Authorization: `Bearer ${SVC}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ user_id: adminUser.id }),
    });
    check("probe admin membership granted", memRes.ok, `status ${memRes.status}`);

    // login as the admin (same P.E. flow the owner will use)
    const adminLoginRes = await postLogin(adminEmail, password);
    const adminCookie = (adminLoginRes.headers.getSetCookie?.() ?? [])
      .map((c) => c.split(";")[0])
      .join("; ");
    check(
      "admin login sets session",
      redirectStatus(adminLoginRes.status) && adminCookie.includes("auth-token"),
      `status ${adminLoginRes.status}, location=${adminLoginRes.headers.get("location") ?? "-"}`
    );

    // 11. dashboard renders (the page non-admins never reach)
    const dashRes = await fetch(`${SITE}/admin`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    const dashHtml = dashRes.status === 200 ? await dashRes.text() : "";
    check(
      "admin lands on dashboard with stats",
      dashRes.status === 200 && dashHtml.includes("Dashboard") && dashHtml.includes("Total projects"),
      `status ${dashRes.status}`
    );
    check("dashboard lists projects from DB", dashHtml.includes("customer-retention"));

    // Regression guard: this route once 500'd in production because
    // emptyProject() was imported from a "use client" module — every server
    // page under the panel must actually render under an admin session.
    const newRes = await fetch(`${SITE}/admin/projects/new`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    const newHtml = newRes.status === 200 ? await newRes.text() : "";
    check(
      "new-project page renders under admin session",
      newRes.status === 200 && newHtml.includes("New project"),
      `status ${newRes.status}`
    );

    const editRes = await fetch(`${SITE}/admin/projects`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    check(
      "projects list renders under admin session",
      editRes.status === 200 && (await editRes.text()).includes("Projects"),
      `status ${editRes.status}`
    );

    // 12. signed-in admin opening the login page goes straight to the dashboard
    const reRes = await fetch(`${SITE}/admin/login`, {
      headers: { Cookie: adminCookie },
      redirect: "manual",
    });
    const reLoc = reRes.headers.get("location") ?? "";
    check(
      "signed-in admin skips login page",
      redirectStatus(reRes.status) && reLoc.endsWith("/admin"),
      `status ${reRes.status} -> ${reLoc}`
    );

    // 13. logout: P.E. post of the sidebar form. A plain `<form action={serverFn}>`
    // (RSC, no useActionState) emits a single $ACTION_ID_<hex> hidden input —
    // different from the $ACTION_REF_* layout used by useActionState forms.
    const logoutM = dashHtml.match(/name="\$(ACTION_ID_[0-9a-f]+)"/);
    const formSnippet = (dashHtml.match(/<form[\s\S]{0,300}/) ?? ["(no <form in html)"])[0]
      .replace(/\s+/g, " ");
    check(
      "logout form action fields present",
      logoutM !== null,
      logoutM ? `field=$${logoutM[1]}` : `snippet: ${formSnippet}`
    );

    if (logoutM) {
      const fd = new FormData();
      fd.append(`$${logoutM[1]}`, "");
      const outRes = await fetch(`${SITE}/admin`, {
        method: "POST",
        body: fd,
        headers: { Cookie: adminCookie },
        redirect: "manual",
      });
      const outCookies = outRes.headers.getSetCookie?.() ?? [];
      const sessionCleared = outCookies.some(
        (c) => c.split(";")[0] === `${SESSION_COOKIE}=`
      );
      check(
        "logout clears session + redirects to login",
        redirectStatus(outRes.status) &&
          sessionCleared &&
          (outRes.headers.get("location") ?? "").endsWith("/admin/login"),
        `status ${outRes.status}, loc=${outRes.headers.get("location") ?? "-"}, sessionCleared=${sessionCleared}`
      );
    } else {
      check("logout clears session + redirects to login", false, "skipped: no P.E. field");
    }

    // cleanup (admin_users cascades with the user)
    const adminDel = await fetch(`${SUPA}/auth/v1/admin/users/${adminUser.id}`, {
      method: "DELETE",
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}` },
    });
    check("probe admin deleted", adminDel.status === 200 || adminDel.status === 204, `status ${adminDel.status}`);
  }

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error("probe crashed:", e);
  process.exit(1);
});
