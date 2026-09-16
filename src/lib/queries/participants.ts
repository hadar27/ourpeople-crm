import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type RegistrationStatus = "מאושר" | "ממתין לתשלום" | "ממתין לאישור" | "טיוטה";
export type ParticipantPayment = "שולם" | "שולם חלקית" | "לא שולם" | "לא נדרש תשלום";
export type RegistrationSource =
  "טופס דיגיטלי" | "QR" | "אתר" | "צוות פנימי" | "ייבוא Excel" | "API";

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
  dateOfBirth?: string;
  sex?: "זכר" | "נקבה";
  parentName?: string;
  parentPhone?: string;
  foodAllergies?: string;
};

export type ParticipantProjectRecord = {
  id: string;
  name: string;
  status: "פעיל" | "בתכנון" | "הסתיים";
  startDate?: string;
  endDate?: string;
  joinedDate?: string;
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
  date_of_birth: string | null;
  sex: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  food_allergies: string | null;
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
    dateOfBirth: row.date_of_birth ?? undefined,
    sex: (row.sex as ParticipantRecord["sex"]) ?? undefined,
    parentName: row.parent_name ?? undefined,
    parentPhone: row.parent_phone ?? undefined,
    foodAllergies: row.food_allergies ?? undefined,
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
  if (patch.dateOfBirth !== undefined) row.date_of_birth = patch.dateOfBirth ?? null;
  if (patch.sex !== undefined) row.sex = patch.sex ?? null;
  if (patch.parentName !== undefined) row.parent_name = patch.parentName ?? null;
  if (patch.parentPhone !== undefined) row.parent_phone = patch.parentPhone ?? null;
  if (patch.foodAllergies !== undefined) row.food_allergies = patch.foodAllergies ?? null;
  return row;
}

const SELECT = "*, projects(id, name, type, price)";

export const participantKeys = {
  all: ["participants"] as const,
  list: () => [...participantKeys.all, "list"] as const,
  detail: (id: string | undefined) => [...participantKeys.all, "detail", id] as const,
  forProject: (projectId: string | undefined) =>
    [...participantKeys.all, "project", projectId] as const,
  projectsForParticipant: (participantId: string | undefined) =>
    [...participantKeys.all, "participantProjects", participantId] as const,
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

export function useProjectParticipantIds(projectId: string | undefined) {
  return useQuery({
    queryKey: participantKeys.forProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_participants")
        .select("participant_id")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data as { participant_id: string }[]).map((row) => row.participant_id);
    },
    enabled: !!projectId,
  });
}

export function useAssignParticipantToProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      participantId,
    }: {
      projectId: string;
      participantId: string;
    }) => {
      const { error } = await supabase
        .from("project_participants")
        .insert({ project_id: projectId, participant_id: participantId });
      if (error) throw error;
    },
    onSuccess: (_data, values) => {
      queryClient.invalidateQueries({ queryKey: participantKeys.forProject(values.projectId) });
      queryClient.invalidateQueries({ queryKey: participantKeys.list() });
    },
  });
}

export function useProjectsForParticipant(participantId: string | undefined) {
  return useQuery({
    queryKey: participantKeys.projectsForParticipant(participantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_participants")
        .select("joined_date, projects(id, name, status, start_date, end_date)")
        .eq("participant_id", participantId);
      if (error) throw error;
      return (
        data as unknown as {
          joined_date: string;
          projects: {
            id: string;
            name: string;
            status: ParticipantProjectRecord["status"];
            start_date: string | null;
            end_date: string | null;
          } | null;
        }[]
      )
        .filter((row) => row.projects)
        .map((row) => ({
          id: row.projects!.id,
          name: row.projects!.name,
          status: row.projects!.status,
          startDate: row.projects!.start_date ?? undefined,
          endDate: row.projects!.end_date ?? undefined,
          joinedDate: row.joined_date,
        }));
    },
    enabled: !!participantId,
  });
}

export function useParticipant(id: string | undefined) {
  return useQuery({
    queryKey: participantKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participants")
        .select(SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? toParticipantRecord(data as unknown as ParticipantRow) : null;
    },
    enabled: !!id,
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("participants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: participantKeys.list() });
      queryClient.invalidateQueries({ queryKey: participantKeys.detail(id) });
    },
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
