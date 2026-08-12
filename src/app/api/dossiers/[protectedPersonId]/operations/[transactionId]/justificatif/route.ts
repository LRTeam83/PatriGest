import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/domains/protected-persons/services/authenticated-user";
import { getProtectedPerson } from "@/domains/protected-persons/services/protected-person-service";
import { getTransaction, getTransactionDocument } from "@/domains/transactions/services/transaction-service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIME_EXTENSIONS = new Map([["application/pdf", "pdf"], ["image/jpeg", "jpg"], ["image/png", "png"]]);
type RouteParams = { params: Promise<{ protectedPersonId: string; transactionId: string }> };

async function getExpenseContext(params: RouteParams["params"]) {
  const { protectedPersonId, transactionId } = await params;
  if (![protectedPersonId, transactionId].every((id) => z.uuid().safeParse(id).success)) return null;
  const [person, transaction] = await Promise.all([getProtectedPerson(protectedPersonId), getTransaction(transactionId)]);
  if (!person || !transaction || transaction.transaction_type !== "expense" || transaction.account.protected_person_id !== protectedPersonId || !transaction.proof_reference) return null;
  return { protectedPersonId, transactionId, person, transaction };
}

export async function GET(request: Request, { params }: RouteParams) {
  const context = await getExpenseContext(params);
  if (!context) return NextResponse.json({ message: "Justificatif introuvable." }, { status: 404 });
  const proof = await getTransactionDocument(context.transactionId);
  if (!proof) return NextResponse.json({ message: "Justificatif introuvable." }, { status: 404 });
  const { supabase } = await getAuthenticatedUser();
  const download = new URL(request.url).searchParams.get("download") === "1";
  const { data, error } = await supabase.storage.from("transaction-proofs").createSignedUrl(proof.storage_path, 60, download ? { download: proof.file_name } : undefined);
  if (error || !data) return NextResponse.json({ message: "Impossible d’ouvrir le justificatif." }, { status: 500 });
  return NextResponse.redirect(data.signedUrl);
}

export async function POST(request: Request, { params }: RouteParams) {
  const context = await getExpenseContext(params);
  if (!context) return NextResponse.json({ message: "Dépense introuvable." }, { status: 404 });
  if (context.person.accessRole === "read_only") return NextResponse.json({ message: "Vous ne pouvez pas modifier ce justificatif." }, { status: 403 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ message: "Sélectionnez un fichier." }, { status: 400 });
  if (!MIME_EXTENSIONS.has(file.type)) return NextResponse.json({ message: "Ce type de fichier n’est pas autorisé. Utilisez un PDF, JPEG ou PNG." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ message: "Le fichier dépasse la taille maximale de 10 Mo." }, { status: 400 });
  const bytes = await file.arrayBuffer();
  const detectedMime = detectMimeType(new Uint8Array(bytes));
  if (!detectedMime || detectedMime !== file.type) return NextResponse.json({ message: "Le contenu du fichier ne correspond pas à un PDF, JPEG ou PNG valide." }, { status: 400 });
  const extension = MIME_EXTENSIONS.get(detectedMime)!;
  const { supabase, userId } = await getAuthenticatedUser();
  const existingProof = await getTransactionDocument(context.transactionId);
  const storagePath = `protected-persons/${context.protectedPersonId}/transactions/${context.transactionId}/proof`;
  const fileName = buildFileName(context.transaction.proof_reference!, context.transaction.label, extension);
  const { error: uploadError } = await supabase.storage.from("transaction-proofs").upload(storagePath, bytes, { contentType: detectedMime, upsert: true });
  if (uploadError) return NextResponse.json({ message: "Impossible d’envoyer le justificatif." }, { status: 500 });
  let documentError;
  if (existingProof) {
    const updatePayload = { file_name: fileName, mime_type: detectedMime, file_size: file.size };
    ({ error: documentError } = await supabase.from("transaction_documents").update(updatePayload).eq("id", existingProof.id));
  } else {
    const insertPayload = { transaction_id: context.transactionId, storage_path: storagePath, file_name: fileName, mime_type: detectedMime, file_size: file.size, created_by: userId };
    ({ error: documentError } = await supabase.from("transaction_documents").insert(insertPayload));
  }
  if (documentError) {
    return NextResponse.json({ message: "Le fichier a été envoyé, mais son enregistrement a échoué." }, { status: 500 });
  }
  return NextResponse.json({ message: "Le justificatif a été enregistré." });
}

function buildFileName(reference: string, label: string, extension: string) {
  const safeLabel = label.normalize("NFKC").replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90) || "Justificatif";
  return `${reference} - ${safeLabel}.${extension}`;
}

function detectMimeType(bytes: Uint8Array) {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-") return "application/pdf";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= png.length && png.every((value, index) => bytes[index] === value)) return "image/png";
  return null;
}
