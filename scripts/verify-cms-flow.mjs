// E2E verification of the CMS server actions against the REAL Supabase project
// and a running production server (Phases 5-10 acceptance + authz matrix).
//
//   npm run build && npx next start -p 3100     (in another terminal)
//   npm run cms:verify
//
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local. It creates throwaway admin /
// non-admin users and one throwaway project, drives the real server actions over
// HTTP (Next-Action protocol), and removes everything it created.

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import fs from "node:fs";
import { createRequire } from "node:module";

const { encodeReply } = createRequire(import.meta.url)(
  "next/dist/compiled/react-server-dom-turbopack/client.browser"
);

const SITE = process.env.PROBE_SITE ?? "http://127.0.0.1:3100";

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
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
if (!SUPA || !ANON || !SVC) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const manifest = JSON.parse(
  fs.readFileSync(".next/server/server-reference-manifest.json", "utf8")
);
const ACTION = {};
for (const [id, v] of Object.entries(manifest.node)) ACTION[v.exportedName] = id;

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS " : "FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? passed++ : failed++;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const redirectStatus = (s) => [301, 302, 303, 307, 308].includes(s);
const svcHeaders = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };

// ------------------------------------------------------------- HTTP helpers
const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function field(html, name) {
  const m = html.match(new RegExp(`name="${esc(name)}"(?:\\s+value="([^"]*)")?`));
  return m ? (m[1] === undefined ? "" : decode(m[1])) : null;
}

async function createUser(prefix) {
  const email = `${prefix}-${Math.floor(Math.random() * 1e9)}@example.com`;
  const password = "TempProbePass123!";
  const r = await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: svcHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const u = await r.json();
  if (!u.id) throw new Error(`user create failed: ${JSON.stringify(u)}`);
  return { id: u.id, email, password };
}

async function deleteUser(id) {
  await fetch(`${SUPA}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: svcHeaders });
}

async function loginCookie({ email, password }) {
  const html = await (await fetch(`${SITE}/admin/login`)).text();
  const mk = () => {
    const fd = new FormData();
    fd.append("$ACTION_REF_1", field(html, "$ACTION_REF_1") ?? "");
    fd.append("$ACTION_1:0", field(html, "$ACTION_1:0") ?? "");
    fd.append("$ACTION_1:1", field(html, "$ACTION_1:1") ?? "");
    fd.append("$ACTION_KEY", field(html, "$ACTION_KEY") ?? "");
    fd.append("email", email);
    fd.append("password", password);
    fd.append("next", "/admin");
    return fd;
  };
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${SITE}/admin/login`, { method: "POST", body: mk(), redirect: "manual" });
    const cookies = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    if (redirectStatus(res.status) && cookies.includes("auth-token")) return cookies;
    await sleep(4000);
  }
  throw new Error("login failed");
}

/** Call a server action over HTTP. args = JSON-serialisable array. */
async function callAction(name, args, cookie) {
  const id = ACTION[name];
  if (!id) throw new Error(`unknown action ${name}`);
  const res = await fetch(`${SITE}/admin/projects`, {
    method: "POST",
    headers: {
      "Next-Action": id,
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(args),
    redirect: "manual",
  });
  return parseFlight(res);
}

/** Multipart variant for actions that take a FormData argument. */
async function callFormAction(name, entries, cookie) {
  const id = ACTION[name];
  const arg = new FormData();
  for (const [k, v] of entries) arg.append(k, v);
  // Encode exactly like the browser does (React Flight reply format).
  const body = await encodeReply([arg]);
  const res = await fetch(`${SITE}/admin/projects`, {
    method: "POST",
    headers: { "Next-Action": id, Accept: "text/x-component", ...(cookie ? { Cookie: cookie } : {}) },
    body,
    redirect: "manual",
  });
  return parseFlight(res);
}

async function parseFlight(res) {
  const text = await res.text();
  if (redirectStatus(res.status) || res.headers.get("x-action-redirect")) {
    return { redirected: true, status: res.status, location: res.headers.get("location") ?? res.headers.get("x-action-redirect") };
  }
  const m = text.match(/(?:^|\n)1:(\{.*\})\s*(?:\n|$)/);
  if (!m) return { raw: text.slice(0, 300), status: res.status };
  try {
    return JSON.parse(m[1]);
  } catch {
    return { raw: text.slice(0, 300), status: res.status };
  }
}

const rest = async (path, token = ANON, key = ANON) =>
  (await fetch(`${SUPA}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${token}` } })).json();
const svc = (path) => rest(path, SVC, SVC);
const pub = (slug) => fetch(`${SITE}/projects/${slug}`, { redirect: "manual" });

async function pngBytes() {
  // 1x1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
}

// -------------------------------------------------------------------- main
async function main() {
  try {
    await fetch(`${SITE}/admin/login`);
  } catch (e) {
    console.error(`Server not reachable at ${SITE}: ${e.message}`);
    process.exit(1);
  }

  const admin = await createUser("cms-admin");
  const outsider = await createUser("cms-outsider");
  let projectId = null;
  const slug = `cms-probe-${Math.floor(Math.random() * 1e8)}`;
  let originalOrder = null;

  try {
    const m = await fetch(`${SUPA}/rest/v1/admin_users`, {
      method: "POST",
      headers: { ...svcHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: admin.id }),
    });
    check("probe admin membership granted", m.status === 201, `status ${m.status}`);

    const adminCookie = await loginCookie(admin);
    const outsiderCookie = await loginCookie(outsider);
    check("both probe sessions established", true);

    const baseInput = { title: "CMS Probe Project", slug };

    // ---- authz: anonymous + non-admin cannot mutate -----------------------
    const anon = await callAction("saveProject", [baseInput], null);
    check("anonymous save rejected", anon.redirected === true, JSON.stringify(anon).slice(0, 100));

    const nonAdmin = await callAction("saveProject", [baseInput], outsiderCookie);
    check("non-admin save rejected (requireAdmin)", nonAdmin.redirected === true && !nonAdmin.ok, JSON.stringify(nonAdmin).slice(0, 120));
    const leak = await svc(`projects?slug=eq.${slug}&select=id`);
    check("rejected saves created nothing", Array.isArray(leak) && leak.length === 0);

    // ---- Phase 5: create draft -------------------------------------------
    const created = await callAction("saveProject", [baseInput], adminCookie);
    check("owner creates a draft", created.ok === true && !!created.id, JSON.stringify(created).slice(0, 120));
    projectId = created.id;

    const row = (await svc(`projects?id=eq.${projectId}&select=status,display_order`))[0];
    check("new project is a draft", row?.status === "draft");

    const anonList = await rest(`projects?slug=eq.${slug}&select=id`);
    check("draft invisible to anonymous (RLS)", Array.isArray(anonList) && anonList.length === 0);
    const pubDraft = await pub(slug);
    check("draft public URL is 404", pubDraft.status === 404, `status ${pubDraft.status}`);

    const dup = await callAction("saveProject", [baseInput], adminCookie);
    check("duplicate slug rejected", dup.ok === false && dup.error === "A project with this slug already exists.", dup.error);

    const badSlug = await callAction("saveProject", [{ title: "Bad Slug", slug: "Bad Slug!" }], adminCookie);
    check("invalid slug rejected with readable message", badSlug.ok === false && /slug/i.test(badSlug.error ?? ""), badSlug.error);

    // ---- Phase 6: repeatable editors + private meta -----------------------
    const full = {
      id: projectId,
      title: "CMS Probe Project",
      slug,
      category: "Probe",
      summary: "Probe summary",
      description: "Probe **description**",
      businessProblem: "Probe problem",
      keyQuestions: ["Q1?", "Q2?"],
      tools: ["SQL", "Python"],
      solutionSummary: "- one\n- two",
      steps: [
        { title: "Collect", description: "gather" },
        { title: "Clean", description: "" },
        { title: "Analyse", description: "" },
      ],
      insights: [{ title: "I1", description: "d1" }],
      links: [{ type: "github", label: "Code", url: "https://example.com/repo" }],
      featured: true,
      privateMeta: {
        originalWorkTitles: ["Secret Work"],
        internalNotes: "internal only",
        internalSourceReferences: [],
        confidentialityNotes: "",
        contentVerified: false,
        confidentialityConfirmed: false,
      },
    };
    const saved = await callAction("saveProject", [full], adminCookie);
    check("full save with children succeeds", saved.ok === true, saved.error);

    const steps = await svc(`project_steps?project_id=eq.${projectId}&select=title,step_order&order=step_order`);
    check("step order persisted", steps.map((s) => s.title).join() === "Collect,Clean,Analyse" && steps[2].step_order === 3);

    const badLink = await callAction("saveProject", [{ ...full, links: [{ type: "github", label: "x", url: "javascript:alert(1)" }] }], adminCookie);
    check("invalid link URL rejected", badLink.ok === false, badLink.error);
    const stepsAfter = await svc(`project_steps?project_id=eq.${projectId}&select=id`);
    check("failed validation leaves children untouched", stepsAfter.length === 3);

    const reorderedSteps = { ...full, steps: [full.steps[2], full.steps[0], full.steps[1]] };
    await callAction("saveProject", [reorderedSteps], adminCookie);
    const steps2 = await svc(`project_steps?project_id=eq.${projectId}&select=title&order=step_order`);
    check("step reorder persisted", steps2.map((s) => s.title).join() === "Analyse,Collect,Clean");

    const metaSvc = await svc(`project_private_meta?project_id=eq.${projectId}&select=original_work_titles,internal_notes`);
    check("private meta saved", metaSvc[0]?.internal_notes === "internal only");
    const metaAnon = await rest(`project_private_meta?project_id=eq.${projectId}&select=*`);
    check("private meta unreadable by anonymous", Array.isArray(metaAnon) && metaAnon.length === 0);
    const outsiderTok = (
      await (await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ email: outsider.email, password: outsider.password }),
      })).json()
    ).access_token;
    const metaOut = await rest(`project_private_meta?project_id=eq.${projectId}&select=*`, outsiderTok);
    check("private meta unreadable by non-admin", Array.isArray(metaOut) && metaOut.length === 0);
    const writeOut = await fetch(`${SUPA}/rest/v1/projects`, {
      method: "POST",
      headers: { apikey: ANON, Authorization: `Bearer ${outsiderTok}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ slug: `${slug}-x`, title: "nope" }),
    });
    check("non-admin direct write blocked by RLS", writeOut.status === 401 || writeOut.status === 403, `status ${writeOut.status}`);

    // ---- Phase 9: publish gate -------------------------------------------
    const blocked = await callAction("publishProject", [projectId], adminCookie);
    check(
      "publish blocked + names missing item",
      blocked.ok === false && /confirm/i.test(blocked.error ?? ""),
      blocked.error?.slice(0, 120)
    );
    const emptyField = await callAction("saveProject", [{ ...full, businessProblem: "" }], adminCookie);
    const blocked2 = await callAction("publishProject", [projectId], adminCookie);
    check(
      "publish error names Business Problem",
      blocked2.ok === false && blocked2.error.includes("Business Problem is empty"),
      emptyField.ok ? "" : emptyField.error
    );
    const stillDraft = (await svc(`projects?id=eq.${projectId}&select=status`))[0];
    check("blocked publish keeps draft", stillDraft?.status === "draft");

    const ready = { ...full, privateMeta: { ...full.privateMeta, contentVerified: true, confidentialityConfirmed: true } };
    await callAction("saveProject", [ready], adminCookie);
    const pubRes = await callAction("publishProject", [projectId], adminCookie);
    check("publish succeeds when gate passes", pubRes.ok === true, pubRes.error);
    await sleep(500);
    const live = await pub(slug);
    const liveHtml = await live.text();
    check("published page is live immediately", live.status === 200 && liveHtml.includes("CMS Probe Project"), `status ${live.status}`);
    check("process diagram renders", liveHtml.includes('aria-label="Project process"') && liveHtml.includes("Analyse"));
    check("markdown rendered without raw HTML", liveHtml.includes("<strong>description</strong>"));
    check("private meta not on public page", !liveHtml.includes("internal only") && !liveHtml.includes("Secret Work"));
    check("empty sections omitted (no period tile / visuals)", !liveHtml.includes("Visuals"));
    check("public metadata present", /<title>CMS Probe Project \| Irsyad Muhamad Firdaus<\/title>/.test(liveHtml) && liveHtml.includes('rel="canonical"'));

    const home = await (await fetch(`${SITE}/`)).text();
    check("featured + published appears on homepage", home.includes("CMS Probe Project"));

    const slugChange = await callAction("saveProject", [{ ...ready, slug: `${slug}-new` }], adminCookie);
    check("slug change blocked while published", slugChange.ok === false && /unpublish/i.test(slugChange.error ?? ""), slugChange.error?.slice(0, 80));

    // ---- Phase 10: featured + reorder ------------------------------------
    await callAction("setFeatured", [projectId, false], adminCookie);
    await sleep(500);
    const home2 = await (await fetch(`${SITE}/`)).text();
    check("unfeatured project leaves homepage", !home2.includes("CMS Probe Project"));
    check("unfeatured project still reachable by slug", (await pub(slug)).status === 200);
    await callAction("setFeatured", [projectId, true], adminCookie);

    const orderRows = await svc("projects?select=id,display_order&order=display_order");
    originalOrder = orderRows.map((r) => r.id);
    const newOrder = [projectId, ...originalOrder.filter((i) => i !== projectId)];
    const re = await callAction("reorderProjects", [newOrder], adminCookie);
    check("reorder action ok", re.ok === true, re.error);
    const afterOrder = await svc("projects?select=id&order=display_order");
    check("reorder persisted (probe first)", afterOrder[0]?.id === projectId);
    await sleep(500);
    const home3 = await (await fetch(`${SITE}/`)).text();
    check("homepage reflects new order", home3.indexOf("CMS Probe Project") > -1 && home3.indexOf("CMS Probe Project") < home3.indexOf("Customer Retention"));
    await callAction("reorderProjects", [originalOrder], adminCookie);
    const restored = await svc("projects?select=id&order=display_order");
    check("original order restored", restored.map((r) => r.id).join() === originalOrder.join());

    // ---- Phase 8: media --------------------------------------------------
    const png = await pngBytes();
    const upl = await callFormAction(
      "uploadMedia",
      [
        ["projectId", projectId],
        ["alt", "probe alt"],
        ["caption", "probe caption"],
        ["layout", "full"],
        ["file", new File([png], "../../evil name.png", { type: "image/png" })],
      ],
      adminCookie
    );
    check("owner uploads an image", upl.ok === true, JSON.stringify(upl).slice(0, 150));

    const mrow = (await svc(`project_media?project_id=eq.${projectId}&select=id,storage_path,alt_text`))[0];
    check(
      "stored under projects/<id>/<uuid>.png (filename ignored)",
      mrow?.storage_path?.startsWith(`projects/${projectId}/`) && /\.png$/.test(mrow.storage_path) && !mrow.storage_path.includes("evil"),
      mrow?.storage_path
    );
    if (mrow) {
      const img = await fetch(`${SUPA}/storage/v1/object/public/portfolio-media/${mrow.storage_path}`);
      check("uploaded object publicly readable", img.status === 200 && img.headers.get("content-type") === "image/png");
      await sleep(300);
      const pageWithImg = await (await pub(slug)).text();
      check("image + alt render on public page", pageWithImg.includes("probe alt") && pageWithImg.includes('loading="lazy"'));
    }

    const noAlt = await callFormAction(
      "uploadMedia",
      [["projectId", projectId], ["alt", ""], ["file", new File([png], "a.png", { type: "image/png" })]],
      adminCookie
    );
    check("upload without alt rejected", noAlt.ok === false && /alt/i.test(noAlt.error ?? ""), noAlt.error);

    const svg = await callFormAction(
      "uploadMedia",
      [["projectId", projectId], ["alt", "x"], ["file", new File(["<svg xmlns='http://www.w3.org/2000/svg'><script>1</script></svg>"], "a.png", { type: "image/png" })]],
      adminCookie
    );
    check("SVG / mislabelled file rejected", svg.ok === false && /unsupported/i.test(svg.error ?? ""), svg.error);

    const big = await callFormAction(
      "uploadMedia",
      [["projectId", projectId], ["alt", "x"], ["file", new File([Buffer.concat([png, Buffer.alloc(8 * 1024 * 1024)])], "big.png", { type: "image/png" })]],
      adminCookie
    );
    check("oversized file rejected with readable error", big.ok === false && /too large/i.test(big.error ?? ""), big.error ?? JSON.stringify(big).slice(0, 100));
    const stillOneMedia = await svc(`project_media?project_id=eq.${projectId}&select=id`);
    check("rejected uploads created no rows", stillOneMedia.length === 1);

    const insecure = await callAction("addExternalMedia", [{ projectId, url: "http://example.com/a.png", alt: "x" }], adminCookie);
    check("external http:// image rejected", insecure.ok === false, insecure.error);

    // storage policies (direct, with real JWTs)
    const anonUp = await fetch(`${SUPA}/storage/v1/object/portfolio-media/projects/${projectId}/anon.png`, {
      method: "POST",
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "image/png" },
      body: png,
    });
    check("anonymous storage upload rejected", anonUp.status === 400 || anonUp.status === 401 || anonUp.status === 403, `status ${anonUp.status}`);
    const outUp = await fetch(`${SUPA}/storage/v1/object/portfolio-media/projects/${projectId}/out.png`, {
      method: "POST",
      headers: { apikey: ANON, Authorization: `Bearer ${outsiderTok}`, "Content-Type": "image/png" },
      body: png,
    });
    check("non-admin storage upload rejected", outUp.status === 400 || outUp.status === 401 || outUp.status === 403, `status ${outUp.status}`);

    // unrelated asset must survive media delete
    const keepPath = `projects/${projectId}/keep-${Date.now()}.png`;
    await fetch(`${SUPA}/storage/v1/object/portfolio-media/${keepPath}`, {
      method: "POST",
      headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "image/png" },
      body: png,
    });
    if (mrow) {
      const del = await callAction("deleteMedia", [mrow.id], adminCookie);
      check("delete media ok", del.ok === true, del.error);
      // Authoritative check via the storage API (the public CDN URL may keep
      // serving a cached copy for a while after deletion).
      const listed = await (
        await fetch(`${SUPA}/storage/v1/object/list/portfolio-media`, {
          method: "POST",
          headers: svcHeaders,
          body: JSON.stringify({ prefix: `projects/${projectId}`, limit: 100 }),
        })
      ).json();
      const names = Array.isArray(listed) ? listed.map((o) => o.name) : [];
      const gone = !names.includes(mrow.storage_path.split("/").pop());
      check("storage object removed with the row", gone, `remaining=${names.length}`);
      const kept = await fetch(`${SUPA}/storage/v1/object/public/portfolio-media/${keepPath}`);
      check("unrelated asset untouched", kept.status === 200);
    }

    // cover
    const cov = await callFormAction(
      "uploadCover",
      [["projectId", projectId], ["alt", "cover alt"], ["file", new File([png], "c.png", { type: "image/png" })]],
      adminCookie
    );
    check("cover upload ok", cov.ok === true, cov.error);
    const rm = await callAction("removeCover", [projectId], adminCookie);
    check("cover removal ok (gradient fallback)", rm.ok === true, rm.error);
    check("page renders without cover", (await pub(slug)).status === 200);

    // ---- preview + admin pages ------------------------------------------
    const prevAdmin = await fetch(`${SITE}/admin/projects/${projectId}/preview`, { headers: { Cookie: adminCookie } });
    const prevHtml = await prevAdmin.text();
    check("admin preview renders full template + banner", prevAdmin.status === 200 && prevHtml.includes("DRAFT PREVIEW") && prevHtml.includes("What I Did"));
    check("preview is noindex", /<meta name="robots" content="noindex, nofollow"/.test(prevHtml));
    const prevOut = await fetch(`${SITE}/admin/projects/${projectId}/preview`, { headers: { Cookie: outsiderCookie }, redirect: "manual" });
    check("non-admin denied preview", redirectStatus(prevOut.status), `status ${prevOut.status}`);
    const prevAnon = await fetch(`${SITE}/admin/projects/${projectId}/preview`, { redirect: "manual" });
    check("anonymous denied preview", redirectStatus(prevAnon.status), `status ${prevAnon.status}`);

    const listHtml = await (await fetch(`${SITE}/admin/projects`, { headers: { Cookie: adminCookie } })).text();
    check("projects list shows probe + filters", listHtml.includes("CMS Probe Project") && listHtml.includes("Drafts"));
    const editHtml = await (await fetch(`${SITE}/admin/projects/${projectId}/edit`, { headers: { Cookie: adminCookie } })).text();
    check("edit form prefills saved values", editHtml.includes("Probe summary") && editHtml.includes("Collect") && editHtml.includes("Q1?"));
    const legacy = await fetch(`${SITE}/admin/new`, { headers: { Cookie: adminCookie }, redirect: "manual" });
    check("legacy /admin/new removed", legacy.status === 404, `status ${legacy.status}`);

    // ---- unpublish --------------------------------------------------------
    const un = await callAction("unpublishProject", [projectId], adminCookie);
    check("unpublish ok", un.ok === true, un.error);
    await sleep(500);
    check("unpublished URL returns 404", (await pub(slug)).status === 404);
    const prevAfter = await fetch(`${SITE}/admin/projects/${projectId}/preview`, { headers: { Cookie: adminCookie } });
    check("admin preview still works after unpublish", prevAfter.status === 200);

    // ---- delete (also removes storage folder) ----------------------------
    const delOut = await callAction("deleteProject", [projectId], outsiderCookie);
    check("non-admin delete rejected", delOut.redirected === true);
    const del = await callAction("deleteProject", [projectId], adminCookie);
    check("owner deletes project", del.ok === true, del.error);
    const after = await svc(`projects?id=eq.${projectId}&select=id`);
    check("project row gone", after.length === 0);
    const folder = await fetch(`${SUPA}/storage/v1/object/list/portfolio-media`, {
      method: "POST",
      headers: svcHeaders,
      body: JSON.stringify({ prefix: `projects/${projectId}`, limit: 100 }),
    });
    const left = await folder.json();
    check("project storage folder cleaned", Array.isArray(left) && left.length === 0, `left=${Array.isArray(left) ? left.length : JSON.stringify(left)}`);
    projectId = null;
  } finally {
    if (projectId) {
      await fetch(`${SUPA}/rest/v1/projects?id=eq.${projectId}`, { method: "DELETE", headers: svcHeaders });
    }
    if (originalOrder) {
      for (let i = 0; i < originalOrder.length; i++) {
        await fetch(`${SUPA}/rest/v1/projects?id=eq.${originalOrder[i]}`, {
          method: "PATCH",
          headers: svcHeaders,
          body: JSON.stringify({ display_order: i }),
        });
      }
    }
    await deleteUser(admin.id);
    await deleteUser(outsider.id);
    console.log("cleanup done");
  }

  console.log(`\n${passed}/${passed + failed} checks passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
