import { PrivateShell } from "@/components/layout/private-shell";
import { DeleteUserButton } from "@/domains/administration/components/delete-user-button";
import { getPlatformUsers } from "@/domains/administration/services/administration-service";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await getPlatformUsers();
  return <PrivateShell current="administration-users">
    <header><p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Administration</p><h1>Utilisateurs</h1></header>
    <div className="mt-5 overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-[#64748B]"><tr><th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Inscription</th><th className="p-3">Dossiers possédés</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{users.map((user) => { const name = `${user.firstName} ${user.lastName}`.trim(); return <tr className="border-t border-[#E2E8F0]" key={user.id}><td className="p-3 font-semibold">{name}</td><td className="p-3">{user.email}</td><td className="p-3">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td><td className="p-3">{user.ownedDossiers}</td><td className="p-3 text-right">{user.canDelete ? <DeleteUserButton userId={user.id} name={name} email={user.email} /> : <span className="text-xs text-[#94A3B8]">Non supprimable</span>}</td></tr>; })}</tbody></table></div>
    <p className="mt-3 text-xs text-[#64748B]">La suppression reste bloquée tant qu’un utilisateur possède un dossier, un accès ou toute autre relation métier conservée.</p>
  </PrivateShell>;
}
