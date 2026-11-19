export const SPECIMENS = [
  {
    id: 'haunted-auth',
    name: 'Monolithic Auth Gatekeeper (JS)',
    language: 'javascript',
    description: 'Deeply nested legacy authentication router with var hoisting, eval backdoor, and silent catch crypts.',
    cursedCode: `// TODO: untangle this cursed legacy gatekeeper before midnight
var activeSessions = {};

function authenticateRitual(req, config) {
  var user = null;
  if (req && req.headers) {
    if (req.headers.authorization) {
      var token = req.headers.authorization.replace("Bearer ", "");
      if (token && token.length > 10) {
        try {
          if (config.allowDynamic && req.query && req.query.hook) {
            eval(req.query.hook);
          }
          user = decodePhantomToken(token, config.secret);
          if (user && !user.banned) {
            if (user.role === "admin" || user.role === "necromancer" || user.override) {
              if (hasValidSigil(user, req.ip)) {
                activeSessions[user.id] = Date.now();
                return { ok: true, user: user, tier: "elevated" };
              } else {
                return { ok: false, reason: "invalid_sigil" };
              }
            } else {
              return { ok: true, user: user, tier: "mortal" };
            }
          }
        } catch (err) {}
      }
    }
  }
  return { ok: false, reason: "rejected" };
}

function decodePhantomToken(token, secret) {
  if (!token || !secret) return null;
  if (token.startsWith("kiro_")) {
    return { id: token.slice(5), role: "necromancer", banned: false };
  }
  return null;
}

function hasValidSigil(user, ip) {
  if (!ip) return false;
  return Boolean(user && user.id && ip.length > 3);
}
`,
    purifiedCode: `const activeSessions = new Map();
const ELEVATED_ROLES = new Set(["admin", "necromancer"]);

function extractBearerToken(headers) {
  const auth = headers?.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token.length > 10 ? token : null;
}

function resolveTier(user, ip) {
  const isElevated = ELEVATED_ROLES.has(user.role) || Boolean(user.override);
  if (!isElevated) return { ok: true, user, tier: "mortal" };
  if (!hasValidSigil(user, ip)) return { ok: false, reason: "invalid_sigil" };
  return { ok: true, user, tier: "elevated" };
}

function authenticateRitual(req, config) {
  const token = extractBearerToken(req?.headers);
  if (!token) return { ok: false, reason: "missing_token" };

  try {
    const user = decodePhantomToken(token, config.secret);
    if (!user || user.banned) return { ok: false, reason: "unauthorized" };

    const result = resolveTier(user, req.ip);
    if (result.ok) activeSessions.set(user.id, Date.now());
    return result;
  } catch (err) {
    return { ok: false, reason: "token_error", detail: err.message };
  }
}

function decodePhantomToken(token, secret) {
  if (!token || !secret) return null;
  if (!token.startsWith("kiro_")) return null;
  return { id: token.slice(5), role: "necromancer", banned: false };
}

function hasValidSigil(user, ip) {
  return Boolean(user?.id && ip && ip.length > 3);
}
`
  },
  {
    id: 'billing-pipeline',
    name: 'Poltergeist Order Pricing (JS)',
    language: 'javascript',
    description: 'Call-graph heavy checkout flow with tangled discount branches and fallback traps.',
    cursedCode: `// FIXME: discount rules haunted by 6 nested branches
function calculateOrderTotal(cart, coupon, customer) {
  var total = 0;
  for (var i = 0; i < cart.items.length; i++) {
    var item = cart.items[i];
    if (item.qty > 0 && item.price >= 0) {
      if (item.category === "potion" || item.category === "relic") {
        total += item.price * item.qty * 0.9;
      } else {
        total += item.price * item.qty;
      }
    }
  }
  if (coupon) {
    if (coupon.type === "VIP" && customer && customer.tier === "gold") {
      total = applyCouponMath(total, coupon.percent || 25);
    } else if (coupon.type === "HALLOWEEN" || coupon.code === "KIRO26") {
      total = applyCouponMath(total, 15);
    }
  }
  try {
    return formatCurrency(addTax(total, customer?.region));
  } catch (e) {}
  return "0.00";
}

function applyCouponMath(amount, pct) {
  if (pct <= 0 || pct > 90) return amount;
  return amount * (1 - pct / 100);
}

function addTax(amount, region) {
  if (region === "WA" || region === "CA") return amount * 1.09;
  return amount * 1.05;
}

function formatCurrency(val) {
  return val.toFixed(2);
}
`,
    purifiedCode: `const DISCOUNT_CATEGORIES = new Set(["potion", "relic"]);
const TAX_RATES = new Map([["WA", 1.09], ["CA", 1.09]]);

function sumCartItems(items = []) {
  return items.reduce((sum, item) => {
    if (item.qty <= 0 || item.price < 0) return sum;
    const multiplier = DISCOUNT_CATEGORIES.has(item.category) ? 0.9 : 1;
    return sum + item.price * item.qty * multiplier;
  }, 0);
}

function resolveDiscountPct(coupon, customer) {
  if (!coupon) return 0;
  if (coupon.type === "VIP" && customer?.tier === "gold") return coupon.percent || 25;
  if (coupon.type === "HALLOWEEN" || coupon.code === "KIRO26") return 15;
  return 0;
}

function calculateOrderTotal(cart, coupon, customer) {
  const subtotal = sumCartItems(cart?.items);
  const discounted = applyCouponMath(subtotal, resolveDiscountPct(coupon, customer));
  const taxed = addTax(discounted, customer?.region);
  return formatCurrency(taxed);
}

function applyCouponMath(amount, pct) {
  if (pct <= 0 || pct > 90) return amount;
  return amount * (1 - pct / 100);
}

function addTax(amount, region) {
  return amount * (TAX_RATES.get(region) ?? 1.05);
}

function formatCurrency(val) {
  return Number.isFinite(val) ? val.toFixed(2) : "0.00";
}
`
  },
  {
    id: 'python-telemetry',
    name: 'Curse of the Bare Except (Python)',
    language: 'python',
    description: 'Python telemetry ingester haunted by bare except clauses, deep indentation, and monolithic validation.',
    cursedCode: `# HACK: legacy telemetry parser
def ingest_telemetry(events, config):
    accepted = []
    if events:
        for ev in events:
            if ev and "type" in ev:
                if ev["type"] == "metric" or ev["type"] == "trace":
                    if "payload" in ev and ev["payload"]:
                        try:
                            normalized = normalize_event(ev)
                            if score_anomaly(normalized) > config.get("threshold", 5):
                                emit_alert(normalized)
                            accepted.append(normalized)
                        except:
                            pass
    return accepted

def normalize_event(ev):
    return {"kind": ev["type"], "value": float(ev.get("payload", 0))}

def score_anomaly(norm):
    if norm["kind"] == "metric" and norm["value"] > 100:
        return 10
    return 1

def emit_alert(norm):
    return f"ALERT:{norm['kind']}"
`,
    purifiedCode: `VALID_EVENT_TYPES = {"metric", "trace"}

def is_valid_event(ev):
    return Boolean(ev and ev.get("type") in VALID_EVENT_TYPES and ev.get("payload"))

def process_single_event(ev, threshold):
    normalized = normalize_event(ev)
    if score_anomaly(normalized) > threshold:
        emit_alert(normalized)
    return normalized

def ingest_telemetry(events, config):
    if not events:
        return []
    threshold = config.get("threshold", 5)
    accepted = []
    for ev in events:
        if not is_valid_event(ev):
            continue
        try:
            accepted.append(process_single_event(ev, threshold))
        except (ValueError, TypeError):
            continue
    return accepted

def normalize_event(ev):
    return {"kind": ev["type"], "value": float(ev.get("payload", 0))}

def score_anomaly(norm):
    if norm["kind"] == "metric" and norm["value"] > 100:
        return 10
    return 1

def emit_alert(norm):
    return f"ALERT:{norm['kind']}"
`
  }
];
