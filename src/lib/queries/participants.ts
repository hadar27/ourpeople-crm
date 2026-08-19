import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type RegistrationStatus = "מאושר" | "ממתין לתשלום" | "ממתין לאישור" | "טיוטה";
export type ParticipantPayment = "שולם" | "שולם חלקית" | "לא שולם" | "לא נדרש תשלום";
export type RegistrationSource = "טופס דיגיטלי" | "QR" | "אתר" | "צוות פנימי" | "ייבוא Excel" | "API";

export type ParticipantRecord = {
  id: string;
  name: string;
  idNumber: string;
  phone: string;
  projectId: string;
  project: string;
  projectType: "חינמית" | "בתשלום";
  projectPrice: number;
  status: RegistrationStatus;
  paymentStatus: ParticipantPayment;
  source: RegistrationSource;
  registrationDate: string;
  documentsComplete: boolean;
  isNewImmigrant?: boolean;
  immigrationYear?: number;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
};

type ParticipantRow = {
  id: string;
  name: string;
  id_number: string;
  phone: string;
  project_id: string;
  status: string;
  payment_status: string;
  source: string;
  registration_date: string;
  documents_complete: boolean;
  is_new_immigrant: boolean;
  immigration_year: number | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  projects: { id: string; name: string; type: string; price: number } | null;
};

function toParticipantRecord(row: ParticipantRow): ParticipantRecord {
  return {
    id: row.id,
    name: row.name,
    idNumber: row.id_number,
    phone: row.phone,
    projectId: row.project_id,
    project: row.projects?.name ?? "",
    projectType: (row.projects?.type ?? "חינמית") as ParticipantRecord["projectType"],
    projectPrice: row.projects?.price ?? 0,
    status: row.status as RegistrationStatus,
    paymentStatus: row.payment_status as ParticipantPayment,
    source: row.source as RegistrationSource,
    registrationDate: row.registration_date,
    documentsComplete: row.documents_complete,
    isNewImmigrant: row.is_new_immigrant ?? undefined,
    immigrationYear: row.immigration_year ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function toRow(patch: Partial<ParticipantRecord>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.idNumber !== undefined) row.id_number = patch.idNumber;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.projectId !== undefined) row.project_id = patch.projectId;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus;
  if (patch.source !== undefined) row.source = patch.source;
  if (patch.registrationDate !== undefined) row.registration_date = patch.registrationDate;
  if (patch.documentsComplete !== undefined) row.documents_complete = patch.documentsComplete;
  if (patch.isNewImmigrant !== undefined) row.is_new_immigrant = patch.isNewImmigrant;
  if (patch.immigrationYear !== undefined) row.immigration_year = patch.immigrationYear ?? null;
  if (patch.email !== undefined) row.email = patch.email ?? null;
  if (patch.address !== undefined) row.address = patch.address ?? null;
  if (patch.city !== undefined) row.city = patch.city ?? null;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  return row;
}

const SELECT = "*, projects(id, name, type, price)";

export const participantKeys = {
  all: ["participants"] as const,
  list: () => [...participantKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...participantKeys.all, "detail", id] as const,
};

export function useParticipants() {
  return useQuery({
    queryKey: participantKeys.list(),
    queryFn: async () => {
      const { data, error } = await supabase.from("participants").select(SELECT).order("name");
      if (error) throw error;
      return (data as unknown as ParticipantRow[]).map(toParticipantRecord);
    },
  });
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: participantKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("participants").select(SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? toParticipantRecord(data as unknown as ParticipantRow) : null;
    },
    enabled: !!id,
  });
}

export function useCreateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ParticipantRecord>) => {
      const { data, error } = await supabase
        .from("participants")
        .insert(toRow(values))
        .select(SELECT)
        .single();
      if (error) throw error;
      return toParticipantRecord(data as unknown as ParticipantRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantKeys.list() });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ParticipantRecord> }) => {
      const { data, error } = await supabase
        .from("participants")
        .update(toRow(patch))
        .eq("id", id)
        .select(SELECT)
        .single();
      if (error) throw error;
      return toParticipantRecord(data as unknown as ParticipantRow);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: participantKeys.list() });
      queryClient.invalidateQueries({ queryKey: participantKeys.detail(variables.id) });
    },
  });
}
