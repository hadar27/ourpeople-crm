import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { volunteerKeys } from "@/lib/queries/volunteers";
import { participantKeys } from "@/lib/queries/participants";

export type PendingVolunteerRecord = {
  id: string;
  projectId: string;
  name: string;
  availability: string;
  hours: number;
  status: "פעיל" | "בהפסקה" | "ארכיון";
  skills: string[];
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
};

export type PendingParticipantRecord = {
  id: string;
  projectId: string;
  name: string;
  idNumber: string;
  phone: string;
  email?: string;
  status: "מאושר" | "ממתין לתשלום" | "ממתין לאישור" | "טיוטה";
  paymentStatus: "שולם" | "שולם חלקית" | "לא שולם" | "לא נדרש תשלום";
  registrationDate: string;
  documentsComplete: boolean;
  isNewImmigrant: boolean;
  immigrationYear?: number;
  address?: string;
  city?: string;
  source: string;
  notes?: string;
  createdAt: string;
};

type PendingVolunteerRow = {
  id: string;
  project_id: string;
  name: string;
  availability: string;
  hours: number;
  status: string;
  skills: string[];
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

type PendingParticipantRow = {
  id: string;
  project_id: string;
  name: string;
  id_number: string;
  phone: string;
  email: string | null;
  status: string;
  payment_status: string;
  registration_date: string;
  documents_complete: boolean;
  is_new_immigrant: boolean;
  immigration_year: number | null;
  address: string | null;
  city: string | null;
  source: string;
  notes: string | null;
  created_at: string;
};

function toPendingVolunteerRecord(row: PendingVolunteerRow): PendingVolunteerRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    availability: row.availability,
    hours: row.hours,
    status: row.status as PendingVolunteerRecord["status"],
    skills: row.skills ?? [],
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function toPendingParticipantRecord(row: PendingParticipantRow): PendingParticipantRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    idNumber: row.id_number,
    phone: row.phone,
    email: row.email ?? undefined,
    status: row.status as PendingParticipantRecord["status"],
    paymentStatus: row.payment_status as PendingParticipantRecord["paymentStatus"],
    registrationDate: row.registration_date,
    documentsComplete: row.documents_complete,
    isNewImmigrant: row.is_new_immigrant,
    immigrationYear: row.immigration_year ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    source: row.source,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export const pendingRegistrationKeys = {
  all: ["pendingRegistrations"] as const,
  volunteers: () => [...pendingRegistrationKeys.all, "volunteers"] as const,
  volunteersForProject: (projectId: string | undefined) => [
    ...pendingRegistrationKeys.volunteers(),
    projectId,
  ] as const,
  participants: () => [...pendingRegistrationKeys.all, "participants"] as const,
  participantsForProject: (projectId: string | undefined) => [
    ...pendingRegistrationKeys.participants(),
    projectId,
  ] as const,
};

export function usePendingVolunteerRegistrations(projectId: string | undefined) {
  return useQuery({
    queryKey: pendingRegistrationKeys.volunteersForProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_volunteer_registrations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as PendingVolunteerRow[]).map(toPendingVolunteerRecord);
    },
    enabled: !!projectId,
  });
}

export function usePendingParticipantRegistrations(projectId: string | undefined) {
  return useQuery({
    queryKey: pendingRegistrationKeys.participantsForProject(projectId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_participant_registrations")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as PendingParticipantRow[]).map(toPendingParticipantRecord);
    },
    enabled: !!projectId,
  });
}

export function useApprovePendingVolunteer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pendingId,
      projectId,
    }: {
      pendingId: string;
      projectId: string;
    }) => {
      // Fetch the pending registration
      const { data: pendingData, error: fetchError } = await supabase
        .from("pending_volunteer_registrations")
        .select("*")
        .eq("id", pendingId)
        .single();

      if (fetchError) throw fetchError;

      const pending = pendingData as PendingVolunteerRow;

      // Create new volunteer in volunteers table
      const { data: volunteerData, error: createError } = await supabase
        .from("volunteers")
        .insert({
          name: pending.name,
          availability: pending.availability,
          hours: pending.hours,
          status: pending.status,
          skills: pending.skills,
          phone: pending.phone,
          email: pending.email,
          notes: pending.notes,
        })
        .select()
        .single();

      if (createError) throw createError;

      const volunteer = volunteerData as any;

      // Create M2M link in project_volunteers
      const { error: linkError } = await supabase
        .from("project_volunteers")
        .insert({
          project_id: projectId,
          volunteer_id: volunteer.id,
        });

      if (linkError) throw linkError;

      // Delete from pending table
      const { error: deleteError } = await supabase
        .from("pending_volunteer_registrations")
        .delete()
        .eq("id", pendingId);

      if (deleteError) throw deleteError;

      return volunteer;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pendingRegistrationKeys.volunteersForProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: volunteerKeys.list() });
    },
  });
}

export function useApprovePendingParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      pendingId,
      projectId,
    }: {
      pendingId: string;
      projectId: string;
    }) => {
      // Fetch the pending registration
      const { data: pendingData, error: fetchError } = await supabase
        .from("pending_participant_registrations")
        .select("*")
        .eq("id", pendingId)
        .single();

      if (fetchError) throw fetchError;

      const pending = pendingData as PendingParticipantRow;

      // Create new participant in participants table
      const { data: participantData, error: createError } = await supabase
        .from("participants")
        .insert({
          name: pending.name,
          id_number: pending.id_number,
          phone: pending.phone,
          email: pending.email,
          status: pending.status,
          payment_status: pending.payment_status,
          registration_date: pending.registration_date,
          documents_complete: pending.documents_complete,
          is_new_immigrant: pending.is_new_immigrant,
          immigration_year: pending.immigration_year,
          address: pending.address,
          city: pending.city,
          source: pending.source,
          notes: pending.notes,
          project_id: projectId,
        })
        .select()
        .single();

      if (createError) throw createError;

      const participant = participantData as any;

      // Create M2M link in project_participants
      const { error: linkError } = await supabase
        .from("project_participants")
        .insert({
          project_id: projectId,
          participant_id: participant.id,
        });

      if (linkError) throw linkError;

      // Delete from pending table
      const { error: deleteError } = await supabase
        .from("pending_participant_registrations")
        .delete()
        .eq("id", pendingId);

      if (deleteError) throw deleteError;

      return participant;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: pendingRegistrationKeys.participantsForProject(variables.projectId),
      });
      queryClient.invalidateQueries({ queryKey: participantKeys.list() });
    },
  });
}

export function useRejectPendingRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      pendingId,
      projectId,
    }: {
      type: "volunteer" | "participant";
      pendingId: string;
      projectId: string;
    }) => {
      const table =
        type === "volunteer"
          ? "pending_volunteer_registrations"
          : "pending_participant_registrations";

      const { error } = await supabase.from(table).delete().eq("id", pendingId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      if (variables.type === "volunteer") {
        queryClient.invalidateQueries({
          queryKey: pendingRegistrationKeys.volunteersForProject(variables.projectId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: pendingRegistrationKeys.participantsForProject(variables.projectId),
        });
      }
    },
  });
}
