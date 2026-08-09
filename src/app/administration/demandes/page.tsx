import { PrivateShell } from "@/components/layout/private-shell";
import { RegenerateAccountInvitation, RequestReviewActions } from "@/domains/administration/components/request-review-actions";
import { getAccountRequests } from "@/domains/administration/services/administration-service";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const requests = await getAccountRequests();
  return <PrivateShell current="administration-requests">
    <header><p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Administration</p><h1>Demandes d’accès</h1></header>
    <div className="mt-5 space-y-3">{requests.map((request) => {
      const canRegenerate = request.status === "approved" && request.invitation_used_at === null;
      return <article key={request.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0"><p className="font-bold">{request.first_name} {request.last_name}</p><p className="text-sm text-[#64748B]">{request.email} · {new Date(request.created_at).toLocaleDateString("fr-FR")}</p>{request.message && <p className="mt-2 text-sm">{request.message}</p>}{request.status !== "pending" && <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{request.status === "approved" ? "Approved" : "Rejected"}</span>}{request.status === "approved" && !canRegenerate && request.invitation_expires_at && <p className="mt-1 text-[11px] text-[#64748B]">Expiration : {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.invitation_expires_at))}</p>}{request.invitation_used_at && <p className="mt-1 text-[11px] font-semibold text-green-700">Invitation utilisée</p>}</div>
          <div className="shrink-0">{request.status === "pending" ? <RequestReviewActions id={request.id} email={request.email} /> : canRegenerate ? <RegenerateAccountInvitation id={request.id} email={request.email} expiresAt={request.invitation_expires_at} /> : null}</div>
        </div>
      </article>;
    })}</div>
  </PrivateShell>;
}
