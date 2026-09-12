import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function deleteAccountValuationRow(
  supabase: SupabaseClient<Database>,
  accountId: string,
  valuationId: string,
) {
  const { data, error } = await supabase
    .from("account_valuations")
    .delete()
    .eq("id", valuationId)
    .eq("financial_account_id", accountId)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Impossible de supprimer la valorisation.");
  }
}
