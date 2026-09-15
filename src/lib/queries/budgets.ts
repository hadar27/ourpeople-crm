import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { projectKeys } from "@/lib/queries/projects";

export type BudgetRequestRecord = {
  id: string;
  projectId: string;
  projectName: string;
  requestedAmount: number;
  reason: string;
  status: "ממתינה" | "אושרה" | "אושרה חלקית" | "נדחתה";
  approvedAmount: number;
  requestedBy: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
};

export type BudgetTransactionRecord = {
  id: string;
  projectId: string;
  projectName: string;
  type: "הקצאה ראשונית" | "תוספת תקציב" | "הוצאה" | "החזרת יתרה";
  amount: number;
  date: string;
  performedBy: string;
  reference?: string;
};

type RequestRow = {
  id: string;
  project_id: string;
  requested_amount: number;
  reason: string;
  status: BudgetRequestRecord["status"];
  approved_amount: number;
  requested_by: string;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
  projects: { name: string } | null;
};

type TransactionRow = {
  id: string;
  project_id: string;
  transaction_type: BudgetTransactionRecord["type"];
  amount: number;
  transaction_date: string;
  performed_by: string;
  reference: string | null;
  projects: { name: string } | null;
};

const budgetKeys = {
  all: ["budgets"] as const,
  requests: () => ["budgets", "requests"] as const,
  transactions: () => ["budgets", "transactions"] as const,
};

export function useBudgetRequests() {
  return useQuery({
    queryKey: budgetKeys.requests(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_requests")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as RequestRow[]).map((row) => ({
        id: row.id,
        projectId: row.project_id,
        projectName: row.projects?.name ?? row.project_id,
        requestedAmount: row.requested_amount,
        reason: row.reason,
        status: row.status,
        approvedAmount: row.approved_amount,
        requestedBy: row.requested_by,
        reviewedBy: row.reviewed_by ?? undefined,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at ?? undefined,
      }));
    },
  });
}

export function useBudgetTransactions() {
  return useQuery({
    queryKey: budgetKeys.transactions(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_transactions")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as TransactionRow[]).map((row) => ({
        id: row.id,
        projectId: row.project_id,
        projectName: row.projects?.name ?? row.project_id,
        type: row.transaction_type,
        amount: row.amount,
        date: row.transaction_date,
        performedBy: row.performed_by,
        reference: row.reference ?? undefined,
      }));
    },
  });
}

export function useCreateBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: {
      projectId: string;
      amount: number;
      reason: string;
      requestedBy: string;
    }) => {
      const { error } = await supabase.from("budget_requests").insert({
        project_id: values.projectId,
        requested_amount: values.amount,
        reason: values.reason,
        requested_by: values.requestedBy,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: budgetKeys.requests() }),
  });
}

export function useReviewBudgetRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { requestId: string; approvedAmount: number; reviewer: string }) => {
      const { error } = await supabase.rpc("review_budget_request", {
        request_id: values.requestId,
        approved_value: values.approvedAmount,
        reviewer_name: values.reviewer,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useReleaseProjectBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: { projectId: string; performer: string }) => {
      const { data, error } = await supabase.rpc("release_project_budget", {
        project_value: values.projectId,
        performer_name: values.performer,
      });
      if (error) throw error;
      return Number(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
