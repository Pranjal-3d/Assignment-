"""
Veridian Corp — IT Support Agent (ARIA)
Flask Backend — Assignment 2
"""

import os
import json
import time
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS

# Load knowledge base data
from knowledge_base import (
    KNOWLEDGE_BASE,
    EMPLOYEE_REQUESTS,
    TICKET_QUEUE,
    build_system_prompt,
    format_kb_for_context,
)

# ── Load .env File ─────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

# ── Gemini Setup ──────────────────────────────────────────────────────────────
try:
    import google.generativeai as genai

    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        # Try gemini-2.5-flash first, then gemini-1.5-flash
        model_name = "gemini-2.5-flash"
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=build_system_prompt(),
            )
        except Exception:
            model_name = "gemini-1.5-flash"
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=build_system_prompt(),
            )
        GEMINI_AVAILABLE = True
        print(f"✅  Gemini ({model_name}) connected.")
    else:
        GEMINI_AVAILABLE = False
        print("⚠️   No GEMINI_API_KEY found — running in demo/fallback mode.")
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️   google-generativeai not installed — running in demo/fallback mode.")

# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

# In-memory chat sessions: {session_id: [{"role": ..., "parts": [...]}]}
chat_sessions: dict[str, list] = {}


# ── Fallback responses (no API key) ──────────────────────────────────────────
FALLBACK_RESPONSES = {
    "password": (
        "**Assessment**: This appears to be an account lockout issue.\n\n"
        "**Action**: Since the account was locked after multiple failed attempts, IT needs to unlock it manually.\n\n"
        "**Next Steps**: No approval required — IT will unlock immediately. Use the self-service portal for future resets.\n\n"
        "**KB Reference**: KB-01 (Password Reset)"
    ),
    "vpn": (
        "**Assessment**: VPN credentials expire every 90 days.\n\n"
        "**Action**: You need to renew your VPN credentials. Full-time employees can do this directly.\n\n"
        "**Next Steps**: Renew via the VPN portal. If you're a contractor, manager approval via the access request form is needed.\n\n"
        "**KB Reference**: KB-02 (VPN Access)"
    ),
    "laptop": (
        "**Assessment**: Laptop replacement eligibility check needed.\n\n"
        "**Action**: A dead laptop qualifies as hardware failure, making it eligible for early replacement regardless of age. For a 3.5-year-old device (over the 3-year threshold), replacement is clearly eligible.\n\n"
        "**Next Steps**: Raise a replacement request. Note: The Asset Policy sets a 4-year refresh cycle, so Finance sign-off may also be needed. Requests must be raised 2 weeks in advance.\n\n"
        "**KB Reference**: KB-03 (Laptop Replacement), Asset Management Policy"
    ),
    "printer": (
        "**Assessment**: Persistent paper jam error despite no physical jam detected.\n\n"
        "**Action**: 1) Check the printer queue for stuck jobs. 2) Restart the print spooler service. 3) If issue persists, log a ticket with the printer's asset tag.\n\n"
        "**Next Steps**: A technician has been assigned per current status. Provide the printer's asset tag for tracking.\n\n"
        "**KB Reference**: KB-05 (Printer Troubleshooting)"
    ),
    "phishing": (
        "⚠️ **URGENT — SECURITY ALERT**\n\n"
        "**Assessment**: CRITICAL — Do NOT forward the email. Forwarding a phishing email to teammates spreads the risk.\n\n"
        "**Action**: IMMEDIATELY report to security@veridian-corp.example. Do not click any links, do not forward the email.\n\n"
        "**Next Steps**: Security team will investigate. This has been auto-escalated.\n\n"
        "**KB Reference**: KB-09 (Security Incident Reporting)"
    ),
    "wifi": (
        "**Assessment**: Guest Wi-Fi request — self-service available.\n\n"
        "**Action**: No IT ticket needed! Any employee can generate 24-hour guest Wi-Fi credentials from the front-desk kiosk.\n\n"
        "**Next Steps**: Visit the front-desk kiosk to generate credentials before your guest arrives.\n\n"
        "**KB Reference**: KB-07 (Guest Wi-Fi Access)"
    ),
    "mailbox": (
        "**Assessment**: Mailbox full — cannot send emails.\n\n"
        "**Action**: Archive old emails immediately to free up space. Default quota is 25GB.\n\n"
        "**Next Steps**: If archiving isn't sufficient, a quota increase up to 50GB can be requested with manager approval.\n\n"
        "**KB Reference**: KB-06 (Email Mailbox Quota)"
    ),
    "software": (
        "**Assessment**: Non-catalog software installation request.\n\n"
        "**Action**: Non-catalog software requires an IT Security review before installation.\n\n"
        "**Next Steps**: Submit a Security review request. This typically takes 3–5 business days. Standard catalog software can be self-installed immediately.\n\n"
        "**KB Reference**: KB-04 (Software Installation Requests)"
    ),
    "monitor": (
        "**Assessment**: Work-from-home equipment allowance request.\n\n"
        "**Action**: Employees working remotely more than 3 days/week are eligible for a one-time home office equipment allowance (monitor, chair).\n\n"
        "**Next Steps**: Get manager sign-off first, then Finance processes the allowance. IT handles shipping once both approvals are complete.\n\n"
        "**KB Reference**: KB-10 (Work-From-Home Equipment)"
    ),
    "expense": (
        "**Assessment**: Expense tool access issue.\n\n"
        "**Action**: Access to the expense management tool is granted by Finance, not IT.\n\n"
        "**Next Steps**: Contact Finance to verify your account exists. Once confirmed, IT can assist with any technical login issues.\n\n"
        "**KB Reference**: KB-08 (Expense Software Access)"
    ),
    "admin": (
        "**Assessment**: Admin access request to finance reporting server.\n\n"
        "**Action**: Admin access requests require a formal business justification. Based on precedent (TK-1050), requests without proper justification are rejected.\n\n"
        "**Next Steps**: Please submit a formal access request with a detailed business justification through the proper channel. This will require IT and Security review.\n\n"
        "**KB Reference**: Security escalation required — no KB covers ad-hoc admin access grants."
    ),
    "default": (
        "**Assessment**: I've received your request.\n\n"
        "**Action**: I need a bit more information to assist you properly.\n\n"
        "**Next Steps**: Could you please describe the issue in more detail? What system/device is affected, what error messages are you seeing, and when did this start?\n\n"
        "**KB Reference**: Please provide details so I can reference the appropriate policy."
    ),
}


def get_fallback_response(message: str) -> str:
    """Simple keyword-based fallback when no API key."""
    msg_lower = message.lower()
    if any(w in msg_lower for w in ["phishing", "malware", "suspicious", "hack", "scam"]):
        return FALLBACK_RESPONSES["phishing"]
    if any(w in msg_lower for w in ["password", "locked", "lock out", "account"]):
        return FALLBACK_RESPONSES["password"]
    if any(w in msg_lower for w in ["vpn", "credential", "expired"]):
        return FALLBACK_RESPONSES["vpn"]
    if any(w in msg_lower for w in ["laptop", "computer", "dead", "won't turn", "broken"]):
        return FALLBACK_RESPONSES["laptop"]
    if any(w in msg_lower for w in ["printer", "paper jam", "print"]):
        return FALLBACK_RESPONSES["printer"]
    if any(w in msg_lower for w in ["wifi", "wi-fi", "wireless", "guest"]):
        return FALLBACK_RESPONSES["wifi"]
    if any(w in msg_lower for w in ["mailbox", "email", "quota", "full", "inbox"]):
        return FALLBACK_RESPONSES["mailbox"]
    if any(w in msg_lower for w in ["software", "install", "application", "app", "extension"]):
        return FALLBACK_RESPONSES["software"]
    if any(w in msg_lower for w in ["monitor", "home", "wfh", "remote", "work from home"]):
        return FALLBACK_RESPONSES["monitor"]
    if any(w in msg_lower for w in ["expense", "finance tool", "reimbursement"]):
        return FALLBACK_RESPONSES["expense"]
    if any(w in msg_lower for w in ["admin", "administrator", "server access", "root"]):
        return FALLBACK_RESPONSES["admin"]
    return FALLBACK_RESPONSES["default"]


# ── API Routes ────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return jsonify({
        "status": "ok",
        "service": "ARIA — Veridian Corp IT Support Agent API",
        "gemini_connected": GEMINI_AVAILABLE,
        "frontend": "http://localhost:3001"
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "gemini": GEMINI_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "1.0.0",
        "agent": "ARIA — Veridian Corp IT Support"
    })


@app.route("/api/requests", methods=["GET"])
def get_requests():
    """Return all employee requests."""
    return jsonify(EMPLOYEE_REQUESTS)


@app.route("/api/tickets", methods=["GET"])
def get_tickets():
    """Return ticket queue (active + closed)."""
    return jsonify(TICKET_QUEUE)


@app.route("/api/tickets/<ticket_id>/update", methods=["POST"])
def update_ticket(ticket_id):
    """Update ticket status and closed flag."""
    data = request.get_json(force=True)
    status = data.get("status", "Resolved")
    closed = data.get("closed", True)
    for t in TICKET_QUEUE:
        if t["id"] == ticket_id:
            t["status"] = status
            t["closed"] = closed
            return jsonify({"status": "updated", "ticket": t})
    return jsonify({"error": "Ticket not found"}), 404


@app.route("/api/requests/<req_id>/update", methods=["POST"])
def update_request(req_id):
    """Update request status."""
    data = request.get_json(force=True)
    status = data.get("status", "Resolved")
    for r in EMPLOYEE_REQUESTS:
        if r["id"] == req_id:
            r["status"] = status
            return jsonify({"status": "updated", "request": r})
    return jsonify({"error": "Request not found"}), 404


@app.route("/api/kb", methods=["GET"])
def get_kb():
    """Return all knowledge base articles."""
    return jsonify([
        {"id": kid, "title": v["title"], "content": v["content"]}
        for kid, v in KNOWLEDGE_BASE.items()
    ])


@app.route("/api/stats", methods=["GET"])
def get_stats():
    """Return dashboard statistics."""
    open_tickets = [t for t in TICKET_QUEUE if not t["closed"]]
    closed_tickets = [t for t in TICKET_QUEUE if t["closed"]]
    critical_requests = [r for r in EMPLOYEE_REQUESTS if r["priority"] == "Critical" and r.get("status") not in ("Resolved", "Rejected")]
    high_requests = [r for r in EMPLOYEE_REQUESTS if r["priority"] == "High" and r.get("status") not in ("Resolved", "Rejected")]

    return jsonify({
        "total_requests": len(EMPLOYEE_REQUESTS),
        "open_tickets": len(open_tickets),
        "closed_tickets": len(closed_tickets),
        "critical_count": len(critical_requests),
        "high_priority": len(high_requests),
        "categories": _count_by_field(EMPLOYEE_REQUESTS, "category"),
        "statuses": _count_by_field(EMPLOYEE_REQUESTS, "status"),
        "priorities": _count_by_field(EMPLOYEE_REQUESTS, "priority"),
    })


@app.route("/api/meta", methods=["GET"])
def get_meta():
    """Return app-wide metadata: company info, week label, and critical alerts.
    All values come from the data layer — nothing is hardcoded in the frontend."""
    # Derive dates dynamically from the request data
    dates = [r["date"] for r in EMPLOYEE_REQUESTS]
    first_date = dates[0] if dates else "Mon 21 Sep"
    last_date = dates[-1] if dates else "Fri 25 Sep"

    # Extract year from hardcoded config (the data pack is scoped to Sep 2026)
    week_year = "2026"
    week_label = f"Week {first_date} – {last_date} {week_year}"

    # Critical alerts: active/unresolved Critical-priority requests
    critical_alerts = [
        {
            "id": r["id"],
            "employee": r["employee"],
            "email": r["email"],
            "request": r["request"],
            "status": r["status"],
            "category": r["category"],
        }
        for r in EMPLOYEE_REQUESTS 
        if r["priority"] == "Critical" and r.get("status") not in ("Resolved", "Rejected")
    ]

    # Security-category escalations from ticket queue
    security_tickets = [
        {
            "id": t["id"],
            "employee": t["employee"],
            "issue": t["issue"],
            "status": t["status"],
        }
        for t in TICKET_QUEUE if t["category"] == "Security" and not t["closed"]
    ]

    return jsonify({
        "company": "Veridian Corp",
        "agent_name": "ARIA",
        "agent_full_name": "Automated Resolution & IT Assistant",
        "week_label": week_label,
        "week_short": f"{first_date} – {last_date} {week_year}",
        "first_date": first_date,
        "last_date": last_date,
        "critical_alerts": critical_alerts,
        "security_tickets": security_tickets,
    })


def _count_by_field(items, field):
    counts = {}
    for item in items:
        val = item.get(field, "Unknown")
        counts[val] = counts.get(val, 0) + 1
    return counts


@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint — handles multi-turn conversations."""
    data = request.get_json(force=True)
    message = data.get("message", "").strip()
    session_id = data.get("session_id", "default")
    request_context = data.get("request_context")  # optional REQ-XX context

    if not message:
        return jsonify({"error": "Empty message"}), 400

    # Build full user message with optional request context
    if request_context:
        context_req = next(
            (r for r in EMPLOYEE_REQUESTS if r["id"] == request_context), None
        )
        if context_req:
            full_message = (
                f"[Context — Employee Request {context_req['id']}]\n"
                f"Employee: {context_req['employee']} ({context_req['email']})\n"
                f"Submitted: {context_req['date']}\n"
                f"Request: {context_req['request']}\n"
                f"Current Status: {context_req['status']}\n\n"
                f"Agent question: {message}"
            )
        else:
            full_message = message
    else:
        full_message = message

    start_time = time.time()

    if GEMINI_AVAILABLE:
        try:
            # Maintain chat history per session
            if session_id not in chat_sessions:
                chat_sessions[session_id] = []

            chat_sessions[session_id].append(
                {"role": "user", "parts": [full_message]}
            )

            # Use start_chat with history for multi-turn
            chat = model.start_chat(history=chat_sessions[session_id][:-1])
            response = chat.send_message(full_message)
            reply = response.text

            chat_sessions[session_id].append(
                {"role": "model", "parts": [reply]}
            )

        except Exception as e:
            print(f"Gemini error: {e}")
            reply = get_fallback_response(message)
    else:
        # Simulate slight delay for realism
        time.sleep(0.3)
        reply = get_fallback_response(full_message)

    elapsed = round((time.time() - start_time) * 1000)

    return jsonify({
        "reply": reply,
        "session_id": session_id,
        "gemini_powered": GEMINI_AVAILABLE,
        "response_time_ms": elapsed,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


@app.route("/api/chat/analyze/<req_id>", methods=["POST"])
def analyze_request(req_id: str):
    """Auto-analyze a specific employee request."""
    req = next((r for r in EMPLOYEE_REQUESTS if r["id"] == req_id), None)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    analysis_prompt = (
        f"Analyze this IT support request and provide a complete resolution:\n\n"
        f"Employee: {req['employee']} ({req['email']})\n"
        f"Date: {req['date']}\n"
        f"Request: {req['request']}\n"
        f"Current Status: {req['status']}\n\n"
        f"Provide your assessment, recommended action, next steps, and KB references."
    )

    if GEMINI_AVAILABLE:
        try:
            chat = model.start_chat()
            response = chat.send_message(analysis_prompt)
            reply = response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            reply = get_fallback_response(req["request"])
    else:
        reply = get_fallback_response(req["request"])

    return jsonify({
        "req_id": req_id,
        "employee": req["employee"],
        "analysis": reply,
        "gemini_powered": GEMINI_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    })


@app.route("/api/chat/reset", methods=["POST"])
def reset_chat():
    """Reset chat session."""
    data = request.get_json(force=True)
    session_id = data.get("session_id", "default")
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    return jsonify({"status": "reset", "session_id": session_id})


# ── Run ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"""
╔══════════════════════════════════════════════════════════╗
║         ARIA — Veridian Corp IT Support Agent           ║
║         Assignment 2 — AIONOS Reviewer Demo             ║
╚══════════════════════════════════════════════════════════╝
  → Open: http://localhost:{port}
  → Gemini: {'✅  Connected' if GEMINI_AVAILABLE else '⚠️  Demo mode (set GEMINI_API_KEY)'}
  → Week : Mon 21 Sep – Fri 25 Sep 2026
""")
    app.run(host="0.0.0.0", port=port, debug=False)
